import { Metadata } from 'next';
import MultiAgentDemoWrapper from '@/components/agents/MultiAgentDemoWrapper';

export const metadata: Metadata = {
  title: 'Q · E | Quan Ho',
  description: 'Experience how 5 specialized AI agents powered by different models (Claude Sonnet 4, Gemini 2.0 Flash, Perplexity Sonar Pro) collaborate to analyze complex biotech scenarios across clinical, patent, financial, market research, and regulatory dimensions.',
  keywords: ['multi-agent AI', 'biotech analysis', 'AI collaboration', 'due diligence', 'Claude AI', 'agent orchestration'],
};

export default function MultiAgentDemoPage() {
  return <MultiAgentDemoWrapper />;
}
