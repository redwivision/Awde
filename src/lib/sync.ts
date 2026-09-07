// Frontend server-side sync for Awde accounts.
//
// Design:
// - Authentication uses an HttpOnly cookie set by the server on magic-link
//   exchange. The token NEVER touches JavaScript (not in localStorage, not in
//   the fetch response), so an XSS can't steal it.
// - This module keeps only a lightweight, non-secret session hint
//   ({ email, user }) in localStorage so the UI knows who is logged in without
//   a network round-trip. API calls send the cookie automatically.
// - Every API call here is offline-safe: it reuses the resilient postJson/get
//   helpers and silently no-ops when there is no session or no network, so the
//   app keeps working purely in local mode (localStorage) exactly as before.
// - Workspace sync is "last writer wins" keyed on workspace.id, merging server
//   rows onto local state when the app starts.

import { postJson, isOnline } from './api';
import { authClient } from './betterAuthClient';
import type { TextbookWorkspace } from '../types';

export interface Session {
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
    return parsed && parsed.email ? parsed : null;
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

// A compact async fetch wrapper. Credentials are sent via the HttpOnly
// session cookie (no Authorization header — the token never touches JS).
async function authedJson<T = unknown>(url: string, init: { method?: string; payload?: unknown } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(url, {
    method: init.method || 'GET',
    headers,
    body: init.payload !== undefined ? JSON.stringify(init.payload) : undefined,
    signal: undefined,
    credentials: 'include'
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
    // The server sets an HttpOnly cookie; we never see the token itself.
    const res = await fetch(`/api/auth/confirm?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok && data.success && data.user?.email) {
      const session: Session = { email: data.user.email, user: data.user };
      saveSession(session);
      return { ok: true, session };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/** Revoke the session server-side and sign out locally. */
export async function logout(): Promise<void> {
  try {
    await authClient.signOut({});
  } catch {
    /* best-effort — the legacy call below also signs out */
  }
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    /* best-effort — still clear locally */
  }
  clearSession();
  clearSyncMeta();
}

/**
 * Whether the server offers Google OAuth login (published by
 * GET /api/auth/providers — booleans only, never secrets). Lets the UI hide
 * the Google button when OAuth isn't configured on the server.
 */
export async function googleAuthAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/providers', { credentials: 'include' });
    const data = await res.json();
    return Boolean(data?.google);
  } catch {
    return false;
  }
}

/**
 * Adopt an existing Google (Better Auth) session into the local (non-secret)
 * session hint. Called on app mount so a returning OAuth user is shown as
 * signed in and their workspaces load. Never clears a local session when no
 * Better Auth session exists — magic-link users don't have one.
 */
export async function syncServerSession(): Promise<void> {
  try {
    const { data } = await authClient.getSession({ query: { disableCookieCache: false, disableRefresh: false } });
    const user = data?.user;
    if (!user?.email) return;
    const current = getSession();
    if (current?.email === user.email) return;
    saveSession({
      email: user.email,
      user: { id: user.id, email: user.email, role: 'student' }
    });
  } catch {
    /* offline — leave any existing local hint untouched */
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

// ---------- Study activity log (local-first, server-backed when signed in) ----------

/**
 * One entry in the student's study history — a quiz, a Feynman attempt, a node
 * marked learned, a blurting sprint, or a completed focus session.
 *
 * The log is written to localStorage FIRST (works offline, no account needed)
 * and then pushed to the server when a session exists, so signed-in users get a
 * cross-device history while local-only users keep a private on-device one.
 */
export interface StudyActivity {
  id?: string;
  ts?: number;                    // epoch ms
  eventType: 'quiz' | 'feynman' | 'mastery' | 'blurting' | 'focus' | 'flashcard';
  workspaceId?: string;
  unitId?: string;
  unitTitle?: string;
  nodeId?: string;
  nodeLabel?: string;
  score?: number;                 // 0-100 (quiz %, Feynman clarity)
  accuracy?: number;              // 0-100 (blurting recall)
  seconds?: number;               // focus session length
  meta?: Record<string, unknown>;
}

export const STUDY_EVENTS_KEY = 'awde_study_events_v1';
const STUDY_EVENTS_MAX = 500;

/** Record an activity locally and, when signed in, push it to the server. */
export function recordStudyActivity(activity: StudyActivity): void {
  try {
    const raw = localStorage.getItem(STUDY_EVENTS_KEY);
    const list: StudyActivity[] = raw ? (JSON.parse(raw) as StudyActivity[]) : [];
    const next = [
      { ...activity, id: activity.id || 'act_' + Date.now(), ts: activity.ts || Date.now() },
      ...list
    ].slice(0, STUDY_EVENTS_MAX);
    localStorage.setItem(STUDY_EVENTS_KEY, JSON.stringify(next));
  } catch {
    /* best-effort — never break the study flow over a log write */
  }
  void pushStudyEvent(activity);
}

/** The on-device log, newest first. Enough for the Progress tab + streak. */
export function getStudyActivities(limit = 300): StudyActivity[] {
  try {
    const raw = localStorage.getItem(STUDY_EVENTS_KEY);
    const list: StudyActivity[] = raw ? (JSON.parse(raw) as StudyActivity[]) : [];
    return Array.isArray(list) ? list.slice(0, limit) : [];
  } catch {
    return [];
  }
}

/** Push one activity to the server. Offline / local mode silently no-ops. */
async function pushStudyEvent(activity: StudyActivity): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  const res = await authedJson<{ ok?: boolean; error?: string }>('/api/me/study-events', {
    method: 'POST',
    payload: {
      eventType: activity.eventType,
      workspaceId: activity.workspaceId || undefined,
      unitId: activity.unitId || undefined,
      nodeId: activity.nodeId || undefined,
      payload: activity
    }
  });
  return Boolean(res.ok && (res.data as any)?.ok);
}

/**
 * The server's copy of this user's study history (newest first). Returns null
 * when there is no session, the device is offline, or the server has none —
 * callers simply fall back to the localStorage log.
 */
export async function pullStudyActivities(limit = 300): Promise<StudyActivity[] | null> {
  const session = getSession();
  if (!session || !isOnline()) return null;
  const res = await authedJson<{ activities?: StudyActivity[] }>(`/api/me/study-events?limit=${limit}`);
  if (!res.ok || !Array.isArray(res.data?.activities)) return null;
  return res.data.activities;
}

// ---------- Read-only workspace share links ----------

/**
 * Create a signed read-only share link for a server-side workspace. Requires a
 * session: the owner's identity keys the signature and the server row is looked
 * up by (userId, workspaceId), so only workspaces actually on the server can be
 * shared (local-only workspaces stay private to the device).
 */
export async function createShareLink(workspaceId: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = getSession();
  if (!session) return { ok: false, error: 'auth' };
  const res = await authedJson<{ ok?: boolean; share?: { userId: string; workspaceId: string; sig: string }; error?: string }>(
    '/api/share/create',
    { method: 'POST', payload: { workspaceId } }
  );
  const d = res.data as any;
  if (!res.ok || !d?.share) return { ok: false, error: d?.error || 'share-failed' };
  const base = `${window.location.origin}${window.location.pathname}`;
  const url = `${base}?share=1&user=${encodeURIComponent(d.share.userId)}&id=${encodeURIComponent(d.share.workspaceId)}&sig=${encodeURIComponent(d.share.sig)}`;
  return { ok: true, url };
}

/** Whether the current URL is a read-only share of a workspace. */
export function readShareParams(url: string): { user: string; id: string; sig: string } | null {
  try {
    const params = new URLSearchParams(new URL(url).search);
    if (params.get('share') !== '1') return null;
    const user = params.get('user') || '';
    const id = params.get('id') || '';
    const sig = params.get('sig') || '';
    if (!user || !id || !sig) return null;
    return { user, id, sig };
  } catch {
    return null;
  }
}

/** Read a magic-link token out of the URL (?token=...) and consume it. */
export function extractMagicToken(url: string): string | null {
  try {
    return new URL(url).searchParams.get('token');
  } catch {
    return null;
  }
}