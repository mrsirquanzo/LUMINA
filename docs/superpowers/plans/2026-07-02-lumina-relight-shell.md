# LUMINA Global Relight + Shell - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take LUMINA from its dark theme to a light, blue-accented, WCAG-AA theme in one pass, with the shell embodying the finalized Sonny design system.

**Architecture:** ~79 of 117 components reference *semantic* Tailwind tokens (`bg-surface`, `text-textPrimary`, `border-white/*`), so redefining those token **values** dark->light in `tailwind.config.js` flips the bulk of the app in one commit with zero renames. The rest is: consolidating duplicate configs, sweeping stragglers the token flip cannot reach (opacity-white borders, black scrims, primary-tint glow blobs, purple/orange persona accents), applying full design-doc material (Geist/Newsreader/Geist Mono, liquid-glass, tactile, grain, soft shadows) to the shell + shared chrome only, and correctness-light everywhere else. No behavioral change; the Phase 2 research engine layer is untouched.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 3.4, TypeScript, Vitest 4, Playwright (MCP) for visual verification.

**Spec:** `docs/superpowers/specs/2026-07-02-lumina-relight-shell-design.md`
**Design system source of truth:** `docs/design/SONNY_DASHBOARD_DESIGN.md`

## Global Constraints

- **Presentation-only.** No behavioral/logic/route/state-shape change. The Phase 2 research engine layer (`src/lib/research/*`, `src/hooks/useDeepResearchStream.ts`, trace/briefing stores, aggregation) is NOT modified.
- **Existing tests pass UNCHANGED.** `npm test` and `npm run build` (which runs `tsc -b`) stay green. A test that breaks signals an unintended behavioral change - investigate it, never edit a test to pass.
- **Personas: only the accent color dies, not the concept.** Change the Scientist(purple)/Scout(orange) accent to the single blue `#1D4ED8`; do NOT remove the persona switcher, the two dashboard components, or the persona state. (Persona survival is a sub-project 3 question.)
- **Zero polish on soon-dead panels.** The six specialist panels (`src/components/{patent,clinical,market,financial,target-biology,regulatory}/`) get correctness-light ONLY - never liquid-glass/shadow/layout polish - because sub-project 2 may delete them.
- **No dark mode, no mass token rename, no shared-primitive extraction.** Light-only. Tokens stay role-based so dark could return later, but building it is out of scope.
- **Exact token values (from the design doc):** page `#F6F8FB`, surface `#FFFFFF`, subtle/highlight `#F1F5F9`, ink/textPrimary `#0F172A`, textSecondary `#475569`, textTertiary `#94A3B8`, border `#E6EBF2`, borderSoft `#EEF2F7`, primary/info `#1D4ED8`, go/success `#16A34A` (text `#15803D`, tint `#DCFCE7`), watch/warning `#D97706` (text `#B45309`, tint `#FEF3C7`), nogo/danger `#DC2626` (text `#B91C1C`, tint `#FEE2E2`). Primary CSS var value = `29 78 216`.
- **Fonts:** `sans: ['Geist','Inter',...]`, `display: ['Newsreader','Georgia',serif]`, `mono: ['Geist Mono','JetBrains Mono','ui-monospace',...]`. Every stack keeps a real fallback so first paint never lands on Times/system default.
- **`prefers-reduced-motion`:** grain, shimmer, entrance, and tactile animations disabled; content renders instantly.
- **Commit style:** plain hyphens, never em dashes; do NOT add an agent co-author line.

---

### Task 1: Consolidate duplicate configs

**Files:**
- Delete: `tailwind.config.ts`
- Delete: `postcss.config.mjs`
- Verify unchanged: `tailwind.config.js`, `postcss.config.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a single unambiguous Tailwind config (`tailwind.config.js`) and PostCSS config (`postcss.config.js`) that all later tasks edit.

**Context:** Tailwind 3.4 resolves `tailwind.config.js` before `.ts`; the `.ts` defines none of the semantic tokens the app renders with, so it is dead cruft from a stale Next.js copy. `postcss.config.mjs` is a functional duplicate of `postcss.config.js`. Removing both guarantees the token flip in Task 2 has one target.

- [ ] **Step 1: Confirm nothing imports the dead configs**

Run: `grep -rn "tailwind.config.ts\|postcss.config.mjs" --include=*.ts --include=*.js --include=*.json --include=*.mjs . | grep -v node_modules`
Expected: no matches (these files are auto-discovered, never imported).

- [ ] **Step 2: Delete the dead configs**

```bash
git rm tailwind.config.ts postcss.config.mjs
```

- [ ] **Step 3: Verify the build still renders (still dark at this point)**

Run: `npm run build`
Expected: build succeeds (`tsc -b` clean, `vite build` completes). The app is still dark - only cruft was removed.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(theme): remove duplicate tailwind/postcss configs before relight"
```

---

### Task 2: Token flip - the app turns light

**Files:**
- Modify: `tailwind.config.js` (whole `theme.extend`)
- Modify: `src/App.tsx:162-168` (persona `--color-primary` values)
- Modify: `src/index.css` (`:root`, `body`, `.glass`, `.glass-elevated`, scrollbar, add grain + tactile + reduced-motion)
- Modify: `index.html` (`<head>` font links)

**Interfaces:**
- Consumes: single config from Task 1.
- Produces: light semantic tokens (`bg-background`=`#F6F8FB`, `surface`=`#FFFFFF`, `textPrimary`=`#0F172A`, `border`=`#E6EBF2`, etc.), blue `primary` for both personas, new role tokens (`page`, `ink`, `borderSoft`, `subtle`, `go`/`watch`/`nogo` with `.DEFAULT/.text/.tint`), `fontFamily` (`sans`/`display`/`mono`), a `shadow-card` token, and a light `.glass` recipe + `.tactile` utility for Tasks 3-4.

**Context:** This is the single highest-leverage change - it flips ~79 files at once. Give the full file bodies verbatim.

- [ ] **Step 1: Replace `tailwind.config.js` entirely**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Flipped legacy semantic tokens (dark -> light values, names unchanged) ---
        background: '#F6F8FB',
        surface: '#FFFFFF',
        surfaceHighlight: '#F1F5F9',
        surfaceElevated: '#FFFFFF', // elevation comes from shadow/border, not a lighter grey
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#1D4ED8',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textTertiary: '#94A3B8',
        border: '#E6EBF2',
        // --- Forward role tokens (design-doc vocabulary for SP2/new work) ---
        page: '#F6F8FB',
        ink: '#0F172A',
        subtle: '#F1F5F9',
        borderSoft: '#EEF2F7',
        go: { DEFAULT: '#16A34A', text: '#15803D', tint: '#DCFCE7' },
        watch: { DEFAULT: '#D97706', text: '#B45309', tint: '#FEF3C7' },
        nogo: { DEFAULT: '#DC2626', text: '#B91C1C', tint: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--color-primary) / 0.5)',
        success: 'rgba(22, 163, 74, 0.5)',
        warning: 'rgba(217, 119, 6, 0.5)',
        danger: 'rgba(220, 38, 38, 0.5)',
        info: 'rgba(29, 78, 216, 0.5)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Set both personas to blue in `src/App.tsx`**

Replace lines 162-168 (the `if/else` inside the theme-switching effect) with:

```tsx
    if (activePersona === Persona.SCIENTIST) {
      root.style.setProperty('--color-primary', '29 78 216'); // Trust blue (accent unified; persona concept unchanged)
      root.className = 'scientist-theme';
    } else {
      root.style.setProperty('--color-primary', '29 78 216'); // Trust blue (accent unified; persona concept unchanged)
      root.className = 'scout-theme';
    }
```

(Both branches use the same blue - only the accent color is unified; the persona class names and switching logic are intentionally preserved.)

- [ ] **Step 3: Flip `:root` + `body` in `src/index.css`**

Replace the `:root` primary default and the `body` block (lines ~5-8 and ~16-27) so the default var is blue and the body is light:

```css
:root {
  /* Primary color - trust blue (persona accent unified) */
  --color-primary: 29 78 216;
}
```

```css
body {
  margin: 0;
  font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Helvetica Neue', sans-serif;
  font-size: 14.4px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #F6F8FB;
  color: #0F172A;
  min-height: 100vh;
}

/* Whisper grain + atmosphere - fixed, non-interactive, GPU-cheap */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: .028;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

- [ ] **Step 4: Swap the scrollbar + glass recipes in `src/index.css`**

Change the custom scrollbar thumb from white to slate (find `rgba(255, 255, 255, 0.1)` in the `.custom-scrollbar::-webkit-scrollbar-thumb` rule near the top and the `scrollbar-color` line):

```css
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.15);
  border-radius: 3px;
  transition: background 0.2s ease;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.28);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.15) transparent;
}
```

Replace the `.glass` and `.glass-elevated` blocks (lines 248-260) with the light liquid-glass recipe:

```css
/* Liquid-glass - light refraction for floating panels only */
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035),
    inset 0 1px 0 rgba(255,255,255,.85), inset 0 0 0 1px rgba(226,232,240,.35);
}

.glass-elevated {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 12px rgba(15,23,42,.06), 0 12px 32px rgba(15,23,42,.05),
    inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 1px rgba(226,232,240,.4);
}
```

- [ ] **Step 5: Add the `.tactile` utility + reduced-motion guard in `src/index.css`**

Append near the utility classes:

```css
/* Tactile press - physical confirmation on interactive elements */
.tactile { transition: transform .12s cubic-bezier(.33,0,.2,1); }
.tactile:active { transform: scale(.98); }

@media (prefers-reduced-motion: reduce) {
  body::after { display: none; }
  .tactile, .tactile:active { transition: none; transform: none; }
  .animate-fade-in, .animate-shimmer { animation: none !important; }
}
```

- [ ] **Step 6: Add font links to `index.html` `<head>`**

Insert before `</head>`:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
```

- [ ] **Step 7: Verify the build and start dev**

Run: `npm run build`
Expected: `tsc -b` clean, `vite build` succeeds.

Run (background): `npm run dev` then load `http://localhost:5173`
Expected: the app now renders on a light `#F6F8FB` page with dark ink text and blue accents. (Straggler artifacts - white-on-white cards, invisible hairlines - are EXPECTED here and fixed in Tasks 3-5.)

- [ ] **Step 8: Run existing tests**

Run: `npm test -- --run`
Expected: all existing suites pass unchanged (they are engine/logic tests, theme-agnostic).

- [ ] **Step 9: Commit**

```bash
git add tailwind.config.js src/App.tsx src/index.css index.html
git commit -m "feat(theme): flip semantic tokens light, add role tokens/fonts/material primitives"
```

---

### Task 3: Shell material - App wrapper, Sidebar, Header

**Files:**
- Modify: `src/App.tsx` (shell wrapper region incl. the glow blob at line ~511, header region)
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: light tokens, `.glass`, `.tactile`, `shadow-card`, `font-display` from Task 2.
- Produces: a fully materialized light shell that later tasks visually match against.

**Context:** These three files are the always-visible chrome and get the FULL design-doc material. Work by reading each file and applying the rules below; there is no unit test for visual styling, so verification is build + a Playwright look.

- [ ] **Step 1: App wrapper - remove the glow blob**

In `src/App.tsx` delete the background gradient blob (line ~511):

```tsx
              {/* Background gradient blob */}
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" aria-hidden="true" />
```

Remove the entire `<div>` (it reads as a blue smear on light). Leave the surrounding content div intact.

- [ ] **Step 2: Sidebar material**

In `src/components/Sidebar.tsx`: the `motion.aside` root should read `bg-surface` (white) with a `border-r border-border` hairline (replace `border-white/5`). Active-nav indicator stays `bg-primary` (now blue); selected-row fill uses `bg-primary/10`; the resize-handle hover tint stays `bg-primary/60`. Persona switcher buttons: both now render with the blue primary (the `personaConfig` color values that were `#BF5AF2`/`#FF9F0A` should be set to `#1D4ED8` so the active persona pill is blue; the switcher itself stays). Add `tactile` to nav item buttons and the persona buttons. The "LUMINA" wordmark may use `font-display`. Replace any `text-textTertiary` used for readable labels with `text-textSecondary`.

- [ ] **Step 3: Header material**

In `src/components/Header.tsx`: the sticky header bar uses the light liquid-glass (`glass` class OR `bg-surface/80 backdrop-blur-xl`), a `border-b border-border` hairline, and ink text. Any icon buttons get `tactile`. Remove dark-only tokens (`border-white/5`, `bg-black/*`).

- [ ] **Step 4: Verify build + visual**

Run: `npm run build`
Expected: clean.

Load the dev app; visually confirm the sidebar is a white panel with a hairline border and blue active nav, the header is a light glass bar, and the page has no blue glow smear. (Playwright screenshot capture happens in Task 6; here a manual/Playwright look confirms no regressions.)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Sidebar.tsx src/components/Header.tsx
git commit -m "feat(theme): light shell material - app wrapper, sidebar, header"
```

---

### Task 4: Shell material - side-panel chrome + shared modals

**Files:**
- Modify: `src/components/SonnySidePanel.tsx` (container chrome ONLY)
- Modify: `src/components/shared/WorkspaceSaveModal.tsx` and any modal component using `bg-black/60`

**Interfaces:**
- Consumes: light tokens, `.glass`, `shadow-card` from Task 2.
- Produces: light-glass side-panel container and light-scrim modals.

**Context:** SonnySidePanel's INTERNAL agent selector/specialist UI is sub-project 2's problem - here we only touch its container chrome (background, border, resize handle) so it is legible on light and uses no dark-only tokens. Modal scrims must move off pure-black.

- [ ] **Step 1: Side-panel container chrome**

In `src/components/SonnySidePanel.tsx`: the panel container background -> `bg-surface` (or `.glass` if it floats over content), border -> `border-border` (replace `border-white/*`), resize handle hover -> `bg-primary/60`. Do NOT restructure or restyle the internal agent selector, mode toggle, or specialist rendering - only the outer container's dark-only tokens.

- [ ] **Step 2: Find every black scrim**

Run: `grep -rn "bg-black/" src/components | grep -iv node_modules`
Expected: a list of modal/overlay scrims.

- [ ] **Step 3: Light scrims + modal cards**

For each modal (starting with `WorkspaceSaveModal.tsx`): scrim `bg-black/60` -> `bg-slate-900/40`; modal card -> `bg-surface`, `border border-border`, `shadow-card`, `rounded-xl`, ink text. Add `tactile` to the modal's primary button.

- [ ] **Step 4: Verify build + visual**

Run: `npm run build`
Expected: clean. Open a modal (e.g., save workspace) in the dev app; confirm a light card over a soft (not pure-black) scrim.

- [ ] **Step 5: Commit**

```bash
git add src/components/SonnySidePanel.tsx src/components/shared/WorkspaceSaveModal.tsx
git commit -m "feat(theme): light side-panel chrome and modal scrims"
```

---

### Task 5: Correctness-light sweep - deep views + research components

**Files (illustrative - the token flip already did most; touch a file only where something reads wrong on light):**
- `src/components/ScientistDashboard.tsx`, `src/components/ScoutDashboard.tsx`
- `src/components/views/IntelligenceFeed.tsx`, `src/components/views/Workspaces.tsx`, `src/components/views/Recent.tsx`
- `src/components/Tile.tsx`
- `src/components/{patent,clinical,market,financial,target-biology,regulatory}/*` and `src/components/agents/*` (MINIMUM only)
- `src/components/research/{SonnyResearchDashboard,GlassBoxTrace,ResearchDossier,ResearchComposer}.tsx`

**Interfaces:**
- Consumes: light tokens from Task 2.
- Produces: every view legible and coherent on light with no dark-remnant regions.

**Context:** This is a discovery-driven sweep, not fixed code. The rule: fix only what the token flip left wrong. NO bespoke material (no `.glass`, no custom shadows, no layout changes) - especially not on the six specialist panels, which SP2 may delete. The four research components get correctness-light now; their real design-doc build is SP2.

- [ ] **Step 1: Enumerate the straggler footprint**

Run: `grep -rn "border-white/\|bg-white/\|bg-black/\|#000\|#1C1C1E\|#2C2C2E\|#3A3A3C\|#F5F5F7\|bg-\[#" src/components | grep -v node_modules | sort`
Expected: a finite list of dark-only hard-codes and opacity-white affordances. This list IS the work for this task.

- [ ] **Step 2: Apply the sweep mapping**

For each hit, apply the appropriate replacement:
- `border-white/5|10|15|20` -> `border-border` (hairline slate), or delete if it was a dark-only divider that the token flip already handles.
- `bg-white/5|10` overlays -> `bg-subtle` or remove.
- `bg-black/*` (non-scrim) -> `bg-subtle`/`bg-surface` as fits, or remove.
- Hard-coded dark hexes (`#1C1C1E`, `#2C2C2E`, `#3A3A3C`, `#F5F5F7`, `#000`) -> the matching semantic token (`bg-surface`, `bg-subtle`, `text-textPrimary`) or a light hex.
- Any residual purple `#BF5AF2` / orange `#FF9F0A` accent hard-code -> `text-primary`/`bg-primary` (blue) or `#1D4ED8`.
- `text-textTertiary` used for readable body/labels -> `text-textSecondary` (tertiary is captions/placeholders only).

- [ ] **Step 3: Specialist panels - minimum only**

For `src/components/{patent,clinical,market,financial,target-biology,regulatory}/*` and `src/components/agents/*`: apply ONLY Step 2 mappings so they are legible. Do NOT add material or restructure. If a panel already looks fine after the token flip, leave it untouched.

- [ ] **Step 4: Research components - correctness-light**

For the four `src/components/research/*` components: swap the dark container tokens (e.g. `bg-surfaceElevated/60 backdrop-blur-sm border-white/10`) to light equivalents (`bg-surface border border-border`), fix `text-textTertiary` labels, and ensure the spinner/loader colors read on light. No redesign - SP2 rebuilds these.

- [ ] **Step 5: Verify build + tests**

Run: `npm run build`
Expected: clean.
Run: `npm test -- --run`
Expected: all pass unchanged.

- [ ] **Step 6: Confirm the sweep is exhaustive**

Run: `grep -rn "border-white/\|bg-black/\|#1C1C1E\|#2C2C2E\|#3A3A3C\|#F5F5F7" src/components | grep -v node_modules`
Expected: no matches remain (or only intentional, justified ones noted in the commit message).

- [ ] **Step 7: Commit**

```bash
git add src/components
git commit -m "feat(theme): correctness-light sweep across deep views and research components"
```

---

### Task 6: Verification - full-app light audit

**Files:**
- No source changes (fixes found here loop back into the relevant task's files).
- Create: `docs/design/relight-evidence/` (screenshots)

**Interfaces:**
- Consumes: the fully relit app from Tasks 1-5.
- Produces: pass/fail evidence per view/breakpoint; a punch list of any regressions to fix.

**Context:** No unit test asserts "looks light," so verification is: existing suite green + a Playwright pass over every view at three breakpoints, capturing screenshots and checking the acceptance criteria.

- [ ] **Step 1: Tests + typecheck green**

Run: `npm test -- --run && npm run build`
Expected: all suites pass; `tsc -b` clean; `vite build` succeeds.

- [ ] **Step 2: Start the app**

Run (background): `npm run dev`
Expected: serving on `http://localhost:5173`.

- [ ] **Step 3: Playwright pass over every view**

Using the Playwright MCP, for each view - `dashboard` (as Scientist AND as Scout, toggling the persona switcher), `feed`, `workspaces`, `history`, `research` - at each viewport `1440x900`, `768x1024`, `375x812`:
- Navigate/switch to the view.
- Capture `browser_console_messages`; assert 0 errors.
- Take a screenshot into `docs/design/relight-evidence/<view>-<width>.png`.
- Visually verify: light page (no black/near-black regions), no white-on-white cards, hairlines visible, text passes AA on light, accents are blue (no purple/orange), no horizontal scroll.

- [ ] **Step 4: Punch-list any regressions**

For each failure, note the view + issue, fix it in the owning task's file(s) (re-run the relevant build), and re-screenshot. Repeat until every view/breakpoint passes.

- [ ] **Step 5: Commit evidence**

```bash
git add docs/design/relight-evidence
git commit -m "test(theme): relight verification evidence - all views light, AA, 0 console errors"
```

---

## Self-Review

**Spec coverage:**
- Config consolidation -> Task 1. ✓
- Token flip in place + role tokens + fonts + `--color-primary` blue -> Task 2. ✓
- `index.css` body/glass/scrollbar/grain/reduced-motion -> Task 2. ✓
- Shell material (App/Sidebar/Header) -> Task 3. ✓
- Shell material (side-panel chrome + modals) -> Task 4. ✓
- Straggler sweep + research correctness-light -> Task 5. ✓
- Persona accent-only change (concept preserved) -> Global Constraints + Task 2 Step 2 + Task 3 Step 2. ✓
- Zero polish on specialist panels -> Global Constraints + Task 5 Step 3. ✓
- Verification (tests green + Playwright multi-viewport + screenshots) -> Task 6. ✓
- Non-goals (no dark mode, no rename, no primitives, engine untouched) -> Global Constraints. ✓

**Placeholder scan:** No TBD/TODO. Task 5 is intentionally discovery-driven (a sweep over a grep-enumerated list), with exact replacement mappings given rather than a fixed diff - this is the honest shape of that work, not a placeholder.

**Type/name consistency:** Token names used in later tasks (`bg-surface`, `border-border`, `bg-subtle`, `text-textSecondary`, `shadow-card`, `font-display`, `.glass`, `.tactile`, `bg-primary`) are all defined in Task 2. `--color-primary` value `29 78 216` is consistent across `tailwind.config.js` (`primary` reads the var), `src/App.tsx`, and `src/index.css` `:root`.

**Note on TDD:** This is a presentation relight with no new logic, so there are no new unit tests - the discipline here is "existing suite stays green + build clean + Playwright visual acceptance." That is the correct test strategy for a theme change; adding logic tests would be inventing behavior that does not exist.
