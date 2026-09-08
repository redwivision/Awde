import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, or } from 'drizzle-orm';
import request from 'supertest';
import { app } from '../server';
import { getDb } from '../server/db/client';
import { runMigrations } from '../server/db/migrate';
import { users, studyGroups, studyGroupMembers, studyEvents } from '../server/db/schema';
import { issueMagicToken, consumeMagicToken, SESSION_COOKIE } from '../server/auth';

describe.skipIf(!process.env.DATABASE_URL)('group routes against real Postgres', () => {
  let ownerToken = '';
  let memberToken = '';
  const testUserId = 'test_group_owner_' + Date.now();
  const testMemberId = 'test_group_member_' + Date.now();
  const testEmail = `owner-groups-${Date.now()}@test.com`;
  const testMemberEmail = `member-groups-${Date.now()}@test.com`;

  beforeAll(async () => {
    await runMigrations();
    const db = getDb()!;
    await db.insert(users).values([
      { id: testUserId, email: testEmail },
      { id: testMemberId, email: testMemberEmail }
    ]);
    const ownerMagicToken = await issueMagicToken(testEmail);
    ownerToken = (await consumeMagicToken(ownerMagicToken))!;
    const memberMagicToken = await issueMagicToken(testMemberEmail);
    memberToken = (await consumeMagicToken(memberMagicToken))!;
  }, 120_000);

  afterAll(async () => {
    const db = getDb()!;
    if (db) {
      await db.delete(studyGroupMembers).where(or(
        eq(studyGroupMembers.userId, testUserId),
        eq(studyGroupMembers.userId, testMemberId)
      ));
      await db.delete(studyGroups).where(or(
        eq(studyGroups.ownerId, testUserId),
        eq(studyGroups.ownerId, testMemberId)
      ));
      await db.delete(users).where(or(
        eq(users.id, testUserId),
        eq(users.id, testMemberId)
      ));
    }
  }, 120_000);

  it('GET /api/groups returns an empty list for a new user', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.groups).toEqual([]);
  });

  it('POST /api/groups creates a group with a short code', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`)
      .send({ name: 'Test Physics Club' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.group.name).toBe('Test Physics Club');
    expect(res.body.group.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(res.body.group.owner).toBe(true);
  });

  it('GET /api/groups now shows the group', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].owner).toBe(true);
  });

  it('POST /api/groups/join lets a member join with a display name', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .post('/api/groups/join')
      .set('Cookie', `${SESSION_COOKIE}=${memberToken}`)
      .send({ code: listRes.body.groups[0].code, displayName: 'Curious Student' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.group.joined).toBe(true);
  });

  it('GET /api/groups/:id/roster shows anonymous aggregates for the owner', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .get(`/api/groups/${groupId}/roster`)
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.group.id).toBe(groupId);
    expect(res.body.members).toHaveLength(2);
    // Member's userId should be null (anonymity contract)
    const member = res.body.members.find((m: any) => m.displayName === 'Curious Student');
    expect(member).toBeDefined();
    expect(member.userId).toBeNull();
    expect(member.agg.totalEvents).toBe(0);
  });

  it('GET /api/groups/:id/roster returns 403 for a non-owner', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .get(`/api/groups/${groupId}/roster`)
      .set('Cookie', `${SESSION_COOKIE}=${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/groups/:id/insights returns empty concepts when no study events', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .get(`/api/groups/${groupId}/insights`)
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.memberCount).toBe(2);
    expect(res.body.concepts).toEqual([]);
  });

  it('POST /api/groups/join with an invalid code returns 404', async () => {
    const res = await request(app)
      .post('/api/groups/join')
      .set('Cookie', `${SESSION_COOKIE}=${memberToken}`)
      .send({ code: 'ZZZZZZ', displayName: 'Test' });
    expect(res.status).toBe(404);
  });

  it('POST /api/groups/:id/leave removes the member', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .post(`/api/groups/${groupId}/leave`)
      .set('Cookie', `${SESSION_COOKIE}=${memberToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.deleted).toBe(false);

    // Verify member no longer appears in roster
    const rosterRes = await request(app)
      .get(`/api/groups/${groupId}/roster`)
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.members).toHaveLength(1);
    expect(rosterRes.body.members[0].displayName).not.toBe('Curious Student');
  });

  it('POST /api/groups/:id/leave by the owner deletes the group', async () => {
    const listRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    const groupId = listRes.body.groups[0].id;

    const res = await request(app)
      .post(`/api/groups/${groupId}/leave`)
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);

    // Group should no longer appear in the list
    const afterRes = await request(app)
      .get('/api/groups')
      .set('Cookie', `${SESSION_COOKIE}=${ownerToken}`);
    expect(afterRes.body.groups).toHaveLength(0);
  });
});
