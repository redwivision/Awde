// Free-tier daily quotas for AI-generation endpoints.
//
// The per-minute rate limiters bound bursts; the DAILY quotas are the real
// cost ceiling for a free tier. Both are keyed by the same client fingerprint
// (IP + UA + Accept-Language), so they work pre-auth in local mode exactly
// like rateLimit.ts. Backed by the same in-memory store — swap for Redis when
// the app grows to multiple instances.
//
// Limits are environment-configurable with sane defaults and read lazily, so
// tests can lower them and call refreshQuotaLimits() without cold-booting the
// server. Each quota is created fresh from current env on refresh.
import type { Request, Response, NextFunction } from 'express';
import { makeRateLimiter, rateLimitKey } from './rateLimit';

const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

function envQuota(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export type DailyQuota = ((req: Request, res: Response, next: NextFunction) => void) & {
  refresh: () => void;
  clear: () => void;
};

function makeDailyQuota(envName: string, fallback: number, noun: string): DailyQuota {
  const build = () =>
    makeRateLimiter({
      windowMs: DAY_WINDOW_MS,
      max: envQuota(envName, fallback),
      key: (req) => rateLimitKey(req),
      message: `You've reached your free daily limit for ${noun}. Try again tomorrow, or review a unit you've already generated.`
    });

  let current = build();
  const middleware: DailyQuota = (req, res, next) => current(req, res, next);
  middleware.refresh = () => {
    current.clear();
    current = build();
  };
  middleware.clear = () => current.clear();
  return middleware;
}

export const mindmapDailyQuota = makeDailyQuota('FREE_TIER_MINDMAPS_PER_DAY', 30, 'mind-map generations');
export const quizDailyQuota = makeDailyQuota('FREE_TIER_QUIZZES_PER_DAY', 120, 'quiz generations');
export const chatDailyQuota = makeDailyQuota('FREE_TIER_CHAT_RESPONSES_PER_DAY', 240, 'AI chat responses');
export const textbookDailyQuota = makeDailyQuota('FREE_TIER_TEXTBOOK_PROCESSES_PER_DAY', 10, 'textbook uploads');

/** Re-read env limits and reset quota buckets (used at boot and in tests). */
export function refreshQuotaLimits(): void {
  mindmapDailyQuota.refresh();
  quizDailyQuota.refresh();
  chatDailyQuota.refresh();
  textbookDailyQuota.refresh();
}