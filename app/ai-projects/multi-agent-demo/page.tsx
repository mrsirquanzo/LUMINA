import { Metadata } from 'next';
import MultiAgentDemoWrapper from '@/components/agents/MultiAgentDemoWrapper';

export const metadata: Metadata = {
  title: 'Sonny Multi-Agent AI | Quan Ho',
  description: 'Experience how Sonny orchestrates 5 specialized AI agents powered by different models (Claude Sonnet 4, Gemini 2.0 Flash, Perplexity Sonar Pro) to analyze complex biotech scenarios across clinical, patent, financial, market research, and regulatory dimensions.',
  keywords: ['multi-agent AI', 'biotech analysis', 'AI collaboration', 'due diligence', 'Claude AI', 'agent orchestration', 'Sonny'],
};

export default function MultiAgentDemoPage() {
  return <MultiAgentDemoWrapper />;
}
