# Home + Sidebar Layout Alignment - Design Spec

**Date:** 2026-07-04
**Status:** Approved-to-build (autonomous per standing directive)
**Layout reference:** `~/Downloads/Sonny Dashboard.html` (rendered to `docs/design/ref-sonny-dashboard-full.png`) - **LAYOUT ONLY**.
**Design system source of truth (unchanged):** `docs/design/SONNY_DASHBOARD_DESIGN.md` (Geist/Newsreader/Geist Mono, slate `#F6F8FB` + blue `#1D4ED8` + semantic RAG).
**Builds on:** Watchlist (PR #8). Branches off `feat/watchlist`.

## Why this + the hard boundary

The user provided `~/Downloads/Sonny Dashboard.html` and asked to "match the layout" - but that file is the retired **Ponder** theme (Source Serif 4 / Inter, sand/navy/bronze). Explicit instruction: **do NOT adopt the Ponder theme; take only the LAYOUT** and apply it in our locked Geist/Newsreader/blue system.

Our current Ask-Sonny home + minimal sidebar are already close to that reference's composition. This piece closes the layout deltas.

## Goal

Refine the Ask-Sonny home and the sidebar to the reference's layout - a vertical agent console - keeping our theme and staying fully grounded (no fabricated data).

## The layout deltas (reference vs. current) - the exact scope

**Sidebar** (current: wordmark + 4 nav + watched-target list + Engine-online):
1. **Real count badges on nav items:** Feed shows total unread across watched targets; Dossiers shows the count of saved dossiers (`briefingStore`). Ask Sonny + Watchlist: no badge.
2. **"WATCHLIST" section framing:** a small section header ("WATCHLIST", micro/uppercase) above the watched-target list, with the count of watched targets on the right; plus an **"Add to watchlist"** row at the bottom of the list that switches to the Watchlist view (`onViewChange('watchlist')`).
3. NO "N catalysts" number (no data source), NO invented target type-tags.

**Ask-Sonny home** (current: composer + capability cards + run -> trace -> inline dossier):
4. **View header row** at the top of main: an "Ask Sonny" title (`font-display`) on the left; the right side shows a subtle, static, honest status label (e.g. "Deep research" or the real configured backend if trivially readable) - **not** a fake model dropdown and **no** "DEMO DATA" badge unless a real demo flag exists.
5. **"Latest signals" block** between the capability grid and the runs region: a section header ("Latest signals" + "from your watchlist" subtitle) with an "Open feed ->" link (`onViewChange('feed')`), then a short list of the **3 newest real feed items** (headline + source/target tag + relative time). Grounded from `/api/intelligence/feed`; skeleton while loading, a composed empty/error line when there is nothing (never fabricated rows).
6. **"Runs" framing:** wrap the active-run region (trace + inline dossier, which already renders inline) in a "Runs" section header ("Runs" + run count). Keep the existing trace/dossier components and behavior; only add the framing.
7. The command bar + quick-target chips + 2x2 capability grid already match - left as-is (minor spacing only if needed to match the stack).

## Non-goals (deferred / excluded)

- **The Ponder theme** - excluded by directive (theme stays Geist/Newsreader/blue).
- A real **model/backend selector** (no selection is wired) - display-only or omit.
- **Catalysts** and **watchlist type-tags** - no data source; omitted.
- **Feed screen visual adoption** to `Sonny-Feed.html` - still piece C.
- Any change to the research engine, dossiers, `briefingStore`, watchlist store, or backend routes.

## Data flow (all grounded)

- Sidebar Dossiers badge: `useBriefingStore((s) => Object.keys(s.briefings).length)`.
- Sidebar Feed badge: sum of `useUnreadCounts(targets)` values (the real unread route already used by the Watchlist piece).
- Sidebar watchlist header count: `useWatchlistStore((s) => s.targets.length)`.
- Home "Latest signals": a new lightweight `useLatestSignals(limit = 3)` hook that GETs `/api/intelligence/feed` (mirroring the feed's existing fetch, scoped to the watched targets or the default query) and returns the newest `limit` items; 0 items -> composed empty line; error -> inline "couldn't load latest signals" (graceful, like the feed). No new backend.
- Home view header: title is static copy; any status label reflects real state only.

## Architecture / components

- `src/components/Sidebar.tsx`: add nav badges (consume `useBriefingStore` + `useUnreadCounts`), the WATCHLIST section header + count, and the Add-to-watchlist row. Keep the minimal 4-item structure.
- `src/hooks/useLatestSignals.ts` (new): real feed fetch, newest N items, typed minimal shape `{ title: string; source: string; target?: string; date: string; url?: string }[]`.
- `src/components/research/LatestSignals.tsx` (new): the home block (header + "Open feed" + 3 rows + skeleton/empty/error), props `{ onOpenFeed: () => void }`.
- `src/components/research/SonnyResearchDashboard.tsx`: add the view header row, render `<LatestSignals onOpenFeed={...} />` between the capability grid and the run region, and wrap the run region in the "Runs" section header. Reuse composer/capability/trace/dossier unchanged.
- `src/App.tsx`: pass the needed view-switch callbacks (`onOpenFeed`/`onViewChange('feed')`, watchlist switch) to the home/sidebar as required.

## Error handling / edge cases

- Latest-signals fetch fails / backend off: inline "couldn't load latest signals" (no crash, no fabricated rows); the rest of the home renders.
- Empty watchlist -> no sidebar list, Feed badge 0/hidden; Latest-signals may be empty -> composed empty line.
- Reduced motion: skeletons/hover honor `prefers-reduced-motion`.
- Badges hidden when count is 0 (no "0" noise).

## Verification / success criteria

1. `npm run build` clean; `npx vitest run` green.
2. **Engine/dossiers/watchlist-store untouched:** `git diff` touches no `src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, `src/components/research/{GlassBoxTrace,ResearchDossier,ResearchComposer,CapabilityCards}.tsx` (beyond imports), `src/lib/watchlist/store.ts`, or `server/`. (SonnyResearchDashboard.tsx IS edited - the home shell.)
3. **Grounded:** no fabricated feed rows, no fake catalyst/model numbers; badges/counts come only from the real stores/route; grep shows no hardcoded sample signals.
4. **Playwright (fresh context):** the home shows the view header, the capability grid, a "Latest signals" block (real items or a composed empty line), and the runs framing; the sidebar shows nav badges (Dossiers real count; Feed unread when > 0), the WATCHLIST section + count, and an Add-to-watchlist row that opens the Watchlist view; "Open feed ->" and nav switch views. Light theme, 0 real console errors. Screenshots as evidence.
5. Theme unchanged: still Geist/Newsreader/blue - no Ponder tokens/fonts introduced (grep for `Source Serif`, `ponder`, `bronze`, `#F7F5F2` returns nothing new).

## Task boundaries (for the plan)

- **Task 1:** `useLatestSignals` hook (real feed fetch, newest N).
- **Task 2:** `LatestSignals` home block component (header + rows + skeleton/empty/error).
- **Task 3:** SonnyResearchDashboard - view header + render LatestSignals + Runs framing.
- **Task 4:** Sidebar - nav badges + WATCHLIST section header/count + Add-to-watchlist row.
- **Task 5:** verification - build/tests, grounded + theme-unchanged + untouched proofs, fresh-context Playwright.

---

*Layout-alignment piece (theme unchanged). Next: `writing-plans`, then subagent-driven-development on `feat/home-layout-alignment`.*
