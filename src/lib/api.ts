// Weak-wifi / offline-safe fetch helper for the AI endpoints.
//
// Browsers give fetch() a very long default timeout (often minutes), so on a
// weak or congested network a request can hang, leaving UI spinners stuck and
// blocking the student. This helper:
//   1. aborts the request after `timeoutMs` (default 12s),
//   2. retries up to `retries` times on network/timeout failures,
//   3. never throws on an HTTP error status — it returns the parsed body
//      (usually { error }) so callers can degrade gracefully,
//   4. rejects only after exhausting retries, so the UI can show a friendly
//      offline message.

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  isFallback: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  options: { timeoutMs?: number; retries?: number } = {}
): Promise<ApiResult<T>> {
  const { timeoutMs = 12000, retries = 1 } = options;

  let lastStatus = 0;
  let lastBody: unknown = null;

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
      lastBody = data;
      if (res.ok) {
        return { ok: true, status: res.status, data: data as T, isFallback: Boolean(data?.isFallback) };
      }
      // Server responded but with an error status — don't retry (not a network issue).
      return { ok: false, status: res.status, data: data as T, isFallback: false };
    } catch (err: any) {
      clearTimeout(timer);
      // Only retry on network/abort errors (timeout, offline, DNS). Non-retryable.
      const isNetwork = err?.name === 'AbortError' || err?.name === 'TypeError' || err?.type === 'network';
      if (attempt < retries && isNetwork) {
        await sleep(300 * (attempt + 1)); // small backoff
        continue;
      }
      throw err;
    }
  }

  // Unreachable in practice; kept to satisfy the return type.
  throw new Error(`Request to ${url} failed with status ${lastStatus}`);
}