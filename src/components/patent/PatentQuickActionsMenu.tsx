/**
 * Quick Actions Menu for Patent Analysis Results
 * Context menu with actions like View Full, Sequences, FTO, Compare, Switch Agents, Export, Remove
 */

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, FileText, Dna, AlertTriangle, TrendingUp, Download, Trash2, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatentExtractionResult } from '../../lib/patentParsing/types';

interface PatentQuickActionsMenuProps {
  patentData: PatentExtractionResult;
  onViewFull?: () => void;
  onViewSequences?: () => void;
  onViewFTO?: () => void;
  onCompare?: () => void;
  onSwitchToAgent?: (agent: 'clinical' | 'financial' | 'regulatory' | 'market_research' | 'target_biology') => void;
  onExport?: () => void;
  onRemove?: () => void;
  className?: string;
}

export default function PatentQuickActionsMenu({
  patentData,
  onViewFull,
  onViewSequences,
  onViewFTO,
  onCompare,
  onSwitchToAgent,
  onExport,
  onRemove,
  className = '',
}: PatentQuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-surface rounded transition-colors text-textSecondary hover:text-textPrimary"
        aria-label="More actions"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-56 bg-surfaceElevated border border-border rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="py-1">
              {/* View Actions */}
              <div className="px-2 py-1.5">
                <div className="text-xs font-semibold text-textSecondary uppercase mb-1">View</div>
                {onViewFull && (
                  <button
                    onClick={() => handleAction(onViewFull)}
                    className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Analysis
                  </button>
                )}
                {onViewSequences && patentData.molecular_data.sequences.antibodies.length > 0 && (
                  <button
                    onClick={() => handleAction(onViewSequences)}
                    className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                  >
                    <Dna className="w-4 h-4" />
                    Sequences
                  </button>
                )}
                {onViewFTO && (
                  <button
                    onClick={() => handleAction(onViewFTO)}
                    className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    FTO Detail
                  </button>
                )}
                {onCompare && (
                  <button
                    onClick={() => handleAction(onCompare)}
                    className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Compare
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border my-1" />

              {/* Switch to Other Agents */}
              {onSwitchToAgent && (
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-textSecondary uppercase mb-1">Switch To</div>
                  {[
                    { id: 'target_biology' as const, label: 'Scientist', icon: Sparkles },
                    { id: 'financial' as const, label: 'Scout', icon: BarChart3 },
                  ].map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleAction(() => onSwitchToAgent(agent.id))}
                        className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{agent.label}</span>
                        <ArrowRight className="w-3 h-3 ml-auto text-textTertiary" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-border my-1" />

              {/* Export & Remove */}
              <div className="px-2 py-1.5">
                {onExport && (
                  <button
                    onClick={() => handleAction(onExport)}
                    className="w-full px-3 py-2 text-left text-sm text-textPrimary hover:bg-surface rounded transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={() => handleAction(onRemove)}
                    className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 rounded transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
