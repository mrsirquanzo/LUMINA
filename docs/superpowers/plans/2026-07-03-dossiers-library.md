# Dossiers Library + Drill-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Dossiers library view that lists every persisted briefing as a filterable/searchable card and opens a drill-in drawer rendering the full conclusion-first dossier.

**Architecture:** A new `'dossiers'` view reads the existing `briefingStore` (localStorage-persisted briefings, already keyed by runId) and renders cards; clicking a card opens a right-side drawer that reuses SP2's `ResearchDossier` unchanged. The only logic change is a parallel `savedAt` timestamp map added to `briefingStore` for recency sort - the `briefings[runId] -> BriefingView` read shape stays identical, so no consumer breaks and no migration is needed.

**Tech Stack:** React 19, Vite 7, Tailwind 3.4 (light tokens + Geist/Newsreader/Geist Mono from SP1), Zustand, Vitest 4, Playwright (MCP).

**Spec:** `docs/superpowers/specs/2026-07-03-dossiers-library-design.md`
**Design system:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**Visual reference:** `docs/design/sonny-dossiers-mock.html` (library), `docs/design/sonny-dossier-drill-mock.html` (drill-in)

## Global Constraints

- **Grounded, no fabricated data.** Every card and dossier is a real persisted briefing from `briefingStore`. No invented entries, placeholder metrics, or sample dossiers. Missing fields render empty/omitted, never a made-up value.
- **Reuse `ResearchDossier` unchanged.** The drill-in drawer wraps SP2's `src/components/research/ResearchDossier.tsx` (props: `{ briefing: BriefingView }`); do NOT re-implement or restyle dossier markup.
- **Data layer: only `briefingStore.ts` changes.** No change to `useDeepResearchStream.ts`, `traceStore.ts`, `aggregate.ts`, `sseParse.ts`, `sseTypes.ts`, or any server route. The `briefings[runId] -> BriefingView` read shape must stay identical (SP2's home reads `briefings[s.runId]`).
- **Backward compatible.** Pre-existing localStorage (`lumina:research:briefings:v1`) with no `savedAt` map must load without error; those briefings sort last.
- **Semantic colors.** Verdict pills use the `go`/`watch`/`nogo` tokens, never blue. An unknown verdict is a neutral pill, not miscolored.
- **Design system:** light tokens (page/surface/subtle/border/ink, primary blue), Geist UI, Newsreader (`font-display`) for titles, Geist Mono (`font-mono`) for ids; `.tactile` on interactive cards; hover-lift; honor `prefers-reduced-motion`.
- **Accessibility:** drawer traps focus while open, restores focus on close, closes on Esc / scrim / X.
- **Commit style:** plain hyphens, no agent co-author line. Stage only the files a task touches (explicit `git add`, never `git add -A`). Logic changes run BOTH `npx vitest run` AND `npm run build`.

---

### Task 1: `briefingStore` savedAt extension (TDD)

**Files:**
- Modify: `src/lib/research/briefingStore.ts`
- Test: `src/lib/research/briefingStore.test.ts` (extend existing)

**Interfaces:**
- Consumes: `BriefingView` from `./sseTypes`.
- Produces: `useBriefingStore` now also exposes `savedAt: Record<string, number>`; `setBriefing(runId, b)` records `savedAt[runId] = Date.now()`. `briefings` and `getBriefing` are unchanged. Later tasks read `briefings` + `savedAt` for the library list and sort.

**Context:** A parallel `savedAt` map (not a wrapper around `BriefingView`) keeps the `briefings[runId] -> BriefingView` shape identical, so SP2's home (`briefings[s.runId]`) and the new drawer keep working and no migration is needed.

- [ ] **Step 1: Read the existing test to match its style**

Read `src/lib/research/briefingStore.test.ts` and note how it resets localStorage / the store between tests (it must isolate `localStorage`). Follow that same setup for the new tests.

- [ ] **Step 2: Write the failing tests**

Add these tests to `src/lib/research/briefingStore.test.ts` (adapt the reset/setup to match the file's existing pattern):

```ts
it('records a savedAt timestamp when a briefing is set', () => {
  const before = Date.now();
  useBriefingStore.getState().setBriefing('TROP2-abc', { target: 'TROP2' } as BriefingView);
  const { briefings, savedAt } = useBriefingStore.getState();
  // read shape unchanged: briefings[runId] is the BriefingView
  expect(briefings['TROP2-abc']).toEqual({ target: 'TROP2' });
  // savedAt recorded as a recent epoch ms
  expect(typeof savedAt['TROP2-abc']).toBe('number');
  expect(savedAt['TROP2-abc']).toBeGreaterThanOrEqual(before);
});

it('loads pre-existing briefings that have no savedAt map (backward compat)', () => {
  // Simulate old persisted data: only the briefings blob, no savedAt key
  localStorage.setItem(
    'lumina:research:briefings:v1',
    JSON.stringify({ 'OLD-1': { target: 'KRAS' } }),
  );
  localStorage.removeItem('lumina:research:briefings-savedAt:v1');
  const loaded = loadBriefingsForTest(); // see Step 3 - exported helper OR re-create store
  expect(loaded.briefings['OLD-1']).toEqual({ target: 'KRAS' });
  expect(loaded.savedAt['OLD-1']).toBeUndefined(); // missing -> undefined, sorts last
});
```

If the existing test imports the store as a singleton and cannot re-trigger load, instead assert backward-compat by pre-seeding localStorage BEFORE importing the store in a fresh test module, or export a small `loadState()` helper from `briefingStore.ts` and test it directly (Step 3 exports it).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/research/briefingStore.test.ts`
Expected: FAIL - `savedAt` is undefined on the store / helper not exported.

- [ ] **Step 4: Implement the savedAt map**

Replace `src/lib/research/briefingStore.ts` with:

```ts
import { create } from 'zustand';
import type { BriefingView } from './sseTypes.js';

const STORAGE_KEY = 'lumina:research:briefings:v1';
const SAVED_AT_KEY = 'lumina:research:briefings-savedAt:v1';

function loadBriefings(): Record<string, BriefingView> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Record<string, BriefingView>;
  } catch {
    // ignore
  }
  return {};
}

function loadSavedAt(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(SAVED_AT_KEY);
    if (stored) return JSON.parse(stored) as Record<string, number>;
  } catch {
    // ignore
  }
  return {};
}

function saveBriefings(briefings: Record<string, BriefingView>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(briefings));
  } catch {
    // ignore
  }
}

function saveSavedAt(savedAt: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_AT_KEY, JSON.stringify(savedAt));
  } catch {
    // ignore
  }
}

/** Exported for tests: the initial persisted state. */
export function loadState(): { briefings: Record<string, BriefingView>; savedAt: Record<string, number> } {
  return { briefings: loadBriefings(), savedAt: loadSavedAt() };
}

interface BriefingStore {
  briefings: Record<string, BriefingView>;
  savedAt: Record<string, number>;
  setBriefing(runId: string, b: BriefingView): void;
  getBriefing(runId: string): BriefingView | undefined;
}

export const useBriefingStore = create<BriefingStore>()((set, get) => ({
  ...loadState(),
  setBriefing: (runId, b) =>
    set((s) => {
      const briefings = { ...s.briefings, [runId]: b };
      const savedAt = { ...s.savedAt, [runId]: Date.now() };
      saveBriefings(briefings);
      saveSavedAt(savedAt);
      return { briefings, savedAt };
    }),
  getBriefing: (runId) => get().briefings[runId],
}));
```

If your Step 2 test used `loadBriefingsForTest`, rename it to `loadState` to match this export.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/research/briefingStore.test.ts`
Expected: PASS (new tests + all pre-existing tests in the file).

- [ ] **Step 6: Full gate**

Run: `npx vitest run` (all green) and `npm run build` (clean - confirms SP2's home still typechecks against the unchanged `briefings[runId]` read).

- [ ] **Step 7: Commit**

```bash
git add src/lib/research/briefingStore.ts src/lib/research/briefingStore.test.ts
git commit -m "feat(dossiers): record savedAt timestamps in briefingStore for recency sort"
```

---

### Task 2: Nav seam - `dossiers` view

**Files:**
- Modify: `src/types/index.ts:9` (ViewState)
- Modify: `src/App.tsx` (render branch)
- Modify: `src/components/Sidebar.tsx` (nav item)
- Create: `src/components/dossiers/DossiersLibrary.tsx` (placeholder shell this task; filled in Task 3)

**Interfaces:**
- Consumes: `ViewState`.
- Produces: `currentView === 'dossiers'` renders `<DossiersLibrary />`; a "Dossiers" sidebar item switches to it.

- [ ] **Step 1: Add the ViewState**

In `src/types/index.ts` line 9 change:
```ts
export type ViewState = 'dashboard' | 'feed' | 'workspaces' | 'history' | 'research';
```
to:
```ts
export type ViewState = 'dashboard' | 'feed' | 'workspaces' | 'history' | 'research' | 'dossiers';
```

- [ ] **Step 2: Placeholder library shell**

Create `src/components/dossiers/DossiersLibrary.tsx`:
```tsx
export function DossiersLibrary() {
  return (
    <div className="w-full min-h-full p-6">
      <h1 className="font-display text-2xl font-semibold text-textPrimary">Dossiers</h1>
    </div>
  );
}

export default DossiersLibrary;
```

- [ ] **Step 3: Render branch in App.tsx**

Add an import near the other view imports in `src/App.tsx` (e.g. next to `SonnyResearchDashboard`):
```tsx
import DossiersLibrary from './components/dossiers/DossiersLibrary';
```
Add a render branch next to the existing `currentView === 'research'` block (around line 543-547), matching that block's wrapper structure:
```tsx
                {currentView === 'dossiers' && (
                  <DossiersLibrary />
                )}
```

- [ ] **Step 4: Sidebar nav item**

In `src/components/Sidebar.tsx`, add `Library` to the existing `lucide-react` import, and add to the `navItems` array (right after the `research`/Sonny item, ~line 347):
```tsx
    { id: 'dossiers' as ViewState, icon: Library, label: 'Dossiers' },
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build` (clean) and `npx vitest run` (all pass).
`npm run dev`: a "Dossiers" sidebar item appears under "Sonny"; clicking it shows the "Dossiers" heading; no console error.
```bash
git add src/types/index.ts src/App.tsx src/components/Sidebar.tsx src/components/dossiers/DossiersLibrary.tsx
git commit -m "feat(dossiers): add Dossiers view seam - ViewState, nav item, render branch"
```

---

### Task 3: DossiersLibrary - cards, filters, search, empty states

**Files:**
- Modify: `src/components/dossiers/DossiersLibrary.tsx`
- Create: `src/components/dossiers/DossierCard.tsx` (if cleaner)
- Reference (read-only): `docs/design/sonny-dossiers-mock.html`, `docs/design/SONNY_DASHBOARD_DESIGN.md`.

**Interfaces:**
- Consumes: `useBriefingStore` (`briefings: Record<runId, BriefingView>`, `savedAt: Record<runId, number>`). `BriefingView` fields used: `target?`, `recommendation?.verdict?`, `executiveRead?`.
- Produces: a `selectedRunId` state + a setter passed to the drawer in Task 4. Export the shape the drawer needs: the library owns `const [selectedRunId, setSelectedRunId] = useState<string | null>(null)` and renders `<DossierDrawer runId={selectedRunId} onClose={() => setSelectedRunId(null)} />` (Task 4 creates that component).

**Context:** Build to the mock. Grounded: derive the card list from the store; render empty when there is no data. No invented values.

- [ ] **Step 1: Derive the list**

In `DossiersLibrary`, subscribe to `useBriefingStore`. Build `const items = Object.entries(briefings).map(([runId, b]) => ({ runId, target: b.target, verdict: b.recommendation?.verdict, snippet: b.executiveRead?.split('\n')[0] ?? '', savedAt: savedAt[runId] ?? 0 }))`. Sort by `savedAt` descending (missing -> 0 -> last).

- [ ] **Step 2: Filter + search state**

Add `const [filter, setFilter] = useState<'all'|'GO'|'WATCH'|'NO-GO'>('all')` and `const [query, setQuery] = useState('')`. Compute the visible list: filter by `verdict` when `filter !== 'all'` (normalize verdict casing to match GO/WATCH/NO-GO), and by `target` containing `query` (case-insensitive). Tab counts reflect the real per-verdict counts.

- [ ] **Step 3: Cards + filter tabs + search UI (build to mock)**

Render, per the mock: a header (Newsreader title), the filter tabs (All / GO / WATCH / NO-GO with real counts), a target search input, and a responsive card grid. Each card (inline or a `DossierCard` component): verdict pill (`go`/`watch`/`nogo` tokens; unknown verdict -> neutral `bg-subtle text-textSecondary` pill), target (Geist, prominent), the snippet (`text-textSecondary`, truncated), and a relative date from `savedAt` (omit the date if `savedAt` is 0). Card is `.tactile`, hover-lifts, `cursor-pointer`, and `onClick={() => setSelectedRunId(item.runId)}`.

- [ ] **Step 4: Empty states**

If the store has zero briefings, render the composed true-empty state per the design doc: an illustration/icon, "No dossiers yet", a line explaining finished Sonny runs land here, and a button that calls the app's view switcher to go to the Sonny home. (The library receives no view-switch prop today; add an `onOpenSonny?: () => void` prop and have `App.tsx` pass `() => setCurrentView('research')`.) If the store is non-empty but the current filter/search yields nothing, render a lighter inline "No [verdict] dossiers" / "No dossiers match \"[query]\"" message instead of the true-empty composition.

- [ ] **Step 5: Wire onOpenSonny from App**

In `src/App.tsx`, update the render branch to `<DossiersLibrary onOpenSonny={() => setCurrentView('research')} />`.

- [ ] **Step 6: Verify + commit**

Run: `npm run build` (clean) and `npx vitest run` (all pass).
`npm run dev`: seed at least one dossier (run one from the Sonny home, or in devtools set `localStorage['lumina:research:briefings:v1']`); the library lists it with the right verdict color, filter tabs and search work, and the empty state shows when the store is cleared.
```bash
git add src/components/dossiers/DossiersLibrary.tsx src/components/dossiers/DossierCard.tsx src/App.tsx
git commit -m "feat(dossiers): library cards, verdict filters, target search, empty states"
```

---

### Task 4: DossierDrawer - drill-in reusing ResearchDossier

**Files:**
- Create: `src/components/dossiers/DossierDrawer.tsx`
- Modify: `src/components/dossiers/DossiersLibrary.tsx` (render the drawer)
- Reference (read-only): `docs/design/sonny-dossier-drill-mock.html`.

**Interfaces:**
- Consumes: `useBriefingStore` (to read `briefings[runId]`), and `ResearchDossier` from `../research/ResearchDossier` (props `{ briefing: BriefingView }`).
- Produces: `DossierDrawer({ runId: string | null; onClose: () => void })` - renders nothing when `runId` is null; otherwise a slide-in drawer over a scrim showing the dossier.

**Context:** The drawer is only a shell (slide-in, scrim, header, scroll, close/focus). The dossier body is `ResearchDossier` reused unchanged. Build the shell to the drill mock.

- [ ] **Step 1: Drawer shell**

Create `src/components/dossiers/DossierDrawer.tsx`: when `runId` is set, read `const briefing = useBriefingStore((s) => (runId ? s.briefings[runId] : undefined))`. Render a fixed right-side panel (`~820px`, `w-full` below `md`) with a translucent scrim behind it (`bg-slate-900/40`), a header (target from `briefing?.target` + a close X), and a scroll container that renders `{briefing ? <ResearchDossier briefing={briefing} /> : <p>Dossier not found.</p>}`. Slide-in via `transform`/`opacity` transition.

- [ ] **Step 2: Close, focus, reduced-motion**

Close on: scrim click, the X button, and the Esc key (`useEffect` adding a `keydown` listener while open, removed on unmount/close). Trap focus within the drawer while open and restore focus to the previously-focused element on close. Under `prefers-reduced-motion`, skip the slide animation (render instantly). Add `role="dialog"` + `aria-modal="true"` + an `aria-label` with the target.

- [ ] **Step 3: Render from the library**

In `DossiersLibrary.tsx`, render `<DossierDrawer runId={selectedRunId} onClose={() => setSelectedRunId(null)} />` at the end of the component.

- [ ] **Step 4: Verify + commit**

Run: `npm run build` (clean) and `npx vitest run` (all pass).
`npm run dev`: click a dossier card -> the drawer slides in showing the conclusion-first dossier (verdict pill first, semantic colors, references) via the reused `ResearchDossier`; Esc / scrim / X close it; focus returns to the card.
```bash
git add src/components/dossiers/DossierDrawer.tsx src/components/dossiers/DossiersLibrary.tsx
git commit -m "feat(dossiers): drill-in drawer reusing ResearchDossier with focus + esc close"
```

---

### Task 5: Verification - library + drawer light audit

**Files:**
- No source changes (fixes loop back to owning task files).
- Create: `docs/design/dossiers-evidence/` (screenshots).

**Interfaces:**
- Consumes: the finished library + drawer.
- Produces: pass/fail evidence.

**Context:** Restart the dev server fresh and use a fresh Playwright browser context (lesson from SP2: stale HMR/browser cache produces phantom errors after new files/edits).

- [ ] **Step 1: Build, tests, engine-untouched proof**

Run: `npm run build` (clean) and `npx vitest run` (all green).
Run: `git diff --name-only feat/sonny-front-door..HEAD | grep -E "src/lib/research/" | grep -v "briefingStore"`
Expected: **no output** - `briefingStore.ts`/`.test.ts` are the only `src/lib/research/*` files changed. Also confirm no diff to `src/hooks/useDeepResearchStream.ts` or any `server/` file.

- [ ] **Step 2: Fresh server + fresh browser context**

Restart: `pkill -f vite; rm -rf node_modules/.vite; npm run dev`. In Playwright MCP, call `browser_close` first (drop stale context), then navigate fresh to `http://localhost:5173`.

- [ ] **Step 3: Seed + audit**

Ensure at least one persisted dossier exists (run one from the Sonny home, or `browser_evaluate` to set `localStorage['lumina:research:briefings:v1']` and `...savedAt:v1'` with a small sample, then reload). At 1440x900, 768x1024, 375x812:
- Open the Dossiers view; confirm it lists the persisted dossier(s) with correct verdict colors and dates.
- Filter tabs (All/GO/WATCH/NO-GO) and target search filter the list correctly.
- Click a card -> drawer opens with the conclusion-first dossier (verdict pill first, semantic colors); Esc and scrim and X each close it.
- Clear the store (`browser_evaluate` remove the keys, reload) -> the composed empty state renders with a working "go to Sonny" action.
- Light, legible, 0 console errors (ignore backend 500s), no horizontal scroll.
- Screenshots to `docs/design/dossiers-evidence/library-<width>.png`, `drawer-1440.png`, `empty-1440.png`.

- [ ] **Step 4: Punch-list + fix**

Fix any finding in the owning task's file(s), rebuild, re-screenshot until clean.

- [ ] **Step 5: Commit evidence**

```bash
git add docs/design/dossiers-evidence
git commit -m "test(dossiers): verification evidence - library, filters, drawer, empty state"
```

---

## Self-Review

**Spec coverage:**
- Placement/nav/new ViewState -> Task 2. ✓
- Library view (cards, filters, search, sort, empty states) -> Task 3. ✓
- Drill-in drawer reusing ResearchDossier (close/focus/reduced-motion) -> Task 4. ✓
- `savedAt` data extension + backward compat + test -> Task 1. ✓
- Grounded / semantic colors / reduced-motion / a11y -> Global Constraints + Tasks 3-4. ✓
- Verification (build/tests, engine-untouched-except-briefingStore proof, Playwright, fresh context) -> Task 5. ✓
- Non-goals (server storage, edit/delete/export, feed/watchlist/dashboards) -> not tasked, consistent with spec. ✓

**Placeholder scan:** Task 1 carries verbatim store + test code. UI Tasks 3-4 build to the named mock with exact store fields and component props given, and concrete acceptance - the honest shape of a designed-view build. No TBD/TODO.

**Type/name consistency:** `useBriefingStore` now exposes `briefings`/`savedAt`/`setBriefing`/`getBriefing` (Task 1), read identically in Tasks 3-4. `ViewState` adds `'dossiers'` (Task 2), used in the App branch and Sidebar item. `DossierDrawer({ runId, onClose })` and `DossiersLibrary({ onOpenSonny })` signatures are defined where produced and consumed consistently. `ResearchDossier` prop `{ briefing: BriefingView }` matches SP2.

**Note on TDD:** Task 1 (the only logic) is full TDD with real tests. Tasks 2-4 are presentation over existing data; their gate is build + existing tests green + Playwright visual/interaction acceptance, which is the correct strategy for view work (no invented behavior to unit-test).
