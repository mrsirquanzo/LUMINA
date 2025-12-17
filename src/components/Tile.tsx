import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  X,
  MoreHorizontal,
  Send,
  Sparkles,
  BookOpen,
  ExternalLink,
  Clock,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import type { Citation } from '../types';
import type { AgentType } from '../lib/multiAgentTypes';
import Skeleton from './Skeleton';
import AgentBadge from './shared/AgentBadge';

interface TileProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  loading?: boolean;
  dataFreshness?: string;
  verified?: boolean;
  aiGenerated?: boolean;
  tileType?: 'genetic' | 'expression' | 'clinical' | 'safety' | 'market' | 'ip' | 'deal' | 'general';
  onExport?: () => void;
  extendedIntelligence?: React.ReactNode;
  methodology?: string;
  references?: Citation[];
  onClick?: () => void;
  agents?: readonly (AgentType | 'sonny')[];
  primaryAgent?: AgentType | 'sonny';
  onAgentClick?: (agent: AgentType | 'sonny', tileTitle: string, tileData?: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'sonny';
  content: string;
  timestamp: Date;
}

const tileVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const Tile = memo(function Tile({
  title,
  subtitle,
  icon,
  className = '',
  children,
  headerRight,
  loading = false,
  dataFreshness,
  verified = false,
  aiGenerated = false,
  tileType = 'general',
  onExport,
  extendedIntelligence,
  methodology,
  references = [],
  onClick,
  agents,
  primaryAgent,
  onAgentClick,
}: TileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Parse citations from children content
  const { contentWithCitations, citationIds } = useMemo<{
    contentWithCitations: React.ReactNode;
    citationIds: number[];
  }>(() => {
    if (typeof children === 'string') {
      const citationPattern = /\[(\d+)\]/g;
      const ids: number[] = [];
      const seenIds = new Set<number>();
      let match: RegExpExecArray | null;

      while ((match = citationPattern.exec(children)) !== null) {
        const id = parseInt(match[1], 10);
        if (!seenIds.has(id)) {
          ids.push(id);
          seenIds.add(id);
        }
      }

      const parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      const regex = /\[(\d+)\]/g;
      let citationMatch;

      while ((citationMatch = regex.exec(children)) !== null) {
        if (citationMatch.index > lastIndex) {
          parts.push(children.slice(lastIndex, citationMatch.index));
        }
        const citationId = parseInt(citationMatch[1], 10);
        const citation = references.find((ref) => ref.id === citationId);
        parts.push(
          <sup
            key={`citation-${citationMatch.index}`}
            className="inline-flex items-center cursor-pointer text-primary hover:text-primary/80 transition-colors group relative"
            onClick={() => {
              const citationElement = document.getElementById(`citation-${citationId}`);
              if (citationElement) {
                citationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            <span className="px-0.5">[{citationId}]</span>
            {citation && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-xs">
                <p className="font-semibold text-textPrimary mb-1">{citation.title}</p>
                <p className="text-textSecondary">{citation.authors}, {citation.journal} ({citation.year})</p>
              </div>
            )}
          </sup>
        );
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < children.length) {
        parts.push(children.slice(lastIndex));
      }

      return {
        contentWithCitations: parts.length > 0 ? parts : children,
        citationIds: ids,
      };
    }

    return { contentWithCitations: children, citationIds: [] };
  }, [children, references]);

  // Get suggested questions based on tile type
  const suggestedQuestions = useMemo(() => {
    const questions: Record<string, string[]> = {
      genetic: [
        'What is the strength of genetic validation for this target?',
        'Are there any concerning safety signals from genetic data?',
        'How does this compare to other validated targets?',
      ],
      expression: [
        'What is the therapeutic window?',
        'Which indications show the best expression differential?',
        'Are there safety organ concerns?',
      ],
      clinical: [
        'How does this compare to standard of care?',
        'What are the key efficacy endpoints?',
        'What safety signals should we monitor?',
      ],
      safety: [
        'What are the key safety concerns?',
        'How can we mitigate identified risks?',
        'What monitoring is required?',
      ],
      market: [
        'What is the market opportunity?',
        'Who are the key competitors?',
        'What are the pricing considerations?',
      ],
      ip: [
        'What are the key patent risks?',
        'What is the freedom to operate?',
        'When do key patents expire?',
      ],
      deal: [
        'How does this compare to recent deals?',
        'What is the valuation range?',
        'What are the key deal terms?',
      ],
      general: [
        'Can you explain this in more detail?',
        'What are the key takeaways?',
        'What should I focus on?',
      ],
    };
    return questions[tileType] || questions.general;
  }, [tileType]);

  // Helper to extract target symbol from tile context
  // Note: This is a placeholder - tiles should pass targetSymbol explicitly
  const extractTargetFromTile = useCallback((): string | null => {
    // Try to extract from title (e.g., "Expression Biology - TROP2")
    const titleMatch = title.match(/\b([A-Z]{2,10})\b/);
    if (titleMatch) {
      const commonGenes = ['EGFR', 'BRAF', 'TP53', 'CD19', 'TROP2', 'HER2', 'PD1', 'PDL1', 'TIGIT'];
      if (commonGenes.includes(titleMatch[1])) {
        return titleMatch[1];
      }
    }
    
    return null;
  }, [title]);

  // Simulate Sonny response
  const generateSonnyResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      setIsThinking(true);
      
      // Check if this is a target biology question and we have a target symbol
      const targetSymbol = extractTargetFromTile();
      const isTargetBiologyQuery = 
        targetSymbol && (
          userMessage.toLowerCase().includes('genetic') ||
          userMessage.toLowerCase().includes('validation') ||
          userMessage.toLowerCase().includes('druggability') ||
          userMessage.toLowerCase().includes('constraint') ||
          userMessage.toLowerCase().includes('compound') ||
          userMessage.toLowerCase().includes('mechanism') ||
          userMessage.toLowerCase().includes('safety') ||
          userMessage.toLowerCase().includes('target biology') ||
          userMessage.toLowerCase().includes('protein class')
        );

      // Route to target biology agent if appropriate
      if (isTargetBiologyQuery && targetSymbol) {
        try {
          const response = await fetch('/api/agents/target-biology', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              targetSymbol,
              query: userMessage,
              depth: 'standard',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get response from target biology agent');
          }

          const result = await response.json();
          setIsThinking(false);
          return result.answer || result.formatted || 'No response received.';
        } catch (error: any) {
          console.error('Target biology agent error:', error);
          // Fall through to Sonny orchestrator
        }
      }

      // Default: route through Sonny orchestrator
      try {
        // Add context about the current tile to the query
        const contextualQuery = `Regarding the ${title} tile: ${userMessage}`;
        
        // Call Sonny orchestrator API
        const orchestratorPath =
          typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? '/api/agents/orchestrator'
            : '/api/orchestrator';

        const response = await fetch(orchestratorPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: contextualQuery,
            documents: [],
            mode: 'fast',
            isDemo: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response from Sonny');
        }

        // Read SSE stream and extract synthesis
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let synthesis = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const eventData = line.substring(6);
                try {
                  const event = JSON.parse(eventData);
                  if (event.type === 'complete' && event.data.synthesis) {
                    synthesis = event.data.synthesis;
                  } else if (event.type === 'synthesis_progress' && event.data.text) {
                    synthesis = event.data.text;
                  }
                } catch (e) {
                  console.error('Failed to parse SSE event:', e);
                }
              }
            }
          }
        }

        setIsThinking(false);
        return synthesis || 'I apologize, but I could not generate a response. Please try again.';
      } catch (error: any) {
        setIsThinking(false);
        console.error('Sonny API error:', error);
        return `Error: ${error.message || 'Failed to connect to Sonny. Please make sure the backend server is running.'}`;
      }
    },
    [title, extractTargetFromTile]
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setChatInput('');

      const sonnyResponse = await generateSonnyResponse(message);
      const sonnyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'sonny',
        content: sonnyResponse,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, sonnyMessage]);
    },
    [generateSonnyResponse]
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!tileRef.current) return;

    const text = tileRef.current.innerText;
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Export menu handler
  const handleExportMenu = useCallback(async () => {
    if (onExport) {
      onExport();
    } else {
      // Default: copy to clipboard
      await handleCopy();
    }
  }, [onExport, handleCopy]);


  if (loading) {
    return (
      <div className={`glass rounded-3xl p-6 border border-white/5 ${className}`}>
        <div className="space-y-4">
          <Skeleton height={24} width="75%" />
          <Skeleton height={16} width="50%" />
          <Skeleton height={128} rounded="lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.article
        ref={tileRef}
        variants={tileVariants}
        initial="hidden"
        animate="visible"
        data-ai-generated={aiGenerated ? 'true' : 'false'}
        className={`group glass rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative card-hover overflow-hidden flex flex-col h-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
        aria-label={`${title} ${subtitle ? `- ${subtitle}` : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-shrink-0 px-1">
          <div className="flex items-start gap-3 flex-1">
            {icon && (
              <div className="text-primary mt-0.5" title={title}>
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-textPrimary">{title}</h3>
                {verified && (
                  <CheckCircle2
                    className="w-4 h-4 text-success flex-shrink-0"
                    aria-label="Verified"
                  />
                )}
              </div>
              {subtitle && (
                <p className="text-sm font-medium text-textSecondary line-clamp-1 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Agent badges */}
            {agents && agents.length > 0 && (
              <div className="flex items-center gap-1.5">
                {agents.map((agent) => (
                  <AgentBadge
                    key={agent}
                    agent={agent}
                    size="sm"
                    onClick={() => onAgentClick?.(agent, title, children)}
                  />
                ))}
              </div>
            )}
            {headerRight}
            {dataFreshness && (
              <div className="flex items-center gap-1 text-xs text-textTertiary">
                <Clock className="w-3 h-3" />
                <span>{dataFreshness}</span>
              </div>
            )}
            <button
              onClick={() => setIsExpanded(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/5 text-textSecondary hover:text-textPrimary focus-ring"
              aria-label={`Expand ${title} tile`}
              aria-expanded={isExpanded}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 text-base text-textSecondary leading-relaxed overflow-y-auto custom-scrollbar px-1 pb-1">
          {contentWithCitations}
        </div>
      </motion.article>

      {/* Expanded Modal */}
      {isExpanded &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsExpanded(false);
                }
              }}
            >
              <motion.div
                ref={modalContentRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="glass-elevated rounded-2xl w-full max-w-[1600px] h-[95vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                id="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {icon && <div className="text-primary">{icon}</div>}
                  <div>
                    <h2 id="modal-title" className="text-2xl font-bold text-textPrimary">{title}</h2>
                    {subtitle && <p className="text-sm text-textSecondary mt-1">{subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMenu}
                    className="p-2 rounded-lg hover:bg-white/5 text-textSecondary hover:text-textPrimary transition-colors"
                    aria-label="Export options"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-textSecondary hover:text-textPrimary transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Two Panel Layout */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Panel - Main Content */}
                <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
                  {/* Content wrapper - scrollable container for all content */}
                  <div className="flex-1 flex flex-col min-h-0 gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Original Content */}
                    {!extendedIntelligence && (
                      <div className="flex-shrink-0">
                        <h3 className="text-xl font-bold text-textPrimary mb-6">Overview</h3>
                        <div className="prose prose-invert max-w-none text-base leading-relaxed text-textSecondary">
                          {contentWithCitations}
                        </div>
                      </div>
                    )}

                    {/* Extended Intelligence - primary content when available */}
                    {extendedIntelligence && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 mb-6">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-bold text-textPrimary">Extended Intelligence</h3>
                        </div>
                        <div className="text-base leading-relaxed text-textSecondary">
                          {extendedIntelligence}
                        </div>
                      </div>
                    )}

                    {/* Original content when extended intelligence exists */}
                    {extendedIntelligence && (
                      <div className="flex-shrink-0 pt-6 border-t border-white/10">
                        <h3 className="text-xl font-bold text-textPrimary mb-4">Overview</h3>
                        <div className="prose prose-invert max-w-none text-base leading-relaxed text-textSecondary">
                          {contentWithCitations}
                        </div>
                      </div>
                    )}

                    {/* Methodology */}
                    {methodology && (
                      <div className="flex-shrink-0 pt-6 border-t border-white/10">
                        <button
                          onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
                          className="flex items-center gap-2 text-textPrimary hover:text-primary transition-colors mb-4"
                        >
                          <BookOpen className="w-5 h-5" />
                          <h3 className="text-xl font-bold">Methodology</h3>
                          <span className="ml-auto text-sm text-textSecondary">
                            {isMethodologyOpen ? 'Hide' : 'Show'}
                          </span>
                        </button>
                        {isMethodologyOpen && (
                          <div className="text-base leading-relaxed text-textSecondary bg-surface/50 rounded-lg p-4 animate-slide-up">
                            {methodology}
                          </div>
                        )}
                      </div>
                    )}

                    {/* References */}
                    {references.length > 0 && (
                      <div className="flex-shrink-0 pt-6 border-t border-white/10">
                        <h3 className="text-xl font-bold text-textPrimary mb-4">References</h3>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                        {(citationIds.length > 0
                          ? references.filter((ref) => citationIds.includes(ref.id))
                          : references
                        ).map((citation) => (
                            <div
                              key={citation.id}
                              id={`citation-${citation.id}`}
                              className="bg-surface/50 rounded-lg p-4 hover:bg-surface transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-primary font-semibold">[{citation.id}]</span>
                                    <span className="text-textPrimary font-medium">{citation.title}</span>
                                  </div>
                                  <p className="text-sm text-textSecondary mb-2">
                                    {citation.authors}. <em>{citation.journal}</em> ({citation.year})
                                  </p>
                                  <p className="text-sm text-textTertiary">{citation.keyFinding}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {citation.doi && (
                                    <a
                                      href={`https://doi.org/${citation.doi}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-white/5 text-textSecondary hover:text-textPrimary transition-colors"
                                      title="View DOI"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                  {citation.pmid && (
                                    <a
                                      href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg hover:bg-white/5 text-textSecondary hover:text-textPrimary transition-colors"
                                      title="View PubMed"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Chat */}
                <div className="w-[350px] border-l border-white/10 flex flex-col bg-surface/30 flex-shrink-0">
                  <div className="p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-textPrimary text-lg">Ask Sonny</h3>
                    </div>
                    <p className="text-sm text-textSecondary mt-1">
                      Get insights about this data
                    </p>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-textTertiary mb-4">Suggested questions:</p>
                        {suggestedQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(question)}
                            className="w-full text-left text-sm text-textSecondary hover:text-textPrimary bg-surface/50 hover:bg-surface rounded-lg p-3 transition-colors"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}

                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-surface text-textPrimary'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    ))}

                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-surface rounded-lg p-3">
                          <div className="flex items-center gap-2 text-textSecondary text-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-textTertiary rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-textTertiary rounded-full animate-bounce"
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-textTertiary rounded-full animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                            <span>Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(chatInput);
                          }
                        }}
                        placeholder="Ask a question..."
                        className="flex-1 bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <button
                        onClick={() => handleSendMessage(chatInput)}
                        disabled={!chatInput.trim() || isThinking}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
});
export default Tile;
