/**
 * Target Validation Detail Panel Component
 * Shows detailed target validation analysis
 */

import { X, FileText, Swords, ClipboardList, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface TargetValidationPanelProps {
  target?: {
    name?: string;
    description?: string;
  };
  onClose: () => void;
}

// Evidence breakdown item
const EvidenceItem = ({ title, rating, bullets, expanded = false }: { title: string; rating: 'strong' | 'moderate' | 'weak'; bullets: string[]; expanded?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const ratingConfig = {
    strong: { color: 'border-l-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400' },
    moderate: { color: 'border-l-amber-500', badge: 'bg-amber-500/20 text-amber-400' },
    weak: { color: 'border-l-red-500', badge: 'bg-red-500/20 text-red-400' }
  };
  
  const config = ratingConfig[rating] || ratingConfig.moderate;
  
  return (
    <div className={`border-l-4 ${config.color} bg-surfaceElevated`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface transition-colors"
      >
        <span className="font-medium text-textPrimary text-sm">{title}</span>
        <span className={`px-2 py-0.5 ${config.badge} text-xs font-medium rounded-full`}>
          {rating.charAt(0).toUpperCase() + rating.slice(1)}
        </span>
      </button>
      {isExpanded && bullets && (
        <div className="px-3 pb-3 space-y-1">
          {bullets.map((bullet, idx) => (
            <p key={idx} className="text-sm text-textSecondary flex items-start gap-2">
              <span className="text-textTertiary">•</span>
              {bullet}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// Citation link component
const CitationLink = ({ index, text, url }: { index: number; text: string; url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start gap-2 p-2 hover:bg-surfaceElevated rounded-lg transition-colors group"
  >
    <span className="text-xs font-medium text-blue-400">[{index}]</span>
    <span className="text-sm text-textSecondary group-hover:text-blue-400 flex-1">{text}</span>
    <ExternalLink size={14} className="text-textTertiary group-hover:text-blue-400 flex-shrink-0" />
  </a>
);

export default function TargetValidationPanel({ target, onClose }: TargetValidationPanelProps) {
  const targetData = target || {
    name: 'TIGIT',
    description: 'Immuno-oncology | Checkpoint inhibitor',
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
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">{targetData.name} Target Validation</h2>
            <p className="text-sm text-textSecondary mt-1">{targetData.description}</p>
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
        {/* Validation Summary */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Validation Summary</h3>
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 rounded-lg p-4 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textSecondary">Overall Score</p>
                <p className="text-2xl font-bold text-textPrimary">2.3/5</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
                Moderate
              </span>
            </div>
            <p className="text-sm text-textSecondary mt-2">Convergence: 3 of 6 evidence lines</p>
          </div>
        </div>

        {/* Evidence Breakdown */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Evidence Breakdown</h3>
          <div className="space-y-1 border border-white/10 rounded-lg overflow-hidden">
            <EvidenceItem
              title="Human Genetics"
              rating="weak"
              expanded={true}
              bullets={[
                'No GWAS hits for cancer risk',
                'LoF tolerated (pLI = 0) but no protective phenotype',
                'Direction of effect: Unclear'
              ]}
            />
            <EvidenceItem
              title="Expression Profile"
              rating="strong"
              bullets={[
                'Upregulated on exhausted TILs',
                'Correlates with T cell dysfunction',
                'Also on Tregs (concern)'
              ]}
            />
            <EvidenceItem
              title="Preclinical Models"
              rating="moderate"
              bullets={[
                'Activity in syngeneic models',
                'Species translation concerns'
              ]}
            />
            <EvidenceItem
              title="Clinical Precedent"
              rating="weak"
              bullets={[
                'SKYSCRAPER-01: Phase 3 NEGATIVE',
                'Multiple other programs discontinued'
              ]}
            />
          </div>
        </div>

        {/* Direction of Effect */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Direction of Effect Analysis</h3>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Concern: Unclear Direction</p>
                <p className="text-sm text-textSecondary mt-1">
                  No human knockout or LoF data demonstrating that TIGIT inhibition would protect from cancer.
                  Therapeutic hypothesis relies entirely on expression patterns and preclinical models.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Citation Sources */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Citation Sources</h3>
          <div className="space-y-1">
            <CitationLink
              index={1}
              text="gnomAD TIGIT constraint metrics"
              url="https://gnomad.broadinstitute.org/gene/ENSG00000181847"
            />
            <CitationLink
              index={2}
              text="PMID: 35576962 - SKYSCRAPER-01 results"
              url="https://pubmed.ncbi.nlm.nih.gov/35576962/"
            />
            <CitationLink
              index={3}
              text="GTEx TIGIT expression profile"
              url="https://gtexportal.org/home/gene/TIGIT"
            />
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-white/10 bg-surfaceElevated">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <FileText size={16} />
            Full Report
          </button>
          <button className="px-4 py-2 bg-surface border border-white/10 text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <Swords size={16} />
            Competitive
          </button>
          <button className="px-4 py-2 bg-surface border border-white/10 text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <ClipboardList size={16} />
            Deal Memo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
