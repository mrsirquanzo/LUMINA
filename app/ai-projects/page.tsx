import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import AIProjectsClient from './AIProjectsClient';
import { getAllAIProjects } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'Build | Quan Ho',
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
            Build
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
        </div>
      </Section>
    </>
  );
}
