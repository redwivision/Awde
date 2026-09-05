// Contact form endpoint (/api/contact).
//
// Sends feedback / privacy / deletion messages to the team inbox using the
// shared mail transport (server/mail.ts). Because messages go TO the team, the
// free Resend test mailbox (onboarding@resend.dev) delivers them even without a
// verified domain — unlike login links to arbitrary users.
import { Router } from 'express';
import { makeRateLimiter, getClientIp } from './rateLimit';
import { sendMail, emailConfigured, contactRecipient, htmlEscape } from './mail';

// 10 messages per hour per IP — generous for one person, tight for a bot.
export const contactLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  key: (req) => getClientIp(req),
  message: 'You have sent a lot of messages recently. Please wait an hour and try again.'
});

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function registerContactRoutes(app: Router) {
  app.post('/api/contact', contactLimiter, async (req, res) => {
    const body = req.body || {};
    const name = String(body.name ?? '').trim().slice(0, NAME_MAX);
    const email = String(body.email ?? '').trim().slice(0, EMAIL_MAX).toLowerCase();
    const message = String(body.message ?? '').trim().slice(0, MESSAGE_MAX);

    if (!message) {
      return res.status(400).json({ error: 'Please write a message before sending.' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please include a valid email so we can reply.' });
    }

    // Honest response when no transport is configured (local dev): accept the
    // submission but tell the UI it was NOT delivered, so nobody thinks their
    // message went anywhere.
    if (!emailConfigured()) {
      console.log(`[awde:contact] (no mail transport) would send from ${email}: ${message}`);
      return res.status(200).json({ ok: true, delivered: false, message: 'Message noted (server has no email configured).' });
    }

    const recipient = contactRecipient();
    const subject = name ? `New Awde contact message — ${name}` : 'New Awde contact message';
    const text = `Name: ${name || '(not provided)'}\nEmail: ${email}\n\n${message}`;
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">New message from the Awde contact form</h2>
        <p style="margin:0 0 6px;font-size:13px;color:#334155"><strong>Name:</strong> ${name ? htmlEscape(name) : '—'}</p>
        <p style="margin:0 0 18px;font-size:13px;color:#334155"><strong>Email:</strong> ${htmlEscape(email)}</p>
        <div style="padding:14px 16px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap">${htmlEscape(message)}</div>
      </div>`;

    const result = await sendMail({ to: recipient, subject, text, html });
    if (!result.ok) {
      return res.status(502).json({ error: 'Could not send your message right now. Please try again later.' });
    }
    res.json({ ok: true, delivered: true, message: 'Thanks — we got your message and reply within 30 days.' });
  });
}