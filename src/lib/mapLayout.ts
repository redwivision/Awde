// Deterministic mind-map layout engine.
//
// Extracted from MindMapCanvas so the layout maths can be unit-tested without
// pulling in the React component. The rule: one column per category (ordered so
// learning flows left → right), nodes stacked and vertically centered per
// column. AI-provided x/y are ignored for positioning, so the graph stays a
// legible map even when a provider returns degenerate or overlapping
// coordinates.
import type { ConceptNode } from '../types';

export const CATEGORY_ORDER = ['Foundation', 'Mechanism', 'Core Law', 'Real-World App'];

export const COL_STEP_X = 340;
export const ROW_STEP_Y = 215;

export function computeMapLayout(nodes: ConceptNode[]): Record<string, { x: number; y: number }> {
  const columns = new Map<string, ConceptNode[]>();
  for (const n of nodes) {
    const list = columns.get(n.category) || [];
    list.push(n);
    columns.set(n.category, list);
  }

  const presentCategories = Array.from(columns.keys());
  const order = CATEGORY_ORDER.filter((c) => columns.has(c)).concat(
    presentCategories.filter((c) => !CATEGORY_ORDER.includes(c))
  );

  const positions: Record<string, { x: number; y: number }> = {};
  order.forEach((category, colIdx) => {
    const members = (columns.get(category) || []).slice().sort((a, b) => a.depthLevel - b.depthLevel);
    if (members.length === 0) return;
    const x = 140 + colIdx * COL_STEP_X;
    const stackH = members.length * ROW_STEP_Y;
    const startY = Math.max(90, 800 - stackH / 2);
    members.forEach((node, rowIdx) => {
      positions[node.id] = { x, y: startY + rowIdx * ROW_STEP_Y };
    });
  });

  return positions;
}