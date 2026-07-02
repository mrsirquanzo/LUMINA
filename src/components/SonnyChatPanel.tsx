import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Minimize2, Loader2 } from 'lucide-react';
import type { ProcessedDocument, ExecutionMode } from '../lib/multiAgentTypes';

// Lazy load MultiAgentCollaboration to avoid blocking
const MultiAgentCollaboration = lazy(() => import('./agents/MultiAgentCollaboration'));

interface SonnyChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  documents?: ProcessedDocument[];
  targetName?: string;
}

function SonnyChatPanel({
  isOpen,
  onClose,
  initialQuery,
  documents = [],
  targetName = 'this target',
}: SonnyChatPanelProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [mode, setMode] = useState<ExecutionMode>('fast');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [processedDocuments] = useState<ProcessedDocument[]>(documents);
  const [isMinimized, setIsMinimized] = useState(false);

  // When panel opens with initial query, start analysis
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && !showAnalysis) {
      setQuery(initialQuery);
      // Start analysis automatically when panel opens with a query
      setTimeout(() => {
        setShowAnalysis(true);
      }, 300); // Small delay to allow panel animation
    } else if (isOpen && !initialQuery) {
      // Reset if opened without query
      setShowAnalysis(false);
      setQuery('');
    }
  }, [isOpen, initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartAnalysis = () => {
    if (query.trim()) {
      setShowAnalysis(true);
    }
  };

  const handleReset = () => {
    setShowAnalysis(false);
    setQuery('');
  };

  const handleClose = () => {
    setShowAnalysis(false);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: isMinimized ? 'calc(100% - 400px)' : 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-4xl bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surfaceElevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-textPrimary">Sonny</h2>
                  <p className="text-xs text-textSecondary">Multi-Agent Intelligence</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-textTertiary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                  aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 text-textTertiary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {!showAnalysis ? (
                // Query Input View
                <div className="h-full flex flex-col p-6">
                  <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                    <div className="text-center mb-8">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
                      <h3 className="text-2xl font-semibold text-textPrimary mb-2">
                        Ask Sonny Anything
                      </h3>
                      <p className="text-textSecondary">
                        Get comprehensive insights about {targetName} from our specialized AI agents
                      </p>
                    </div>

                    {/* Mode Selection */}
                    <div className="w-full mb-6">
                      <label className="block text-sm font-medium text-textSecondary mb-3">
                        Analysis Mode
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setMode('fast')}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                            mode === 'fast'
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surfaceElevated border-border text-textSecondary hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium">Fast</div>
                          <div className="text-xs mt-1">Parallel analysis (~30s)</div>
                        </button>
                        <button
                          onClick={() => setMode('thorough')}
                          className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                            mode === 'thorough'
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surfaceElevated border-border text-textSecondary hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium">Thorough</div>
                          <div className="text-xs mt-1">Sequential deep dive (~2-3min)</div>
                        </button>
                      </div>
                    </div>

                    {/* Query Input */}
                    <div className="w-full mb-6">
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleStartAnalysis();
                          }
                        }}
                        placeholder={`Ask Sonny about ${targetName}...`}
                        className="w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-textTertiary mt-2">
                        Press ⌘+Enter or Ctrl+Enter to start analysis
                      </p>
                    </div>

                    {/* Example Queries */}
                    <div className="w-full">
                      <p className="text-sm text-textSecondary mb-3">Try asking:</p>
                      <div className="space-y-2">
                        {[
                          `What are the key safety concerns for ${targetName}?`,
                          `Compare ${targetName} to HER2 from a financial perspective`,
                          `What patents exist related to ${targetName}?`,
                          `What's the market opportunity for ${targetName}?`,
                        ].map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setQuery(example);
                              setTimeout(() => handleStartAnalysis(), 100);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-textSecondary bg-surfaceElevated border border-border rounded-lg hover:border-primary/50 hover:text-textPrimary transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={handleStartAnalysis}
                      disabled={!query.trim()}
                      className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Start Analysis
                    </button>
                  </div>
                </div>
              ) : (
                // Analysis View
                <div className="h-full overflow-y-auto">
                  <div className="p-4 border-b border-border bg-surfaceElevated flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-sm text-textSecondary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                      >
                        ← New Query
                      </button>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-sm text-textSecondary">
                        Mode: <span className="text-textPrimary font-medium capitalize">{mode}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    }>
                      <MultiAgentCollaboration
                        query={query}
                        documents={processedDocuments}
                        mode={mode}
                        isDemo={false}
                        customAgents={undefined}
                        mcpEnabled={false}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SonnyChatPanel;
