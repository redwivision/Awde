// DB-gated integration tests for the content-addressed unit cache.
//
// These cover the money path (store -> hit -> verified flag / hit counts)
// against a REAL Postgres, using the same Drizzle query shapes production hits.
// They are skipped automatically when no DATABASE_URL is present, so the normal
// offline/no-DB CI run stays untouched. CI runs this file in a dedicated job
// backed by a postgres service container (see .github/workflows/ci.yml).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../server/db/client';
import { runMigrations } from '../server/db/migrate';
import { generatedUnits } from '../server/db/schema';
import { unitCacheKey, getCachedUnit, storeCachedUnit, isValidMindMap, isValidQuiz } from '../server/unitCache';

const minValidMindMap = {
  nodes: [{ id: 'a', label: 'Topic' }, { id: 'b', label: 'Sub' }],
  connections: [{ from: 'a', to: 'b', label: 'link' }],
  quizQuestions: [{ question: 'Q?', options: ['A', 'B'], answer: 0 }],
  flashcards: [{ front: 'F', back: 'B' }]
};

const minValidQuiz = [
  { question: 'Q1?', options: ['A', 'B', 'C'], correctIndex: 1 },
  { question: 'Q2?', options: ['X', 'Y'], correctIndex: 0 }
];

const dbHere = getDb();

describe.skipIf(!process.env.DATABASE_URL)('unit cache against real Postgres', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  afterAll(async () => {
    const db = getDb();
    if (db) await db.delete(generatedUnits).catch(() => {});
  });

  it('stores a validated generation and reads it back', async () => {
    const key = unitCacheKey('mindmap', ['Photosynthesis', 'Biology', '8']);
    const stored = await storeCachedUnit('mindmap', key, minValidMindMap, 'fp-1');
    expect(stored).toBe(true);

    const hit = await getCachedUnit('mindmap', key);
    expect(hit).not.toBeNull();
    expect(hit!.data).toEqual(minValidMindMap);
    expect(hit!.verified).toBe(false);
  });

  it('is keyed by kind: the same key string in another namespace is a miss', async () => {
    const key = unitCacheKey('quiz', ['Photosynthesis', 'Biology', '8']);
    await storeCachedUnit('quiz', key, minValidQuiz, 'fp-1');

    const crossHit = await getCachedUnit('mindmap', key);
    expect(crossHit).toBeNull();

    const directHit = await getCachedUnit('quiz', key);
    expect(directHit).not.toBeNull();
  });

  it('bumps hitCount on repeat reads', async () => {
    const key = unitCacheKey('quiz', ['Fractions', 'Math', '5']);
    await storeCachedUnit('quiz', key, minValidQuiz);

    await getCachedUnit('quiz', key);
    await getCachedUnit('quiz', key);

    const rows = await dbHere!.select().from(generatedUnits);
    const row = rows.find((r) => r.contentHash === key);
    expect(row?.hitCount).toBeGreaterThanOrEqual(2);
  });

  it('refuses malformed payloads and oversized payloads', async () => {
    const key = unitCacheKey('mindmap', ['Bad', 'Science', '6']);

    expect(await storeCachedUnit('mindmap', key, { nodes: [], connections: [] })).toBe(false);
    expect(await getCachedUnit('mindmap', key)).toBeNull();

    const hugeNodes = Array.from({ length: 50_000 }, (_, i) => ({ id: `n${i}`, label: 'x'.repeat(50) }));
    expect(
      await storeCachedUnit('mindmap', key, { nodes: hugeNodes, connections: [], quizQuestions: [], flashcards: [] })
    ).toBe(false);
  });

  it('idempotent store: a second store of the same key does not duplicate', async () => {
    const key = unitCacheKey('quiz', ['Idempotency', 'CS', '10']);
    await storeCachedUnit('quiz', key, minValidQuiz);
    await storeCachedUnit('quiz', key, minValidQuiz);

    const all = await dbHere!.select().from(generatedUnits);
    const matches = all.filter((r) => r.contentHash === key);
    expect(matches).toHaveLength(1);
  });

  it('validators catch the shapes the cache trusts', () => {
    expect(isValidMindMap(minValidMindMap)).toBe(true);
    expect(isValidQuiz(minValidQuiz)).toBe(true);
    expect(isValidMindMap({ nodes: [{ id: 'a', label: '' }] })).toBe(false);
    expect(isValidQuiz([{ question: 'Q', options: ['A'], correctIndex: 0 }])).toBe(false);
  });
});