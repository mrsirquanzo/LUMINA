/**
 * Sequence Extraction Detail Panel
 * Detailed view for sequence extraction with validation
 */

import { useState } from 'react';
import {
  Dna,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Copy,
  Download,
  RefreshCw,
  Shield,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';
import VerificationPrompt, { type VerificationItem } from './VerificationPrompt';

interface SequenceExtractionPanelProps {
  patent?: PatentExtractionResult | null;
  onBack: () => void;
  onExtract?: (options: string[]) => void;
}

const SEQUENCE_TYPES = [
  { id: 'cdr', label: 'CDR Sequences', description: 'Heavy and light chain CDRs', icon: Dna },
  { id: 'vh', label: 'VH Full Sequence', description: 'Complete variable heavy chain', icon: Dna },
  { id: 'vl', label: 'VL Full Sequence', description: 'Complete variable light chain', icon: Dna },
  { id: 'hc', label: 'Full Heavy Chain', description: 'Including Fc region', icon: Dna },
  { id: 'lc', label: 'Full Light Chain', description: 'Complete light chain', icon: Dna },
  { id: 'nucleic', label: 'Nucleic Acids', description: 'DNA/RNA sequences', icon: Dna },
];

interface ExtractedSequence {
  name: string;
  sequence: string;
  seqId: number;
  confidence: number;
  status: 'verified' | 'review';
}

export default function SequenceExtractionPanel({
  patent,
  onBack,
  onExtract,
}: SequenceExtractionPanelProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['cdr', 'vh', 'vl']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedSequences, setExtractedSequences] = useState<ExtractedSequence[] | null>(null);
  const [verificationNeeded, setVerificationNeeded] = useState<VerificationItem | null>(null);

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleExtract = () => {
    setIsProcessing(true);
    onExtract?.(selectedTypes);
    setTimeout(() => {
      setIsProcessing(false);
      // Extract sequences from patent data if available
      if (patent?.molecular_data?.sequences?.antibodies?.length && patent.molecular_data.sequences.antibodies.length > 0) {
        const sequences: ExtractedSequence[] = [];
        patent.molecular_data.sequences.antibodies.forEach((ab, idx) => {
          if (ab.heavy_chain?.hcdr3) {
            sequences.push({
              name: `${ab.name} HCDR3`,
              sequence: ab.heavy_chain.hcdr3.sequence,
              seqId: ab.heavy_chain.hcdr3.seq_id_no || idx + 1,
              confidence: ab.heavy_chain.hcdr3.confidence * 100,
              status: ab.heavy_chain.hcdr3.confidence > 0.7 ? 'verified' : 'review',
            });
          }
          if (ab.light_chain?.lcdr3) {
            sequences.push({
              name: `${ab.name} LCDR3`,
              sequence: ab.light_chain.lcdr3.sequence,
              seqId: ab.light_chain.lcdr3.seq_id_no || idx + 10,
              confidence: ab.light_chain.lcdr3.confidence * 100,
              status: ab.light_chain.lcdr3.confidence > 0.7 ? 'verified' : 'review',
            });
          }
        });
        setExtractedSequences(sequences);
        
        // Check for low confidence sequences that need verification
        const lowConfSeq = sequences.find((s) => s.confidence < 80);
        if (lowConfSeq) {
          setVerificationNeeded({
            id: `seq-${lowConfSeq.name}`,
            field: 'sequence',
            label: lowConfSeq.name,
            extractedValue: lowConfSeq.sequence,
            confidence: lowConfSeq.confidence / 100,
            alternatives: [],
            context: `Extracted from patent ${patent?.document_info?.patent_number ?? 'unknown'}`,
            section: 'sequences',
          });
        }
      }
    }, 2500);
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Patent Expert
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Dna size={20} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-textPrimary">Sequence Extraction</h3>
            <p className="text-xs text-textSecondary">
              {patent?.document_info.patent_number || 'US10808039B2'}
            </p>
          </div>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
            Antibody
          </span>
        </div>
      </div>

      {/* Verification Alert */}
      {verificationNeeded && (
        <div className="p-4 border-b border-white/10 bg-warning/10">
          <VerificationPrompt
            item={verificationNeeded}
            onVerify={(value) => {
              // Update sequence with verified value
              if (extractedSequences) {
                const updated = extractedSequences.map((s) =>
                  s.name === verificationNeeded.label
                    ? { ...s, sequence: value, confidence: 100, status: 'verified' as const }
                    : s
                );
                setExtractedSequences(updated);
              }
              setVerificationNeeded(null);
            }}
            onSkip={() => {
              setVerificationNeeded(null);
            }}
            onViewOriginal={() => {
              // TODO: Open PDF viewer
              console.log('View original PDF section');
            }}
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-4 border-b border-white/10 bg-purple-500/10">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={16} className="text-purple-400 animate-spin" />
            <span className="text-sm font-medium text-textPrimary">Extracting sequences...</span>
          </div>
          <div className="w-full h-2 bg-surfaceElevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '45%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-xs text-textSecondary">
            ✓ Parsing ST.26 listing • ● Validating sequences • ○ Cross-referencing
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!extractedSequences ? (
          <>
            {/* Sequence Type Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Select Sequence Types</h4>
              <div className="grid grid-cols-2 gap-2">
                {SEQUENCE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedTypes.includes(type.id)
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 bg-surfaceElevated'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          size={14}
                          className={selectedTypes.includes(type.id) ? 'text-purple-400' : 'text-textTertiary'}
                        />
                        <span className="text-sm font-medium text-textPrimary">{type.label}</span>
                      </div>
                      <p className="text-xs text-textSecondary">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numbering System */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">CDR Numbering System</h4>
              <div className="flex gap-2">
                {['Kabat', 'Chothia', 'IMGT'].map((system) => (
                  <button
                    key={system}
                    className="flex-1 py-2 px-3 rounded-lg border border-white/10 text-sm font-medium text-textSecondary hover:border-purple-500/50 hover:text-purple-400 transition-colors"
                  >
                    {system}
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Options */}
            <div className="p-4 bg-surfaceElevated border border-white/10 rounded-xl">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Validation Options</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-textSecondary">Cross-reference with ST.26 listing</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-textSecondary">BLAST against IMGT database</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-textSecondary">Check for known therapeutic sequences</span>
                </label>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Extracted Sequences Results */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-textPrimary">Extracted Sequences</h4>
                <div className="flex gap-2">
                  <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    <Copy size={12} />
                    Copy All
                  </button>
                  <button className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    <Download size={12} />
                    FASTA
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {extractedSequences.map((seq, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      seq.status === 'review'
                        ? 'bg-warning/10 border-warning/20'
                        : 'bg-surfaceElevated border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-textPrimary">{seq.name}</span>
                        <span className="text-xs text-textSecondary">SEQ ID: {seq.seqId}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          seq.confidence >= 90
                            ? 'bg-success/20 text-success'
                            : seq.confidence >= 70
                            ? 'bg-warning/20 text-warning'
                            : 'bg-danger/20 text-danger'
                        }`}
                      >
                        {seq.confidence}%
                      </span>
                    </div>
                    <div className="font-mono text-xs bg-surface p-2 rounded text-textPrimary">
                      {seq.sequence}
                    </div>
                    {seq.status === 'review' && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertTriangle size={12} className="text-warning" />
                        <span className="text-xs text-warning">Needs verification</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Similarity Alert */}
            {extractedSequences.some((s) => s.confidence === 100) && (
              <div className="p-4 bg-danger/10 rounded-xl border border-danger/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-danger mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-danger mb-1">Similarity Alert</h4>
                    <p className="text-xs text-textSecondary mb-2">
                      Some sequences show high similarity to known therapeutic antibodies.
                    </p>
                    <button className="text-xs text-danger font-medium hover:text-danger/80 flex items-center gap-1 transition-colors">
                      View FTO implications →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-white/10 bg-surfaceElevated">
        {!extractedSequences ? (
          <button
            onClick={handleExtract}
            disabled={selectedTypes.length === 0 || isProcessing}
            className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Dna size={16} />
                Extract Sequences
              </>
            )}
          </button>
        ) : (
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-surface border border-white/10 text-textPrimary rounded-xl font-semibold text-sm hover:bg-surfaceElevated flex items-center justify-center gap-2 transition-colors">
              <RefreshCw size={16} />
              Re-extract
            </button>
            <button className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors">
              <Shield size={16} />
              Run FTO Check
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
