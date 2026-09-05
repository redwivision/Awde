// Email transport for Awde login links (passwordless auth).
//
// Uses the Resend REST API directly via fetch (no SDK dependency). When no
// RESEND_API_KEY is configured — the default for local dev and CI — the caller
// falls back to console-logging the link (dev mode). In production a missing
// or failing transport must fail the login attempt, never leak the link.

const RESEND_API = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 8_000;

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function fromAddress(): string {
  return process.env.RESEND_FROM_ADDRESS || 'Awde <onboarding@resend.dev>';
}

/**
 * Best-effort send of a one-time login link. Never throws; returns ok=false on
 * any failure so callers can decide the fallback (dev link vs. error).
 */
export async function sendLoginLinkEmail(to: string, link: string): Promise<{ ok: boolean }> {
  if (!process.env.RESEND_API_KEY) return { ok: false };

  const subject = 'Your Awde login link';
  const text = `Hello!
A one-time login link for Awde was requested for ${to}.

Open this link to finish logging in:
${link}

This link works once and expires in 30 minutes — don't share it.
If you didn't ask for this, you can safely ignore this email.

— Awde (English + አማርኛ)`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 12px">Your Awde login link</h2>
  <p style="color:#334155;font-size:14px;line-height:1.6">Hello! A one-time login link for Awde was requested for <strong>${to}</strong>.</p>
  <p style="margin:24px 0"><a href="${link}" style="background-color:#4f46e5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Finish logging in</a></p>
  <p style="color:#475569;font-size:13px;line-height:1.6">This link works once and expires in 30 minutes — don't share it. If you didn't ask for this, you can safely ignore this email.</p>
  <p style="color:#94a3b8;font-size:12px">— Awde (English + አማርኛ)</p>
</div>`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({ from: fromAddress(), to, subject, text, html }),
      signal: controller.signal
    });
    if (!res.ok) {
      console.error(`[awde:email] send failed ${res.status}: ${await res.text().catch(() => '')}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[awde:email] error sending login link:', err);
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}