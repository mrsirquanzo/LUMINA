import { Metadata } from 'next';
import MultiAgentDemo from '@/components/agents/MultiAgentDemo';

export const metadata: Metadata = {
  title: 'Multi-Agent Collaboration Demo | Quan Ho',
  description: 'Experience how 5 specialized AI agents powered by different models (Claude Sonnet 4, Gemini Pro, Perplexity) collaborate to analyze complex biotech scenarios across clinical, patent, financial, market research, and regulatory dimensions.',
  keywords: ['multi-agent AI', 'biotech analysis', 'AI collaboration', 'due diligence', 'Claude AI', 'agent orchestration'],
};

export default function MultiAgentDemoPage() {
  return <MultiAgentDemo />;
}
