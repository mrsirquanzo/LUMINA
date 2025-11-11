import { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "absci-deep-dive",
    title: "Absci Corporation: AI-Powered Antibody Discovery Investment Analysis",
    subtitle: "Evaluating the Commercial Viability of Zero-Shot Generative AI for Antibody Design",
    description: "Deep-dive investment analysis of Absci's generative AI platform for antibody discovery, including technical assessment, market sizing, financial modeling, and valuation.",
    category: "Company Deep Dive",
    readingTime: "25 min",
    publishedDate: "January 2025",
    thumbnail: "/images/absci-thumbnail.jpg",
    tags: ["AI Drug Discovery", "Antibody Discovery", "Technology Assessment", "Investment Thesis"],
    featured: true,
  },
  {
    slug: "multispecific-antibodies",
    title: "The Multispecific Antibody Landscape: Investment Implications",
    subtitle: "Comparing Platform Technologies and Identifying Winners in the Next Wave of I-O",
    description: "Comprehensive technology assessment of competing multispecific antibody platforms, analyzing format differentiation, clinical validation, and investment opportunities.",
    category: "Technology Assessment",
    readingTime: "22 min",
    publishedDate: "January 2025",
    thumbnail: "/images/multispecific-thumbnail.jpg",
    tags: ["Bispecific Antibodies", "Immuno-Oncology", "Platform Comparison", "Market Analysis"],
    featured: true,
  },
  {
    slug: "immunocore-diligence",
    title: "Immunocore Holdings: Pre-Investment Diligence Memorandum",
    subtitle: "Technical and Financial Assessment of ImmTAC Platform and Commercial Trajectory",
    description: "Investment memorandum analyzing Immunocore's TCR-based platform, clinical validation, market opportunity, and valuation with buy/hold/pass recommendation.",
    category: "Diligence Memo",
    readingTime: "28 min",
    publishedDate: "January 2025",
    thumbnail: "/images/immunocore-thumbnail.jpg",
    tags: ["TCR Therapy", "Due Diligence", "Financial Modeling", "Valuation"],
    featured: true,
  },
];

export function getFeaturedProjects(): Project[] {
  return projects.filter(p => p.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find(p => p.slug === slug);
}
