import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
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