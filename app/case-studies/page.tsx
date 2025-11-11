import { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/shared/Section";
import { getAllCaseStudies } from "@/lib/mdx";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "Business Intelligence Case Studies",
  description: "Translating biotech complexity into clear insights. Data-driven analyses combining scientific expertise with business strategy.",
  keywords: ["biotech", "business intelligence", "case studies", "competitive analysis", "market research"],
});

export default function CaseStudiesPage() {
  const caseStudies = getAllCaseStudies();

  return (
    <>
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Business Intelligence Case Studies
          </h1>
          <p className="text-xl text-gray-700">
            Translating biotech complexity into clear insights
          </p>
        </div>
      </Section>

      <Section background="white">
        <div className="max-w-5xl mx-auto">
          {/* Project Grid */}
          <div className="grid grid-cols-1 gap-8">
            {caseStudies.map((study, index) => (
              <Link
                key={study.frontmatter.slug}
                href={`/case-studies/${study.frontmatter.slug}`}
                className="card group hover:border-primary-200 border-2 border-transparent transition-all"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Thumbnail */}
                  <div className="md:w-64 h-48 flex-shrink-0 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 text-5xl font-bold">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Category & Meta */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                        {study.frontmatter.category}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {study.readingTime}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {study.frontmatter.publishedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {study.frontmatter.title.split(":")[0]}
                    </h2>

                    {/* Subtitle */}
                    {study.frontmatter.subtitle && (
                      <p className="text-lg text-gray-600 mb-3 italic">
                        {study.frontmatter.subtitle}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 mb-4">
                      {study.frontmatter.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {study.frontmatter.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Read More Arrow */}
                    <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                      Read Case Study
                      <svg
                        className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
