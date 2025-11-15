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
      <Section className="bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3 block">
            Building & Designing
          </span>
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

          {/* Why Build These */}
          <div className="mt-16 card bg-gradient-to-br from-gray-50 to-blue-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Build These?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Automate what's repetitive
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Hours spent pulling 10-K data, checking patent claims, rebuilding models.
                  Built tools to handle the tedious parts. Ship faster, iterate more.
                </p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Build what's needed
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  RAG systems, multi-agent orchestration, component libraries.
                  Full-stack means solving the problem end-to-end without handoffs.
                </p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Measure what works
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Every tool tracks time saved and accuracy rates.
                  Can't improve what you don't measure. Results over polish.
                </p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Use what I build
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  These run real analysis work. Find what breaks, fix it, ship updates.
                  Working tools, not portfolio pieces.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
