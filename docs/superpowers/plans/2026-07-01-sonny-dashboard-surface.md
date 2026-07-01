# Sonny Dashboard Surface (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A single Sonny research composer in the LUMINA dashboard that starts a grounded deep-research run, streams a live glass-box trace at 60fps, and renders the final GO/WATCH/NO-GO dossier - research-only, no skill wiring.

**Architecture:** Two decoupled data lifecycles. A backend SSE endpoint subscribes to the Phase 1 `runId` bus and streams `TraceEvent`s; the client buffers them in a `useRef` and flushes on a throttle (rAF) into a TRANSIENT per-`runId` Zustand trace store that folds events into aggregates (RAG dots, audit badges, counters). The final `Briefing` (on `done`, or via a hydrate fetch by `runId`) goes into a SEPARATE PERSISTENT briefing store. The persistent store never sees the live trace; the trace store never persists.

**Tech Stack:** LUMINA = npm, Express 5 (CJS server), React 19 + vanilla Zustand + Vite; Vitest (node-env only - no component test infra). Engine types from `@mrsirquanzo/sonny-shared`. Consumes Phase 1 (`server/lib/sonny/`: `startRun`, `subscribe`, `loadBriefing`).

## Global Constraints

- Two lifecycles, never mixed: the PERSISTENT briefing store updates ONLY on `done` or a hydrate fetch; the TRANSIENT trace store is per-`runId`, born on start, disposed on completion, and never persisted.
- A throttled buffer sits between the network and React: accumulate `TraceEvent`s in a `useRef`, flush on `requestAnimationFrame` (with a 100ms max-interval fallback and a guaranteed final flush on `done`). NEVER call `setState` per event.
- Fold events into aggregates (counts, per-section RAG, audit-flag badges); the raw log is capped/virtualized (ring buffer, max 300 retained) - never mount thousands of nodes.
- Research-only: the composer starts a deep-research run; no skill/tool wiring in this phase.
- Light empty-state discoverability only (a prompt line, example target chips, recent runs); no command palette or skills sidebar.
- Consume the Phase 1 bus contract verbatim: the SSE route subscribes to the `runId` bus; the terminal `done` bus event carries the full `Briefing`; hydrate is `loadBriefing(runId)`.
- Match LUMINA patterns: vanilla `create<T>()((set, get) => ({...}))` with manual localStorage helpers (NO persist middleware); state-based `currentView` view switching (NOT react-router `<Routes>`); the `/api` dev proxy targets `http://localhost:3001`; the client picks `/api/agents/...` on localhost and `/api/...` in prod.
- Engine values are never imported into the frontend; only `import type` from `@mrsirquanzo/sonny-shared` for `TraceEvent`/`Briefing` shapes.
- npm; tests run `npx vitest run <path>` (node env); do NOT run `npm install` in a subagent (no registry token in its env - deps are already installed).
- Logic (route, buffer, stores, aggregation) is TDD (node-env Vitest). UI components have no test infra; verify them with `npx tsc -b` (frontend typecheck) plus the manual smoke checklist at the end of the task. Adding React Testing Library is a deferred fast-follow, out of scope here.

---

## File Structure

### Backend (Express, CJS)
| File | Responsibility | Change |
| --- | --- | --- |
| `server/api/agents/deepResearch.ts` | `POST /` starts a run and streams the bus over SSE; `GET /:runId` hydrates a persisted `Briefing`. Deps injectable for tests. | Create |
| `server/app.ts` | Mount `app.use('/api/agents/deep-research', deepResearchRoutes)` | Modify |

### Frontend logic (node-env testable)
| File | Responsibility | Change |
| --- | --- | --- |
| `src/lib/research/sseTypes.ts` | Frontend view types: `ResearchTraceEvent` (mirror of the engine `TraceEvent` union we render), `BriefingView` (the fields we display), `RunPhase` | Create |
| `src/lib/research/traceBuffer.ts` | `createTraceBuffer({ onFlush, schedule })` - accumulate events, schedule a throttled flush, drain | Create |
| `src/lib/research/aggregate.ts` | `foldTrace(prev, events)` - pure reducer folding a batch into `{ counts, sectionsRag, auditFlags, phase, log }` (log capped at 300) | Create |
| `src/lib/research/traceStore.ts` | `createTraceStore()` - vanilla Zustand transient store holding the folded aggregate; `applyBatch(events)`; `reset()` | Create |
| `src/lib/research/briefingStore.ts` | `useBriefingStore` - vanilla Zustand + manual localStorage; `setBriefing(runId, briefing)`, `getBriefing(runId)` | Create |
| `src/lib/research/api.ts` | `deepResearchPath()`, `startDeepResearch(target, mode)` (returns the fetch Response for streaming), `fetchBriefing(runId)` | Create |
| `src/hooks/useDeepResearchStream.ts` | The hook: hydrate-or-stream; wires SSE -> buffer -> traceStore, and `done` -> briefingStore | Create |

### Frontend UI (presentational, tsc-gated)
| File | Responsibility | Change |
| --- | --- | --- |
| `src/components/research/ResearchComposer.tsx` | Target input + start; empty-state (prompt, example chips, recent runs) | Create |
| `src/components/research/GlassBoxTrace.tsx` | Subscribes to the trace store; RAG dots, audit badges, phase/progress, capped live log | Create |
| `src/components/research/ResearchDossier.tsx` | Renders the final `BriefingView`: verdict (largest), thesis, exec read, RAG-rated sections, bull/bear, conditions, references, KOL terrain | Create |
| `src/components/research/SonnyResearchDashboard.tsx` | The `research` view: composer <-> active run (GlassBox + Dossier); reads `?runId=` to hydrate | Create |
| `src/App.tsx` | Add `'research'` to `ViewState` and render `<SonnyResearchDashboard />` | Modify |
| `src/components/Sidebar.tsx` | Add a "Research" nav entry that sets `currentView('research')` | Modify |

### Data flow
```
composer submit ─► POST /api/agents/deep-research {target,mode}
                     │  server: runId = adapter.startRun(...) ; subscribe(runId, e -> res.write(sse(e)))
                     ▼
client: fetch Response ─► useRef buffer ──(rAF flush)──► traceStore.applyBatch ─► GlassBoxTrace (aggregates)
                                        └─ on 'done' ────► briefingStore.setBriefing ─► ResearchDossier
deep link ?runId= ─► GET /api/agents/deep-research/:runId ─► briefingStore.setBriefing ─► ResearchDossier (no SSE)
```

---

## Task 2.1: Backend SSE + hydrate endpoint

**Files:**
- Create: `server/api/agents/deepResearch.ts`
- Modify: `server/app.ts`
- Test: `server/api/agents/deepResearch.test.ts`

**Interfaces:**
- Consumes (Phase 1): `startRun(input: { runId; target; mode; backend })` and `subscribe(runId, fn): () => void`, `closeRun` from `../../lib/sonny/adapter.js` / `runBus.js`; `loadBriefing(runId)` from `../../lib/sonny/runStore.js`.
- Produces: an Express `Router` default export. `POST /` body `{ target, mode }` -> SSE stream (`data: {json}\n\n`), first frame `{ type: 'run_started', runId }`, then each bus event, then `res.end()` on a `done`/`error` bus event. `GET /:runId` -> `200` JSON `Briefing` or `404`. For testability, export a `makeDeepResearchRouter(deps)` factory where `deps = { startRun, subscribe, loadBriefing, makeRunId }` defaults to the real ones.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { makeDeepResearchRouter } from './deepResearch.js';

// minimal fake res that records SSE writes
function fakeRes() {
  const chunks: string[] = [];
  let ended = false;
  return {
    setHeader() {}, write(c: string) { chunks.push(c); }, end() { ended = true; },
    status() { return this; }, json(o: unknown) { chunks.push('JSON:' + JSON.stringify(o)); ended = true; },
    get chunks() { return chunks; }, get ended() { return ended; },
  } as never;
}

describe('deepResearch router', () => {
  it('POST streams run_started, forwards bus events, ends on done', async () => {
    let handler: ((e: unknown) => void) | null = null;
    const deps = {
      makeRunId: () => 'RID',
      startRun: () => {},
      subscribe: (_runId: string, fn: (e: unknown) => void) => { handler = fn; return () => {}; },
      loadBriefing: async () => null,
    };
    const router = makeDeepResearchRouter(deps);
    const post = (router.stack.find((l: any) => l.route?.methods?.post && l.route.path === '/') as any).route.stack[0].handle;
    const res = fakeRes();
    await post({ body: { target: 'CDCP1', mode: 'fast' } }, res);
    handler!({ type: 'lead_decompose', specialists: [] });
    handler!({ type: 'done', briefing: { target: 'CDCP1' } });
    const joined = res.chunks.join('');
    expect(joined).toContain('"type":"run_started"');
    expect(joined).toContain('"runId":"RID"');
    expect(joined).toContain('lead_decompose');
    expect(res.ended).toBe(true);
  });

  it('GET /:runId returns 404 when no briefing', async () => {
    const deps = { makeRunId: () => 'x', startRun: () => {}, subscribe: () => () => {}, loadBriefing: async () => null };
    const router = makeDeepResearchRouter(deps);
    const get = (router.stack.find((l: any) => l.route?.methods?.get) as any).route.stack[0].handle;
    const res = fakeRes();
    await get({ params: { runId: 'missing' } }, res);
    expect(res.chunks.join('')).toContain('JSON:');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** - `npx vitest run server/api/agents/deepResearch.test.ts`
- [ ] **Step 3: Implement `deepResearch.ts`**. Mirror the SSE headers used by `server/api/agents/orchestrator.ts` (`Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`). Sanitize/validate `target` (non-empty string) and `mode` (`fast`|`thorough`, default `thorough`). Choose backend from `process.env.SONNY_BACKEND || 'ollama'`. Generate `runId` = `` `${sanitize(target)}-${shortId}` `` (a helper using `Date.now().toString(36)` + a counter; do not import `Math.random` timing into tests - keep it in the real `makeRunId` default only). On `POST`: write `run_started`, `startRun({ runId, target, mode, backend })`, `subscribe(runId, e => res.write(`data: ${JSON.stringify(e)}\n\n`))`; when the event is `done` or `error`, unsubscribe and `res.end()`. On `GET /:runId`: `const b = await loadBriefing(runId); b ? res.json(b) : res.status(404).json({ error: 'not found' })`. Export both `makeDeepResearchRouter(deps)` and a default router built from real deps.
- [ ] **Step 4: Run it, expect PASS** - `npx vitest run server/api/agents/deepResearch.test.ts`
- [ ] **Step 5: Mount the router** in `server/app.ts`: `import deepResearchRoutes from './api/agents/deepResearch';` then `app.use('/api/agents/deep-research', deepResearchRoutes);` next to the other `app.use('/api/agents/...')` mounts.
- [ ] **Step 6: Type-check** - `npx tsc --project tsconfig.server.json --noEmit` (no NEW errors from the two files; 4 pre-existing unrelated errors remain).
- [ ] **Step 7: Commit** - `git add server/api/agents/deepResearch.ts server/api/agents/deepResearch.test.ts server/app.ts && git commit -m "feat(research): SSE deep-research endpoint + hydrate on the runId bus"`

## Task 2.2: The throttled trace buffer

**Files:**
- Create: `src/lib/research/traceBuffer.ts`
- Test: `src/lib/research/traceBuffer.test.ts`

**Interfaces:**
- Produces: `createTraceBuffer<T>({ onFlush, schedule }): { push(e: T): void; flush(): void; dispose(): void }`. `push` appends to an internal array and, if no flush is scheduled, calls `schedule(cb)` (in prod `requestAnimationFrame`; in tests a manual trigger). `flush` drains the array into a single `onFlush(batch)` call (no-op if empty) and clears the scheduled flag. `schedule` returns a cancel handle used by `dispose`.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { createTraceBuffer } from './traceBuffer.js';

describe('createTraceBuffer', () => {
  it('coalesces many pushes into one flush and drains', () => {
    const flushes: number[][] = [];
    let scheduled: (() => void) | null = null;
    const buf = createTraceBuffer<number>({
      onFlush: (batch) => flushes.push(batch),
      schedule: (cb) => { scheduled = cb; return () => { scheduled = null; }; },
    });
    buf.push(1); buf.push(2); buf.push(3);
    expect(flushes).toEqual([]);        // nothing until the scheduled flush fires
    scheduled!();                        // simulate the rAF tick
    expect(flushes).toEqual([[1, 2, 3]]);
    buf.flush();                         // empty -> no-op
    expect(flushes).toEqual([[1, 2, 3]]);
  });

  it('re-arms scheduling after a flush', () => {
    const flushes: number[][] = [];
    let scheduled: (() => void) | null = null;
    const buf = createTraceBuffer<number>({
      onFlush: (b) => flushes.push(b),
      schedule: (cb) => { scheduled = cb; return () => {}; },
    });
    buf.push(1); scheduled!();
    buf.push(2); scheduled!();
    expect(flushes).toEqual([[1], [2]]);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** - `npx vitest run src/lib/research/traceBuffer.test.ts`
- [ ] **Step 3: Implement** the buffer per the interface (internal `T[]`, a `scheduled` boolean + a cancel handle; `push` schedules once; `flush` drains and re-arms; `dispose` cancels).
- [ ] **Step 4: Run it, expect PASS**
- [ ] **Step 5: Commit** - `git commit -am "feat(research): throttled trace buffer (coalesce SSE into rAF flushes)"`

## Task 2.3: The aggregation reducer

**Files:**
- Create: `src/lib/research/sseTypes.ts`, `src/lib/research/aggregate.ts`
- Test: `src/lib/research/aggregate.test.ts`

**Interfaces:**
- `sseTypes.ts` produces: `type ResearchTraceEvent = { type: string; [k: string]: unknown }` (a permissive view of the engine `TraceEvent`; we key off `type` and known fields), and `interface TraceAggregate { phase: string; counts: Record<string, number>; sectionsRag: Record<string, 'red'|'amber'|'green'>; auditFlags: number; log: Array<{ type: string; label: string }>; }` and `const EMPTY_AGGREGATE: TraceAggregate`.
- `aggregate.ts` produces: `foldTrace(prev: TraceAggregate, events: ResearchTraceEvent[]): TraceAggregate` - a PURE reducer. Rules: increment `counts[e.type]`; on `section_complete` set `sectionsRag[e.id] = e.rag`; on `methodological_critique` increment `auditFlags`; map key events to a `phase` label (`lead_decompose`->'specialists', `developability_assessment`->'developability', `kol_cluster`->'mapping labs', `recommendation`->'done'); append a short `{type,label}` to `log` and cap `log` at the most recent 300.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { foldTrace } from './aggregate.js';
import { EMPTY_AGGREGATE } from './sseTypes.js';

describe('foldTrace', () => {
  it('counts events, tracks section RAG, audit flags, and phase', () => {
    const a = foldTrace(EMPTY_AGGREGATE, [
      { type: 'research_read' }, { type: 'research_read' },
      { type: 'section_complete', id: 'clinical', rag: 'amber' },
      { type: 'methodological_critique' },
      { type: 'lead_decompose', specialists: [] },
    ]);
    expect(a.counts.research_read).toBe(2);
    expect(a.sectionsRag.clinical).toBe('amber');
    expect(a.auditFlags).toBe(1);
    expect(a.phase).toBe('specialists');
    expect(a.log.length).toBe(5);
  });

  it('caps the log at 300 and is pure (does not mutate prev)', () => {
    const many = Array.from({ length: 350 }, () => ({ type: 'evidence_registered' }));
    const a = foldTrace(EMPTY_AGGREGATE, many);
    expect(a.log.length).toBe(300);
    expect(EMPTY_AGGREGATE.log.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** - `npx vitest run src/lib/research/aggregate.test.ts`
- [ ] **Step 3: Implement** `sseTypes.ts` (types + `EMPTY_AGGREGATE` frozen) and `foldTrace` (build a new aggregate each call - copy counts/sectionsRag, append to a sliced log; never mutate `prev`).
- [ ] **Step 4: Run it, expect PASS**
- [ ] **Step 5: Commit** - `git commit -am "feat(research): pure trace-aggregation reducer (counts, RAG, audit, phase)"`

## Task 2.4: The transient trace store

**Files:**
- Create: `src/lib/research/traceStore.ts`
- Test: `src/lib/research/traceStore.test.ts`

**Interfaces:**
- Consumes: `foldTrace`, `EMPTY_AGGREGATE`, `TraceAggregate`, `ResearchTraceEvent`.
- Produces: `createTraceStore()` returns a VANILLA zustand store (`import { createStore } from 'zustand/vanilla'`) with state `{ agg: TraceAggregate; applyBatch(events: ResearchTraceEvent[]): void; reset(): void }`. `applyBatch` sets `agg = foldTrace(get().agg, events)`. This is a FACTORY (one store per run), not a global singleton.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { createTraceStore } from './traceStore.js';

describe('createTraceStore', () => {
  it('folds batches into the aggregate and resets', () => {
    const store = createTraceStore();
    store.getState().applyBatch([{ type: 'research_read' }, { type: 'methodological_critique' }]);
    expect(store.getState().agg.counts.research_read).toBe(1);
    expect(store.getState().agg.auditFlags).toBe(1);
    store.getState().reset();
    expect(store.getState().agg.auditFlags).toBe(0);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** - `npx vitest run src/lib/research/traceStore.test.ts`
- [ ] **Step 3: Implement** with `createStore` from `zustand/vanilla` (zustand is already a dependency). Components will bind via `useStore(store, selector)` from `zustand`.
- [ ] **Step 4: Run it, expect PASS**
- [ ] **Step 5: Commit** - `git commit -am "feat(research): transient per-run trace store"`

## Task 2.5: The persistent briefing store + api helpers

**Files:**
- Create: `src/lib/research/briefingStore.ts`, `src/lib/research/api.ts`
- Test: `src/lib/research/briefingStore.test.ts`, `src/lib/research/api.test.ts`

**Interfaces:**
- `briefingStore.ts` produces: `useBriefingStore` - a GLOBAL vanilla `create<T>()((set, get) => ...)` store, state `{ briefings: Record<string, BriefingView>; setBriefing(runId, b): void; getBriefing(runId): BriefingView | undefined }`, persisting `briefings` to `localStorage` under `lumina:research:briefings:v1` via manual load/save helpers (mirror `workspaces/store.ts`). `BriefingView` from `sseTypes.ts` (add it there: `{ target; recommendation: { verdict; thesis; bull; bear; conditions }; executiveRead?; sections; references; kolCluster }`, all fields optional-permissive since local models vary).
- `api.ts` produces: `deepResearchPath(): string` (localhost -> `/api/agents/deep-research`, else `/api/deep-research`), `startDeepResearch(target, mode): Promise<Response>` (POST, `credentials: 'include'`, returns the streaming Response), `fetchBriefing(runId): Promise<BriefingView | null>` (GET `deepResearchPath()+'/'+runId`, 404 -> null).

- [ ] **Step 1: Write failing tests**

```typescript
// briefingStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useBriefingStore } from './briefingStore.js';
describe('briefingStore', () => {
  beforeEach(() => useBriefingStore.getState().setBriefing('r1', { target: 'CDCP1' } as never));
  it('round-trips a briefing by runId', () => {
    expect(useBriefingStore.getState().getBriefing('r1')?.target).toBe('CDCP1');
    expect(useBriefingStore.getState().getBriefing('nope')).toBeUndefined();
  });
});
// api.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchBriefing } from './api.js';
describe('fetchBriefing', () => {
  it('returns null on 404', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }) as never);
    expect(await fetchBriefing('missing')).toBeNull();
  });
});
```

- [ ] **Step 2: Run them, expect FAIL** - `npx vitest run src/lib/research/briefingStore.test.ts src/lib/research/api.test.ts`
- [ ] **Step 3: Implement** both. For `api.ts` guard `typeof window` for SSR/test safety (default to `/api/agents/deep-research` when `window` is undefined).
- [ ] **Step 4: Run them, expect PASS**
- [ ] **Step 5: Commit** - `git commit -am "feat(research): persistent briefing store + deep-research api helpers"`

## Task 2.6: The useDeepResearchStream hook

**Files:**
- Create: `src/hooks/useDeepResearchStream.ts`
- Verify: `npx tsc -b` (thin glue over already-tested pieces; no node test - it owns a live fetch + rAF)

**Interfaces:**
- Consumes: `createTraceStore`, `useBriefingStore`, `startDeepResearch`, `fetchBriefing`, `createTraceBuffer`.
- Produces: `useDeepResearchStream(): { traceStore, status, runId, start(target, mode?), hydrate(runId) }` where `status: 'idle'|'hydrating'|'running'|'done'|'error'`. `start`: create a fresh `traceStore` (store it in a ref), open `startDeepResearch`, read the stream, parse `data:` lines, `buffer.push(event)`; the buffer's `onFlush` calls `traceStore.getState().applyBatch(batch)`; the buffer's `schedule` uses `requestAnimationFrame` with a `setTimeout(100)` fallback; on a `done` event call `buffer.flush()` then `useBriefingStore.getState().setBriefing(runId, event.briefing)` and set status `done`; on `error` set status `error`. `hydrate(runId)`: status `hydrating`, `const b = await fetchBriefing(runId)`; if found `setBriefing` + status `done`, else status `idle`. Capture `runId` from the first `run_started` frame.

- [ ] **Step 1: Implement** the hook per the interface. Keep ALL non-trivial logic in the already-tested modules (buffer, foldTrace, stores); the hook is wiring. Use `useRef` for the per-run `traceStore` and buffer so re-renders never recreate them. Parse SSE with the same `getReader()`/`TextDecoder`/split-on-`\n`/`data: ` pattern as `MultiAgentCollaboration.tsx:195-305`, but push into the buffer instead of `setState`.
- [ ] **Step 2: Type-check** - `npx tsc -b` (0 new errors).
- [ ] **Step 3: Commit** - `git commit -am "feat(research): useDeepResearchStream hook (throttled SSE -> transient store; done -> persistent)"`

## Task 2.7: Research composer + view + nav wiring

**Files:**
- Create: `src/components/research/ResearchComposer.tsx`, `src/components/research/SonnyResearchDashboard.tsx`
- Modify: `src/App.tsx` (add `'research'` to `ViewState`, render the view), `src/components/Sidebar.tsx` (nav entry)
- Verify: `npx tsc -b` + manual smoke checklist below

**Interfaces:**
- Consumes: `useDeepResearchStream`.
- `ResearchComposer` props: `{ onStart(target: string, mode: 'fast'|'thorough'): void; recentRuns?: Array<{ runId: string; target: string }> }`. Renders a target input, a fast/thorough toggle, a Start button, an empty-state (a prompt line "Ask Sonny to assess a target", example chips CDCP1 / TROP2 / KRAS G12C that fill the input, and a recent-runs list). No skills/agent menu.
- `SonnyResearchDashboard` (the `research` view): calls `useDeepResearchStream()`; on mount reads `new URLSearchParams(window.location.search).get('runId')` and calls `hydrate(runId)` if present. Layout: when `status==='idle'` show `<ResearchComposer onStart={start} .../>`; otherwise a two-column active-run layout with `<GlassBoxTrace .../>` (left) and `<ResearchDossier .../>` (right, shown when a briefing exists). Match the existing dark-mode glass styling used in `SonnySidePanel`/`CitedMarkdown` (Tailwind, frosted panels).

- [ ] **Step 1: Implement `ResearchComposer.tsx`** (presentational; controlled input; chips call `setTarget`; Start calls `onStart`).
- [ ] **Step 2: Implement `SonnyResearchDashboard.tsx`** wiring the hook + hydrate + layout.
- [ ] **Step 3: Wire the view** - in `src/App.tsx` add `'research'` to the `ViewState` union and a render branch `{currentView === 'research' && <Suspense fallback={<DashboardSkeleton/>}><SonnyResearchDashboard/></Suspense>}` (lazy-import it), and in `src/components/Sidebar.tsx` add a "Research" button calling the existing `onViewChange('research')` mechanism (match how 'feed'/'workspaces' entries are defined).
- [ ] **Step 4: Type-check** - `npx tsc -b` (0 new errors).
- [ ] **Step 5: Manual smoke** (record results in the report): with the backend running (`npm run dev:server`) and `SONNY_BACKEND=ollama`, open the app, go to Research, submit `CDCP1`; confirm the run starts (a `run_started` and events arrive) and no console errors. (Full dossier render is Task 2.9.)
- [ ] **Step 6: Commit** - `git add src/components/research/ResearchComposer.tsx src/components/research/SonnyResearchDashboard.tsx src/App.tsx src/components/Sidebar.tsx && git commit -m "feat(research): Sonny research composer, view, and nav"`

## Task 2.8: Glass-box trace panel

**Files:**
- Create: `src/components/research/GlassBoxTrace.tsx`
- Verify: `npx tsc -b` + manual smoke

**Interfaces:**
- Consumes: the per-run `traceStore` (passed as a prop) + `useStore` from `zustand`; `TraceAggregate`.
- Props: `{ traceStore: ReturnType<typeof createTraceStore>; status: string }`. Subscribes with narrow selectors (`useStore(traceStore, s => s.agg.phase)`, `...counts`, `...sectionsRag`, `...auditFlags`, and `...log` for the virtualized log). Renders: a phase indicator; per-section RAG dots (green/amber/red) from `sectionsRag`; an audit-flag badge (`auditFlags`); key counters (papers read = `counts.research_read`, evidence = `counts.evidence_registered`); and a capped live log (render the `log` array, already capped at 300; use simple overflow-scroll - a windowing lib is a fast-follow). Animations must read from the throttled store only.

- [ ] **Step 1: Implement** with narrow `useStore` selectors (never select the whole `agg` object - select primitives/arrays so unrelated updates don't re-render).
- [ ] **Step 2: Type-check** - `npx tsc -b`.
- [ ] **Step 3: Manual smoke**: during a live `CDCP1` run, confirm RAG dots, counters, and audit badge update smoothly (no visible jank), and the log scrolls.
- [ ] **Step 4: Commit** - `git commit -am "feat(research): glass-box trace panel (throttled aggregates + capped log)"`

## Task 2.9: Research dossier render

**Files:**
- Create: `src/components/research/ResearchDossier.tsx`
- Verify: `npx tsc -b` + manual smoke

**Interfaces:**
- Consumes: `BriefingView` (from `sseTypes.ts`), `CitedMarkdown` (`src/components/shared/CitedMarkdown.tsx`) for prose.
- Props: `{ briefing: BriefingView }`. Layout, conclusion-first: the verdict (`recommendation.verdict`, uppercased) is the LARGEST text on the view; then the thesis; then the executive read (via `CitedMarkdown` if present); then the sections as cards, each with a RAG chip (`section.rag`), title, takeaway, and claims; then bull/bear/conditions; then the references list (monospace ids); then the KOL & institutional terrain (`kolCluster.labs`: investigator, institution, paperCount). Guard every field (local-model briefings may omit sections). Use the existing dark-glass Tailwind styling.

- [ ] **Step 1: Implement** the structured render (guarding optional fields; verdict largest; RAG chips per section).
- [ ] **Step 2: Type-check** - `npx tsc -b`.
- [ ] **Step 3: Manual smoke**: let a `CDCP1` run complete (or deep-link `?runId=` a persisted run) and confirm the verdict, sections with RAG, references, and KOL terrain render, and the deep-link hydrate path shows the persisted dossier without re-running.
- [ ] **Step 4: Commit** - `git commit -am "feat(research): conclusion-first dossier render + hydrate-by-runId"`

---

## Self-Review

**Spec coverage:**
- Decoupled transient vs persistent state -> Tasks 2.3/2.4 (transient trace store) vs 2.5 (persistent briefing store); never mixed (hook 2.6 routes `done` to persistent only).
- Throttled `useRef` buffer -> rAF flush -> local store -> Tasks 2.2 (buffer) + 2.6 (hook wires rAF + final flush on done).
- Aggregate not append; capped log -> Task 2.3 (`foldTrace`, cap 300) + 2.8 (narrow selectors, capped log).
- SSE endpoint on the Phase 1 bus + hydrate -> Task 2.1.
- Research-only composer + empty-state discoverability -> Task 2.7.
- Conclusion-first dossier + hydrate-by-runId -> Task 2.9 (+ 2.6 hydrate).
- Valuation-tools future-proofing -> satisfied structurally (persistent store is isolated); no task builds valuation here (out of scope), as intended.

**Placeholder scan:** Logic tasks (2.1-2.5) carry full test + implementation direction with exact interfaces. UI tasks (2.6-2.9) are presentational with exact props/consumes and a manual smoke gate, because LUMINA has no component test infra (adding RTL is an explicit deferred fast-follow, per Global Constraints) - not a `TODO`.

**Type consistency:** `TraceAggregate`, `EMPTY_AGGREGATE`, `ResearchTraceEvent`, `BriefingView`, `createTraceStore`, `foldTrace`, `useBriefingStore`, `deepResearchPath`, `useDeepResearchStream` are named identically across the tasks that define and consume them. `BriefingView` is defined in `sseTypes.ts` (Task 2.3/2.5) and consumed in 2.5/2.9.

---

*Plan authored 2026-07-01. Implements Phase 2 of the Sonny-LUMINA integration (dashboard surface), research-only, with the decoupled-state / throttled-stream architecture. Skill wiring (patent etc.) and valuation tools are deliberately out of scope; the persistent-store isolation future-proofs for them.*
