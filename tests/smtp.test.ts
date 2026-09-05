import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendLoginLinkEmail } from '../server/email';

// Unit tests for the Gmail SMTP transport (server/mail.ts). Both nodemailer and
// DNS are mocked so these never touch the network, and we assert the IPv4 +
// TLS-servername pinning that keeps Render (and other IPv6-less clouds) working.

vi.mock('nodemailer', () => {
  const sendMail = vi.fn(async () => ({}));
  return { createTransport: vi.fn(() => ({ sendMail })), sendMail };
});

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (_host: string) => ({ address: '142.250.191.109', family: 4 }))
}));

import * as nodemailer from 'nodemailer';
import * as dns from 'node:dns/promises';

const mockedCreateTransport = vi.mocked(nodemailer.createTransport);
const mockedLookup = vi.mocked(dns.lookup);
const nodemailerSendMail = (nodemailer as any).sendMail as ReturnType<typeof vi.fn>;

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_ADDRESS;
  delete process.env.CONTACT_RECIPIENT;
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'lewikb13@gmail.com';
  process.env.SMTP_PASS = 'app-password';
  process.env.SMTP_FROM = 'Awde <lewikb13@gmail.com>';
  nodemailerSendMail.mockReset();
  nodemailerSendMail.mockImplementation(async () => ({}));
  mockedCreateTransport.mockClear();
  mockedLookup.mockClear();
});

afterEach(() => {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM;
  vi.clearAllMocks();
});

describe('Gmail SMTP transport', () => {
  it('sends login mail over IPv4 with the TLS servername pinned to the hostname', async () => {
    const r = await sendLoginLinkEmail('student@example.com', 'http://x/token');
    expect(r.ok).toBe(true);

    expect(mockedLookup).toHaveBeenCalledWith('smtp.gmail.com', { family: 4 });
    const [transportOpts] = mockedCreateTransport.mock.calls[0] as [Record<string, any>];
    expect(transportOpts.host).toBe('142.250.191.109');
    expect(transportOpts.servername).toBe('smtp.gmail.com');
    expect(transportOpts.port).toBe(465);
    expect(transportOpts.secure).toBe(true);

    const [mail] = nodemailerSendMail.mock.calls[0] as [Record<string, any>];
    expect(mail.to).toBe('student@example.com');
    expect(mail.from).toContain('Awde');
  });

  it('reports ok:false when SMTP fails permanently', async () => {
    nodemailerSendMail.mockImplementation(async () => {
      throw new Error('connect ENETUNREACH');
    });
    const r = await sendLoginLinkEmail('a@b.com', 'http://x/token');
    expect(r.ok).toBe(false);
  });

  it('already sends via SMTP (no Resend) when only SMTP_* are set', async () => {
    const r = await sendLoginLinkEmail('someone@example.com', 'http://x/token');
    expect(r.ok).toBe(true);
    expect(mockedCreateTransport).toHaveBeenCalledTimes(1);
  });
});