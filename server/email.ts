// Login-link email for Awde (passwordless auth).
//
// This file is about the MESSAGE (copy + template) and the login-send wrapper.
// The actual transport (Resend API or Gmail SMTP — see `server/mail.ts`) is
// shared with the contact form.
//
// IMPORTANT (deliverability): the fallback from address "Awde
// <onboarding@resend.dev>" is a Resend test-only mailbox that can ONLY deliver
// to the account owner's own inbox. For login links to any user you must either
// verify a domain in the Resend dashboard (RESEND_FROM_ADDRESS on it) or use
// the Gmail SMTP transport (SMTP_HOST/SMTP_USER/SMTP_PASS). Until then Resend
// rejects other recipients (403), which the dev fallback turns into a Dev link
// and production into a clean 502.

import { MAGIC_TOKEN_TTL_MS } from './auth';
import { sendMail, emailConfigured } from './mail';

export { emailConfigured };

export interface LoginEmail {
  subject: string;
  text: string;
  html: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Escape untrusted strings for safe HTML embedding (recipient + link).
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

/**
 * Best-effort send of a one-time login link via the shared transport. Never
 * throws; returns ok=false on any persistent failure so callers can decide the
 * fallback (dev link vs. error).
 */
export async function sendLoginLinkEmail(to: string, link: string): Promise<{ ok: boolean }> {
  if (!/^https?:\/\//.test(link)) {
    console.error('[awde:email] refusing to send: invalid link');
    return { ok: false };
  }
  const email = buildLoginLinkEmail(to, link);
  return sendMail({ to, subject: email.subject, text: email.text, html: email.html });
}

export { EMAIL_RE };