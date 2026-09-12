import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { issueShareSig } from '../server/share';

// These routes behave one way when auth is enabled (DB present) and another
// when it isn't. The DB-present paths are covered in share-link.test.ts and
// auth-hardening.test.ts; this file pins the LOCAL-MODE contracts and the
// config guards that had no coverage: logout, the GET workspace/study-event
// reads, DELETE /api/me, and the share routes when there's no database.

beforeAll(() => {
  delete process.env.DATABASE_URL;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
});

// Local mode means authEnabled() === false (no DATABASE_URL).

describe('auth + sync routes under local mode (no DB)', () => {
  it('POST /api/auth/logout reports localMode without erroring', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, ok: true });
  });

  it('POST /api/auth/login reports localMode', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'local@example.com' });
    expect(res.body.localMode).toBe(true);
  });

  it('GET /api/auth/confirm is refused when accounts are not configured', async () => {
    const res = await request(app).get('/api/auth/confirm?token=whatever');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not configured/);
  });

  it('GET /api/me resolves to an anonymous (empty) user in local mode', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(200);
    // req.user is never set because requireAuth short-circuits without auth.
    expect((res.body as any).user).toBeUndefined();
  });

  it('GET /api/me/workspaces returns an empty local-mode list', async () => {
    const res = await request(app).get('/api/me/workspaces');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, workspaces: [] });
  });

  it('GET /api/me/study-events returns an empty local-mode list', async () => {
    const res = await request(app).get('/api/me/study-events');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, activities: [] });
  });

  it('PUT /api/me/workspaces no-ops in local mode', async () => {
    const res = await request(app)
      .put('/api/me/workspaces')
      .send({ workspaceId: 'x', data: { id: 'x' } });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, ok: true });
  });

  it('POST /api/me/study-events no-ops in local mode', async () => {
    const res = await request(app).post('/api/me/study-events').send({ eventType: 'quiz' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, ok: true });
  });

  it('DELETE /api/me no-ops in local mode', async () => {
    const res = await request(app).delete('/api/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ localMode: true, ok: true });
  });
});

describe('share routes under local mode (no DB)', () => {
  it('POST /api/share/create refuses without a database', async () => {
    const res = await request(app).post('/api/share/create').send({ workspaceId: 'b1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requires a connected database/);
  });

  it('GET /api/share/read refuses a valid link without a database', async () => {
    // The signature itself is valid (static dev secret), so the route reaches
    // its auth/database guard and must fail cleanly — never serve local-only data.
    const sig = issueShareSig('u1', 'w1');
    const res = await request(app).get(`/api/share/read?user=u1&id=w1&sig=${sig}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requires a connected database/);
  });
});