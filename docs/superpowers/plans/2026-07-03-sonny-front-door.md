# Unified Ask-Sonny Front Door - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark Phase 2 research UI and the six-agent right rail with one light, full-view Ask-Sonny home - the app's default landing - built on the unchanged deep-research engine.

**Architecture:** The home mounts at the existing `currentView === 'research'` seam in `App.tsx`, becomes the default landing, and consumes `useDeepResearchStream` exactly as the Phase 2 UI did. The four dark research components are rebuilt into their light design-doc forms; the six specialist mock panels and the `SonnySidePanel` rail are deleted; the deep-research engine layer (hook, stores, SSE parser, aggregation, server route) is untouched so every figure stays grounded to a real evidence id.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 3.4 (light tokens + Geist/Newsreader/Geist Mono from SP1), TypeScript, Vitest 4, Playwright (MCP) for visual/live verification.

**Spec:** `docs/superpowers/specs/2026-07-03-sonny-front-door-design.md`
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**Visual reference (build to this):** `docs/design/sonny-home-mock.html` (+ `sonny-dossier-drill-mock.html` for the dossier, `sonny-states-mock.html` for loading/empty/error)

## Global Constraints

- **Engine layer is UNTOUCHED.** No task may modify any file under `src/lib/research/*` (the `.ts` engine files: api, sseParse, sseTypes, traceStore, traceBuffer, briefingStore, aggregate), `src/hooks/useDeepResearchStream.ts`, or `server/api/agents/deepResearch.ts`. Final verification asserts `git diff` touches none of these. SP2 is a presentation rebuild on top of them.
- **Grounded, no fabricated data.** Every figure the home shows (papers/evidence/tools counters, verdict, RAG sections, KOL, references) comes from a real engine event or evidence id via the trace/briefing stores. No invented numbers, no placeholder metrics, no fake demo data.
- **Honesty in capability labels.** Capability cards show only truthful states: Deep research = Available (wired to the live engine); Patent = Coming soon; all other specialists = Coming soon. The composer's upload affordance is shown but disabled/"Coming soon" (no live skill consumes documents yet). No demo-vs-live mode is added.
- **Design system:** light tokens only (page `#F6F8FB`, surface `#FFFFFF`, ink `#0F172A`, border `#E6EBF2`, primary `#1D4ED8`, semantic `go/watch/nogo`); Geist (UI) + Newsreader (`font-display`, editorial: wordmark, run/section titles, executive read) + Geist Mono (`font-mono`, identifiers/figures); liquid-glass on floating panels (`.glass`), `.tactile` press, `shadow-card`. Verdict/RAG use the semantic status colors, never blue.
- **Preserve dormant, do not delete:** `server/api/patent-parsing.ts` and its lib stay untouched and unreferenced. The tile/workspace stores and `TileType` strings survive (they reference type strings, not the deleted panels).
- **Presentation + structure only.** No change to the engine request contract (`POST /api/agents/deep-research` `{ target, mode }`, SSE `run_started`/`trace`/`done`), no new backend.
- **Commit style:** plain hyphens, never em dashes; no agent co-author line. Stage only the files a task touches (explicit `git add`, never `git add -A`). Logic changes run BOTH `npx vitest run` AND `npm run build` (tsc-masking: vitest strips types).

---

### Task 1: Flip the seam - default landing + nav label

**Files:**
- Modify: `src/App.tsx:53` (currentView default)
- Modify: `src/components/Sidebar.tsx:347` (nav label)

**Interfaces:**
- Consumes: existing `ViewState` (`'dashboard' | 'feed' | 'workspaces' | 'history' | 'research'`) from `src/types/index.ts:9` - unchanged.
- Produces: Sonny (`research` view) is the default landing and is labeled "Sonny" in the sidebar.

**Context:** `research` is already a `ViewState`; we keep the internal id `'research'` (renaming the id is out of scope) and only change the default and the user-facing label.

- [ ] **Step 1: Make Sonny the default landing**

In `src/App.tsx` line 53 change:
```tsx
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
```
to:
```tsx
  const [currentView, setCurrentView] = useState<ViewState>('research');
```

- [ ] **Step 2: Rename the nav label to Sonny**

In `src/components/Sidebar.tsx` line 347 change:
```tsx
    { id: 'research' as ViewState, icon: Microscope, label: 'Research' },
```
to:
```tsx
    { id: 'research' as ViewState, icon: Sparkles, label: 'Sonny' },
```
Add `Sparkles` to the existing `lucide-react` import at the top of `Sidebar.tsx` (it already imports `Microscope`, `LayoutGrid`, etc.; add `Sparkles` to that import list). If `Microscope` becomes unused elsewhere in the file, leave it - do not chase unrelated cleanup.

- [ ] **Step 3: Verify build + tests**

Run: `npm run build`
Expected: clean (tsc + vite).
Run: `npx vitest run`
Expected: all pass unchanged.

- [ ] **Step 4: Manual check**

Run `npm run dev`, load `http://localhost:5173`: the app lands on the Sonny (research) view by default, and the sidebar shows a "Sonny" item (Sparkles icon) as active.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Sidebar.tsx
git commit -m "feat(sonny): make Sonny the default landing view and rename the nav item"
```

---

### Task 2: Retire the right rail

**Files:**
- Modify: `src/App.tsx` (remove `SonnySidePanel` import ~line 17, its render block ~573-580, the `sonnyPanelCollapsed`/`sonnyPanelWidth` state ~72-90, their localStorage effects ~236-237, the `paddingRight` reservation ~504, the panel-toggle keyboard shortcut and Header props ~246-330 / ~490-495).

**Interfaces:**
- Consumes: nothing new.
- Produces: an app shell with no right-side Sonny panel; the main content area spans full width (no `paddingRight` reservation).

**Context:** The `SonnySidePanel` file still exists after this task (deleted in Task 5); this task only stops rendering it and removes its now-dead plumbing from `App.tsx`, so the build has no unused-symbol errors. Work by reading `App.tsx` and removing each referenced piece; the grep in Step 1 enumerates them.

- [ ] **Step 1: Enumerate every rail reference in App.tsx**

Run: `grep -n "SonnySidePanel\|sonnyPanelCollapsed\|sonnyPanelWidth\|onToggleSonnyPanel\|paddingRight" src/App.tsx`
Expected: the import, the render block, the two state hooks, the localStorage effects, the Header props, and the `paddingRight` style. This list is the work.

- [ ] **Step 2: Remove the render + import**

Delete the `<SonnySidePanel ... />` render block (~573-580) and the `import SonnySidePanel from './components/SonnySidePanel';` line (~17).

- [ ] **Step 3: Remove the panel state, effects, and layout reservation**

Remove the `sonnyPanelCollapsed` and `sonnyPanelWidth` `useState` hooks (~72-90), the `localStorage.setItem('sonnyPanelCollapsed', ...)` effect (~236-237), and any effect body that only exists to manage the panel. In the main content wrapper, change the `paddingRight` style (~504) from `!sonnyPanelCollapsed ? \`${sonnyPanelWidth}px\` : '0'` to a constant `'0'` (or remove the dynamic `paddingRight` entirely so the content spans full width). Remove the `sonnyPanelCollapsed` / `onToggleSonnyPanel` props passed to `Header` (~494-495) and the panel-toggle keyboard handling that references `sonnyPanelCollapsed` (~246-330) - keep any unrelated keyboard shortcuts (e.g. Cmd+K search) intact.

- [ ] **Step 4: Resolve Header prop fallout**

If `Header` declares `sonnyPanelCollapsed` / `onToggleSonnyPanel` props that are now unpassed, make them optional in `Header.tsx` and remove the toggle button that used them (the panel it toggled is gone). Do not remove unrelated Header functionality (search, persona, etc.).

- [ ] **Step 5: Verify build + tests**

Run: `npm run build`
Expected: clean - no unused-import or missing-symbol errors, no reference to `sonnyPanel*` remains.
Run: `grep -n "sonnyPanel\|SonnySidePanel" src/App.tsx src/components/Header.tsx`
Expected: no matches.
Run: `npx vitest run`
Expected: all pass unchanged.

- [ ] **Step 6: Manual check**

`npm run dev`: no right-side panel renders; the main content spans the full width; no console error; no dead toggle button in the header.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/Header.tsx
git commit -m "feat(sonny): retire the right-side SonnySidePanel rail and its plumbing"
```

---

### Task 3: Build the Ask-Sonny home - composer + capability cards

**Files:**
- Modify/Rewrite: `src/components/research/SonnyResearchDashboard.tsx` (this is the component `App.tsx` renders at `currentView === 'research'`, ~line 543-545; keep the same default export so the seam is unchanged).
- Modify: `src/components/research/ResearchComposer.tsx` (elevate to the design-doc composer + capability cards, or split cards into a sibling `CapabilityCards.tsx` under `research/` if cleaner).
- Reference (read-only): `docs/design/sonny-home-mock.html`, `docs/design/SONNY_DASHBOARD_DESIGN.md`.

**Interfaces:**
- Consumes: `useDeepResearchStream()` from `src/hooks/useDeepResearchStream.ts`, which exposes exactly: `traceStore` (`ReturnType<typeof createTraceStore> | null`), `status` (`'idle' | 'hydrating' | 'running' | 'done' | 'error'`), `runId` (`string | null`), `error` (`string | null`), `start(target: string, mode?: 'fast' | 'thorough'): Promise<void>`, `hydrate(runId: string): Promise<void>`. Also `useBriefingStore` selects `briefings[runId]` for the completed dossier.
- Produces: the full-view Ask-Sonny home rendered at the `research` seam, driving `start()` on submit.

**Context:** Build to `sonny-home-mock.html`. The current `SonnyResearchDashboard.tsx` (69 lines) already wires the hook, hydrates from `?runId=`, and renders composer -> trace/dossier; keep that behavior and elevate the presentation. This task delivers the composer + capability cards + run wiring; Task 4 upgrades the trace + dossier that this home renders.

- [ ] **Step 1: Home layout shell**

Rebuild `SonnyResearchDashboard.tsx` as the light full-view home per the mock: a centered content column (`max-w` per design doc), the Newsreader wordmark/title, the command composer (Task 3 Step 2), the capability cards (Step 3), and below them the run region (glass-box trace while `status==='running'`, conclusion-first dossier when a briefing exists - these come from Task 4; for now keep rendering the existing `GlassBoxTrace`/`ResearchDossier` so the home works end-to-end at this task's close). Preserve the existing `?runId=` hydrate-on-mount effect and the `status==='error'` inline error banner.

- [ ] **Step 2: Command composer (liquid-glass)**

Elevate `ResearchComposer.tsx` to the design-doc composer: a `.glass` floating input bar (Geist input, `focus:border-primary`, focus ring), Enter-to-run, the fast/thorough toggle (default `fast`), example target chips (CDCP1 / TROP2 / KRAS G12C), and a **disabled** upload button with a "Coming soon" tooltip (honesty constraint - no live skill consumes documents). `onStart(target, mode)` calls the home's `start()`. Keep the `tactile` press on the run button. Do not fabricate any recent-runs data - only show real runs from the briefing store if present.

- [ ] **Step 3: Capability cards (honest states)**

Render capability cards per the mock and design doc, with truthful status only:
- **Deep research - Available**: the live capability (this is what the composer runs). Active card styling.
- **Patent - Coming soon**: inert (muted, dashed border per design doc, no click).
- **PoS + Indication - Coming soon**, and any other specialist cards from the mock - all inert "Coming soon".
Use a 2-column grid (never a 3-equal-card row). Coming-soon cards must be visibly non-interactive (no hover-lift, `cursor-default`, reduced opacity).

- [ ] **Step 4: Verify build + tests + manual**

Run: `npm run build` (clean) and `npx vitest run` (all pass).
`npm run dev`: the Sonny home renders light per the mock - composer, capability cards (Deep research Available, others Coming soon), and (with backend running) typing a target + Enter starts a run and the existing trace/dossier appear below. With no backend, the composer/cards render and a failed start shows the inline error state, no crash.

- [ ] **Step 5: Commit**

```bash
git add src/components/research/SonnyResearchDashboard.tsx src/components/research/ResearchComposer.tsx
git commit -m "feat(sonny): light Ask-Sonny home - liquid-glass composer and honest capability cards"
```

---

### Task 4: Build the light glass-box trace + conclusion-first dossier

**Files:**
- Modify/Rewrite: `src/components/research/GlassBoxTrace.tsx` (light glass-box per design doc).
- Modify/Rewrite: `src/components/research/ResearchDossier.tsx` (light conclusion-first dossier per design doc).
- Reference (read-only): `docs/design/sonny-dossier-drill-mock.html`, `docs/design/sonny-home-mock.html`, `docs/design/SONNY_DASHBOARD_DESIGN.md`.

**Interfaces:**
- Consumes: `GlassBoxTrace` receives the `traceStore` (from `useDeepResearchStream`) and `status`; it subscribes to the vanilla store's aggregate (phases, specialist threads, counters). `ResearchDossier` receives the `BriefingView` object selected from `useBriefingStore` by `runId`. Do not change these prop shapes - only the presentation.
- Produces: the two design-doc surfaces the home renders during/after a run.

**Context:** These render inside the Task 3 home. Keep the exact data they read from the stores; rebuild only the markup/styling to the light design-doc forms. Every value shown must come from the store (grounded).

- [ ] **Step 1: Light glass-box trace**

Rebuild `GlassBoxTrace.tsx` per the design doc: a bordered light panel; steps as a vertical checklist (done = green check, current = blue spinner ring, future = hollow slate ring); specialist threads in a 2-column grid gaining a RAG dot on completion; counters (papers / evidence / tools) as quiet KPI chips with **Geist Mono** figures; the streaming log legible and calm (respect the existing throttle; no light-show). Honor `prefers-reduced-motion`. All counts/labels come from the trace aggregate - no fabricated values.

- [ ] **Step 2: Conclusion-first dossier**

Rebuild `ResearchDossier.tsx` per `sonny-dossier-drill-mock.html`: verdict pill first (GO green / WATCH amber / NO-GO red fill via the `go`/`watch`/`nogo` tokens, the largest signal) -> executive read in Newsreader (`font-display`, ~70ch) -> the RAG sections (pill + colored dot + label, citation superscripts) -> KOL terrain in a `bg-subtle` panel -> references (Geist Mono ids, linked) -> any gate/skeptic note. Right-align actions. Verdict and RAG use the semantic status tokens, never blue. Every figure traces to a real evidence id from the briefing.

- [ ] **Step 3: Loading / empty / error states**

Ensure the home's run region uses the design-doc states (from `sonny-states-mock.html`): skeleton loaders that match the trace/dossier shape (not a bare spinner) while a run spins up, a composed empty state before any run ("Ask Sonny a question; the run and its glass-box appear here"), and the inline recoverable error (reuse the `status==='error'` path). Shimmer stops under `prefers-reduced-motion`.

- [ ] **Step 4: Verify build + tests + manual**

Run: `npm run build` (clean) and `npx vitest run` (all pass - the trace/briefing store tests are untouched and must stay green).
`npm run dev` with backend: run a target; the glass-box streams real phases/counters and the dossier renders conclusion-first with the verdict pill and real references. Confirm reduced-motion disables shimmer/spinners.

- [ ] **Step 5: Commit**

```bash
git add src/components/research/GlassBoxTrace.tsx src/components/research/ResearchDossier.tsx
git commit -m "feat(sonny): light glass-box trace and conclusion-first dossier"
```

---

### Task 5: Delete the mock specialist UIs and the rail

**Files:**
- Delete: `src/components/SonnySidePanel.tsx`.
- Delete: `src/components/sonny/` (SonnyHeroInterface, HeroSkillCard, barrel) - after salvage (Step 1).
- Delete: `src/components/agents/shared/AgentInterfaceLayout.tsx`, `AgentIconNavigation.tsx`, and the rail-only orchestration components under `src/components/agents/` (`MultiAgentCollaboration.tsx`, `MultiAgentDemo*.tsx`, and siblings that only served the rail).
- Delete: the six specialist directories `src/components/{patent,clinical,market,financial,target-biology,regulatory}/` (V1 and V2).

**Interfaces:**
- Consumes: nothing.
- Produces: a repo with the dead multi-agent UI removed; `POST /api/patent-parsing` route preserved and unreferenced.

**Context:** Deletion is gated by a reference check - remove a file only after confirming no *surviving* module imports it. `npm run build` (tsc) is the backstop: any dangling import fails it.

- [ ] **Step 1: Salvage check**

Before deleting `src/components/sonny/`, confirm the new home (Task 3/4) does not import anything from it: `grep -rn "components/sonny\|SonnyHeroInterface\|HeroSkillCard" src/components/research src/App.tsx`. If the home reused a helper from `sonny/`, move that helper into `src/components/research/` first and update the import, so deletion leaves no dangling reference.

- [ ] **Step 2: Reference-safety enumeration**

Run: `grep -rn "components/SonnySidePanel\|components/sonny\|agents/shared/AgentInterfaceLayout\|agents/shared/AgentIconNavigation\|MultiAgentCollaboration\|MultiAgentDemo\|/patent/\|/clinical/\|/market/\|/financial/\|/target-biology/\|/regulatory/" src --include=*.ts --include=*.tsx | grep -vE "components/(SonnySidePanel\.tsx|sonny/|agents/|patent/|clinical/|market/|financial/|target-biology/|regulatory/)"`
Expected: no matches outside the deletion set (i.e. no *surviving* file imports a deletion target). If a surviving file (e.g. a tile helper) imports one, resolve it before deleting - move or inline the needed piece. Note: tile/workspace stores reference `TileType` *strings*, not these components, and are fine.

- [ ] **Step 3: Delete the files**

```bash
git rm src/components/SonnySidePanel.tsx
git rm -r src/components/sonny
git rm src/components/agents/shared/AgentInterfaceLayout.tsx src/components/agents/shared/AgentIconNavigation.tsx
git rm src/components/agents/MultiAgentCollaboration.tsx
git rm -r src/components/patent src/components/clinical src/components/market src/components/financial src/components/target-biology src/components/regulatory
```
Then inspect the rest of `src/components/agents/` (`ls src/components/agents`): delete the remaining rail-only files (e.g. `MultiAgentDemo.tsx`, `MultiAgentDemoWrapper.tsx`, `CustomAgentTeamBuilder.tsx`, the per-domain `*Agent.tsx` demos) ONLY if Step 2's grep proves nothing surviving imports them; keep `agents/shared/` files that a surviving module still uses (re-grep each before `git rm`).

- [ ] **Step 4: Confirm the patent route is preserved**

Run: `test -f server/api/patent-parsing.ts && echo PRESERVED`
Expected: `PRESERVED` (the server route must NOT be deleted; only its client UI was removed).

- [ ] **Step 5: Verify build + tests**

Run: `npm run build`
Expected: clean - no dangling import; if tsc reports a missing module, a surviving file still referenced a deleted one (go back to Step 2 and resolve it).
Run: `npx vitest run`
Expected: all pass unchanged.
Run: `grep -rn "SonnySidePanel\|SonnyHeroInterface\|AgentInterfaceLayout" src/App.tsx src/components/Header.tsx src/components/Sidebar.tsx`
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add -A src/components
git commit -m "feat(sonny): delete mock specialist panels and multi-agent rail (patent route preserved dormant)"
```
(Here `git add -A src/components` is scoped to the components tree to stage the deletions; it cannot pick up tooling scratch, which is gitignored and outside `src/`.)

---

### Task 6: Verification - live smoke + light audit

**Files:**
- No source changes (fixes loop back into the owning task's files).
- Create: `docs/design/sonny-front-door-evidence/` (screenshots).

**Interfaces:**
- Consumes: the finished home from Tasks 1-5.
- Produces: pass/fail evidence and a punch list.

**Context:** No unit test asserts "looks like the mock," so verification is: build/tests green + engine-untouched proof + a live deep-research smoke through the home + a Playwright light/default-landing pass.

- [ ] **Step 1: Build, tests, and engine-untouched proof**

Run: `npm run build` (clean) and `npx vitest run` (all pass).
Run: `git diff --name-only feat/lumina-relight-shell..HEAD | grep -E "src/lib/research/.*\.ts$|src/hooks/useDeepResearchStream|server/api/agents/deepResearch"`
Expected: **no output** (the engine layer was not modified). If any line prints, an engine file was touched - investigate and revert that change.

- [ ] **Step 2: Live deep-research smoke through the home**

Start the backend + dev server (the project's `npm run dev:all` / Ollama path used in Phase 2). In the browser, from the Sonny home, enter a real target (e.g. `CDCP1`) and run. Confirm: the glass-box streams real `run_started` + `trace` events (real tool calls, evidence ids, non-zero counters), and on `done` the conclusion-first dossier renders with a verdict pill and real references. Capture the network SSE and a screenshot as evidence.

- [ ] **Step 3: Playwright light + default-landing pass**

With the app running, use Playwright MCP at 1440x900, 768x1024, 375x812:
- On load (no navigation), confirm the **Sonny home is the default view** (no dashboard first).
- 0 console errors (ignore backend 500s if backend is off for the visual pass).
- Capability cards show Deep research = Available and the rest = Coming soon (inert).
- No right-side rail; no dead header toggle.
- Light, legible, blue accents, verdict/RAG in semantic colors, no horizontal scroll.
- Save screenshots to `docs/design/sonny-front-door-evidence/home-<width>.png` (and a dossier shot if a run is available).

- [ ] **Step 4: Punch-list any regressions**

Fix each finding in the owning task's file(s), rebuild, re-screenshot, until the pass is clean.

- [ ] **Step 5: Commit evidence**

```bash
git add docs/design/sonny-front-door-evidence
git commit -m "test(sonny): front-door verification evidence - default landing, light, live smoke"
```

---

## Self-Review

**Spec coverage:**
- Placement/nav/default landing -> Task 1. ✓
- Retire the rail -> Task 2. ✓
- Ask-Sonny home (composer + capability cards, honest states, engine-wired) -> Task 3. ✓
- Light glass-box + conclusion-first dossier + states -> Task 4. ✓
- Delete the mocks, preserve `/api/patent-parsing` dormant, grep-safety gate -> Task 5. ✓
- Upload disabled/"Coming soon" -> Task 3 Step 2 (+ Global Constraints). ✓
- Verification (build/tests, engine-untouched proof, live smoke, Playwright) -> Task 6. ✓
- Non-goals (dossiers library, drawer, feed, watchlist, live upload skill, tile persistence) -> not tasked (deferred to SP3), consistent with the spec. ✓

**Placeholder scan:** UI build tasks (3, 4) intentionally build to the mock + design doc rather than transcribing full component code - that is the honest shape of a designed-view build (the mock is the source of truth), with exact interfaces (the `useDeepResearchStream` signature) and concrete acceptance given. Seam/deletion tasks (1, 2, 5) carry exact edits, line numbers, and grep gates. No TBD/TODO.

**Type/name consistency:** `useDeepResearchStream` surface (`traceStore`/`status`/`runId`/`error`/`start(target, mode?)`/`hydrate(runId)`) is quoted from the file and referenced identically in Tasks 3-4. `ViewState` id `'research'` is preserved (label-only rename). The seam component keeps its default export so `App.tsx` needs no import change in Tasks 3-4.

**Note on TDD:** This is a presentation rebuild with no new logic; the engine/store tests already exist and must stay green (they are the grounding contract). The discipline here is "existing suite green + build clean + live smoke + Playwright visual/default-landing acceptance," not new unit tests - adding logic tests would invent behavior that does not exist.
