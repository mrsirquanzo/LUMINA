# Sub-project 3a: Dossiers Library + Drill-in - Design Spec

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**Visual reference:** `docs/design/sonny-dossiers-mock.html` (library), `docs/design/sonny-dossier-drill-mock.html` (drill-in)
**Builds on:** SP2 (Ask-Sonny front door, PR #5) - this branches off `feat/sonny-front-door` and reuses SP2's `ResearchDossier`.

## Why this, and why first

The LUMINA redesign's third phase ("relight surviving views + persona decision") decomposes into three independent sub-projects: **SP3a - Dossiers library + drill-in**, SP3b - Feed + Watchlist, SP3c - Dashboards + persona decision.
SP3a is first because it is the tight, low-risk completion of what SP2 shipped.

SP2 gave the app a Sonny home that runs deep research and shows a conclusion-first dossier - but once the user moves on, that finished run is not browsable.
The data is already durable (`briefingStore` persists every run's briefing by `runId` in localStorage), so a library is mostly presentation over data that already exists: high coherence with SP2, low risk, and it closes the "where did my run go" gap for free.

## Goal

A **Dossiers library** view listing every persisted briefing as a card (verdict + target + snippet + date, filterable and searchable), and a **drill-in drawer** that renders the full conclusion-first dossier by reusing SP2's `ResearchDossier` unchanged.
No new backend, no engine change; a completed Sonny run appears in the library automatically because it already persists.

## Locked decisions (from brainstorming)

1. The library is a **first-class view** reached from a new sidebar "Dossiers" nav item (new `ViewState 'dossiers'`).
2. It reads from the existing **`briefingStore`** (persisted briefings); it is **read-only** over that data except for one minimal extension: record a `savedAt` timestamp on save so the list can sort by recency.
3. The drill-in is a **right-side slide-in drawer** (~820px, full-screen < 768px) that **reuses SP2's `ResearchDossier` component unchanged**. No dossier-rendering rebuild.
4. **Grounded:** every card and dossier is a real persisted briefing. No invented entries, no placeholder metrics, no sample dossiers.

## Section 1 - Placement and nav

**Files:** `src/types/index.ts` (add `'dossiers'` to `ViewState`), `src/App.tsx` (render the library at `currentView === 'dossiers'`), `src/components/Sidebar.tsx` (add the nav item).

- `ViewState` gains `'dossiers'`: `'dashboard' | 'feed' | 'workspaces' | 'history' | 'research' | 'dossiers'`.
- `App.tsx` renders `<DossiersLibrary />` when `currentView === 'dossiers'`, following the same pattern as the other views.
- `Sidebar.tsx` adds a "Dossiers" nav item (a suitable Lucide icon, e.g. `FolderArchive` or `Library`) directly under the "Sonny" item, in the same `navItems` array so it gets the active-state and tactile treatment for free.

## Section 2 - Library view

**Files:** Create `src/components/dossiers/DossiersLibrary.tsx` (+ a `DossierCard.tsx` sibling if cleaner). Build to `docs/design/sonny-dossiers-mock.html`.

- **Data source:** subscribe to `useBriefingStore` and read `briefings` (`Record<runId, BriefingView>`). Derive a display list: for each entry, `{ runId, target, verdict, snippet, savedAt }` where `target = briefing.target`, `verdict = briefing.recommendation?.verdict`, `snippet = first ~1 line of briefing.executiveRead`, `savedAt` from the store extension (Section 4). Entries missing a field render that field empty/omitted, never a made-up value.
- **Card:** verdict pill (GO/WATCH/NO-GO via the `go`/`watch`/`nogo` tokens) + target (Geist, prominent) + executive-read snippet + relative date. Hover-lift + tactile; click opens the drawer (Section 3).
- **Filters:** tabs All / GO / WATCH / NO-GO (filter by `verdict`), plus a search-by-target input. Counts per tab reflect the real data.
- **Sort:** most recent first by `savedAt` (entries without `savedAt` sort last, in a stable order).
- **Empty state:** composed and instructive per the design doc ("No dossiers yet - ask Sonny a question on the Sonny home; finished runs land here"), with a button/link that switches `currentView` to `'research'` (the Sonny home). A filtered-to-empty state (e.g. no NO-GO dossiers) shows a lighter "No NO-GO dossiers yet" message, distinct from the true-empty state.
- **Grid:** responsive card grid (single column < 768px). No 3-equal-card feature row constraint applies to a data list grid, but keep consistent gutters and container width per the design system.

## Section 3 - Drill-in drawer

**Files:** Create `src/components/dossiers/DossierDrawer.tsx`. Build to `docs/design/sonny-dossier-drill-mock.html`.

- A right-side slide-in drawer, ~820px wide, full-screen below 768px, over a scrim.
- Opens when a library card is clicked (the library holds `selectedRunId` state; the drawer reads `briefings[selectedRunId]`).
- **Renders the conclusion-first dossier by reusing SP2's `ResearchDossier` unchanged** - pass it the selected `BriefingView`. The drawer is only the shell (slide-in animation, scrim, header with target + close, scroll container); it does not re-implement dossier markup.
- **Close:** scrim click, an X button, and the Esc key. Focus is trapped while open and restored on close (accessibility). Honor `prefers-reduced-motion` (no slide animation, instant show).
- Motion: `transform`/`opacity` only; slide from the right; scrim fade.

## Section 4 - Data extension (minimal)

**Files:** `src/lib/research/briefingStore.ts`.

- Extend the stored shape so each briefing records a `savedAt` (ISO string or epoch ms) set at `setBriefing` time. Concretely: store `Record<runId, { briefing: BriefingView; savedAt: number }>` OR a parallel `Record<runId, number>` timestamp map - whichever is least disruptive to existing `getBriefing`/`setBriefing` consumers (the SP2 home reads `briefings[runId]` as a `BriefingView`; preserve that read shape or update the one call site).
- **Backward compatibility:** pre-existing persisted briefings (saved before this change) have no `savedAt`; on load, treat missing `savedAt` as `0`/undefined so they sort last and nothing crashes. The localStorage key stays `lumina:research:briefings:v1` unless the shape change requires a migration - if it does, migrate on load (read old shape, wrap with `savedAt: 0`) rather than dropping data.
- This is the ONLY data-layer change. The SSE route, `useDeepResearchStream`, `traceStore`, aggregation, and the server are untouched.

## Non-goals (deferred)

- Server-side dossier storage / cross-device sync - localStorage only (as today).
- Editing, tagging, deleting, or exporting dossiers from the library - view + open only. (A real dossier Export is a separate loose end.)
- The Feed redesign, Watchlist, dashboards, and persona decision - SP3b / SP3c.
- Any change to how dossiers are generated or what `ResearchDossier` renders - reused as-is.

## Error handling / edge cases

- **Empty store:** true-empty composed state (Section 2), not a blank screen or a spinner.
- **Malformed / partial briefing:** a briefing missing `recommendation`/`target` renders the card with those fields omitted and still opens a drawer showing whatever the dossier has (ResearchDossier already handles absent fields). Never fabricate.
- **Unknown verdict value:** if `verdict` is not GO/WATCH/NO-GO, the card shows a neutral pill and lands under "All" (not miscolored as a semantic status).
- **Reduced motion:** drawer and card animations disabled; instant render.
- **Deep link:** opening the library with a `?runId=` (optional, low priority) may auto-open that dossier's drawer - include only if trivial; otherwise omit.

## Verification / success criteria

1. `npm run build` clean (tsc -b + vite); `npx vitest run` green. The `briefingStore` change is covered by its existing test file (`src/lib/research/briefingStore.test.ts`) - update/extend that test for the `savedAt` behavior and backward-compat load (this IS a logic change, so it gets a real test).
2. **Engine-untouched proof (except briefingStore):** `git diff` touches no file under `src/lib/research/*` OTHER than `briefingStore.ts` (+ its test), and does not touch `useDeepResearchStream.ts`, `traceStore.ts`, `aggregate.ts`, `sseParse.ts`, or the server route.
3. **Playwright:** with at least one persisted dossier (run one from the Sonny home first, or seed the store), the Dossiers view lists it, the filter tabs and target search work, clicking a card opens the drawer with the conclusion-first dossier (verdict pill first, semantic colors), and Esc/scrim/X close it. Empty state renders when the store is empty. Light and responsive at 1440/768/375, 0 console errors. Screenshots as evidence.
4. A completed run started from the Sonny home appears in the Dossiers library without any extra user action.

## File / task boundaries (for the plan)

- **Task 1:** `briefingStore` `savedAt` extension + backward-compat load + test (the only logic change; TDD).
- **Task 2:** nav seam - add `'dossiers'` to `ViewState`, the sidebar nav item, and the `App.tsx` render branch (rendering a placeholder library shell).
- **Task 3:** `DossiersLibrary` - cards, filter tabs, search, sort, empty states (build to the mock; grounded).
- **Task 4:** `DossierDrawer` - slide-in shell reusing `ResearchDossier`, close/focus/reduced-motion.
- **Task 5:** verification - build/tests, engine-untouched proof, Playwright library + drawer + empty-state pass with screenshots.

Each task ends with a building, independently reviewable diff.

---

*First of the SP3 trio; next: `writing-plans`, then subagent-driven-development on a branch cut from `feat/sonny-front-door`.*
