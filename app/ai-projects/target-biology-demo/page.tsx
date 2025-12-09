import { Metadata } from 'next';
import Section from '@/components/shared/Section';
import TargetBiologyAgent from '@/components/agents/TargetBiologyAgent';

export const metadata: Metadata = {
  title: 'Target Biology Expert Agent | Quan Ho',
  description: 'Interactive AI agent for target identification, validation, mechanism of action, and druggability assessment.',
  keywords: ['AI agent', 'target biology', 'target validation', 'druggability', 'mechanism of action', 'Claude AI'],
};

export default function TargetBiologyDemoPage() {
  return (
    <Section className="bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <TargetBiologyAgent />
    </Section>
  );
}
