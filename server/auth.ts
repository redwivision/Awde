// Passwordless ("magic link") auth for Awde.
//
// Design notes:
// - Tokens are random 32-byte secrets; only their SHA-256 hashes are stored.
// - A `/api/auth/login` call with an email either creates the user (first time)
//   or references the existing one, then returns an email+link. In dev with no
//   SMTP we console.log the link so you can click it.
// - The link hits `/api/auth/confirm?token=...`, which exchanges the token for
//   a longer-lived bearer session, returned to the browser to store.
// - Auth is ONLY active when a DATABASE_URL is configured; otherwise the app
//   stays open + localStorage-only (local mode), matching the existing behavior.
//
// NOTE: the raw token must never be logged or persisted — only its hash.
import { randomBytes, createHash } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { getDb, authEnabled } from './db/client';
import { users, loginTokens, sessions } from './db/schema';

export const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // login link valid 15 min
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // session valid 30 days

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Allowed values for the username hint used in emailed login links. */
export function appUrlBase(): string {
  const base = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');
  return base;
}

export function loginLinkUrl(token: string): string {
  return `${appUrlBase()}/api/auth/confirm?token=${encodeURIComponent(token)}`;
}

/**
 * Create the user if needed (idempotent by email) and emit a magic-link token.
 * Returns a "handled" result describing whether to send email vs console-log,
 * and the link for dev logging.
 */
export async function issueMagicToken(email: string): Promise<{ userExists: boolean; token: string }> {
  const db = getDb()!;
  const normalized = email.trim().toLowerCase();

  let user = (await db.select().from(users).where(eq(users.email, normalized)).limit(1))[0];
  if (!user) {
    const created = await db.insert(users).values({ id: randomBytes(12).toString('hex'), email: normalized }).returning();
    user = created[0];
  }

  const token = newToken();
  const tokenHash = hashToken(token);
  await db.insert(loginTokens).values({
    tokenHash,
    userId: user.id,
    expiresAt: new Date(Date.now() + MAGIC_TOKEN_TTL_MS)
  });

  return { userExists: true, token };
}

/**
 * Exchange a magic-link token for a fresh session token. Returns null if the
 * token is unknown or expired.
 */
export async function consumeMagicToken(token: string): Promise<string | null> {
  const db = getDb()!;
  const tokenHash = hashToken(token);
  const row = (await db.select().from(loginTokens).where(eq(loginTokens.tokenHash, tokenHash)).limit(1))[0];
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return null;
  }
  await db.delete(loginTokens).where(eq(loginTokens.tokenHash, tokenHash));

  const sessionToken = newToken();
  await db.insert(sessions).values({
    tokenHash: hashToken(sessionToken),
    userId: row.userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  });
  return sessionToken;
}

export async function getUserFromToken(token: string) {
  const db = getDb()!;
  const row = (
    await db
      .select({ id: users.id, email: users.email, role: users.role, sessionExpiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, hashToken(token)))
      .limit(1)
  )[0];
  if (!row?.id) return null;
  if (row.sessionExpiresAt.getTime() < Date.now()) return null;
  return { id: row.id, email: row.email, role: row.role };
}

/**
 * Express middleware that resolves the authenticated user from the Bearer
 * session token. When auth is NOT enabled (no DB), it acts as a no-op that just
 * calls next() so the app stays open/local — existing behavior unchanged.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!authEnabled()) return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Could not check your session.' });
  }
}
