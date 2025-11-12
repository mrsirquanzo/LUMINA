import { Metadata } from 'next';
import MultiAgentDemo from '@/components/agents/MultiAgentDemo';

export const metadata: Metadata = {
  title: 'Multi-Agent Collaboration Demo | Quan Ho',
  description: 'Experience how specialized AI agents collaborate to analyze complex biotech scenarios across clinical, patent, and financial dimensions.',
  keywords: ['multi-agent AI', 'biotech analysis', 'AI collaboration', 'due diligence', 'Claude AI', 'agent orchestration'],
};

export default function MultiAgentDemoPage() {
  return <MultiAgentDemo />;
}
