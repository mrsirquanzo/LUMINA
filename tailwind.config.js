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
        textTertiary: '#5F6D80', // was #94A3B8 (~2.4:1, fails WCAG AA); ~4.95:1 on the page ground
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
