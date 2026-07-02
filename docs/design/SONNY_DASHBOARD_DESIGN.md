# Design System: Sonny Intelligence Dashboard

Implementation source of truth for the Sonny dashboard in LUMINA.
Professional, industry-standard, evidence-first.
Synthesized from the ui-ux-pro-max design intelligence (data-dense dashboard pattern, trust-blue palette, dashboard typography), tuned for a biotech due-diligence tool read by skeptical senior scientists and BD/investment committees.

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

Neutrals (slate ramp):
- **Page** (#F8FAFC, slate-50) - app background
- **Surface** (#FFFFFF) - cards, sidebar, composer, inputs
- **Subtle** (#F1F5F9, slate-100) - hover rows, quiet panels (KOL, quotes)
- **Border** (#E2E8F0, slate-200) - 1px hairline structure. Border-driven separation over heavy shadows.
- **Primary text** (#0F172A, slate-900) - headings, verdict, key figures
- **Secondary text** (#475569, slate-600) - body, metadata (minimum for body; never lighter)
- **Muted text** (#94A3B8, slate-400) - captions, placeholders, micro labels ONLY (never body)

Primary (single accent):
- **Primary / CTA** (#1D4ED8, blue-700) - primary buttons, active nav, links, focus rings. Hover #1E40AF.
- **Primary tint** (#EFF6FF, blue-50) - active nav fill, selected states.

Semantic status (functional only, never decorative) - these carry the GO/WATCH/NO-GO meaning:
- **Positive / GO** (#16A34A, green-600; tint #DCFCE7) - go verdict, supported, good developability
- **Caution / WATCH** (#D97706, amber-600; tint #FEF3C7) - watch verdict, caution, moderate risk
- **Critical / NO-GO** (#DC2626, red-600; tint #FEE2E2) - no-go verdict, severe risk, refuted

Verdict pill = the single largest, boldest signal on a run or dossier: GO green fill / WATCH amber fill / NO-GO red fill, white text.

Contrast: all text meets WCAG AA (4.5:1). Color is never the only signal - RAG dots always pair with a text label.

Banned: purple/indigo "AI" accents, neon, outer glows, gradient text, oversaturated fills, pure black (#000000). One accent only (blue); green/amber/red are semantic tokens, not extra brand accents.

## 3. Typography

Weight-driven hierarchy on a clean sans, with monospace reserved for identifiers. No serif, no code-face headings.

- **UI / everything: Inter** (`font-sans`).
Headings, body, labels, buttons, the composer, the executive read.
Hierarchy comes from weight (400/500/600/700) and color, not oversized type. Headings track slightly tight (-0.01 to -0.02em).
(Inter is the industry-standard neutral for this class of tool and is already in LUMINA. Geist is an acceptable swap for extra character; do not use Poppins - too consumer-friendly for this audience.)
- **Identifiers / data: JetBrains Mono** (`font-mono`).
Reserved for identifiers and sequences ONLY: PMID / NCT / ENSG / patent no. / SEQ IDs / antibody sequences, and tabular figures where alignment matters.
This is the "grounded and precise" signal - it visually marks every real, traceable token.
- **Micro labels:** Inter 500-600, 11-12px, 0.04-0.06em tracking, uppercase, muted slate - GLASS-BOX TRACE, WATCHLIST, KOL & INSTITUTIONAL TERRAIN.

Scale (desktop): display/verdict 28-32px/700; H1 22px/600; H2 18px/600; body 15px/400 (line-height 1.6, measure capped ~70ch); small 13px; micro 11px.

Banned: mono or "code" fonts as headings; serif in this UI; Inter used at hairline weights for body; hierarchy by size alone.

## 4. Component Stylings

Restrained elevation, hairline borders, smooth 150-250ms transitions, cursor-pointer on everything interactive, visible focus rings.

- **Buttons.** Primary = blue-700 fill, white text, `rounded-lg`; secondary = white + slate-200 border, slate-900 text; ghost = text-only. Hover: darken/tint, no scale-shift, no glow. Disabled during async (loading buttons). Min 44px tap target.
- **Composer.** White surface, `rounded-xl`, slate-200 border that becomes blue-700 on focus (focus ring), subtle shadow. Left upload button opens a menu that routes the file to a skill (Research paper / Patent - extract sequences). Enter to run.
- **Capability cards.** White, slate-200 border, `rounded-xl`, hover = blue-200 border + faint lift. Status line: green dot "Available", amber/bronze dot "Skill - available", muted "Coming soon" (dashed border, reduced opacity). 2-column grid (never a 3-equal-card row).
- **Glass-box trace.** Bordered panel. Steps as a vertical checklist: done = green check, current = blue spinner ring, future = hollow slate ring. Specialists in a 2-column grid, each gaining a RAG dot on completion. Counters (papers / evidence / tools) as quiet KPI chips. Legible and calm - this is the trust surface, not a light show. Log is virtualized/capped.
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

- 150-250ms micro-interactions; `transform`/`opacity` only (never width/height/top/left). Ease-out; no bounce.
- Streaming glass-box: updates arrive throttled (the existing Phase 2 rAF buffer); a subtle pulse marks the live/current status only. Staggered reveal for the trace steps and feed lists (small cascade), not instant mount.
- Honor `prefers-reduced-motion`: disable entrance/spinner animation, render instantly.

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
- Fonts: Inter (already present) + JetBrains Mono (add). Tailwind `fontFamily: { sans: ['Inter', ...], mono: ['JetBrains Mono', ...] }`.
- Encode the palette as Tailwind theme tokens (primary, and semantic go/watch/nogo) so components reference roles, not raw hex.
- Information architecture (composer, glass-box, conclusion-first dossier, watchlist, feed, dossier library, drill-in) carries over from the mock; only the visual language is this professional slate/blue system, not the warm Ponder one.

---

*Codified 2026-07-01 via ui-ux-pro-max, synthesized and corrected for this audience. Supersedes the earlier Ponder-based draft. This is the implementation source of truth.*
