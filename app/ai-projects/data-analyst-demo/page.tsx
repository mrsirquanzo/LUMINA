import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import DataAnalystAgent from '@/components/agents/DataAnalystAgent';

export const metadata: Metadata = {
  title: 'Data Analyst Agent | Quan Ho',
  description: 'Interactive AI agent for analyzing biotech clinical trials, competitive intelligence, and market analysis.',
  keywords: ['AI agent', 'clinical data', 'biotech analysis', 'data analyst', 'Claude AI'],
};

export default function DataAnalystDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <DataAnalystAgent />
    </Section>
  );
}
