# Sub-project 2: Unified Ask-Sonny Front Door - Design Spec

**Date:** 2026-07-03
**Status:** Approved (design), pending implementation plan
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`
**Visual reference:** `docs/design/sonny-home-mock.html`
**Builds on:** sub-project 1 (LUMINA relight, PR #4) - this work branches off the relight so it is born light.

## Why this, and why now

The LUMINA redesign (take the app light + collapse the multi-agent orchestration into unified "one Sonny, many skills") is three sub-projects: (1) relight + shell [done], (2) unified Sonny front door [this spec], (3) relight the surviving heavy views.

Sub-project 1 was a skin swap: the app is now light but structurally unchanged - the same dashboard, the same right-side `SonnySidePanel` with its 6-agent selector.
Sub-project 2 is where the app becomes the new product: one Ask-Sonny home replaces the multi-agent rail.

The interaction/product risk lives here (does one composer plus a live glass-box beat the six-agent rail), and it is now built directly on the real light skin rather than a throwaway theme.

## The decisive finding that shapes this spec

The six specialist panels (patent / clinical / market / financial / target-biology / regulatory, V1 and V2) are non-functional mock shells.
Their "hero skill" buttons POST to endpoints that do not exist (`/api/agents/patent-expert`, `/api/agents/clinical-analyst`, ...).
So collapsing the six-agent rail into unified Sonny removes dead UI, not working features.

What is actually live end-to-end today:
- **Deep Research** - the Sonny engine via `POST /api/agents/deep-research` (SSE stream -> trace -> grounded briefing). This is the real capability the home is built on.
- **Patent parsing** - `POST /api/patent-parsing` (upload PDF -> extract claims/antibodies). Live but separate; its UI is being deleted while the server route is preserved dormant (see Deletions).

Everything else specialist-related is a UI-only shell.

## Goal

Replace the dark Phase 2 research UI and the six-agent right rail with one light, full-view **Ask-Sonny home** - the app's default landing - built on the unchanged deep-research engine.
Delete the dead multi-agent UI.
Keep every figure grounded to a real evidence id by reusing the Phase 2 engine layer verbatim.

## Locked decisions (from brainstorming)

1. Sonny becomes a first-class **full center-stage view**; the right-side `SonnySidePanel` rail is **retired**.
2. Sonny is the app's **default landing view**.
3. **Delete the mock specialist UIs** and the multi-agent orchestration UI.
4. **Patent = option A**: delete the patent UI, keep the `POST /api/patent-parsing` server route dormant (untouched, unreferenced), show Patent as a "Coming soon" capability card. The real patent skill lands later from the `Sonny-patent` worktree and gets wired in then.
5. **SP2 scope = the Ask-Sonny home only** (composer + capability cards + live glass-box + inline conclusion-first dossier). The Dossiers library, dossier drill-in drawer, Feed redesign, and watchlist are **deferred to SP3**.

## Section 1 - Placement, nav, default landing

**Files:** `src/App.tsx`, `src/components/Sidebar.tsx`, `src/types/index.ts` (no type change needed - `research` already exists in `ViewState`).

- The Ask-Sonny home mounts where the `research` view mounts today: `App.tsx` renders it when `currentView === 'research'` (currently `SonnyResearchDashboard`, ~line 543-547).
  The new light home component replaces `SonnyResearchDashboard` at that seam.
- **Default landing:** `App.tsx:53` `useState<ViewState>('dashboard')` -> `'research'`.
- **Sidebar nav:** `Sidebar.tsx:347` `{ id: 'research', icon: Microscope, label: 'Research' }` -> label `'Sonny'` (keep or swap the icon to a Sonny mark).
- **Retire the right rail:** remove the `SonnySidePanel` import and render from `App.tsx` (import ~line 17, render ~line 573-580), and remove its now-dead plumbing in `App.tsx`: `sonnyPanelCollapsed` / `sonnyPanelWidth` state and their localStorage effects, the `padding-right` reservation for the panel, and the panel-toggle keyboard shortcut (`Cmd+J`) and header toggle wiring.
  The other nav items (Dashboard, Workspaces, Recent, Feed) remain (relit), just no longer the default.

`ViewState` keeps the literal `'research'` as the internal id for the Sonny view to minimize churn; only the user-facing label becomes "Sonny".
(A later cleanup can rename the id if desired - out of scope here.)

## Section 2 - Deletions

Delete from the app and repo (UI only):
- `src/components/SonnySidePanel.tsx` and its selector/mode plumbing.
- `src/components/sonny/` (`SonnyHeroInterface.tsx`, `HeroSkillCard`, and the `sonny` barrel) - after salvaging any still-needed pieces (see note).
- `src/components/agents/shared/AgentInterfaceLayout.tsx`, `AgentIconNavigation.tsx`, and the multi-agent orchestration components (`agents/MultiAgentCollaboration.tsx`, `agents/MultiAgentDemo*.tsx`, and siblings under `agents/` that only served the rail).
- All six specialist interface directories, V1 and V2: `src/components/{patent,clinical,market,financial,target-biology,regulatory}/`.

**Preserved, dormant (do NOT delete):**
- The server route `server/api/patent-parsing.ts` and its lib - untouched, and unreferenced by any client after the deletions. Ready for the real patent skill.
- The Phase 2 engine layer (see Section 3) - untouched.
- The tile/workspace stores (`src/lib/tiles/*`, `src/lib/workspaces/*`) and the tile *types* (`TileType` includes specialist type strings) - these reference type strings, not the deleted panel components, so they survive.

**Deletion safety (a plan task, gated):**
Before deleting any file, verify no *surviving* view imports it.
The known consumer of the rail is `App.tsx` (imports `SonnySidePanel`).
The deletion task greps the surviving views (`App.tsx`, `Sidebar.tsx`, the dashboards, `IntelligenceFeed`, `Workspaces`, `Recent`, `Tile`, `tiles/*`, `research/*`) for imports of each deletion target and resolves any reference before removing the file.
`npm run build` (tsc) is the backstop: a dangling import fails the build.

**Salvage note:** if the new home reuses any small primitive currently living under `sonny/` (e.g. a formatting helper), move it into the research/home component tree before deleting the `sonny/` directory, so the deletion leaves no dangling import.

## Section 3 - The Ask-Sonny home and data flow

**New/rebuilt files (presentational):** the four dark Phase 2 components are rebuilt into their light design-doc forms.
- `src/components/research/SonnyResearchDashboard.tsx` -> the full-view Ask-Sonny home (composer + capability cards + runs + dossier), or a new `SonnyHome.tsx` that supersedes it (implementer's call; the seam in `App.tsx` points at whichever is the home).
- `src/components/research/ResearchComposer.tsx` -> light command composer (liquid-glass).
- `src/components/research/GlassBoxTrace.tsx` -> light glass-box trace.
- `src/components/research/ResearchDossier.tsx` -> light conclusion-first dossier.

**Home composition (per `sonny-home-mock.html`), top to bottom:**
- **Command composer** (liquid-glass floating bar): a target/question input that runs deep research. Enter to run. Newsreader wordmark; Geist input.
- **Capability cards**, honestly labeled: **Deep research = Available** (wired to the live engine); **Patent = Coming soon**; **PoS + Indication and the remaining specialists = Coming soon**. Coming-soon cards are visibly inert (no click action, muted, dashed per the design doc).
- **Runs + live glass-box trace:** on submit, the home calls `useDeepResearchStream.start(target, mode)`; the trace renders phases, specialist threads, and counters (papers / evidence / tools) in the light design-doc language, throttled by the existing trace buffer.
- **Conclusion-first dossier** rendered inline when the run completes: verdict pill (GO / WATCH / NO-GO) -> executive read (Newsreader) -> RAG sections with citation superscripts -> KOL terrain -> references (Geist Mono ids), all grounded to real evidence ids.

**Data flow - unchanged and grounded:**
- The home consumes `useDeepResearchStream` exactly as the Phase 2 UI did: `start(target, mode)`, `hydrate(runId)`, `status` (`idle`/`hydrating`/`running`/`done`/`error`), `traceStore`, `runId`, `error`.
- The request contract is unchanged: `POST /api/agents/deep-research` with `{ target, mode }`, SSE events (`run_started`, `trace`, `done` with the full briefing).
- The trace store, briefing store, aggregation reducer, SSE parser, and server route are **NOT modified**.
- SP2 is a presentation rebuild over the same grounded plumbing, so fabricated data is structurally impossible - every figure traces to a real evidence id.

**Mode:** the composer defaults to `mode: 'fast'` and exposes a fast/thorough toggle (the engine already accepts both).
The demo-vs-live gating that lived in the retired panel is **not** carried over in SP2: the home runs against the live engine and, when the backend is unavailable or not ready, surfaces the existing `status==='error'` / readiness message inline (see error handling) rather than offering a demo mode.
A pre-recorded demo path, if wanted for offline showcases, is a later addition, not SP2.

## Section 4 - Upload / skill routing (honesty)

- The composer's **upload affordance is shown but disabled / "Coming soon"** in SP2.
- Reason: no live skill consumes documents yet - `startDeepResearch` takes only `target` + `mode`, and patent extraction is dormant per decision 4.
- Presenting an active upload that routes nowhere would be fabricated capability; instead it is a visible, honest placeholder until a document-consuming skill (patent, from `Sonny-patent`) is wired in a later step.

## Error handling / edge cases

- **Backend not running / not ready:** the home renders the composer and capability cards fine with no backend; a `start()` that fails surfaces the existing `status==='error'` + `error` message inline (the design-doc error state), not a crash. Reuse the Phase 2 error path.
- **Hydrate by runId:** preserve the existing `?runId=` hydrate-on-mount behavior so a shared/opened run rehydrates its dossier.
- **Reduced motion / responsive:** the home honors `prefers-reduced-motion` and renders legibly at 1440 / 768 / 375 (single-column composer/cards on mobile), per the design doc.
- **Empty/loading states:** composed empty state ("ask Sonny a question; the run and its glass-box appear here") and skeleton loaders per the design doc, not bare spinners.

## Non-goals (deferred)

- Dossiers library (browsing/filtering past GO/WATCH/NO-GO dossiers) and the dossier drill-in drawer - SP3.
- Feed redesign and watchlist - SP3 (the feed already exists, relit).
- Wiring patent (or any specialist) as a live skill - later, when the real skill lands from `Sonny-patent`.
- Upload -> skill routing as a working feature - deferred with the skills that consume documents.
- Persisting a run as a "tile"/library entry - the briefing store already persists briefings by runId; a browsable library is SP3.
- Renaming the `research` `ViewState` id - cosmetic, out of scope.

## Verification / success criteria

1. `npm run build` clean (tsc -b + vite build); `npx vitest run` green - the engine/logic tests are untouched, so none should need editing (a test that breaks signals an unintended change).
2. No dangling imports after deletions (the build proves this); grep confirms zero references to deleted components from surviving views.
3. **Live smoke:** with the backend running, a deep-research run started from the new home streams real `run_started` + `trace` events (real tool calls, evidence ids) and renders a grounded conclusion-first dossier on `done` - the same end-to-end path Phase 2 verified, now through the light home.
4. **Playwright:** the Ask-Sonny home is the default landing, renders light at 1440 / 768 / 375 with 0 console errors, capability cards show the honest Available/Coming-soon states, and the retired rail is gone (no right panel, no dead toggle).
5. The engine layer diff is empty: `git diff` touches no file under `src/lib/research/*` (the `.ts` engine files), `src/hooks/useDeepResearchStream.ts`, or `server/api/agents/deepResearch.ts`.

## File / task boundaries (for the plan)

- **Task 1:** flip the seam - default landing to Sonny (`App.tsx:53`), rename the nav label (`Sidebar.tsx:347`). (Small, independently verifiable.)
- **Task 2:** retire the right rail - remove `SonnySidePanel` render + import + its state/effects/keyboard plumbing from `App.tsx`. Build stays green (home still the old research component at this point).
- **Task 3:** build the light Ask-Sonny home - composer + capability cards + wire to `useDeepResearchStream`, replacing the dark research components. Reuse engine/hook/stores unchanged.
- **Task 4:** build the light glass-box trace + conclusion-first dossier (design-doc forms), rendered by the home.
- **Task 5:** delete the mock specialist dirs + `sonny/` + agents rail (with the salvage + grep-safety gate); confirm build green and `/api/patent-parsing` route preserved.
- **Task 6:** verification - build/tests green, live deep-research smoke through the home, Playwright default-landing + light + honest-capabilities pass with screenshots.

Each task ends with a building, independently reviewable diff.

---

*Second of the three-sub-project LUMINA redesign. Next: `writing-plans` to turn this into a task-by-task implementation plan, executed via subagent-driven-development on a branch cut from the SP1 relight branch.*
