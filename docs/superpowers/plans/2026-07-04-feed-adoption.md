# Feed Adoption (piece C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the live intelligence feed (header, filter chips, item card) to the `Sonny-Feed.html` design in our theme - surfacing "Sonny's read" on each card - and add external target filtering, all without touching feed data/logic.

**Architecture:** `IntelligenceFeed.tsx` (~2586 lines) has ~300 lines of isolated presentation and ~35% hook-driven logic. This piece restyles only the presentation JSX (header ~1626-1714, chips ~1847-1859, card ~2157-2462) and adds an `initialTarget` prop that sets the existing `targetOverride` state; every fetch/digest/analysis/mark-seen/filter/helper is untouched.

**Tech Stack:** React 19, Vite 7, Tailwind 3.4, TanStack Query, Zustand, TypeScript, Vitest 4, Playwright (MCP).

**Spec:** `docs/superpowers/specs/2026-07-04-feed-adoption-design.md`
**Layout reference:** `~/Downloads/Sonny-Feed.html`. **Theme (unchanged):** `docs/design/SONNY_DASHBOARD_DESIGN.md`.

## Global Constraints

- **Feed LOGIC untouched.** Do NOT modify any `useQuery`/`useQueries` (feed fetch ~932-960, unread ~717-741, digest-poll ~892-930), `ensureArticleAnalysis`/analysis cache (~1027-1075, 685-714), `startSonnyDigest`/`buildDemoDigestMarkdown` (~1315-1617), `markIntelligenceSeen` (~427-440), the filtering logic (~1159-1221), or the pure helpers (`computeItemConfidencePct`, `computePriority`, `buildContextSentence/ImplicationSentence/QuestionSentence`, `getSourceBadgeConfig`, `getPriorityConfig`, `formatRelativeTime`, `getTypeIcon`, `getTypeTone`, `highlightText`, `SourcePill`, `ConfidenceMeter`, `PriorityIndicator`). The reskinned JSX CALLS these; it never edits them.
- **Theme unchanged.** Keep Geist/Newsreader/Geist Mono + slate/blue/semantic-RAG. No Ponder token/font (`Source Serif`, sand/bronze/navy, `#F7F5F2`). Adopt LAYOUT/card design only.
- **Grounded, no fabricated data.** The card's "Sonny's read" is the real computed `buildImplicationSentence(item.type)` (kind-based) by default, upgraded to the analyzed implication when the item's analysis has run - never an invented per-item claim. Source/type/target/time/relevance/id come from the real item. "Extract sequences" is honest (routes to the real dormant patent path or a "coming soon" affordance - never a fake extraction). No hardcoded sample cards.
- **Grounded chip mapping.** `FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical'`. Chips must map to REAL values with these labels: All, Publications (`publication`), Trials (`clinical`), Regulatory (`regulatory`). Only add a "Patents" chip if a real patent type/value exists in the data; otherwise omit it (do NOT ship a chip that filters nothing). Keep the existing `typeFilter` state + counts + filter logic; change labels/styling only.
- **Commit style:** plain hyphens, no agent co-author line; stage only a task's files via explicit `git add`.

---

### Task 1: External target filtering

**Files:**
- Modify: `src/components/views/IntelligenceFeed.tsx` (add `initialTarget` prop + an effect).
- Modify: `src/App.tsx` (`feedTarget` state + `openFeedForTarget` + pass `initialTarget`).
- Modify: `src/components/Sidebar.tsx`, `src/components/watchlist/WatchlistView.tsx`, `src/components/research/SonnyResearchDashboard.tsx` (call `openFeedForTarget` instead of the bare feed switch for these actions).

**Interfaces:**
- Consumes: the existing `targetOverride` state (`IntelligenceFeed.tsx:548`) and `setHasCustomTopic` (`:545`), and `normalizeTargetInput`.
- Produces: `IntelligenceFeed` accepts `initialTarget?: string`; App exposes `openFeedForTarget(target?: string)`; Sidebar/WatchlistView/home gain an `onOpenFeedForTarget?(target?: string)` prop.

- [ ] **Step 1: `initialTarget` prop + effect in IntelligenceFeed**

Add `initialTarget` to the component's props type and signature. Add an effect that applies it as the target override when it changes (mirroring the target-tab click which does `setTargetOverride(normalizeTargetInput(raw)); setHasCustomTopic(false)`):
```tsx
useEffect(() => {
  const t = (initialTarget ?? '').trim();
  if (!t) return;
  setTargetOverride(normalizeTargetInput(t));
  setHasCustomTopic(false);
}, [initialTarget]);
```
Place it near the other target effects (~605-660). Do NOT change the fetch/requestParams logic - only set the same state a tab click sets.

- [ ] **Step 2: App feedTarget + openFeedForTarget**

In `src/App.tsx`: add `const [feedTarget, setFeedTarget] = useState<string | null>(null);` and `const openFeedForTarget = (target?: string) => { setFeedTarget(target ?? null); setCurrentView('feed'); };`. In the `feed` render branch pass `<IntelligenceFeed initialTarget={feedTarget ?? undefined} />`.

- [ ] **Step 3: Wire the callers**

- `src/components/Sidebar.tsx`: add an `onOpenFeedForTarget?(target?: string): void` prop; the watched-target rows call `onOpenFeedForTarget?.(t)` instead of `onViewChange('feed')`; the Feed nav item + Add-to-watchlist stay on `onViewChange`. App passes `onOpenFeedForTarget={openFeedForTarget}`.
- `src/components/watchlist/WatchlistView.tsx`: change `onViewInFeed` semantics to carry the target - add/repurpose a prop `onViewInFeed?(target?: string)`; each card's "View in feed" calls `onViewInFeed?.(target)`. App passes `onViewInFeed={openFeedForTarget}`.
- `src/components/research/SonnyResearchDashboard.tsx`: the home's "Open feed ->" stays target-less - its `onOpenFeed` maps to `openFeedForTarget()` (App passes `onOpenFeed={() => openFeedForTarget()}`).

- [ ] **Step 4: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: clicking a sidebar target row or a watchlist card's "View in feed" opens the Feed scoped to that target (its target tab active); the home "Open feed ->" opens the Feed unfiltered.
```bash
git add src/components/views/IntelligenceFeed.tsx src/App.tsx src/components/Sidebar.tsx src/components/watchlist/WatchlistView.tsx src/components/research/SonnyResearchDashboard.tsx
git commit -m "feat(feed): external target filtering - open the feed scoped to a target"
```

---

### Task 2: Header + subtitle + filter-chips reskin

**Files:** Modify: `src/components/views/IntelligenceFeed.tsx` (header ~1626-1714, type-filter chips ~1847-1859 ONLY).

**Context:** Restyle the header + type chips to `Sonny-Feed.html`, keeping every control's function and the real `typeFilter` state/logic.

- [ ] **Step 1: Header + subtitle**

Reskin the header title/subtitle region (~1634-1642): title "Intelligence feed" and subtitle "Latest papers, trials, and patents across your watchlist, each read by Sonny for what it changes." (Geist heading + `text-textSecondary` subtitle, per the design). Keep the DEMO badge tied to the REAL demo flag (do not fabricate). Keep the refresh / filters / synthesis / export controls (~1646-1711) and the target tabs + search (~1717-1837) - restyle lightly to match; do NOT remove or rewire them.

- [ ] **Step 2: Type filter chips**

Reskin the type filter chips (~1847-1859) to the design's chip style. Map to the REAL `typeFilter` values with labels: **All**, **Publications** (`publication`), **Trials** (`clinical`), **Regulatory** (`regulatory`). Keep **Deals** (`deal`) / **News** (`news`) chips if they currently exist and carry counts (do not drop working filters); label them as-is. Add a **Patents** chip ONLY if a real patent type exists in the data (grep the item types / the feed response) - if there is no patent `FeedItemType`, OMIT the Patents chip (do not ship a chip that matches nothing). Keep the existing counts + the `setTypeFilter` handler + the downstream filter logic unchanged - restyle only.

- [ ] **Step 3: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the feed header shows the new title/subtitle; the chips render in the new style and still filter (same behavior); no non-functional chip.
```bash
git add src/components/views/IntelligenceFeed.tsx
git commit -m "feat(feed): reskin header/subtitle and filter chips to the new design"
```

---

### Task 3: Item card reskin

**Files:** Modify: `src/components/views/IntelligenceFeed.tsx` (the item card, ~2157-2462, ONLY).

**Context:** This is the main task. Restructure the card JSX to the `Sonny-Feed.html` hierarchy, calling the existing pure helpers/sub-components for every value. Touch ONLY the JSX inside the item `.map()` (~2145-2462); do NOT modify any helper, state, or the analysis/pin/hide handlers (only reorganize where their triggers render).

- [ ] **Step 1: New card hierarchy**

Rebuild the card (`<article>` at ~2157) as, top to bottom:
1. **Meta row:** `SourcePill` (source, existing) + a type badge (from `getTypeTone`/`getTypeIcon` + the label, existing) + the target tag (`item.targetContext?.target` or the current target) + relative time (`formatRelativeTime(item.date)`, right-aligned).
2. **Title:** the existing clickable title link (`item.link`) with `highlightText`.
3. **Sonny's read:** surface the implication INLINE - a small "Sonny's read" micro-label + the text `buildImplicationSentence(item.type)` (real, kind-based) by default; if this item's analysis has already run (the component already tracks per-item analysis state/cache), show the richer analyzed implication instead. Never invent a per-item claim.
4. **Footer row:** a relevance pill (`item.relevance` -> High/Medium/Low, via the existing priority/relevance styling), the identifier when present (PMID / NCT / WO - `font-mono`, from the existing id helper), and the actions: **Open paper/trial/patent** (the source link; label by `item.type`), **Synthesize** (the existing "Generate Sonny Analysis"/expand trigger - keep its onClick), and for patent-type items an **Extract sequences** action (see Step 2).
Keep the pin/hide/why-included controls (reposition into the meta/footer area) and the full analysis-on-expand (the existing collapsible 4-panel, ~2296-2436) - do NOT remove them; the "Synthesize" action toggles the same analysis. Use light tokens, `.tactile`, hover-lift; honor `prefers-reduced-motion`; Geist/Newsreader/Geist Mono (mono for ids).

- [ ] **Step 2: Patent "Extract sequences" (honest)**

For a patent item, render an **Extract sequences** action. Wire it honestly: if a real patent-parsing entry point is trivially reachable from the client (`/api/patent-parsing` exists but its UI was removed), route to a minimal honest affordance - simplest acceptable version is a disabled/"coming soon" control with a tooltip (matching the composer's disabled-upload pattern), because the patent UI was deleted in the shell excision. Do NOT fake an extraction result. (Determining "patent item": if there is no `patent` `FeedItemType`, detect patents by source/id shape, e.g. a `WO`/patent identifier - only show the action when the item is genuinely a patent; otherwise omit it.)

- [ ] **Step 3: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev` (backend on if possible): cards render in the new hierarchy (meta -> title -> Sonny's read -> footer actions); the implication shows as "Sonny's read"; "Synthesize" still expands the full analysis; pin/hide still work; patent items show an honest "Extract sequences"/"coming soon"; no console error.
```bash
git add src/components/views/IntelligenceFeed.tsx
git commit -m "feat(feed): reskin the item card - surface Sonny's read, new hierarchy"
```

---

### Task 4: Verification

**Files:** No source changes (fixes loop back). Create: `docs/design/feed-adoption-evidence/` (screenshots).

- [ ] **Step 1: Build, tests, logic-untouched + theme + grounded proofs**

Run: `npm run build` (clean) and `npx vitest run` (green).
Run (logic-untouched): `git diff feat/home-layout-alignment..HEAD -- src/components/views/IntelligenceFeed.tsx | grep -E "^\-.*(useQuery|useQueries|ensureArticleAnalysis|startSonnyDigest|markIntelligenceSeen|buildDemoDigestMarkdown|computeItemConfidencePct|computePriority|buildImplicationSentence)"` -> expected: no output (no removed/changed lines inside the logic/helpers; they may still be CALLED). Manually confirm the diff in IntelligenceFeed.tsx is confined to the header/chips/card JSX + the `initialTarget` prop/effect.
Run (untouched files): `git diff --name-only feat/home-layout-alignment..HEAD | grep -E "src/lib/research/|useDeepResearchStream|src/lib/watchlist/store|src/components/dossiers/|^server/"` -> expected: no output.
Run (theme): `grep -rn "Source Serif\|--bronze\|#F7F5F2" src` -> expected: no matches (ignore the "responders" substring for `ponder`).
Run (grounded): confirm no hardcoded sample feed cards were added (`git diff` review of the card region).

- [ ] **Step 2: Fresh server + fresh browser context**

`pkill -f vite; rm -rf node_modules/.vite; npm run dev`. Playwright MCP: `browser_close` first, then navigate fresh to `http://localhost:5173`.

- [ ] **Step 3: Audit** (1440x900, spot-check 768/375)

- Open Feed: new header/subtitle, the reskinned chips (All/Publications/Trials/Regulatory [+Deals/News/Patents only if real]) filter the list (same behavior), reskinned cards (meta -> title -> "Sonny's read" -> footer actions). If the backend is off, the existing empty/error states render (restyled) - that is acceptable; note it.
- From a **sidebar target row** and a **watchlist card "View in feed"**: the Feed opens scoped to that target (its tab active). From the home **"Open feed ->"**: unfiltered.
- "Synthesize" expands the full analysis; a patent item shows an honest "Extract sequences"/"coming soon".
- Theme unchanged (cool slate/Geist, no Ponder). Light, 0 real JS console errors (ignore backend 500s).
- Screenshots -> `docs/design/feed-adoption-evidence/feed-1440.png`, `feed-filtered-1440.png`.

- [ ] **Step 4: Punch-list + fix**, then commit evidence:
```bash
git add docs/design/feed-adoption-evidence
git commit -m "test(feed): feed-adoption verification evidence"
```

---

## Self-Review

**Spec coverage:** external target filter -> T1; header+chips reskin -> T2; card reskin (Sonny's read + patent Extract) -> T3; verification (logic-untouched + theme + grounded + Playwright) -> T4. ✓

**Placeholder scan:** each task gives exact line ranges + the exact state/helper names to call + the grounded rules (chip mapping to real values, Sonny's read = real `buildImplicationSentence`, honest Extract-sequences). The "detect patents by id shape" is a named grounded rule, not a placeholder. No TBD.

**Type/name consistency:** `initialTarget?: string` on IntelligenceFeed (T1) consumed by App's `feedTarget`; `openFeedForTarget(target?)` (T1) wired to Sidebar `onOpenFeedForTarget`, WatchlistView `onViewInFeed`, home `onOpenFeed`; `typeFilter`/`FeedItemType` values (`publication|clinical|regulatory|deal|news`) used verbatim in T2; the pure helpers named in T3 match the code map. Theme tokens unchanged.

**Note on TDD:** presentation reskin over live routes/logic; no new pure logic to unit-test. The gate is build-green + logic-untouched diff proof + theme/grounded greps + Playwright acceptance - the correct strategy for a reskin.
