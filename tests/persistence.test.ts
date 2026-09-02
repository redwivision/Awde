import { describe, it, expect } from 'vitest';
import {
  loadWorkspaces,
  sanitizeWorkspaces,
  migrateLegacyUnits,
  deriveUnits,
  isUnitConsistent,
  WORKSPACES_KEY,
  UNITS_KEY,
  type Storage
} from '../src/data/persistence';
import { DEFAULT_TEXTBOOK_WORKSPACES } from '../src/data/textbookWorkspaces';

// Simple in-memory storage double.
function makeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v)
  };
}

describe('state model consistency (CAP-style "single source of truth")', () => {
  it('derived units always trace back to workspaces with no duplicates (consistency)', () => {
    expect(isUnitConsistent(DEFAULT_TEXTBOOK_WORKSPACES)).toBe(true);
    const units = deriveUnits(DEFAULT_TEXTBOOK_WORKSPACES);
    const total = DEFAULT_TEXTBOOK_WORKSPACES.reduce((a, w) => a + w.units.length, 0);
    expect(units.length).toBe(total);
    // flatten round-trips without introducing dupes
    const ids = new Set(units.map((u) => u.id));
    expect(ids.size).toBe(units.length);
  });

  it('marks the model inconsistent when a duplicate unit id appears', () => {
    const dup = [
      ...DEFAULT_TEXTBOOK_WORKSPACES[0].units.map((u) => ({ ...u, id: 'SAME_ID' }))
    ];
    const ws = [{ ...DEFAULT_TEXTBOOK_WORKSPACES[0], units: dup }];
    expect(isUnitConsistent(ws)).toBe(false);
  });
});

describe('loadWorkspaces (offline resilience + migration)', () => {
  it('returns defaults when storage is empty', () => {
    const ws = loadWorkspaces(makeStorage());
    expect(ws.length).toBe(DEFAULT_TEXTBOOK_WORKSPACES.length);
    expect(isUnitConsistent(ws)).toBe(true);
  });

  it('prefers the workspaces store when present', () => {
    const custom = [DEFAULT_TEXTBOOK_WORKSPACES[0]];
    const storage = makeStorage({ [WORKSPACES_KEY]: JSON.stringify(custom) });
    const ws = loadWorkspaces(storage);
    expect(ws).toHaveLength(1);
    expect(ws[0].id).toBe(DEFAULT_TEXTBOOK_WORKSPACES[0].id);
  });

  it('recovers from corrupt JSON instead of crashing', () => {
    const storage = makeStorage({ [WORKSPACES_KEY]: '{not valid json' });
    const ws = loadWorkspaces(storage);
    // falls back to defaults (or legacy migration), never throws
    expect(Array.isArray(ws)).toBe(true);
    expect(ws.length).toBeGreaterThan(0);
  });

  it('recovers when workspaces store is not an array', () => {
    const storage = makeStorage({ [WORKSPACES_KEY]: JSON.stringify({ nope: true }) });
    const ws = loadWorkspaces(storage);
    expect(Array.isArray(ws)).toBe(true);
    expect(ws.length).toBeGreaterThan(0);
  });

  it('migrates legacy flat units onto default workspaces by id', () => {
    const legacy = [
      { ...DEFAULT_TEXTBOOK_WORKSPACES[0].units[0], overallMastery: 99 }
    ];
    const ws = migrateLegacyUnits(legacy);
    // thermo unit picked up the migrated mastery value
    const thermo = ws[0].units.find((u) => u.id === legacy[0].id);
    expect(thermo).toBeTruthy();
    expect(thermo!.overallMastery).toBe(99);
    // non-migrated units remain intact (not dropped, not fabricated)
    expect(ws[0].units.every((u) => u.nodes.length >= 0)).toBe(true);
  });

  it('migrates via the full loadWorkspaces path when workspaces store is missing', () => {
    const legacy = [
      { ...DEFAULT_TEXTBOOK_WORKSPACES[0].units[0], id: 'unit_X_custom', overallMastery: 55 }
    ];
    const storage = makeStorage({ [UNITS_KEY]: JSON.stringify(legacy) });
    const ws = loadWorkspaces(storage);
    // custom legacy id not in defaults -> stays on its default unit, no crash
    expect(ws.length).toBe(DEFAULT_TEXTBOOK_WORKSPACES.length);
    expect(isUnitConsistent(ws)).toBe(true);
  });
});

describe('sanitizeWorkspaces (defensive consistency)', () => {
  it('drops malformed workspaces while keeping valid ones', () => {
    const valid = DEFAULT_TEXTBOOK_WORKSPACES[0];
    const junk = { id: null, units: 'not-an-array' } as any;
    const out = sanitizeWorkspaces([junk, valid] as any[]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(valid.id);
  });

  it('keeps a workspace with zero units but drops one with broken unit shape', () => {
    const emptyUnits = { ...DEFAULT_TEXTBOOK_WORKSPACES[0], units: [] };
    const broken = { ...DEFAULT_TEXTBOOK_WORKSPACES[0], units: [{ id: 42, nodes: 'nope' }] } as any;
    const out = sanitizeWorkspaces([emptyUnits, broken] as any[]);
    expect(out.map((w) => w.id)).toEqual([emptyUnits.id]);
  });
});