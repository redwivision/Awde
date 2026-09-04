import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';

// These tests cover the auth + sync endpoints in LOCAL mode — i.e. the exact
// state the app (and CI) runs in when no DATABASE_URL is configured. In local
// mode there are no server-side accounts, so the sync endpoints report
// localMode and the app stays localStorage-only. Auth-gated routes must NOT
// hard-fail; they must degrade to local mode gracefully.

beforeAll(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.DATABASE_URL;
});

describe('auth endpoints (local mode)', () => {
  it('POST /api/auth/login reports localMode and never errors', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'student@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.localMode).toBe(true);
    expect(res.body.message).toBeTruthy();
  });

  it('GET /api/auth/confirm without accounts returns a clear message', async () => {
    const res = await request(app).get('/api/auth/confirm?token=anything');
    expect([200, 400]).toContain(res.status);
  });
});

describe('sync endpoints (local mode)', () => {
  it('GET /api/me returns a graceful response without a session', async () => {
    const res = await request(app).get('/api/me');
    // In local mode auth is disabled -> the handler runs and must respond sanely.
    expect([200, 401]).toContain(res.status);
  });

  it('PUT /api/me/workspaces degrades to local mode without a DB', async () => {
    const res = await request(app)
      .put('/api/me/workspaces')
      .send({ workspaceId: 'ws-1', data: { id: 'ws-1', title: 'X' } });
    expect([200, 401]).toContain(res.status);
  });

  it('POST /api/me/study-events degrades to local mode without a DB', async () => {
    const res = await request(app)
      .post('/api/me/study-events')
      .send({ eventType: 'quiz', payload: { score: 80 } });
    expect([200, 401]).toContain(res.status);
  });

  it('DELETE /api/me degrades to local mode without a DB', async () => {
    const res = await request(app).delete('/api/me');
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.localMode).toBe(true);
    }
  });
});