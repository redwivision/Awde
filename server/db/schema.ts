// Database schema for Awde's server-side persistence (Neon/Postgres via Drizzle).
// Keep this in sync with the app's single-source-of-truth data model: the whole
// workspace shape is stored as JSONB, and study progress is an append-only log.
import { pgTable, text, timestamp, jsonb, bigserial, boolean, integer, index, primaryKey } from 'drizzle-orm/pg-core';
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

// Shared AI-generation cache (content-addressed). One row per unique, verified
// generation ("same textbook + topic → same unit, for free"). Keyed by the
// SHA-256 of the normalized generation inputs so repeat requests never spend
// AI tokens. Serving a cached unit is instant and costs nothing, which is the
// real money-saver for the free tier AND the graceful offline story: a student
// regenerating a topic gets the exact community-quality unit immediately.
export const generatedUnits = pgTable(
  'generated_units',
  {
    contentHash: text('content_hash').primaryKey(),
    // 'mindmap' | 'quiz' — separates cache namespaces per generation kind.
    kind: text('kind').notNull(),
    // The normalized AI output. Shape-validated before insert (see unitCache.ts)
    // so a poisoned/hallucinated payload can never be served back.
    data: jsonb('data').notNull(),
    // Fingerprint of whoever first generated this (course-grained, no PII).
    sourceAuthorFingerprint: text('source_author_fingerprint').notNull().default(''),
    // Community-verified flag; false by default until curated.
    verified: boolean('verified').notNull().default(false),
    // Usage counters let us retire untouched rows and observe hit rates.
    hitCount: integer('hit_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('generated_units_kind_idx').on(t.kind)]
);

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  studyEvents: many(studyEvents)
}));

// Opt-in study groups (consent boundary for teacher/community dashboards).
// Joining a group is explicit consent that its owner may see YOUR aggregated
// study stats under the display name you chose — never your real identity.
// Leaving deletes the membership row, so your events instantly stop being
// included. `code` is a short human-shareable join token.
export const studyGroups = pgTable(
  'study_groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull().unique(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('study_groups_owner_idx').on(t.ownerId)]
);

// Membership row — the only thing linking a user to a group. The chosen
// `displayName` is what others see; the real email is never exposed.
export const studyGroupMembers = pgTable(
  'study_group_members',
  {
    groupId: text('group_id')
      .notNull()
      .references(() => studyGroups.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.userId], name: 'study_group_members_pk' }),
    index('study_group_members_user_idx').on(t.userId)
  ]
);
