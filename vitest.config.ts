import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    // 15s rather than the 5s default: every worker compiles the full server.ts
    // module graph (pdf-parse, @google/genai, multer, ...) in parallel, and the
    // FIRST supertest request per file can occasionally take >5s under that
    // load. A genuinely stuck test still fails loudly (the provider chain is
    // itself bounded by its 12s overall deadline).
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'server/ai.ts',
        'server.ts',
        'src/data/textbookWorkspaces.ts',
        'src/data/persistence.ts',
        'src/lib/api.ts'
      ],
      exclude: ['tests/**', 'node_modules/**', 'dist/**', 'public/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60
      }
    }
  }
});