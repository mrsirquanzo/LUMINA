/**
 * Agent Context Summary Component
 * Shows available context when switching agents
 */

import { useState } from 'react';
import { FileText, Dna, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';

interface AgentContext {
  fromAgent: string;
  patentData?: {
    patentNumber: string;
    antibodiesCount: number;
    sequencesAvailable: boolean;
    ftoRisk?: string;
  };
  analysisData?: any;
}

interface AgentContextSummaryProps {
  context: AgentContext;
  onUseContext: () => void;
  onStartFresh: () => void;
  onDismiss?: () => void;
}

export default function AgentContextSummary({
  context,
  onUseContext,
  onStartFresh,
  onDismiss,
}: AgentContextSummaryProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 bg-primary/10 border border-primary/30 rounded-lg p-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-textPrimary">💡 Context Available</h3>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-surface rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-textSecondary" />
            </button>
          )}
        </div>

        <div className="mb-3">
          <p className="text-xs text-textSecondary mb-2">From {context.fromAgent}:</p>
          <ul className="space-y-1.5 text-sm text-textPrimary">
            {context.patentData && (
              <>
                <li className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{context.patentData.patentNumber} analyzed</span>
                </li>
                {context.patentData.antibodiesCount > 0 && (
                  <li className="flex items-center gap-2">
                    <Dna className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{context.patentData.antibodiesCount} anti-PD-1 antibodies extracted</span>
                  </li>
                )}
                {context.patentData.sequencesAvailable && (
                  <li className="flex items-center gap-2">
                    <Dna className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>Sequences available</span>
                  </li>
                )}
                {context.patentData.ftoRisk && (
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    <span>FTO Risk: {context.patentData.ftoRisk}</span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onUseContext}
            className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Use This Context
          </button>
          <button
            onClick={onStartFresh}
            className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg hover:border-border transition-colors text-sm text-textSecondary hover:text-textPrimary"
          >
            Start Fresh
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
