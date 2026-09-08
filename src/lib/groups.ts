// Client-side helpers for opt-in study groups (consent-first, anonymous).
//
// Mirrors the resilient `authedJson` pattern in sync.ts: requests send the
// HttpOnly session cookie, no-op when there's no session/network, and none of
// these functions throw — the UI is always safe to call them offline.
//
// Anonymity contract: a member is only ever represented by the display name
// they chose when joining. The roster/insights endpoints never return the real
// email. Leaving a group deletes the membership, so that user's study events
// immediately stop being included.

export interface StudyGroup {
  id: string;
  name: string;
  code: string;
  owner: boolean;
  joined: boolean;
}

export interface GroupRosterMember {
  userId: null; // intentionally null — anonymity is the contract
  displayName: string;
  joinedAt: string;
  agg: {
    totalEvents: number;
    quizAvg: number | null;
    mastery: number | null;
    focusMins: number;
    streak: number;
  };
}

export interface GroupInsightConcept {
  unitTitle: string;
  attempts: number;
  avgScore: number;
  difficulty: number; // 0-100, higher = students found it harder
}

export interface GroupResponse {
  ok?: boolean;
  localMode?: boolean;
  error?: string;
  group?: StudyGroup;
  groups?: StudyGroup[];
  members?: GroupRosterMember[];
  memberCount?: number;
  concepts?: GroupInsightConcept[];
  deleted?: boolean;
}

async function authedJson<T = unknown>(url: string, init: { method?: string; payload?: unknown } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const res = await fetch(url, {
    method: init.method || 'GET',
    headers,
    body: init.payload !== undefined ? JSON.stringify(init.payload) : undefined,
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

async function attempt<T extends GroupResponse>(url: string, init: { method?: string; payload?: unknown } = {}) {
  try {
    return await authedJson<T>(url, init);
  } catch {
    return { ok: false, status: 0, data: { error: 'Offline — could not reach the server.' } as T };
  }
}

export async function createGroup(name: string): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>('/api/groups', { method: 'POST', payload: { name } });
  return { ok: res.ok, data: res.data };
}

export async function listGroups(): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>('/api/groups');
  return { ok: res.ok, data: res.data };
}

export async function joinGroup(code: string, displayName: string): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>('/api/groups/join', { method: 'POST', payload: { code, displayName } });
  return { ok: res.ok, data: res.data };
}

export async function fetchRoster(groupId: string): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>(`/api/groups/${encodeURIComponent(groupId)}/roster`);
  return { ok: res.ok, data: res.data };
}

export async function fetchInsights(groupId: string): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>(`/api/groups/${encodeURIComponent(groupId)}/insights`);
  return { ok: res.ok, data: res.data };
}

export async function leaveGroup(groupId: string): Promise<{ ok: boolean; data?: GroupResponse }> {
  const res = await attempt<GroupResponse>(`/api/groups/${encodeURIComponent(groupId)}/leave`, { method: 'POST' });
  return { ok: res.ok, data: res.data };
}