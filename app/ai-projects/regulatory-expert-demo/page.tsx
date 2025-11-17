import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import RegulatoryExpertAgent from '@/components/agents/RegulatoryExpertAgent';

export const metadata: Metadata = {
  title: 'Regulatory Expert Agent | Quan Ho',
  description: 'Interactive AI agent for FDA/EMA regulatory strategy, pathways, and compliance analysis.',
  keywords: ['AI agent', 'regulatory strategy', 'FDA approval', 'biotech regulation', 'Claude AI'],
};

export default function RegulatoryExpertDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-orange-50 via-white to-gray-50">
      <RegulatoryExpertAgent />
    </Section>
  );
}
