import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { issueShareSig, verifyShareSig, shareSecret } from '../server/share';
import { workspaces } from '../server/db/schema';

// The share routes were entirely uncovered. Two layers are tested here:
//   1. The pure HMAC helpers (issueShareSig / verifyShareSig / shareSecret).
//   2. POST /api/share/create + GET /api/share/read through real HTTP with an
//      in-memory fake DB (auth enabled, magic-link session), covering ownership
//      enforcement, signature verification, and tamper/missing-row behavior.
// The local-mode (no DB) responses of both routes live in sync-routes-complete.

vi.mock('../server/db/client', () => {
  const store = new Map<object, any[]>();
  const arrOf = (table: object) => {
    if (!store.has(table)) store.set(table, []);
    return store.get(table)!;
  };
  const camel = (dbName: string) => dbName.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());

  // Miniature boolean evaluator for the drizzle soft-query objects the routes
  // build (eq/and/or/lt/gte/inArray/is null). Unknown comparisons are skipped
  // (row kept) so an unimplemented operator never silently corrupts a test.
  const isCol = (c: any) => !!c && typeof c.name === 'string' && !!c.table;
  const isVal = (c: any) => !!c && Object.prototype.hasOwnProperty.call(c, 'value') && !c.queryChunks;
  const isStr = (c: any) => !!c && Array.isArray(c?.value) && !c.queryChunks;
  const opMap: Record<string, string> = { '=': '=', '<>': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=', in: 'in' };

  const tokenize = (expr: any): any[] => {
    const out: any[] = [];
    const walk = (node: any) => {
      if (!node?.queryChunks) return;
      for (const ch of node.queryChunks) {
        if (ch?.queryChunks) walk(ch);
        else if (isCol(ch)) out.push({ t: 'col', name: camel(ch.name) });
        else if (isStr(ch)) {
          const text = ch.value.join('').trim();
          for (const part of text.match(/\(|\)|and|or|is null|is not null|<>|<=|>=|in|=|<|>/g) ?? []) {
            if (part === 'and' || part === 'or') out.push({ t: 'bool', op: part });
            else out.push({ t: 'tok', text: part });
          }
        }
        else if (isVal(ch)) out.push({ t: 'val', value: ch.value });
      }
    };
    walk(expr);
    return out;
  };

  const evalWhere = (expr: any, row: any): boolean => {
    if (expr == null) return true;
    const toks = tokenize(expr);
    const norm = (a: any, b: any) => {
      if (a instanceof Date || b instanceof Date) return [new Date(a).getTime(), new Date(b).getTime()];
      return [a, b];
    };
    let pos = 0;
    const cmp = (name: string, op: string, val: any): boolean => {
      const lhs = row[name];
      if (opMap[op] === 'in') return Array.isArray(val) && val.includes(lhs);
      if (op === 'is null') return lhs == null;
      if (op === 'is not null') return lhs != null;
      const [L, R] = norm(lhs, val);
      switch (opMap[op] ?? op) {
        case '=': return L === R;
        case '<>': return L !== R;
        case '<': return L < R;
        case '<=': return L <= R;
        case '>': return L > R;
        case '>=': return L >= R;
        default: return true;
      }
    };
    const parseOr = (): boolean => {
      let left = parseAnd();
      while (pos < toks.length && toks[pos].t === 'bool' && toks[pos].op === 'or') {
        pos++;
        left = left || parseAnd();
      }
      return left;
    };
    const parseAnd = (): boolean => {
      let left = parsePrimary();
      while (pos < toks.length && toks[pos].t === 'bool' && toks[pos].op === 'and') {
        pos++;
        left = left && parsePrimary();
      }
      return left;
    };
    const parsePrimary = (): boolean => {
      if (toks[pos]?.t === 'tok' && toks[pos].text === '(') {
        pos++;
        const inner = parseOr();
        if (toks[pos]?.t === 'tok' && toks[pos].text === ')') pos++;
        return inner;
      }
      if (toks[pos]?.t === 'col') {
        const name = toks[pos].name;
        pos++;
        if (toks[pos]?.t === 'tok' && ['=', '<>', '<', '<=', '>', '>=', 'in', 'is null', 'is not null'].includes(toks[pos].text)) {
          const op = toks[pos].text;
          pos++;
          const v = toks[pos]?.t === 'val' ? (pos++, toks[pos - 1].value) : undefined;
          return cmp(name, op, v);
        }
        return true;
      }
      pos++;
      return true;
    };
    return parseOr();
  };

  const db: any = {
    select(projection?: Record<string, any>) {
      let fromTable: object | null = null;
      let joinTable: object | null = null;
      let cond: any = null;
      const projValue = (row: any, join: any, alias: string, col: any): any => {
        const name = camel((col as any).name);
        return row[name] !== undefined ? row[name] : join?.[name];
      };
      const joinRow = (r: any) => {
        if (!joinTable) return undefined;
        return arrOf(joinTable).find((j: any) => j.id === r.userId || j.userId === r.id);
      };
      const chain: any = {
        from: (t: object) => {
          fromTable = t;
          return chain;
        },
        innerJoin: (t: object) => {
          joinTable = t;
          return chain;
        },
        where: (c: any) => {
          cond = c;
          return chain;
        },
        orderBy: () => chain,
        limit: async (n: number) => {
          const source = fromTable!;
          const kept = cond
            ? arrOf(source).filter((r: any) => evalWhere(cond, r))
            : [...arrOf(source)];
          const rows = kept.slice(0, n);
          if (!projection) return rows;
          return rows.map((r: any) => {
            const join = joinRow(r);
            return Object.fromEntries(
              Object.entries(projection).map(([alias, col]) => [alias, projValue(r, join, alias, col)])
            );
          });
        }
      };
      return chain;
    },
    insert(table: object) {
      return {
        values(v: any) {
          arrOf(table).push({ ...v });
          return { returning: async () => [arrOf(table)[arrOf(table).length - 1]] };
        }
      };
    },
    delete(table: object) {
      return {
        where: async (c: any) => {
          if (!c) arrOf(table).length = 0;
          else arrOf(table).splice(0, arrOf(table).length, ...arrOf(table).filter((r: any) => !evalWhere(c, r)));
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

// Force the legacy magic-link path: no Better Auth instance ever resolves.
vi.mock('../server/betterAuth', () => ({
  getAuth: () => null,
  isGoogleAuthConfigured: () => false,
  registerBetterAuthRoutes: () => false,
  headersFromExpress: () => new Headers()
}));

import * as client from '../server/db/client';
const resetDb = () => (client as any).__resetDb();

beforeAll(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) {
    delete process.env[k];
  }
});

beforeEach(() => {
  resetDb();
  delete process.env.SHARE_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
  delete process.env.RESEND_API_KEY;
  delete process.env.NODE_ENV;
  delete process.env.ALLOW_DEV_LOGIN_LINK;
  for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']) {
    delete process.env[k];
  }
});

// --- pure HMAC helpers ---

describe('share.ts (pure signature helpers)', () => {
  it('shareSecret falls back SHARE_SECRET -> BETTER_AUTH_SECRET -> static dev default', () => {
    process.env.SHARE_SECRET = 'share';
    expect(shareSecret()).toBe('share');
    delete process.env.SHARE_SECRET;

    process.env.BETTER_AUTH_SECRET = 'ba';
    expect(shareSecret()).toBe('ba');
    delete process.env.BETTER_AUTH_SECRET;

    expect(shareSecret()).toBe('awde-share-dev-secret');
  });

  it('issues a signature that verifies for the same owner+workspace', () => {
    const sig = issueShareSig('user-123', 'book-456');
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyShareSig('user-123', 'book-456', sig)).toBe(true);
  });

  it('rejects tampering: wrong owner, wrong workspace, or wrong length', () => {
    const sig = issueShareSig('user-123', 'book-456');

    expect(verifyShareSig('user-999', 'book-456', sig)).toBe(false);
    expect(verifyShareSig('user-123', 'book-999', sig)).toBe(false);

    const flipped = sig.endsWith('0') ? sig.slice(0, -1) + '1' : sig.slice(0, -1) + '0';
    expect(verifyShareSig('user-123', 'book-456', flipped)).toBe(false);
    expect(verifyShareSig('user-123', 'book-456', 'short')).toBe(false);
    expect(verifyShareSig('user-123', 'book-456', '')).toBe(false);
    expect(verifyShareSig('user-123', 'book-456', 'g'.padEnd(64, '0'))).toBe(false);
  });

  it('signatures are deterministic for the same inputs and secret', () => {
    expect(issueShareSig('a', 'b')).toBe(issueShareSig('a', 'b'));
    expect(issueShareSig('a', 'b')).not.toBe(issueShareSig('a', 'c'));
  });
});

// --- HTTP routes (auth enabled, fake DB) ---

async function signInAgent(email: string) {
  process.env.ALLOW_DEV_LOGIN_LINK = 'true';
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({ email });
  expect(login.body.devLink).toBeTruthy();
  const token = new URL(login.body.devLink as string, 'http://x').searchParams.get('token');
  const confirm = await agent.get(`/api/auth/confirm?token=${token}`);
  expect(confirm.status).toBe(200);
  expect(confirm.body.user.email).toBe(email);
  return { agent, userId: confirm.body.user.id as string };
}

describe('POST /api/share/create', () => {
  it('mints a signed share link for an owned server-side workspace', async () => {
    const { agent, userId } = await signInAgent('owner@example.com');
    const db = (client as any).getDb();
    await db.insert(workspaces).values({
      userId,
      workspaceId: 'book-1',
      data: { id: 'book-1', title: 'Shared Book' },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await agent.post('/api/share/create').send({ workspaceId: 'book-1' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.share.userId).toBe(userId);
    expect(res.body.share.workspaceId).toBe('book-1');
    // The signature must be valid against the owner+workspace (tamper-proof).
    expect(verifyShareSig(userId, 'book-1', res.body.share.sig)).toBe(true);
  });

  it('rejects a workspaceId the caller does not own (404)', async () => {
    const { agent, userId } = await signInAgent('owner2@example.com');
    const db = (client as any).getDb();
    await db.insert(workspaces).values({
      userId: 'someone-else',
      workspaceId: 'book-x',
      data: { title: 'Not yours' },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await agent.post('/api/share/create').send({ workspaceId: 'book-x' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
    expect(userId).not.toBe('someone-else');
  });

  it('requires a workspaceId', async () => {
    const { agent } = await signInAgent('ow@example.com');
    const res = await agent.post('/api/share/create').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workspaceId is required/);
  });
});

describe('GET /api/share/read', () => {
  it('serves the workspace for a valid signed link (read-only preview)', async () => {
    const { userId } = await signInAgent('reader-owner@example.com');
    const db = (client as any).getDb();
    await db.insert(workspaces).values({
      userId,
      workspaceId: 'pub-1',
      data: { id: 'pub-1', title: 'Public Book', totalUnits: 1 },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const sig = issueShareSig(userId, 'pub-1');
    const res = await request(app).get(`/api/share/read?user=${userId}&id=pub-1&sig=${sig}`);
    expect(res.status).toBe(200);
    expect(res.body.workspace).toMatchObject({ id: 'pub-1', title: 'Public Book' });
  });

  it('rejects a tampered/forged signature', async () => {
    const sig = issueShareSig('user-123', 'book-456');
    const bad = sig.endsWith('0') ? sig.slice(0, -1) + '1' : sig.slice(0, -1) + '0';
    const res = await request(app).get(`/api/share/read?user=user-123&id=book-456&sig=${bad}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects missing parameters with 400', async () => {
    const sig = issueShareSig('user-123', 'book-456');
    expect((await request(app).get('/api/share/read?user=user-123&id=book-456')).status).toBe(400);
    expect((await request(app).get(`/api/share/read?id=book-456&sig=${sig}`)).status).toBe(400);
    expect((await request(app).get(`/api/share/read?user=user-123&sig=${sig}`)).status).toBe(400);
  });

  it('returns 404 when the link is valid but the workspace is gone', async () => {
    const { userId } = await signInAgent('ghost@example.com');
    const sig = issueShareSig(userId, 'gone-1');
    const res = await request(app).get(`/api/share/read?user=${userId}&id=gone-1&sig=${sig}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no longer available/);
  });
});