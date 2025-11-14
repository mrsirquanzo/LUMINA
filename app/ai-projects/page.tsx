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
                  I got tired of spending hours manually extracting data from 10-Ks,
                  cross-referencing patent claims, and rebuilding the same financial models.
                  Each tool here started as something I needed myself. If it saves me time,
                  it probably helps others too.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🔧 Build Across the Stack
                </h3>
                <p className="text-sm leading-relaxed">
                  From RAG architectures and multi-agent orchestration to component libraries
                  and typography systems, I work on whatever the problem needs. Backend, frontend,
                  design. Being able to build end-to-end means shipping faster and iterating better.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  📊 Track What Matters
                </h3>
                <p className="text-sm leading-relaxed">
                  Every tool tracks time saved, accuracy rates, and throughput. Not because
                  metrics look good on a slide, but because you can't improve what you don't measure.
                  I care about real results, not just polished outputs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎯 Ship and Iterate
                </h3>
                <p className="text-sm leading-relaxed">
                  These aren't portfolio pieces gathering dust. I use them for actual analysis work,
                  find what breaks, fix it, and make it better. Shipping something that works beats
                  planning something perfect every time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
