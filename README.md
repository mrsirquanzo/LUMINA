# LUMINA - Biotech Intelligence Dashboard

A modern biotech intelligence dashboard built with React, TypeScript, and Vite, following Apple's Human Interface Guidelines.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **date-fns** for date formatting

## Design System

### Colors
- **Background**: `#000000` (pure black)
- **Surface**: `#1C1C1E` (dark gray)
- **Surface Highlight**: `#2C2C2E`
- **Surface Elevated**: `#3A3A3C`
- **Primary**: CSS variable `--color-primary` (defaults to purple: `191 90 242`)

### Semantic Colors
- **Success**: `#30D158`
- **Warning**: `#FF9F0A`
- **Danger**: `#FF453A`
- **Info**: `#0A84FF`

### Text Colors
- **Primary**: `#F5F5F7`
- **Secondary**: `#86868B`
- **Tertiary**: `#636366`

## Project Structure

```
src/
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   └── scoring.ts        # Scoring algorithms
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles with Tailwind
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

### Type System
Comprehensive TypeScript types for:
- Personas (Scientist, BD)
- Scoring types (Validation, Druggability, Safety, etc.)
- Data interfaces (GWAS, Clinical Trials, Patents, etc.)

### Scoring Algorithms
Utility functions for calculating:
- Overall scores with weighted components
- Validation scores from genetic evidence
- Therapeutic window from expression profiles
- Druggability scores from target characteristics

### Design Principles
- Clean, minimal interface
- Subtle glassmorphism effects
- Custom scrollbar styling
- Smooth animations and transitions
- Accessibility-focused focus states

## Customization

### Primary Color
Change the primary color by updating the CSS variable in `src/index.css`:

```css
:root {
  --color-primary: 191 90 242; /* Purple (RGB values) */
}
```

### Tailwind Configuration
Edit `tailwind.config.js` to customize the theme, colors, and utilities.

## License

Private project
