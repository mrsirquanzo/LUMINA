/**
 * Document Analysis Detail Panel
 * Detailed view for document analysis with extraction options
 */

import { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Play,
  Eye,
  Check,
  Receipt,
  Scale,
  TrendingUp,
  Wallet,
  GitBranch,
  Target,
  Users,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DocumentAnalysisPanelProps {
  document?: {
    name: string;
    type: string;
    size: string;
    status: 'processing' | 'complete' | 'error';
  } | null;
  onBack: () => void;
  onAnalyze?: (options: string[]) => void;
}

const ANALYSIS_OPTIONS = [
  {
    id: 'income_statement',
    icon: Receipt,
    title: 'Income Statement Extraction',
    description: 'Revenue, R&D, SG&A, operating income trends',
    category: 'Financials',
  },
  {
    id: 'balance_sheet',
    icon: Scale,
    title: 'Balance Sheet Analysis',
    description: 'Cash position, debt, working capital metrics',
    category: 'Financials',
  },
  {
    id: 'cash_flow',
    icon: TrendingUp,
    title: 'Cash Flow Statement',
    description: 'Operating, investing, financing cash flows',
    category: 'Financials',
  },
  {
    id: 'burn_rate',
    icon: Wallet,
    title: 'Burn Rate Calculation',
    description: 'Monthly burn, runway projection, financing needs',
    category: 'Analysis',
  },
  {
    id: 'pipeline',
    icon: GitBranch,
    title: 'Pipeline Extraction',
    description: 'Programs, stages, indications, milestones',
    category: 'Strategy',
  },
  {
    id: 'risk_factors',
    icon: AlertTriangle,
    title: 'Risk Factor Analysis',
    description: 'Key risks, litigation, regulatory concerns',
    category: 'Risk',
  },
  {
    id: 'guidance',
    icon: Target,
    title: 'Guidance & Outlook',
    description: 'Management projections, milestones, timelines',
    category: 'Strategy',
  },
  {
    id: 'sbc',
    icon: Users,
    title: 'Stock-Based Compensation',
    description: 'SBC expense, dilution, option overhang',
    category: 'Equity',
  },
  {
    id: 'contracts',
    icon: FileText,
    title: 'Material Contracts',
    description: 'Partnerships, licenses, lease obligations',
    category: 'Legal',
  },
  {
    id: 'red_flags',
    icon: AlertTriangle,
    title: 'Red Flag Detection',
    description: 'Unusual accounting, related party, going concern',
    category: 'Risk',
  },
];

export default function DocumentAnalysisPanel({
  document,
  onBack,
  onAnalyze,
}: DocumentAnalysisPanelProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>(['income_statement', 'balance_sheet', 'cash_flow', 'burn_rate']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const toggleAnalysis = (id: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const categories = [...new Set(ANALYSIS_OPTIONS.map((a) => a.category))];

  const handleAnalyze = () => {
    setIsProcessing(true);
    onAnalyze?.(selectedAnalyses);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setConfidence(92);
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Financial Analyst
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <FileText size={20} className="text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-textPrimary">{document?.name || '10-K Analysis'}</h3>
            <p className="text-xs text-textSecondary">
              {document?.type || 'SEC Filing'} • {document?.size || '2.4 MB'}
            </p>
          </div>
          {confidence && (
            <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} />
              {confidence}% Confidence
            </span>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="p-4 border-b border-border bg-surfaceElevated">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
            Document Preview
          </span>
          <button className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
            <Maximize2 size={12} />
            Full View
          </button>
        </div>
        <div className="h-24 bg-surface rounded-lg border border-border flex items-center justify-center">
          <div className="text-center text-textTertiary">
            <FileText size={24} className="mx-auto mb-1" />
            <p className="text-xs">PDF document ready for analysis</p>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="p-4 border-b border-border bg-green-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={16} className="text-green-400 animate-spin" />
            <span className="text-sm font-medium text-textPrimary">Analyzing document...</span>
          </div>
          <div className="w-full h-2 bg-surfaceElevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '65%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-xs text-textSecondary">
            ✓ Document parsed • ● Extracting financials • ○ Analyzing trends
          </div>
        </div>
      )}

      {/* Analysis Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-textPrimary">Select Analyses</span>
          <button
            onClick={() => setSelectedAnalyses(ANALYSIS_OPTIONS.map((a) => a.id))}
            className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Select All
          </button>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-4">
            <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {ANALYSIS_OPTIONS.filter((a) => a.category === category).map((analysis) => {
                const Icon = analysis.icon;
                return (
                  <button
                    key={analysis.id}
                    onClick={() => toggleAnalysis(analysis.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedAnalyses.includes(analysis.id)
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-border hover:border-border bg-surfaceElevated'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        selectedAnalyses.includes(analysis.id) ? 'bg-green-500/20' : 'bg-white/5'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          selectedAnalyses.includes(analysis.id) ? 'text-green-400' : 'text-textSecondary'
                        }
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-textPrimary">{analysis.title}</p>
                      <p className="text-xs text-textSecondary">{analysis.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnalyses.includes(analysis.id)
                          ? 'border-green-500 bg-green-500'
                          : 'border-border'
                      }`}
                    >
                      {selectedAnalyses.includes(analysis.id) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-border bg-surfaceElevated">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-textSecondary">
            {selectedAnalyses.length} analyses selected
          </span>
          <span className="text-xs text-textSecondary">
            Est. time: ~{Math.max(1, selectedAnalyses.length * 0.5)} min
          </span>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={selectedAnalyses.length === 0 || isProcessing}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : confidence ? (
            <>
              <Eye size={16} />
              View Full Results
            </>
          ) : (
            <>
              <Play size={16} />
              Run Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
