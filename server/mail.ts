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

async function sendViaResend(msg: MailMessage): Promise<{ ok: boolean; retriable: boolean }> {
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
      return { ok: false, retriable: false };
    }
    console.error(`[awde:mail] Resend failed (${res.status}); will retry`);
    return { ok: false, retriable: true };
  } catch (err) {
    console.error('[awde:mail] Resend network/timeout error; will retry:', err);
    return { ok: false, retriable: true };
  } finally {
    clearTimeout(timer);
  }
}

async function sendViaSmtp(msg: MailMessage): Promise<{ ok: boolean; retriable: boolean }> {
  try {
    const { createTransport } = await import('nodemailer');
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
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
    return { ok: false, retriable: true };
  }
}

/**
 * Send one email through the best configured transport. Resend wins when a key
 * exists, otherwise Gmail SMTP. Never throws; done on { ok:false } after one
 * retry of transient failures.
 */
export async function sendMail(msg: MailMessage): Promise<{ ok: boolean }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.to)) {
    console.error('[awde:mail] refusing to send: invalid recipient address');
    return { ok: false };
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  if (!hasResend && !smtpConfigured()) {
    console.warn('[awde:mail] no transport configured (RESEND_API_KEY or SMTP_*)');
    return { ok: false };
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = hasResend ? await sendViaResend(msg) : await sendViaSmtp(msg);
    if (result.ok) return { ok: true };
    if (!result.retriable) return { ok: false };
    if (attempt + 1 < MAX_ATTEMPTS) {
      console.warn(`[awde:mail] retry ${attempt + 1}/${MAX_ATTEMPTS} for ${msg.to}`);
    }
  }
  return { ok: false };
}