# Feed Adoption (piece C) - Design Spec

**Date:** 2026-07-04
**Status:** Approved-to-build (autonomous per standing directive)
**Layout reference:** `~/Downloads/Sonny-Feed.html` (LAYOUT/CARD design). **Theme (unchanged):** `docs/design/SONNY_DASHBOARD_DESIGN.md` (Geist/Newsreader/blue).
**Builds on:** home layout alignment (PR #9). Branches off `feat/home-layout-alignment`.

## Why this

The feed is live on real routes (`/api/intelligence/*`) and was persona-decoupled in the minimal-shell excision. This piece adopts the new `Sonny-Feed.html` card design (theme unchanged) and adds a way to open the feed pre-filtered to a target (the "View in feed" affordances currently open it unfiltered).

## Goal

Reskin the feed's presentation - header, filter chips, and the item card - to the `Sonny-Feed.html` design in our theme, surfacing **Sonny's read** on each card; and add external **target filtering** so the home / sidebar / watchlist can open the feed scoped to one target. **All feed data/logic stays untouched.**

## The hard boundary (verified from the code map)

`IntelligenceFeed.tsx` (~2586 lines) has clean separation: ~300 lines of PRESENTATION vs ~35% LOGIC.
- **RESKIN (presentation only):** the sticky header/title/subtitle (~1626-1714), the type filter chips (~1847-1859), and the item CARD (~2157-2462).
- **DO NOT TOUCH (logic):** every `useQuery`/`useQueries` (feed fetch ~932-960, unread ~717-741, digest-job poll ~892-930), `ensureArticleAnalysis`/analysis cache (~1027-1075, 685-714), `startSonnyDigest`/`buildDemoDigestMarkdown` (~1315-1617), `markIntelligenceSeen` (~427-440), the filtering logic (~1159-1221), and all pure helpers (`computeItemConfidencePct`, `computePriority`, `buildContextSentence/ImplicationSentence/QuestionSentence`, `getSourceBadgeConfig`, `formatRelativeTime`, `getTypeIcon`, `highlightText`). These are called BY the reskinned JSX, never modified.

## The new card design (from `Sonny-Feed.html`)

Each card, top to bottom:
1. **Meta row:** source name (e.g. "Europe PMC", "ClinicalTrials.gov", "Patent") + a type badge (Publication / Trial / Patent / Regulatory) + the **target** tag (e.g. CDCP1) + relative time (right).
2. **Title** (the paper/trial/patent headline; clickable to source).
3. **Sonny's read** - the implication sentence, surfaced INLINE on the card face (currently buried in the collapsible analysis panel). Default = the real computed `buildImplicationSentence(kind)` (a real, kind-based read, not a fabricated per-item claim); if the user has run analysis on the item, show the richer analyzed implication. Prefixed subtly (e.g. a small "Sonny's read" label or an italic lead).
4. **Footer row:** a relevance pill (High/Medium/Low, from the real `relevance`), the identifier when present (PMID / NCT / WO - mono), and actions: **Open paper/trial/patent** (the source link), **Synthesize** (the existing analysis/expand affordance), and for patent-type items an **Extract sequences** action (routes to the dormant patent-parsing / a "coming soon" if not wired - honest).

The card keeps the existing deeper affordances (pin, hide, why-included, the full 4-panel analysis on expand) - the reskin reorganizes them under the new visual hierarchy; it does not remove the analysis, it surfaces the implication and keeps the rest available.

## Locked decisions

1. **Theme unchanged** (Geist/Newsreader/blue); adopt LAYOUT/card design only from `Sonny-Feed.html`. No Ponder.
2. **Grounded:** the card's "Sonny's read" is the real computed implication (generic by kind by default, analyzed when available) - never a fabricated per-item claim. Source/type/target/time/relevance/id come from the real feed item. "Extract sequences" is honest (routes to the real dormant patent path or shows "coming soon"), never a fake.
3. **Logic untouched:** no change to any fetch/digest/analysis/mark-seen/filter/helper (per the boundary above).
4. **External target filter:** add `initialTarget?: string` to `IntelligenceFeed`; on mount (and when it changes) it applies as the target override (the same internal mechanism a target tab uses). The home/sidebar/watchlist pass a target when opening the feed.

## Sections

### Section 1 - External target filtering

- `IntelligenceFeed` gains `initialTarget?: string`. On mount/prop-change, if set and non-empty, apply it as the current target override (reuse the existing target-tab handler / `targetOverride` state - do not duplicate the fetch logic; just set the same state the tab click sets). Guard so it does not fight the user after they change the target manually (apply on mount + when `initialTarget` value actually changes).
- `App.tsx`: add a `feedTarget: string | null` state; a helper `openFeedForTarget(target?: string)` that sets `feedTarget` and `setCurrentView('feed')`. Pass `initialTarget={feedTarget ?? undefined}` to `IntelligenceFeed`.
- Wire the callers: the sidebar watched-target rows (currently `onViewChange('feed')`) and the Watchlist view's "View in feed" pass the target via `openFeedForTarget(target)`; the home's "Open feed ->" calls `openFeedForTarget()` (no target). Thread a single callback (e.g. `onOpenFeedForTarget?(target?: string)`) from App through Sidebar / WatchlistView / the home instead of the bare `onViewChange('feed')` for these specific actions.

### Section 2 - Header + filter chips reskin

- Reskin the sticky header (~1626-1714): title "Intelligence feed" (Geist/Newsreader per design) + subtitle "Latest papers, trials, and patents across your watchlist, each read by Sonny for what it changes." + the existing DEMO badge (keep the real demo flag; do not fake it). Keep the existing controls (refresh / filters / synthesis / export) - restyle to the design, do not remove function.
- Reskin the type filter chips (~1847-1859) to the design's chip style and the labels **All / Publications / Trials / Patents / Regulatory** (map to the existing `typeFilter` values; keep the counts; do not change the filter logic - only labels/styling). Keep the target tabs + search as-is functionally (restyle lightly to match).

### Section 3 - Item card reskin

- Restructure the item card (~2157-2462) to the new design: meta row (source + type badge + target + time) -> title -> **Sonny's read** (surfaced implication) -> footer (relevance + id + Open/Synthesize/Extract-sequences actions). Use the existing pure helpers for all values (source badge, priority/confidence, type icon, relative time, implication). Keep pin/hide/why-included/full-analysis-on-expand available (reorganized, not removed). Patent items get "Extract sequences" (honest routing).
- Light tokens, `.tactile`, hover-lift, honor `prefers-reduced-motion`. Geist/Newsreader/Geist Mono (mono for PMID/NCT/WO ids).

## Non-goals (deferred)

- No change to feed DATA, fetch, digest, analysis, mark-seen, or filter LOGIC.
- No new backend; "Extract sequences" reuses the dormant `/api/patent-parsing` path if trivially wireable, else a "coming soon" affordance (no fake extraction).
- The synthesis/digest panel deep-reskin is optional (light restyle only); its logic is untouched.
- Dossiers/Drilldown/States refinements = piece D.

## Error handling / edge cases

- `initialTarget` empty/undefined -> feed behaves as today (its own default target logic).
- Analysis not yet run -> card shows the generic computed implication as "Sonny's read" (real, not fabricated); never a blank or invented specific claim.
- Feed fetch error/empty -> the existing error/empty states (restyled, same logic).
- Reduced motion honored on card hover/animation.

## Verification / success criteria

1. `npm run build` clean; `npx vitest run` green.
2. **Logic untouched:** `git diff` shows no change to the fetch/digest/analysis/mark-seen/helper functions or their `useQuery` calls (spot-check the named line ranges; the diff in `IntelligenceFeed.tsx` is confined to the header/chips/card JSX + the `initialTarget` prop wiring). No `server/`, `src/lib/research/*`, `src/lib/watchlist/store.ts`, or `src/hooks/useDeepResearchStream.ts` change.
3. **Theme unchanged:** grep finds no Ponder token/font.
4. **Grounded:** the card's "Sonny's read" is the real computed implication; no fabricated per-item claim, no fake "Extract sequences" result; grep shows no hardcoded sample cards.
5. **Playwright (fresh context, backend on if possible; else the empty/error states):** the feed shows the new header/subtitle, the All/Publications/Trials/Patents/Regulatory chips, and reskinned cards (meta -> title -> Sonny's read -> actions); clicking a chip filters (same logic); opening the feed from a sidebar target row / watchlist "View in feed" lands it filtered to that target; the home "Open feed" opens it unfiltered. Theme unchanged, 0 real console errors. Screenshots as evidence.

## Task boundaries (for the plan)

- **Task 1:** external target filter - `initialTarget` prop + App `feedTarget`/`openFeedForTarget` + wire sidebar/watchlist/home.
- **Task 2:** header + subtitle + filter-chips reskin.
- **Task 3:** item card reskin (the main task) - new hierarchy, Sonny's read surfaced, patent Extract-sequences, logic untouched.
- **Task 4:** verification - build/tests, logic-untouched + theme + grounded proofs, fresh-context Playwright (filter + target-open + reskin).

---

*Piece C of the design refresh. Next: `writing-plans`, then subagent-driven-development on `feat/feed-adoption`.*
