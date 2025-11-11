import Link from "next/link";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { getFeaturedProjects } from "@/lib/projects";

export default function FeaturedProjects() {
  const projects = getFeaturedProjects();

  return (
    <Section>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Investment Analysis Portfolio
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Deep-dive analyses combining scientific expertise with financial acumen
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className="card group hover:border-primary-200 border-2 border-transparent transition-all"
            >
              {/* Thumbnail Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-primary-600 text-4xl font-bold">
                  {project.title.charAt(0)}
                </span>
              </div>

              {/* Category */}
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
                {project.category}
              </span>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2 group-hover:text-primary-700 transition-colors">
                {project.title.split(":")[0]}
              </h3>

              {/* Description */}
              <p className="text-gray-700 mb-4 line-clamp-3">
                {project.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Read More */}
              <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                Read Analysis
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
            </Link>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button href="/portfolio" variant="secondary">
            View All Projects
          </Button>
        </div>
      </div>
    </Section>
  );
}
