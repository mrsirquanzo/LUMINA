import Link from 'next/link';
import { MDXContent } from '@/lib/mdx';

interface AIProjectCardProps {
  project: MDXContent;
}

export default function AIProjectCard({ project }: AIProjectCardProps) {
  const { slug, title, subtitle, description, tags, projectType, techStack } = project.frontmatter;

  // Filter tech stack to show only LLM models on cards
  const llmModels = techStack?.filter(tech =>
    tech.includes('Claude') ||
    tech.includes('Gemini') ||
    tech.includes('Perplexity') ||
    tech.includes('GPT') ||
    tech.includes('Sonar')
  ) || [];

  // Icon based on project type
  const getIcon = () => {
    if (projectType === 'ai-agent') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    }
    if (projectType === 'multi-agent') {
      // Multi-agent icon (connected nodes)
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    // Design icon
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    );
  };

  const getBadgeColor = () => {
    if (projectType === 'ai-agent') {
      return 'bg-accent-100 text-accent-700';
    }
    if (projectType === 'multi-agent') {
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-purple-100 text-purple-700';
  };

  const getCategoryLabel = () => {
    if (projectType === 'ai-agent') return 'AI Agent';
    if (projectType === 'multi-agent') return 'Multi-Agent';
    return 'Design';
  };

  return (
    <Link href={`/ai-projects/${slug}`}>
      <div className="card h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
        {/* Header with icon and badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-primary-200 transition-colors">
            {getIcon()}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor()}`}>
            {getCategoryLabel()}
          </span>
        </div>

        {/* Title and subtitle */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 italic mb-3">
            {subtitle}
          </p>
        )}

        {/* Description */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tech stack - LLM models only */}
        {llmModels && llmModels.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {llmModels.map((tech) => (
                <span
                  key={tech}
                  className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Read more indicator */}
        <div className="mt-4 flex items-center text-primary-600 font-medium group-hover:text-primary-700">
          <span>View Project</span>
          <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
