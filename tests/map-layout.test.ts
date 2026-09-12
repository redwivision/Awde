import { describe, it, expect } from 'vitest';
import { computeMapLayout, CATEGORY_ORDER, COL_STEP_X, ROW_STEP_Y } from '../src/lib/mapLayout';
import type { ConceptNode } from '../src/types';

function node(partial: Partial<ConceptNode> & { id: string; label: string }): ConceptNode {
  return {
    id: partial.id,
    label: partial.label,
    labelAmharic: partial.label,
    category: partial.category || 'Foundation',
    depthLevel: partial.depthLevel ?? 1,
    masteryScore: 0,
    masteryStatus: 'unstudied',
    summary: '',
    summaryAmharic: '',
    detailedExplanation: '',
    keyTakeaways: [],
    keyFormulasOrRules: [],
    commonMisconceptions: [],
    localizedAnalogy: {
      title: '',
      titleAmharic: '',
      context: '',
      contextAmharic: '',
      explanation: '',
      explanationAmharic: '',
      culturalElement: ''
    },
    prerequisites: [],
    x: 9999,
    y: 9999
  };
}

describe('computeMapLayout', () => {
  it('produces an empty map for no nodes', () => {
    expect(computeMapLayout([])).toEqual({});
  });

  it('lays nodes out left→right in the canonical category order', () => {
    const nodes = [
      node({ id: 'law', label: 'Law', category: 'Core Law' }),
      node({ id: 'app', label: 'App', category: 'Real-World App' }),
      node({ id: 'mech', label: 'Mech', category: 'Mechanism' }),
      node({ id: 'fund', label: 'Fund', category: 'Foundation' })
    ];
    const p = computeMapLayout(nodes);
    expect(p.fund.x).toBe(140);
    expect(p.mech.x).toBe(140 + COL_STEP_X);
    expect(p.law.x).toBe(140 + 2 * COL_STEP_X);
    expect(p.app.x).toBe(140 + 3 * COL_STEP_X);
    expect(p.mech.x).toBeLessThan(p.law.x);
  });

  it('appends unknown categories after the canonical ones (dense column indexing)', () => {
    const p = computeMapLayout([
      node({ id: 'a', label: 'A', category: 'Core Law' }),
      node({ id: 'edge', label: 'Edge', category: 'Edge Case' })
    ]);
    // Columns compress to the categories actually present, in canonical order,
    // so Core Law takes column 0 and the unknown category is appended after it.
    expect(p.a.x).toBe(140);
    expect(p.edge.x).toBe(140 + COL_STEP_X);
    expect(p.edge.x).toBeGreaterThan(p.a.x);
  });

  it('stacks multiple nodes in a column, sorted by depthLevel', () => {
    const p = computeMapLayout([
      node({ id: 'deep', label: 'Deep', category: 'Foundation', depthLevel: 3 }),
      node({ id: 'root', label: 'Root', category: 'Foundation', depthLevel: 1 }),
      node({ id: 'mid', label: 'Mid', category: 'Foundation', depthLevel: 2 })
    ]);
    expect(p.root.y).toBeLessThan(p.mid.y);
    expect(p.mid.y).toBeLessThan(p.deep.y);
    expect(p.root.y).toBe(p.mid.y - ROW_STEP_Y);
    expect(p.deep.y).toBe(p.mid.y + ROW_STEP_Y);
  });

  it('centers the column stack vertically', () => {
    const p = computeMapLayout([node({ id: 'one', label: 'One' })]);
    expect(p.one.y).toBe(800 - ROW_STEP_Y / 2);
    const three = computeMapLayout([
      node({ id: 'a', label: 'A' }),
      node({ id: 'b', label: 'B' }),
      node({ id: 'c', label: 'C' })
    ]);
    // Middle node sits one row below the centered stack start.
    expect(three.b.y).toBe(800 - (3 * ROW_STEP_Y) / 2 + ROW_STEP_Y);
  });

  it('ignores AI-provided coordinates entirely', () => {
    const p = computeMapLayout([node({ id: 'n1', label: 'N1', category: 'Mechanism' })]);
    expect(p.n1).not.toEqual({ x: 9999, y: 9999 });
    // A single-category map still uses the canonical column for that category.
    expect(p.n1.x).toBe(140);
  });

  it('positions every node exactly once', () => {
    const ids = ['a', 'b', 'c', 'd'];
    const p = computeMapLayout(ids.map((id) => node({ id, label: id, category: id === 'a' ? 'Foundation' : 'Mechanism' })));
    expect(Object.keys(p).sort()).toEqual(ids.sort());
  });

  it('CATEGORY_ORDER is exactly the four learning phases', () => {
    expect(CATEGORY_ORDER).toEqual(['Foundation', 'Mechanism', 'Core Law', 'Real-World App']);
  });
});