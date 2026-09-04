// Database client factory. IMPORTANT design invariant: Awde works fully offline
// and local-only when no DATABASE_URL is configured (dev, tests, first run).
// Only when a real Postgres URL (e.g. Neon) is present do we connect, create
// tables, and enable auth + server-side sync. This keeps the current
// localStorage-first behavior as the default and guards against breaking the
// offline/fallback paths.
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let sql: postgres.Sql<{}> | null = null;

export function getSql(): postgres.Sql<{}> | null {
  if (!process.env.DATABASE_URL) return null;
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, { max: 1 });
  }
  return sql;
}

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  const s = getSql();
  if (!s) return null;
  return drizzle(s, { schema, logger: false });
}

/** True when server-side persistence + auth are active. */
export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** True when server-side sync/auth should be required for protected routes. */
export function authEnabled(): boolean {
  return hasDb();
}
