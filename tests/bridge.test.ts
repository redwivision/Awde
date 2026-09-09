import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../server/db/client';
import { runMigrations } from '../server/db/migrate';
import { users, workspaces, studyEvents, studyGroups, studyGroupMembers } from '../server/db/schema';
import { bridgeBetterAuthUser } from '../server/auth';

// Regression test for the Google OAuth bridge: a magic-link account (legacy id)
// that signs in with Google must adopt the Google id WITHOUT tripping over the
// foreign keys that point at users.id. Before the fix the rekey ran before the
// Google id existed in `users` (FK violation) and never touched study groups,
// so every authed request 401'd and the client logged the user straight back out.
describe.skipIf(!process.env.DATABASE_URL)('better auth user bridge', () => {
  const legacyId = 'legacy_' + Date.now();
  const baId = 'ba_' + Date.now();
  const email = `bridge-${Date.now()}@test.com`;

  beforeAll(async () => {
    await runMigrations();
    const db = getDb()!;
    const groupId = 'grp_' + Date.now();
    await db.insert(users).values({ id: legacyId, email });
    await db.insert(workspaces).values({ userId: legacyId, workspaceId: 'ws_1', data: { id: 'ws_1' } });
    await db.insert(studyEvents).values({ userId: legacyId, workspaceId: 'ws_1', eventType: 'quiz', payload: { score: 90 } });
    await db.insert(studyGroups).values({ id: groupId, name: 'Physics Club', code: 'PX' + String(Date.now()).slice(-4), ownerId: legacyId });
    await db.insert(studyGroupMembers).values({ groupId, userId: legacyId, displayName: 'Old Me' });
  }, 120_000);

  afterAll(async () => {
    const db = getDb()!;
    if (db) {
      await db.delete(studyGroupMembers).where(eq(studyGroupMembers.userId, baId));
      await db.delete(studyGroups).where(eq(studyGroups.ownerId, baId));
      await db.delete(studyEvents).where(eq(studyEvents.userId, baId));
      await db.delete(workspaces).where(eq(workspaces.userId, baId));
      await db.delete(users).where(eq(users.id, baId));
    }
  }, 120_000);

  it('bridges a magic-link account onto the Google id, keeping all FK data', async () => {
    const db = getDb()!;
    const merged = await bridgeBetterAuthUser(baId, email);
    expect(merged.id).toBe(baId);
    expect(merged.email).toBe(email);

    const legacyRows = await db.select().from(users).where(eq(users.id, legacyId));
    expect(legacyRows).toHaveLength(0);
    expect(legacyRows[0]).toBeUndefined();

    const adopted = await db.select().from(users).where(eq(users.id, baId));
    expect(adopted.length).toBe(1);
    expect(adopted[0].email).toBe(email);

    const ws = await db.select().from(workspaces).where(eq(workspaces.userId, baId));
    expect(ws).toHaveLength(1);
    expect(ws[0].workspaceId).toBe('ws_1');

    const events = await db.select().from(studyEvents).where(eq(studyEvents.userId, baId));
    expect(events).toHaveLength(1);

    const groups = await db.select().from(studyGroups).where(eq(studyGroups.ownerId, baId));
    expect(groups).toHaveLength(1);

    const members = await db.select().from(studyGroupMembers).where(eq(studyGroupMembers.userId, baId));
    expect(members).toHaveLength(1);
  });

  it('is idempotent for the adopted id', async () => {
    const again = await bridgeBetterAuthUser(baId, email);
    expect(again.id).toBe(baId);
  });
});