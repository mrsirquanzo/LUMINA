/**
 * Deal Memo Detail Panel Component
 * Shows BD/M&A due diligence assessment
 */

import { X, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

interface DealMemoPanelProps {
  deal?: {
    asset?: string;
  };
  onClose: () => void;
}

export default function DealMemoPanel({ deal, onClose }: DealMemoPanelProps) {
  const dealData = deal || {
    asset: 'TIGIT Inhibitor',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-0 bg-surface z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">Deal Memo: {dealData.asset}</h2>
            <p className="text-sm text-textSecondary mt-1">BD/M&A Diligence Assessment</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surfaceElevated rounded-lg transition-colors"
          >
            <X size={20} className="text-textSecondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Conviction Statement */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Conviction Statement</h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-textSecondary">Overall Conviction</span>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
                LOW
              </span>
            </div>
            <p className="text-sm text-textPrimary">
              TIGIT inhibition as a strategy for enhancing anti-tumor immunity has not been clinically
              validated despite strong preclinical rationale, raising fundamental questions about
              target biology in humans.
            </p>
          </div>
        </div>

        {/* PTS Calculation */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Probability of Technical Success</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surfaceElevated rounded-lg text-center border border-border">
              <p className="text-xs text-textSecondary mb-1">Baseline PTS</p>
              <p className="text-3xl font-bold text-textPrimary">15%</p>
              <p className="text-xs text-textSecondary">Phase 2 oncology</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg text-center border border-red-500/30">
              <p className="text-xs text-textSecondary mb-1">Adjusted PTS</p>
              <p className="text-3xl font-bold text-red-400">&lt;5%</p>
              <p className="text-xs text-red-400">Post Phase 3 failure</p>
            </div>
          </div>
        </div>

        {/* Adjustment Factors */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">PTS Adjustments</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-sm text-textPrimary">Weak human genetics</span>
              <span className="text-sm font-medium text-red-400">-10%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-sm text-textPrimary">Phase 3 failure at target</span>
              <span className="text-sm font-medium text-red-400">-15%</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-sm text-textPrimary">Fuzzy MOA</span>
              <span className="text-sm font-medium text-red-400">-5%</span>
            </div>
          </div>
        </div>

        {/* Key Risks */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Critical Risks</h3>
          <div className="space-y-2">
            <div className="p-3 border border-red-500/30 rounded-lg bg-surfaceElevated">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-textPrimary text-sm">Mechanism fundamentally flawed</span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">High</span>
              </div>
              <p className="text-sm text-textSecondary">Phase 3 negative data suggests preclinical models did not predict human efficacy</p>
            </div>
            <div className="p-3 border border-amber-500/30 rounded-lg bg-surfaceElevated">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-textPrimary text-sm">Redundancy cannot be overcome</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">Medium</span>
              </div>
              <p className="text-sm text-textSecondary">Biology favors multi-checkpoint approach; single-target insufficient</p>
            </div>
            <div className="p-3 border border-red-500/30 rounded-lg bg-surfaceElevated">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-textPrimary text-sm">Competitive window closed</span>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">High</span>
              </div>
              <p className="text-sm text-textSecondary">Negative data public; first-mover advantage lost</p>
            </div>
          </div>
        </div>

        {/* Decision framing (non-prescriptive) */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Decision Framing</h3>
          <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <X size={20} className="text-red-400" />
              <span className="font-semibold text-red-400">High-risk signal</span>
            </div>
            <p className="text-sm text-textPrimary">
              The current evidence stack reads as high-risk without a clearly differentiated mechanism or context. If you decide to explore TIGIT anyway, pre-commit to a minimal “evidence bar” (novel combination rationale, differentiated Fc / biology, and a context where TIGIT is plausibly dominant) and treat early readouts as gating.
            </p>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-border bg-surfaceElevated">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <FileText size={16} />
            Export PDF
          </button>
          <button className="px-4 py-2 bg-surface border border-border text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </motion.div>
  );
}
