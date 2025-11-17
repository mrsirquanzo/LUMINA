import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import TechnicalProjectsClient from './TechnicalProjectsClient';
import { getAllTechnicalProjects } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'Technical Projects | Quan Ho',
  description: 'AI agents and design systems that make investment workflows faster, smarter, and more scalable.',
  keywords: ['AI agents', 'design systems', 'biotech tools', 'investment workflows'],
};

export default function TechnicalProjectsPage() {
  // Get all technical projects (server-side)
  const allProjects = getAllTechnicalProjects();

  return (
    <>
      {/* Hero Section */}
      <Section className="bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3 block">
            Building & Designing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Technical Projects
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed">
            Beyond biotech analysis, I build AI agents and design systems that make
            investment workflows faster, smarter, and more scalable. These projects
            demonstrate my ability to identify inefficiencies and ship solutions.
          </p>
        </div>
      </Section>

      {/* Projects Section */}
      <Section background="white">
        <div className="max-w-site mx-auto">
          {/* Client-side filtering component */}
          <TechnicalProjectsClient projects={allProjects} />

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
                  Each project addresses a specific inefficiency I encountered in biotech investing:
                  manual research, slow diligence, inconsistent formatting. Building solutions
                  demonstrates problem-solving beyond analysis.
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
                  Every tool tracks metrics: time saved, accuracy rates, user adoption.
                  This quantitative approach carries over to investment analysis—measuring
                  outcomes, not just making predictions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎯 Bias to Action
                </h3>
                <p className="text-sm leading-relaxed">
                  These aren't academic exercises—they're production tools I've used for 25+
                  analyses. I ship products, iterate based on feedback, and continuously improve.
                  The same mindset applies to portfolio companies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
