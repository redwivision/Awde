import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { refreshQuotaLimits } from '../server/quota';

// The daily quotas must cap generation spend even pre-auth (local mode). We
// run the mind-map endpoint with a lowered env limit and assert the 429 kicks
// in once the daily bucket is exhausted — then that a fresh bucket serves
// requests again after a quota reset.

beforeAll(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
});

beforeEach(() => {
  delete process.env.FREE_TIER_MINDMAPS_PER_DAY;
  delete process.env.FREE_TIER_QUIZZES_PER_DAY;
  delete process.env.FREE_TIER_CHAT_RESPONSES_PER_DAY;
  refreshQuotaLimits();
});

describe('free-tier daily quota (POST /api/mindmap/generate)', () => {
  it('serves the daily allowance, then 429s, then recovers after a quota refresh', async () => {
    process.env.FREE_TIER_MINDMAPS_PER_DAY = '2';
    refreshQuotaLimits();

    const send = () =>
      request(app).post('/api/mindmap/generate').send({ topic: 'Quota', textbookText: 'A topic about limits.' });

    const first = await send();
    const second = await send();
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.isFallback).toBe(true);

    const third = await send();
    expect(third.status).toBe(429);
    expect(third.body.error).toMatch(/daily limit/i);

    // A fresh day (simulated by re-reading env + clearing buckets) resets it.
    refreshQuotaLimits();
    const after = await send();
    expect(after.status).toBe(200);
  });

  it('defaults to a generous allowance when no env limit is set', async () => {
    const res = await request(app)
      .post('/api/mindmap/generate')
      .send({ topic: 'Generous Default', textbookText: 'One request should always pass.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('free-tier daily quota (POST /api/quiz/generate)', () => {
  it('429s once quiz quota is exhausted', async () => {
    process.env.FREE_TIER_QUIZZES_PER_DAY = '1';
    refreshQuotaLimits();

    const send = () => request(app).post('/api/quiz/generate').send({ topic: 'QuizQuota', count: 3 });
    expect((await send()).status).toBe(200);
    const over = await send();
    expect(over.status).toBe(429);
    expect(over.body.error).toMatch(/daily limit/i);
  });
});