<div align="center">

# Awde · አውደ

**Turn any textbook into an interactive mind-map & Socratic Feynman arena.**

Bilingual (English / Amharic) AI-driven conceptual mastery for Ethiopian STEM students — powered by the Feynman Technique, culturally-grounded analogies, and measurable study-method efficacy.

</div>

---

## What is Awde?

Awde replaces passive textbook reading with **active, evidence-based conceptual understanding**. Instead of memorizing definitions, you *teach* the concept back to **Rooty** — a strict AI Socratic student — using plain, jargon-free language and real-world Ethiopian analogies. Rooty grades your clarity in real time, flags unexplained jargon, and probes your understanding until you truly own the concept.

Every concept node comes with a **localized Ethiopian analogy** as the primary teaching mechanism — a Jebena coffee ceremony for thermal equilibrium, Equb savings for the First Law of Thermodynamics, the GERD dam turbines for the electron transport chain, Addis Light Rail for graph algorithms.

### The 3 Cognitive Pillars

1. **Multi-Level Structural Maps** — interactive, pannable/zoomable mind-maps showing concept hierarchy, prerequisites, and causal links across a chapter.
2. **Socratic Feynman Peer (Rooty)** — an expressive AI student (animated SVG avatar with 8 emotional states) that enforces the Feynman Technique and scores your explanation on a 5-dimension rubric.
3. **Cognitive Method Laboratory** — tracks objective *Before-vs-After* recall deltas (+30% → +85%) so the platform learns **which study method combo works for your brain**, not just some generic recommendation.

---

## Features

| Feature | Description |
|---|---|
| 🧠 **Mind-Map Studio** | Interactive concept graph with typed relationships (`depends_on`, `causes`, `transforms_into`), search, filters, master cards, canvas or grid views |
| 💬 **Feynman Arena (Teach Rooty)** | Real-time Socratic dialogue; Rooty evaluates simplicity, clarity, jargon avoidance, analogy quality & accuracy; voice input + text-to-speech; 3 strictness modes |
| ❓ **Active Recall Quizzes** | Diagnostic MCQs with difficulty filtering, misconception traps, and AI-generated unlimited questions (bilingual) |
| ⏱️ **Deep Work Suite** | Pomodoro focus timer with ambient noise (incl. traditional Krar drone), distraction parking lot, Blurting Method (3-min active recall sprint with AI grading), Leitner SRS flashcards |
| 🧪 **Method Laboratory** | Test & validate study protocols (Map+Feynman, Pure Socratic, Spatial Scaffolding) with measurable recall deltas |
| 📚 **Curriculum Library** | Pre-loaded Ethiopian MoE units (Physics, Biology, CS) + import your own textbook text to auto-generate a full mind-map unit |
| 🌍 **Bilingual** | Full English ⇄ Amharic (አማርኛ) toggle across all content, analogies, quizzes, and Rooty's critique |
| 🎨 **Theming** | Multiple design aesthetics incl. Nordic Minimal, Scholar Parchment, Obsidian Cyber, and the warm "Addis Espresso" heritage theme |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment setup (optional)

Copy the template and add a Gemini key to enable **live AI generation**:

```bash
cp .env.example .env.local
```

Set `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey).

> This project also runs on [Google AI Studio](https://ai.studio), which injects `GEMINI_API_KEY` and `APP_URL` from your account secrets automatically (see `metadata.json`).

> **No key? No problem.** Awde ships with deterministic **offline fallback generators** for every AI endpoint, so the full app — mind-maps, Rooty Feynman evaluation, quizzes, blurting grading — works out of the box without a key. Live Gemini just makes the output richer and unlimited.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Vite + Express) with HMR |
| `npm run build` | Production build (Vite client + bundled Express server) |
| `npm start` | Run the production build |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm run clean` | Remove build output |

---

## Architecture

```
├── server.ts                 # Express + Gemini AI backend (4 endpoints, with fallbacks)
├── src/
│   ├── App.tsx               # Root shell: sidebar, routing between the 6 study views
│   ├── types.ts              # Full domain model (TopicUnit, ConceptNode, FeynmanEvaluation, …)
│   ├── data/
│   │   ├── curricula.ts      # Seeded curriculum units (Thermodynamics, Cell Resp, Graph Alg)
│   │   ├── textbookWorkspaces.ts # Higher-level "book → unit → topic" workspaces
│   │   └── themes.ts         # Design aesthetic definitions
│   └── components/           # 14 feature components
│       ├── MindMapCanvas.tsx # Interactive concept graph (SVG edges, pan/zoom)
│       ├── FeynmanArena.tsx  # Socratic dialogue + Rooty evaluation
│       ├── QuizEngine.tsx    # Active recall quizzes
│       ├── StudySuite.tsx    # Pomodoro / Blurting / Spaced repetition
│       ├── StudyMethodLab.tsx# Efficacy-delta experiment tracking
│       ├── RootyAvatar.tsx   # Emotion-driven animated SVG student
│       ├── WorkspaceSidebar.tsx, NodeMasteryDrawer.tsx, TextbookManager.tsx,
│       ├── CommandPalette.tsx, AestheticsModal.tsx, AwdeLogo.tsx
│       └── … (HomePage / UploadPdfModal — higher-level workspace flow)
```

### Backend API (Gemini)

| Endpoint | Purpose |
|---|---|
| `POST /api/mindmap/generate` | Deconstruct textbook text → full unit (nodes, connections, quizzes, flashcards) |
| `POST /api/feynman/evaluate` | Grade a Feynman explanation with the "Rooty" evaluator persona |
| `POST /api/quiz/generate` | Generate unlimited diagnostic quiz questions |
| `POST /api/blurting/evaluate` | Grade a Blurting-Method active-recall dump |

State is persisted to `localStorage` (`awde_units_v1`, `awde_lang`, `awde_aesthetic`, `awde_experiments_v1`), so progress survives reloads without any backend database.

---

## Project status

- ✅ **Runs end-to-end** — installs, typechecks, builds, boots, and handles all AI endpoints (live or offline fallback)
- ✅ **Interactive feature set** — all 6 study modes are functional front-ends with live client/server wiring
- 🚧 **In-progress polish**
  - The `TextbookWorkspace` (book → unit → topic) hierarchy in `HomePage` / `UploadPdfModal` is an alternative flow not yet wired into the primary `App` shell — a known architectural inconsistency to reconcile
  - The CSS-variable theming engine is defined but some components still use hardcoded dark-slate styles; theming is applied where it matters most and is being extended

---

## Vision

Awde's long-term mission is to become the **default conceptual-mastery layer for Ethiopian STEM education** — grounded in the Feynman Technique, rooted in local culture, and validated by evidence rather than vibes. Every feature exists to answer one question: *do you actually understand this, and can we prove it improved?*