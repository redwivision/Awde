// Drizzle configuration for generating + running SQL migrations against
// Neon/Postgres. `drizzle-kit` reads the DATABASE_URL from the environment.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/awde_dev'
  },
  strict: true,
  verbose: true
});
