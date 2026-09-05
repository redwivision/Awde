import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { loginEmailLimiter, loginIpLimiter, confirmIpLimiter } from '../server/sync';
import { sendLoginLinkEmail } from '../server/email';

// This file tests the SECURED auth paths (DB present, auth enabled) without a
// real database. The db/client module is replaced with a tiny in-memory fake
// that satisfies the exact query shapes auth.ts / sync.ts use (select/insert/
// delete builders keyed by the table object identity). Each test resets it.

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
});

beforeEach(() => {
  resetDb();
  loginEmailLimiter.clear();
  loginIpLimiter.clear();
  confirmIpLimiter.clear();
  delete process.env.RESEND_API_KEY;
  delete process.env.NODE_ENV;
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.RESEND_API_KEY;
  delete process.env.NODE_ENV;
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
    expect(body.subject).toContain('login');
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
});

describe('POST /api/auth/login (auth enabled)', () => {
  it('emails the link when Resend is configured — no dev link leaked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' }));
    process.env.RESEND_API_KEY = 're_test';

    const res = await request(app).post('/api/auth/login').send({ email: 'student@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(true);
    expect(res.body.devLink).toBeUndefined();
  });

  it('falls back to a Dev link outside production when email is not configured', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'devstudent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.emailSent).toBe(false);
    expect(res.body.devLink).toContain('/?token=');
    expect(res.body.devLink).not.toContain('/api/auth/confirm');
  });

  it('refuses to leak a login link in production when email is not configured', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).post('/api/auth/login').send({ email: 'prodstudent@example.com' });
    expect(res.status).toBe(502);
    expect(res.body.devLink).toBeUndefined();
    expect(res.body.error).toContain('not configured');
  });

  it('refuses to leak a login link in production when email delivery fails', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = 're_boom';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' }));

    const res = await request(app).post('/api/auth/login').send({ email: 'prodnet@example.com' });
    expect(res.status).toBe(502);
    expect(res.body.devLink).toBeUndefined();
  });

  it('returns an identical response for a brand-new address and an existing one (no enumeration)', async () => {
    const first = await request(app).post('/api/auth/login').send({ email: 'anon@example.com' });
    const second = await request(app).post('/api/auth/login').send({ email: 'anon@example.com' });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.success).toBe(second.body.success);
    expect(first.body.emailSent).toBe(second.body.emailSent);
    expect(Boolean(first.body.devLink)).toBe(Boolean(second.body.devLink));
  });

  it('429s after 5 login attempts for the same address in 15 minutes', async () => {
    const email = 'spam@example.com';
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({ email });
      expect(res.status).toBe(200);
    }
    const sixth = await request(app).post('/api/auth/login').send({ email });
    expect(sixth.status).toBe(429);
  });

  it('429s a flood of distinct addresses from one IP', async () => {
    for (let i = 0; i < 40; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: `ip${i}@example.com` });
      expect(res.status).toBe(200);
    }
    const over = await request(app).post('/api/auth/login').send({ email: 'ip-over@example.com' });
    expect(over.status).toBe(429);
  });
});

describe('GET /api/auth/confirm (magic-link exchange)', () => {
  it('exchanges a fresh token for a session, then invalidates it (single-use)', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'confirm@example.com' });
    const link = login.body.devLink as string;
    const token = new URL(link, 'http://x').searchParams.get('token');

    const confirmed = await request(app).get(`/api/auth/confirm?token=${token}`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.success).toBe(true);
    expect(confirmed.body.token).toBeTruthy();
    expect(confirmed.body.user.email).toBe('confirm@example.com');

    const replay = await request(app).get(`/api/auth/confirm?token=${token}`);
    expect(replay.status).toBe(400);
  });
});