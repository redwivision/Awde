import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { sendLoginLinkEmail, buildLoginLinkEmail } from '../server/email';

// This file tests the SECURED paths (DB present, auth enabled) without a real
// database. The db/client module is replaced with a tiny in-memory fake that
// satisfies the exact query shapes auth.ts / sync.ts use (select/insert/delete
// builders keyed by the table object identity). Each test resets it.
//
// Since the passwordless email/magic-link login is DISABLED (Google OAuth is
// the only way in), the HTTP-level login/confirm suites are gone too — the
// endpoint tests below pin that the disabled contract holds (410, no email
// calls, no leaked links) while the email-module tests still cover the shared
// transport wrapper in isolation.

// A table-object-keyed store means we never need table names — auth.ts passes
// the real users/loginTokens/sessions objects as keys. Rows are stored with the
// exact keys handed to .values() (camelCase); select projections are honored by
// mapping each column's DB name back to its camelCase row key.
vi.mock('../server/db/client', () => {
  const store = new Map<object, any[]>();
  const arrOf = (table: object) => {
    if (!store.has(table)) store.set(table, []);
    return store.get(table)!;
  };
  const camel = (dbName: string) => dbName.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());

  const db: any = {
    select(projection?: Record<string, any>) {
      let fromTable: object | null = null;
      let joined = false;
      let joinTable: object | null = null;
      const chain: any = {
        from: (t: object) => {
          fromTable = t;
          return chain;
        },
        innerJoin: (t: object) => {
          joined = true;
          joinTable = t;
          return chain;
        },
        where: () => chain,
        limit: async (n: number) => {
          let rows = arrOf(fromTable!);
          if (joined) {
            rows = rows.map((s: any) => {
              const u = arrOf(joinTable!).find((x: any) => x.id === s.userId) || {};
              return { ...s, ...u };
            });
          }
          const picked = rows.slice(0, n);
          if (!projection) return picked;
          return picked.map((r: any) =>
            Object.fromEntries(Object.entries(projection).map(([alias, col]) => [alias, r[camel((col as any).name)]]))
          );
        }
      };
      return chain;
    },
    insert(table: object) {
      return {
        values(v: any) {
          arrOf(table).push({ ...v });
          return {
            returning: async () => [arrOf(table)[arrOf(table).length - 1]]
          };
        }
      };
    },
    delete(table: object) {
      return {
        where: async () => {
          arrOf(table).length = 0;
        }
      };
    }
  };
  return {
    getDb: () => db,
    authEnabled: () => true,
    hasDb: () => false,
    __resetDb: () => store.clear()
  };
});

import * as client from '../server/db/client';
const resetDb = () => (client as any).__resetDb();

beforeAll(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.RESEND_FROM_ADDRESS;
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'CONTACT_RECIPIENT']) {
    delete process.env[k];
  }
});

beforeEach(() => {
  resetDb();
  delete process.env.RESEND_API_KEY;
  delete process.env.NODE_ENV;
  delete process.env.ALLOW_DEV_LOGIN_LINK;
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) {
    delete process.env[k];
  }
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.NODE_ENV;
  delete process.env.ALLOW_DEV_LOGIN_LINK;
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) {
    delete process.env[k];
  }
});

describe('magic-link email transport', () => {
  it('returns ok:false when no RESEND_API_KEY is configured', async () => {
    expect(await sendLoginLinkEmail('a@b.com', 'http://x/').then((r) => r.ok)).toBe(false);
  });

  it('posts to Resend and returns ok on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_test';

    const r = await sendLoginLinkEmail('student@example.com', 'http://x/token');
    expect(r.ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body);
    expect(body.to).toBe('student@example.com');
    expect(body.from).toContain('Awde');
    expect(body.subject).toMatch(/sign in/i);
    expect(body.html).toContain('http://x/token');
  });

  it('returns ok:false when Resend rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'unauthorized' }));
    process.env.RESEND_API_KEY = 're_bad';
    expect((await sendLoginLinkEmail('a@b.com', 'http://x/')).ok).toBe(false);
  });

  it('returns ok:false when the network call throws (never crashes login)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    process.env.RESEND_API_KEY = 're_net';
    expect((await sendLoginLinkEmail('a@b.com', 'http://x/')).ok).toBe(false);
  });

  it('silently refuses invalid recipients or links (no fetch)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_test';
    expect((await sendLoginLinkEmail('not-an-email', 'http://x/')).ok).toBe(false);
    expect((await sendLoginLinkEmail('a@b.com', 'javascript:alert(1)')).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retries once on a transient 5xx, then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'nope' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_retry';
    expect((await sendLoginLinkEmail('retry@example.com', 'http://x/')).ok).toBe(true);
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  it('does not retry 4xx validation failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'sender' });
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_403';
    expect((await sendLoginLinkEmail('nope@example.com', 'http://x/')).ok).toBe(false);
    expect(fetchMock.mock.calls.length).toBe(1);
  });
});

describe('login-link email content', () => {
  it('says the link lives for the real token TTL (15 minutes)', () => {
    const { text, html } = buildLoginLinkEmail('student@example.com', 'http://x/t');
    expect(text).toContain('15 minutes');
    expect(html).toContain('15 minutes');
  });

  it('escapes email + link HTML so nothing injects markup', () => {
    const { html } = buildLoginLinkEmail('a&b@example.com', 'http://x/?token=<>\"\'' );
    expect(html).not.toContain('a&b@example.com');
    expect(html).toContain('a&amp;b@example.com');
    expect(html).not.toContain('token=<>');
    expect(html).toContain('&lt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
  });

  it('contains a tap-target CTA and fallback plain link', () => {
    const { text, html } = buildLoginLinkEmail('student@example.com', 'http://x/token');
    expect(text).toContain('http://x/token');
    expect(html).toContain('Sign in to Awde');
    expect(html).toContain(`http://x/token`);
  });
});

describe('magic-link endpoints are disabled (Google-only auth)', () => {
  it('POST /api/auth/login replies 410 and never touches the email transport', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_test';
    process.env.ALLOW_DEV_LOGIN_LINK = 'true';

    const res = await request(app).post('/api/auth/login').send({ email: 'student@example.com' });
    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/disabled/i);
    // No link, no rate-limit path, no email send attempt — the whole surface is
    // unreachable even with email + dev-link env configured.
    expect(res.body.devLink).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('GET /api/auth/confirm replies 410 and issues no session cookie', async () => {
    const res = await request(app).get('/api/auth/confirm?token=whatever');
    expect(res.status).toBe(410);
    expect(res.body.error).toMatch(/disabled/i);
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    expect(setCookie).toBeUndefined();
  });

  it('GET /api/auth/providers reports email:false and a boolean google', async () => {
    const res = await request(app).get('/api/auth/providers');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(false);
    expect(typeof res.body.google).toBe('boolean');
  });
});