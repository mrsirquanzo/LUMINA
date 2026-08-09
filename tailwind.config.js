/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Notion-reference role tokens (see docs/superpowers/specs/2026-08-08-lumina-notion-refresh-design.md) ---
        page: '#f6f5f4',          // warm paper canvas
        surface: '#FFFFFF',       // cards, sidebar, inputs
        subtle: '#efedeb',        // derived: hover rows, quiet panels
        hairline: '#e6e6e6',      // 1px structure
        borderSoft: '#f0f0f0',    // derived: dividers inside a card
        ink: 'rgba(0,0,0,0.95)',  // headings, key figures
        inkSecondary: '#31302e',  // body copy, metadata
        inkMuted: '#615d59',      // supporting copy, micro labels
        inkFaint: '#a39e98',      // PLACEHOLDER TEXT ONLY - fails AA as metadata on page
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          pressed: '#005bab',
          tint: '#ebf4fc',        // derived: #0075de at 8% on white
        },
        // Flat aliases. The nested keys above generate `bg-primary-pressed`;
        // these keep `bg-primaryPressed` / `bg-primaryTint` valid too, so a
        // camelCase usage cannot silently compile to no style at all.
        primaryPressed: '#005bab',
        primaryTint: '#ebf4fc',
        // Accent text on a light ground. #0075de is an AA fail as body text on the
        // warm page canvas (4.19:1) - it only clears on pure white. This darkened
        // variant clears on page (5.08:1), subtle (4.74:1) and surface (5.53:1).
        // Fills and dots use `primary`; anything set in type uses `primaryText`.
        primaryText: '#0068c6',

        // --- Legacy names kept as aliases so the component layer keeps compiling ---
        background: '#f6f5f4',
        surfaceHighlight: '#efedeb',
        surfaceElevated: '#FFFFFF',
        textPrimary: 'rgba(0,0,0,0.95)',
        textSecondary: '#31302e',
        textTertiary: '#615d59',
        border: '#e6e6e6',
        info: '#0075de',

        // --- Semantic ramp: carries section confidence, NOT decoration. Unchanged. ---
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        go: { DEFAULT: '#16A34A', text: '#15803D', tint: '#DCFCE7' },
        watch: { DEFAULT: '#D97706', text: '#B45309', tint: '#FEF3C7' },
        nogo: { DEFAULT: '#DC2626', text: '#B91C1C', tint: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontWeight: {
        // Fixed weight set, adopted from the Figma reference. Intermediates are not used.
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        // Notion scale. Remapped here rather than editing the 46 files that use rounded-*.
        none: '0px',
        sm: '4px',
        DEFAULT: '5px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '16px',
        '3xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        // Level 1. Notion's barely-there stack: many near-transparent layers, never a hard cast.
        // For things that genuinely float, not for static cards.
        card: '0 0.175px 1.041px rgba(0,0,0,0.01), 0 0.8px 2.925px rgba(0,0,0,0.02), 0 2.025px 7.847px rgba(0,0,0,0.027), 0 4px 18px rgba(0,0,0,0.04)',
        // Level 2. Modals, popovers, dropdowns.
        elevated: '0 0.5px 2px rgba(0,0,0,0.012), 0 2px 6px rgba(0,0,0,0.02), 0 5px 14px rgba(0,0,0,0.03), 0 12px 28px rgba(0,0,0,0.04), 0 23px 52px rgba(0,0,0,0.05)',
      },
      // `text-primary` diverges from `bg-primary` on purpose. The vivid #0075de
      // is an AA fail as body text on the warm canvas; the darkened variant
      // clears every ground we use. Splitting it here means the 25 files that
      // already say `text-primary` become compliant without being touched.
      textColor: {
        primary: '#0068c6',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--color-primary) / 0.5)',
        success: 'rgba(22, 163, 74, 0.5)',
        warning: 'rgba(217, 119, 6, 0.5)',
        danger: 'rgba(220, 38, 38, 0.5)',
        info: 'rgba(0, 117, 222, 0.5)',
      },
    },
  },
  plugins: [],
}
