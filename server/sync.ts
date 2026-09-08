// Auth + server-side sync routes. Registered on the Express app.
//
// When no DATABASE_URL is set these endpoints report "local mode" (auth
// disabled, the app stays localStorage-only). When a DB is present, magic-link
// auth is enforced for the /api/me/* sync routes.
import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, authEnabled } from './db/client';
import { workspaces, studyEvents, users } from './db/schema';
import { User as BaUser } from './db/baSchema';
import { issueMagicToken, consumeMagicToken, requireAuth, getUserFromToken, revokeSession, loginLinkUrl, sessionCookieOptions, SESSION_COOKIE } from './auth';
import { sendLoginLinkEmail, emailConfigured } from './email';
import { makeRateLimiter, rateLimitKey } from './rateLimit';
import { getAuth, headersFromExpress, isGoogleAuthConfigured } from './betterAuth';
import { issueShareSig, verifyShareSig } from './share';

// Better Auth (Google OAuth) cookie names, cookiePrefix 'awde'. Also clears the
// HttpOnly session token so a refresh can't resurrect a deleted account.
const BetterAuthCookieNames = ['awde.session_token', 'awde.session_data', 'awde.account_data', 'awde.dont_remember', 'awde.oauth_state', 'awde.csrf_token'] as const;

function betterAuthCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string } {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };
}

// Auth-gate hardening (milestone 4-adjacent).
// - Per-email+IP: 5 login links / 15 min stops someone spamming one address.
// - Per-IP: fewer than a real school NAT's burst, but enough to stop scanners.
const loginEmailLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  key: (req) => `${String(req.body?.email || '').trim().toLowerCase()}|${rateLimitKey(req)}`,
  message: 'Too many login attempts for this email. Please wait a few minutes and try again.'
});

const loginIpLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  key: (req) => rateLimitKey(req),
  message: 'Too many login attempts from this network. Please try again later.'
});

const confirmIpLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  key: (req) => rateLimitKey(req),
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

      // Email transport missing or failed.
      // NEVER return a usable login link in the response body — even in dev —
      // because a non-production deployment exposed to the internet would allow
      // complete account takeover. Log the link server-side only.
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          error: emailConfigured()
            ? 'Could not send the login email right now. Please try again.'
            : 'Login emails are not configured on this server yet.'
        });
      }

      // Dev-only: log the link so local devs can click it, but do NOT send it
      // to the client. Use ALLOW_DEV_LOGIN_LINK=true to restore the old
      // convenience response only in local trusted environments.
      console.log(`[awde:auth] login link for ${email}: ${link}`);
      if (process.env.ALLOW_DEV_LOGIN_LINK === 'true') {
        res.json({
          success: true,
          emailSent: false,
          devLink: link,
          message: 'Login link ready (email not configured here). Open the Dev link to finish.'
        });
      } else {
        res.json({
          success: true,
          emailSent: false,
          message: 'Login link generated but email is not configured. Check server logs for the link.'
        });
      }
    } catch (err) {
      console.error('Error issuing magic token:', err);
      res.status(500).json({ error: 'Could not start login. Please try again.' });
    }
  });

  // GET /api/auth/confirm?token=... — exchange magic token for a session token.
  // Sets an HttpOnly session cookie and returns the user (never the token).
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
      const user = await getUserFromToken(sessionToken);
      // Issue the session as an HttpOnly cookie — never in the JSON response,
      // so JavaScript on the page cannot read it (XSS can't steal the token).
      res.cookie(SESSION_COOKIE, sessionToken, sessionCookieOptions());
      res.json({ success: true, user });
    } catch (err) {
      console.error('Error confirming login:', err);
      res.status(500).json({ error: 'Could not complete login.' });
    }
  });

  // POST /api/auth/logout — revoke the current session and clear the cookie,
  // handling both the Better Auth (Google OAuth) cookie and the legacy
  // magic-link bearer token.
  app.post('/api/auth/logout', async (req, res) => {
    if (!authEnabled()) return res.json({ localMode: true, ok: true });
    try {
      const ba = getAuth();
      if (ba) {
        try {
          await ba.api.signOut({ headers: headersFromExpress(req) });
        } catch {
          // No valid Better Auth session — that's fine, the magic-link path
          // below still revokes the bearer token if present.
        }
      }
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : (req.cookies?.[SESSION_COOKIE] as string | undefined);
      await revokeSession(token || '');
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ ok: true });
    } catch (err) {
      console.error('Error logging out:', err);
      res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
  });

  // GET /api/auth/providers — which login methods are available? Public, and
  // returns booleans only (never secrets). Lets the client hide the Google
  // button when OAuth isn't configured.
  app.get('/api/auth/providers', async (_req, res) => {
    res.json({ google: isGoogleAuthConfigured(), email: true });
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
      // Better Auth user → remove its OAuth row too (cascades the BA
      // session/account rows). The legacy row below handles workspaces/events.
      if (req.via === 'better-auth') {
        await db.delete(BaUser).where(eq(BaUser.id, req.user.id));
      }
      await db.delete(users).where(eq(users.id, req.user.id));
      // Clear BOTH the legacy cookie and the Better Auth cookies so a refresh
      // (or the service-worker-served old bundle) can't re-adopt the deleted
      // account's sessions.
      res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
      for (const name of BetterAuthCookieNames) {
        res.clearCookie(name, betterAuthCookieOptions());
      }
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

  // GET /api/me/study-events — this user's append-only progress history. The
  // stored `payload` holds the full client activity (score, accuracy, titles);
  // older rows without a payload are synthesized from the top-level columns.
  app.get('/api/me/study-events', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, activities: [] });
    const requested = Number(req.query.limit);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(500, requested)) : 300;
    try {
      const db = getDb()!;
      const rows = await db
        .select()
        .from(studyEvents)
        .where(eq(studyEvents.userId, req.user.id))
        .orderBy(desc(studyEvents.createdAt))
        .limit(limit);
      res.json({
        activities: rows.map((r) => ({
          eventType: r.eventType,
          workspaceId: r.workspaceId || undefined,
          unitId: r.unitId || undefined,
          nodeId: r.nodeId || undefined,
          ...(r.payload && typeof r.payload === 'object' ? (r.payload as object) : {}),
          ts: new Date(r.createdAt).getTime()
        }))
      });
    } catch (err) {
      console.error('Error loading study events:', err);
      res.status(500).json({ error: 'Could not load study history.' });
    }
  });

  // POST /api/share/create — mint a signed read-only link for one of this
  // user's server-side workspaces. Ownership is verified before a signature is
  // issued, so a link can only represent a workspace the owner actually has.
  app.post('/api/share/create', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Sharing requires a connected database.' });
    const body = getObject(req.body);
    const workspaceId = String(body.workspaceId || '');
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required.' });
    try {
      const db = getDb()!;
      const row = await db
        .select({ workspaceId: workspaces.workspaceId })
        .from(workspaces)
        .where(eq(workspaces.userId, req.user.id))
        .limit(100);
      const owned = row.some((r) => r.workspaceId === workspaceId);
      if (!owned) return res.status(404).json({ error: 'Workspace not found for this account.' });
      res.json({ ok: true, share: { userId: req.user.id, workspaceId, sig: issueShareSig(req.user.id, workspaceId) } });
    } catch (err) {
      console.error('Error creating share link:', err);
      res.status(500).json({ error: 'Could not create a share link.' });
    }
  });

  // GET /api/share/read — public, verifies the signature, returns the workspace
  // (read-only preview for anyone holding the link). Never leaks account data.
  app.get('/api/share/read', async (req, res) => {
    const user = String(req.query.user || '');
    const id = String(req.query.id || '');
    const sig = String(req.query.sig || '');
    if (!user || !id || !verifyShareSig(user, id, sig)) {
      return res.status(400).json({ error: 'This share link is invalid.' });
    }
    if (!authEnabled()) return res.status(400).json({ error: 'Sharing requires a connected database.' });
    try {
      const row = await getDb()!
        .select({ data: workspaces.data })
        .from(workspaces)
        .where(and(eq(workspaces.userId, user), eq(workspaces.workspaceId, id)))
        .limit(1);
      if (!row[0]?.data) return res.status(404).json({ error: 'This workspace is no longer available.' });
      res.json({ workspace: row[0].data });
    } catch (err) {
      console.error('Error reading shared workspace:', err);
      res.status(500).json({ error: 'Could not load the shared workspace.' });
    }
  });
}

function getObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}
