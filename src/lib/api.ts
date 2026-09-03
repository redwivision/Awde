// Weak-wifi / offline-safe fetch helper for the AI endpoints.
//
// Browsers give fetch() a very long default timeout (often minutes), so on a
// weak or congested network a request can hang, leaving UI spinners stuck and
// blocking the student. This helper:
//   1. detects when the device is offline and short-circuits instantly (no hang),
//   2. aborts the request after `timeoutMs` (default 12s),
//   3. retries up to `retries` times on network/timeout failures,
//   4. never throws on an HTTP error status — it returns the parsed body
//      (usually { error }) so callers can degrade gracefully,
//   5. returns an OFFLINE/network result rather than rejecting, so callers that
//      only read `.ok`/`.data` (and don't wrap in try/catch) still behave safely.

import { useEffect, useState } from 'react';

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  isFallback: boolean;
}

// Sentinel error payloads the UI can recognize to show a friendly message.
export const OFFLINE_ERROR = 'offline';
export const NETWORK_ERROR = 'network';

// True when the device is known to be offline. Defaults to "online" to avoid
// false positives in SSR / non-browser environments or before hydration.
export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

// React hook: live device online/offline status (window offline/online events).
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(isOnline());
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function offlineResult<T>(): ApiResult<T> {
  return {
    ok: false,
    status: 0,
    data: { error: OFFLINE_ERROR } as unknown as T,
    isFallback: false
  };
}

function networkResult<T>(): ApiResult<T> {
  return {
    ok: false,
    status: 0,
    data: { error: NETWORK_ERROR } as unknown as T,
    isFallback: false
  };
}

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  options: { timeoutMs?: number; retries?: number } = {}
): Promise<ApiResult<T>> {
  const { timeoutMs = 8000, retries = 1 } = options;

  // If the device is already disconnected, fail fast instead of waiting on a
  // request that cannot succeed. No spinner hang.
  if (!isOnline()) return offlineResult<T>();

  let lastStatus = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timer);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      lastStatus = res.status;
      if (res.ok) {
        return { ok: true, status: res.status, data: data as T, isFallback: Boolean(data?.isFallback) };
      }
      // Server responded but with an error status — don't retry (not a network issue).
      return { ok: false, status: res.status, data: data as T, isFallback: false };
    } catch (err: any) {
      clearTimeout(timer);
      // Only retry on network/abort errors (timeout, offline, DNS).
      const isNetwork = err?.name === 'AbortError' || err?.name === 'TypeError' || err?.type === 'network';
      if (attempt < retries && isNetwork) {
        // If we went offline mid-request, bail out now rather than retrying.
        if (!isOnline()) return offlineResult<T>();
        await sleep(300 * (attempt + 1)); // small backoff
        continue;
      }
      return isNetwork ? (isOnline() ? networkResult<T>() : offlineResult<T>()) : networkResult<T>();
    }
  }

  // Unreachable in practice; kept to satisfy the return type.
  return networkResult<T>();
}

// Multipart (file upload) variant of postJson, used for PDFs. Same weak-wifi
// guarantees: aborts after timeoutMs, fails fast when offline, never throws on
// HTTP errors.
export async function postFormData<T = unknown>(
  url: string,
  form: FormData,
  options: { timeoutMs?: number } = {}
): Promise<ApiResult<T>> {
  const { timeoutMs = 60000 } = options; // file upload + AI build can be slow

  if (!isOnline()) return offlineResult<T>();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: form, // browser sets multipart boundary automatically
      signal: controller.signal
    });
    clearTimeout(timer);
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok) {
      return { ok: true, status: res.status, data: data as T, isFallback: Boolean(data?.isFallback) };
    }
    return { ok: false, status: res.status, data: data as T, isFallback: false };
  } catch (err: any) {
    clearTimeout(timer);
    return (!isOnline() ? offlineResult<T>() : networkResult<T>());
  }
}
