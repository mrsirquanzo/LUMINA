import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Section from "@/components/shared/Section";
import ShareButtons from "@/components/shared/ShareButtons";
import TableOfContents from "@/components/portfolio/TableOfContents";
import ProjectNav from "@/components/portfolio/ProjectNav";
import { getProjectBySlug, projects } from "@/lib/projects";
import { generateSEO, generateArticleStructuredData } from "@/components/layout/SEO";
import { TOCItem } from "@/lib/types";

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    return {};
  }

  return generateSEO({
    title: project.title,
    description: project.description,
    canonical: `https://quanho.io/portfolio/${project.slug}`,
    keywords: project.tags,
  });
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = getProjectBySlug(params.slug);

  if (!project) {
    notFound();
  }

  const currentIndex = projects.findIndex((p) => p.slug === params.slug);
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : undefined;
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : undefined;

  // Table of Contents (placeholder for now)
  const tocItems: TOCItem[] = [
    { id: "executive-summary", title: "Executive Summary", level: 1 },
    { id: "context", title: "Context & Thesis", level: 1 },
    { id: "technical-analysis", title: "Technical Deep Dive", level: 1 },
    { id: "market-analysis", title: "Market Analysis", level: 1 },
    { id: "financial-assessment", title: "Financial Assessment", level: 1 },
    { id: "risks", title: "Risk Analysis", level: 1 },
    { id: "recommendation", title: "Investment Recommendation", level: 1 },
  ];

  const fullUrl = `https://quanho.io/portfolio/${project.slug}`;

  // Structured data for SEO
  const structuredData = generateArticleStructuredData({
    title: project.title,
    description: project.description,
    publishedDate: project.publishedDate,
    slug: project.slug,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link href="/portfolio" className="hover:text-primary-600">Portfolio</Link>
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">{project.title.split(":")[0]}</span>
          </div>

          {/* Category */}
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">
            {project.category}
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
            {project.title}
          </h1>

          {/* Subtitle */}
          {project.subtitle && (
            <p className="text-xl text-gray-700 italic mb-6">
              {project.subtitle}
            </p>
          )}

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {project.readingTime} read
            </span>
            <span className="text-gray-400">•</span>
            <span>Published: {project.publishedDate}</span>
          </div>

          {/* Share & Download */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <ShareButtons title={project.title} url={fullUrl} />
            <button className="btn-secondary text-sm py-2">
              Download PDF
            </button>
          </div>
        </div>
      </Section>

      {/* Main Content Section */}
      <Section background="white">
        <div className="max-w-site mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Table of Contents */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <TableOfContents items={tocItems} />
            </aside>

            {/* Main Content */}
            <article className="flex-1 min-w-0">
              <div className="prose prose-lg max-w-content">
                {/* Placeholder content - will be replaced with actual project content */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg mb-8">
                  <p className="text-yellow-800 font-semibold mb-2">
                    Content Coming Soon
                  </p>
                  <p className="text-yellow-700 text-sm">
                    This is a placeholder page. The full investment analysis for <strong>{project.title}</strong> will be added soon with detailed technical analysis, market sizing, financial modeling, and investment recommendations.
                  </p>
                </div>

                <section id="executive-summary" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Executive Summary</h2>
                  <div className="bg-primary-50 border-l-4 border-primary-600 p-6 rounded-r-lg">
                    <p className="text-gray-700 mb-4">
                      This section will contain the key takeaways and investment recommendation for {project.title.split(":")[0]}.
                    </p>
                  </div>
                </section>

                <section id="context" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Context & Thesis</h2>
                  <p className="text-gray-700">
                    Detailed context and investment thesis will be provided here, explaining the market opportunity, competitive landscape, and strategic rationale.
                  </p>
                </section>

                <section id="technical-analysis" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Deep Dive</h2>
                  <p className="text-gray-700 mb-4">
                    In-depth technical analysis including platform assessment, scientific validation, and expert evaluation.
                  </p>
                </section>

                <section id="market-analysis" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Analysis</h2>
                  <p className="text-gray-700">
                    Market sizing, growth drivers, competitive dynamics, and opportunity assessment.
                  </p>
                </section>

                <section id="financial-assessment" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Financial Assessment</h2>
                  <p className="text-gray-700">
                    Revenue model, unit economics, comparable valuations, and path to profitability.
                  </p>
                </section>

                <section id="risks" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Risk Analysis</h2>
                  <p className="text-gray-700">
                    Comprehensive risk assessment covering scientific, commercial, financial, and competitive risks.
                  </p>
                </section>

                <section id="recommendation" className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment Recommendation</h2>
                  <p className="text-gray-700">
                    Clear investment thesis, catalysts to watch, and target scenarios.
                  </p>
                </section>
              </div>

              {/* Project Navigation */}
              <ProjectNav prevProject={prevProject} nextProject={nextProject} />
            </article>
          </div>
        </div>
      </Section>
    </>
  );
}
