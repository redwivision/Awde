import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { postJson } from '../src/lib/api';

const realFetch = globalThis.fetch;

function mockFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = vi.fn(impl) as any;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('postJson (weak-wifi / offline-safe client fetch)', () => {
  it('returns parsed JSON with ok:true on a 200 response', async () => {
    mockFetch(async () => new Response(JSON.stringify({ success: true, isFallback: false, data: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
    const r = await postJson<{ success: boolean; isFallback: boolean; data: number }>('/api/quiz/generate', { topic: 'X' });
    expect(r.ok).toBe(true);
    expect(r.isFallback).toBe(false);
    expect(r.data.data).toBe(1);
  });

  it('treats fallback responses (no key) as ok', async () => {
    mockFetch(async () => new Response(JSON.stringify({ success: true, isFallback: true }), { status: 200 }));
    const r = await postJson('/api/mindmap/generate', {});
    expect(r.ok).toBe(true);
    expect(r.isFallback).toBe(true);
  });

  it('does NOT throw on an HTTP error status — returns ok:false with the body', async () => {
    mockFetch(async () => new Response(JSON.stringify({ error: 'boom' }), { status: 500 }));
    const r = await postJson('/api/x', {});
    expect(r.ok).toBe(false);
    expect(r.status).toBe(500);
    expect((r.data as any).error).toBe('boom');
  });

  it('sends JSON body and content-type header', async () => {
    let captured: RequestInit | undefined;
    mockFetch(async (_i, init) => {
      captured = init;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    await postJson('/api/x', { topic: 'T' });
    expect(captured!.method).toBe('POST');
    expect(captured!.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(captured!.body as string)).toEqual({ topic: 'T' });
  });

  it('retries once on a network error then succeeds (flaky wifi recovery)', async () => {
    const calls: string[] = [];
    mockFetch(async (_i, init) => {
      calls.push('call');
      if (calls.length === 1) {
        throw new TypeError('Failed to fetch'); // offline first attempt
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    const r = await postJson('/api/x', {}, { retries: 1 });
    expect(r.ok).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('aborts a request that exceeds the timeout and returns a network-failure result (does not throw)', async () => {
    vi.useFakeTimers();
    mockFetch((_i, init) => {
      // Return a promise that never resolves on its own; abort triggers rejection.
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }
      });
    });

    const assertionPromise = (async () => {
      const p = postJson('/api/x', {}, { timeoutMs: 1000, retries: 0 });
      await vi.advanceTimersByTimeAsync(1100);
      const r = await p;
      expect(r.ok).toBe(false);
      expect(r.status).toBe(0);
      expect((r.data as any).error).toBe('network');
    })();
    await assertionPromise;
  });

  it('returns ok:false (does not throw) after exhausting retries when the network stays down', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    const r = await postJson('/api/x', {}, { retries: 2, timeoutMs: 100 });
    expect(r.ok).toBe(false);
    expect((r.data as any).error).toBe('network');
  });

  it('short-circuits instantly (offline error, no fetch) when the device is offline', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }));
    mockFetch(fetchSpy as any);
    // Simulate navigator being offline by redefining the onLine getter.
    const original = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    try {
      const r = await postJson('/api/x', {});
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(r.ok).toBe(false);
      expect(r.status).toBe(0);
      expect((r.data as any).error).toBe('offline');
    } finally {
      if (original) Object.defineProperty(navigator, 'onLine', original);
      else delete (navigator as any).onLine;
    }
  });
});