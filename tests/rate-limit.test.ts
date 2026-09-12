import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { makeRateLimiter, rateLimitKey, getClientIp, RateLimiter } from '../server/rateLimit';

function fakeReq(partial: Partial<Request> = {}): Request {
  return { ip: '1.2.3.4', headers: {}, ...partial } as Request;
}

function run(mw: RateLimiter, cb: (status: number | null) => void): void {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const next: NextFunction = vi.fn();
  mw(fakeReq(), res, next);
  const called = (next as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
  cb(called > 0 ? null : (res.status as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as number);
}

describe('makeRateLimiter', () => {
  it('allows up to the max requests inside the window, then 429s', () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, max: 3, key: () => 'k' });
    run(limiter, (s) => expect(s).toBeNull());
    run(limiter, (s) => expect(s).toBeNull());
    run(limiter, (s) => expect(s).toBeNull());
    run(limiter, (s) => expect(s).toBe(429));
  });

  it('distinguishes keys (email+IP style buckets)', () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, max: 2, key: (req) => req.headers['x-k'] as string });
    const mw = limiter;
    const statuses: number[] = [];
    for (const k of ['a', 'a', 'a', 'b']) {
      run2(mw, k, (s) => statuses.push(s ?? 200));
    }
    expect(statuses).toEqual([200, 200, 429, 200]);
  });

  it('uses the custom message on 429', () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, max: 1, key: () => 'k', message: 'slow down' });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
    limiter(fakeReq(), res, vi.fn());
    limiter(fakeReq(), res, vi.fn());
    expect((res.status as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(429);
    expect((res.json as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ error: 'slow down' });
  });

  it('clear() resets the buckets', () => {
    const limiter = makeRateLimiter({ windowMs: 60_000, max: 1, key: () => 'k' });
    run(limiter, (s) => expect(s).toBeNull());
    run(limiter, (s) => expect(s).toBe(429));
    limiter.clear();
    run(limiter, (s) => expect(s).toBeNull());
  });
});

function run2(mw: RateLimiter, key: string, cb: (status: number | null) => void): void {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const next: NextFunction = vi.fn();
  mw(fakeReq({ headers: { 'x-k': key } }), res, next);
  cb((next as unknown as ReturnType<typeof vi.fn>).mock.calls.length > 0 ? null : 429);
}

describe('rate limit key fingerprint', () => {
  it('combines IP + user-agent + accept-language', () => {
    const req = fakeReq({
      ip: '10.0.0.9',
      headers: { 'user-agent': 'Chrome/120', 'accept-language': 'en-US' }
    });
    expect(rateLimitKey(req)).toBe('10.0.0.9|Chrome/120|en-US');
  });

  it('tolerates missing headers and missing ip', () => {
    expect(rateLimitKey(fakeReq({ ip: undefined as unknown as string }))).toBe('unknown||');
  });

  it('getClientIp prefers req.ip and falls back to unknown', () => {
    expect(getClientIp(fakeReq())).toBe('1.2.3.4');
    expect(getClientIp(fakeReq({ ip: undefined as unknown as string }))).toBe('unknown');
  });
});