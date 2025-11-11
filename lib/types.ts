export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  readingTime: string;
  publishedDate: string;
  thumbnail: string;
  tags: string[];
  featured: boolean;
}

export interface TOCItem {
  id: string;
  title: string;
  level: number;
}

export interface ChartData {
  [key: string]: any;
}

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string[];
}
