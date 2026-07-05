# Watchlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Watchlist real - a shared store of watched targets surfaced in the sidebar and a dedicated view with real per-target "new"-signal badges, with the feed reading from the same store.

**Architecture:** Extract the feed's `trackedTargets` local state into a Zustand `watchlist` store that owns the existing localStorage key (no migration). A `useUnreadCounts` hook fetches the real `/api/intelligence/unread` per target. The sidebar and a rebuilt `WatchlistView` read the store + counts; the feed is refactored to consume the store so there is one source of truth. No fabricated catalysts.

**Tech Stack:** React 19, Vite 7, Tailwind 3.4, Zustand, TanStack Query, TypeScript, Vitest 4, Playwright (MCP).

**Spec:** `docs/superpowers/specs/2026-07-03-watchlist-design.md`
**Design system:** `docs/design/SONNY_DASHBOARD_DESIGN.md`; sidebar reference `~/Downloads/Sonny-Dashboard-Home.html`.

## Global Constraints

- **No fabricated data.** Watched targets come from the store; "new" counts come only from `useUnreadCounts` (the real `/api/intelligence/unread` route). A count of 0 renders as "no new signals"/no badge - never an invented number. Catalysts have no data source and are a "coming soon" affordance, never a number.
- **Sonny engine/dossiers untouched.** No task modifies `src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, `src/components/research/*`, `src/components/dossiers/*`, or `server/`. Final verification asserts this.
- **Single source of truth:** the `watchlist` store owns `localStorage['lumina:intelligence:trackedTargets:v1']`; the feed reads from the store (its own `trackedTargets` local state is removed). Targets are normalized via `formatTargetDisplayName` (from `src/lib/targetNaming`), deduped case-insensitively, capped at 8 (keep the 8 most recent).
- **Design system:** light tokens, Geist UI + Newsreader (`font-display`) titles, `.tactile` on interactive elements, honor `prefers-reduced-motion`. Semantic colors only where meaningful.
- **Commit style:** plain hyphens, no agent co-author line; stage only a task's files via explicit `git add`.

---

### Task 1: Watchlist store (TDD)

**Files:** Create `src/lib/watchlist/store.ts`; Test `src/lib/watchlist/store.test.ts`.

**Interfaces:**
- Consumes: `formatTargetDisplayName(input: string): string` from `../targetNaming`.
- Produces: `useWatchlistStore` with `{ targets: string[]; add(t: string): void; remove(t: string): void; seedIfEmpty(defaults: string[]): void }`, persisting to `localStorage['lumina:intelligence:trackedTargets:v1']`.

- [ ] **Step 1: Write the failing tests** (mirror `src/lib/research/briefingStore.test.ts` localStorage/window stubbing)

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWatchlistStore, loadTargets } from './store.js';

describe('watchlist store', () => {
  let mem: Record<string, string> = {};
  beforeEach(() => {
    mem = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
      clear: () => { mem = {}; },
    });
    vi.stubGlobal('window', {});
    useWatchlistStore.setState({ targets: [] });
  });

  it('add normalizes, dedupes case-insensitively, and persists', () => {
    useWatchlistStore.getState().add('cdcp1');
    useWatchlistStore.getState().add('CDCP1'); // dupe (case-insensitive)
    const { targets } = useWatchlistStore.getState();
    expect(targets.length).toBe(1);
    expect(JSON.parse(mem['lumina:intelligence:trackedTargets:v1'])).toEqual(targets);
  });

  it('add caps at 8, keeping the 8 most recent', () => {
    for (let i = 1; i <= 10; i++) useWatchlistStore.getState().add(`T${i}`);
    const { targets } = useWatchlistStore.getState();
    expect(targets.length).toBe(8);
    expect(targets[targets.length - 1]).toBe(useWatchlistStore.getState().targets.at(-1));
    expect(targets).not.toContain('T1'); // oldest dropped
    expect(targets).not.toContain('T2');
  });

  it('remove is case-insensitive and persists', () => {
    useWatchlistStore.getState().add('TROP2');
    useWatchlistStore.getState().remove('trop2');
    expect(useWatchlistStore.getState().targets).toEqual([]);
  });

  it('seedIfEmpty only seeds when empty', () => {
    useWatchlistStore.getState().seedIfEmpty(['CDCP1', 'CDCP1', 'TROP2']);
    expect(useWatchlistStore.getState().targets).toEqual(['CDCP1', 'TROP2']); // deduped
    useWatchlistStore.getState().seedIfEmpty(['KRAS']);
    expect(useWatchlistStore.getState().targets).toEqual(['CDCP1', 'TROP2']); // no-op when non-empty
  });

  it('loadTargets reads + normalizes pre-existing key data', () => {
    mem['lumina:intelligence:trackedTargets:v1'] = JSON.stringify(['cdcp1', 'cdcp1', 'trop2']);
    expect(loadTargets()).toEqual(['CDCP1', 'TROP2']); // assumes formatTargetDisplayName upcases these known targets
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/watchlist/store.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/watchlist/store.ts`**

```ts
import { create } from 'zustand';
import { formatTargetDisplayName } from '../targetNaming.js';

const KEY = 'lumina:intelligence:trackedTargets:v1';
const CAP = 8;

function normalize(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const t = formatTargetDisplayName(String(raw)).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Exported for tests + store init: read + normalize the persisted targets. */
export function loadTargets(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? normalize(parsed as string[]).slice(-CAP) : [];
  } catch {
    return [];
  }
}

function persist(targets: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(targets));
  } catch {
    // ignore
  }
}

interface WatchlistStore {
  targets: string[];
  add(target: string): void;
  remove(target: string): void;
  seedIfEmpty(defaults: string[]): void;
}

export const useWatchlistStore = create<WatchlistStore>()((set, get) => ({
  targets: loadTargets(),
  add: (target) =>
    set(() => {
      // remove any case-insensitive dupe, append the new one, keep the 8 most recent
      const targets = normalize([...get().targets, target]).slice(-CAP);
      persist(targets);
      return { targets };
    }),
  remove: (target) =>
    set(() => {
      const k = formatTargetDisplayName(String(target)).trim().toLowerCase();
      const targets = get().targets.filter((t) => t.toLowerCase() !== k);
      persist(targets);
      return { targets };
    }),
  seedIfEmpty: (defaults) =>
    set(() => {
      if (get().targets.length > 0) return {};
      const targets = normalize(defaults).slice(-CAP);
      persist(targets);
      return { targets };
    }),
}));
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/watchlist/store.test.ts`
Expected: PASS (all 5). If `loadTargets` normalization differs for the test targets, adjust the test's expected values to what `formatTargetDisplayName` actually returns - do NOT weaken the dedupe/cap assertions.

- [ ] **Step 5: Full gate + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
```bash
git add src/lib/watchlist/store.ts src/lib/watchlist/store.test.ts
git commit -m "feat(watchlist): shared watchlist store over the existing tracked-targets key"
```

---

### Task 2: useUnreadCounts hook

**Files:** Create `src/hooks/useUnreadCounts.ts`.

**Interfaces:**
- Produces: `useUnreadCounts(targets: string[]): Record<string, number>` - real unread counts per target from `GET /api/intelligence/unread?target=<t>`; missing/erroring -> 0.

**Context:** Mirror the feed's existing `useQueries` unread pattern (IntelligenceFeed ~lines 736-760). This is presentation-support, not new logic worth a unit test (it is a thin fetch wrapper); its correctness is covered by the Playwright pass in Task 6.

- [ ] **Step 1: Implement the hook**

```ts
import { useQueries } from '@tanstack/react-query';

async function fetchUnread(target: string): Promise<number> {
  try {
    const url = new URL('/api/intelligence/unread', window.location.origin);
    url.searchParams.set('target', target);
    const res = await fetch(url.toString());
    if (!res.ok) return 0;
    const data = (await res.json()) as { unread?: number; count?: number };
    return Number(data.unread ?? data.count ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function useUnreadCounts(targets: string[]): Record<string, number> {
  const queries = useQueries({
    queries: targets.map((t) => ({
      queryKey: ['unread', t],
      queryFn: () => fetchUnread(t),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const map: Record<string, number> = {};
  targets.forEach((t, i) => {
    map[t] = typeof queries[i]?.data === 'number' ? (queries[i].data as number) : 0;
  });
  return map;
}
```

Note: confirm the real `/api/intelligence/unread` response shape (open `server/api/intelligence/unread.ts`); if the count field is named differently, read that exact field (do not guess) - the `data.unread ?? data.count` fallback covers common shapes but verify.

- [ ] **Step 2: Build + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
```bash
git add src/hooks/useUnreadCounts.ts
git commit -m "feat(watchlist): useUnreadCounts hook over the real unread route"
```

---

### Task 3: Feed reads the shared store

**Files:** Modify `src/components/views/IntelligenceFeed.tsx`.

**Interfaces:**
- Consumes: `useWatchlistStore` (Task 1).

**Context:** Replace the feed's local `trackedTargets` state with the store so there is one source of truth. Keep all feed behavior; only ownership moves. The feed still reads the same localStorage key (via the store).

- [ ] **Step 1: Swap local state for the store**

In `src/components/views/IntelligenceFeed.tsx`: remove the `const [trackedTargets, setTrackedTargets] = useState<string[]>(...)` block (~552), the seed `useEffect` (~645-647), and the persist `useEffect` (~650-656). Add near the top of the component: `const trackedTargets = useWatchlistStore((s) => s.targets);`. Replace the seed effect with:
```tsx
useEffect(() => {
  useWatchlistStore.getState().seedIfEmpty(defaultTrackedTargets);
}, [defaultTrackedTargets]);
```
Replace any `setTrackedTargets((prev) => ...)` add/remove usage (e.g. the track/untrack button ~1783) with `useWatchlistStore.getState().add(target)` / `.remove(target)`. Keep `TRACKED_TARGETS_KEY` only if still referenced elsewhere; otherwise remove it. Add the import `import { useWatchlistStore } from '../../lib/watchlist/store';`.

- [ ] **Step 2: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the feed still renders its tracked targets and fetches; a track/untrack action updates the list.
```bash
git add src/components/views/IntelligenceFeed.tsx
git commit -m "feat(watchlist): feed reads tracked targets from the shared watchlist store"
```

---

### Task 4: Sidebar watched-target list

**Files:** Modify `src/components/Sidebar.tsx`.

**Interfaces:**
- Consumes: `useWatchlistStore` (Task 1), `useUnreadCounts` (Task 2). Uses the existing `onViewChange` prop.

**Context:** Add the watched-target list to the minimal sidebar per the mock, keeping the four-item nav + Engine-online exactly as they are.

- [ ] **Step 1: Render the watched list**

In `src/components/Sidebar.tsx`: read `const targets = useWatchlistStore((s) => s.targets);` and `const unread = useUnreadCounts(targets);`. Under the Watchlist nav item (or directly below the nav block, matching the mock), render each target as a compact button row: target name (Geist, `text-textSecondary hover:text-textPrimary`), and when `unread[t] > 0` a small badge (`bg-primary/10 text-primary` rounded pill with the number + "new"). Each row `onClick={() => onViewChange('feed')}` and `.tactile`. If `targets` is empty, render nothing extra. No fabricated badges (only show when count > 0).

- [ ] **Step 2: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the sidebar shows the watched targets under Watchlist with real "N new" badges where applicable; clicking a target opens the feed.
```bash
git add src/components/Sidebar.tsx
git commit -m "feat(watchlist): sidebar watched-target list with real new badges"
```

---

### Task 5: Watchlist view

**Files:** Rewrite `src/components/watchlist/WatchlistView.tsx` (+ optional `WatchlistTargetCard.tsx`); Modify `src/App.tsx` (pass `onViewInFeed`).

**Interfaces:**
- Consumes: `useWatchlistStore`, `useUnreadCounts`. Props: `WatchlistView({ onViewInFeed }: { onViewInFeed?: () => void })`.

**Context:** Replace the placeholder with the real view, designed in the locked system (no page-mock exists). Grounded: real counts only, catalysts "coming soon".

- [ ] **Step 1: Rebuild WatchlistView**

Rewrite `src/components/watchlist/WatchlistView.tsx`: read `targets` + `unread`. Render:
- Header: `font-display` "Watchlist" + subtitle "Targets Sonny is monitoring for new papers, trials, and patents."
- Add-target input: a controlled input ("Add a target - e.g. CDCP1") that on Enter calls `useWatchlistStore.getState().add(value)` and clears; ignores empty/whitespace.
- If `targets.length === 0`: a composed empty state ("Your watchlist is empty", a line, and the add input as the primary affordance).
- Else: a responsive card grid, one card per target: target name (Geist, prominent); a line showing `unread[t] > 0 ? \`${unread[t]} new signals\` : 'No new signals'` (`text-textSecondary`); a muted "Catalysts - coming soon"; a "View in feed" button (`onClick={onViewInFeed}`) and a "Remove" button (`useWatchlistStore.getState().remove(t)`). `.tactile`, hover-lift, semantic none (this is neutral data). Honor prefers-reduced-motion.

- [ ] **Step 2: Wire onViewInFeed from App**

In `src/App.tsx`, the `watchlist` render branch: `<WatchlistView onViewInFeed={() => setCurrentView('feed')} />`.

- [ ] **Step 3: Build + manual + commit**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: Watchlist view lists targets with real counts; add adds a card (and a sidebar row); remove removes both; View-in-feed opens the feed; empty state shows when cleared.
```bash
git add src/components/watchlist/WatchlistView.tsx src/App.tsx
git commit -m "feat(watchlist): real Watchlist view - cards, add/remove, view-in-feed, empty state"
```

---

### Task 6: Verification

**Files:** No source changes (fixes loop back). Create: `docs/design/watchlist-evidence/` (screenshots).

- [ ] **Step 1: Build, tests, engine-untouched proof**

Run: `npm run build` (clean) and `npx vitest run` (green).
Run: `git diff --name-only feat/minimal-shell-excision..HEAD | grep -E "src/lib/research/|src/hooks/useDeepResearchStream|src/components/research/|src/components/dossiers/|^server/"` -> expected: **no output**.

- [ ] **Step 2: Fresh server + fresh browser context**

`pkill -f vite; rm -rf node_modules/.vite; npm run dev`. In Playwright MCP call `browser_close` first, then navigate fresh to `http://localhost:5173`.

- [ ] **Step 3: Audit** (at 1440x900, spot-check 768/375)

- Open Watchlist: it lists the watched targets (or a composed empty state if none) with real "N new signals"/"No new signals" text and a "Catalysts - coming soon" line - NO fabricated catalyst numbers.
- Add a target (type + Enter): a new card appears AND a new row appears in the sidebar under Watchlist.
- Remove a target: it disappears from both the view and the sidebar.
- Click "View in feed": switches to the Feed, which renders using the same target list.
- Sidebar target rows show "N new" badges only where the real unread count > 0.
- Light, 0 real JS console errors (ignore backend 500s / network failures for the intelligence backend).
- Screenshots -> `docs/design/watchlist-evidence/watchlist-1440.png`, `sidebar-1440.png`.

- [ ] **Step 4: Punch-list + fix**, then commit evidence:
```bash
git add docs/design/watchlist-evidence
git commit -m "test(watchlist): verification evidence - shared list, real badges, add/remove"
```

---

## Self-Review

**Spec coverage:** store -> T1; unread hook -> T2; feed single-source refactor -> T3; sidebar list -> T4; Watchlist view (add/remove/view-in-feed/empty, no fabricated catalysts) -> T5; verification (engine-untouched + grounded + Playwright) -> T6. ✓

**Placeholder scan:** T1 carries verbatim store + tests; T2 carries the verbatim hook with an explicit "verify the real response field" note; T3 carries exact line refs for the feed swap; T4/T5 build to the design with exact store/hook calls and props. No TBD. The cap-overflow behavior is defined concretely (keep the 8 most recent via `.slice(-8)`).

**Type/name consistency:** `useWatchlistStore` shape (`targets`/`add`/`remove`/`seedIfEmpty`) + `loadTargets` are defined in T1 and consumed identically in T3/T4/T5; `useUnreadCounts(targets): Record<string,number>` defined in T2, consumed in T4/T5; `WatchlistView({ onViewInFeed })` defined in T5 and wired in App. The store's key matches the feed's existing key so no data migration is needed.

**Note on TDD:** T1 (the store, the only real logic) is full TDD. The hook (T2) is a thin fetch wrapper and the UI (T3-T5) is presentation over the store/route - their gate is build-green + Playwright grounded-behavior acceptance, the correct strategy for view/integration work.
