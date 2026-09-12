import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSecret, listConfiguredProviders, logProviderStatus } from '../server/secrets';

const AI_KEYS = ['OPENROUTER_API_KEY', 'GROQ_API_KEY', 'NVIDIA_API_KEY'];

beforeEach(() => {
  for (const k of AI_KEYS) delete process.env[k];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getSecret', () => {
  it('returns null when the variable is unset', () => {
    expect(getSecret('OPENROUTER_API_KEY')).toBeNull();
  });

  it('returns null for a blank or whitespace-only value', () => {
    process.env.OPENROUTER_API_KEY = '';
    expect(getSecret('OPENROUTER_API_KEY')).toBeNull();
    process.env.OPENROUTER_API_KEY = '   ';
    expect(getSecret('OPENROUTER_API_KEY')).toBeNull();
  });

  it('returns the trimmed value when present', () => {
    process.env.OPENROUTER_API_KEY = '  sk-live-abc  ';
    expect(getSecret('OPENROUTER_API_KEY')).toBe('sk-live-abc');
  });
});

describe('listConfiguredProviders', () => {
  it('returns [] with no keys configured', () => {
    expect(listConfiguredProviders()).toEqual([]);
  });

  it('lists providers in registration order as keys appear', () => {
    process.env.OPENROUTER_API_KEY = 'sk-or';
    process.env.NVIDIA_API_KEY = 'nvx';
    expect(listConfiguredProviders()).toEqual(['openrouter', 'nvidia']);

    process.env.GROQ_API_KEY = 'gsk';
    expect(listConfiguredProviders()).toEqual(['openrouter', 'groq', 'nvidia']);
  });

  it('ignores blank keys entirely', () => {
    process.env.OPENROUTER_API_KEY = '';
    process.env.GROQ_API_KEY = 'gsk';
    expect(listConfiguredProviders()).toEqual(['groq']);
  });
});

describe('logProviderStatus', () => {
  it('warns loudly when no provider has a key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logProviderStatus();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NO AI provider keys configured'));
  });

  it('logs provider NAMES only — never a key substring', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.OPENROUTER_API_KEY = 'sk-super-secret-abc123';
    process.env.GROQ_API_KEY = 'gsk-another-secret';
    logProviderStatus();
    const msg = log.mock.calls[0][0] as string;
    expect(msg).toContain('openrouter');
    expect(msg).toContain('groq');
    expect(msg).not.toContain('sk-super-secret-abc123');
    expect(msg).not.toContain('gsk-another-secret');
  });
});