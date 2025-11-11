# Quan Ho - Biotech Investment Portfolio

Professional portfolio website showcasing deep scientific expertise in biotech investment analysis, due diligence, and technology assessment.

## About

This portfolio demonstrates the intersection of deep scientific knowledge and investment acumen, featuring comprehensive analyses of biotech companies, technology platforms, and investment opportunities.

**Target Audience:** PE/VC investors, BD professionals, biotech hiring managers

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Visualizations:** Recharts, Plotly.js
- **Deployment:** Vercel

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── about/               # About page
│   ├── contact/             # Contact page
│   ├── portfolio/           # Portfolio hub and dynamic project pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── home/               # Homepage sections
│   ├── layout/             # Header, Footer, SEO
│   ├── portfolio/          # Project cards, TOC, navigation
│   ├── shared/             # Reusable components
│   └── visualizations/     # Chart components
├── lib/                     # Utilities and data
│   ├── projects.ts         # Project metadata
│   └── types.ts            # TypeScript types
└── public/                  # Static assets

## Features

### Core Pages
- **Homepage:** Hero section, value propositions, featured projects
- **About:** Personal journey from bench scientist to investor
- **Portfolio:** Showcase of investment analyses
- **Contact:** Professional contact information

### Investment Analysis Projects
1. **Absci Corporation Deep Dive** - AI-powered antibody discovery platform analysis
2. **Multispecific Antibodies** - Technology landscape and investment implications
3. **Immunocore Diligence** - Pre-investment memorandum with financial modeling

### Technical Features
- Responsive design (mobile-first)
- Interactive data visualizations
- SEO optimized with structured data
- Table of contents navigation
- Social sharing buttons
- Fast page loads with static generation

## Design System

### Colors
- **Primary (Blue):** Professional, trustworthy
- **Accent (Teal):** Biotech, scientific
- **Neutrals:** Clean, readable

### Typography
- **Sans-serif:** System fonts for performance
- **Serif:** Georgia for long-form content
- **Monospace:** Code/data displays

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` to see the site.

## Development Roadmap

### Phase 1: Foundation (Completed)
- [x] Next.js setup with TypeScript and Tailwind
- [x] Core page structure (Home, About, Portfolio, Contact)
- [x] Reusable components and layout
- [x] Visualization components

### Phase 2: Content (In Progress)
- [ ] Absci Corporation deep dive analysis
- [ ] Multispecific antibodies technology assessment
- [ ] Immunocore diligence memorandum
- [ ] SEO optimization (sitemap, robots.txt)

### Phase 3: Polish & Deploy
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Domain configuration (QuanHo.io)
- [ ] Analytics integration
- [ ] PDF download functionality

## Deployment

This site is designed to be deployed on Vercel:

1. Push to GitHub repository
2. Import to Vercel
3. Configure custom domain (QuanHo.io)
4. Deploy automatically on push

## Content Strategy

Each investment analysis follows a structured format:
1. Executive Summary
2. Context & Thesis
3. Technical Deep Dive
4. Market Analysis
5. Financial Assessment
6. Risk Analysis
7. Investment Recommendation

## Contact

**Quan Ho**
- Location: Boston, MA
- LinkedIn: [linkedin.com/in/quan-ho](https://www.linkedin.com/in/quan-ho)
- Email: hoquan12@gmail.com

## License

© 2025 Quan Ho. All rights reserved.
