// Frontend server-side sync for Awde accounts.
//
// Design:
// - A session (token + email) is stored in localStorage under awde_session.
//   The user gets it by completing a magic-link login.
// - Every API call here is offline-safe: it reuses the resilient postJson/get
//   helpers and silently no-ops when there is no session or no network, so the
//   app keeps working purely in local mode (localStorage) exactly as before.
// - Workspace sync is "last writer wins" keyed on workspace.id, merging server
//   rows onto local state when the app starts.

import { postJson, isOnline } from './api';
import type { TextbookWorkspace } from '../types';

export interface Session {
  token: string;
  email: string;
  user?: { id: string; email: string; role: string };
}

export const SESSION_KEY = 'awde_session';

// Fired on the *current* window whenever the session is saved or cleared, so
// the UI can re-render reactively. Cross-tab changes are covered separately by
// the browser's `storage` event (fires in every OTHER tab when localStorage
// changes) — App.tsx listens to both.
export const SESSION_EVENT = 'awde:session';

function notifySessionChanged(): void {
  try {
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch {
    /* SSR/edge safety */
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    notifySessionChanged();
  } catch {
    /* best-effort */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    notifySessionChanged();
  } catch {
    /* best-effort */
  }
}

// A compact async fetch wrapper that adds the Authorization header.
async function authedJson<T = unknown>(url: string, init: { method?: string; payload?: unknown } = {}) {
  const session = getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(url, {
    method: init.method || 'GET',
    headers,
    body: init.payload !== undefined ? JSON.stringify(init.payload) : undefined,
    signal: undefined
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data: data as T };
}

// Sync metadata: tracks the latest server updatedAt we know about per
// workspace, so pull/merge can tell "changed on another device" from "already
// in sync". Stored in localStorage; survives reloads.
const SYNC_META_KEY = 'awde_sync_meta';

function readSyncMeta(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSyncMeta(meta: Record<string, string>): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    /* best-effort */
  }
}

/** Record that we just pushed/pulled this workspace at `serverUpdatedAt`. */
export function noteServerSync(workspaceId: string, serverUpdatedAt: string): void {
  const meta = readSyncMeta();
  meta[workspaceId] = serverUpdatedAt;
  writeSyncMeta(meta);
}

/** Whether the server already has this workspace at or past `serverUpdatedAt`. */
export function isServerSynced(workspaceId: string, serverUpdatedAt: string): boolean {
  const meta = readSyncMeta();
  const known = meta[workspaceId];
  if (!known) return false;
  return new Date(known).getTime() >= new Date(serverUpdatedAt).getTime();
}

/** Erase the server-side account and all its data, then sign out locally. */
export async function deleteAccount(): Promise<{ ok: boolean; localMode?: boolean; error?: string }> {
  const session = getSession();
  if (!session) return { ok: true };
  const res = await authedJson<{ ok?: boolean; localMode?: boolean; error?: string }>('/api/me', { method: 'DELETE' });
  clearSession();
  clearSyncMeta();
  const data = res.data as any;
  if (res.ok && (data?.ok || data?.localMode)) return { ok: true, localMode: data?.localMode };
  return { ok: false, error: data?.error };
}

function clearSyncMeta(): void {
  try {
    localStorage.removeItem(SYNC_META_KEY);
  } catch {
    /* best-effort */
  }
}

/** Start a passwordless login for an email. */
export async function requestLogin(email: string) {
  const res = await postJson<{ success: boolean; localMode?: boolean; devLink?: string; error?: string }>(
    '/api/auth/login',
    { email }
  );
  return res;
}

/** Exchange a magic-link token for a session and store it locally. */
export async function confirmLogin(token: string): Promise<{ ok: boolean; session?: Session }> {
  try {
    const res = await fetch(`/api/auth/confirm?token=${encodeURIComponent(token)}`, { method: 'GET' });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      const session: Session = { token: data.token, email: data.user?.email || '', user: data.user };
      saveSession(session);
      return { ok: true, session };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * Push a workspace to the server. Offline/no-session safe: returns true when
 * the server confirmed the write, false when it was skipped (local mode,
 * offline, or failed).
 */
export async function pushWorkspace(workspace: TextbookWorkspace): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  const res = await authedJson<{ ok?: boolean; localMode?: boolean; updatedAt?: string; error?: string }>('/api/me/workspaces', {
    method: 'PUT',
    payload: { workspaceId: workspace.id, data: workspace }
  });
  const data = res.data as any;
  if (res.ok && (data?.ok || data?.localMode)) {
    if (data?.updatedAt) noteServerSync(workspace.id, data.updatedAt);
    return true;
  }
  return false;
}

/**
 * Pull the user's server-side workspaces. Returns null when local-only mode
 * (no session / offline / server says localMode / failure) so callers keep the
 * local copy unchanged.
 */
export async function pullWorkspaces(): Promise<{ workspaceId: string; data: TextbookWorkspace; updatedAt: string }[] | null> {
  const session = getSession();
  if (!session || !isOnline()) return null;
  const res = await authedJson<{ localMode?: boolean; workspaces?: { workspaceId: string; data: TextbookWorkspace; updatedAt: string }[] }>(
    '/api/me/workspaces'
  );
  if (!res.ok || res.data?.localMode || !Array.isArray(res.data?.workspaces)) return null;
  return res.data.workspaces;
}

/** Record an append-only study event (progress, quiz, feynman, flashcard...). */
export async function recordStudyEvent(event: {
  workspaceId?: string;
  unitId?: string;
  nodeId?: string;
  eventType: string;
  payload?: unknown;
}): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  const res = await authedJson<{ ok?: boolean }>('/api/me/study-events', {
    method: 'POST',
    payload: event
  });
  return Boolean(res.ok && (res.data as any)?.ok);
}

/** Read a magic-link token out of the URL (?token=...) and consume it. */
export function extractMagicToken(url: string): string | null {
  try {
    return new URL(url).searchParams.get('token');
  } catch {
    return null;
  }
}