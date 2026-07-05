# Sub-project B: Watchlist - Design Spec

**Date:** 2026-07-03
**Status:** Approved-to-build (autonomous per standing directive); design presented below
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**Sidebar reference:** `~/Downloads/Sonny-Dashboard-Home.html` (the watched-target list). No full Watchlist-page mock exists; the view is designed here in the locked system.
**Builds on:** the minimal-shell excision (PR #7). Branches off `feat/minimal-shell-excision`.

## Why this

The new minimal sidebar makes **Watchlist** a first-class nav item with a live watched-target list. The minimal-shell excision stubbed a placeholder `WatchlistView`. This piece makes the Watchlist real: a shared list of watched targets, surfaced in the sidebar and in a dedicated view, with real per-target "new"-signal badges.

## The grounding decision (the crux)

The mock sidebar shows "N catalysts" per target, but **there is no real catalyst data source** in the codebase - "catalyst" appears only in demo prose. Per the project's no-fabricated-data rule, this piece does **not** invent catalyst counts. Instead it uses what is real:
- The **tracked-targets list** already persisted by the feed (`localStorage['lumina:intelligence:trackedTargets:v1']`).
- Real per-target **"new"-signal counts** from the existing `GET /api/intelligence/unread?target=X` route (the feed already uses this).

Catalysts are represented as a "coming soon" affordance until a real catalyst source exists.

## Goal

Formalize the watchlist as a shared store, surface watched targets in the sidebar (with real new-badges) and in a real Watchlist view (add / remove / view-in-feed), and make the feed read from the same store - so there is one source of truth for "what am I tracking."

## Locked decisions

1. **No fabricated catalysts.** Watchlist shows watched targets + real new-signal counts. Catalysts = a small "coming soon" note, not a number.
2. **Single source of truth:** a new `src/lib/watchlist/store.ts` (Zustand) owning the EXISTING key `lumina:intelligence:trackedTargets:v1` (no migration, no data loss). The feed is refactored to consume it (removing its local `trackedTargets` state), so the sidebar, the view, and the feed all share one list.
3. **Sidebar** shows the watched-target list under the Watchlist nav item, each row a real target with a real "new" badge; clicking a target opens the Feed; the Watchlist nav item opens the Watchlist view.
4. **Watchlist view** (designed in the locked system): cards per watched target with add/remove/view-in-feed, a composed empty state, real counts only.

## Section 1 - Watchlist store

**Files:** Create `src/lib/watchlist/store.ts`; Test `src/lib/watchlist/store.test.ts`.

- Zustand store persisting to `localStorage['lumina:intelligence:trackedTargets:v1']` (the existing key - the feed's current data loads unchanged):
  - `targets: string[]` (normalized via `formatTargetDisplayName` from `src/lib/targetNaming`).
  - `add(target: string): void` - normalizes, dedupes case-insensitively, appends, caps at 8, persists.
  - `remove(target: string): void` - removes (case-insensitive), persists.
  - `seedIfEmpty(defaults: string[]): void` - if `targets` is empty, set to the deduped/capped defaults + persist (mirrors the feed's current seed behavior).
- Load initial `targets` from the key on store creation (parse, normalize, dedupe, cap 8), matching the feed's current read logic. SSR guard (`typeof window`).
- **Tests (TDD):** add dedupes case-insensitively + caps at 8 + persists; remove is case-insensitive; seedIfEmpty only seeds when empty; loads pre-existing key data.

## Section 2 - Unread-counts hook

**Files:** Create `src/hooks/useUnreadCounts.ts`.

- `useUnreadCounts(targets: string[]): Record<string, number>` - fetches `GET /api/intelligence/unread?target=<t>` for each target (TanStack Query `useQueries`, same pattern the feed already uses at IntelligenceFeed ~line 737), returns a map of target -> unread count. Missing/erroring targets map to 0 (never a fabricated number). This is the real "new" badge source for the sidebar and the view.
- No backend change; the route already exists.

## Section 3 - Feed refactor (single source)

**Files:** Modify `src/components/views/IntelligenceFeed.tsx`.

- Replace the local `const [trackedTargets, setTrackedTargets] = useState(...)` + the two persistence/seed effects with the store: `const trackedTargets = useWatchlistStore((s) => s.targets)` and a `useEffect` that calls `useWatchlistStore.getState().seedIfEmpty(defaultTrackedTargets)` when empty. Any place that mutated `setTrackedTargets` (e.g. add/remove in the feed) now calls the store's `add`/`remove`. Keep everything else (queries, rendering) working. The feed keeps reading the SAME localStorage key, so no data changes; only the ownership moves to the store.
- This is a targeted refactor; the feed's visual adoption is piece C.

## Section 4 - Sidebar watched-target list

**Files:** Modify `src/components/Sidebar.tsx`.

- Under the Watchlist nav item, render the watched-target list from `useWatchlistStore` (per the mock's sidebar): each target as a compact row (target name in Geist, a small "N new" badge from `useUnreadCounts` when > 0). Clicking a row switches to the Feed (`onViewChange('feed')`) - deep target-filtering in the feed is out of scope here; opening the feed is enough (the feed already covers all tracked targets). Keep the four-item nav + Engine-online exactly as the minimal shell; the watched list sits under/attached to the Watchlist item. If the list is empty, show nothing extra (the Watchlist view handles the empty state). No fabricated badges.

## Section 5 - Watchlist view

**Files:** Rewrite `src/components/watchlist/WatchlistView.tsx` (replace the placeholder). Optional sibling `WatchlistTargetCard.tsx`.

- Header (Newsreader "Watchlist" title + a line "Targets Sonny is monitoring for new papers, trials, and patents").
- An **add-target** input ("Add a target - e.g. CDCP1") that calls `store.add` on submit (Enter), normalized; trims/ignores empty.
- A grid/list of **watched-target cards**, each: the target name (Geist, prominent), a real "N new signals" count from `useUnreadCounts` (or "No new signals" when 0 - never invented), a "View in feed" action (`onViewInFeed?.()` -> App switches to feed), and a "Remove" action (`store.remove`). A small muted "Catalysts - coming soon" line per card (honest placeholder, no number).
- **Empty state** (no targets): composed per the design doc - "Your watchlist is empty", a line explaining Sonny monitors watched targets, and the add-target input as the primary affordance.
- Light tokens, Geist/Newsreader, `.tactile` on cards/buttons, honor `prefers-reduced-motion`. `WatchlistView` gets an `onViewInFeed?: () => void` prop; `App.tsx` passes `() => setCurrentView('feed')`.

## Non-goals (deferred)

- Real **catalysts** (dates/events) - no data source; "coming soon" until one exists.
- **Target-filtered feed** (open the feed pre-filtered to one target) - opening the feed is enough for now; deep-link filtering is a feed concern (piece C).
- **Feed visual adoption** to `Sonny-Feed.html` - piece C.
- Server-side watchlist / cross-device sync - localStorage only.
- Any change to the research engine, dossiers, or backend routes.

## Error handling / edge cases

- **Unread fetch fails / backend off:** counts map to 0; no badge, no error thrown; the view/sidebar still render the targets.
- **Duplicate / whitespace target add:** normalized + deduped (case-insensitive); empty input ignored.
- **Cap at 8** watched targets (matches the feed's existing cap); adding beyond drops the oldest or ignores - ignore-with-no-op is simplest; document which.
- **Reduced motion:** card/hover animations disabled.

## Verification / success criteria

1. `npm run build` clean; `npx vitest run` green (the new store test + all existing). The store is the only new logic and is TDD'd.
2. **Sonny engine/dossiers untouched:** `git diff` touches no `src/lib/research/*`, `useDeepResearchStream`, `src/components/research/*`, `src/components/dossiers/*`, or `server/`.
3. **Grounded:** no fabricated catalyst numbers anywhere; badges/counts come only from `useUnreadCounts` (real route) or the real targets list; 0 renders as "no new signals"/no badge, never a made-up number.
4. **Playwright (fresh context):** the Watchlist view lists the watched targets with real counts (or "coming soon"/empty state when none); adding a target adds a card AND a sidebar row; removing removes both; "View in feed" switches to the feed; the feed still renders using the shared store. Light, responsive, 0 real console errors. Screenshots as evidence.
5. The feed and the sidebar reflect the SAME target list (add in the view -> appears in the sidebar and is tracked by the feed).

## File / task boundaries (for the plan)

- **Task 1:** `watchlist` store + TDD test (add/remove/seedIfEmpty/load, same key).
- **Task 2:** `useUnreadCounts` hook (real unread route).
- **Task 3:** feed refactor to consume the store (single source; no behavior change).
- **Task 4:** sidebar watched-target list + real new-badges.
- **Task 5:** Watchlist view (cards, add/remove, view-in-feed, empty state) + App `onViewInFeed` wiring.
- **Task 6:** verification - build/tests, engine-untouched proof, fresh-context Playwright.

---

*Piece B of the design refresh. Next: `writing-plans`, then subagent-driven-development on `feat/watchlist`.*
