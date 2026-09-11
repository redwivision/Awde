// Shared email transport for Awde.
//
// Two free transports, chosen at send time (Resend wins when its key is set):
//   1. RESEND (api.resend.com, direct fetch) — the default. Works without a
//      verified domain ONLY for mail to the account owner (e.g. contact forms
//      coming to the team). For login links to arbitrary users, either verify a
//      domain in the Resend dashboard (RESEND_FROM_ADDRESS on it) or use the
//      Gmail SMTP transport below.
//   2. Gmail SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) — free, deliverable to
//      anyone, ~500 emails/day. Uses an APP PASSWORD (Google Account -> Security
//      -> 2-Step Verification -> App passwords), never the real login password.
//
// Never throws. Returns { ok:false } on persistent failure so callers choose the
// fallback (dev link vs. hard error). Transient failures retry once.

const RESEND_API = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailResult {
  ok: boolean;
  /** Human-readable reason for failure (safe to send to the client — no creds). */
  reason?: string;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY) || smtpConfigured();
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function contactRecipient(): string {
  return process.env.CONTACT_RECIPIENT || 'lewikb13@gmail.com';
}

export function fromAddress(): string {
  if (smtpConfigured() && !process.env.RESEND_API_KEY) {
    return process.env.SMTP_FROM || process.env.SMTP_USER || 'Awde <noreply@localhost>';
  }
  return process.env.RESEND_FROM_ADDRESS || 'Awde <onboarding@resend.dev>';
}

/** Escape untrusted strings for safe HTML embedding. */
export function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br>');
}

async function sendViaResend(msg: MailMessage): Promise<{ ok: boolean; retriable: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY!;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
        html: msg.html
      }),
      signal: controller.signal
    });
    if (res.ok) return { ok: true, retriable: false };
    if (res.status < 500) {
      // 4xx (validation, unauthorized sender, unverified domain) will not fix
      // themselves with a retry — report once, without noise.
      console.error(`[awde:mail] Resend rejected (${res.status}): ${await res.text().catch(() => '')}`);
      const reason =
        res.status === 401 || res.status === 403
          ? 'Email service rejected the request — check that the Resend API key is valid and a domain is verified in the Resend dashboard.'
          : `Email service rejected the request (HTTP ${res.status}).`;
      return { ok: false, retriable: false, reason };
    }
    console.error(`[awde:mail] Resend failed (${res.status}); will retry`);
    return { ok: false, retriable: true, reason: `Email service had a server error (HTTP ${res.status}).` };
  } catch (err) {
    console.error('[awde:mail] Resend network/timeout error; will retry:', err);
    return { ok: false, retriable: true, reason: 'Email service timed out or was unreachable.' };
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaSmtp(msg: MailMessage): Promise<{ ok: boolean; retriable: boolean; reason?: string }> {
  try {
    const [{ createTransport }, dns] = await Promise.all([import('nodemailer'), import('node:dns/promises')]);
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    // Some clouds (e.g. Render) have an IPv6 interface but no IPv6 route, and
    // Gmail advertises IPv6 first — nodemailer can pick a v6 address and die
    // with ENETUNREACH. Resolve IPv4 explicitly and pin the TLS servername to
    // the real hostname so the cert still validates.
    const { address } = await dns.lookup(host, { family: 4 });
    const transporter = createTransport({
      host: address,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      servername: host,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      },
      connectionTimeout: SEND_TIMEOUT_MS,
      greetingTimeout: SEND_TIMEOUT_MS,
      socketTimeout: SEND_TIMEOUT_MS
    });
    await transporter.sendMail({
      from: fromAddress(),
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html || undefined
    });
    return { ok: true, retriable: false };
  } catch (err) {
    console.error('[awde:mail] SMTP error (will retry):', err);
    const code = String((err as any)?.code || (err as any)?.responseCode || '');
    const msgText = String((err as any)?.response || (err as any)?.message || err || '');
    let reason = `Email server (${process.env.SMTP_HOST || 'smtp.gmail.com'}) reported an SMTP error.`;
    if (
      /535|AUTHENTICATIONFAILED|Invalid login|Authentication failed/i.test(`${code} ${msgText}`)
    ) {
      reason =
        'SMTP authentication failed — use a Gmail App Password (https://myaccount.google.com/apppasswords), not your regular password.';
    } else if (/ENETUNREACH|ECONNREFUSED|ETIMEDOUT|greeting|connection/i.test(`${code} ${msgText}`)) {
      reason = `Could not connect to the email server (${process.env.SMTP_HOST || 'smtp.gmail.com'}) — check SMTP_HOST, SMTP_PORT, and network access.`;
    }
    return { ok: false, retriable: true, reason };
  }
}

/**
 * Send one email through the best configured transport. Resend wins when a key
 * exists, otherwise Gmail SMTP — and if the primary transport persistently
 * fails, the other one is tried as a fallback. Never throws; every failure
 * carries a `reason` safe to show users. Done after one retry per transport.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.to)) {
    console.error('[awde:mail] refusing to send: invalid recipient address');
    return { ok: false, reason: 'Invalid recipient address.' };
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  if (!hasResend && !smtpConfigured()) {
    console.warn('[awde:mail] no transport configured (RESEND_API_KEY or SMTP_*)');
    return { ok: false, reason: 'Email is not configured on this server.' };
  }

  const transports: Array<{ name: string; fn: (m: MailMessage) => Promise<{ ok: boolean; retriable: boolean; reason?: string }> }> =
    hasResend
      ? [{ name: 'Resend', fn: sendViaResend }, ...(smtpConfigured() ? [{ name: 'SMTP', fn: sendViaSmtp }] : [])]
      : [{ name: 'SMTP', fn: sendViaSmtp }];

  let lastReason: string | undefined;

  for (const transport of transports) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const result = await transport.fn(msg);
      if (result.ok) return { ok: true };
      if (result.retriable && attempt + 1 < MAX_ATTEMPTS) {
        console.warn(`[awde:mail] retry ${attempt + 1}/${MAX_ATTEMPTS} for ${msg.to} via ${transport.name}`);
        continue;
      }
      // Persistent failure on this transport: remember why, fall through to the
      // next transport, and if none remain, report the last reason.
      lastReason = result.reason || `Email could not be sent (${transport.name} failed).`;
      break;
    }
  }
  return { ok: false, reason: lastReason || 'All email transports failed.' };
}