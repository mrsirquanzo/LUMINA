import Link from "next/link";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";
import { getFeaturedProjects } from "@/lib/projects";
import { getAllTechnicalProjects } from "@/lib/mdx";

export default function FeaturedProjects() {
  const projects = getFeaturedProjects();
  const technicalProjects = getAllTechnicalProjects().slice(0, 3); // Show first 3

  return (
    <>
      {/* Business Intelligence Case Studies Section */}
      <Section>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Business Intelligence Case Studies
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Translating biotech complexity into clear insights
            </p>
          </div>

          {/* Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {projects.map((project) => (
              <Link
                key={project.slug}
                href={`/case-studies/${project.slug}`}
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
            <Button href="/case-studies" variant="secondary">
              View All Case Studies
            </Button>
          </div>
        </div>
      </Section>

      {/* AI Projects Section */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Agents & Design Systems
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              AI prototypes and data visualization frameworks
            </p>
          </div>

          {/* Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {technicalProjects.map((project) => {
              const { slug, title, description, projectType, tags } = project.frontmatter;
              const isAI = projectType === 'ai-agent';

              return (
                <Link
                  key={slug}
                  href={`/ai-projects/${slug}`}
                  className="card group hover:border-accent-200 border-2 border-transparent transition-all"
                >
                  {/* Icon/Visual */}
                  <div className={`w-full h-48 bg-gradient-to-br ${isAI ? 'from-accent-100 to-primary-100' : 'from-purple-100 to-pink-100'} rounded-lg mb-4 flex items-center justify-center`}>
                    {isAI ? (
                      <svg className="w-16 h-16 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ) : (
                      <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    )}
                  </div>

                  {/* Category */}
                  <span className={`text-sm font-semibold uppercase tracking-wide ${isAI ? 'text-accent-600' : 'text-purple-600'}`}>
                    {isAI ? 'AI Agent' : 'Design'}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mt-2 mb-2 group-hover:text-accent-700 transition-colors">
                    {title.split(":")[0]}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Read More */}
                  <div className="flex items-center text-accent-600 font-medium group-hover:text-accent-700">
                    View Project
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
              );
            })}
          </div>

          {/* View All CTA */}
          <div className="text-center">
            <Button href="/ai-projects" variant="secondary">
              View All AI Projects
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
