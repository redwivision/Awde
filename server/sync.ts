// Auth + server-side sync routes. Registered on the Express app.
//
// When no DATABASE_URL is set these endpoints report "local mode" (auth
// disabled, the app stays localStorage-only). When a DB is present, magic-link
// auth is enforced for the /api/me/* sync routes.
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { getDb, authEnabled } from './db/client';
import { workspaces, studyEvents, users } from './db/schema';
import { issueMagicToken, consumeMagicToken, requireAuth, loginLinkUrl } from './auth';
import { sendLoginLinkEmail, emailConfigured } from './email';
import { makeRateLimiter, getClientIp } from './rateLimit';

// Auth-gate hardening (milestone 4-adjacent).
// - Per-email+IP: 5 login links / 15 min stops someone spamming one address.
// - Per-IP: fewer than a real school NAT's burst, but enough to stop scanners.
const loginEmailLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  key: (req) => `${String(req.body?.email || '').trim().toLowerCase()}|${getClientIp(req)}`,
  message: 'Too many login attempts for this email. Please wait a few minutes and try again.'
});

const loginIpLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  key: (req) => getClientIp(req),
  message: 'Too many login attempts from this network. Please try again later.'
});

const confirmIpLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  key: (req) => getClientIp(req),
  message: 'Too many login-link checks from this network. Please try again later.'
});

// Exported so integration tests can clear the buckets between cases.
export { loginEmailLimiter, loginIpLimiter, confirmIpLimiter };

export function registerSyncRoutes(app: Router) {
  // POST /api/auth/login — start a passwordless login for an email.
  app.post('/api/auth/login', loginIpLimiter, loginEmailLimiter, async (req, res) => {
    if (!authEnabled()) {
      return res.status(200).json({
        localMode: true,
        message: 'Server-side accounts are not configured (no DATABASE_URL). The app runs in local mode.'
      });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    // Identical response for existing + new users (no account enumeration).
    try {
      const token = await issueMagicToken(email);
      const link = loginLinkUrl(token);
      const sent = await sendLoginLinkEmail(email, link);

      if (sent.ok) {
        res.json({ success: true, emailSent: true, message: 'A login link was emailed to you. Check your inbox.' });
        return;
      }

      // Email transport missing or failed: dev fallback only outside production.
      // In production we must NOT leak a usable login link into the response.
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          error: emailConfigured()
            ? 'Could not send the login email right now. Please try again.'
            : 'Login emails are not configured on this server yet.'
        });
      }

      console.log(`[awde:auth] login link for ${email}: ${link}`);
      res.json({
        success: true,
        emailSent: false,
        devLink: link,
        message: 'Login link ready (email not configured here). Open the Dev link to finish.'
      });
    } catch (err) {
      console.error('Error issuing magic token:', err);
      res.status(500).json({ error: 'Could not start login. Please try again.' });
    }
  });

  // GET /api/auth/confirm?token=... — exchange magic token for a session token.
  // Returns JSON so the frontend can capture token/email and persist it.
  app.get('/api/auth/confirm', confirmIpLimiter, async (req, res) => {
    if (!authEnabled()) {
      return res.status(400).json({ error: 'Accounts are not configured on this server.' });
    }
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Missing token.' });
    try {
      const sessionToken = await consumeMagicToken(token);
      if (!sessionToken) {
        return res.status(400).json({ error: 'That login link is invalid or has expired.' });
      }
      const lookup = await import('./auth');
      const user = await lookup.getUserFromToken(sessionToken);
      res.json({ success: true, token: sessionToken, user });
    } catch (err) {
      console.error('Error confirming login:', err);
      res.status(500).json({ error: 'Could not complete login.' });
    }
  });

  // GET /api/me — who am I? (auth-gated)
  app.get('/api/me', requireAuth, async (req: any, res) => {
    res.json({ user: req.user });
  });

  // DELETE /api/me — erase the account and everything tied to it
  // (workspaces, study events, sessions, login tokens). FKs cascade on delete.
  app.delete('/api/me', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, ok: true });
    try {
      const db = getDb()!;
      await db.delete(users).where(eq(users.id, req.user.id));
      res.json({ ok: true, message: 'Your account and all associated data were deleted.' });
    } catch (err) {
      console.error('Error deleting account:', err);
      res.status(500).json({ error: 'Could not delete your account. Please try again.' });
    }
  });

  // GET /api/me/workspaces — this user's books (server copy).
  app.get('/api/me/workspaces', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, workspaces: [] });
    try {
      const rows = await getDb()!.select().from(workspaces).where(eq(workspaces.userId, req.user.id));
      res.json({ workspaces: rows.map((r) => ({ workspaceId: r.workspaceId, data: r.data, updatedAt: r.updatedAt })) });
    } catch (err) {
      console.error('Error loading workspaces:', err);
      res.status(500).json({ error: 'Could not load your books.' });
    }
  });

  // PUT /api/me/workspaces — upsert one workspace (last-writer-wins on updatedAt).
  app.put('/api/me/workspaces', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, ok: true });
    const body = getObject(req.body);
    const workspaceId = String(body.workspaceId || '');
    const data = body.data;
    if (!workspaceId || data === undefined || typeof data !== 'object') {
      return res.status(400).json({ error: 'workspaceId and data (object) are required.' });
    }
    try {
      const db = getDb()!;
      const now = new Date();
      await db
        .insert(workspaces)
        .values({ userId: req.user.id, workspaceId, data, updatedAt: now, createdAt: now })
        .onConflictDoUpdate({
          target: [workspaces.userId, workspaces.workspaceId],
          set: { data: data as any, updatedAt: now }
        });
      res.json({ ok: true, updatedAt: now.toISOString() });
    } catch (err) {
      console.error('Error saving workspace:', err);
      res.status(500).json({ error: 'Could not save your book.' });
    }
  });

  // POST /api/me/study-events — append a study event to the timeline.
  app.post('/api/me/study-events', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, ok: true });
    const body = getObject(req.body);
    if (!body.eventType) return res.status(400).json({ error: 'eventType is required.' });
    try {
      const db = getDb()!;
      await db.insert(studyEvents).values({
        userId: req.user.id,
        workspaceId: body.workspaceId || null,
        unitId: body.unitId || null,
        nodeId: body.nodeId || null,
        eventType: body.eventType,
        payload: body.payload || null
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Error recording study event:', err);
      res.status(500).json({ error: 'Could not record study activity.' });
    }
  });
}

function getObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}
