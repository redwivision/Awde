import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// The server-authoritative pieces are covered by the API integration suites;
// this file pins the CLIENT-side invariants that had no coverage at all:
// session hint lifecycle, sync metadata, share-link parsing, the study-event
// log, and the offline-safe push/pull/delete flows.

// Replace the Better Auth React client — it touches browser APIs at import time.
vi.mock('../src/lib/betterAuthClient', () => ({
  authClient: { signOut: vi.fn().mockResolvedValue({ data: null, error: null }), getSession: vi.fn() },
  googleSignIn: vi.fn()
}));

const storage = new Map<string, string>();

(globalThis as any).localStorage = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => storage.set(k, String(v)),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear()
};

const dispatchSpy = vi.fn();
(globalThis as any).window = {
  dispatchEvent: dispatchSpy,
  location: { origin: 'http://localhost:3000', pathname: '/' },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};
// Node 22+ defines globalThis.navigator as a getter-only property.
Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  configurable: true,
  writable: true
});

import {
  getSession,
  saveSession,
  clearSession,
  SESSION_EVENT,
  noteServerSync,
  isServerSynced,
  readShareParams,
  extractMagicToken,
  recordStudyActivity,
  getStudyActivities,
  deleteAccount,
  logout,
  confirmLogin,
  requestLogin,
  pushWorkspace,
  pullWorkspaces,
  googleAuthAvailable
} from '../src/lib/sync';

beforeEach(() => {
  storage.clear();
  dispatchSpy.mockClear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('session hint (localStorage, non-secret)', () => {
  it('round-trips a saved session', () => {
    expect(getSession()).toBeNull();
    saveSession({ email: 'a@b.com', user: { id: 'u1', email: 'a@b.com', role: 'student' } });
    expect(getSession()?.email).toBe('a@b.com');
    clearSession();
    expect(getSession()).toBeNull();
  });

  it('fires a session-change event on save and clear', () => {
    saveSession({ email: 'a@b.com' });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: SESSION_EVENT }));
    dispatchSpy.mockClear();
    clearSession();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null for missing/corrupt/hostless stored values', () => {
    storage.set('awde_session', 'not json');
    expect(getSession()).toBeNull();
    storage.set('awde_session', JSON.stringify({ user: { email: 'x' } }));
    expect(getSession()).toBeNull();
  });
});

describe('readShareParams', () => {
  it('extracts a valid read-only share signature set', () => {
    const p = readShareParams('http://localhost:3000/?share=1&user=u1&id=b1&sig=abc');
    expect(p).toEqual({ user: 'u1', id: 'b1', sig: 'abc' });
  });

  it('requires share=1 and all three params', () => {
    expect(readShareParams('http://localhost:3000/?user=u1&id=b1&sig=abc')).toBeNull();
    expect(readShareParams('http://localhost:3000/?share=1&user=u1&id=b1')).toBeNull();
    expect(readShareParams('http://localhost:3000/?share=0&user=u1&id=b1&sig=abc')).toBeNull();
  });

  it('is null-safe on a malformed URL', () => {
    expect(readShareParams('not a url')).toBeNull();
  });
});

describe('extractMagicToken', () => {
  it('pulls the token out of the app URL', () => {
    expect(extractMagicToken('http://localhost:3000/?token=sekrit')).toBe('sekrit');
  });

  it('returns null when absent or unparsable', () => {
    expect(extractMagicToken('http://localhost:3000/?x=1')).toBeNull();
    expect(extractMagicToken('::::not-url::::')).toBeNull();
  });
});

describe('sync metadata', () => {
  it('records and recognizes a server sync timestamp', () => {
    expect(isServerSynced('w1', '2026-01-01T00:00:00.000Z')).toBe(false);
    noteServerSync('w1', '2026-01-01T00:00:00.000Z');
    expect(isServerSynced('w1', '2026-01-01T00:00:00.000Z')).toBe(true);
  });

  it('treats an older local copy as unsynced', () => {
    noteServerSync('w2', '2026-01-02T00:00:00.000Z');
    expect(isServerSynced('w2', '2026-01-03T00:00:00.000Z')).toBe(false);
  });
});

describe('study activity log (local-first)', () => {
  it('records newest-first and reads back in order', () => {
    recordStudyActivity({ eventType: 'quiz', score: 90 });
    recordStudyActivity({ eventType: 'feynman', score: 80 });
    const list = getStudyActivities();
    expect(list[0].eventType).toBe('feynman');
    expect(list[1].eventType).toBe('quiz');
    expect(list[0].score).toBe(80);
    expect(list.every((e) => e.id && e.ts)).toBe(true);
  });

  it('caps the log at 500 entries', () => {
    for (let i = 0; i < 520; i++) recordStudyActivity({ eventType: 'quiz' });
    expect(getStudyActivities(500)).toHaveLength(500);
  });

  it('handles a corrupt/invalid stored log', () => {
    storage.set('awde_study_events_v1', '{"oops":true}');
    expect(getStudyActivities()).toEqual([]);
  });
});

describe('account deletion', () => {
  it('no-ops when there is no local session', async () => {
    expect(await deleteAccount()).toEqual({ ok: true });
  });

  it('calls /api/me and clears the session + sync meta on success', async () => {
    saveSession({ email: 'a@b.com' });
    noteServerSync('w1', 'now');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);

    const r = await deleteAccount();
    expect(r).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/me');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    expect(getSession()).toBeNull();
    expect(isServerSynced('w1', 'now')).toBe(false);
  });

  it('surfaces the server error and still signs out locally', async () => {
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'no' }) }));
    const r = await deleteAccount();
    expect(r).toEqual({ ok: false, error: 'no' });
    expect(getSession()).toBeNull();
  });

  it('honours a localMode server response', async () => {
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ localMode: true, ok: true }) }));
    expect(await deleteAccount()).toEqual({ ok: true, localMode: true });
  });
});

describe('login helpers', () => {
  it('requestLogin posts to /api/auth/login and returns the result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, emailSent: true }) }));
    const r = await requestLogin('a@b.com');
    expect(r.ok).toBe(true);
    expect(r.data).toMatchObject({ success: true, emailSent: true });
  });

  it('confirmLogin stores a session on success and stays clean on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, user: { id: 'u1', email: 'a@b.com' } })
    }));
    const r = await confirmLogin('tok');
    expect(r.ok).toBe(true);
    expect(getSession()?.email).toBe('a@b.com');

    storage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'expired' }) }));
    expect((await confirmLogin('bad')).ok).toBe(false);
    expect(getSession()).toBeNull();
  });
});

describe('logout', () => {
  it('clears the session and sync metadata', async () => {
    saveSession({ email: 'a@b.com' });
    noteServerSync('w1', 'now');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    await logout();
    expect(getSession()).toBeNull();
    expect(isServerSynced('w1', 'now')).toBe(false);
  });
});

describe('workspace push/pull', () => {
  it('pushWorkspace requires a session and returns false without one', async () => {
    expect(await pushWorkspace({ id: 'w1' } as any)).toBe(false);
  });

  it('pushWorkspace records sync meta when the server confirms', async () => {
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, updatedAt: '2026-02-02T00:00:00.000Z' })
    }));

    expect(await pushWorkspace({ id: 'w1' } as any)).toBe(true);
    expect(isServerSynced('w1', '2026-02-02T00:00:00.000Z')).toBe(true);
  });

  it('pushWorkspace drops the stale session on a 401', async () => {
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'expired' }) }));

    expect(await pushWorkspace({ id: 'w1' } as any)).toBe(false);
    expect(getSession()).toBeNull();
  });

  it('pullWorkspaces returns null without a session or on localMode', async () => {
    expect(await pullWorkspaces()).toBeNull();
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ localMode: true, workspaces: [] })
    }));
    expect(await pullWorkspaces()).toBeNull();
  });

  it('pullWorkspaces returns the server list when present', async () => {
    saveSession({ email: 'a@b.com' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ workspaces: [{ workspaceId: 'w1', data: { id: 'w1' }, updatedAt: 'now' }] })
    }));
    const list = await pullWorkspaces();
    expect(list).toHaveLength(1);
    expect(list![0].workspaceId).toBe('w1');
  });
});

describe('googleAuthAvailable', () => {
  it('reads the /api/auth/providers boolean', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ google: true, email: true }) }));
    expect(await googleAuthAvailable()).toBe(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await googleAuthAvailable()).toBe(false);
  });
});