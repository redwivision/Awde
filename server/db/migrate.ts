// Runs Drizzle SQL migrations against the configured DATABASE_URL at startup.
// Uses drizzle-kit's generated SQL in `drizzle/`. When no DB is configured this
// is a no-op (local/offline mode).
import { fileURLToPath } from 'url';
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getSql, getDb } from './client';

// Resolve the drizzle/ folder in BOTH dev (tsx, real import.meta.url) and the
// bundled production build (dist/server.cjs, where esbuild rewrites
// import.meta.url to {} so import.meta.url.toString() throws). In prod the
// migrations are copied to <cwd>/drizzle alongside dist/, so fall back to cwd.
function resolveMigrationsDir(): string {
  const metaPath = (import.meta as { url?: string }).url;
  if (metaPath && metaPath.startsWith('file://')) {
    return path.join(path.dirname(fileURLToPath(metaPath)), '..', '..', 'drizzle');
  }
  return path.join(process.cwd(), 'drizzle');
}

const MIGRATIONS_DIR = resolveMigrationsDir();

export async function runMigrations(): Promise<void> {
  const db = getDb();
  const sql = getSql();
  if (!db || !sql) return;
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}
