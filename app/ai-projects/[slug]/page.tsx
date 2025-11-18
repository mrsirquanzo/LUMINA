import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Section from '@/components/shared/Section';
import ShareButtons from '@/components/shared/ShareButtons';
import { getAllAIProjects, getMDXContent } from '@/lib/mdx';

interface Props {
  params: {
    slug: string;
  };
}

// Generate static params for all AI projects
export async function generateStaticParams() {
  const projects = getAllAIProjects();
  return projects.map((project) => ({
    slug: project.frontmatter.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getMDXContent('ai-projects', params.slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.frontmatter.title} | Quan Ho`,
    description: project.frontmatter.description,
    keywords: project.frontmatter.tags,
    openGraph: {
      title: project.frontmatter.title,
      description: project.frontmatter.description,
      type: 'article',
    },
  };
}

export default async function AIProjectPage({ params }: Props) {
  const project = getMDXContent('ai-projects', params.slug);

  if (!project) {
    notFound();
  }

  const { title, subtitle, publishedDate, tags, readingTime, projectType, demoUrl, techStack } = project.frontmatter;
  const fullUrl = `https://quanho.io/ai-projects/${params.slug}`;

  // Get category label
  const categoryLabel =
    projectType === 'ai-agent' ? 'AI Agent' :
    projectType === 'multi-agent' ? 'Multi-Agent' :
    'Design';
  const categoryColor =
    projectType === 'ai-agent' ? 'text-accent-600' :
    projectType === 'multi-agent' ? 'text-indigo-600' :
    'text-purple-600';

  // Reorder tech stack to put LLM models first
  const reorderedTechStack = techStack ? [
    ...techStack.filter(tech =>
      tech.includes('Claude') ||
      tech.includes('Gemini') ||
      tech.includes('Perplexity') ||
      tech.includes('GPT') ||
      tech.includes('Sonar')
    ),
    ...techStack.filter(tech =>
      !tech.includes('Claude') &&
      !tech.includes('Gemini') &&
      !tech.includes('Perplexity') &&
      !tech.includes('GPT') &&
      !tech.includes('Sonar')
    )
  ] : [];

  // Dynamically import the MDX content
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MDXContent = require(`@/content/ai-projects/${params.slug}.mdx`).default;

  return (
    <>
      {/* Header Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link href="/ai-projects" className="hover:text-primary-600">AI Projects</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">{title}</span>
          </div>

          <span className={`text-sm font-semibold uppercase tracking-wide ${categoryColor}`}>
            {categoryLabel}
          </span>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xl text-gray-700 italic mb-6">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-4">
              {readingTime && (
                <>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {readingTime}
                  </span>
                  <span className="text-gray-400">•</span>
                </>
              )}
              <span>Published: {publishedDate}</span>
            </div>
            <ShareButtons title={title} url={fullUrl} />
          </div>

          {/* Tech stack */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            {reorderedTechStack && reorderedTechStack.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tech Stack:</h3>
                <div className="flex flex-wrap gap-2">
                  {reorderedTechStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prominent Demo Button */}
          {demoUrl && (
            <div className="text-center my-4 mb-0">
              <a
                href={demoUrl}
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🚀 Try Live Demo
              </a>
              <p className="mt-3 text-sm text-gray-600">Experience the agent in action with real AI capabilities</p>
            </div>
          )}
        </div>
      </Section>

      {/* Main Content Section */}
      <Section background="white" className="-mt-8 pt-8">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none">
            <MDXContent />
          </article>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags:</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back to projects */}
          <div className="mt-12 text-center">
            <Link href="/ai-projects" className="btn-secondary">
              ← Back to All Projects
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
