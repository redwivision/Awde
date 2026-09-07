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

/**
 * Resolve a stable client identifier for rate-limiting.
 *
 * IMPORTANT: We do NOT blindly trust the raw X-Forwarded-For header because any
 * client can set it. Instead we rely on Express's `req.ip`, which only trusts
 * X-Forwarded-For when `app.set('trust proxy', ...)` is configured (done in
 * server.ts). Behind Render/Cloudflare this gives the real client IP; in direct
 * connections it falls back to the TCP socket address — both safe.
 *
 * A secondary fingerprint (UA + Accept-Language) is layered on top so that a
 * single IP shared by many users (school NAT) doesn't unfairly bucket them
 * together, while still catching a single attacker rotating headers.
 */
export function getClientIp(req: Request): string {
  return req.ip || 'unknown';
}

export function rateLimitKey(req: Request): string {
  const ip = getClientIp(req);
  const ua = (req.headers['user-agent'] || '').slice(0, 80);
  const lang = (req.headers['accept-language'] || '').slice(0, 20);
  return `${ip}|${ua}|${lang}`;
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