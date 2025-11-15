import Link from "next/link";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";

export default function FeaturedProjects() {
  const multiAgentProject = {
    title: "Q · E",
    description: "Experience how 5 specialized AI agents powered by different models (Claude Sonnet 4, Gemini 2.0 Flash, Perplexity Sonar Pro) work together to analyze complex biotech scenarios. Upload documents and watch as Clinical, Patent, Financial, Market Research, and Regulatory experts collaborate in real-time to provide comprehensive due diligence.",
    demoUrl: "/ai-projects/multi-agent-demo",
    tags: ["Agent Orchestration", "Claude AI", "Real-time Analysis"],
  };

  const individualAgents = [
    {
      slug: "data-analyst-agent",
      title: "Clinical Data Analyst",
      description: "Analyze clinical trial reports, efficacy endpoints, safety data, and study protocols from PDFs, Excel files, or URLs.",
      demoUrl: "/ai-projects/data-analyst-demo",
      tags: ["Clinical Trials", "Efficacy Data"],
      color: "blue",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      slug: "financial-analyst-agent",
      title: "Financial Analyst",
      description: "Analyze SEC filings, financial models, and company valuations. Review burn rate, runway, revenue projections, and investment risks.",
      demoUrl: "/ai-projects/financial-analyst-demo",
      tags: ["10-K/10-Q", "Valuation"],
      color: "green",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      slug: "patent-expert-agent",
      title: "Patent Expert",
      description: "Analyze patent documents, IP landscapes, and freedom-to-operate. Review claims, prior art, competitive positioning, and white space.",
      demoUrl: "/ai-projects/patent-expert-demo",
      tags: ["Patents", "FTO"],
      color: "purple",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      slug: "market-research-agent",
      title: "Market Research Analyst",
      description: "Get insights on market sizing, competitive landscape, pricing strategy, payer dynamics, and revenue forecasting.",
      demoUrl: "/ai-projects/market-research-demo",
      tags: ["Market Sizing", "Competitive Analysis"],
      color: "teal",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      slug: "regulatory-expert-agent",
      title: "Regulatory Expert",
      description: "Analyze regulatory pathways, submission strategies, approval timelines, and compliance requirements across FDA, EMA, and other agencies.",
      demoUrl: "/ai-projects/regulatory-expert-demo",
      tags: ["FDA Strategy", "Approval Pathways"],
      color: "orange",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <Section background="white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Due Diligence
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            Interactive AI systems that automate biotech analysis and scale expert-level diligence
          </p>
        </div>

        {/* Multi-Agent Featured Hero Card */}
        <Link
          href={multiAgentProject.demoUrl}
          className="block mb-12 group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-50 via-primary-50 to-purple-50 border-2 border-transparent hover:border-accent-300 transition-all shadow-lg hover:shadow-2xl">
            <div className="p-8 md:p-12">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-4">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                      <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
                    </svg>
                    Featured Project
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-accent-700 transition-colors">
                    {multiAgentProject.title}
                  </h3>
                  <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed max-w-3xl">
                    {multiAgentProject.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {multiAgentProject.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-sm bg-white/80 text-gray-700 px-3 py-1 rounded-full border border-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="inline-flex items-center gap-2 text-accent-600 font-semibold text-lg group-hover:gap-3 transition-all">
                    Try Interactive Demo
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Individual Agent Cards */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Individual Agents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {individualAgents.map((agent) => {
              const colorMap: Record<string, {
                icon: string;
                title: string;
                border: string;
                cta: string;
              }> = {
                blue: {
                  icon: 'text-blue-600 group-hover:text-blue-700',
                  title: 'group-hover:text-blue-700',
                  border: 'hover:border-blue-200',
                  cta: 'text-blue-600 group-hover:text-blue-700',
                },
                green: {
                  icon: 'text-green-600 group-hover:text-green-700',
                  title: 'group-hover:text-green-700',
                  border: 'hover:border-green-200',
                  cta: 'text-green-600 group-hover:text-green-700',
                },
                purple: {
                  icon: 'text-purple-600 group-hover:text-purple-700',
                  title: 'group-hover:text-purple-700',
                  border: 'hover:border-purple-200',
                  cta: 'text-purple-600 group-hover:text-purple-700',
                },
                teal: {
                  icon: 'text-teal-600 group-hover:text-teal-700',
                  title: 'group-hover:text-teal-700',
                  border: 'hover:border-teal-200',
                  cta: 'text-teal-600 group-hover:text-teal-700',
                },
                orange: {
                  icon: 'text-orange-600 group-hover:text-orange-700',
                  title: 'group-hover:text-orange-700',
                  border: 'hover:border-orange-200',
                  cta: 'text-orange-600 group-hover:text-orange-700',
                },
              };

              const colorClasses = colorMap[agent.color] || colorMap.blue;

              return (
                <Link
                  key={agent.slug}
                  href={agent.demoUrl}
                  className={`card group ${colorClasses.border} border-2 border-transparent transition-all`}
                >
                  {/* Icon */}
                  <div className={`flex justify-center ${colorClasses.icon} mb-4 transition-colors`}>
                    {agent.icon}
                  </div>

                  {/* Title */}
                  <h4 className={`text-xl font-semibold text-gray-900 mb-3 text-center ${colorClasses.title} transition-colors`}>
                    {agent.title}
                  </h4>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 leading-relaxed text-center text-sm">
                    {agent.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {agent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center justify-center ${colorClasses.cta} font-medium`}>
                    Try Demo
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
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button href="/ai-projects" variant="secondary">
            View All Projects
          </Button>
        </div>
      </div>
    </Section>
  );
}
