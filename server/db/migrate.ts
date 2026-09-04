// Runs Drizzle SQL migrations against the configured DATABASE_URL at startup.
// Uses drizzle-kit's generated SQL in `drizzle/`. When no DB is configured this
// is a no-op (local/offline mode).
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getSql, getDb } from './client';

const MIGRATIONS_DIR = new URL('../../drizzle', import.meta.url).pathname;

export async function runMigrations(): Promise<void> {
  const db = getDb();
  const sql = getSql();
  if (!db || !sql) return;
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}
