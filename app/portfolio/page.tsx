import { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/shared/Section";
import { projects } from "@/lib/projects";
import { generateSEO } from "@/components/layout/SEO";

export const metadata: Metadata = generateSEO({
  title: "Investment Analysis Portfolio",
  description: "Deep-dive biotech investment analyses combining scientific expertise with financial modeling. Company evaluations, technology assessments, and due diligence memoranda.",
  keywords: ["biotech portfolio", "investment analysis", "due diligence", "technology assessment"],
});

export default function PortfolioPage() {
  return (
    <>
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Investment Analysis Portfolio
          </h1>
          <p className="text-xl text-gray-700">
            Deep-dive analyses that bridge cutting-edge science and investment strategy
          </p>
        </div>
      </Section>

      <Section background="white">
        <div className="max-w-5xl mx-auto">
          {/* Project Grid */}
          <div className="grid grid-cols-1 gap-8">
            {projects.map((project, index) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
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
                        {project.category}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {project.readingTime} read
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {project.publishedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {project.title.split(":")[0]}
                    </h2>

                    {/* Subtitle */}
                    {project.subtitle && (
                      <p className="text-lg text-gray-600 mb-3 italic">
                        {project.subtitle}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 mb-4">
                      {project.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Read More */}
                    <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                      Read Full Analysis
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
