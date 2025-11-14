'use client';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import MultiAgentDemo from './MultiAgentDemo';

export default function MultiAgentDemoWrapper() {
  return (
    <ErrorBoundary>
      <MultiAgentDemo />
    </ErrorBoundary>
  );
}
