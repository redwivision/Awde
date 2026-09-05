// Shared in-memory sliding-window rate limiter.
//
// Why in-memory: Awde runs as a single Node process (Render free web service,
// local dev), so a per-process store is consistent enough and needs no Redis.
// If it later scales to multiple instances, swap this for a shared store
// (Redis) behind the same interface.
//
// The limiter returns a 429 with a JSON error when the limit is hit, then calls
// next() otherwise. Buckets are keyed by whatever the caller chooses — usually
// the client IP, or email+IP for login to prevent one address being spammed.
import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
  message?: string;
}

export type RateLimiter = ((req: Request, res: Response, next: NextFunction) => void) & { clear: () => void };

/** Best-effort client IP. Honours proxies (X-Forwarded-For) since Render
 *  and dev both sit behind one. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].trim();
  return req.ip || 'unknown';
}

export function makeRateLimiter(opts: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, number[]>();

  const enforce: RateLimiter = (req, res, next) => {
    const key = opts.key(req);
    const now = Date.now();
    const recent = (buckets.get(key) || []).filter((ts) => now - ts < opts.windowMs);

    if (recent.length >= opts.max) {
      return res.status(429).json({
        error: opts.message || 'Too many requests. Please slow down and try again shortly.'
      });
    }

    recent.push(now);
    buckets.set(key, recent);
    next();
  };

  enforce.clear = () => buckets.clear();
  return enforce;
}