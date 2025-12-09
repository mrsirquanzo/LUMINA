/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1C1C1E',
        surfaceHighlight: '#2C2C2E',
        surfaceElevated: '#3A3A3C',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        },
        success: '#30D158',
        warning: '#FF9F0A',
        danger: '#FF453A',
        info: '#0A84FF',
        textPrimary: '#F5F5F7',
        textSecondary: '#86868B',
        textTertiary: '#636366',
        border: 'rgba(255, 255, 255, 0.05)',
      },
      ringColor: {
        DEFAULT: 'rgb(var(--color-primary) / 0.5)',
        success: 'rgba(48, 209, 88, 0.5)',
        warning: 'rgba(255, 159, 10, 0.5)',
        danger: 'rgba(255, 69, 58, 0.5)',
        info: 'rgba(10, 132, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
