// Database schema for Awde's server-side persistence (Neon/Postgres via Drizzle).
// Keep this in sync with the app's single-source-of-truth data model: the whole
// workspace shape is stored as JSONB, and study progress is an append-only log.
import { pgTable, text, timestamp, jsonb, bigserial, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Accounts. Passwordless by design for v1: users log in via a one-time link.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('student'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// One-time login links (magic links). Store a hash, never the raw token.
export const loginTokens = pgTable('login_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Bearer sessions issued after a successful magic-link login.
export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// The app's source of truth for a student's books. One row per user+workspace.
// The `data` JSONB column holds the full workspace shape (matching workspace.id
// and the units/nodes graph), so schema evolution tracks the app's existing
// SCHEMA_VERSION migration rather than a hardcoded relational model.
export const workspaces = pgTable(
  'workspaces',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id').notNull(),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.workspaceId], name: 'workspaces_pk' }),
    index('workspaces_user_idx').on(t.userId)
  ]
);

// Append-only study progress log (mastery, quiz, feynman, flashcard events).
// Gives progress-over-time, spaced-repetition drive, and parent reports.
export const studyEvents = pgTable(
  'study_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id'),
    unitId: text('unit_id'),
    nodeId: text('node_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('study_events_user_time_idx').on(t.userId, t.createdAt)]
);

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  studyEvents: many(studyEvents)
}));
