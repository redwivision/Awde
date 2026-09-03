import { ConceptNode, TextbookWorkspace, TopicUnit } from '../types';
import { DEFAULT_TEXTBOOK_WORKSPACES } from './textbookWorkspaces';

// Pure, browser-free persistence + derivation logic so it can be unit tested.
// Encapsulates the "single source of truth" invariant: workspaces are primary,
// the flat unit list is ALWAYS derived from them (never stored independently).

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const WORKSPACES_KEY = 'awde_workspaces_v1';
export const UNITS_KEY = 'awde_units_v1';
export const LANG_KEY = 'awde_lang';
export const AESTHETIC_KEY = 'awde_aesthetic';

// Version of the enrichment schema (detailedExplanation / keyTakeaways). Bump
// whenever ConceptNode gains required fields so stale localStorage data gets
// backfilled from the default seed instead of rendering empty sections.
const SCHEMA_VERSION = 2;
export const SCHEMA_VERSION_KEY = 'awde_schema_version';

// Load workspaces from storage, transparently migrating the legacy flat-unit
// format (awde_units_v1) and swallowing any corruption so the app never
// crashes on bad local data (weak-wifi / partial-write resilience).
export function loadWorkspaces(storage: Storage): TextbookWorkspace[] {
  try {
    const saved = storage.getItem(WORKSPACES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TextbookWorkspace[];
      if (Array.isArray(parsed)) return upgradeStoredWorkspaces(storage, parsed);
    }
  } catch {
    /* ignore corrupt storage */
  }

  // Migrate any previous flat unit progress into default workspaces.
  try {
    const savedUnits = storage.getItem(UNITS_KEY);
    if (savedUnits) {
      const prevUnits = JSON.parse(savedUnits) as TopicUnit[];
      if (Array.isArray(prevUnits)) {
        const migrated = migrateLegacyUnits(prevUnits);
        return upgradeStoredWorkspaces(storage, migrated);
      }
    }
  } catch {
    /* ignore */
  }

  return cloneDefaults();
}

// Backfill missing enrichment fields onto saved nodes from the default seed,
// matched by unit id + node id. Runs once per SCHEMA_VERSION, then marks the
// schema as current so we don't re-run the (cheap) pass on every load.
function upgradeStoredWorkspaces(storage: Storage, workspaces: TextbookWorkspace[]): TextbookWorkspace[] {
  const clean = sanitizeWorkspaces(workspaces);
  const prevVersion = Number(storage.getItem(SCHEMA_VERSION_KEY) || 0);

  if (prevVersion < SCHEMA_VERSION) {
    const defaultNodes = new Map<string, ConceptNode>();
    for (const ws of DEFAULT_TEXTBOOK_WORKSPACES) {
      for (const u of ws.units) {
        for (const n of u.nodes) defaultNodes.set(u.id + '::' + n.id, n);
      }
    }

    const upgraded = clean.map((ws) => ({
      ...ws,
      units: ws.units.map((u) => ({
        ...u,
        nodes: u.nodes.map((n) => {
          if (n.detailedExplanation && n.keyTakeaways) return n;
          const seed = defaultNodes.get(u.id + '::' + n.id);
          return {
            ...n,
            detailedExplanation: n.detailedExplanation || seed?.detailedExplanation || n.summary,
            detailedExplanationAmharic:
              n.detailedExplanationAmharic || seed?.detailedExplanationAmharic || n.summaryAmharic,
            keyTakeaways: n.keyTakeaways || seed?.keyTakeaways || [],
            keyTakeawaysAmharic: n.keyTakeawaysAmharic || seed?.keyTakeawaysAmharic || []
          };
        })
      }))
    }));

    try {
      storage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
      storage.setItem(WORKSPACES_KEY, JSON.stringify(upgraded));
    } catch {
      /* persistence best-effort */
    }
    return upgraded;
  }

  return clean;
}

// Sanitize a workspace array: drop entries that break the data model so the app
// cannot render a partially-corrupted book. Preserve valid sub-objects.
export function sanitizeWorkspaces(workspaces: TextbookWorkspace[]): TextbookWorkspace[] {
  return workspaces.filter(
    (ws) =>
      ws &&
      typeof ws.id === 'string' &&
      Array.isArray(ws.units) &&
      ws.units.every(
        (u) => u && typeof u.id === 'string' && Array.isArray(u.nodes) && u.nodes.length >= 0
      )
  );
}

// Legacy flat-unit -> workspace migration. Merge saved progress onto matching
// default workspace units by id (no fabrication of units that don't exist).
export function migrateLegacyUnits(prevUnits: TopicUnit[]): TextbookWorkspace[] {
  return DEFAULT_TEXTBOOK_WORKSPACES.map((ws) => ({
    ...ws,
    units: ws.units.map((du) => prevUnits.find((u) => u.id === du.id) || du)
  }));
}

// The flat unit list is ALWAYS derived from workspaces (single source of truth).
export function deriveUnits(workspaces: TextbookWorkspace[]): TopicUnit[] {
  return workspaces.flatMap((w) => w.units);
}

// Assert the derived-unit invariant holds: every derived unit must trace back to
// exactly one owning workspace. Returns true when consistent, false otherwise.
// This is the CAP-style consistency check for the app's state model.
export function isUnitConsistent(workspaces: TextbookWorkspace[]): boolean {
  const seen = new Set<string>();
  for (const ws of workspaces) {
    for (const u of ws.units) {
      if (seen.has(u.id)) return false; // duplicate unit id across workspaces
      seen.add(u.id);
    }
  }
  return true;
}

function cloneDefaults(): TextbookWorkspace[] {
  return DEFAULT_TEXTBOOK_WORKSPACES.map((ws) => ({
    ...ws,
    units: ws.units.map((u) => ({ ...u, nodes: u.nodes.map((n) => ({ ...n })) }))
  }));
}