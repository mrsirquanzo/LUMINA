/**
 * Claims Extraction Detail Panel
 * Detailed view for claims extraction with options
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
  Layers,
  GitBranch,
  Target,
  FileSearch,
  BookOpen,
  Maximize2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';

interface ClaimsExtractionPanelProps {
  patent?: PatentExtractionResult | null;
  onBack: () => void;
  onExtract?: (options: string[]) => void;
}

const ANALYSIS_OPTIONS = [
  {
    id: 'independent',
    icon: FileText,
    title: 'Independent Claims Parsing',
    description: 'Extract and structure all independent claims',
    category: 'Claims Structure',
  },
  {
    id: 'dependent',
    icon: GitBranch,
    title: 'Dependency Tree Mapping',
    description: 'Map claim relationships and dependencies',
    category: 'Claims Structure',
  },
  {
    id: 'elements',
    icon: Layers,
    title: 'Element Extraction',
    description: 'Parse individual claim elements and limitations',
    category: 'Analysis',
  },
  {
    id: 'scope',
    icon: Target,
    title: 'Scope Assessment',
    description: 'Evaluate claim breadth and coverage',
    category: 'Analysis',
  },
  {
    id: 'prosecution',
    icon: FileSearch,
    title: 'Prosecution History',
    description: 'Review file wrapper for claim amendments',
    category: 'Context',
  },
  {
    id: 'prior_art',
    icon: BookOpen,
    title: 'Prior Art References',
    description: 'Extract cited references and their relevance',
    category: 'Context',
  },
];

export default function ClaimsExtractionPanel({
  patent,
  onBack,
  onExtract,
}: ClaimsExtractionPanelProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>(['independent', 'elements', 'scope']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);

  const toggleAnalysis = (id: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const categories = [...new Set(ANALYSIS_OPTIONS.map((a) => a.category))];

  const handleExtract = () => {
    setIsProcessing(true);
    onExtract?.(selectedAnalyses);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setConfidence(94);
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
          Back to Patent Expert
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <FileText size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-textPrimary">Claims Extraction</h3>
            <p className="text-xs text-textSecondary">
              {patent?.document_info.patent_number || 'US10808039B2'}
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
            Patent Preview
          </span>
          <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            <Maximize2 size={12} />
            Full View
          </button>
        </div>
        <div className="h-24 bg-surface rounded-lg border border-border flex items-center justify-center">
          <div className="text-center text-textTertiary">
            <FileText size={24} className="mx-auto mb-1" />
            <p className="text-xs">
              {patent?.claims_analysis.total_claims || 47} claims identified
            </p>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="p-4 border-b border-border bg-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={16} className="text-primary animate-spin" />
            <span className="text-sm font-medium text-textPrimary">Extracting claims...</span>
          </div>
          <div className="w-full h-2 bg-surfaceElevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-xs text-textSecondary">
            ✓ Document parsed • ● Identifying claim structure • ○ Element extraction
          </div>
        </div>
      )}

      {/* Analysis Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-textPrimary">Select Extraction Options</span>
          <button
            onClick={() => setSelectedAnalyses(ANALYSIS_OPTIONS.map((a) => a.id))}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
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
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border bg-surfaceElevated'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        selectedAnalyses.includes(analysis.id) ? 'bg-primary/20' : 'bg-white/5'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          selectedAnalyses.includes(analysis.id) ? 'text-primary' : 'text-textSecondary'
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
                          ? 'border-primary bg-primary'
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

        {/* Results Preview */}
        {confidence && patent && (
          <div className="mt-4 p-4 bg-surfaceElevated border border-border rounded-xl">
            <h4 className="text-sm font-semibold text-textPrimary mb-3">Extraction Results</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-surface rounded-lg">
                <span className="text-sm text-textSecondary">Independent Claims</span>
                <span className="text-sm font-medium text-primary">
                  {patent.claims_analysis.independent_claims}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-surface rounded-lg">
                <span className="text-sm text-textSecondary">Dependent Claims</span>
                <span className="text-sm font-medium text-primary">
                  {patent.claims_analysis.total_claims - patent.claims_analysis.independent_claims}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-surface rounded-lg">
                <span className="text-sm text-textSecondary">Elements Extracted</span>
                <span className="text-sm font-medium text-primary">
                  {patent.claims_analysis.claims.reduce(
                    (sum, c) => sum + (c.elements?.length || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-border bg-surfaceElevated">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-textSecondary">
            {selectedAnalyses.length} options selected
          </span>
          <span className="text-xs text-textSecondary">Est. time: ~2-3 min</span>
        </div>
        <button
          onClick={handleExtract}
          disabled={selectedAnalyses.length === 0 || isProcessing}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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
              Extract Claims
            </>
          )}
        </button>
      </div>
    </div>
  );
}
