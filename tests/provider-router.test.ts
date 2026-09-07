import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callAiWithFallback, extractJson, resetProviderHealth } from '../server/providerRouter';

const baseRequest = {
  label: 'test',
  systemPrompt: 'Output JSON.',
  prompt: 'Do the thing.',
  geminiSchema: {}
};

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  resetProviderHealth();
});

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.NVIDIA_API_KEY;
  vi.unstubAllGlobals();
});

describe('extractJson', () => {
  it('parses a plain JSON object', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a top-level JSON array (quiz shape)', () => {
    expect(extractJson('[{"a":1},{"a":2}]')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it('strips markdown fences', () => {
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });

  it('scans past a leading prose prefix', () => {
    expect(extractJson('Here is your JSON: {"a":3}')).toEqual({ a: 3 });
  });

  it('throws when there is no JSON at all', () => {
    expect(() => extractJson('no structured output here')).toThrow();
  });
});

describe('callAiWithFallback (offline/no-key resolve)', () => {
  it('falls back to the deterministic generator when no provider is configured', async () => {
    const fallback = vi.fn(() => ({ offline: true }));
    const result = await callAiWithFallback({ ...baseRequest, fallback });
    expect(result.provider).toBeNull();
    expect(result.data).toEqual({ offline: true });
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('uses Groq and parses its JSON when Gemini/NVIDIA are unconfigured', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({
          choices: [{ message: { content: '{"answer":"forty-two"}' } }]
        })
      })
    );

    const fallback = vi.fn(() => ({ answer: 'offline' }));
    const result = await callAiWithFallback({ ...baseRequest, fallback });
    expect(result.provider).toBe('groq');
    expect(result.data).toEqual({ answer: 'forty-two' });
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back when the only configured provider errors', async () => {
    process.env.GROQ_API_KEY = 'bad-key';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unreachable')));

    const fallback = () => ({ answer: 'offline' });
    const result = await callAiWithFallback({ ...baseRequest, fallback });
    expect(result.provider).toBeNull();
    expect(result.data).toEqual({ answer: 'offline' });
  });

  it('receives non-OK responses as provider failures (never leaks raw error)', async () => {
    process.env.GROQ_API_KEY = 'bad-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
        json: async () => ({})
      })
    );

    const fallback = () => ({ answer: 'offline' });
    const result = await callAiWithFallback({ ...baseRequest, fallback });
    expect(result.provider).toBeNull();
    expect(result.data.answer).toBe('offline');
  });
});

describe('overall chain deadline', () => {
  it('stops trying further providers once the chain budget is exhausted', async () => {
    process.env.GROQ_API_KEY = 'slow-key';
    process.env.NVIDIA_API_KEY = 'other-key';
    // Fetch that only resolves when aborted by the per-call timeout. With an
    // overall budget of 1ms, only the first provider should ever be attempted
    // before the loop gives up and falls back.
    const fetches: Array<{ url: string; signal: AbortSignal }> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: { signal: AbortSignal }) => {
        fetches.push({ url, signal: init.signal });
        return new Promise<Response>((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        });
      })
    );

    const fallback = () => ({ answer: 'offline' });
    const result = await callAiWithFallback({ ...baseRequest, fallback, overallTimeoutMs: 1 });

    expect(result.provider).toBeNull();
    expect(result.data).toEqual({ answer: 'offline' });
    expect(fetches).toHaveLength(1);
  });

  it('shrinks the per-provider budget to whatever the chain has left', async () => {
    process.env.GROQ_API_KEY = 'dwindling-key';
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: { signal: AbortSignal }) => {
        return new Promise<Response>((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')));
        });
      })
    );

    const fallback = () => ({ answer: 'offline' });
    // overallTimeoutMs negative-infinite would immediately give up; a tiny
    // positive overall still lets provider 1 attempt with a capped budget.
    const result = await callAiWithFallback({ ...baseRequest, fallback, overallTimeoutMs: 25 });
    expect(result.provider).toBeNull();
  });
});

describe('circuit breaker', () => {
  it('stops hammering a provider after repeated failures, then recovers on reset', async () => {
    process.env.GROQ_API_KEY = 'flaky-key';
    const fetchMock = vi.fn().mockRejectedValue(new Error('down'));
    vi.stubGlobal('fetch', fetchMock);
    const fallback = () => ({ answer: 'offline' });

    // 3 failures trip the breaker for the cooldown window.
    for (let i = 0; i < 3; i++) {
      await callAiWithFallback({ ...baseRequest, fallback });
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // While tripped, the provider is skipped entirely (no additional fetches).
    await callAiWithFallback({ ...baseRequest, fallback });
    await callAiWithFallback({ ...baseRequest, fallback });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Resetting health re-arms the provider.
    resetProviderHealth();
    await callAiWithFallback({ ...baseRequest, fallback });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});