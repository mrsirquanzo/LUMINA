import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import AIProjectsClient from './AIProjectsClient';
import { getAllAIProjects } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'AI Projects | Quan Ho',
  description: 'AI agents and design systems that automate biotech intelligence workflows.',
  keywords: ['AI agents', 'design systems', 'biotech tools', 'business intelligence', 'automation'],
};

export default function AIProjectsPage() {
  // Get all AI projects (server-side)
  const allProjects = getAllAIProjects();

  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI Projects
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed">
            I build AI agents and design systems that automate biotech intelligence workflows.
            These tools demonstrate how to turn manual research and diligence into scalable systems.
          </p>
        </div>
      </Section>

      {/* Projects Section */}
      <Section background="white">
        <div className="max-w-site mx-auto">
          {/* Client-side filtering component */}
          <AIProjectsClient projects={allProjects} />

          {/* Why These Projects Matter */}
          <div className="mt-16 bg-primary-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Build These Tools?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🚀 Solve Real Problems
                </h3>
                <p className="text-sm leading-relaxed">
                  Each project addresses a specific inefficiency in biotech intelligence:
                  manual data extraction, slow patent analysis, repetitive financial reviews.
                  Building solutions demonstrates problem-solving through automation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🔧 Technical Versatility
                </h3>
                <p className="text-sm leading-relaxed">
                  From AI agent architectures (RAG, multi-agent systems) to design systems
                  (component libraries, typography), I can work across the full stack. This
                  adaptability is critical in fast-paced biotech environments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  📊 Data-Driven Mindset
                </h3>
                <p className="text-sm leading-relaxed">
                  Every tool tracks metrics: time saved, accuracy rates, throughput improvements.
                  This quantitative approach carries over to business intelligence—measuring
                  impact, not just generating reports.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎯 Bias to Action
                </h3>
                <p className="text-sm leading-relaxed">
                  These aren't academic exercises—they're production tools used for real analysis work.
                  I ship products, iterate based on feedback, and continuously improve.
                  The same mindset applies to any business intelligence challenge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
