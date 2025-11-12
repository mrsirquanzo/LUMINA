import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import PatentExpertAgent from '@/components/agents/PatentExpertAgent';

export const metadata: Metadata = {
  title: 'Patent Expert Agent | Quan Ho',
  description: 'Interactive AI agent for analyzing biotech patents, IP strategy, and competitive intelligence.',
  keywords: ['AI agent', 'patent analysis', 'IP strategy', 'biotech patents', 'Claude AI'],
};

export default function PatentExpertDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-purple-50 via-white to-gray-50">
      <PatentExpertAgent />
    </Section>
  );
}
