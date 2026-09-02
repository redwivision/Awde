import { describe, it, expect } from 'vitest';
import {
  generateFallbackUnit,
  generateFallbackFeynmanEvaluation,
  generateFallbackQuestions,
  generateFallbackBlurting
} from '../server/ai';

describe('generateFallbackUnit (offline mindmap generator)', () => {
  it('produces a structurally complete unit with nodes, connections, quiz and flashcards', () => {
    const unit = generateFallbackUnit();
    expect(unit.nodes.length).toBeGreaterThanOrEqual(3);
    expect(unit.connections.length).toBeGreaterThanOrEqual(2);
    expect(unit.quizQuestions.length).toBeGreaterThanOrEqual(1);
    expect(unit.flashcards.length).toBeGreaterThanOrEqual(1);
    expect(unit.overallMastery).toBe(0);
    expect(unit.id).toMatch(/^unit_gen_/);
  });

  it('prerequisites always reference existing node ids (no dangling refs)', () => {
    const unit = generateFallbackUnit();
    const ids = new Set(unit.nodes.map((n) => n.id));
    for (const node of unit.nodes) {
      for (const p of node.prerequisites || []) {
        expect(ids.has(p)).toBe(true);
      }
    }
  });

  it('connection endpoints always reference existing node ids', () => {
    const unit = generateFallbackUnit();
    const ids = new Set(unit.nodes.map((n) => n.id));
    for (const c of unit.connections) {
      expect(ids.has(c.from)).toBe(true);
      expect(ids.has(c.to)).toBe(true);
    }
  });

  it('overrides the topic subject and text when provided', () => {
    const unit = generateFallbackUnit('Kinetic Theory', 'Physics', 'some text');
    expect(unit.title).toBe('Kinetic Theory');
    expect(unit.subject).toBe('Physics');
  });

  it('falls back to defaults on null/undefined input', () => {
    const unit = generateFallbackUnit(undefined, undefined, undefined);
    expect(unit.title).toBeTruthy();
    expect(unit.subject).toBeTruthy();
  });

  it('generates unique ids across repeated calls', () => {
    const a = generateFallbackUnit('A');
    const b = generateFallbackUnit('B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('generateFallbackFeynmanEvaluation', () => {
  it('a short one-line answer yields a low passing score and does NOT pass', () => {
    const r = generateFallbackFeynmanEvaluation('Thermo', 'Heat moves.', 'medium');
    expect(r.score).toBeLessThanOrEqual(30);
    expect(r.passed).toBe(false);
    expect(r.emotion).toBe('stern');
  });

  it('a detailed answer with an analogy yields a top score and passes', () => {
    const longText =
      'Think of it like pouring coffee into a clay cup, as if the molecules slide past each other exactly like wet mud, and imagine how the heat spreads similar to how injera steam rises, until the whole thing equilibrates calmly.';
    const r = generateFallbackFeynmanEvaluation('Conduction', longText, 'strict');
    expect(r.passed).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.emotion).toBe('convinced');
  });

  it('ironclad strictness lowers the analogical score ceiling', () => {
    const longText =
      'Think of it just like water in a canal, as if pressure is the same as a crowd pushing through a gate, and imagine step by step how particles bump each other similar to billiard balls, until they settle down into balance.';
    const regular = generateFallbackFeynmanEvaluation('X', longText, 'friendly');
    const ironclad = generateFallbackFeynmanEvaluation('X', longText, 'ironclad');
    expect(ironclad.passed).toBe(true);
    // ironclad should not exceed its capped ceiling
    expect(ironclad.score).toBeLessThanOrEqual(78);
    expect(regular.score).toBeGreaterThan(ironclad.score);
  });

  it('always returns the full evaluation shape the UI depends on', () => {
    const r = generateFallbackFeynmanEvaluation('Node', 'A short reply here.', 'medium');
    expect(r).toHaveProperty('score');
    expect(r).toHaveProperty('passed');
    expect(r).toHaveProperty('emotion');
    expect(typeof r.rootyCritique).toBe('string');
    expect(typeof r.rootyCritiqueAmharic).toBe('string');
    expect(r.rubric).toHaveProperty('simplicity');
    expect(r.rubric).toHaveProperty('clarity');
    expect(typeof r.followUpQuestion).toBe('string');
  });

  it('detectedJargon is always a string array (may be empty)', () => {
    const r = generateFallbackFeynmanEvaluation('Node', 'Some words to test with a little more length here.', 'medium');
    expect(Array.isArray(r.detectedJargon)).toBe(true);
    for (const j of r.detectedJargon) expect(typeof j).toBe('string');
  });
});

describe('generateFallbackQuestions (CAP-style determinism & bounds)', () => {
  it('returns exactly the requested number of questions, clamped to [1,20]', () => {
    expect(generateFallbackQuestions('X', 4).length).toBe(4);
    expect(generateFallbackQuestions('X', 20).length).toBe(20);
    expect(generateFallbackQuestions('X', 500).length).toBe(20);
    expect(generateFallbackQuestions('X', 0).length).toBe(1);
    expect(generateFallbackQuestions('X', -5).length).toBe(1);
  });

  it('defaults to one question when count is missing/null', () => {
    expect(generateFallbackQuestions('X').length).toBe(1);
    expect(generateFallbackQuestions('X', null).length).toBe(1);
  });

  it('each question has a valid mcq shape with a correct option index in range', () => {
    const qs = generateFallbackQuestions('Heat', 5);
    for (const q of qs) {
      expect(q.type).toBe('mcq');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      expect(typeof q.explanation).toBe('string');
      expect(typeof q.question).toBe('string');
    }
  });

  it('each question id is unique across the batch', () => {
    const qs = generateFallbackQuestions('X', 10);
    const ids = new Set(qs.map((q) => q.id));
    expect(ids.size).toBe(qs.length);
  });
});

describe('generateFallbackBlurting', () => {
  it('reports the first two key points as recalled and the rest as missed', () => {
    const points = ['A', 'B', 'C', 'D', 'E'];
    const r = generateFallbackBlurting(points);
    expect(r.recalledKeyPoints).toEqual(['A', 'B']);
    expect(r.missedKeyPoints).toEqual(['C', 'D', 'E']);
  });

  it('handles empty and non-array inputs gracefully', () => {
    const empty = generateFallbackBlurting([]);
    expect(empty.recalledKeyPoints).toEqual([]);
    expect(empty.missedKeyPoints).toEqual([]);

    const none = generateFallbackBlurting(undefined as any);
    expect(Array.isArray(none.recalledKeyPoints)).toBe(true);
    expect(Array.isArray(none.missedKeyPoints)).toBe(true);
  });

  it('always returns a non-empty feedback string even with zero points', () => {
    const r = generateFallbackBlurting([]);
    expect(typeof r.feedback).toBe('string');
    expect(r.feedback.length).toBeGreaterThan(0);
    expect(typeof r.feedbackAmharic).toBe('string');
  });
});