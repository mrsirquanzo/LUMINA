# Sub-project 1: LUMINA Global Relight + Shell - Design Spec

**Date:** 2026-07-02
**Status:** Approved (design), pending implementation plan
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`

## Why this first (the framing)

LUMINA is being taken from its current dark theme to a light theme, and the multi-agent orchestration is being collapsed into a single unified Sonny ("one Sonny, many skills").
That is three sub-projects: **(1) global relight + shell**, (2) unified Sonny front door, (3) relight the surviving heavy views.
This spec is sub-project 1.

Relight-first is close to free.
It carries no Sonny interaction risk and locks in none of sub-project 2's product decisions - the Sonny composer can still be thrown away and rebuilt freely afterward.
There is nothing risky to front-load on the visual side, so the usual "front-load the risky thing" instinct does not apply.
What relight-first does buy:

- **Every later Sonny design call is made on the real skin, not a throwaway dark theme.** Build Sonny dark and relight later and each composer decision is made twice.
- **Sub-projects 2 and 3 are born light.** The token flip first means the ~4 Sonny presentational components (and everything SP2/SP3 add) are styled once on the light base, not restyled a second time.

## Two notes carried from decomposition (binding on this spec)

1. **The shell assumes only the accent color dies, not the persona concept.**
   Killing purple (Scientist) and orange (Scout) for the single trust-blue is decided by the design doc regardless, so the accent color is independent.
   Whether Scientist/Scout survive as a concept (two dashboards) or collapse into one is a **dashboard-level question that lives in sub-project 3**, not here.
   The shell may go blue without answering it.
   This spec therefore changes the persona accent to blue but does **not** remove the persona switcher, the two dashboard components, or the persona state.

2. **Sub-project 3's panel list is "whatever survives Sonny," defined after sub-project 2.**
   Sub-project 2 demotes the six specialists to skills and likely deletes a chunk of the ~14 specialist panel files rather than restyling them.
   So this spec spends **zero polish** on those panels - they get correctness-light only (see Section 3), never bespoke material.

## Goal

In one pass, LUMINA becomes a light, blue-accented, WCAG-AA app whose **shell** embodies the finalized Sonny design system, while deep view internals get correctness-light only.
No functional/behavioral change: this is a presentation-layer relight.
The Phase 2 Sonny research engine layer (`src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, the trace/briefing stores, the aggregation reducer) is **not touched**.

## Architecture / approach

A single high-leverage token flip does most of the work, because ~79 of 117 component files reference *semantic* Tailwind tokens (`bg-surface`, `text-textPrimary`, `border-white/*`) rather than raw hex.
Redefining those token **values** dark -> light flips the bulk of the app in one commit with **zero renames**.
The remainder is: sweeping stragglers that the token flip cannot reach (opacity-white borders, black scrims, primary-tint glow blobs, purple/orange persona accents), applying full design-doc **material** to the shell and shared chrome only, and correctness-light everywhere else.

### Active-config facts (verified 2026-07-02)

- **Tailwind:** `tailwind.config.js` is live (Tailwind 3.4 resolves `.js` before `.ts`; `tailwind.config.ts` defines none of the semantic tokens the app renders with -> it is cruft from the stale Next.js copy).
- **PostCSS:** `postcss.config.js` is live; `postcss.config.mjs` is a functional duplicate.
- Both dead files (`tailwind.config.ts`, `postcss.config.mjs`) are deleted in this sub-project, as the first task, since the whole flip rests on there being a single unambiguous config.

## Section 1 - Theming foundation

**Files:** `tailwind.config.js`, `postcss.config.js`, `src/index.css`, `index.html`; delete `tailwind.config.ts` + `postcss.config.mjs`.

1. **Config consolidation (first task).** Confirm live configs; delete `tailwind.config.ts` and `postcss.config.mjs`; run the dev build to confirm styling is unchanged (still dark at this point) with a single config each.
2. **Flip token values in place** in `tailwind.config.js` `theme.extend.colors`:
   - `background: #F6F8FB` (was `#000000`)
   - `surface: #FFFFFF` (was `#1C1C1E`)
   - `surfaceHighlight: #F1F5F9` (was `#2C2C2E`)
   - `surfaceElevated: #FFFFFF` (was `#3A3A3C`) - elevated = white card on the page; elevation comes from shadow/border, not a lighter grey
   - `textPrimary: #0F172A` (was `#F5F5F7`)
   - `textSecondary: #475569` (was `#AEAEB2`)
   - `textTertiary: #94A3B8` (was `#8E8E93`)
   - `border: #E6EBF2` (was `rgba(255,255,255,0.05)`)
   - `success: #16A34A` (was `#30D158`), `warning: #D97706` (was `#FF9F0A`), `danger: #DC2626` (was `#FF453A`), `info: #1D4ED8` (was `#0A84FF`)
   - `ringColor` DEFAULT/success/warning/danger/info updated to the new hues at 0.5 alpha.
3. **Set the primary CSS var to blue.** In `src/App.tsx` where `--color-primary` is assigned per persona (both branches) and in the `src/index.css` `:root` default, set it to `29 78 216` (blue-700) for **both** personas. The `primary` token already reads `rgb(var(--color-primary) / <alpha-value>)`, so this turns every `bg-primary`/`text-primary`/`ring-primary`/`bg-primary/N` blue at once. Persona state and switcher remain; only the color they drive changes.
4. **Add forward tokens + fonts** to `tailwind.config.js`:
   - Role tokens (namespaced so they never collide with the flipped legacy tokens): `page #F6F8FB`, `ink #0F172A`, `borderSoft #EEF2F7`, `subtle #F1F5F9`, and `go/watch/nogo` each with `DEFAULT` (fill), `text`, `tint` per the design doc (go `#16A34A`/`#15803D`/`#DCFCE7`, watch `#D97706`/`#B45309`/`#FEF3C7`, nogo `#DC2626`/`#B91C1C`/`#FEE2E2`).
   - `fontFamily`: `sans: ['Geist','Inter',...system]`, `display: ['Newsreader','Georgia',serif]`, `mono: ['Geist Mono','JetBrains Mono','ui-monospace',...]`.
   - `boxShadow`: a `card` token = `0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)`.
5. **Font `<link>`s** in `index.html` `<head>`: Geist (400/500/600/700), Newsreader (opsz, 400/500/600), Geist Mono (400/500), with `preconnect`. Only the used weights.
6. **`src/index.css`:** body `background-color: #000000 -> #F6F8FB`, `color: #F5F5F7 -> #0F172A`; rewrite `.glass` from the dark recipe to the light liquid-glass recipe (`border: 1px solid rgba(255,255,255,.55); box-shadow: <card>, inset 0 1px 0 rgba(255,255,255,.85), inset 0 0 0 1px rgba(226,232,240,.35)`); custom scrollbar thumb from `rgba(255,255,255,.1)` to a slate `rgba(15,23,42,.15)`; add the fixed pointer-events-none grain overlay (~2.8% opacity, multiply) on `body::after`; add a `.tactile:active { transform: scale(.98); }` utility and an `@media (prefers-reduced-motion: reduce)` guard that disables grain animation/shimmer/entrance.

**Acceptance:** after Section 1, launching the app shows a light page with legible ink text and blue accents; no build/config warnings; a single Tailwind + single PostCSS config.

## Section 2 - Shell material (full design-doc polish)

Only the shell and shared chrome get the full material.

**Files:** `src/App.tsx` (shell wrapper + header region), `src/components/Sidebar.tsx`, `src/components/Header.tsx`, `src/components/SonnySidePanel.tsx` (container chrome only), shared modal wrappers (`src/components/shared/WorkspaceSaveModal.tsx` and any modal using `bg-black/60`).

- **App wrapper:** `bg-background` now light; **remove** the `bg-primary/5 ... blur-[120px]` glow blob (line ~511) - it reads as a purple smear on light. Optionally replace with the design-doc faint radial atmosphere behind the command region only.
- **Sidebar:** white `surface`, hairline `border` right edge, blue active-nav indicator + blue-tint selected fill; persona switcher buttons now both blue (accent dies, concept stays); resize handle hover tint blue. Wordmark may use Newsreader `display`.
- **Header:** light liquid-glass sticky bar (`.glass` recipe, `backdrop-blur`), hairline bottom border, ink text.
- **SonnySidePanel:** **container chrome only** - light glass panel, hairline border, light resize handle. Its internal agent selector / specialist UI is **out of scope** (SP2 owns it); here it only needs to be legible on light and not use dark-only tokens.
- **Shared modals:** scrim `bg-black/60 -> bg-slate-900/40` (or a tokenized scrim); modal card = white surface, hairline border, `card` shadow, `rounded-xl`.
- **Type:** Geist becomes the app-wide UI face via the `sans` token (no per-component change needed - body inherits). Newsreader scoped to the wordmark only in this sub-project.
- **Tactile:** apply the `.tactile` press utility to sidebar nav items, header buttons, and primary buttons in the shell.

**Acceptance:** the shell reads as the design-doc system - white sidebar, light glass header, blue accents, soft shadows, Geist type, tactile press - with no dark remnants.

## Section 3 - Deep views (correctness-light only)

Every remaining view gets **correctness-light + inherited fonts**, nothing more.

**Files (illustrative, not exhaustive - the token flip already did most):** `src/components/ScientistDashboard.tsx`, `src/components/ScoutDashboard.tsx`, `src/components/views/IntelligenceFeed.tsx`, `src/components/views/Workspaces.tsx`, `src/components/views/Recent.tsx`, `src/components/Tile.tsx`, the six specialist panels under `src/components/{patent,clinical,market,financial,target-biology,regulatory}/` and `src/components/agents/*`, and the four Sonny research presentational components `src/components/research/{SonnyResearchDashboard,GlassBoxTrace,ResearchDossier,ResearchComposer}.tsx`.

Correctness-light means, per file only where the token flip left something wrong:

- Sweep `border-white/5|10|15|20` -> `border-border` (hairline slate) or remove where it was a dark-only affordance.
- Sweep `bg-black/*`, `bg-white/5|10` overlays -> light-appropriate `bg-subtle`/`bg-surface` or removed.
- Neutralize any hard-coded dark hexes or `backdrop-blur` over dark that now reads wrong.
- Ensure text meets AA on the new light surfaces (no `textTertiary` used as body).
- Blue accents (already handled by the primary var) - just verify no residual purple/orange hard-codes.

**Explicitly NOT in scope for the deep views:** liquid-glass, bespoke shadows, layout changes, motion polish, restructuring.
The six specialist panels get the **minimum** to not look broken, because SP2 may delete them.
The four Sonny research components get correctness-light now and their real design-doc build in SP2.

**Acceptance:** every view is legible and coherent on light with no dark-remnant regions; deep views are visibly "clean light," not necessarily "polished."

## Non-goals

- No behavioral/logic change; no route or state-shape change; no engine changes.
- No removal of personas, dashboards, specialist panels, or the side-panel interaction model (all SP2/SP3).
- No dark mode. Light-only. (Tokens are role-based so a dark mode could return later without hardcoding, but building it is out of scope.)
- No mass token rename; no shared-primitive extraction (there is no primitive library today - creating one is not required to relight).

## Error handling / edge cases

- **Font load failure:** every font stack names a real fallback (Inter for sans, Georgia for serif, JetBrains Mono/ui-monospace for mono) so first paint never lands on Times or a system default.
- **`prefers-reduced-motion`:** grain, shimmer, entrance, and tactile animations disabled; content renders instantly.
- **Contrast:** color is never the only signal; RAG/status always pairs a dot with a text label (already the pattern; verify preserved).

## Verification / success criteria

1. **Existing tests green:** `npm test` and `tsc` (or the repo's `npm run build` typecheck) pass unchanged - this is a presentation relight, so no test should need editing. Any test that *does* break signals an unintended behavioral change and must be investigated, not edited to pass.
2. **Playwright pass over every view** (`dashboard` for both personas, `feed`, `workspaces`, `history`, `research`) at **1440 / 768 / 375px**:
   - 0 console errors.
   - No dark-remnant regions (no black/near-black backgrounds, no white-on-white, no invisible hairlines).
   - Text meets AA contrast on light surfaces.
   - Accents are blue (no purple/orange).
   - No horizontal scroll at any breakpoint.
   - Screenshot captured per view/breakpoint as done-evidence.
3. **Config sanity:** exactly one Tailwind config and one PostCSS config remain; dev + prod build succeed.

## File / task boundaries (for the plan)

- **Task 1:** config consolidation (delete dead configs; confirm single live config; build still renders, still dark).
- **Task 2:** token flip in `tailwind.config.js` + `--color-primary` blue in App.tsx/index.css + forward tokens/fonts/`boxShadow` + `index.html` font links + `index.css` body/glass/scrollbar/grain/reduced-motion. (This is the moment the app turns light.)
- **Task 3:** shell material - App wrapper (kill glow), Sidebar, Header. (Section 2)
- **Task 4:** shell material - SonnySidePanel container chrome + shared modals/scrims. (Section 2)
- **Task 5:** correctness-light straggler sweep across deep views + the 4 research components. (Section 3)
- **Task 6:** verification - tests green + Playwright multi-viewport pass with screenshots. (Verification)

Each task ends with a build that renders and an independently reviewable diff.

---

*Supersedes nothing; first of the three-sub-project LUMINA redesign. Next: `writing-plans` to turn this into a task-by-task implementation plan, executed via subagent-driven-development.*
