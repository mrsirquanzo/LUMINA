# Design System: Sonny Intelligence Dashboard

Implementation source of truth for the Sonny dashboard in LUMINA.
Professional, industry-standard, evidence-first.
Synthesized from the ui-ux-pro-max design intelligence (data-dense dashboard pattern, trust-blue palette, dashboard typography) and refined through frontend-design + design-taste-frontend review, tuned for a biotech due-diligence tool read by skeptical senior scientists and BD/investment committees.
Type system: Geist (UI/data) + Newsreader serif (editorial voice only) + Geist Mono (identifiers/figures). Material: liquid-glass refraction on floating panels, tactile press feedback, mono-data.

Reference bar: Linear-grade polish, Benchling restraint, a calmer Bloomberg terminal.
Trustworthy, not flashy. No "AI dashboard" theatrics.

## 1. Atmosphere

Structured, professional, conclusion-first.
A clean light surface with hairline borders, restrained elevation, and disciplined density: efficient where it lists (watchlist, feed, runs) and generous where it concludes (the verdict and executive read get room to breathe).
The look should read as a serious instrument a scientist trusts, not a marketing dashboard.

Calibration: Density 6 (efficient, not cockpit-crammed), Variance 2 (structured, predictable), Motion 3 (restrained, functional).

Note on the generator: it proposed an "AI Personalization Landing" page pattern - discarded, because this is an application surface, not a marketing landing page. We keep the "data-dense dashboard" style discipline but temper the density so the conclusion stays the hero.

## 2. Color Palette & Roles

Neutral slate base + one trust-blue primary + strictly semantic status colors. Light mode is the default; tokens are structured so a dark mode can follow.

Neutrals (slate ramp) - final token values from the locked mocks:
- **Page** (#F6F8FB) - app background (a hair cooler/softer than slate-50)
- **Surface** (#FFFFFF) - cards, sidebar, composer, inputs
- **Subtle** (#F1F5F9, slate-100) - hover rows, quiet panels (KOL, quotes)
- **Border** (#E6EBF2) - 1px hairline structure. Border-driven separation over heavy shadows.
- **Border-soft** (#EEF2F7) - internal dividers inside a card (lighter than the card's outer border).
- **Primary text / ink** (#0F172A, slate-900) - headings, verdict, key figures
- **Secondary text** (#475569, slate-600) - body, metadata (minimum for body; never lighter)
- **Muted text** (#94A3B8, slate-400) - captions, placeholders, micro labels ONLY (never body)

Primary (single accent):
- **Primary / CTA** (#1D4ED8, blue-700) - primary buttons, active nav, links, focus rings. Hover #1E40AF.
- **Primary tint** (#EFF6FF, blue-50) - active nav fill, selected states.

Semantic status (functional only, never decorative) - these carry the GO/WATCH/NO-GO meaning. Each has a fill (the pill), a darker text shade (for status text on tint), and a tint (quiet backgrounds):
- **Positive / GO** (#16A34A, green-600; text #15803D; tint #DCFCE7) - go verdict, supported, good developability
- **Caution / WATCH** (#D97706, amber-600; text #B45309; tint #FEF3C7) - watch verdict, caution, moderate risk
- **Critical / NO-GO** (#DC2626, red-600; text #B91C1C; tint #FEE2E2) - no-go verdict, severe risk, refuted

Verdict pill = the single largest, boldest signal on a run or dossier: GO green fill / WATCH amber fill / NO-GO red fill, white text.

Contrast: all text meets WCAG AA (4.5:1). Color is never the only signal - RAG dots always pair with a text label.

Banned: purple/indigo "AI" accents, neon, outer glows, gradient text, oversaturated fills, pure black (#000000). One accent only (blue); green/amber/red are semantic tokens, not extra brand accents.

## 3. Typography

Three type roles, each with a strict job. Weight-driven hierarchy on a distinctive sans; a single editorial serif reserved for the "published finding" voice; monospace for every grounded identifier and figure. The serif is scoped so narrowly it never touches data or labels - that scoping is what keeps the UI from reading as "serif dashboard."

- **UI / data: Geist** (`font-sans`, `'Geist','Inter',-apple-system,sans-serif`).
Headings, body, labels, buttons, the composer, nav, capability cards, list rows - the default for everything not covered below.
Geist gives more engineered character than Inter while staying neutral enough for a serious instrument. Inter is the fallback (already in LUMINA), so nothing breaks before the font loads.
Hierarchy comes from weight (400/500/600/700) and color, not oversized type. Headings track slightly tight (-0.01 to -0.02em).
- **Editorial voice: Newsreader** (`font-display`, `'Newsreader',Georgia,serif`).
Deliberately kept despite the dashboard-serif ban, and allowed ONLY here: the Sonny wordmark, run titles, dossier section titles, and the executive read (the conclusion prose). This is the "published finding" voice - it signals a considered, human conclusion, not a data readout. Optical sizing on (`opsz`), weights 400-600. It must never touch a data value, a metric, a label, a button, or a table cell.
- **Identifiers + figures: Geist Mono** (`font-mono`, `'Geist Mono','JetBrains Mono',ui-monospace,monospace`).
Two jobs: (1) grounded identifiers - PMID / NCT / ENSG / patent no. / SEQ IDs / antibody sequences; (2) KPI numbers and tabular figures where alignment and the "precise instrument" read matter (the papers/evidence/tools counters, KOL weights). This is the "grounded and precise" signal - it visually marks every real, traceable token and every hard number.
- **Micro labels:** Geist 600, 11px, 0.05em tracking, uppercase, muted slate - GLASS-BOX TRACE, WATCHLIST, KOL & INSTITUTIONAL TERRAIN.

Scale (desktop): display/verdict 28-32px/700 (Geist) with serif run/section titles 19-26px/600 (Newsreader); H1 22px/600; H2 18px/600; body 15px/400 (line-height 1.6, measure capped ~70ch); small 13px; micro 11px.

Fallback order matters: every stack names a real fallback (Inter for sans, Georgia for serif, JetBrains Mono/ui-monospace for mono) so first paint never lands on Times or a system default.

Banned: serif anywhere outside the four Newsreader slots above (never on data, labels, buttons, or table cells); mono or "code" fonts as headings; sans at hairline weights for body; hierarchy by size alone.

## 4. Component Stylings

Restrained elevation, hairline borders, smooth 150-250ms transitions, cursor-pointer on everything interactive, visible focus rings.

### Material language

Two surface treatments layered over the flat slate/white base - subtle enough to stay professional, present enough to feel crafted:

- **Card shadow (soft hover-lift).** Resting cards use a diffuse, background-tinted double shadow: `0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)`. On hover, interactive cards lift with a slightly deeper shadow and a blue-200 border - via `transform: translateY(-1px)` + shadow only, never a size change. Radius 14px on cards.
- **Liquid-glass refraction (floating panels only).** For panels that float over content - the command/composer bar, the drill-in drawer, sticky headers - go beyond `backdrop-blur`: add a 1px inner light border and an inset highlight to simulate a physical glass edge: `border: 1px solid rgba(255,255,255,.55); box-shadow: <outer>, inset 0 1px 0 rgba(255,255,255,.85), inset 0 0 0 1px rgba(226,232,240,.35);`. Used sparingly - it marks "this floats," it is not a global card style.
- **Tactile press.** Every button and interactive card gets `:active { transform: scale(.98); }` (or `translateY(1px)` for wide bars) - a physical push that confirms the action. Paired with the hover-lift, interaction feels weighted, not flat.
- **Atmosphere.** A whisper grain overlay (fixed, `pointer-events:none`, ~2.8% opacity, multiply) over the whole app and a faint radial tint behind the command bar give the surface depth without color. Grain lives only on a fixed pseudo-element, never on a scrolling container.

- **Buttons.** Primary = blue-700 fill, white text, `rounded-lg`, subtle tinted shadow; secondary = white + slate-200 border, slate-900 text; ghost = text-only. Hover: darken/tint, no glow. `:active` scale(.98) tactile press. Disabled during async (loading buttons). Min 44px tap target.
- **Composer.** Liquid-glass floating bar: white surface, `rounded-xl`, slate-200 border that becomes blue-700 on focus (focus ring), inner-light refraction + soft shadow, faint radial atmosphere behind it. Left upload button opens a menu that routes the file to a skill (Research paper / Patent - extract sequences). Enter to run.
- **Capability cards.** White, slate-200 border, `rounded-xl`, hover = blue-200 border + faint lift. Status line: green dot "Available", amber/bronze dot "Skill - available", muted "Coming soon" (dashed border, reduced opacity). 2-column grid (never a 3-equal-card row).
- **Glass-box trace.** Bordered panel. Steps as a vertical checklist: done = green check, current = blue spinner ring, future = hollow slate ring. Specialists in a 2-column grid, each gaining a RAG dot on completion. Counters (papers / evidence / tools) as quiet KPI chips with Geist Mono figures. Legible and calm - this is the trust surface, not a light show. Log is virtualized/capped.
- **Dossier.** Conclusion-first: the verdict pill is the largest element, then the executive read (Inter, ~70ch, relaxed leading), then RAG section chips (pill + colored dot + label), then KOL terrain in a slate-50 panel (PI, institution, weight), then references (mono ids, linked). Actions right-aligned.
- **Patent result.** SEQ ID chip + type + mono sequence rows; "Grounded to source PDF"; Export FASTA (primary).
- **Watchlist / feed rows.** Hairline-separated list rows, status dot + label + metadata + optional badge; hover slate-50; row highlight.
- **Drill-in.** Right-side drawer (~820px, full-screen < 768px), slide-in, scrim.
- **Loaders.** Skeleton screens matching the run-card / dossier shape (reserve space, no content jump). Spinners only for inline button/async and the in-trace current step - never a bare centered spinner for content.
- **Empty states.** Composed and instructive ("No runs yet - ask Sonny a question; the run and its glass-box trace appear here").
- **Tooltips** on truncated values and icon-only buttons (with aria-labels).

## 5. Layout

- Shell: 248px sidebar (surface white, hairline right border) + fluid main on a slate-50 page. Optional max-width app frame at 1440px, centered.
- Content column max-width ~960px for the reading/reasoning views; full width for dense list/feed views. Consistent container widths (no mixing).
- CSS Grid for structured regions (capability grid, specialist grid, KPI chips). No 3-equal-card feature rows. No overlapping elements - every element in its own spatial zone.
- Define a z-index scale (10 / 20 / 30 / 50). Full-height uses `min-h-[100dvh]`, never `h-screen`.

## 6. Responsive

- < 768px: sidebar collapses to a top bar / slide-over; capability + specialist grids and KPI chips collapse to single column; drill-in becomes full-screen; composer full width. No horizontal scroll. Touch targets >= 44px. Body text >= 16px on mobile.
- Verified at 375 / 768 / 1024 / 1440px.

## 7. Motion & Interaction

- 150-250ms micro-interactions; `transform`/`opacity` only (never width/height/top/left). Default easing `cubic-bezier(.33,0,.2,1)` (calm ease-out); no bounce.
- Optional (build-time): Framer Motion spring physics (`stiffness ~100, damping ~20`) for the tactile press, card lift, and drawer slide - a weighted feel without overshoot. CSS transitions are the floor; springs are the polish where a component already animates.
- Streaming glass-box: updates arrive throttled (the existing Phase 2 rAF buffer); a subtle pulse marks the live/current status only. Staggered reveal for the trace steps and feed lists (small cascade via `animation-delay: calc(var(--index) * ~60ms)`), not instant mount.
- Skeleton loaders shimmer (matching the real row/card shape); the shimmer stops under `prefers-reduced-motion`.
- Honor `prefers-reduced-motion`: disable entrance/spinner/shimmer animation, render instantly.

## 8. Anti-Patterns (banned)

- No fabricated data or metrics. Every figure (papers, evidence, references, RAG, verdict, KOL weights, SEQ IDs) is grounded to a real engine event or evidence id - Sonny's "no token, no ship" made visual. No invented uptime/latency/percent stats, no "SYSTEM // 2025" labels.
- No emojis as UI - SVG icons only (Lucide/Heroicons, one set, 24px viewBox, consistent sizing).
- No purple/indigo "AI" accents, neon, glows, gradient headers, oversaturated fills, pure black.
- No mono/serif headings; no hierarchy-by-size-alone.
- No 3-equal-card feature row; no cockpit-cram that buries the conclusion.
- No overlapping elements; clean spatial separation; consistent container widths.
- No AI copywriting cliches (Elevate, Seamless, Unleash, Next-Gen). Sonny's voice is plain and evidence-first.
- No generic placeholder targets in shipped UI - use real targets (CDCP1, TROP2, KRAS G12C) and real evidence.
- No layout shift from hover (color/opacity transitions, not scale); no missing focus states.

## 9. Implementation notes

- Reuse LUMINA's Phase 2 engine layer unchanged: the SSE endpoint, `useDeepResearchStream`, the throttled trace store, the briefing store, the aggregation reducer. This design is a presentation layer over the same grounded plumbing, so fabricated data is structurally impossible - every figure traces to a real evidence id.
- Fonts: add Geist, Newsreader, Geist Mono (Google Fonts / fontsource); keep Inter + JetBrains Mono as fallbacks. Tailwind `fontFamily: { sans: ['Geist','Inter',...], display: ['Newsreader','Georgia',serif], mono: ['Geist Mono','JetBrains Mono',ui-monospace,...] }`. Load only the weights used (Geist 400/500/600/700, Newsreader 400/500/600 with opsz, Geist Mono 400/500) to keep first paint fast.
- Encode the palette as Tailwind theme tokens (page/surface/subtle/border/border-soft/ink + primary + semantic go/watch/nogo with fill/text/tint) so components reference roles, not raw hex. Token values are the locked ones in Section 2 (page #F6F8FB, border #E6EBF2), matching the mocks exactly.
- Material helpers: define reusable classes/utilities for `.glass` (liquid-glass refraction), the soft card shadow, the tactile `:active` press, and the fixed grain overlay - so the treatments stay consistent and are applied by role, not re-typed per component.
- Information architecture (composer, glass-box, conclusion-first dossier, watchlist, feed, dossier library, drill-in) carries over from the mock; only the visual language is this professional slate/blue system, not the warm Ponder one.

---

*Codified 2026-07-01 via ui-ux-pro-max; finalized 2026-07-02 folding in frontend-design + design-taste-frontend review (Geist + Newsreader + Geist Mono, liquid-glass, tactile press, mono-data, full interactive states). Supersedes the earlier Ponder-based and Inter-based drafts. This is the locked implementation source of truth; the five mocks in this folder are its rendered reference.*
