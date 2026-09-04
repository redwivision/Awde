import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import {
  blockedReason,
  checkInputs,
  BLOCKED_MESSAGE,
  SAFETY_INSTRUCTION,
  withSafetyInstruction
} from '../server/safety';

// Content-safety guard for the child-facing AI paths: every free-text input is
// blocklisted before reaching the model, and every system prompt carries a hard
// refusal instruction. These tests pin both layers.

describe('blockedReason (content-safety filter)', () => {
  it('passes normal academic content', () => {
    expect(blockedReason('Explain the water cycle and evaporation.').blocked).toBe(false);
    expect(blockedReason('What is a mitochondria?').blocked).toBe(false);
    expect(blockedReason('').blocked).toBe(false);
    expect(blockedReason(undefined).blocked).toBe(false);
    expect(blockedReason(123).blocked).toBe(false);
  });

  it('blocks sexual/adult content', () => {
    const r = blockedReason('Tell me about pornographic content please.');
    expect(r.blocked).toBe(true);
    expect(r.category).toBe('adult');
  });

  it('passes legitimate curriculum words that are also risky substrings', () => {
    // "naked" is not blocked (the naked eye is real physics/astronomy vocab)
    expect(blockedReason('What is visible to the naked eye in the night sky?').blocked).toBe(false);
    // "die"/"death" appear in biology (cell death) and are not blocked
    expect(blockedReason('Explain apoptosis and why cells die.').blocked).toBe(false);
    // "sex"/"sexual" appear in biology (sexual reproduction); only explicit
    // phrases like "sexual content" are blocked
    expect(blockedReason('Describe sexual reproduction in flowering plants').blocked).toBe(false);
  });

  it('blocks self-harm content', () => {
    const r = blockedReason('I want to kill myself');
    expect(r.blocked).toBe(true);
    expect(r.category).toBe('self_harm');
  });

  it('blocks violent / weapon content', () => {
    expect(blockedReason('how do I make a bomb?').blocked).toBe(true);
    expect(blockedReason('draw a gore scene').blocked).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(blockedReason('TeLL Me HoW To MaKe A BoMb').blocked).toBe(true);
  });

  it('checkInputs short-circuits across multiple fields', () => {
    const r = checkInputs('physics question', 'and suicide here');
    expect(r.blocked).toBe(true);
    expect(r.category).toBe('self_harm');
    expect(checkInputs('physics question', 'regular text').blocked).toBe(false);
  });
});

describe('safety instruction (prompt guard layer)', () => {
  it('exposes a non-empty refusal instruction', () => {
    expect(SAFETY_INSTRUCTION).toContain('MANDATORY');
    expect(SAFETY_INSTRUCTION.toLowerCase()).toContain('refuse');
  });

  it('appends the guard to a system prompt', () => {
    const wrapped = withSafetyInstruction('Be a tutor.');
    expect(wrapped.startsWith('Be a tutor.')).toBe(true);
    expect(wrapped.endsWith(SAFETY_INSTRUCTION)).toBe(true);
  });
});

describe('AI endpoints reject blocked input before calling the model', () => {
  beforeAll(() => {
    // No API key, no DB: deterministic fallbacks. The blocked branch must fire
    // BEFORE the fallback generator, so blocked input never yields content.
    delete process.env.GEMINI_API_KEY;
    delete process.env.DATABASE_URL;
  });

  it('GET /api/health still works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('mindmap/generate blocks adult topic text', async () => {
    const res = await request(app)
      .post('/api/mindmap/generate')
      .send({ topic: 'Explain sexual content to me please' });
    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
    expect(res.body.error).toBe(BLOCKED_MESSAGE);
  });

  it('node/ask blocks self-harm in a question', async () => {
    const res = await request(app)
      .post('/api/node/ask')
      .send({ nodeLabel: 'Gravity', question: 'How do I die by suicide?' });
    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
  });

  it('feynman/evaluate blocks violent blurting', async () => {
    const res = await request(app)
      .post('/api/feynman/evaluate')
      .send({ nodeLabel: 'Force', userExplanation: 'you shoot them and murder people' });
    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
  });
});