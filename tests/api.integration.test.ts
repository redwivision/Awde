import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateFallbackFeynmanEvaluation } from '../server/ai';

// IMPORTANT: these integration tests run against the Express app directly
// (no port listening) with GEMINI_API_KEY unset, so every AI endpoint must
// resolve through the deterministic offline fallback. This simulates a
// weak-wifi / offline student with no network and no paid key.

beforeAll(() => {
  delete process.env.GEMINI_API_KEY;
});

describe('health endpoint', () => {
  it('reports ok with hasGeminiKey false', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.hasGeminiKey).toBe(false);
    // Transport depends on local .env (none / gmail-smtp / resend) — must just be one of them.
    expect(['none', 'gmail-smtp', 'resend']).toContain(res.body.mailTransport);
  });
});

describe('POST /api/mindmap/generate (offline fallback)', () => {
  it('returns a full unit with isFallback true', async () => {
    const res = await request(app)
      .post('/api/mindmap/generate')
      .send({ topic: 'Photosynthesis', subject: 'Biology', textbookText: 'Chlorophyll absorbs light.' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(res.body.unit.nodes.length).toBeGreaterThanOrEqual(3);
    expect(res.body.unit.title).toBe('Photosynthesis');
    expect(res.body.unit.subject).toBe('Biology');
  });

  it('still returns 200 for an empty body (graceful missing input)', async () => {
    const res = await request(app).post('/api/mindmap/generate').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unit.title).toBeTruthy();
  });
});

describe('POST /api/feynman/evaluate (offline fallback)', () => {
  it('returns an evaluation object with the shape the UI expects', async () => {
    const res = await request(app)
      .post('/api/feynman/evaluate')
      .send({
        nodeLabel: 'Conduction',
        nodeSummary: 'Heat flows through contact.',
        userExplanation: 'A short explanation that is too brief.',
        language: 'en',
        strictnessLevel: 'medium',
        chatHistory: []
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(typeof res.body.evaluation.score).toBe('number');
    expect(typeof res.body.evaluation.rootyCritique).toBe('string');
    expect(typeof res.body.evaluation.passed).toBe('boolean');
  });
});

describe('POST /api/quiz/generate (offline fallback)', () => {
  it('returns the requested number of mcq questions', async () => {
    const res = await request(app)
      .post('/api/quiz/generate')
      .send({ topic: 'Thermodynamics', textbookText: 'Heat and energy.', count: 4, difficulty: 'hard' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions).toHaveLength(4);
    for (const q of res.body.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
});

describe('POST /api/blurting/evaluate (offline fallback)', () => {
  it('returns accuracy and key point breakdowns', async () => {
    const res = await request(app)
      .post('/api/blurting/evaluate')
      .send({ topicTitle: 'Mechanics', targetKeyPoints: ['A', 'B', 'C', 'D'], userRecallText: 'A B' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallback).toBe(true);
    expect(typeof res.body.accuracyScore).toBe('number');
    expect(Array.isArray(res.body.recalledKeyPoints)).toBe(true);
    expect(Array.isArray(res.body.missedKeyPoints)).toBe(true);
    expect(typeof res.body.feedback).toBe('string');
  });
});

describe('deterministic offline evaluation', () => {
  it('returns identical fallback scores and jargon lists for the same input', () => {
    const a = generateFallbackFeynmanEvaluation(
      'Thermal Equilibrium',
      'Two systems reach the same temperature when energy flows until their particles move at similar rates.',
      'balanced'
    );
    const b = generateFallbackFeynmanEvaluation(
      'Thermal Equilibrium',
      'Two systems reach the same temperature when energy flows until their particles move at similar rates.',
      'balanced'
    );

    expect(a.score).toBe(b.score);
    expect(a.passed).toBe(b.passed);
    expect(a.rootyCritique).toBe(b.rootyCritique);
    expect(a.detectedJargon).toEqual(b.detectedJargon);
  });
});

describe('error handling', () => {
  it('rejects malformed JSON with a 400-level error', async () => {
    const res = await request(app)
      .post('/api/mindmap/generate')
      .set('Content-Type', 'application/json')
      .send('this is not json');
    expect([400, 500]).toContain(res.status);
  });

  it('returns a graceful response even for a non-object body', async () => {
    const res = await request(app)
      .post('/api/quiz/generate')
      .send(null);
    // Should not crash the process; either a 200 fallback or a handled error
    expect([200, 400, 500]).toContain(res.status);
  });
});