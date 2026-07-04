# Sub-project 3-Shell: Minimal Sonny Shell + Complete Persona/Tile/Workspace Excision - Design Spec

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**New visual reference (adopt):** `~/Downloads/Sonny-Dashboard-Home.html`, `Sonny-Feed.html`, `Sonny-Dossiers.html`, `Sonny-Dossier-Drilldown.html`, `Sonny-States.html`
**Builds on:** SP3a (Dossiers library, PR #6). Branches off `feat/dossiers-library`.

## Why this

The redesign is committing fully to a Sonny-centric, minimal model. The new mockups keep the same locked design system (Geist/Newsreader/blue, grain/glass) but replace the shell with a minimal sidebar - Sonny wordmark, four nav items (Ask Sonny / Feed / Dossiers / Watchlist), a live watched-target list, and an "Engine online" status. No personas, no dashboards, no workspaces, no settings/user clutter.

The user directive: retire the Scout/Scientist views (useless now that the right rail is gone), strip the sidebar to minimal, and complete the excision fully (not deferred): remove the persona, tile, and workspace subsystems entirely.

This is the first of the design-refresh sub-projects: **SP3-Shell (this) -> B Watchlist -> C Feed adoption -> D Home/Dossiers/Drilldown/States refinements.**

## Goal

Land the minimal Sonny shell and completely excise the persona, tile, and workspace subsystems from the codebase - deleting the dead surfaces and clusters, and surgically decoupling the two surviving consumers (`App.tsx`, `IntelligenceFeed.tsx`). After this, the app has a four-item sidebar, no persona/tile/workspace code, and every surviving view still renders.

This is overwhelmingly deletion. It touches no research engine or persistence for Sonny (dossiers/briefingStore untouched).

## Locked decisions (from brainstorming)

1. **Retire personas** (Scientist/Scout): the switcher, both dashboards, `EmptyStateDashboard`, and the `dashboard` view.
2. **Retire the tile + workspace subsystem** entirely (stores, components, the `workspaces` and `history`/Recent views).
3. **Complete excision** (not deferred): remove the `Persona` type, `PersonaContext`, and all persona threading, including from the surviving `IntelligenceFeed` and `lib/` files.
4. **Minimal sidebar**: wordmark + Ask Sonny / Feed / Dossiers / Watchlist + "Engine online". `ViewState = research | feed | dossiers | watchlist`, default `research`.
5. **Watchlist** nav item routes to a placeholder view in this piece; the real Watchlist feature + the sidebar's live watched-target list are **piece B** (deferred here).
6. **Accepted functional losses** (aligned with the single-Sonny model): the feed loses persona-tailored implication sentences (collapses to one Sonny voice) and the "flag to workspace" action; tile export (`handleExport`, "Create a few tiles first") is removed.

## Section 1 - Delete the retired surfaces

**Delete (UI):**
- `src/components/ScientistDashboard.tsx`, `ScoutDashboard.tsx`, `EmptyStateDashboard.tsx`.
- `src/components/views/Workspaces.tsx`, `src/components/views/Recent.tsx`.
- `src/components/DynamicTile.tsx`, `src/components/Tile.tsx`, `src/components/tiles/` (all), `src/components/CreateTileModal.tsx`, `src/components/shared/WorkspaceSaveModal.tsx`, `src/components/shared/AgentWalkthrough.tsx` (dashboard/tile walkthrough - confirm no surviving import), `src/components/patent/PatentFullAnalysisPanel.tsx` (orphaned once `DynamicTile` is gone; the last patent UI file - `patent/` becomes empty and is removed).

## Section 2 - Delete the dead clusters + data layer

**Dead clusters (verified zero surviving importers - `orchestrationEngine` is the hub and is dead):**
- `src/lib/orchestrationEngine.ts`, `src/lib/sonnyPrompts.ts`, `src/lib/agentPrompts.ts`, `src/lib/agents/` (incl. `targetBiologyAgent.ts`), `src/hooks/useOrchestrationTiles.ts`, `src/lib/professionalExport.ts`, `src/lib/intelligence/sonnyIntelligencePrompts.ts`.

**Tile/workspace data layer:**
- `src/lib/tiles/` (store, templates, extractors, recentStorage, types), `src/lib/workspaces/` (store).

**Report-export tile paths:**
- `src/lib/reportExport.ts` - remove the tile-report functions (`buildTilesMarkdownReport`, etc.) and any persona usage; if nothing surviving imports the remainder, delete the file. `src/lib/pdfExport.ts` - same treatment (strip tile/persona; delete if orphaned). The plan resolves delete-vs-strip per file by a reference grep + the build backstop.

**Deletion safety:** every deletion is gated - grep for surviving importers outside the deletion set BEFORE removing a file (relative AND absolute import forms; the SP2 lesson: `DynamicTile` imported `./patent/...` which a `components/patent` grep missed). `npm run build` (tsc) is the backstop for any dangling import.

## Section 3 - Excise the persona system

**Delete:** `src/contexts/PersonaContext.tsx`; the `Persona` type/enum in `src/types/index.ts`; persona entries in `src/constants/index.ts` (keep non-persona constants).

**Edit surviving consumers:**
- `src/App.tsx`: remove the `PersonaContext` provider/usage, the `activePersona` state and the `--color-primary`/`scientist-theme`/`scout-theme` theme-switching effect (primary is already blue - set the CSS var to blue `29 78 216` once, statically, in `index.css`/root, and drop the effect), the tile/workspace state + effects, `handleExport` + its `reportExport` tile import, and the `dashboard`/`workspaces`/`history` render branches. Remove the landing/lobby target-selection flow ONLY if it is persona/dashboard-bound; if it is a generic first-run gate, keep it but ensure it lands on `research`. (The plan determines this from the code.)
- `src/components/views/IntelligenceFeed.tsx`: remove `usePersona` and `useWorkspaceStore`; collapse `buildImplicationSentence(kind, persona)` to a single Sonny voice (one phrasing, no Scientist/Scout/VC branch); call the digest API with a fixed persona value (e.g. `'GENERAL'`) or drop the param if the backend tolerates it (keep the backend route unchanged - only the client stops varying it); remove the "flag to workspace" affordance and the workspace-store reads. The feed keeps working on its live `/api/intelligence/*` routes; it just no longer personalizes.
- `src/components/Header.tsx`, `src/components/SettingsModal.tsx`: remove any persona/tile/workspace props or controls left dangling (e.g. a persona display, a settings toggle for personas). Keep unrelated functionality.

## Section 4 - Rebuild the minimal sidebar

**Files:** `src/components/Sidebar.tsx`, `src/types/index.ts` (ViewState), `src/App.tsx` (render branches + default).

- `ViewState` becomes `'research' | 'feed' | 'dossiers' | 'watchlist'`; default `'research'`. Remove `dashboard`/`workspaces`/`history`.
- Rebuild `Sidebar` to the new minimal design (build to the sidebar in `Sonny-*` mocks): Sonny wordmark (Newsreader) at top; nav = **Ask Sonny** (research), **Feed**, **Dossiers**, **Watchlist**, each with the active-state + `.tactile` treatment and (where real) a count badge; an "Engine online" status pill at the bottom. Remove the persona switcher, the recent-workspaces list, and the settings/user footer clutter (keep only what the minimal mock shows). The live watched-target list and real count badges are **piece B**; here the nav items may show static/no badges.
- `App.tsx`: render `research` (SonnyResearchDashboard), `feed` (IntelligenceFeed), `dossiers` (DossiersLibrary), and a new `watchlist` placeholder view (`src/components/watchlist/WatchlistView.tsx` - a composed "coming soon" per the design doc's empty-state language). Default landing stays `research`.

## Non-goals (deferred)

- **Watchlist feature** (real watched-target data, catalysts, the sidebar target list) - piece B.
- **Feed visual adoption** to `Sonny-Feed.html` - piece C. (This piece only DECOUPLES the feed from persona/tiles; it does not re-skin it.)
- **Home / Dossiers / Drilldown / States** refinement to the new mocks - piece D (they already match the same system from SP2/SP3a).
- Any change to the research engine, `briefingStore`, dossiers, or the `/api/intelligence/*` and `/api/patent-parsing` backend routes (patent route stays dormant; its last client `PatentFullAnalysisPanel` is deleted here).

## Error handling / edge cases

- **Digest API persona param:** the client sends a fixed value; do not change the backend contract. If the backend requires a persona, `'GENERAL'` is sent; if optional, it may be omitted - verify against the route, do not break the call.
- **Landing/first-run gate:** whatever survives must land on `research` and not reference a deleted persona/dashboard.
- **localStorage keys** for tiles/workspaces/persona are simply abandoned (no migration needed); no crash on old data because the reading code is deleted.

## Verification / success criteria

1. `npm run build` clean (tsc catches every dangling import); `npx vitest run` green. Any test that referenced deleted tile/workspace/persona code is deleted WITH its subject (a test whose subject is removed is removed; do not keep a test asserting deleted behavior). The research/dossier/briefingStore tests must stay green untouched.
2. **No surviving reference** to deleted modules: `grep -rn` for `Persona`, `useTileStore`, `useWorkspaceStore`, `DynamicTile`, `orchestrationEngine`, `ScientistDashboard`, `ScoutDashboard`, `PatentFullAnalysisPanel` across `src` returns nothing (outside comments).
3. **Sonny persistence untouched:** `git diff` touches no file under `src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, `src/components/research/*`, `src/components/dossiers/*`, or `server/`.
4. **Playwright (fresh browser context):** default lands on Ask Sonny; the sidebar shows exactly the 4 items + Engine-online (no persona switcher, no Dashboard/Workspaces/Recent); Feed, Dossiers, and the Watchlist placeholder each render light with 0 real console errors; the feed still lists items (persona-free). Screenshots as evidence.

## File / task boundaries (for the plan)

- **Task 1:** delete the dead clusters (`orchestrationEngine` + prompts + agents + useOrchestrationTiles + professionalExport + sonnyIntelligencePrompts) - grep-gated; build stays green.
- **Task 2:** delete the retired UI surfaces (dashboards, EmptyStateDashboard, Workspaces, Recent, DynamicTile/Tile/tiles, CreateTileModal, WorkspaceSaveModal, AgentWalkthrough, PatentFullAnalysisPanel) + remove their App.tsx render branches - grep-gated.
- **Task 3:** delete the tile/workspace data layer (`lib/tiles`, `lib/workspaces`) + strip `reportExport`/`pdfExport` tile paths (delete if orphaned) + remove App.tsx `handleExport`/tile-workspace state.
- **Task 4:** excise persona - delete `PersonaContext`/`Persona` type/constants; decouple `App.tsx` (theme effect -> static blue) and `IntelligenceFeed.tsx` (single Sonny voice, fixed digest persona, drop workspace flagging) and `Header`/`SettingsModal` dangles.
- **Task 5:** minimal sidebar rebuild + `ViewState` reduction + `watchlist` placeholder view + default `research`.
- **Task 6:** verification - build/tests, reference-clean grep, Sonny-persistence-untouched proof, fresh-context Playwright with screenshots.

Each task ends with a green build and an independently reviewable diff. Tasks 1-3 are deletion-heavy and ordered so the build stays green at each step (delete leaves before roots).

---

*First of the design-refresh sub-projects (SP3-Shell). Next: `writing-plans`, then subagent-driven-development on `feat/minimal-shell-excision` (cut from `feat/dossiers-library`).*
