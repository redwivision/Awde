# Awde — How It Works & Why It Works

A hands-on guide written so *you*, the owner, actually understand this codebase —
not just what each file does, but *why* it's built that way. Read it top to bottom
once, then keep it open while you poke around.

---

## 0. The One-Sentence Mental Model

> **Awde is one server that both (a) serves a React app to the browser and
> (b) answers the React app's `/api/*` questions with AI. All user progress lives
> in the browser's `localStorage`, not a database.**

Everything in this project is a variation on that sentence. Hold it and the rest
clicks into place.

What's in it:

| Layer | Lives in | What it does |
|---|---|---|
| Browser UI (React) | `src/` | What the student sees & clicks |
| API layer | `src/lib/api.ts` | How the browser talks to the server |
| HTTP server + AI routes | `server.ts` | Receives `/api` calls, calls Gemini |
| AI wrappers + fallbacks | `server/ai.ts` | Gemini client + "no key" deterministic generators |
| PDF pipeline | `server/textbook.ts` | Textbook → AI → workspace |
| App state + persistence | `src/App.tsx`, `src/data/persistence.ts` | Holds data, saves to `localStorage` |
| Domain types | `src/types.ts` | The *shape* of every piece of data |

---

## 1. The Boot Sequence (what happens on `npm run dev`)

Read `package.json` scripts first:

```json
"dev": "tsx server.ts"
```

So `npm run dev` doesn't start Vite on its own — it starts **`server.ts`** with
`tsx` (a tool that runs TypeScript directly, no compile step).

Now open `server.ts` and look at the very end:

```ts
export async function startServer(port) {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    // serve the prebuilt dist/ statically instead
  }
  ...
}
if (isMain) startServer();
```

**This is the key architectural decision.** In development, the Express server
mounts **Vite as middleware** (`app.use(vite.middlewares)`). That means:

- `localhost:3000/` serves the *same Express app* that also has `/api/*` routes.
- Express handles `/api/...` requests itself.
- Everything else (`.tsx`, assets) is handed to Vite, which transforms on the fly
  and pushes **HMR** (hot module replacement) updates to the browser.

> **Why this design?** It means there's exactly **one process / one port / one
> origin**. In production there's no Vite — the same `server.ts` just serves the
> prebuilt `dist/` folder. You write the server once, and it works both in dev
> and prod. That's the "single-server simplicity" the README brags about.

Meanwhile the browser loads `index.html`, which has:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

`main.tsx` mounts React into `#root`:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
```

- `createRoot(...).render(...)` — the React 19 way to attach your root component.
- `<StrictMode>` — a dev-only tool that double-runs effects to catch bugs. It does
  **not** run in production builds.
- `<ErrorBoundary>` — if any child component throws, this catches it so the whole
  screen doesn't go white. Good practice; every app should have one.

---

## 2. The Two "Screens": Landing vs Workspace

Open `App.tsx`. The single most important line is near the top:

```tsx
const [isLandingOpen, setIsLandingOpen] = useState(true);
```

Then, at the bottom of the component:

```tsx
return isLandingOpen ? (
  <LandingPage ... />
) : (
  <div className="flex h-screen ..."> ...the workspace... </div>
);
```

**The whole app is "if landing is open, show landing; otherwise show workspace."**
That's it. There's no router library (`react-router` is *not* a dependency).
Navigation is just React state — `if` statements, not routes.

> **Why no router?** The app doesn't need URLs that deep link; it's a single big
> study workspace. Using `useState` for "which screen/tab am I on" is simpler and
> avoids adding a dependency. You could add a router later, but you don't need one.

Inside the workspace, the "tabs" (Books / Map / Teach / Quiz / Measure / Focus)
are driven by one piece of state:

```tsx
const [activeTab, setActiveTab] = useState<ActiveTab>('library');
```

and several `if (activeTab === 'mindmap')` blocks decide what to render. So
"navigation" = "which state value is set." Hold that thought; it recurs everywhere.

---

## 3. The Data Model & the "Single Source of Truth"

This is the piece that makes you *actually* understand the code. Open
`src/types.ts`. The hierarchy is:

```
TextbookWorkspace  ("a book")
  └─ units: TopicUnit[]          ("chapters/units")
       └─ nodes: ConceptNode[]   ("concepts/ideas")
       ├─ connections: NodeConnection[]
       ├─ quizQuestions: QuizQuestion[]
       └─ flashcards: Flashcard[]
```

A `ConceptNode` is the atom of the whole app — it has a label, a mastery score,
an English *and* Amharic version of everything, a "localized analogy," etc. Read
that interface carefully; it's the schema everything else revolves around.

### The invariant (memorize this)

Go to `src/data/persistence.ts`. Read the comment at the top:

> "workspaces are **primary**, the flat unit list is **ALWAYS derived** from them."

So there are really two views of the same data:

```ts
// THE store of record
const [workspaces, setWorkspaces] = useState<TextbookWorkspace[]>(...)

// The DERIVED flat list — never stored, always computed:
const units = useMemo(() => workspaces.flatMap((w) => w.units), [workspaces]);
```

`useMemo(compute, [workspaces])` recomputes `units` only when `workspaces`
changes. `flatMap` flattens `[[book1.units...], [book2.units...]]` into one
array of units.

> **Why force this invariant?** If you stored *both* the workspaces and a separate
> flat unit list, they could **drift apart** — you'd save progress in one and not
> the other, and the app would show stale or conflicting data. By making the flat
> list *always a function of* the workspaces, consistency is *guaranteed by
> construction*. `persistence.ts` even has `isUnitConsistent()` to assert this in
> tests. This is the single most important design idea in the codebase.

Every update flows through `setWorkspaces`. For example, `handleUpdateNodeMastery`
does an *immutable update*: it maps over every workspace, maps over every unit,
then every node, and returns a **new object** when it's the matching node. React
bails out of re-rendering when state doesn't change, but a full `setWorkspaces()`
always re-renders (that's fine at this scale).

---

## 4. Persistence: localStorage, not a database

There's no database anywhere. All progress is saved to the browser via
`localStorage`. Look at `App.tsx`:

```tsx
useEffect(() => {
  localStorage.setItem('awde_workspaces_v1', JSON.stringify(workspaces));
}, [workspaces]);
```

Any time `workspaces` changes, it's serialized and written. On load:

```tsx
const [workspaces, setWorkspaces] = useState<TextbookWorkspace[]>(loadWorkspaces);
```

`loadWorkspaces` (in `persistence.ts`) reads the stored JSON, and if nothing is
there, returns a deep clone of the **seeded default books**
(`DEFAULT_TEXTBOOK_WORKSPACES` from `src/data/textbookWorkspaces.ts`).

`persistence.ts` also handles **migration**: if a user has old-format data
(`awde_units_v1`), it transparently converts it to the new workspace format
(`migrateLegacyUnits`). And `upgradeStoredWorkspaces` backfills newly-added fields
(`detailedExplanation`, `keyTakeaways`) from the seed data so old saved nodes
don't render empty. Everything is wrapped in try/catch so *corrupt* data is
swallowed instead of crashing the app.

> **Why local, not a DB?** For a student learning tool, keeping their data on
> their own device means: no accounts, no servers storing personal data, works
> offline, free to host. The trade-off is their progress doesn't sync across
> devices — an intentional choice for this product.

---

## 5. The AI: "Try Gemini, fall back to deterministic"

Open `server/ai.ts` first. The headline function:

```ts
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}
```

If there's **no API key, it returns `null`.** That `null` is the trigger for the
whole fallback system.

Now look at *every* route in `server.ts`. They all follow the same 4-step shape.
Take `/api/feynman/evaluate` as the template:

```ts
const ai = getGeminiClient();
if (!ai) {
  // FALLBACK: no key → return a deterministic, hand-crafted evaluation
  return res.json({ success: true, isFallback: true, evaluation: generateFallbackFeynmanEvaluation(...) });
}
// otherwise: build prompts, call gemini, parse JSON, return
const response = await withTimeout(ai.models.generateContent({ ... }), AI_TIMEOUT_MS);
```

And the whole thing is wrapped in try/catch:

```ts
} catch (error) {
  // AI failed (timeout/network/API) — never error the student; fall back.
  res.json({ success: true, isFallback: true, evaluation: generateFallbackFeynmanEvaluation(...) });
}
```

So there are **four layers of protection**:

1. **No API key** → deterministic generator.
2. **Local model** (optionally via Groq / NVIDIA fallbacks in `textbook.ts`) →
   try Gemini first, then a fast OpenAI-compatible API.
3. **Timeout** → `withTimeout(promise, 9000)` races the AI call against a 9-second
   timer; if the timer wins, it rejects and you hit the fallback.
4. **Any error** → catch → deterministic generator.

> **Why this design?** The target user is *on weak WiFi*. A stubborn AI call that
> hangs would leave the student staring at a spinner or screaming at a 5xx error.
> The guarantee is: **the app NEVER hangs or hard-fails on AI — it always returns
> a usable, if less "AI-ish," answer.** `isFallback: true` in the response lets
> the UI label the output appropriately.

The `isMain` guard at the bottom of `server.ts` deserves note:

```ts
if (isMain) startServer();
```

It only auto-starts the server when the file is **run directly**, not when it's
imported. Test files `import { app } from './server.ts'` and use supertest to hit
routes without actually binding a port. That's why the server logic is separated
from the "listen" call.

---

## 6. The Weak-Network API Client (from the browser side)

Open `src/lib/api.ts`. The browser doesn't use raw `fetch` for AI — it uses
`postJson`, which wraps fetch with resilience:

- **Fails fast offline** — checks `navigator.onLine` first; if offline, returns an
  `{ error: 'offline' }` result immediately instead of waiting on a doomed request.
- **Timeout via AbortController** — aborts after a default of 8s (was 12 for
  slower calls; uploads use 60–120s).
- **Retries** on *network* errors only (not on HTTP error responses), with backoff.
- **Never throws on an HTTP error** — returns `{ ok: false, status, data }` so
  callers don't need try/catch bloat.
- Returns a standardized `ApiResult<T> = { ok, status, data, isFallback }`.

A component uses it like (see `FeynmanArena.tsx:154`):

```ts
const res = await postJson('/api/feynman/evaluate', { nodeLabel, userExplanation, ... });
if (res.ok) { setEvaluation(res.data.evaluation); }
```

`useOnlineStatus()` is a React hook in the same file that subscribes to the
browser's `online`/`offline` events — `App.tsx` uses it to show the red
"You are offline" banner.

---

## 7. The PDF Pipeline ("Upload my textbook")

`server.ts` route `/api/textbook/process` uses **multer** for file upload:

```ts
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5MB }, fileFilter: pdf-only });
app.post('/api/textbook/process', upload.single('file'), async (req, res) => { ... });
```

Then it delegates to `server/textbook.ts` → `processTextbookPdf`, which does:

1. `extractPdfText(buffer)` — parse the PDF text pages with `pdf-parse`.
2. Send the text to Gemini to build a full `TextbookWorkspace`.
3. If no key / no text / Gemini down → `buildFallbackTextbookWorkspace()` builds a
   deterministic workspace from the extracted text (it even splits the text into
   rough topic lines to generate unit titles).

The browser side (`UploadPdfModal.tsx`) uses `postFormData` (the multipart sibling
of `postJson`) with a long timeout because upload + AI can be slow.

---

## 8. Components: the Props-Down Pattern

Now you understand the data. The UI is a set of **feature components** that
receive the data they need as props from `App.tsx` (the owner of all state). This
is classic "lifting state up / props down."

For example, `MindMapCanvas` receives:

```tsx
<MindMapCanvas unit={currentUnit} language={language}
               onSelectNode={handleSelectNode} selectedNodeId={selectedNode?.id} />
```

It gets the unit to draw and a callback `onSelectNode` to tell `App` "the user
picked this node." It does NOT own the workspaces — it can't mutate them directly.
That's the point: all mutations go back up to `App` through callbacks.

Heavy components are **lazy-loaded** via `React.lazy(...)`:

```tsx
const FeynmanArena = React.lazy(() =>
  import('./components/FeynmanArena').then((m) => ({ default: m.FeynmanArena }))
);
// rendered inside <React.Suspense fallback={<TabSpinner />}>
```

> **Why lazy-load?** FeynmanArena, QuizEngine, MindMapCanvas, etc. are big. If
> they were all in the initial bundle, a student on weak WiFi would wait a long
> time before seeing *anything*. Lazy-loading splits them into separate chunks that
> download **only when that tab is first opened** (`<Suspense>` shows a spinner
> meanwhile). Initial paint is fast; the heavy stuff comes later. This is the same
> reasoning as `vite.config.ts`'s `manualChunks` — splitting vendor libs (React,
> motion, icons) into separate cacheable files so repeated visits reuse them.

---

## 9. Themes, Bilingual, and the Tour (the "fancy" bits)

### Themes
`src/data/themes.ts` defines 5 `AestheticTheme`s. `App.tsx` persists the chosen
one and sets a data attribute on `<html>`:

```tsx
useEffect(() => {
  localStorage.setItem('awde_aesthetic', aesthetic);
  document.documentElement.setAttribute('data-theme', aesthetic);
}, [aesthetic]);
```

Components style themselves with **CSS variables** like `var(--app-accent)` and
`var(--app-text-muted)`. `src/index.css` maps those variables based on
`[data-theme="..."]`. So the *same* components automatically pick up a light or
dark palette without any re-render logic. That's why, in the onboarding tour, I
had to be careful with a dark overlay — the workspace can be near-black.

### Bilingual (EN/AM)
Nearly every data type stores `_Amharic` sibling fields, and UI text uses
`isAmharic ? ... : ...`. `LanguageMode = 'en' | 'am'` is threaded through props.
The AI prompts explicitly ask Gemini to produce both languages (see the
`responseSchema` and system prompts in `server.ts`). For child-simple UI labels,
`App.tsx` has a `getTabTitle()` switch.

### The Onboarding Tour (`OnboardingTour.tsx`)
This is the piece you watched me debug. It's a **DOM spotlight**, not a modal:

- `App.tsx` holds `tourActive` and `hasSeenTour` (persisted as `awde_tour_v2`).
- On first entry it waits 900ms (so the workspace renders, not a blank screen),
  then opens the tour.
- The tour steps carry `selector: '[data-tour="books"]'`. The sidebar buttons have
  `data-tour="books|map|teach"`.
- For each target it calls `getBoundingClientRect()` to find the button's exact
  on-screen box WITHOUT scrolling (scrolling caused the earlier blank bug), then
  draws a glow ring at those coordinates and a radial-gradient veil (so the dark
  UI stays visible — a solid dark overlay erased the workspace, which was the
  "blank screen" bug).
- Re-openable anytime via the header "Tour" button.

This is a great case study in a real bug: "why was it blank?" → because it
scrolled the target off-position (`scrollIntoView` + mid-animation measurement) and
the veil was opaque dark on an already-dark theme. The fix was "measure, don't
scroll" + "radial gradient, not solid dim."

---

## 10. Tests: what they protect

`tests/` uses **Vitest** + **supertest**. The suite (59 tests) clusters around the
most failure-prone, most important logic:

- `persistence.test.ts` — the migration / single-source-of-truth invariants.
- `data-integrity.test.ts` — units trace back to one workspace, no duplicates.
- `ai-generators.test.ts` — the deterministic fallback generators return valid
  structures (so offline mode never breaks).
- `api.integration.test.ts` + `api-helper.test.ts` — hit the Express routes via
  supertest (no port) and check the `isFallback`/error behavior.

`npm run lint` is just `tsc --noEmit` (type-checking). `npm test` runs Vitest.

> **Why test these, and not the React UI?** The UI is subjective and changes fast;
> the *data invariants and API fallbacks* are where a silent bug would corrupt
> everyone's data or break offline mode. That's the highest-value, most stable code
> to lock down with tests.

---

## 11. How to Think About Making Changes

A mental checklist before you edit anything:

1. **Follow the data.** Most features = "read state in `App.tsx`, render it in a
   child, mutate it through a callback." Find the state owner first.
2. **Never store a derived value.** If you're saving the flat unit list *and* the
   workspaces, stop — derive it.
3. **Immutable updates.** When updating state, return new objects (`...spread`),
   don't mutate in place, or React won't re-render.
4. **New AI feature?** Add a `/api/...` route in `server.ts` with a
   `generateFallback...` in `server/ai.ts`, a `postJson` call on the client, and a
   test hitting the route. Follow the existing 4-layer fallback shape.
5. **New UI string?** Provide EN + AM. Keep it simple (the product targets
   10-year-olds, so shorter is better).
6. **Run the checks** before committing: `npm run lint` (typecheck), `npm test`,
   `npm run build`.

---

## 12. File-by-File Cheat Sheet

| File | Role in one line |
|---|---|
| `index.html` | The single HTML shell Vite/Express serves; holds `#root` |
| `src/main.tsx` | Mounts `<App/>` into `#root` with StrictMode + ErrorBoundary |
| `src/App.tsx` | **The brain**: owns all state, decides landing vs workspace, wires tabs & modals |
| `src/types.ts` | The domain schema every other file types against |
| `server.ts` | Express server, all `/api/*` routes, rate limiting, static serving |
| `server/ai.ts` | Gemini client + all `generateFallback*` deterministic generators |
| `server/textbook.ts` | PDF upload → text → AI workspace (+ fallback builder) |
| `src/lib/api.ts` | Weak-wifi-safe `postJson`/`postFormData` + `useOnlineStatus` |
| `src/data/persistence.ts` | localStorage load/save/migrate + the single-source-of-truth logic |
| `src/data/themes.ts` | The 5 design palettes |
| `src/data/curricula.ts` | Seeded legacy curriculum units |
| `src/data/textbookWorkspaces.ts` | Seeded default books (the "no data yet" start) |
| `src/components/LandingPage.tsx` | The cinematic entry screen |
| `src/components/WorkspaceSidebar.tsx` | Left nav (Books/Map/Teach/Quiz/Measure/Focus) + unit list |
| Each feature component | A study mode that gets props from App and calls `/api` |

---

## 13. Three Experiments to Lock It In

The best way to learn is to break it a little. Try each, then `git` your way back:

1. **Prove the single-source-of-truth.** In `App.tsx`, change
   `const units = useMemo(..., [workspaces])` to a separate `useState` that you
   also push to. Watch progress diverge after a node update. Then revert.
2. **Kill the AI key.** In `server/ai.ts`, make `getGeminiClient()` always return
   `null`. Reload the app and generate a quiz — you'll see `isFallback` output
   from the deterministic generator instead of Gemini. Revert.
3. **Recreate the tour bug.** Set the veil back to `bg-slate-950/60 backdrop-blur`
   and run the tour over the dark theme. See the "blank screen" yourself, then
   restore the radial gradient.

---

*This guide describes the code as it stands after the workspace-redesign commit
(`2bafdaf`). When things change, the architecture (one server, local state,
props-down data flow, AI-with-fallback) is the stable part — that's the part to
internalize.*
