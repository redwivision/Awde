// Optional, consent-first study groups.
//
// Design (anti-authority by construction):
// - Any signed-in user can create a group; their account becomes the owner.
// - A student joins by entering a short shareable `code` and picking the
//   `displayName` others will see. They are NEVER identified by real email.
// - The owner's dashboard shows only aggregated, anonymous per-member study
//   stats (events, quiz avg, mastery, focus minutes, streak) rolled up from
//   study_events — no raw explanations, no identity.
// - A member can leave any time: the membership row is deleted, so their
//   events instantly vanish from the roster/insights. Freely come, freely go.
// - A separate anonymous insights view aggregates across the whole group at
//   the concept level so schools can improve curricula WITHOUT pinning any
//   individual student.
//
// All routes require auth (no-op in local/no-DB mode) and are gated on a
// database existing, mirroring the /api/me/* sync routes.
import { Router } from 'express';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { getDb, authEnabled } from './db/client';
import { studyGroups, studyGroupMembers, studyEvents } from './db/schema';
import { requireAuth } from './auth';

const GROUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function generateGroupCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += GROUP_CODE_ALPHABET[Math.floor(Math.random() * GROUP_CODE_ALPHABET.length)];
  }
  return out;
}

function getObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};
}

function safeDisplayName(raw: string): string {
  return String(raw || '').trim().slice(0, 40) || 'anonymous';
}

export function registerGroupRoutes(app: Router) {
  // POST /api/groups — create a study group (owner = current user).
  app.post('/api/groups', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Groups require a connected database.' });
    const db = getDb()!;
    const body = getObject(req.body);
    const name = String(body.name || '').trim().slice(0, 80);
    if (!name) return res.status(400).json({ error: 'Group name is required.' });
    const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateGroupCode();
      const existing = await db.select({ code: studyGroups.code }).from(studyGroups).where(eq(studyGroups.code, candidate)).limit(1);
      if (existing.length === 0) {
        code = candidate;
        break;
      }
    }
    if (!code) return res.status(500).json({ error: 'Could not generate a unique group code.' });
    try {
      await db.insert(studyGroups).values({ id, name, code, ownerId: req.user.id });
      await db.insert(studyGroupMembers).values({ groupId: id, userId: req.user.id, displayName: 'Owner' });
      res.json({ ok: true, group: { id, name, code, owner: true, joined: true } });
    } catch (err) {
      console.error('Error creating group:', err);
      res.status(500).json({ error: 'Could not create the group.' });
    }
  });

  // GET /api/groups — groups I own or belong to (with a joined flag).
  app.get('/api/groups', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.json({ localMode: true, groups: [] });
    try {
      const db = getDb()!;
      const rows = await db
        .select({ id: studyGroups.id, name: studyGroups.name, code: studyGroups.code, ownerId: studyGroups.ownerId })
        .from(studyGroups)
        .innerJoin(studyGroupMembers, eq(studyGroupMembers.groupId, studyGroups.id))
        .where(eq(studyGroupMembers.userId, req.user.id))
        .orderBy(desc(studyGroups.createdAt));
      const ids = await db
        .select({ groupId: studyGroupMembers.groupId })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.userId, req.user.id));
      const joined = new Set(ids.map((r) => r.groupId));
      res.json({
        groups: rows.map((g) => ({ id: g.id, name: g.name, code: g.code, owner: g.ownerId === req.user.id, joined: joined.has(g.id) }))
      });
    } catch (err) {
      console.error('Error listing groups:', err);
      res.status(500).json({ error: 'Could not load your groups.' });
    }
  });

  // POST /api/groups/join — join by code; opt-in consent + chosen display name.
  app.post('/api/groups/join', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Groups require a connected database.' });
    const body = getObject(req.body);
    const code = String(body.code || '').trim().toUpperCase();
    const displayName = safeDisplayName(body.displayName);
    if (!code) return res.status(400).json({ error: 'Group code is required.' });
    try {
      const db = getDb()!;
      const group = await db.select().from(studyGroups).where(eq(studyGroups.code, code)).limit(1);
      if (group.length === 0) return res.status(404).json({ error: 'No group found with that code.' });
      const g = group[0];
      const already = await db
        .select({ groupId: studyGroupMembers.groupId })
        .from(studyGroupMembers)
        .where(and(eq(studyGroupMembers.groupId, g.id), eq(studyGroupMembers.userId, req.user.id)))
        .limit(1);
      if (already.length === 0) {
        await db.insert(studyGroupMembers).values({ groupId: g.id, userId: req.user.id, displayName });
      }
      res.json({ ok: true, group: { id: g.id, name: g.name, code: g.code, owner: g.ownerId === req.user.id, joined: true } });
    } catch (err) {
      console.error('Error joining group:', err);
      res.status(500).json({ error: 'Could not join the group.' });
    }
  });

  // GET /api/groups/:id/roster — OWNER ONLY. Anonymous per-member aggregates.
  app.get('/api/groups/:id/roster', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Groups require a connected database.' });
    const groupId = String(req.params.id || '');
    try {
      const db = getDb()!;
      const group = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId)).limit(1);
      if (group.length === 0) return res.status(404).json({ error: 'Group not found.' });
      if (group[0].ownerId !== req.user.id) return res.status(403).json({ error: 'Only the group owner can see the roster.' });

      const members = await db
        .select({ userId: studyGroupMembers.userId, displayName: studyGroupMembers.displayName, joinedAt: studyGroupMembers.joinedAt })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, groupId))
        .orderBy(studyGroupMembers.joinedAt);

      const memberIds = members.map((m) => m.userId);

      // Aggregates, held locally per request (no shared mutable state).
      const aggByUser = new Map<string, { totalEvents: number; quizAvg: number | null; mastery: number | null; focusMins: number; streak: number }>();

      if (memberIds.length > 0) {
        const events = await db
          .select({ userId: studyEvents.userId, eventType: studyEvents.eventType, payload: studyEvents.payload, createdAt: studyEvents.createdAt })
          .from(studyEvents)
          .where(inArray(studyEvents.userId, memberIds))
          .orderBy(desc(studyEvents.createdAt));

        for (const m of memberIds) {
          aggByUser.set(m, { totalEvents: 0, quizAvg: null, mastery: null, focusMins: 0, streak: 0 });
        }

        const perUser = new Map<string, { quizzes: number[]; mastered: number[]; focusSecs: number; days: Set<number> }>();
        for (const m of memberIds) perUser.set(m, { quizzes: [], mastered: [], focusSecs: 0, days: new Set<number>() });

        for (const e of events) {
          const u = perUser.get(e.userId);
          if (!u) continue;
          const p = (e.payload && typeof e.payload === 'object' ? e.payload : {}) as Record<string, any>;
          if (e.eventType === 'quiz') {
            const s = Number(p.score ?? p.accuracy);
            if (Number.isFinite(s)) u.quizzes.push(s);
          } else if (e.eventType === 'mastery') {
            const s = Number(p.score);
            if (Number.isFinite(s)) u.mastered.push(s);
          } else if (e.eventType === 'focus') {
            u.focusSecs += Number(p.seconds) || 0;
          }
          u.days.add(Math.floor(new Date(e.createdAt).getTime() / 86400000));
        }

        for (const m of members) {
          const u = perUser.get(m.userId)!;
          const agg = aggByUser.get(m.userId)!;
          let count = 0;
          for (const e of events) if (e.userId === m.userId) count += 1;
          agg.totalEvents = count;
          if (u.quizzes.length) agg.quizAvg = Math.round(u.quizzes.reduce((a, b) => a + b, 0) / u.quizzes.length);
          if (u.mastered.length) agg.mastery = Math.round(u.mastered.reduce((a, b) => a + b, 0) / u.mastered.length);
          agg.focusMins = Math.round(u.focusSecs / 60);
          agg.streak = computeStreak(u.days);
        }
      }

      const roster = members.map((m) => ({
        userId: null, // never exposed — anonymity is the contract
        displayName: m.displayName,
        joinedAt: m.joinedAt,
        agg: aggByUser.get(m.userId) ?? { totalEvents: 0, quizAvg: null, mastery: null, focusMins: 0, streak: 0 }
      }));

      res.json({ group: { id: groupId, name: group[0].name, code: group[0].code }, members: roster });
    } catch (err) {
      console.error('Error reading roster:', err);
      res.status(500).json({ error: 'Could not load the roster.' });
    }
  });

  // GET /api/groups/:id/insights — OWNER ONLY. Anonymous concept/unit difficulty
  // heatmap across the whole group (no per-student row). Lets a school see which
  // topics students struggle with to improve the curriculum without pinning
  // anyone.
  app.get('/api/groups/:id/insights', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Groups require a connected database.' });
    const groupId = String(req.params.id || '');
    try {
      const db = getDb()!;
      const group = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId)).limit(1);
      if (group.length === 0) return res.status(404).json({ error: 'Group not found.' });
      if (group[0].ownerId !== req.user.id) return res.status(403).json({ error: 'Only the group owner can see insights.' });

      const members = await db
        .select({ userId: studyGroupMembers.userId })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, groupId));
      const memberIds = members.map((m) => m.userId);

      // Concept-level aggregation. unitId+nodeId come from event payloads; we
      // bucket by unitTitle (from payload) then average quiz/feynman scores per
      // unitTitle. Empty when members haven't studied yet.
      const unitBuckets = new Map<string, { scores: number[]; attempts: number }>();

      if (memberIds.length > 0) {
        const events = await db
          .select({ userId: studyEvents.userId, eventType: studyEvents.eventType, payload: studyEvents.payload })
          .from(studyEvents)
          .where(inArray(studyEvents.userId, memberIds));

        for (const e of events) {
          if (e.eventType !== 'quiz' && e.eventType !== 'feynman') continue;
          const p = (e.payload && typeof e.payload === 'object' ? e.payload : {}) as Record<string, any>;
          const title = String(p.unitTitle || 'Unknown unit').slice(0, 100);
          const score = Number(p.score ?? p.accuracy);
          if (!Number.isFinite(score)) continue;
          if (!unitBuckets.has(title)) unitBuckets.set(title, { scores: [], attempts: 0 });
          const b = unitBuckets.get(title)!;
          b.scores.push(score);
          b.attempts += 1;
        }
      }

      const concepts = Array.from(unitBuckets.entries())
        .map(([title, b]) => ({
          unitTitle: title,
          attempts: b.attempts,
          avgScore: Math.round(b.scores.reduce((a, c) => a + c, 0) / b.scores.length),
          difficulty: Math.round(100 - b.scores.reduce((a, c) => a + c, 0) / b.scores.length)
        }))
        .sort((a, b) => b.difficulty - a.difficulty);

      res.json({ group: { id: groupId, name: group[0].name }, memberCount: memberIds.length, concepts });
    } catch (err) {
      console.error('Error reading insights:', err);
      res.status(500).json({ error: 'Could not load insights.' });
    }
  });

  // POST /api/groups/:id/leave — LEAVING DELETES the membership row, so the
  // user's data instantly stops being included. Freely come, freely go.
  app.post('/api/groups/:id/leave', requireAuth, async (req: any, res) => {
    if (!authEnabled()) return res.status(400).json({ error: 'Groups require a connected database.' });
    const groupId = String(req.params.id || '');
    try {
      const db = getDb()!;
      // Owner can't leave (they'd orphan the group); they must delete it.
      const group = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId)).limit(1);
      if (group.length === 0) return res.status(404).json({ error: 'Group not found.' });
      if (group[0].ownerId === req.user.id) {
        await db.delete(studyGroups).where(eq(studyGroups.id, groupId));
        return res.json({ ok: true, deleted: true });
      }
      await db.delete(studyGroupMembers).where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, req.user.id)));
      res.json({ ok: true, deleted: false });
    } catch (err) {
      console.error('Error leaving group:', err);
      res.status(500).json({ error: 'Could not leave the group.' });
    }
  });
}

// Compute a current day-streak from a set of day-keys (UTC day numbers).
function computeStreak(dayKeys: Set<number>): number {
  if (dayKeys.size === 0) return 0;
  let cursor = Math.floor(Date.now() / 86400000);
  let streak = 0;
  if (dayKeys.has(cursor)) {
    while (dayKeys.has(cursor)) {
      streak += 1;
      cursor -= 1;
    }
  } else if (dayKeys.has(cursor - 1)) {
    cursor -= 1;
    while (dayKeys.has(cursor)) {
      streak += 1;
      cursor -= 1;
    }
  }
  return streak;
}