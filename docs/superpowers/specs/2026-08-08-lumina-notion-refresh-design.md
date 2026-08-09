# LUMINA visual refresh on the Notion reference

Status: approved 2026-08-08.
Scope: visual refresh only. No information architecture changes, no new views, no copy rewrites.

## Why

LUMINA's current light system was locked in `docs/design/SONNY_DASHBOARD_DESIGN.md` (slate `#F6F8FB`, blue-700 `#1D4ED8`).
It works, but it has drifted: an untokenized teal `#2f9e8f` acts as a second structural accent, elevation is applied to every card rather than to things that genuinely float, and heading weight and tracking are looser than the system claims.

The reference for this refresh is the Notion design analysis at `https://getdesign.md/notion/design-md`, obtained via `npx getdesign@latest add notion`.

Notion was chosen over the Cohere analysis (`https://getdesign.md/cohere/design-md`) for three reasons.
The Notion document ships application primitives LUMINA actually has - a sidebar nav row with an active indicator, a data-table cell, a modal surface, a toast, an empty state - where the Cohere document covers only marketing surfaces such as announcement bars, trust-logo strips, and blog filter chips.
Notion enforces exactly one structural accent, which matches the discipline LUMINA already claims, where Cohere runs three.
Notion defines depth as a hairline plus a near-transparent layered shadow, which is the elevation philosophy LUMINA already documents.

## Secondary reference: Figma

The Figma design analysis (`https://getdesign.md/figma/design-md`) was evaluated as a co-primary reference and rejected as one.
The two systems conflict on every structural axis: Notion sets a warm canvas and explicitly forbids full pages on clinical white, where Figma is built on pure white; Notion's single accent is blue, Figma's is black; Notion carries a four-step gray text ramp, Figma forbids mid-gray text outright; Notion's display type is weight 700, Figma's is 320 to 340, lighter than its own body.
Adopting both would produce an incoherent system rather than a richer one.

Figma's identity is its full-viewport pastel color-block sections. That is the one element LUMINA categorically cannot take, for the same reason the Notion sticker palette was cut.

Three things are adopted from it, none of which conflict with Notion.

**Monospace tracking.** Figma scopes its mono face to eyebrows and captions only, uppercase, with positive letter-spacing. Notion has no monospace at all, so the Geist Mono carve-out had no reference support. Figma supplies both the values and the confirmation that a narrowly scoped mono label face is a real pattern.

**A fixed weight set.** Figma names its permitted weights and bans intermediates. Adopted as a governance rule.

**Flat structural surfaces.** Figma uses no shadows and lets structure carry depth. This is a second independent source for the flat-by-default card decision below.

## Precedence note

The canonical `Design Language.md` manual specifies a dark-first system with accent `#6f9bff`, and states that it outranks any external palette.
This spec deviates from that manual, with explicit owner sign-off given on 2026-08-08.
The deviation is scoped to LUMINA only and does not amend the manual.

## Carve-outs

Three parts of the Notion system are explicitly not adopted, because they would remove meaning from a due-diligence instrument.

**Monospace is kept.**
Notion states the system has "no serif, no monospace display face."
LUMINA sets grounded identifiers and figures in Geist Mono - accession numbers, gene symbols, H-scores, citation identifiers.
Setting a citation identifier in body type would make a grounded value indistinguishable from prose.

**The serif is kept, scoped tighter.**
Newsreader survives in exactly one role: the executive read, the conclusion prose that represents a considered human finding.
Every other current serif use moves to Geist at the display scale below.
This reduces the serif's footprint substantially while preserving the one place it earns its keep.

**The semantic ramp is kept.**
Notion's marketing surfaces expose no error or success palette and carry status through a decorative sticker palette instead.
LUMINA's green, amber, and red carry section confidence in a report that an investment committee reads.
That is meaning, not decoration, so the existing `go` / `watch` / `nogo` tokens are unchanged.

## Colors

| Role | Current | Target | Source |
|---|---|---|---|
| page canvas | `#F6F8FB` | `#f6f5f4` | Notion `canvas-soft` |
| surface | `#FFFFFF` | `#FFFFFF` | unchanged |
| subtle / hover row | `#F1F5F9` | `#efedeb` | derived |
| hairline | `#E6EBF2` | `#e6e6e6` | Notion `hairline` |
| borderSoft | `#EEF2F7` | `#f0f0f0` | derived |
| ink | `#0F172A` | `rgba(0,0,0,0.95)` | Notion `ink` at documented alpha |
| ink-secondary | `#475569` | `#31302e` | Notion `ink-secondary` |
| ink-muted | `#5F6D80` | `#615d59` | Notion `ink-muted` |
| ink-faint | - | `#a39e98` | Notion `ink-faint`, restricted (see below) |
| primary | `#1D4ED8` | `#0075de` | Notion `primary` |
| primary pressed | `#1E40AF` | `#005bab` | Notion `primary-active` |
| night band | - | `#213183` | Notion `secondary`, defined but unused (see below) |
| go / watch / nogo | `#16A34A` / `#D97706` / `#DC2626` | unchanged | carve-out |

Two values are derived rather than quoted, because the Notion document does not define them.
`subtle` `#efedeb` is one warm step below the page canvas, for hover rows and quiet panels that must read as recessed against white cards.
`borderSoft` `#f0f0f0` is the internal divider inside a card, lighter than the card's own outer border.
Both are marked derived so a later reviewer does not mistake them for reference values.

### Contrast restriction on `ink-faint`

The Notion document assigns `#a39e98` to "captions, metadata, placeholder text."
On the `#f6f5f4` canvas that pair measures roughly 2.6:1 and fails WCAG AA.
The current `tailwind.config.js` already carries a comment recording that this exact class of bug was fixed once before, when `textTertiary` was raised off `#94A3B8` at about 2.4:1.

`#a39e98` is therefore permitted for placeholder text inside form fields only.
All metadata, captions, timestamps, and micro labels use `ink-muted` `#615d59`.
Every new text-on-surface pair is measured before the PR lands; a pair below 4.5:1 for body or 3:1 for large text does not ship.

### Deletions

`#2f9e8f` is removed. It appears nine times in `src`, in no token file, and functions as a second structural accent, which both the Notion reference and LUMINA's own documentation forbid.

The Notion sticker palette - `accent-sky`, `accent-purple`, `accent-pink`, `accent-orange`, `accent-teal`, `accent-green`, `accent-brown` - is not adopted in any form.
Decorative multi-color is the wrong register for a tool read by skeptical scientists and an investment committee.

## Typography

Geist takes the role Notion assigns to NotionInter, its tuned cut of Inter.
No new font is loaded; Geist is already the body family and keeps LUMINA aligned with the portfolio.

Headings move to weight 700 with explicit negative tracking. They currently sit at 600 with looser tracking, which reads softer than the system claims.

| Token | Size | Weight | Line height | Tracking | Family |
|---|---:|---:|---:|---:|---|
| heading-1 | 40px | 700 | 1.10 | -1px | Geist |
| heading-2 | 26px | 700 | 1.23 | -0.625px | Geist |
| heading-3 | 22px | 700 | 1.27 | -0.25px | Geist |
| title | 20px | 600 | 1.40 | -0.125px | Geist |
| body | 14px | 400 | 1.50 | 0 | Geist |
| caption | 12px | 400 | 1.43 | 0 | Geist |
| eyebrow | 11px | 600 | 1.35 | 0.2em, uppercase | Geist Mono |
| caption-label | 12px | 400 | 1.30 | 0.05em, uppercase | Geist Mono |
| identifier / figure | inherit | 400 | inherit | 0 | Geist Mono |
| executive read | 16px | 400 | 1.6 | 0 | Newsreader |

**Correction made during implementation.**
This table originally carried Figma's absolute tracking values, `+0.54px` on the eyebrow and `+0.60px` on the caption.
Those are measured on an 18px face. Letter-spacing in absolute pixels does not transfer across font sizes, and at our 11px eyebrow `+0.54px` works out to 0.049em - roughly a quarter of the shipped 0.2em.

The canonical `Design Language.md` specifies 0.2em to 0.3em for eyebrows, LUMINA already ships 0.2em, and that wide-tracked uppercase mono label is a signature of the interface.
Trading it away on a value that does not transfer would have been a bad exchange, so the eyebrow keeps 0.2em.
What survives from Figma is the part that does transfer: mono is scoped to eyebrows and captions, uppercase, with positive tracking.
`caption-label` is set at 0.05em, tight enough to read as a distinct tier below the eyebrow.

`caption-label` covers micro labels, table column headers, and metadata keys - short label strings.
Descriptive caption text that reads as a sentence stays in `caption` at 12px Geist, sentence case.
Uppercasing a sentence would cost legibility for no gain.

### Permitted weights

Only 400, 500, 600, and 700. Intermediate weights are not used anywhere.
This is a governance rule adopted from the Figma reference: a fixed weight set is what prevents weight drift across 59 component files, which is how the current 600-where-the-system-says-700 inconsistency arose.

Body stays at 14px rather than Notion's 15px.
LUMINA is an instrument with dense list surfaces - watchlist rows, feed rows, evidence tables - where a marketing site's reading rhythm would cost visible rows.
This is a deliberate deviation, recorded so it is not later read as an oversight.

The eyebrow stays in Geist Mono uppercase rather than moving to Notion's 12px/600 sans eyebrow. This follows from the monospace carve-out.

## Radius

The Tailwind `borderRadius` scale is remapped once in `tailwind.config.js` rather than editing the 46 files that use `rounded-*` classes.

```
sm       4px
DEFAULT  5px
md       8px
lg       12px
xl       16px
full     9999px
```

CSS custom properties follow: `--radius-card` moves 14px to 12px, `--radius-inset` moves 10px to 8px.

The sixteen arbitrary `rounded-[10px]` values are replaced with `rounded-md`.
The two `rounded-[14px]` and one `rounded-[9px]` values are replaced with `rounded-lg` and `rounded-md` respectively.

Form fields take `rounded-sm` at 4px. Notion is explicit that inputs stay tight and never take a pill radius.
This covers the search input, select controls, the custom-answer field, and the URL input.

**One documented exception: the research composer.**
`.composer-shell` at `src/index.css:125` keeps its 26px radius.
It is not a form field in the ordinary sense; it is the primary affordance of the product, and its soft silhouette is what makes the home surface legible as a place to start.
Flattening it to 4px would cost the home screen its one clear entry signal in exchange for consistency nobody looking at the screen would notice.
This is the only radius exception in the system. A second one is a spec violation.

Pill radius `rounded-full` is reserved for the single highest-priority action on a surface, plus status dots and avatars.
Notion's own rule places nav and utility buttons at 8px; in an application nearly every button is a utility button, so `rounded-md` is the default button shape.

## Elevation

Elevation flips from "every card casts a shadow" to "a hairline is the default, and shadow means the thing genuinely floats."

| Level | Treatment | Applies to |
|---|---|---|
| 0 flat | 1px `#e6e6e6`, no shadow | default cards on the page canvas (Notion and Figma agree here) |
| 1 soft | four-stop near-transparent stack | the research composer, floating panels, focused inputs |
| 2 elevated | five-stop stack ending near `rgba(0,0,0,0.05) 0 23px 52px` | modals, popovers, the search palette |

The current `.surface-card` component class applies `--shadow-card` unconditionally. It moves to hairline-only, and a separate `.surface-card-floating` carries level 1.

## Night band - defined, not used

Notion's `#213183` deep indigo band is its single inverted hero moment.
LUMINA has no equivalent surface today: the welcome heading in `SonnyResearchDashboard.tsx` is centered type on the page canvas, not a full-bleed band.
Introducing one would be new layout, which this refresh is not scoped to do.

The token is therefore defined in the config and left unused.
If a hero band is wanted later it gets its own decision, and Notion's rule holds: one use, never a repeated rhythm.

## Font bug found during survey

`src/components/research/SonnyResearchDashboard.tsx:55` sets the "Welcome to Sonny" heading with `font-serif`.
Newsreader is registered in `tailwind.config.js` as `font-display`, not `font-serif`, so this class resolves to Tailwind's built-in serif stack and the most prominent heading on the home surface has never rendered in Newsreader.
It is the only `font-serif` occurrence in `src`; the other ten serif headings correctly use `font-display`.

Under this spec that heading moves to Geist 700 anyway, so PR 3 replaces the class rather than repointing it.
Recorded here because it explains why the current home headline does not match the ten other serif headings.

## Delivery

Three pull requests, each of which leaves the application in a coherent state.

**PR 1 - tokens.**
`tailwind.config.js` and `src/index.css` only.
Color tokens, radius scale, type scale with explicit tracking, and the three elevation levels.
Because the application is token-driven, every surface shifts together.

**Correction: PR 1 and PR 2 ship together.**
This section originally claimed each PR leaves the application coherent.
That is false for PR 1 in isolation, and the hazard sweep is what showed it: a second cool-neutral palette (`#F8FAFC`, `#FBFBFA`, the home-canvas gradient) lives in the component layer, so shipping the warm canvas without PR 2 would leave cool panels sitting on a warm ground.
They are two commits on one branch and one review.
PR 3 remains separate and genuinely is independent.

**PR 2 - de-hardcode.**
Replace the roughly 120 hardcoded hex values in `src` with token references, and delete `#2f9e8f`.
The concentrations are `#E6EBF2` at 14 occurrences, `#FFFFFF` at 11, `#1D4ED8` at 6, and `#0F172A` at 6.
Also replaces the arbitrary radius values listed above.

**PR 3 - surface pass.**
Density, hierarchy, and spacing across the main views.
This is where heading weight, row rhythm, and the flat-by-default card rule are actually judged on screen.

The serif audit resolved to three verdicts rather than one:

- **Conclusion prose keeps the serif**, via `.t-exec`. That is the executive read in `ResearchDossier.tsx` and the "Sonny's read" digest in `IntelligenceFeed.tsx`. Both are considered findings the reader stops and reads. The role is defined by what the text is, not by which component it lives in.
- **Headings, wordmarks and taglines move to Geist.** The dossier section title, the `LandingAnimation` wordmark, and its tagline.
- **A truncated row teaser moves to Geist body.** The two-line "Sonny's read" snippet inside a feed row is dense list content, not a published finding, and setting it in serif made a scannable row read as prose.

The `.t-meta.font-display` compound rule is deleted. No component references `font-display` or `font-serif` any more.

The feed digest card also lost its accent wash (`bg-primary/[0.025]`, `border-primary/15`).
A full card painted in the accent is a structural use of a colour the reference reserves for actions.
It is now a white card on the warm canvas, with hierarchy carried by the serif, the eyebrow and the icon.

## Migration hazards

A read-only inventory sweep (Codex, 2026-08-08) counted 108 hardcoded hex occurrences across 20 files under `src/`, 31 distinct hex spellings, and 19 arbitrary pixel-radius classes.
It also surfaced six hazards that a naive find-and-replace would walk straight into.

**Hex-only replacement misses the old primary.**
The current blue also exists as `--color-primary: 29 78 216` in `src/index.css:6`, as the array `[29, 78, 216]` in `CorrelationHeatmap.tsx:7`, and as `rgb()` / `rgba()` literals in the figure components and several shadows.
PR 2 must sweep the decimal-triplet and `rgba()` forms, not just `#1D4ED8`.

**Hex-only replacement misses the teal.**
Beyond the nine `#2f9e8f` hits, matching teal survives as `rgba(47, 158, 143, ...)` at `GatePlot.tsx:216,244,247,283`.
`GatePlot.tsx:493` also describes the control in accessible copy as "teal gate handles" - that string changes with the color, or a screen reader user is told to look for something that is not there.

**`GatePlot` is a canvas and ignores the token layer.**
`GatePlot.tsx:70,80,89,98,261` set colors through `fillStyle` and `strokeStyle` in JavaScript.
No change to `tailwind.config.js` or `index.css` reaches them. This file needs its own explicit constants.

**A second structural neutral palette is already in the codebase.**
`#F8FAFC` at `index.css:88,118,318`, the `#F7F8FA` to `#EEF1F6` home-canvas gradient at `index.css:338`, and `#FBFBFA` on the sidebar at `Sidebar.tsx:259` are cool neutrals outside the token set.
Left in place they will visibly fight the warm `#f6f5f4` canvas. They are part of PR 2, not optional cleanup.

**`.surface-card` carries two different meanings.**
Nearly every usage is a static page card, but `IntelligenceFeed.tsx:1455` uses the same class for an absolutely-positioned export dropdown.
Removing the shadow from `.surface-card` globally would flatten that dropdown onto the content behind it. The dropdown needs the level 2 utility before the base class goes flat.

**Heatmap text contrast is computed against the old ink.**
`CorrelationHeatmap.tsx:25` picks white or `#0f172a` per cell using a 4.5:1 threshold.
Moving ink to `rgba(0,0,0,0.95)` changes the composited result, so the threshold has to be revalidated against every generated cell color rather than assumed to still hold.

### Two live bugs found during the sweep

`shadow-card-hover` is used at `AnalysisPlan.tsx:126` and `WorkbookReport.tsx:405`, but `tailwind.config.js` defines only `boxShadow.card`.
The CSS custom property `--shadow-card-hover` exists but does not create a Tailwind utility, so both native dialogs currently render with no shadow at all.
PR 1 defines the level 2 utility and these two dialogs pick it up.

`src/assets/react.svg` is dormant - no import found. It carries `#00D8FF`, which is why an unexplained cyan appears in a hex sweep. Not part of this work.

## Chart series colors

Deleting the teal breaks a four-series chart.
`SubsetComposition.tsx:4-7` sets its series to the primary blue, the teal, gray `#64748b`, and `#D97706` - which is the semantic caution amber, so the "unswitched memory" category currently renders in the color this product uses to mean risk.

PR 2 does the minimum that unblocks the token swap:
the teal series gets a distinguishable neutral replacement, and the fourth series moves off the semantic amber token so a data category stops reading as a warning.

A proper categorical ramp is deliberately out of scope here.
Chart color is a different discipline from interface chrome and needs its own accessibility pass, including a colorblind-safe check.
That later piece of work covers `SubsetComposition.tsx`, plus the saturated Apple system colors `#0A84FF`, `#30D158`, `#FF453A`, and `#FF9F0A` sitting untokenized in `src/constants/index.ts:889-892` and `src/constants/her2Baseline.ts:676-679`.

## Accent text fails AA on the canvas

Found by the contrast gate during implementation, not predicted by the reference.

`#0075de` measures 4.19:1 as body text on the `#f6f5f4` canvas. That fails WCAG AA.
It clears only on pure white, at 4.57:1, which is why Notion's own site gets away with it - their links sit on white cards, not on the warm ground.
LUMINA puts accent text directly on the canvas in several places.

The fix is a text-only variant, `primaryText` `#0068c6`, which clears every ground in the system: page 5.08:1, subtle 4.74:1, surface 5.53:1.
Fills, dots, borders and rings keep the vivid `#0075de`; anything set in type uses the darker one.

This is wired through Tailwind's `textColor` key rather than by editing components, so `text-primary` resolves to `#0068c6` while `bg-primary` stays `#0075de`.
The 25 files that already say `text-primary` became compliant without being touched.

## Derived primary tint

Selected and active states currently use `#EFF6FF`, the blue-50 tint of the old primary, at `DossiersLibrary.tsx:146`.
Notion defines no tint for its accent, so one is derived: `#ebf4fc`, which is `#0075de` at 8 percent on white.
Marked derived, same as `subtle` and `borderSoft`.

## Verification

Each PR is verified before it is called done.

1. Screenshots at 1440, 768, and 390 pixels wide, before and after, for every surface the PR touches.
2. Every new text-on-surface pair measured for contrast. Body below 4.5:1 or large text below 3:1 blocks the PR.
3. `ProjectWorkspace.test.tsx`, `ResearchDossier.test.tsx`, and `researchTemplateState.test.ts` pass.
4. TypeScript check and production build clean.
5. For PR 2, a grep confirms zero remaining occurrences of the removed values rather than a claim that they were replaced.
   The grep covers hex, `rgb()`, `rgba()`, and decimal-triplet forms, because the sweep showed the old primary and the teal both survive in non-hex spellings.
6. The `GatePlot` canvas is checked visually, not by grep. Its colors live in JavaScript and no config change reaches them.

## Out of scope

Information architecture, the chat-first framing of the home surface, dark mode, the broken authentication on the model routes, and any copy changes.
The categorical chart palette is also out of scope beyond the minimum described above.
Each is real work and each is tracked separately.
