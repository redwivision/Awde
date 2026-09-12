import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  emailConfigured,
  smtpConfigured,
  contactRecipient,
  fromAddress,
  htmlEscape,
  sendMail
} from '../server/mail';
import { EMAIL_RE } from '../server/email';

beforeEach(() => {
  for (const k of ['RESEND_API_KEY', 'RESEND_FROM_ADDRESS', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'CONTACT_RECIPIENT']) {
    delete process.env[k];
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mail configuration helpers', () => {
  it('smtpConfigured requires host + user + pass all together', () => {
    expect(smtpConfigured()).toBe(false);
    process.env.SMTP_HOST = 'smtp.gmail.com';
    expect(smtpConfigured()).toBe(false);
    process.env.SMTP_USER = 'me@gmail.com';
    expect(smtpConfigured()).toBe(false);
    process.env.SMTP_PASS = 'apppass';
    expect(smtpConfigured()).toBe(true);
  });

  it('emailConfigured is true with either a Resend key or SMTP', () => {
    expect(emailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = 're_x';
    expect(emailConfigured()).toBe(true);
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_HOST = 'h';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    expect(emailConfigured()).toBe(true);
  });

  it('contactRecipient default is the published address, overridable via env', () => {
    expect(contactRecipient()).toBe('lewikb13@gmail.com');
    process.env.CONTACT_RECIPIENT = 'team@awde.school';
    expect(contactRecipient()).toBe('team@awde.school');
  });

  it('fromAddress picks the Resend domain when a key exists', () => {
    process.env.RESEND_API_KEY = 're_x';
    expect(fromAddress()).toBe('Awde <onboarding@resend.dev>');
    process.env.RESEND_FROM_ADDRESS = 'Awde <hello@awde.school>';
    expect(fromAddress()).toBe('Awde <hello@awde.school>');
  });

  it('fromAddress uses SMTP_FROM (or SMTP_USER) when SMTP is configured without Resend', () => {
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_USER = 'me@gmail.com';
    process.env.SMTP_PASS = 'p';
    process.env.SMTP_FROM = 'Awde <lewikb13@gmail.com>';
    expect(fromAddress()).toBe('Awde <lewikb13@gmail.com>');
    delete process.env.SMTP_FROM;
    expect(fromAddress()).toBe('me@gmail.com');
  });

  it('fromAddress falls back to the Resend test mailbox with nothing configured', () => {
    expect(fromAddress()).toBe('Awde <onboarding@resend.dev>');
  });
});

describe('htmlEscape', () => {
  it('escapes HTML entities and converts newlines to <br>', () => {
    expect(htmlEscape('<b>"hi" & \'bye\'\nsecond line')).toBe(
      '&lt;b&gt;&quot;hi&quot; &amp; &#39;bye&#39;<br>second line'
    );
  });
});

describe('sendMail', () => {
  it('refuses an invalid recipient before any transport', async () => {
    const r = await sendMail({ to: 'not-an-email', subject: 's', text: 't' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Invalid recipient/i);
  });

  it('refuses when no transport is configured', async () => {
    const r = await sendMail({ to: 'a@b.com', subject: 's', text: 't' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not configured/i);
  });

  it('sends through Resend when a key exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_x';

    const r = await sendMail({ to: 'a@b.com', subject: 'Hi', text: 'Hello' });
    expect(r.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_x');
    expect(JSON.parse(init.body).to).toBe('a@b.com');
  });

  it('never throws on network failure — returns ok:false with a reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net down')));
    process.env.RESEND_API_KEY = 're_x';
    const r = await sendMail({ to: 'a@b.com', subject: 's', text: 't' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBeTruthy();
  });
});

describe('EMAIL_RE (login-link recipient validation)', () => {
  it('accepts ordinary addresses and rejects malformed ones', () => {
    expect(EMAIL_RE.test('a@b.com')).toBe(true);
    expect(EMAIL_RE.test('student.name+x@school.et')).toBe(true);
    expect(EMAIL_RE.test('no-at-sign')).toBe(false);
    expect(EMAIL_RE.test('a@b')).toBe(false);
    expect(EMAIL_RE.test('@b.com')).toBe(false);
    expect(EMAIL_RE.test('a@b.')).toBe(false);
  });
});