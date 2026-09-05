import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { contactLimiter } from '../server/contact';
import * as mail from '../server/mail';

// Tests for POST /api/contact (in-app contact form). The mail transport is
// fully mocked so these run offline and deterministically.

vi.mock('../server/mail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/mail')>();
  return {
    ...actual,
    emailConfigured: vi.fn(() => true),
    sendMail: vi.fn(async () => ({ ok: true }))
  };
});

const mockedMail = vi.mocked(mail);

beforeAll(() => {
  delete process.env.CONTACT_RECIPIENT;
});

beforeEach(() => {
  contactLimiter.clear();
  delete process.env.CONTACT_RECIPIENT;
  mockedMail.emailConfigured.mockImplementation(() => true);
  mockedMail.sendMail.mockImplementation(async () => ({ ok: true }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/contact', () => {
  it('delivers a valid message to the team inbox (default lewikb13@gmail.com)', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Selam', email: 'writer@example.com', message: 'Your privacy policy says…' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, delivered: true });

    expect(mockedMail.sendMail).toHaveBeenCalledTimes(1);
    const [msg] = mockedMail.sendMail.mock.calls[0];
    expect(msg.to).toBe('lewikb13@gmail.com');
    expect(msg.subject).toBe('New Awde contact message — Selam');
    expect(msg.text).toContain('writer@example.com');
    expect(msg.text).toContain('Your privacy policy says…');
  });

  it('honors CONTACT_RECIPIENT over the default', async () => {
    process.env.CONTACT_RECIPIENT = 'team@example.com';
    const res = await request(app)
      .post('/api/contact')
      .send({ email: 'a@b.com', message: 'hello' });
    expect(res.status).toBe(200);
    expect(mockedMail.sendMail.mock.calls[0][0].to).toBe('team@example.com');
  });

  it('escapes untrusted HTML in the message body', async () => {
    await request(app)
      .post('/api/contact')
      .send({ name: '<b>x</b>', email: 'x@y.com', message: '<script>alert(1)</script>' });
    const msg = mockedMail.sendMail.mock.calls[0][0];
    expect(msg.html).not.toContain('<script>alert(1)</script>');
    expect(msg.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(msg.html).not.toContain('<b>x</b>');
    expect(msg.html).toContain('&lt;b&gt;x&lt;/b&gt;');
  });

  it('rejects a missing message', async () => {
    const res = await request(app).post('/api/contact').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
    expect(mockedMail.sendMail).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    const res = await request(app).post('/api/contact').send({ email: 'not-an-email', message: 'hi' });
    expect(res.status).toBe(400);
    expect(mockedMail.sendMail).not.toHaveBeenCalled();
  });

  it('is honest when no email transport is configured (accepts, delivered:false, no network)', async () => {
    mockedMail.emailConfigured.mockImplementation(() => false);
    const res = await request(app)
      .post('/api/contact')
      .send({ email: 'a@b.com', message: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.delivered).toBe(false);
    expect(mockedMail.sendMail).not.toHaveBeenCalled();
  });

  it('returns 502 when the transport fails permanently', async () => {
    mockedMail.sendMail.mockImplementation(async () => ({ ok: false }));
    const res = await request(app).post('/api/contact').send({ email: 'a@b.com', message: 'hello' });
    expect(res.status).toBe(502);
  });

  it('429s after 10 messages per IP in an hour', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/contact')
        .send({ email: `u${i}@example.com`, message: `msg ${i}` });
      expect(res.status).toBe(200);
    }
    const over = await request(app).post('/api/contact').send({ email: 'spam@example.com', message: 'again' });
    expect(over.status).toBe(429);
  });
});