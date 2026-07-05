# Home + Sidebar Layout Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Ask-Sonny home and the sidebar to the `Sonny Dashboard.html` LAYOUT (view header + Latest-signals block + Runs framing on the home; real nav badges + WATCHLIST section + Add-to-watchlist on the sidebar), keeping our Geist/Newsreader/blue theme and staying fully grounded.

**Architecture:** Additive refinement. A new `useLatestSignals` hook fetches the newest few real feed items; a new `LatestSignals` component renders them on the home; `SonnyResearchDashboard` gains a view header + the Latest-signals block + a "Runs" section frame (reusing composer/capability/trace/dossier unchanged); `Sidebar` gains real count badges + a WATCHLIST section header + an Add-to-watchlist row.

**Tech Stack:** React 19, Vite 7, Tailwind 3.4, TanStack Query, Zustand, TypeScript, Vitest 4, Playwright (MCP).

**Spec:** `docs/superpowers/specs/2026-07-04-home-layout-alignment-design.md`
**Layout reference (LAYOUT ONLY):** `docs/design/ref-sonny-dashboard-full.png`. **Theme reference (unchanged):** `docs/design/SONNY_DASHBOARD_DESIGN.md`.

## Global Constraints

- **Theme unchanged.** Keep Geist/Newsreader/Geist Mono + slate `#F6F8FB`/blue `#1D4ED8`/semantic RAG. Do NOT introduce any Ponder token or font (`Source Serif 4`, Inter-as-primary, `bronze`, `navy`, `#F7F5F2`, `ponder`). Take LAYOUT only from the reference.
- **Grounded, no fabricated data.** Latest-signals rows come only from the real `/api/intelligence/feed`; on empty -> a composed empty line, on error -> an inline "couldn't load latest signals" (never fabricated rows). Sidebar badges/counts come only from `useBriefingStore` (dossier count), `useUnreadCounts` (feed unread), `useWatchlistStore` (watched count). NO catalyst numbers, NO invented target type-tags, NO fake model dropdown. Badges hidden when 0.
- **Reuse unchanged (do not restyle/rewrite):** `ResearchComposer`, `CapabilityCards`, `GlassBoxTrace`, `ResearchDossier` (the home only composes them + adds surrounding structure). `useDeepResearchStream`, `briefingStore`, the watchlist store, and all backend routes are unchanged.
- **Sonny engine/persistence untouched:** no task modifies `src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, `src/lib/watchlist/store.ts`, `src/components/dossiers/*`, or `server/`. (`SonnyResearchDashboard.tsx` and `Sidebar.tsx` ARE edited.)
- **Commit style:** plain hyphens, no agent co-author line; stage only a task's files via explicit `git add`.

---

### Task 1: useLatestSignals hook

**Files:** Create `src/hooks/useLatestSignals.ts`.

**Interfaces:**
- Consumes: `useWatchlistStore` (`src/lib/watchlist/store.ts`) for the target to query; the real `GET /api/intelligence/feed`.
- Produces: `useLatestSignals(limit?: number): { items: LatestSignal[]; isLoading: boolean; isError: boolean }` where `LatestSignal = { id: string; title: string; source: string; target?: string; date: string; url?: string }`.

**Context:** The feed route is `GET /api/intelligence/feed?target=<t>&limit=<n>` returning `IntelligenceFeedResponse { items: ProcessedFeedItem[] }` (see `src/lib/intelligence/intelligenceTypes.ts`). The feed already maps `ProcessedFeedItem` to a display item in `IntelligenceFeed.tsx` (fetch at ~line 403). Read the exact `ProcessedFeedItem` fields and map to `LatestSignal` (headline/title, `source.name`, `source.url`, `source.publicationDate`/`capturedAt` for date, `targetContext` for target). Do NOT guess field names - read `intelligenceTypes.ts` and mirror the feed's own mapping.

- [ ] **Step 1: Implement the hook**

```ts
import { useQuery } from '@tanstack/react-query';
import { useWatchlistStore } from '../lib/watchlist/store';

export interface LatestSignal {
  id: string;
  title: string;
  source: string;
  target?: string;
  date: string; // ISO or empty
  url?: string;
}

async function fetchLatest(target: string | undefined, limit: number): Promise<LatestSignal[]> {
  try {
    const url = new URL('/api/intelligence/feed', window.location.origin);
    if (target) url.searchParams.set('target', target);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: unknown[] };
    const items = Array.isArray(data.items) ? data.items : [];
    // MAP from the real ProcessedFeedItem shape - VERIFY the exact fields against
    // src/lib/intelligence/intelligenceTypes.ts (ProcessedFeedItem) and IntelligenceFeed's own mapping.
    return items.slice(0, limit).map((raw: any) => ({
      id: String(raw.id ?? raw.source?.sourceId ?? ''),
      title: String(raw.title ?? raw.headline ?? raw.source?.name ?? 'Untitled signal'),
      source: String(raw.source?.name ?? raw.source ?? ''),
      target: raw.targetContext?.target ?? target,
      date: String(raw.source?.publicationDate ?? raw.capturedAt ?? ''),
      url: raw.source?.url ?? raw.link ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function useLatestSignals(limit = 3): { items: LatestSignal[]; isLoading: boolean; isError: boolean } {
  const target = useWatchlistStore((s) => s.targets[0]);
  const q = useQuery({
    queryKey: ['latest-signals', target, limit],
    queryFn: () => fetchLatest(target, limit),
    staleTime: 60_000,
    retry: false,
  });
  return { items: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}
```

- [ ] **Step 2: Verify the mapping is real**

Open `src/lib/intelligence/intelligenceTypes.ts` (`ProcessedFeedItem`) and confirm the actual title/headline field name; adjust the `title`/`date`/`target` mapping so it reads the REAL field (the `raw.title ?? raw.headline ?? source.name` fallback must resolve to a real headline, not always "Untitled signal"). If `IntelligenceFeed.tsx` has a `ProcessedFeedItem -> {title,...}` mapping helper, mirror its field access exactly.

- [ ] **Step 3: Build + commit**

Run: `npm run build` (clean) and `npx vitest run` (green, 36).
```bash
git add src/hooks/useLatestSignals.ts
git commit -m "feat(home): useLatestSignals hook over the real intelligence feed"
```

---

### Task 2: LatestSignals home block

**Files:** Create `src/components/research/LatestSignals.tsx`.

**Interfaces:**
- Consumes: `useLatestSignals` (Task 1).
- Produces: `export default function LatestSignals({ onOpenFeed }: { onOpenFeed: () => void })`.

**Context:** The home block between the capability grid and the runs region, matching the reference's "Latest signals" section. Grounded: real rows only.

- [ ] **Step 1: Implement the component**

Render:
- A section header row: `font-display`-free small heading "Latest signals" (Geist, `text-textPrimary font-semibold`) + subtitle "from your watchlist" (`text-textTertiary text-sm`), and a right-aligned "Open feed ->" button (`text-primary text-sm`, `.tactile`) calling `onOpenFeed`.
- Body:
  - `isLoading` -> 3 skeleton rows (reuse the shimmer pattern: a `motion-safe:animate-[shimmer_1.4s_infinite_linear]` line per row; honor reduced motion).
  - `isError` -> an inline muted line "Couldn't load latest signals." (`text-textTertiary text-sm`).
  - `items.length === 0` (not loading, not error) -> a composed empty line "No recent signals yet - add targets to your watchlist and Sonny will surface new papers, trials, and patents here." (`text-textSecondary text-sm`).
  - else -> a vertical list of the items, each a row: headline (`text-textPrimary`, truncate), and a meta line (`text-textTertiary text-xs`) with the source + target tag + relative time from `date` (a small `timeAgo(date)` local helper; if `date` is empty, omit the time). Each row is a link to `url` if present (`target="_blank" rel="noreferrer"`), else plain. `.tactile` hover on rows.
- Light tokens only; no fabricated content.

- [ ] **Step 2: Build + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
```bash
git add src/components/research/LatestSignals.tsx
git commit -m "feat(home): Latest-signals home block (grounded, skeleton/empty/error states)"
```

---

### Task 3: Home view header + Latest-signals + Runs framing

**Files:** Modify `src/components/research/SonnyResearchDashboard.tsx`; Modify `src/App.tsx` (pass an `onOpenFeed` view-switch to the home).

**Interfaces:**
- Consumes: `LatestSignals` (Task 2). New prop on the home: `onOpenFeed?: () => void`.

**Context:** Additively restructure the home to the reference's vertical stack. Reuse composer/capability/trace/dossier unchanged; only add the header, the Latest-signals block, and the Runs section frame.

- [ ] **Step 1: View header row**

At the top of the home's main content (above the composer), add a header row: an `<h1 className="font-display text-2xl font-semibold text-textPrimary">Ask Sonny</h1>` on the left and, on the right, a subtle static status label `<span className="text-xs text-textSecondary">Deep research</span>` (NO fake model dropdown, NO "DEMO DATA" unless a real demo flag exists in the component's props/state). Keep it a single flex row, `items-center justify-between`.

- [ ] **Step 2: Render LatestSignals**

Add `onOpenFeed?: () => void` to `SonnyResearchDashboardProps`. Render `<LatestSignals onOpenFeed={onOpenFeed ?? (() => {})} />` between the capability cards and the run/trace region (in the idle/home layout; it may also show during a run - place it so it is visible on the default home). Import `LatestSignals`.

- [ ] **Step 3: Runs section frame**

Wrap the existing active-run region (the trace + inline dossier that already render) in a lightweight section with a header row: "Runs" (Geist `font-semibold`) + a small count (e.g. `s.runId ? '1 run' : '0 runs'` - derive from real run state, do not invent). Do NOT change the trace/dossier components themselves - only add the surrounding header/frame.

- [ ] **Step 4: Wire onOpenFeed from App**

In `src/App.tsx`, the `research` render branch: `<SonnyResearchDashboard initialQuery={sonnyQuery || undefined} onOpenFeed={() => setCurrentView('feed')} />`.

- [ ] **Step 5: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the home shows the "Ask Sonny" header, composer, capability cards, the Latest-signals block (real items or a composed empty/error line), and the Runs frame; "Open feed ->" switches to the feed.
```bash
git add src/components/research/SonnyResearchDashboard.tsx src/App.tsx
git commit -m "feat(home): view header, Latest-signals block, and Runs section framing"
```

---

### Task 4: Sidebar nav badges + WATCHLIST section + Add-to-watchlist

**Files:** Modify `src/components/Sidebar.tsx`.

**Interfaces:**
- Consumes: `useBriefingStore` (dossier count), `useUnreadCounts` (feed unread), `useWatchlistStore` (watched targets + count). Uses the existing `onViewChange` prop.

**Context:** Add real badges + the WATCHLIST framing to the minimal 4-item sidebar, keeping the wordmark + Engine-online.

- [ ] **Step 1: Nav count badges**

Read `const dossierCount = useBriefingStore((s) => Object.keys(s.briefings).length);`, `const targets = useWatchlistStore((s) => s.targets);`, `const unread = useUnreadCounts(targets);`, `const feedUnread = targets.reduce((n, t) => n + (unread[t] ?? 0), 0);`. On the Feed nav item show a badge with `feedUnread` when `> 0`; on the Dossiers nav item show a badge with `dossierCount` when `> 0` (a small `bg-primary/10 text-primary` rounded pill). Ask Sonny + Watchlist: no badge.

- [ ] **Step 2: WATCHLIST section header + count + Add row**

Above the watched-target list (added in the Watchlist piece), render a section header row: a micro/uppercase "WATCHLIST" label (`text-[11px] font-semibold tracking-wider uppercase text-textTertiary`) with the watched count on the right (`{targets.length}` when > 0). Below the list, an "Add to watchlist" row (a `.tactile` button with a `Plus` icon + "Add to watchlist" label, `text-textSecondary hover:text-textPrimary`) that calls `onViewChange('watchlist')`. Keep the existing target rows + badges from the Watchlist piece. No "catalysts" number.

- [ ] **Step 3: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the sidebar shows Feed/Dossiers badges (real counts, hidden at 0), the WATCHLIST header + count, and an Add-to-watchlist row that opens the Watchlist view.
```bash
git add src/components/Sidebar.tsx
git commit -m "feat(shell): sidebar nav badges, WATCHLIST section header, add-to-watchlist row"
```

---

### Task 5: Verification

**Files:** No source changes (fixes loop back). Create: `docs/design/home-alignment-evidence/` (screenshots).

- [ ] **Step 1: Build, tests, grounded + theme + untouched proofs**

Run: `npm run build` (clean) and `npx vitest run` (green).
Run (theme-unchanged): `grep -rn "Source Serif\|ponder\|--bronze\|#F7F5F2\|font-serif:.*Inter" src` -> expected: no matches (no Ponder introduced).
Run (grounded): `grep -rn "catalyst" src/components/Sidebar.tsx src/components/research/LatestSignals.tsx src/components/research/SonnyResearchDashboard.tsx` -> expected: no numeric catalysts (ideally no matches).
Run (untouched): `git diff --name-only feat/watchlist..HEAD | grep -E "src/lib/research/|useDeepResearchStream|src/lib/watchlist/store|src/components/dossiers/|^server/"` -> expected: no output.

- [ ] **Step 2: Fresh server + fresh browser context**

`pkill -f vite; rm -rf node_modules/.vite; npm run dev`. Playwright MCP: `browser_close` first, then navigate fresh to `http://localhost:5173`.

- [ ] **Step 3: Audit** (1440x900, spot-check 768/375)

- Home (Ask Sonny): shows the "Ask Sonny" view header, composer + quick-target chips, the 2x2 capability grid, a "Latest signals" block (real rows OR a composed empty/error line - confirm NO fabricated rows), and a "Runs" section frame. "Open feed ->" switches to the Feed.
- Sidebar: Feed/Dossiers nav badges reflect real counts (seed a dossier via `localStorage['lumina:research:briefings:v1']` to see the Dossiers badge); the WATCHLIST header + count; an Add-to-watchlist row that opens the Watchlist view.
- Theme is unchanged (Geist/Newsreader/blue; no warm sand/serif).
- Light, 0 real JS console errors (ignore backend 500s).
- Screenshots -> `docs/design/home-alignment-evidence/home-1440.png`, `sidebar-1440.png`.

- [ ] **Step 4: Punch-list + fix**, then commit evidence:
```bash
git add docs/design/home-alignment-evidence
git commit -m "test(home): layout-alignment verification evidence"
```

---

## Self-Review

**Spec coverage:** useLatestSignals -> T1; LatestSignals block -> T2; home view header + block + Runs frame -> T3; sidebar badges + WATCHLIST section + add-to-watchlist -> T4; verification (grounded + theme-unchanged + untouched + Playwright) -> T5. ✓

**Placeholder scan:** T1 carries the verbatim hook with an explicit "verify the real ProcessedFeedItem field" step (the mapping must resolve to a real headline, not the fallback); T2-T4 give concrete structure + exact store/hook calls + grounded state handling. No TBD. The one honest latitude (exact title field) is a named verification step, not a placeholder.

**Type/name consistency:** `useLatestSignals(limit?): { items: LatestSignal[]; isLoading; isError }` (T1) consumed in T2; `LatestSignals({ onOpenFeed })` (T2) consumed in T3; `SonnyResearchDashboard` gains `onOpenFeed?` (T3) wired in App; sidebar consumes `useBriefingStore`/`useUnreadCounts`/`useWatchlistStore` (all existing). Theme tokens unchanged.

**Note on TDD:** This is presentation over real routes/stores; the hook is a thin fetch wrapper and the rest is UI. The gate is build-green + grounded/theme/untouched greps + Playwright acceptance - the correct strategy for a layout refinement (no new pure logic to unit-test).
