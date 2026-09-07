// Server-side secret access — the single place every API key is read.
//
// Production-grade rules enforced here:
// - Keys are read from the process environment ONLY (Render secrets with
//   `sync: false`, or `.env` for local dev). They are never embedded in code,
//   written to disk, or sent to the browser.
// - Keys are NEVER logged. We only print provider NAMES, so a rotated or
//   compromised key can never leak into logs, error text, or support dumps.
// - A missing or blank value counts as "not configured" (null), so an empty
//   string can't half-enable a provider at runtime.
// - Rotation is a config change + restart: set the new value, restart. The
//   multi-provider chain absorbs the gap — traffic falls through to the next
//   provider and the circuit breaker skips the dead key until re-armed.

const PROVIDER_REGISTRY: ReadonlyArray<{ name: string; envVar: string }> = [
  { name: 'openrouter', envVar: 'OPENROUTER_API_KEY' },
  { name: 'groq', envVar: 'GROQ_API_KEY' },
  { name: 'nvidia', envVar: 'NVIDIA_API_KEY' }
];

/** Read a secret from the environment; null when unset or blank. */
export function getSecret(envVar: string): string | null {
  const value = process.env[envVar];
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Names of the AI providers that currently hold a valid key. */
export function listConfiguredProviders(): string[] {
  return PROVIDER_REGISTRY.filter(({ envVar }) => getSecret(envVar) !== null).map(({ name }) => name);
}

/**
 * Boot-time provider status log. Prints NAMES ONLY — never a key, never part of
 * one. In production an empty chain logs a loud warning so the team can react
 * before users do.
 */
export function logProviderStatus(): void {
  const configured = listConfiguredProviders();
  if (configured.length === 0) {
    console.warn(
      '[awde:ai] NO AI provider keys configured — every AI feature will use the offline deterministic generator until OPENROUTER_API_KEY (and/or GROQ_API_KEY, NVIDIA_API_KEY) is set.'
    );
    return;
  }
  const hint = process.env.NODE_ENV === 'production' ? ' · rotate keys from the provider dashboard (never in code)' : '';
  console.log(`[awde:ai] providers with keys: ${configured.join(', ')}${hint}`);
}