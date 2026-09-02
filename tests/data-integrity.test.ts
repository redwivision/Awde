import { describe, it, expect } from 'vitest';
import { DEFAULT_TEXTBOOK_WORKSPACES, generateTextbookMultiLevelGraph, createCustomTextbookWorkspace } from '../src/data/textbookWorkspaces';
import { AESTHETIC_THEMES } from '../src/data/themes';

describe('seed data integrity (all default workspaces)', () => {
  it('every workspace has non-empty units with valid node refs', () => {
    expect(DEFAULT_TEXTBOOK_WORKSPACES.length).toBeGreaterThan(0);
    for (const ws of DEFAULT_TEXTBOOK_WORKSPACES) {
      expect(ws.units.length).toBeGreaterThan(0);
      expect(ws.totalUnits).toBe(ws.units.length);

      const ids = new Set<string>();
      for (const u of ws.units) {
        expect(typeof u.overallMastery).toBe('number');
        expect(u.nodes.length).toBeGreaterThan(0);
        ids.add(u.id);
        for (const n of u.nodes) {
          expect(n.id).toBeTruthy();
          expect(typeof n.masteryScore === 'number' && n.masteryScore >= 0 && n.masteryScore <= 100).toBe(true);
          // mastery status must be one of the known states
          expect(['unstudied', 'learning', 'feynman_tested', 'mastered']).toContain(n.masteryStatus);
          for (const p of n.prerequisites || []) {
            const prereqIds = new Set(u.nodes.map((nn) => nn.id));
            expect(prereqIds.has(p)).toBe(true);
          }
        }
        for (const c of u.connections) {
          const nodeIds = new Set(u.nodes.map((nn) => nn.id));
          expect(nodeIds.has(c.from)).toBe(true);
          expect(nodeIds.has(c.to)).toBe(true);
        }
      }
    }
  });

  it('no duplicate unit ids across the whole library', () => {
    const all = new Set<string>();
    for (const ws of DEFAULT_TEXTBOOK_WORKSPACES) {
      for (const u of ws.units) {
        expect(all.has(u.id)).toBe(false);
        all.add(u.id);
      }
    }
  });
});

describe('generateTextbookMultiLevelGraph (whole-book mind map)', () => {
  const physics = DEFAULT_TEXTBOOK_WORKSPACES[0];

  it('produces a book root node plus hubs for every unit', () => {
    const g = generateTextbookMultiLevelGraph(physics);
    expect(g.bookNode.id).toBe(physics.id);
    expect(g.bookNode.type).toBe('book_root');
    expect(g.unitNodes).toHaveLength(physics.units.length);
    for (const hub of g.unitNodes) {
      expect(hub.type).toBe('unit_hub');
      expect(hub.unitId).toBeTruthy();
    }
  });

  it('every connection references nodes that actually exist in the graph', () => {
    const g = generateTextbookMultiLevelGraph(physics);
    const ids = new Set<string>([
      g.bookNode.id,
      ...g.unitNodes.map((n) => n.id),
      ...g.topicNodes.map((n) => n.id)
    ]);
    for (const c of g.connections) {
      expect(ids.has(c.from)).toBe(true);
      expect(ids.has(c.to)).toBe(true);
    }
    // cross-unit connections use fromNodeId/toNodeId and must also resolve
    for (const c of g.crossUnitConnections) {
      expect(ids.has(c.fromNodeId)).toBe(true);
      expect(ids.has(c.toNodeId)).toBe(true);
    }
  });

  it('cross-unit connection endpoints resolve to real node/unit ids', () => {
    const g = generateTextbookMultiLevelGraph(physics);
    const unitIds = new Set(physics.units.map((u) => u.id));
    for (const c of g.crossUnitConnections) {
      expect(unitIds.has(c.fromUnitId)).toBe(true);
      expect(unitIds.has(c.toUnitId)).toBe(true);
    }
  });

  it('handles an empty-units workspace without crashing (returns no hubs)', () => {
    const empty = { ...physics, units: [] as any[] };
    const g = generateTextbookMultiLevelGraph(empty);
    expect(g.unitNodes).toHaveLength(0);
    expect(g.bookNode.totalUnits).toBe(0);
  });
});

describe('createCustomTextbookWorkspace (PDF upload path)', () => {
  it('builds a workspace where all unit/node/connection ids are internally consistent', () => {
    const ws = createCustomTextbookWorkspace(
      'chem.pdf',
      'Intro to Chemistry',
      'Chemistry',
      'Grade 9',
      [
        { title: 'Atomic Structure', topics: ['Protons', 'Neutrons', 'Electrons'] },
        { title: 'Bonding', topics: ['Ionic', 'Covalent'] }
      ]
    );
    expect(ws.totalUnits).toBe(2);
    expect(ws.totalTopics).toBe(5);
    expect(ws.sourcePdfName).toBe('chem.pdf');

    const unitIds = new Set<string>();
    for (const u of ws.units) {
      unitIds.add(u.id);
      const nodeIds = new Set(u.nodes.map((n) => n.id));
      for (const c of u.connections) {
        expect(nodeIds.has(c.from)).toBe(true);
        expect(nodeIds.has(c.to)).toBe(true);
      }
    }
    expect(unitIds.size).toBe(2);
  });

  it('first node of each unit is a Foundation with no prerequisites', () => {
    const ws = createCustomTextbookWorkspace('b.pdf', 'B', 'S', 'G', [
      { title: 'U1', topics: ['A', 'B', 'C'] }
    ]);
    const u = ws.units[0];
    const first = u.nodes[0];
    expect(first.category).toBe('Foundation');
    expect(first.depthLevel).toBe(1);
    expect(first.prerequisites).toEqual([]);
    expect(u.nodes[1].prerequisites[0]).toBe(u.nodes[0].id);
  });

  it('creates unique workspace ids even on rapid calls (CAP uniqueness)', () => {
    const a = createCustomTextbookWorkspace('x.pdf', 'X', 'S', 'G', []);
    const b = createCustomTextbookWorkspace('x.pdf', 'X', 'S', 'G', []);
    expect(a.id).not.toBe(b.id);
  });
});

describe('theme token consistency', () => {
  it('all five aesthetics present with mode-aware palettes', () => {
    expect(AESTHETIC_THEMES).toHaveLength(5);
    const ids = AESTHETIC_THEMES.map((t) => t.id);
    expect(ids).toEqual(['nordic-light', 'scholar-light', 'slate-dark', 'obsidian-dark', 'terracotta-warm']);
  });

  it('every theme exposes the semantic palette keys the UI reads', () => {
    const keys = ['bg', 'card', 'border', 'accent', 'text', 'textMuted'];
    for (const t of AESTHETIC_THEMES) {
      for (const k of keys) {
        expect(typeof t.palette[k]).toBe('string');
        expect(t.palette[k]).toMatch(/^#/);
      }
      expect(['light', 'dark']).toContain(t.mode);
    }
  });

  it('dark themes have dark backgrounds and light text (contrast direction correct)', () => {
    for (const t of AESTHETIC_THEMES) {
      const isDark = t.mode === 'dark';
      const bgNum = parseInt(t.palette.bg.slice(1), 16);
      const textNum = parseInt(t.palette.text.slice(1), 16);
      if (isDark) {
        expect(bgNum).toBeLessThan(0x333333);
        expect(textNum).toBeGreaterThan(0x888888);
      } else {
        expect(bgNum).toBeGreaterThan(0x888888);
        expect(textNum).toBeLessThan(0x444444);
      }
    }
  });
});