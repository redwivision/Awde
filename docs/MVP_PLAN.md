# Awde — MVP Plan: From Demo to Daily-Use Product

A plan written so **you**, the owner, know exactly what stands between the
current demo and a tool a student could genuinely use every day — and the order
to build it in. Read it before writing the first new table or route.

---

## 0. The One-Sentence Reality Check

> **Awde is feature-complete as a *demo*, but as a *product* it has no memory
> outside one browser: every workspace, every mastery score, every Feynman
> conversation lives in `localStorage`, not a database. Turning it into a daily
> tool means (1) adding accounts + a database, (2) making the AI/PDF pipeline
> usable at real scale, and (3) making it safe and cheap enough to trust with a
> child's learning.**

Everything in this document is a variation on that sentence.

---

## 1. What Already Works (don't rebuild this)

| | Status |
|---|---|
| Core pedagogy tools: mind-map, concept cards, Feynman "teach Rooty", quizzes, blurting, flashcards | Built & polished |
| Bilingual EN / Amharic across types + AI output | Built |
| Upload a real textbook PDF → AI builds a workspace (`server.ts` `/api/textbook/process`) | Built |
| AI never hard-fails (no-key + catch-block deterministic fallbacks) | Built |
| Mobile-aware UI + onboarding | Built |
| Resilient data model: `workspaces` single-source-of-truth, schema versioning, corruption-safe loading | Built |
| Tests (persistence + derivation logic), lint, build | Passing |

**The data model is already MVP-ready.** `workspaces` (primary) + derived flat
unit list, with a schema-version migration path (`src/data/persistence.ts`), are
exactly the shapes you want to store in a database. You swap the storage
backend, not the domain.

---

## 2. The Big Gap: Persistence & Accounts (the #1 blocker)

Today *everything* lives in `localStorage`. Consequences for daily use:

- No accounts → one browser = your whole "account".
- Progress dies with a cleared browser / shared school computer.
- Can't continue on a phone after starting on a laptop.
- No way to support parents/teachers, sync, or a paid tier.

### 2a. Target architecture (server-authoritative, localStorage as offline cache)

```
Browser  ──►  React app (src/)
                 │ GET/POST JSON
                 ▼
             /api/*  (server.ts, auth-gated)
                 │
                 ▼
          PostgreSQL  (workspaces, study events, users)
                 │
                 ▼
          Gemini (AI)   ← rate-limited, keyed off DB users
```

The first-run UX stays identical. The app loads from localStorage first (fast,
works offline), then merges/syncs with the server version. The current
`loadWorkspaces`/`save` flow in `persistence.ts` becomes the *offline cache*;
a new sync layer reconciles with the DB.

### 2b. First concrete milestone: accounts + workspace sync

1. **Users table** — this is the small thing that unlocks a real account.
   Recommended startup scope (avoid password auth entirely at first):
   **email + magic link** (passwordless). No password reset, no hashing — a
   shortened link-to-log-in. You can add password auth later.
2. **Wire `persistence.ts` to a sync API** — keep it as the offline cache, add
   `GET /api/me/workspaces` + `PUT /api/me/workspaces` (upsert whole workspace
   with a `updatedAt` last-writer-wins on conflict to start).
3. **Same pattern for study events** — mastery changes, quiz results, Feynman
   scores. A single append-only `study_events` table gives you progress over
   time, spaced-repetition drive, and parent reports later.

### 2c. What NOT to do yet

- Don't over-normalize the workspace graph into 15 related tables now. Store
  each workspace's `units`/`nodes` as a JSONB column. The schema-version logic
  already handles shape evolution. Normalize only when a specific feature
  (e.g. "query nodes across all books") demands it.
- Don't build realtime/websockets. A simple request-sync is enough for v1.

---

## 3. Suggested DB Schema (v1)

```sql
-- accounts / auth
CREATE TABLE users (
  id            TEXT PRIMARY KEY,          -- uuid
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- passwordless login links
CREATE TABLE login_tokens (
  token_hash    TEXT PRIMARY KEY,          -- store hash, not the token
  user_id       TEXT NOT NULL REFERENCES users(id),
  expires_at    TIMESTAMPTZ NOT NULL
);

-- the app's single source of truth, one row per "workspace/book"
CREATE TABLE workspaces (
  user_id       TEXT NOT NULL REFERENCES users(id),
  workspace_id  TEXT NOT NULL,             -- matches app workspace.id
  data          JSONB NOT NULL,            -- the whole workspace shape
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workspace_id)
);

-- append-only study event log (progress over time, SRS, reports)
CREATE TABLE study_events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  workspace_id  TEXT,
  unit_id       TEXT,
  event_type    TEXT NOT NULL,             -- 'mastery', 'quiz', 'feynman', 'flashcard'...
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX study_events_user_time ON study_events(user_id, created_at);
```

Notes:
- Store the whole workspace as JSONB (matches the current single-source-of-truth model).
- `study_events` is append-only = cheap to write, flexible to analyze.
- You already carry `nextReviewDate` on flashcards — SRS scheduling is sketched
  and becomes meaningful once events are server-side.

---

## 4. The Secondary Gaps (in order of importance)

### 4a. Auth on every `/api/*` route (security)
`server.ts` currently has **zero auth** — anyone with the URL can burn your
Gemini quota. Once accounts exist, gate all AI + sync endpoints by session
cookie / bearer token.

### 4b. Move in-memory state to a real store
- Rate-limit buckets (`server.ts:25`) are in-memory → reset on restart and
  don't share across instances. Move to Redis (or DB) when you scale past one
  process.
- No server-side persistence exists at all yet — the DB above fixes this.

### 4c. Deployment & infrastructure
No Dockerfile, no CI, no hosting config today. You need:
- Dockerfile (build `dist/` + run `node dist/server.cjs`).
- A managed PostgreSQL (free tiers exist: Neon, Supabase).
- CI (lint + test + build) and secrets management for `GEMINI_API_KEY`
  (never in the repo / client).
- Staging + prod environments.

### 4d. Trust, safety & privacy for a child-facing product
The current "saved only on this device" claim is honest *right now* — it stops
being true the day you add a backend, so plan for:
- Privacy policy + informed consent, especially since the audience is minors.
- **No PII by default**; only an email for login.
- Content safety / moderation on the AI chat (a teacher/child could ask or be
  shown anything), an age gate, and a clear data-deletion path.

### 4e. Cost & quota control
Gemini calls cost money. Real users mean real spend. Add per-user quotas
(beyond the 120/min IP limiter), daily caps, and cache/reuse generated content
so the same unit/quiz isn't regenerated on repeat visits.

---

## 5. Small polish before "happy path" daily use

- Decide the offline model: **optimistic local + background sync** (best for
  school Wi-Fi) vs pure server-authoritative. Recommend optimistic + sync.
- Server/DB tests — current coverage is the pure persistence/derivation logic;
  add supertest coverage for the new auth + sync endpoints.
- Group/manage: at least one "teacher/parent" view to see progress (long-term);
  skip for v1 if it slows accounts+sync.

---

## 6. Recommended Build Order

1. **Accounts + server-side workspace/event sync** (unlocks everything), with
   localStorage as offline cache. ← *do this first*
2. **Deployable infra**: Dockerfile + Postgres + CI + secrets + staging/prod.
3. **Trust & safety**: privacy policy, no-PII default, AI content safety,
   age gate.
4. **Quota & cost control** at scale.
5. **Retention polish**: real SRS for flashcards (already sketched via
   `nextReviewDate`), teacher/parent reports.

---

## 7. What "done" for an MVP looks like

- A student can **log in on any device**, see their books, and pick up exactly
  where they left off.
- Progress (mastery, quizzes, Feynman, flashcards) is a **record on the server**,
  not a browser cache.
- The app is **deployable** with a **database** and **auth** on every route.
- **Trust basics** (privacy, no-PII, content safety) are in place for minors.
- The "saved only on this device" copy flips to a real account + privacy
  statement.

Until #1 is done, Awde remains a brilliant demo — which is a fine place to be,
but it is not yet a daily tool. The data model is already pointed the right way;
the work is wiring it to a real backend.
