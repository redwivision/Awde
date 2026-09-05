// Email transport for Awde login links (passwordless auth).
//
// Uses the Resend REST API directly via fetch (no SDK dependency). When no
// RESEND_API_KEY is configured — the default for local dev and CI — the caller
// falls back to console-logging the link (dev mode). In production a missing
// or failing transport must fail the login attempt, never leak the link.
//
// IMPORTANT (deliverability): the fallback from address "Awde
// <onboarding@resend.dev>" is a Resend test-only mailbox that can ONLY deliver
// to the account owner's own inbox. To send real login links to any user you
// must verify a domain in the Resend dashboard and set RESEND_FROM_ADDRESS to
// an address on it (e.g. "Awde <hello@awde.yourdomain.com>"). Until then, any
// other recipient causes Resend to reject the call (403) — which the dev
// fallback below turns into a Dev link, and production into a clean 502.

import { MAGIC_TOKEN_TTL_MS } from './auth';

const RESEND_API = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 2;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function fromAddress(): string {
  return process.env.RESEND_FROM_ADDRESS || 'Awde <onboarding@resend.dev>';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape untrusted strings for safe HTML embedding (the recipient address is
// supplied by the user; URLs must never carry a bare `&` into markup).
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LoginEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * The plain-text + HTML message for a one-time login link. Kept pure and
 * exported so tests can assert copy, escaping, and that the expiry matches the
 * real token TTL (MAGIC_TOKEN_TTL_MS).
 */
export function buildLoginLinkEmail(to: string, link: string): LoginEmail {
  const minutes = Math.round(MAGIC_TOKEN_TTL_MS / 60_000);
  const subject = 'Sign in to Awde';

  const text = `Hi there,

A sign-in link for Awde was requested for ${to}.

Open it now to finish signing in:
${link}

This link is safe to use for the next ${minutes} minutes and works once. If you
didn't request it, you can safely ignore this email.

— Awde (English + አማርኛ)`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(2,6,23,0.08)">
          <tr style="background-color:#0f172a">
            <td style="padding:26px 32px">
              <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em">Awde</span>
              <span style="color:#818cf8;font-size:20px;font-weight:300"> · ${minutes} minutes</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 10px;font-size:20px;color:#0f172a">Finish signing in to Awde</h1>
              <p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#334155">
                A sign-in link was requested for <strong style="color:#0f172a">${esc(to)}</strong>. Tap the button to
                pick up where you left off.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px">
                <tr>
                  <td style="border-radius:10px;background-color:#4f46e5">
                    <a href="${esc(link)}" target="_blank" rel="noopener"
                       style="display:inline-block;padding:13px 26px;border-radius:10px;background-color:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Sign in to Awde</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#475569">
                If the button doesn't work, paste this into your browser:<br>
                <span style="word-break:break-all;color:#4f46e5">${esc(link)}</span>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
                <tr>
                  <td style="font-size:12.5px;line-height:1.6;color:#475569">
                    <strong style="color:#0f172a">Why this email?</strong> Awde sends you a link each time you sign in — no password, ever.
                    One use only · expires in ${minutes} minutes. If you didn't request it, ignore it: nothing will happen.
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">Awde · building the bridge between a grade and understanding · English + አማርኛ</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

async function postEmail(
  apiKey: string,
  to: string,
  email: LoginEmail
): Promise<{ ok: boolean; retriable: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from: fromAddress(), to, ...email }),
      signal: controller.signal
    });
    if (res.ok) return { ok: true, retriable: false };
    // 4xx (validation, unauthorized sender, unknown domain) will not fix
    // themselves with a retry — report without noise.
    if (res.status < 500) {
      console.error(`[awde:email] rejected (${res.status}): ${await res.text().catch(() => '')}`);
      return { ok: false, retriable: false };
    }
    console.error(`[awde:email] send failed (${res.status}); will retry`);
    return { ok: false, retriable: true };
  } catch (err) {
    console.error('[awde:email] network/timeout error; will retry:', err);
    return { ok: false, retriable: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-effort send of a one-time login link. Never throws; returns ok=false on
 * any persistent failure so callers can decide the fallback (dev link vs.
 * error). Transient transport failures are retried once.
 */
export async function sendLoginLinkEmail(to: string, link: string): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false };
  if (!EMAIL_RE.test(to) || !/^https?:\/\//.test(link)) {
    console.error('[awde:email] refusing to send: invalid recipient or link');
    return { ok: false };
  }

  const email = buildLoginLinkEmail(to, link);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await postEmail(apiKey, to, email);
    if (result.ok) return { ok: true };
    if (!result.retriable) return { ok: false };
    if (attempt + 1 < MAX_ATTEMPTS) {
      console.warn(`[awde:email] retry ${attempt + 1}/${MAX_ATTEMPTS} for ${to}`);
    }
  }
  return { ok: false };
}