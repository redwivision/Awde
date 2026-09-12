import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateFallbackNodeAnswer } from '../server/ai';
import { refreshQuotaLimits } from '../server/quota';

// Completes the coverage of the AI endpoints: /api/node/ask was only ever
// exercised through its blocked-content branch; its offline success path, the
// missing-question validation, and the shared chatDailyQuota were untested.
// Also adds direct unit coverage for generateFallbackNodeAnswer, whose three
// answer branches had never been asserted.

beforeAll(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.BETTER_AUTH_SECRET;
  process.env.FREE_TIER_CHAT_RESPONSES_PER_DAY = '2';
  refreshQuotaLimits();
});

afterAll(() => {
  delete process.env.FREE_TIER_CHAT_RESPONSES_PER_DAY;
  refreshQuotaLimits();
});

beforeEach(() => {
  refreshQuotaLimits();
});

describe('POST /api/node/ask (offline fallback)', () => {
  it('answers a concept question with an offline answer when no AI key is present', async () => {
    const res = await request(app)
      .post('/api/node/ask')
      .send({
        nodeLabel: 'Conduction',
        nodeSummary: 'Heat flows through contact between materials.',
        question: 'Why does metal feel colder than wood?',
        language: 'en',
        chatHistory: []
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(typeof res.body.answer).toBe('string');
    expect(res.body.answer.length).toBeGreaterThan(20);
    expect(typeof res.body.answerAmharic).toBe('string');
  });

  it('rejects a blank question with 400 before hitting any AI provider', async () => {
    const res = await request(app)
      .post('/api/node/ask')
      .send({ nodeLabel: 'Gravity', question: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Question is required.');
  });

  it('blocks unsafe content through the safety filter', async () => {
    const res = await request(app)
      .post('/api/node/ask')
      .send({ nodeLabel: 'Gravity', question: 'I want to hurt myself, what should I do?' });
    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
  });

  it('answers in English + Amharic even when question has script markers', async () => {
    const res = await request(app)
      .post('/api/node/ask')
      .send({ nodeLabel: 'Equilibrium', question: 'ለምን ሚዛን ይፈጠራል?', language: 'am' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.answer).toContain('Equilibrium');
    expect(res.body.answerAmharic).toContain('Equilibrium');
  });
});

describe('POST /api/blurting/evaluate — safety boundary', () => {
  it('blocks harmful topic/recall text with a 400 before any provider call', async () => {
    const res = await request(app)
      .post('/api/blurting/evaluate')
      .send({ topicTitle: 'Chemistry', targetKeyPoints: ['A'], userRecallText: 'I will shoot them' });
    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
  });
});

describe('chatDailyQuota (shared by node/ask, feynman, blurting)', () => {
  it('returns 429 after the daily AI-chat allowance is spent, then resets', async () => {
    const body = { nodeLabel: 'Light', nodeSummary: 'Electromagnetic wave.', question: 'What is light?', language: 'en' };
    expect((await request(app).post('/api/node/ask').send(body)).status).toBe(200);
    expect((await request(app).post('/api/node/ask').send(body)).status).toBe(200);
    const over = await request(app).post('/api/node/ask').send(body);
    expect(over.status).toBe(429);
    expect(over.body.error).toContain('free daily limit');

    refreshQuotaLimits();
    expect((await request(app).post('/api/node/ask').send(body)).status).toBe(200);
  });
});

describe('generateFallbackNodeAnswer (offline Rooty answer builder)', () => {
  it('branches to the "why" explanation', () => {
    const r = generateFallbackNodeAnswer('Water Cycle', 'why does it rain');
    expect(r.answer).toContain('Water Cycle');
    expect(r.answer).toMatch(/water flows downhill|Blue Nile/);
    expect(r.answerAmharic).toBeTruthy();
  });

  it('branches to the Ethiopian example explanation', () => {
    const r = generateFallbackNodeAnswer('Thermal Conduction', 'give me an example how it works');
    expect(r.answer).toMatch(/Merkato|Jebena|coffee/);
    expect(r.answerAmharic).toContain('Thermal Conduction');
  });

  it('branches to the default "core concept" explanation', () => {
    const r = generateFallbackNodeAnswer('Entropy', 'what is it');
    expect(r.answer).toContain('Entropy');
    expect(r.answer).toMatch(/younger sibling|explain/);
  });

  it('is deterministic and handles a missing label/question', () => {
    const a = generateFallbackNodeAnswer();
    const b = generateFallbackNodeAnswer();
    expect(a.answer).toBe(b.answer);
    expect(a.answerAmharic).toBe(b.answerAmharic);
    expect(a.answer).toContain('this concept');
  });
});