import { Metadata } from "next";
import { SEOProps } from "@/lib/types";

export function generateSEO({
  title,
  description,
  canonical,
  ogImage = "/images/og-default.jpg",
  keywords = [],
}: SEOProps): Metadata {
  const baseTitle = "Quan Ho | Biotech Investment Analysis";
  const fullTitle = title === baseTitle ? title : `${title} | ${baseTitle}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      "biotech",
      "investment analysis",
      "venture capital",
      "private equity",
      "drug discovery",
      "due diligence",
      ...keywords,
    ],
    authors: [{ name: "Quan Ho" }],
    openGraph: {
      title: fullTitle,
      description,
      images: [{ url: ogImage }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonical || undefined,
    },
  };
}

// Structured data generator for articles
export function generateArticleStructuredData({
  title,
  description,
  publishedDate,
  slug,
}: {
  title: string;
  description: string;
  publishedDate: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: "Quan Ho",
      url: "https://quanho.io/about",
    },
    datePublished: publishedDate,
    url: `https://quanho.io/portfolio/${slug}`,
  };
}
