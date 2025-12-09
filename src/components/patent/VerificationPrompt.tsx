/**
 * Verification Prompt Component
 * Shows when extraction confidence is low and needs human verification
 */

import { useState } from 'react';
import { AlertTriangle, FileText, CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export interface VerificationItem {
  id: string;
  field: string;
  label: string;
  extractedValue: string;
  confidence: number;
  alternatives?: string[];
  context?: string;
  section?: string;
  pageNumber?: number;
}

interface VerificationPromptProps {
  item: VerificationItem;
  onVerify: (value: string) => void;
  onSkip: () => void;
  onViewOriginal?: () => void;
}

export default function VerificationPrompt({
  item,
  onVerify,
  onSkip,
  onViewOriginal,
}: VerificationPromptProps) {
  const [selectedValue, setSelectedValue] = useState<string>(item.extractedValue);
  const [customValue, setCustomValue] = useState<string>('');

  const confidenceColor = item.confidence >= 0.8 ? 'text-success' : item.confidence >= 0.6 ? 'text-warning' : 'text-danger';
  const confidenceBadge = item.confidence >= 0.8 ? '🟢' : item.confidence >= 0.6 ? '🟡' : '🟠';

  const handleVerify = () => {
    const valueToUse = selectedValue === 'other' ? customValue : selectedValue;
    if (valueToUse.trim()) {
      onVerify(valueToUse);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-surfaceElevated border border-warning/30 rounded-lg p-6 mb-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-textPrimary">⚠️ Verification Needed</h3>
          </div>
          <p className="text-sm text-textSecondary">
            I extracted this value but I'm not 100% confident. Can you verify?
          </p>
        </div>
      </div>

      {/* Verification Card */}
      <div className="bg-surface border border-white/10 rounded-lg p-4 mb-4">
        <div className="mb-3">
          <div className="text-sm font-medium text-textSecondary mb-1">{item.label}</div>
          {item.section && (
            <div className="text-xs text-textTertiary">{item.section}</div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-textSecondary mb-1">Extracted:</div>
            <div className="text-base font-semibold text-textPrimary">{item.extractedValue}</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-textSecondary">Confidence:</span>
            <span className={`text-xs font-medium ${confidenceColor}`}>
              {Math.round(item.confidence * 100)}% {confidenceBadge}
            </span>
          </div>

          {item.alternatives && item.alternatives.length > 0 && (
            <div>
              <div className="text-xs text-textSecondary mb-2">Could be:</div>
              <div className="text-sm text-textTertiary">
                {item.alternatives.join(', ')}
              </div>
            </div>
          )}

          {item.context && (
            <div className="pt-3 border-t border-white/10">
              <div className="text-xs text-textSecondary mb-1">Context:</div>
              <div className="text-xs text-textPrimary font-mono bg-surfaceElevated p-2 rounded">
                {item.context}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Original Button */}
      {onViewOriginal && (
        <button
          onClick={onViewOriginal}
          className="mb-4 w-full px-4 py-2 bg-surface border border-white/10 rounded-lg hover:border-primary/50 transition-colors text-sm text-textSecondary hover:text-textPrimary flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          View Original PDF Section
        </button>
      )}

      {/* Question */}
      <div className="mb-4">
        <p className="text-sm font-medium text-textPrimary mb-3">What's the correct value?</p>

        {/* Value Options */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[item.extractedValue, ...(item.alternatives || [])].slice(0, 3).map((value, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedValue(value);
                setCustomValue('');
              }}
              className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                selectedValue === value
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20'
              }`}
            >
              {value}
            </button>
          ))}
          <button
            onClick={() => setSelectedValue('other')}
            className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
              selectedValue === 'other'
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-surface border-white/10 text-textSecondary hover:border-white/20'
            }`}
          >
            Other...
          </button>
        </div>

        {/* Custom Value Input */}
        {selectedValue === 'other' && (
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Enter correct value..."
            className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50"
            autoFocus
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleVerify}
          disabled={!selectedValue || (selectedValue === 'other' && !customValue.trim())}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Confirm
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-2 bg-surface border border-white/10 rounded-lg hover:border-white/20 transition-colors text-sm text-textSecondary hover:text-textPrimary"
        >
          Skip - Use Best Guess
        </button>
      </div>
    </motion.div>
  );
}
