# Minimal Sonny Shell + Persona/Tile/Workspace Excision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely excise the persona, tile, and workspace subsystems and land the minimal four-item Sonny sidebar, leaving a clean Sonny-centric shell.

**Architecture:** This is overwhelmingly deletion, ordered leaves-before-roots so `npm run build` (tsc) stays green after every task and catches any dangling import. Dead clusters go first, then the retired UI surfaces (with their App.tsx render branches), then the tile/workspace data layer + export paths, then the persona excision + surgical decoupling of the two surviving consumers (`App.tsx`, `IntelligenceFeed`), then the minimal sidebar + reduced `ViewState`. Every deletion is preceded by a reference-safety grep (relative AND absolute import forms).

**Tech Stack:** React 19, Vite 7, Tailwind 3.4, TypeScript, Vitest 4, Playwright (MCP).

**Spec:** `docs/superpowers/specs/2026-07-03-minimal-shell-excision-design.md`
**New visual reference:** `~/Downloads/Sonny-Dashboard-Home.html` etc. (minimal sidebar).

## Global Constraints

- **Sonny persistence + engine UNTOUCHED.** No task modifies any file under `src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, `src/components/research/*`, `src/components/dossiers/*`, or `server/`. Final verification asserts this via `git diff`.
- **Build stays green per task.** Each task ends with `npm run build` clean. Because `App.tsx` imports/renders the deleted surfaces, a deletion task MUST also remove the corresponding `App.tsx` imports/render branches in the SAME task. tsc is the dangling-import backstop.
- **Grep-gated deletion.** Before deleting a file, grep for surviving importers OUTSIDE the deletion set, in BOTH relative (`./x`, `../x`) and absolute/alias forms. SP2 lesson: `DynamicTile` imported `./patent/...` which a `components/patent` grep missed. If a surviving file imports a deletion target, resolve it (strip or move) before removing.
- **Delete tests with their subject.** A test whose subject (a deleted store/component) is removed is removed too. Do NOT keep a test asserting deleted behavior, and do NOT edit an unrelated test to pass. The research/dossier/briefingStore tests must stay green untouched.
- **Accepted functional losses (per spec):** the feed loses persona-tailored implication sentences (single Sonny voice) and workspace-flagging; tile export is removed. These are intended, not regressions.
- **No backend contract change.** The `/api/intelligence/*` and `/api/patent-parsing` routes are unchanged; only the client stops varying the digest persona and stops rendering the patent panel.
- **Commit style:** plain hyphens, no agent co-author line. Stage only a task's files via explicit `git add` (never `git add -A`; use `git rm`/`git add <dir>` scoped to `src/`).

---

### Task 1: Delete the dead clusters

**Files (delete):** `src/lib/orchestrationEngine.ts`, `src/lib/sonnyPrompts.ts`, `src/lib/agentPrompts.ts`, `src/lib/agents/` (whole dir incl. `targetBiologyAgent.ts`), `src/hooks/useOrchestrationTiles.ts`, `src/lib/professionalExport.ts`, `src/lib/intelligence/sonnyIntelligencePrompts.ts`.

**Context:** `orchestrationEngine` has zero surviving importers (verified), and it is the only importer of `sonnyPrompts`/`agentPrompts`/`targetBiologyAgent`; `useOrchestrationTiles`, `professionalExport`, `sonnyIntelligencePrompts` are likewise orphaned. These carry the bulk of persona references in `lib/`.

- [ ] **Step 1: Confirm the cluster is dead**

Run: `grep -rn --include='*.ts' --include='*.tsx' "orchestrationEngine\|sonnyPrompts\|agentPrompts\|useOrchestrationTiles\|professionalExport\|sonnyIntelligencePrompts\|lib/agents/\|targetBiologyAgent" src | grep -vE "src/lib/orchestrationEngine|src/lib/sonnyPrompts|src/lib/agentPrompts|src/lib/agents/|src/hooks/useOrchestrationTiles|src/lib/professionalExport|src/lib/intelligence/sonnyIntelligencePrompts"`
Expected: no matches (nothing surviving imports the cluster). If a match appears, resolve it before deleting.

- [ ] **Step 2: Delete**

```bash
git rm src/lib/orchestrationEngine.ts src/lib/sonnyPrompts.ts src/lib/agentPrompts.ts src/hooks/useOrchestrationTiles.ts src/lib/professionalExport.ts src/lib/intelligence/sonnyIntelligencePrompts.ts
git rm -r src/lib/agents
```

- [ ] **Step 3: Build + tests**

Run: `npm run build` (clean) and `npx vitest run` (green; delete any test file whose subject was just removed, in the same commit).

- [ ] **Step 4: Commit**

```bash
git add -A src/lib src/hooks
git commit -m "chore(excise): delete dead orchestration/prompt/agent cluster"
```

---

### Task 2: Delete the persona dashboards + workspaces/recent views

**Files:**
- Delete: `src/components/ScientistDashboard.tsx`, `src/components/ScoutDashboard.tsx`, `src/components/EmptyStateDashboard.tsx`, `src/components/views/Workspaces.tsx`, `src/components/views/Recent.tsx`.
- Modify: `src/App.tsx` (remove their imports + the `dashboard`/`workspaces`/`history` render branches).

**Context:** `App.tsx` renders these at `currentView === 'dashboard'|'workspaces'|'history'` (dashboard switches on persona between Scientist/Scout, ~lines 455-478). Remove the branches and imports so the build has no dangling reference. The `ViewState` union still contains those literals after this task (removed in Task 5); that is fine - unused literals do not break the build.

- [ ] **Step 1: Reference check**

Run: `grep -rn --include='*.tsx' --include='*.ts' "ScientistDashboard\|ScoutDashboard\|EmptyStateDashboard\|views/Workspaces\|views/Recent" src | grep -vE "ScientistDashboard.tsx|ScoutDashboard.tsx|EmptyStateDashboard.tsx|views/Workspaces.tsx|views/Recent.tsx"`
Expected: only `src/App.tsx` (and possibly `Sidebar.tsx` nav labels, handled in Task 5). Resolve any other.

- [ ] **Step 2: Remove App.tsx render branches + imports**

In `src/App.tsx`: delete the imports (`ScientistDashboard` line 5, `ScoutDashboard` line 6), and delete the three render branches: `currentView === 'dashboard'` block (~455-467, including the `activePersona === Persona.SCIENTIST ? <ScientistDashboard/> : <ScoutDashboard/>` switch), `currentView === 'workspaces'` (~471), `currentView === 'history'` (~477). Leave the `research`/`feed`/`dossiers` branches intact.

- [ ] **Step 3: Delete the view files**

```bash
git rm src/components/ScientistDashboard.tsx src/components/ScoutDashboard.tsx src/components/EmptyStateDashboard.tsx src/components/views/Workspaces.tsx src/components/views/Recent.tsx
```

- [ ] **Step 4: Build + tests**

Run: `npm run build` (clean) and `npx vitest run` (green; delete any orphaned test).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components
git commit -m "feat(excise): remove persona dashboards and workspaces/recent views"
```

---

### Task 3: Delete the tile/workspace subsystem

**Files:**
- Delete: `src/components/DynamicTile.tsx`, `src/components/Tile.tsx`, `src/components/tiles/` (all), `src/components/CreateTileModal.tsx`, `src/components/shared/WorkspaceSaveModal.tsx`, `src/components/shared/AgentWalkthrough.tsx` (imported only by tile templates, now deleted), `src/components/patent/PatentFullAnalysisPanel.tsx` (orphaned once `DynamicTile` is gone; then `src/components/patent/` is empty - remove it), `src/lib/tiles/` (all), `src/lib/workspaces/` (all).
- Modify: `src/App.tsx` (remove tile/workspace state, effects, `handleExport`, `reportExport` tile import), and resolve `src/components/SettingsModal.tsx`, `src/components/shared/ExportButton.tsx`, `src/lib/reportExport.ts`, `src/lib/pdfExport.ts` per grep (strip tile paths or delete if orphaned).

**Context:** This is the deletion-heavy core. `App.tsx` threads tile/workspace stores through many effects and `handleExport` (the tile export - "Create a few tiles first"). `SettingsModal` imports the tile/workspace stores; `ExportButton` imports `reportExport`/`pdfExport`. Resolve each surviving consumer by grep: if a file is imported only by already-deleted code, delete it; otherwise strip the tile/workspace/reportExport usage.

- [ ] **Step 1: Grep the full tile/workspace consumer set**

Run: `grep -rn --include='*.tsx' --include='*.ts' "useTileStore\|useWorkspaceStore\|lib/tiles\|lib/workspaces\|DynamicTile\|CreateTileModal\|WorkspaceSaveModal\|AgentWalkthrough\|PatentFullAnalysisPanel\|buildTilesMarkdownReport" src | grep -vE "src/lib/tiles/|src/lib/workspaces/|src/components/tiles/|DynamicTile.tsx|Tile.tsx|CreateTileModal.tsx|WorkspaceSaveModal.tsx|AgentWalkthrough.tsx|PatentFullAnalysisPanel.tsx"`
Expected surviving consumers: `src/App.tsx`, `src/components/SettingsModal.tsx`, `src/components/shared/ExportButton.tsx`, `src/components/views/IntelligenceFeed.tsx` (feed's workspace flagging - decoupled in Task 4), and possibly `Header.tsx`. This list is the work.

- [ ] **Step 2: Resolve SettingsModal + ExportButton (delete-if-orphaned)**

For `src/components/shared/ExportButton.tsx`: grep `grep -rn "ExportButton" src --include='*.tsx' | grep -v ExportButton.tsx`. If its only importers are deleted components (patent panel, tiles), `git rm` it. Otherwise strip its tile/report usage.
For `src/components/SettingsModal.tsx`: grep `grep -rn "SettingsModal" src --include='*.tsx' | grep -v SettingsModal.tsx`. It imports the tile/workspace stores. If SettingsModal is still reachable from the surviving `Header`/`Sidebar`, strip the tile/workspace store usage (remove the addTile/updateTile/tiles/workspace reads and any tile/workspace UI section); if it is only opened from deleted surfaces, `git rm` it. (The minimal-shell directive removes settings clutter, so deletion is acceptable if it is not a surviving entry point.)

- [ ] **Step 3: Strip App.tsx tile/workspace/export**

In `src/App.tsx` remove: imports `useWorkspaceStore` (24), `useTileStore` (25), `buildTilesMarkdownReport, exportMarkdownReport` (26); all `useTileStore.getState()` / `useWorkspaceStore.getState()` / `useTileStore(...)` / `useWorkspaceStore(...)` reads and the effects that only manage tile/workspace active-state (the blocks around lines 92-124, 151-169, 254-256, 367-392); the `handleExport` function (309-345) and the `onExport={handleExport}` props passed to `Header` (439) and any footer (505). If removing `handleExport` leaves a Header/child prop unfilled, make that prop optional and remove the control in Task 4/5. Keep the `research`/`feed`/`dossiers` rendering and any non-tile session logic. The landing/lobby `sessionStorage('lumina-has-selected-target')` logic is persona/landing-bound and is handled in Task 4 - in this task only remove the tile/workspace store calls interleaved in those effects, leaving the landing flow otherwise intact so the build stays green.

- [ ] **Step 4: Strip or delete reportExport/pdfExport**

`src/lib/reportExport.ts`: remove `buildTilesMarkdownReport` and any tile/persona-only exports. Then grep its remaining importers; if none survive, `git rm` it (and `pdfExport.ts` likewise). If a surviving file (e.g. a kept ExportButton) still uses a non-tile export, keep only that.

- [ ] **Step 5: Delete the components + data layer**

```bash
git rm src/components/DynamicTile.tsx src/components/Tile.tsx src/components/CreateTileModal.tsx src/components/shared/WorkspaceSaveModal.tsx src/components/shared/AgentWalkthrough.tsx src/components/patent/PatentFullAnalysisPanel.tsx
git rm -r src/components/tiles src/lib/tiles src/lib/workspaces
```
Then remove the now-empty `src/components/patent/` if git leaves it, and any file resolved for deletion in Steps 2/4.

- [ ] **Step 6: Build + tests**

Run: `npm run build` (clean - tsc surfaces any missed reference; resolve it) and `npx vitest run` (green; delete tile/workspace test files with their subjects).

- [ ] **Step 7: Commit**

```bash
git add -A src
git commit -m "feat(excise): remove tile/workspace subsystem, tile export, and orphaned panels"
```

---

### Task 4: Excise the persona system + decouple the feed

**Files:**
- Delete: `src/contexts/PersonaContext.tsx`.
- Modify: `src/types/index.ts` (remove `Persona`), `src/constants/index.ts` (persona entries), `src/App.tsx` (PersonaProvider, activePersona, theme effect, landing persona-picking), `src/components/views/IntelligenceFeed.tsx` (persona + workspace decouple), `src/components/Header.tsx` (persona/export/viewMode/onReplayLanding dangling props), `src/components/LandingAnimation.tsx` (persona-picking).

**Context:** After Tasks 1-3, persona survives only in `App.tsx`, `IntelligenceFeed`, `Header`, `LandingAnimation`, `PersonaContext`, `types`, `constants`. Remove it all. The primary color is already blue; make it static.

- [ ] **Step 1: App.tsx persona + theme + landing**

In `src/App.tsx`: remove `import LandingAnimation` (18) only if the landing flow is retired (decide below), `import { PersonaProvider }` (19), `Persona` from the `./types` import (22), the `activePersona` state (52), the theme-switching effect (139-147) - since primary is already blue, delete the effect and instead ensure `src/index.css` `:root` sets `--color-primary: 29 78 216` statically (Task from SP1 already did this; confirm and keep). Remove the `<PersonaProvider ...>` wrapper (421, 518) and the `activePersona`/`onPersonaChange`/`persona` props passed to `Sidebar` (426-427) and `Header` (437). The landing/lobby flow (`showLandingAnimation`, `lumina-has-selected-target`, `replayLandingAnimation`, the `setActivePersona` calls at 222/226) is persona-bound: **retire the landing gate** - the app lands directly on `research`. Remove `showLandingAnimation` state + the `if (showLandingAnimation) return <LandingAnimation.../>` block (411-419) + `replayLandingAnimation` + `onReplayLanding` prop, and delete `src/components/LandingAnimation.tsx`. Keep any generic non-persona init. Build must stay green.

- [ ] **Step 2: IntelligenceFeed decouple**

In `src/components/views/IntelligenceFeed.tsx`: remove `import { usePersona }` (31) and `import { useWorkspaceStore }` (34); remove the `const { activePersona } = usePersona()` and `personaKey` derivation (556-559); collapse `buildImplicationSentence(kind, persona)` (305-...) to a single Sonny-voice implementation that ignores persona (keep the general/scientist phrasing as the one voice, drop the SCIENTIST/SCOUT/VC branches); where the digest API is called with `persona: personaKey` (1129) send a fixed `'GENERAL'` (do not change the backend); remove the workspace-store reads (601-605) and the "flag to workspace" affordance/handlers that use them. The feed must still build, fetch, and render its items.

- [ ] **Step 3: Header + delete PersonaContext/type/constants**

In `src/components/Header.tsx`: remove any now-unpassed `persona`/`onPersonaChange`/`viewMode`/`onExport`/`onReplayLanding` props (make optional/remove) and the controls that used them (persona display, export button, replay). Keep search and other surviving features.
Then:
```bash
git rm src/contexts/PersonaContext.tsx
```
In `src/types/index.ts` remove the `Persona` enum/type. In `src/constants/index.ts` remove persona constants (keep the rest).

- [ ] **Step 4: Reference-clean + build + tests**

Run: `grep -rn --include='*.tsx' --include='*.ts' "Persona\|usePersona\|activePersona\|PersonaProvider\|scientist-theme\|scout-theme\|LandingAnimation" src` -> expected no matches (outside comments).
Run: `npm run build` (clean) and `npx vitest run` (green; delete persona test files with their subject).

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat(excise): remove persona system; single Sonny voice in the feed; retire landing gate"
```

---

### Task 5: Minimal sidebar + reduced ViewState + Watchlist placeholder

**Files:**
- Modify: `src/types/index.ts` (ViewState), `src/App.tsx` (render branches + default + watchlist), `src/components/Sidebar.tsx` (minimal rebuild).
- Create: `src/components/watchlist/WatchlistView.tsx` (placeholder).

**Interfaces:**
- Produces: `ViewState = 'research' | 'feed' | 'dossiers' | 'watchlist'`; a minimal `Sidebar`; a `WatchlistView` placeholder.

**Context:** Build the sidebar to the minimal design in `~/Downloads/Sonny-Dashboard-Home.html` (wordmark + Ask Sonny/Feed/Dossiers/Watchlist + Engine-online). The live watched-target list + real badges are piece B; here nav items need no live badges.

- [ ] **Step 1: Reduce ViewState**

In `src/types/index.ts` set: `export type ViewState = 'research' | 'feed' | 'dossiers' | 'watchlist';`.

- [ ] **Step 2: Watchlist placeholder view**

Create `src/components/watchlist/WatchlistView.tsx` - a composed "coming soon" per the design doc empty-state language (Newsreader heading "Watchlist", a line "Monitor targets and catalysts - coming soon", light tokens). Default export.

- [ ] **Step 3: App.tsx render + default**

In `src/App.tsx`: ensure `currentView` default is `'research'`; render `research` -> `SonnyResearchDashboard`, `feed` -> `IntelligenceFeed`, `dossiers` -> `DossiersLibrary`, `watchlist` -> `WatchlistView` (add the import + branch). Remove any leftover `viewMode`/dashboard props.

- [ ] **Step 4: Minimal Sidebar rebuild**

Rebuild `src/components/Sidebar.tsx` to the minimal mock: Sonny wordmark (`font-display`) at top; a nav list of exactly four items - Ask Sonny (`research`, Sparkles), Feed (`feed`, Bell), Dossiers (`dossiers`, Library), Watchlist (`watchlist`, an Eye/Bookmark icon) - each with active-state (`bg-primary/10`) + `.tactile`; an "Engine online" status pill at the bottom (a green dot + "Engine online"). Remove the persona switcher, the recent-workspaces list, and the settings/user footer. Keep collapse behavior only if trivial; otherwise a fixed minimal rail is fine. No live badges (piece B).

- [ ] **Step 5: Build + tests + manual**

Run: `npm run build` (clean) and `npx vitest run` (green).
`npm run dev`: the app lands on Ask Sonny; the sidebar shows exactly the 4 items + Engine-online; each nav item switches views; Watchlist shows the placeholder.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/App.tsx src/components/Sidebar.tsx src/components/watchlist/WatchlistView.tsx
git commit -m "feat(shell): minimal four-item Sonny sidebar, reduced ViewState, watchlist placeholder"
```

---

### Task 6: Verification - reference-clean + minimal-shell audit

**Files:** No source changes (fixes loop back). Create: `docs/design/minimal-shell-evidence/` (screenshots).

- [ ] **Step 1: Build, tests, reference-clean, persistence-untouched proofs**

Run: `npm run build` (clean) and `npx vitest run` (green).
Run: `grep -rn --include='*.tsx' --include='*.ts' "Persona\|useTileStore\|useWorkspaceStore\|DynamicTile\|orchestrationEngine\|ScientistDashboard\|ScoutDashboard\|PatentFullAnalysisPanel\|LandingAnimation" src` -> expected: no matches (outside comments).
Run: `git diff --name-only feat/dossiers-library..HEAD | grep -E "src/lib/research/|src/hooks/useDeepResearchStream|src/components/research/|src/components/dossiers/|^server/"` -> expected: **no output** (Sonny persistence/engine + dossiers untouched).

- [ ] **Step 2: Fresh server + fresh browser context**

`pkill -f vite; rm -rf node_modules/.vite; npm run dev`. In Playwright MCP call `browser_close` first, then navigate fresh to `http://localhost:5173` (set `sessionStorage['lumina-has-selected-target']='true'` if any gate remains, then reload).

- [ ] **Step 3: Audit**

At 1440x900 (and spot-check 768/375):
- The app lands on **Ask Sonny** (research) by default - no landing animation, no persona picker.
- The sidebar shows **exactly** four nav items (Ask Sonny / Feed / Dossiers / Watchlist) + "Engine online" - no persona switcher, no Dashboard/Workspaces/Recent, no settings/user footer.
- Click each: Feed renders its items (persona-free, still fetching), Dossiers renders (seed a dossier if needed), Watchlist shows the placeholder, Ask Sonny shows the composer.
- 0 real JS console errors (ignore backend 500s).
- Screenshots -> `docs/design/minimal-shell-evidence/shell-1440.png`, `feed-1440.png`, `watchlist-1440.png`.

- [ ] **Step 4: Punch-list + fix**, then commit evidence:

```bash
git add docs/design/minimal-shell-evidence
git commit -m "test(shell): minimal-shell verification evidence"
```

---

## Self-Review

**Spec coverage:** dead clusters -> T1; retired surfaces -> T2; tile/workspace data layer + export -> T3; persona excision + feed decouple + landing retire -> T4; minimal sidebar + ViewState + watchlist placeholder -> T5; verification (reference-clean + persistence-untouched + Playwright) -> T6. Functional losses (persona-tailoring, workspace-flag, tile export) -> T3/T4 per spec. ✓

**Placeholder scan:** the deletion tasks are intentionally grep-gated discovery (the honest shape of a large entangled excision, per the SP2 Task 5 precedent) with exact known deletion sets, exact App.tsx line references, and tsc as the backstop - not vague "handle references". The delete-vs-strip calls (SettingsModal, ExportButton, reportExport, pdfExport) are resolved by a concrete grep rule, not left open. No TBD.

**Type/name consistency:** `ViewState` is reduced once (T5) after all `dashboard`/`workspaces`/`history` branches are removed (T2); `WatchlistView` default export consumed in App (T5); the `--color-primary` static-blue is confirmed in `index.css` (T4). Ordering keeps the build green: leaves (dead clusters) before roots (App.tsx/persona/sidebar).

**Note on TDD:** This piece adds no logic - it removes subsystems. There is nothing to unit-test into existence; the discipline is build-green-per-task + delete-tests-with-subject + reference-clean grep + Playwright shell audit. That is the correct strategy for a deletion; writing new tests would assert behavior that no longer exists.
