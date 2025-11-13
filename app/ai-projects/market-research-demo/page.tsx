import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import MarketResearchAgent from '@/components/agents/MarketResearchAgent';

export const metadata: Metadata = {
  title: 'Market Research Agent | Quan Ho',
  description: 'Interactive AI agent for market sizing, competitive analysis, and commercial opportunity assessment.',
  keywords: ['AI agent', 'market research', 'market sizing', 'biotech markets', 'Claude AI'],
};

export default function MarketResearchDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-teal-50 via-white to-gray-50">
      <MarketResearchAgent />
    </Section>
  );
}
