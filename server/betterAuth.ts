// Better Auth instance for the standard Google OAuth login path. The legacy
// magic-link flow keeps its own tables in `server/db/schema.ts`; Better Auth
// uses the core tables in `server/db/baSchema.ts` via the Drizzle adapter.
//
// TWO hard rules:
// 1. The instance is built LAZILY (getAuth), never at module load, so it is
//    only created after `runMigrations()` has applied the `user/session/
//    account/verification` tables — otherwise Better Auth's Drizzle schema
//    check would abort a fresh deploy.
// 2. When no database is configured (local mode / CI) it stays null, so the
//    rest of the server never sees a half-configured auth system.
import { Router } from 'express';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { authEnabled, getDb } from './db/client';
import { Account, Session, User, Verification } from './db/baSchema';
import { getSecret } from './secrets';

type AuthInstance = ReturnType<typeof betterAuth>;

const GOOGLE_CLIENT_ID = getSecret('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = getSecret('GOOGLE_CLIENT_SECRET');

function appUrlBase(): string {
  return (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '');
}

let cached: AuthInstance | null = null;

// Lazily built on first access so the schemas exist (migrations ran) before
// Better Auth validates them. Returns null when there's no DB or the instance
// can't be constructed (e.g. a bad state) — callers must handle null.
export function getAuth(): AuthInstance | null {
  if (cached) return cached;
  const db = getDb();
  if (!db || !authEnabled()) return null;
  try {
    cached = betterAuth({
      basePath: '/api/ba',
      baseURL: appUrlBase(),
      secret: getSecret('BETTER_AUTH_SECRET') || createHash('sha256').update(`awde-better-auth:${appUrlBase()}`).digest('base64'),
      database: drizzleAdapter(db, {
        provider: 'pg',
        schema: { User, Session, Account, Verification }
      }),
      socialProviders: {
        ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
          ? { google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET } }
          : {})
      },
      trustedOrigins: [appUrlBase()],
      advanced: {
        cookiePrefix: 'awde',
        database: { validateSchema: false },
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    }) as AuthInstance;
  } catch (err) {
    console.error('Could not initialize Better Auth (OAuth login disabled):', err);
    cached = null;
  }
  return cached;
}

/**
 * Mount the Better Auth handler at /api/ba/* on an Express app. No-op when no
 * database is configured. Returns whether it mounted (for boot logs).
 */
export function registerBetterAuthRoutes(app: Router): boolean {
  const instance = getAuth();
  if (!instance) return false;
  app.all('/api/ba/*', toNodeHandler(instance));
  return true;
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && getAuth());
}

// Express request -> standard Headers. `fromNodeHeaders` (from better-auth/node)
// is the canonical bridge; we forward the incoming headers verbatim so the
// cookie + CSRF/x-requested-with headers survive.
export function headersFromExpress(req: Request): Headers {
  return fromNodeHeaders(req.headers);
}