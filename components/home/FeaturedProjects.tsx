import Link from "next/link";
import Section from "@/components/shared/Section";
import Button from "@/components/shared/Button";

export default function FeaturedProjects() {
  const multiAgentProject = {
    title: "Multi-Agent Collaboration System",
    description: "Experience how specialized AI agents work together to analyze complex biotech scenarios. Upload documents and watch as clinical, patent, and financial experts collaborate in real-time to provide comprehensive due diligence.",
    demoUrl: "/ai-projects/multi-agent-demo",
    tags: ["Agent Orchestration", "Claude AI", "Real-time Analysis"],
  };

  const individualAgents = [
    {
      slug: "data-analyst-agent",
      title: "Clinical Data Analyst",
      description: "Analyze clinical trial reports, study data, and efficacy endpoints. Upload PDFs, Excel files, or URLs for instant expert-level analysis.",
      demoUrl: "/ai-projects/data-analyst-demo",
      tags: ["Clinical Data", "Vision AI"],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      slug: "financial-analyst-agent",
      title: "Financial Intelligence",
      description: "Analyze SEC filings, financial models, and biotech valuations. Get expert analysis of burn rate, runway, and investment risks.",
      demoUrl: "/ai-projects/financial-analyst-demo",
      tags: ["SEC Filings", "Valuation"],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      slug: "patent-expert-agent",
      title: "Patent Intelligence",
      description: "Analyze patent documents, IP landscapes, and freedom-to-operate. Get instant analysis of claims, prior art, and competitive positioning.",
      demoUrl: "/ai-projects/patent-expert-demo",
      tags: ["Patents", "IP Strategy"],
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
            Specialized AI Agents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {individualAgents.map((agent) => (
              <Link
                key={agent.slug}
                href={agent.demoUrl}
                className="card group hover:border-primary-200 border-2 border-transparent transition-all"
              >
                {/* Icon */}
                <div className="flex justify-center text-primary-600 mb-4 group-hover:text-primary-700 transition-colors">
                  {agent.icon}
                </div>

                {/* Title */}
                <h4 className="text-xl font-semibold text-gray-900 mb-3 text-center group-hover:text-primary-700 transition-colors">
                  {agent.title}
                </h4>

                {/* Description */}
                <p className="text-gray-700 mb-4 leading-relaxed text-center">
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
                <div className="flex items-center justify-center text-primary-600 font-medium group-hover:text-primary-700">
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
            ))}
          </div>
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button href="/ai-projects" variant="secondary">
            Explore All AI Projects
          </Button>
        </div>
      </div>
    </Section>
  );
}
