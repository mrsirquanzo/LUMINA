import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import FinancialAnalystAgent from '@/components/agents/FinancialAnalystAgent';

export const metadata: Metadata = {
  title: 'Financial Analyst Agent | Quan Ho',
  description: 'Interactive AI agent for analyzing biotech financials, valuations, and investment analysis.',
  keywords: ['AI agent', 'financial analysis', 'biotech valuation', 'M&A analysis', 'Claude AI'],
};

export default function FinancialAnalystDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-green-50 via-white to-gray-50">
      <FinancialAnalystAgent />
    </Section>
  );
}
