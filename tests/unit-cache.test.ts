import { describe, it, expect } from 'vitest';
import {
  unitCacheKey,
  normalizeCacheInput,
  isValidMindMap,
  isValidQuiz,
  getCachedUnit,
  storeCachedUnit
} from '../server/unitCache';

// These tests run WITHOUT a DATABASE_URL, so the cache module must behave as a
// strict no-op for reads/writes while still producing deterministic, canonical
// keys and correct validation — the guards that matter before anything is
// persisted.

describe('unitCacheKey / normalizeCacheInput', () => {
  it('collapses case, whitespace, and undefined/null into canonical text', () => {
    expect(normalizeCacheInput('  Photo-Synthesis   ')).toBe('photo-synthesis');
    expect(normalizeCacheInput(null)).toBe('');
    expect(normalizeCacheInput(undefined)).toBe('');
    expect(normalizeCacheInput(42)).toBe('42');
  });

  it('produces a stable 64-char hex hash', () => {
    const key = unitCacheKey('mindmap', ['Photosynthesis', 'Biology', '', 'en', 'Text...']);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it('two equivalent requests share a key; different ones do not', () => {
    const a = unitCacheKey('mindmap', ['Photosynthesis', 'Biology', 'Grade 9', 'en', 'chlorophyll  absorbs light']);
    const b = unitCacheKey('mindmap', ['photosynthesis', 'biology', 'grade 9', 'en', 'chlorophyll absorbs light']);
    expect(a).toBe(b);

    const c = unitCacheKey('mindmap', ['Photosynthesis', 'Chemistry', 'Grade 9', 'en', 'chlorophyll absorbs light']);
    expect(c).not.toBe(a);

    // Different kinds never collide even with identical inputs.
    const d = unitCacheKey('quiz', ['Photosynthesis', '5', 'adaptive', 'chlorophyll absorbs light']);
    const e = unitCacheKey('mindmap', ['Photosynthesis', '5', 'adaptive', 'chlorophyll absorbs light']);
    expect(d).not.toBe(e);
  });
});

describe('isValidMindMap / isValidQuiz (poisoning guards)', () => {
  it('accepts a well-formed mind-map unit', () => {
    expect(
      isValidMindMap({ title: 'T', nodes: [{ id: 'n1', label: 'Node' }], connections: [], quizQuestions: [], flashcards: [] })
    ).toBe(true);
  });

  it('rejects empty, malformed, or node-less units', () => {
    expect(isValidMindMap(null)).toBe(false);
    expect(isValidMindMap({})).toBe(false);
    expect(isValidMindMap({ title: 'T', nodes: [], connections: [], quizQuestions: [], flashcards: [] })).toBe(false);
    expect(isValidMindMap({ title: 'T', nodes: [{ id: 'n1' }], connections: [], quizQuestions: [], flashcards: [] })).toBe(false);
    expect(isValidMindMap({ title: 'T', nodes: 'not-an-array' })).toBe(false);
  });

  it('accepts a well-formed quiz array', () => {
    expect(
      isValidQuiz([{ question: 'Q', options: ['a', 'b'], correctIndex: 0, difficulty: 'easy' }])
    ).toBe(true);
  });

  it('rejects quizzes with out-of-range answers or missing options', () => {
    expect(isValidQuiz([])).toBe(false);
    expect(isValidQuiz([{ question: 'Q', options: ['a', 'b'], correctIndex: 5 }])).toBe(false);
    expect(isValidQuiz([{ question: 'Q', options: [], correctIndex: 0 }])).toBe(false);
    expect(isValidQuiz(null)).toBe(false);
  });
});

describe('cache is a no-op without a database', () => {
  it('returns null on read', async () => {
    const key = unitCacheKey('mindmap', ['X']);
    expect(await getCachedUnit('mindmap', key)).toBeNull();
  });

  it('returns false on write (nothing persisted)', async () => {
    const key = unitCacheKey('mindmap', ['X']);
    expect(await storeCachedUnit('mindmap', key, { nodes: [{ id: 'n1', label: 'L' }], connections: [], quizQuestions: [], flashcards: [] })).toBe(false);
  });
});