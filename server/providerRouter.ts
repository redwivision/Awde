// Shared multi-provider AI router.
//
// Every AI endpoint routes through this one function so a request tries ALL
// configured providers (Gemini → Groq → NVIDIA) before giving up and running
// the deterministic offline fallback. This is what makes the free tier
// resilient: one dead/expired key never bricks the app, and any working key
// still produces a real (non-canned) answer.
//
// Provider health is tracked with a tiny circuit breaker: a provider that
// fails several times in a row is skipped for a cooldown window so we stop
// burning latency on a known-dead key, then gets retried automatically.
//
// Design notes:
// - Every provider call is bounded by its own timeout (never block a student).
// - Gemini speaks native JSON schema; Groq + NVIDIA speak OpenAI-compatible
//   chat-completions (plain fetch, no extra SDK).
// - The caller provides `fallback` — a deterministic offline generator run as
//   the last resort. The router returns `provider: null` in that case so
//   routes can report `isFallback: true` and skip caching.
import {
  getGeminiClient,
  getGroqApiKey,
  getNvidiaApiKey,
  GROQ_BASE_URL,
  GROQ_TT_MODEL,
  NVIDIA_BASE_URL,
  NVIDIA_TT_MODEL,
  withTimeout,
  AI_TIMEOUT_MS
} from './ai';

export type AiProviderName = 'gemini' | 'groq' | 'nvidia';

export interface AiRouterRequest {
  // Logging label for the kind of generation (e.g. 'mindmap', 'quiz').
  label: string;
  systemPrompt: string;
  prompt: string;
  // Gemini's responseSchema (built by the caller with `Type` from @google/genai).
  geminiSchema: unknown;
  geminiModel?: string;
  // Output token budget for the OpenAI-compatible providers.
  maxTokens?: number;
  // Per-provider deadline; defaults to the shared AI_TIMEOUT_MS.
  timeoutMs?: number;
  // Hard cap on the WHOLE provider chain. Without it, three hung providers
  // would each burn their per-call timeout before the offline fallback runs
  // (9s x 3 = 27s worst case). Defaults to OVERALL_CHAIN_TIMEOUT_MS.
  overallTimeoutMs?: number;
  // Deterministic generator invoked when every provider fails or is unset.
  fallback: () => unknown;
}

export interface AiRouterResult {
  data: any;
  provider: AiProviderName | null; // null => fallback generator was used
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.7-flash';

// Cap on the entire fallback chain (all providers combined). Kept above a
// single provider's timeout so one normal attempt fits, but below 3x so a
// slow/derped provider can't make a student wait half a minute.
export const OVERALL_CHAIN_TIMEOUT_MS = 12_000;

// Provider fail-fast order. Gemini is primary; Groq/NVIDIA are the resilience
// layer. Health tracking re-orders which one actually answers at runtime.
const PROVIDER_ORDER: AiProviderName[] = ['gemini', 'groq', 'nvidia'];

// Circuit-breaker tuning: 3 consecutive failures triples the breaker for
// CIRCUIT_COOLDOWN_MS, then it re-arms automatically.
const CIRCUIT_TRIP_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 60_000;

interface ProviderHealth {
  failures: number;
  retryAt: number;
}

const healthState: Record<AiProviderName, ProviderHealth> = {
  gemini: { failures: 0, retryAt: 0 },
  groq: { failures: 0, retryAt: 0 },
  nvidia: { failures: 0, retryAt: 0 }
};

function shouldTryProvider(name: AiProviderName): boolean {
  return Date.now() >= healthState[name].retryAt;
}

function recordFailure(name: AiProviderName): void {
  const h = healthState[name];
  h.failures += 1;
  if (h.failures >= CIRCUIT_TRIP_THRESHOLD) {
    h.retryAt = Date.now() + CIRCUIT_COOLDOWN_MS;
  }
}

function recordSuccess(name: AiProviderName): void {
  const h = healthState[name];
  h.failures = 0;
  h.retryAt = 0;
}

/** Reset circuit-breaker state (used by tests and settings changes). */
export function resetProviderHealth(): void {
  for (const name of PROVIDER_ORDER) {
    healthState[name] = { failures: 0, retryAt: 0 };
  }
}

function providerConfigured(name: AiProviderName): boolean {
  switch (name) {
    case 'gemini':
      return getGeminiClient() !== null;
    case 'groq':
      return getGroqApiKey() !== null;
    case 'nvidia':
      return getNvidiaApiKey() !== null;
  }
}

/**
 * Extract the first complete JSON value (object or array) from a raw model
 * response. Models occasionally wrap output in markdown fences or prefix text,
 * so we scan rather than JSON.parse the whole string.
 */
export function extractJson(raw: string): any {
  const cleaned = String(raw || '').replace(/```json|```/gi, '').trim();
  if (cleaned.startsWith('[')) {
    const end = cleaned.lastIndexOf(']');
    if (end > 0) return JSON.parse(cleaned.slice(0, end + 1));
    throw new Error('No JSON found in model output');
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  throw new Error('No JSON found in model output');
}

async function callGemini(req: AiRouterRequest, timeoutMs: number): Promise<any> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('gemini not configured');
  const response = await withTimeout(
    ai.models.generateContent({
      model: req.geminiModel || DEFAULT_GEMINI_MODEL,
      contents: req.prompt,
      config: {
        systemInstruction: req.systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: req.geminiSchema as any
      }
    }),
    timeoutMs
  );
  return extractJson(response.text || '{}');
}

// OpenAI-compatible chat-completions call shared by Groq and NVIDIA NIM.
async function callOpenAiCompat(
  baseUrl: string,
  model: string,
  apiKey: string,
  name: AiProviderName,
  req: AiRouterRequest,
  timeoutMs: number
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.prompt }
        ],
        temperature: 0.4,
        max_tokens: req.maxTokens ?? 3000
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${name} HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as any;
    const msg = data?.choices?.[0]?.message || {};
    // Some models stream their answer into `reasoning` rather than `content`.
    const raw = (msg.content || msg.reasoning || '{}') as string;
    return extractJson(raw);
  } finally {
    clearTimeout(timer);
  }
}

async function callProvider(name: AiProviderName, req: AiRouterRequest, timeoutMs: number): Promise<any> {
  switch (name) {
    case 'gemini':
      return callGemini(req, timeoutMs);
    case 'groq': {
      const apiKey = getGroqApiKey();
      if (!apiKey) throw new Error('groq not configured');
      return callOpenAiCompat(GROQ_BASE_URL, GROQ_TT_MODEL, apiKey, name, req, timeoutMs);
    }
    case 'nvidia': {
      const apiKey = getNvidiaApiKey();
      if (!apiKey) throw new Error('nvidia not configured');
      return callOpenAiCompat(NVIDIA_BASE_URL, NVIDIA_TT_MODEL, apiKey, name, req, timeoutMs);
    }
  }
}

/**
 * Generate content through the provider chain. Guaranteed to resolve: on total
 * failure the deterministic `fallback` generator runs instead so an AI call
 * can never 500 a student.
 */
export async function callAiWithFallback(req: AiRouterRequest): Promise<AiRouterResult> {
  const perProviderMs = req.timeoutMs ?? AI_TIMEOUT_MS;
  const overallMs = req.overallTimeoutMs ?? OVERALL_CHAIN_TIMEOUT_MS;
  const deadline = Date.now() + overallMs;
  for (const name of PROVIDER_ORDER) {
    if (!providerConfigured(name)) continue;
    if (!shouldTryProvider(name)) continue;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const timeoutMs = Math.max(1, Math.min(perProviderMs, remaining));
    try {
      const data = await callProvider(name, req, timeoutMs);
      recordSuccess(name);
      return { data, provider: name };
    } catch (err) {
      recordFailure(name);
      console.error(`[ai-provider:${name}] ${req.label} request failed:`, err instanceof Error ? err.message : err);
    }
  }
  return { data: await req.fallback(), provider: null };
}