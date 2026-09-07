// Content-addressed cache for AI-generated study units (mind-maps, quizzes).
//
// The key insight behind "crowdsourced study content at zero marginal cost":
// two students studying the SAME textbook topic deserve the SAME high-quality
// unit. We hash a canonical form of everything that shapes the output
// (kind + topic + textbook text + options), look it up before spending any AI
// tokens, and store successful generations afterwards. Repeat requests then
// resolve instantly with zero provider cost.
//
// Guardrails (cheap to bypass is NOT the goal; correctness is):
// - Keys are canonicalized + hashed, so near-identical input converges.
// - Stored payloads are SHAPE-VALIDATED before insert and size-capped, so a
//   malformed/hallucinated generation can never be served back or blow up
//   memory/DB writes.
// - Cache only ever stores generated study content, never user-authored
//   recall/chat text (the most private data), and only when a DB is present
//   (the app already persists server-side in that mode).
//
// IMPORTANT: without a DATABASE_URL this module is a strict no-op (returns
// null / does nothing), preserving the offline/local-first default exactly.
import { createHash } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { getDb, hasDb } from './db/client';
import { generatedUnits } from './db/schema';

export type CacheKind = 'mindmap' | 'quiz';

export const MAX_CACHE_BYTES = 300 * 1024; // ~300 KB JSON payload cap

/**
 * Canonicalize any input into the form used for key derivation: case-folded,
 * whitespace-collapsed text (arrays/objects are JSON stringified first). Two
 * students typing the same topic with different casing/spacing converge.
 */
export function normalizeCacheInput(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
  }
  if (value == null) return '';
  return JSON.stringify(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Derive the stable content key for a generation request. Includes `kind` +
 * schema lock so a key from one endpoint can never collide with another.
 */
export function unitCacheKey(kind: CacheKind, parts: unknown[]): string {
  const payload = JSON.stringify([kind, ...parts.map(normalizeCacheInput)]);
  return createHash('sha256').update(payload).digest('hex');
}

function serializedSize(data: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(data ?? null));
  } catch {
    return Infinity;
  }
}

/** A stored generation must match the unit shape the client renders. */
export function isValidMindMap(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.nodes) || d.nodes.length === 0) return false;
  if (!Array.isArray(d.connections)) return false;
  if (!Array.isArray(d.quizQuestions)) return false;
  if (!Array.isArray(d.flashcards)) return false;
  for (const node of d.nodes as any[]) {
    if (!node || typeof node.label !== 'string' || !node.label.trim()) return false;
    if (typeof node.id !== 'string') return false;
  }
  return true;
}

/** A stored quiz must be an array of well-formed MCQs. */
export function isValidQuiz(data: unknown): boolean {
  if (!Array.isArray(data)) return false;
  for (const q of data as any[]) {
    if (!q || typeof q !== 'object' || typeof q.question !== 'string') return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (
      typeof q.correctIndex !== 'number' ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    ) {
      return false;
    }
  }
  return data.length >= 1; // caching a zero-question quiz is pointless
}

export function isValidForKind(kind: CacheKind, data: unknown): boolean {
  return kind === 'mindmap' ? isValidMindMap(data) : isValidQuiz(data);
}

export interface CachedUnit {
  data: any;
  verified: boolean;
}

/** Look up a cached generation. Returns null on miss or when no DB is present. */
export async function getCachedUnit(kind: CacheKind, contentHash: string): Promise<CachedUnit | null> {
  if (!hasDb()) return null;
  const db = getDb();
  if (!db) return null;
  try {
    const rows = await db
      .select()
      .from(generatedUnits)
      .where(and(eq(generatedUnits.contentHash, contentHash), eq(generatedUnits.kind, kind)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    // Fire-and-forget usage bump so we can measure hit rates and retire cold rows.
    db.update(generatedUnits)
      .set({ hitCount: (row.hitCount || 0) + 1, lastUsedAt: new Date() })
      .where(and(eq(generatedUnits.contentHash, contentHash), eq(generatedUnits.kind, kind)))
      .catch(() => {});
    return { data: row.data, verified: row.verified };
  } catch (err) {
    console.error('Cache read failed (treating as miss):', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Store a generation iff it survived validation. Returns false when the payload
 * was invalid/oversized, when caching is disabled (no DB), or on DB error —
 * never throws, so a cache failure can't break an otherwise-fine request.
 */
export async function storeCachedUnit(
  kind: CacheKind,
  contentHash: string,
  data: unknown,
  sourceAuthorFingerprint = ''
): Promise<boolean> {
  if (!hasDb()) return false;
  const db = getDb();
  if (!db) return false;
  if (!isValidForKind(kind, data)) return false;
  if (serializedSize(data) > MAX_CACHE_BYTES) return false;
  try {
    await db
      .insert(generatedUnits)
      .values({
        contentHash,
        kind,
        data,
        sourceAuthorFingerprint: String(sourceAuthorFingerprint || '').slice(0, 200),
        verified: false
      })
      .onConflictDoNothing();
    return true;
  } catch (err) {
    console.error('Cache write failed (ignoring):', err instanceof Error ? err.message : err);
    return false;
  }
}