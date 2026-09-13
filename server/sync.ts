// Auth + server-side sync routes. Registered on the Express app.
//
// When no DATABASE_URL is set these endpoints report "local mode" (auth
// disabled, the app stays localStorage-only). When a DB is present, Google
// OAuth (Better Auth) is the only way into an account — the passwordless
// email/magic-link path is disabled (login/confirm reply 410 Gone) and the
// /api/me/* sync routes require a session.
import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, authEnabled } from './db/client';
import { workspaces, studyEvents, users } from './db/schema';
import { User as BaUser } from './db/baSchema';
import { requireAuth, revokeSession, sessionCookieOptions, SESSION_COOKIE } from './auth';
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

export function registerSyncRoutes(app: Router) {
  // POST /api/auth/login — passwordless email sign-in is DISABLED. Google OAuth
  // is the only way into an account. Registered so any lingering client call
  // gets a clear JSON 410 instead of a generic 404 HTML page (and so the old
  // dev-link/rate-limit surface can never come back).
  app.post('/api/auth/login', (_req, res) => {
    res.status(410).json({ error: 'Email sign-in is disabled. Please sign in with Google.' });
  });

  // GET /api/auth/confirm — disabled with the magic-link flow above; old links
  // in someone's inbox simply no longer exchange for a session.
  app.get('/api/auth/confirm', (_req, res) => {
    res.status(410).json({ error: 'Email sign-in is disabled. Please sign in with Google.' });
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
          // No valid Better Auth session — that's fine, the legacy session
          // cookie below is still revoked.
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
  // button when OAuth isn't configured. Email sign-in is always disabled.
  app.get('/api/auth/providers', async (_req, res) => {
    res.json({ google: isGoogleAuthConfigured(), email: false });
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
