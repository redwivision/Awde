<div align="center">

# Awde · አውደ

**Turn any textbook into an interactive mind-map & Socratic Feynman arena.**

Bilingual (English / Amharic) AI-driven conceptual mastery for Ethiopian students — powered by the Feynman Technique, culturally-grounded analogies, and measurable study-method efficacy.

</div>

---

## What is Awde?

Awde replaces passive textbook reading with **active, evidence-based conceptual understanding**. Instead of memorizing definitions, you *teach* the concept back to **Rooty** — a strict AI Socratic student — using plain, jargon-free language and real-world Ethiopian analogies. Rooty grades your clarity in real time, flags unexplained jargon, and probes your understanding until you truly own the concept.

Every concept node comes with a **localized Ethiopian analogy** as the primary teaching mechanism — a Jebena coffee ceremony for thermal equilibrium, Equb savings for the First Law of Thermodynamics, the GERD dam turbines for the electron transport chain, Addis Light Rail for graph algorithms.

### The Problem We Solve

**The Gap: Traditional Learning vs. Mastery-Driven Learning**

Students today rely on static textbooks that force rote-reading and memorization. There is no immediate feedback, no cultural relevance, and no way to measure whether the learning actually sticks. The result: low retention, disengagement, and a widening gap between what schools teach and what learners need to master.

**How Awde Bridges the Gap:**

| Current Reality | Awde Solution |
|-----------------|---------------|
| Static textbook reading | Interactive mind-maps |
| No immediate feedback | Instant Rooty feedback |
| Unmeasurable outcomes | Data-driven efficacy tracking |
| Culturally disconnected | Ethiopian-contextualized analogies |

### The 3 Cognitive Pillars

1. **Multi-Level Structural Maps** — interactive, pannable/zoomable mind-maps showing concept hierarchy, prerequisites, and causal links across a chapter.
2. **Socratic Feynman Peer (Rooty)** — an expressive AI student (animated SVG avatar with 8 emotional states) that enforces the Feynman Technique and scores your explanation on a 5-dimension rubric.
3. **Cognitive Method Laboratory** — tracks objective *Before-vs-After* recall deltas (+58% average improvement) so the platform learns **which study method combo works for your brain**, not just some generic recommendation.

---

## Features

| Feature | Description |
|---|---|
| 🧠 **Mind-Map Studio** | Interactive concept graph with typed relationships (`depends_on`, `causes`, `transforms_into`), search, filters, master cards, canvas or grid views |
| 💬 **Feynman Arena (Teach Rooty)** | Real-time Socratic dialogue; Rooty evaluates simplicity, clarity, jargon avoidance, analogy quality & accuracy; voice input + text-to-speech; 3 strictness modes |
| ❓ **Active Recall Quizzes** | Diagnostic MCQs with difficulty filtering, misconception traps, and AI-generated unlimited questions (bilingual) |
| ⏱️ **Deep Work Suite** | Pomodoro focus timer with ambient noise (incl. traditional Krar drone), distraction parking lot, Blurting Method (3-min active recall sprint with AI grading), Leitner SRS flashcards |
| 🧪 **Method Laboratory** | Test & validate study protocols (Map+Feynman, Pure Socratic, Spatial Scaffolding) with measurable recall deltas |
| 📚 **Curriculum Library** | Pre-loaded Ethiopian MoE units (Physics, Biology, CS) + import your own textbook PDF to auto-generate a full mind-map unit |
| 🌍 **Bilingual** | Full English ⇄ Amharic (አማርኛ) toggle across all content, analogies, quizzes, and Rooty's critique |
| 🎨 **Theming** | Multiple design aesthetics incl. Nordic Minimal, Scholar Parchment, Obsidian Cyber, and the warm "Addis Espresso" heritage theme |
| 📴 **Single-Server Simplicity** | One Express process serves the React build and all /api endpoints — no separate backend required |
| 🔑 **No API Key Required** | All AI endpoints run with deterministic offline-fallback generators when no key is set; a Gemini key makes output richer |
| 👤 **Accounts & Cloud Sync** | Optional passwordless (magic-link) accounts via Neon/Postgres — progress syncs across devices while staying available offline (localStorage-first) |
| 🛡️ **Privacy-First & Age-Gated** | One-time consent gate before use, in-app Privacy & Terms (footer / Account / gate), no PII by default (only a login email), learning data used for personalization with an account, AI content-safety filter + model guard, one-tap account/data deletion, published contact email (lewikb13@gmail.com) in footer / Account / policy |
| 🔍 **Node Mastery Drawer** | Slide-in detail panel for every concept with 5 tabs: Localized Analogy, Concept Core (detailed explanation + key takeaways + related concepts), Common Traps, Rules & Formulas, and Ask Rooty |
| 💡 **Ask Rooty (Q&A)** | Lightweight chat in the node drawer — ask any question about a concept and get a clear, jargon-free answer with Ethiopian cultural analogies |

---

## Getting Started

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

**First Launch:** You'll see a cinematic landing page explaining the problem Awde solves and how it bridges the gap between traditional learning and mastery-driven learning. Click "Enter the Workspace" to access the full application.

### Environment setup (optional)

Copy the template and add a Gemini key to enable **live AI generation**:

```bash
cp .env.example .env.local
```

Set `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey).

> **Want accounts + cross-device sync?** Set `DATABASE_URL` to a **Neon/Postgres**
> connection string. On startup the server creates its tables
> (users, sessions, workspaces, study events), enables passwordless magic-link
> login, and syncs your workspaces across devices. Without it, Awde runs in
> **local mode** — everything stays on your device via `localStorage` and no
> login is shown.

> **How do login emails work?** Set `RESEND_API_KEY` (free-tier email API,
> https://resend.com) to actually email the one-time login links. Login is
> rate-limited (5 per email / 15 min, 40 per IP / 15 min; 60 link-checks/IP on
> confirm) and never reveals whether an address has an account. If email isn't
> configured: dev runs the link to the console + a "Dev link" in the UI;
> **production refuses to send** (502) rather than leak a usable link.
> Deliverability: `onboarding@resend.dev` (the default from-address) is Resend's
> **test-only** mailbox — it delivers only to the account owner's own inbox. For
> real users, verify a domain in the Resend dashboard and set
> `RESEND_FROM_ADDRESS="Awde <hello@yourdomain.com>"`; until then other
> recipients receive nothing (Resend 403s, which production surfaces as a 502).

> This project also runs on [Google AI Studio](https://ai.studio), which injects `GEMINI_API_KEY` and `APP_URL` from your account secrets automatically (see `metadata.json`).

> **No key? No problem.** Awde ships with deterministic **offline fallback generators** for every AI endpoint, so the full app — mind-maps, Rooty Feynman evaluation, quizzes, blurting grading — works out of the box without a key. You'll see an amber banner indicating offline mode when no API key is configured. Live Gemini just makes the output richer and unlimited.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Vite + Express) with HMR |
| `npm run build` | Production build (Vite client + bundled Express server) |
| `npm start` | Run the production build |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm test` | Run test suite (Vitest) |
| `npm run clean` | Remove build output |

---

## Deployment

> **Important:** Awde is a **single persistent server** — the Express backend in
> `server.ts` serves the React build **and** all `/api/*` endpoints (AI calls,
> PDF uploads). It must be deployed to a **persistent host** (Render, Railway,
> Fly.io, a VM). **Do not deploy to static/edge serverless hosts** (e.g. a plain
> Vercel/Netlify static deploy has **no backend**, so every API call fails and
> the app shows "Offline Mode" and "Could not process the textbook").

**Required environment variables** (set in your host's dashboard):
- `NODE_ENV=production`
- `GEMINI_API_KEY` — your Google Gemini API key (live AI). If omitted, the app
  runs in offline-fallback mode (deterministic generators) as a safety net.
- _Optional:_ `GROQ_API_KEY`, `NVIDIA_API_KEY` (fallback AI providers),
  `APP_URL` (public URL of the service).
- `DATABASE_URL` — Neon/Postgres connection string. **Required for accounts +
  cloud sync.** Without it the app runs in local mode (localStorage only, no
  login). Neon free tier: https://neon.tech
- `RESEND_API_KEY` — email service key. **Required to actually email magic-link
  logins.** Without it, dev shows a "Dev link" instead; production refuses to
  log in via email. Set `RESEND_FROM_ADDRESS` to a verified domain for the
  sender. Free tier: https://resend.com

### Option A — Render (recommended, free)

1. Push this repo to GitHub (already done).
2. In Render, choose **New → Web Service** and connect the repo.
3. Render auto-detects [`render.yaml`](./render.yaml). Set the **Build
   Command** to `npm ci && npm run build` and **Start Command** to `npm start`.
4. Add `GEMINI_API_KEY`, `DATABASE_URL`, and `RESEND_API_KEY` (plus
   `RESEND_FROM_ADDRESS` for a verified sender) in the service's
   **Environment** tab.
5. The service starts on port `3000` (set with `PORT` if needed) and handles
   both the app and all `/api` routes.

### Option B — Railway / Fly.io (Docker)

A [`Dockerfile`](./Dockerfile) is included. It builds the frontend + server and
runs `node dist/server.cjs` on port `3000`.

- **Railway:** New Project → Deploy from repo → Railway auto-detects the
  `Dockerfile`. Add the env vars above, and set the public port to `3000`.
- **Fly.io:** `fly launch` (accept the generated `fly.toml`), then
  `fly secrets set GEMINI_API_KEY=...` and `fly deploy`.

### Local production check

```bash
npm run build
npm start              # serve on http://localhost:3000 (NODE_ENV=production)
curl http://localhost:3000/api/health   # → {"status":"ok","hasGeminiKey":true}
```

---

## Architecture

```
├── server.ts                 # Express + Gemini AI backend (endpoints, with fallbacks)
├── server/
│   ├── ai.ts                 # Gemini client + offline fallback generators
│   ├── auth.ts               # Passwordless magic-link auth + requireAuth middleware
│   ├── email.ts              # Resend login-link transport (dev/prod fallback)
│   ├── rateLimit.ts          # Shared in-memory sliding-window rate limiter
│   ├── safety.ts             # Content-safety filter + AI prompt guard
│   ├── sync.ts               # Auth + /api/me/* workspace sync routes (rate-limited)
│   ├── textbook.ts           # PDF processing & textbook ingestion
│   └── db/
│       ├── schema.ts         # Drizzle schema: users, sessions, workspaces, study_events
│       ├── client.ts         # postgres.js client (lazy; only when DATABASE_URL is set)
│       └── migrate.ts        # Runs Drizzle migrations on startup
├── drizzle/                  # Generated SQL migrations
├── src/
│   ├── App.tsx               # Root shell: landing page, sidebar, routing between the 6 study views
│   ├── types.ts              # Full domain model (TopicUnit, ConceptNode, FeynmanEvaluation, …)
│   ├── data/
│   │   ├── curricula.ts      # Seeded curriculum units (Thermodynamics, Cell Resp, Graph Alg)
│   │   ├── textbookWorkspaces.ts # Higher-level "book → unit → topic" workspaces
│   │   ├── themes.ts         # Design aesthetic definitions
│   │   └── persistence.ts    # localStorage helpers (offline cache)
│   ├── lib/
│   │   ├── api.ts            # Weak-wifi-safe fetch helper for AI endpoints
│   │   └── sync.ts           # Session storage + workspace push/pull + study events
│   └── components/           # 15+ feature components
│       ├── LandingPage.tsx   # Cinematic first-run gate with problem statement
│       ├── ConsentGate.tsx   # One-time age gate + privacy consent before use
│       ├── PrivacyModal.tsx  # In-app Privacy & Terms (footer / Account / gate)
│       ├── MindMapCanvas.tsx # Interactive concept graph (SVG edges, pan/zoom)
│       ├── FeynmanArena.tsx  # Socratic dialogue + Rooty evaluation
│       ├── QuizEngine.tsx    # Active recall quizzes
│       ├── StudySuite.tsx    # Pomodoro / Blurting / Spaced repetition
│       ├── StudyMethodLab.tsx# Efficacy-delta experiment tracking
│       ├── RootyAvatar.tsx   # Emotion-driven animated SVG student
│       ├── AccountModal.tsx  # Sign in / sign out (magic link) / delete account
│       ├── WorkspaceSidebar.tsx, NodeMasteryDrawer.tsx,
│       ├── CommandPalette.tsx, AestheticsModal.tsx, AwdeLogo.tsx
│       └── … (HomePage / UploadPdfModal / WorkspaceDetail — workspace flow)
```

### Backend API (Gemini)

| Endpoint | Purpose |
|---|---|
| `POST /api/mindmap/generate` | Deconstruct textbook text → full unit (nodes, connections, quizzes, flashcards) |
| `POST /api/feynman/evaluate` | Grade a Feynman explanation with the "Rooty" evaluator persona |
| `POST /api/node/ask` | Lightweight Q&A — ask a question about a concept node, get a clear answer |
| `POST /api/quiz/generate` | Generate unlimited diagnostic quiz questions |
| `POST /api/blurting/evaluate` | Grade a Blurting-Method active-recall dump |
| `POST /api/textbook/process` | Process uploaded PDF → generate full workspace |
| `GET /api/health` | Health check with AI key status |

**Accounts & sync (active only when `DATABASE_URL` is set):**

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login` | Request a passwordless magic-link (email delivered via Resend when `RESEND_API_KEY` is set; rate-limited, no account enumeration) |
| `GET /api/auth/confirm` | Exchange the magic-link for a session token |
| `GET /api/me` | Current signed-in user |
| `GET /api/me/workspaces` | Pull this user's server-side workspaces |
| `PUT /api/me/workspaces` | Upsert a workspace (last-writer-wins) |
| `POST /api/me/study-events` | Append a study event (progress log) |
| `DELETE /api/me` | Erase the account + all linked data (cascades) |

State is persisted to `localStorage` (`awde_workspaces_v1` primary store, with
`awde_lang`, `awde_aesthetic`, `awde_experiments_v1`, `awde_landing_dismissed`)
so progress survives reloads and works offline. When a `DATABASE_URL` is
configured and the user signs in, the app **also** syncs workspaces to the
server (push on save, pull+merge on load) so progress follows them across
devices — `localStorage` stays as the offline cache.

---

## Project Status

- ✅ **Production-ready** — installs, typechecks, builds, boots, and handles all AI endpoints (live or offline fallback)
- ✅ **Landing page** — cinematic first-run experience with clear problem statement and solution overview
- ✅ **Offline mode** — fully functional without any API keys (deterministic fallback generators)
- ✅ **Offline banner** — informs users when running in offline mode
- ✅ **Workspace navigation** — book → unit → topic hierarchy fully wired
- ✅ **Interactive feature set** — all 6 study modes are functional with live client/server wiring
- ✅ **Enriched concept nodes** — detailed explanations, key takeaways, and related concepts in the node drawer
- ✅ **Ask Rooty Q&A** — lightweight in-drawer chat for asking questions about any concept
- ✅ **Test suite** — 96 tests passing (Vitest)
- ✅ **Bilingual support** — complete English/Amharic toggle across all UI
- ✅ **Theme system** — 5 design aesthetics with CSS variable theming
- ✅ **Accounts & cloud sync** — optional passwordless accounts via Neon/Postgres; local-first (works offline) with cross-device sync when signed in
- ✅ **Hardened authentication** — rate-limited magic links (per-email + per-IP), real email delivery via Resend, no account enumeration, no dev-link leak in production
- ✅ **Trust & safety** — one-time age-gate consent, in-app Privacy & Terms (footer / Account / gate), no PII by default, AI content-safety filter + model safety instruction, one-tap account/data deletion

---

## Competition & Production Readiness

### What Judges Will See

1. **Landing Page** (first visit) — Clear problem statement, reality vs ideal comparison, stats, and "Enter Workspace" CTA
2. **Curriculum Library** — Pre-loaded Ethiopian STEM textbooks with full mind-maps
3. **Mind-Map Studio** — Interactive concept graphs with Ethiopian cultural analogies
4. **Feynman Arena** — Teach concepts to Rooty and get instant feedback
5. **Quiz Engine** — Active recall quizzes with bilingual support
6. **Study Suite** — Pomodoro timer, blurting method, flashcards
7. **Method Laboratory** — Track before/after recall improvements

### Key Metrics

| Metric | Value |
|--------|-------|
| Device Offline | App shell + saved workspaces/mind-maps readable; live AI generation requires connection |
| Auth / API Keys | None required by default (deterministic fallback generators); optional magic-link accounts when `DATABASE_URL` is set (emailed via `RESEND_API_KEY`) |
| Languages | 2 (English + Amharic) |
| Recall Deltas | Measured per-user in the Method Laboratory (before vs after) |
| Test Coverage | 96 tests passing (incl. content-safety, auth/hardening, auth/sync local-mode) |
| Persistence | localStorage-first offline cache; optional cloud sync (workspaces + study events) via Neon/Postgres |

---

## Vision

Awde's long-term mission is to become the **default conceptual-mastery layer for Ethiopian STEM education** — grounded in the Feynman Technique, rooted in local culture, and validated by evidence rather than vibes. Every feature exists to answer one question: *do you actually understand this, and can we prove it improved?*

---

## Contact

Privacy questions, deletion requests, or anything else: **lewikb13@gmail.com**.
The same address appears in the app itself — a "Contact us" link in the
landing-page footer and the workspace Account modal, and it is named in the
in-app Privacy & Terms. We respond within 30 days.

---

## License

MIT License — open source for educational impact.
