import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Lock,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Grid3X3,
  Shield,
  Briefcase,
  Search,
  Clock,
  Layers,
  Database,
  Dna,
  BarChart3,
  Calculator,
  Activity,
} from 'lucide-react';
import type { ProcessedDocument, ExecutionMode } from '../lib/multiAgentTypes';
import type { AgentType } from '../lib/llm/agentConfig';
import { AGENT_INFO } from '../lib/customAgentTeams';
import LoginModal from './shared/LoginModal';
import PatentAgentInterface from './patent/PatentAgentInterface';
import RecentPatentAnalysisList from './patent/RecentPatentAnalysisList';
import AgentContextSummary from './patent/AgentContextSummary';
import PatentFullAnalysisPanel from './patent/PatentFullAnalysisPanel';
import DataSourcesSection from './patent/DataSourcesSection';
import GenerateReportSection from './patent/GenerateReportSection';
import CollapsibleSection from './shared/CollapsibleSection';
import FinancialAgentInterface from './financial/FinancialAgentInterface';
import FinancialDataSourcesSection from './financial/FinancialDataSourcesSection';
import FinancialGenerateReportSection from './financial/FinancialGenerateReportSection';
import ClinicalAgentInterface from './clinical/ClinicalAgentInterface';
import ClinicalDataSourcesSection from './clinical/ClinicalDataSourcesSection';
import ClinicalGenerateReportSection from './clinical/ClinicalGenerateReportSection';
import MarketResearchAgentInterface from './market/MarketResearchAgentInterface';
import RegulatoryAgentInterface from './regulatory/RegulatoryAgentInterface';
import DataSourcesConfigModal from './patent/DataSourcesConfigModal';

// Custom Panel Icon - Same as left sidebar
const PanelIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Left rectangle (wider) - represents the main panel */}
    <rect x="1" y="1" width="11" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Right rectangle (narrower) - represents the sidebar */}
    <rect x="13.5" y="1" width="5.5" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

// Panel configuration - Same as sidebar but for right panel
const STORAGE_KEY = 'lumina-sonny-panel-collapsed';
const WIDTH_STORAGE_KEY = 'lumina-sonny-panel-width';
const AGENT_STORAGE_KEY = 'lumina-sonny-selected-agent';
const MIN_WIDTH = 400;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 600;
const COLLAPSED_WIDTH = 60;

// Sonny orchestrator info
const SONNY_INFO = {
  name: 'Sonny (Orchestrator)',
  icon: '🎭',
  description: 'Coordinates all agents for comprehensive analysis',
  color: 'primary',
};

// Agent color theme mapping
const AGENT_COLORS: Record<AgentType | 'sonny', string> = {
  sonny: 'primary',
  clinical: 'blue',
  patent: 'purple',
  financial: 'green',
  regulatory: 'orange',
  market_research: 'teal',
  target_biology: 'emerald',
};

// Lazy load MultiAgentCollaboration to avoid blocking
const MultiAgentCollaboration = lazy(() => import('./agents/MultiAgentCollaboration'));

interface SonnySidePanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  targetName?: string;
  initialQuery?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
}

export default function SonnySidePanel({
  isCollapsed,
  onToggleCollapse,
  targetName = 'this target',
  initialQuery,
  width,
  onWidthChange,
}: SonnySidePanelProps) {
  const [query, setQuery] = useState(initialQuery || '');
  const [mode, setMode] = useState<ExecutionMode>('fast');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [processedDocuments] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(width || DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isDemo, setIsDemo] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | 'sonny'>('sonny');
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [showPatentAnalysis, setShowPatentAnalysis] = useState(false);
  const [agentContext, setAgentContext] = useState<any>(null);
  const [showContextSummary, setShowContextSummary] = useState(false);
  const [patentActiveTab, setPatentActiveTab] = useState<'analyze' | 'landscape' | 'fto' | 'portfolio'>('analyze');
  const [showFinancialAnalysis, setShowFinancialAnalysis] = useState(false);
  const [showDataSourcesConfig, setShowDataSourcesConfig] = useState(false);
  const [financialActiveTab, setFinancialActiveTab] = useState<'analyze' | 'models' | 'deals' | 'monitor'>('analyze');
  const [patentChatInput, setPatentChatInput] = useState('');
  const [isPatentProcessing, setIsPatentProcessing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load selected agent from localStorage on mount
  useEffect(() => {
    const savedAgent = localStorage.getItem(AGENT_STORAGE_KEY);
    if (savedAgent && (savedAgent === 'sonny' || Object.keys(AGENT_INFO).includes(savedAgent))) {
      setSelectedAgent(savedAgent as AgentType | 'sonny');
    }
  }, []);

  // Save selected agent to localStorage
  useEffect(() => {
    localStorage.setItem(AGENT_STORAGE_KEY, selectedAgent);
  }, [selectedAgent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
    };

    if (isAgentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAgentDropdownOpen]);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        // Check if response is ok and has content
        if (!response.ok) {
          console.warn('Auth check returned non-ok status:', response.status);
          setIsAuthenticated(false);
          return;
        }
        
        // Check if response has content before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Auth check returned non-JSON response');
          setIsAuthenticated(false);
          return;
        }
        
        // Try to parse JSON, but handle empty responses
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn('Auth check returned empty response');
          setIsAuthenticated(false);
          return;
        }
        
        try {
          const data = JSON.parse(text);
          setIsAuthenticated(data.authenticated || false);
        } catch (parseError) {
          console.error('Failed to parse auth check response as JSON:', parseError);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Update panel width if prop changes
  useEffect(() => {
    if (width !== undefined) {
      setPanelWidth(width);
    }
  }, [width]);

  // Load width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setPanelWidth(width);
      }
    }
  }, []);

  // Save width to localStorage
  useEffect(() => {
    if (!isCollapsed && panelWidth !== DEFAULT_WIDTH) {
      localStorage.setItem(WIDTH_STORAGE_KEY, panelWidth.toString());
    }
  }, [panelWidth, isCollapsed]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      const rect = panelRef.current.getBoundingClientRect();
      // For right panel, calculate width from right edge to mouse position
      const newWidth = rect.right - e.clientX;
      
      // Clamp width between min and max
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setPanelWidth(clampedWidth);
      onWidthChange?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Auto-start if initial query is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !showAnalysis && !isCollapsed) {
      setQuery(initialQuery);
      setTimeout(() => {
        setShowAnalysis(true);
        setIsProcessing(true);
      }, 300);
    }
  }, [initialQuery, isCollapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when collapsed
  useEffect(() => {
    if (isCollapsed && showAnalysis) {
      // Don't reset, just hide - user might want to see it again
    }
  }, [isCollapsed, showAnalysis]);

  const handleStartAnalysis = () => {
    if (query.trim() && !isProcessing) {
      setIsProcessing(true);
      setShowAnalysis(true);
    }
  };

  const handleToggleMode = async (newMode: 'demo' | 'live') => {
    if (newMode === 'live') {
      // Check authentication before enabling live mode
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }
      setIsDemo(false);
    } else {
      setIsDemo(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsDemo(false);
    setShowLoginModal(false);
  };

  const handleReset = () => {
    setShowAnalysis(false);
    setQuery('');
    setIsProcessing(false);
  };

  // Listen for agent switch with context events from PatentAgentInterface
  useEffect(() => {
    const handleSwitchWithContext = (event: CustomEvent) => {
      const { targetAgent, context } = event.detail;
      setAgentContext({ ...context, targetAgent });
      setShowContextSummary(true);
      setIsAgentDropdownOpen(false);
    };

    window.addEventListener('switch-agent-with-context', handleSwitchWithContext as EventListener);
    return () => {
      window.removeEventListener('switch-agent-with-context', handleSwitchWithContext as EventListener);
    };
  }, []);

  const handleAgentSelect = (agent: AgentType | 'sonny') => {
    // Check if we have context from previous agent
    const hasContext = agentContext && agentContext.fromAgent !== agent;
    
    if (hasContext && agent !== 'sonny') {
      // Show context summary before switching
      setAgentContext({ ...agentContext, targetAgent: agent });
      setShowContextSummary(true);
      setIsAgentDropdownOpen(false);
      // Don't switch yet - wait for user decision
      return;
    }
    
    // Normal switch without context
    setSelectedAgent(agent);
    setIsAgentDropdownOpen(false);
    setShowContextSummary(false);
    setAgentContext(null);
    // Reset query and analysis view when switching agents
    setQuery('');
    if (showAnalysis) {
      setShowAnalysis(false);
      setIsProcessing(false);
    }
    setShowPatentAnalysis(false); // Reset patent analysis view when switching agents
    setShowFinancialAnalysis(false); // Reset financial analysis view when switching agents
  };

  // Handle context decision
  const handleUseContext = (targetAgent?: AgentType | 'sonny') => {
    const agent = targetAgent || agentContext?.targetAgent || 'sonny';
    setSelectedAgent(agent);
    setIsAgentDropdownOpen(false);
    setShowContextSummary(false);
    // Context will be passed to the agent via query or state
    if (agentContext?.patentData) {
      // Pre-populate query with context-aware prompt
      const contextPrompt = agentContext.patentData.antibodiesCount > 0
        ? `Based on patent ${agentContext.patentData.patentNumber} with ${agentContext.patentData.antibodiesCount} antibodies extracted, `
        : `Based on patent ${agentContext.patentData.patentNumber}, `;
      setQuery(contextPrompt);
    }
    // Clear context after using it
    setAgentContext(null);
  };

  const handleStartFresh = (targetAgent?: AgentType | 'sonny') => {
    const agent = targetAgent || agentContext?.targetAgent || 'sonny';
    setSelectedAgent(agent);
    setIsAgentDropdownOpen(false);
    setShowContextSummary(false);
    setAgentContext(null);
    setQuery('');
  };

  // Get current agent info
  const currentAgentInfo = selectedAgent === 'sonny' 
    ? SONNY_INFO 
    : { ...AGENT_INFO[selectedAgent], icon: AGENT_INFO[selectedAgent].icon };

  // Get theme color classes (full Tailwind class names)
  const getThemeClasses = (color: string) => {
    const colorMap: Record<string, {
      bg: string;
      border: string;
      text: string;
      bgHover: string;
      bgLight: string;
      borderLight: string;
    }> = {
      primary: {
        bg: 'bg-primary',
        border: 'border-primary',
        text: 'text-primary',
        bgHover: 'hover:bg-primary/90',
        bgLight: 'bg-primary/20',
        borderLight: 'border-primary/20',
      },
      blue: {
        bg: 'bg-blue-600',
        border: 'border-blue-600',
        text: 'text-blue-600',
        bgHover: 'hover:bg-blue-700',
        bgLight: 'bg-blue-600/20',
        borderLight: 'border-blue-600/20',
      },
      purple: {
        bg: 'bg-purple-600',
        border: 'border-purple-600',
        text: 'text-purple-600',
        bgHover: 'hover:bg-purple-700',
        bgLight: 'bg-purple-600/20',
        borderLight: 'border-purple-600/20',
      },
      green: {
        bg: 'bg-green-600',
        border: 'border-green-600',
        text: 'text-green-600',
        bgHover: 'hover:bg-green-700',
        bgLight: 'bg-green-600/20',
        borderLight: 'border-green-600/20',
      },
      orange: {
        bg: 'bg-orange-600',
        border: 'border-orange-600',
        text: 'text-orange-600',
        bgHover: 'hover:bg-orange-700',
        bgLight: 'bg-orange-600/20',
        borderLight: 'border-orange-600/20',
      },
      teal: {
        bg: 'bg-teal-600',
        border: 'border-teal-600',
        text: 'text-teal-600',
        bgHover: 'hover:bg-teal-700',
        bgLight: 'bg-teal-600/20',
        borderLight: 'border-teal-600/20',
      },
      emerald: {
        bg: 'bg-emerald-600',
        border: 'border-emerald-600',
        text: 'text-emerald-600',
        bgHover: 'hover:bg-emerald-700',
        bgLight: 'bg-emerald-600/20',
        borderLight: 'border-emerald-600/20',
      },
    };
    return colorMap[color] || colorMap.primary;
  };

  const themeClasses = getThemeClasses(AGENT_COLORS[selectedAgent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleStartAnalysis();
    }
  };

  const currentWidth = panelWidth;

  // When collapsed, don't render the panel at all - it's controlled from the header
  if (isCollapsed) {
    return null;
  }

  // Expanded state - full panel
  return (
    <motion.aside
      ref={panelRef}
      initial={false}
      animate={{ width: panelWidth }}
      transition={{ duration: isResizing ? 0 : 0.3 }}
      className="fixed right-0 top-20 h-[calc(100vh-5rem)] bg-surface border-l border-white/10 shadow-2xl z-40 flex flex-col"
      style={{ width: `${panelWidth}px` }}
      role="complementary"
      aria-label="Sonny agent panel"
    >
      {/* Resize Handle - Left side (since panel is on right) */}
      {!isCollapsed && (
        <div
          ref={resizeHandleRef}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 group"
          aria-label="Resize panel"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-primary/60 transition-colors" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-primary/30 rounded-full transition-colors" />
        </div>
      )}


      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col pt-4">
        {/* Agent Selector - Always visible at top (except in multi-agent analysis or when in agent-specific analysis views) */}
        {/* Don't show top-level selector when in Financial/Patent/Clinical/Market Research analysis views - they have their own */}
        {/* Also don't show when Financial Agent, Clinical Agent, or Market Research Agent tabbed interface is active - they have their own */}
        {!showAnalysis && 
         !(selectedAgent === 'patent' && showPatentAnalysis) && 
         !(selectedAgent === 'financial' && showFinancialAnalysis) && 
         !(selectedAgent === 'financial' && !showFinancialAnalysis) &&
         !(selectedAgent === 'clinical') &&
         !(selectedAgent === 'market_research') &&
         !(selectedAgent === 'regulatory') && (
          <div className="px-6 pb-4 border-b border-white/10">
            {/* Agent Selector Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Talking to:
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className={`w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                    isAgentDropdownOpen ? themeClasses.border : ''
                  } hover:border-white/20`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentAgentInfo.icon}</span>
                    <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAgentDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    {/* Sonny Option */}
                    <button
                      onClick={() => handleAgentSelect('sonny')}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
                    >
                      <span className="text-lg">{SONNY_INFO.icon}</span>
                      <div className="flex-1">
                        <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                        <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
                      </div>
                    </button>
                    
                    {/* Individual Agent Options */}
                    {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                      const agentInfo = AGENT_INFO[agent];
                      const agentThemeClasses = getThemeClasses(AGENT_COLORS[agent]);
                      return (
                        <button
                          key={agent}
                          onClick={() => handleAgentSelect(agent)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                            selectedAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                          }`}
                        >
                          <span className="text-lg">{agentInfo.icon}</span>
                          <div className="flex-1">
                            <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                            <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-textTertiary mt-2">
                {currentAgentInfo.description}
              </p>
            </div>

            {/* Context Summary - Show when switching agents with available context */}
            {showContextSummary && agentContext && (
              <AgentContextSummary
                context={agentContext}
                onUseContext={() => {
                  handleUseContext();
                }}
                onStartFresh={() => {
                  handleStartFresh();
                }}
                onDismiss={() => {
                  setShowContextSummary(false);
                  // Still switch agent but without context
                  handleStartFresh();
                }}
              />
            )}
          </div>
        )}

        {selectedAgent === 'patent' && showPatentAnalysis ? (
          // Patent Agent Interface (shown when "Analyze Patent" is clicked)
          <div className="flex-1 overflow-y-auto relative">
            {/* Agent Selector - Show even in analysis mode */}
            <div className="px-6 pt-4 pb-4 border-b border-white/10 bg-surfaceElevated sticky top-0 z-20">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className={`w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                    isAgentDropdownOpen ? getThemeClasses('purple').border : ''
                  } hover:border-white/20`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentAgentInfo.icon}</span>
                    <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAgentDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    {/* Sonny Option */}
                    <button
                      onClick={() => {
                        handleAgentSelect('sonny');
                        setShowPatentAnalysis(false);
                        window.dispatchEvent(new CustomEvent('reset-patent-interface'));
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
                    >
                      <span className="text-lg">{SONNY_INFO.icon}</span>
                      <div className="flex-1">
                        <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                        <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
                      </div>
                    </button>
                    
                    {/* Individual Agent Options */}
                    {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                      const agentInfo = AGENT_INFO[agent];
                      const agentThemeClasses = getThemeClasses(AGENT_COLORS[agent]);
                      return (
                        <button
                          key={agent}
                          onClick={() => {
                            handleAgentSelect(agent);
                            setShowPatentAnalysis(false);
                            if (agent === 'patent') {
                              window.dispatchEvent(new CustomEvent('reset-patent-interface'));
                            } else if (agent === 'financial') {
                              window.dispatchEvent(new CustomEvent('reset-financial-interface'));
                            }
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                            selectedAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                          }`}
                        >
                          <span className="text-lg">{agentInfo.icon}</span>
                          <div className="flex-1">
                            <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                            <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Navigation Buttons - Show when in patent analysis */}
            <div className="absolute top-20 left-4 z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  setShowPatentAnalysis(false);
                  // Dispatch event to reset detail panels
                  window.dispatchEvent(new CustomEvent('reset-patent-interface'));
                }}
                className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:border-primary/50 hover:bg-surface transition-colors text-sm text-textSecondary hover:text-textPrimary"
              >
                <ChevronLeft size={16} />
                Back to Patent Expert
              </button>
            </div>
            <PatentAgentInterface 
              onBackToChat={() => {
                setShowPatentAnalysis(false);
                // Dispatch event to reset detail panels
                window.dispatchEvent(new CustomEvent('reset-patent-interface'));
              }} 
            />
          </div>
        ) : selectedAgent === 'financial' && showFinancialAnalysis ? (
          // Financial Agent Interface (shown when in analysis/detail view)
          <div className="flex-1 overflow-y-auto relative">
            {/* Agent Selector - Show even in analysis mode */}
            <div className="px-6 pt-4 pb-4 border-b border-white/10 bg-surfaceElevated sticky top-0 z-20">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                  className={`w-full px-4 py-3 bg-surface border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                    isAgentDropdownOpen ? getThemeClasses('green').border : ''
                  } hover:border-white/20`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentAgentInfo.icon}</span>
                    <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAgentDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    {/* Sonny Option */}
                    <button
                      onClick={() => {
                        handleAgentSelect('sonny');
                        setShowFinancialAnalysis(false);
                        window.dispatchEvent(new CustomEvent('reset-financial-interface'));
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
                    >
                      <span className="text-lg">{SONNY_INFO.icon}</span>
                      <div className="flex-1">
                        <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                        <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
                      </div>
                    </button>
                    
                    {/* Individual Agent Options */}
                    {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                      const agentInfo = AGENT_INFO[agent];
                      const agentThemeClasses = getThemeClasses(AGENT_COLORS[agent]);
                      return (
                        <button
                          key={agent}
                          onClick={() => {
                            handleAgentSelect(agent);
                            setShowFinancialAnalysis(false);
                            if (agent === 'patent') {
                              window.dispatchEvent(new CustomEvent('reset-patent-interface'));
                            } else if (agent === 'financial') {
                              window.dispatchEvent(new CustomEvent('reset-financial-interface'));
                            }
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                            selectedAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                          }`}
                        >
                          <span className="text-lg">{agentInfo.icon}</span>
                          <div className="flex-1">
                            <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                            <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Navigation Buttons - Show when in financial analysis */}
            <div className="absolute top-20 left-4 z-10 flex items-center gap-2">
              <button
                onClick={() => {
                  setShowFinancialAnalysis(false);
                  // Dispatch event to reset detail panels
                  window.dispatchEvent(new CustomEvent('reset-financial-interface'));
                }}
                className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:border-green-500/50 hover:bg-surface transition-colors text-sm text-textSecondary hover:text-textPrimary"
              >
                <ChevronLeft size={16} />
                Back to Financial Analyst
              </button>
            </div>
            <FinancialAgentInterface 
              onBackToChat={() => {
                setShowFinancialAnalysis(false);
                // Dispatch event to reset detail panels
                window.dispatchEvent(new CustomEvent('reset-financial-interface'));
              }}
            />
          </div>
        ) : !showAnalysis ? (
          // Query Input View (Sonny or other agents)
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col max-w-full">

              {/* Agent Mode Toggle - Only show for Sonny */}
              {selectedAgent === 'sonny' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Agent Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleMode('demo')}
                      disabled={isProcessing}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        isDemo
                          ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                          : 'bg-surfaceElevated border-white/10 text-textSecondary hover:border-white/20'
                      } disabled:opacity-50`}
                    >
                      <div className="font-medium flex items-center justify-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Demo
                      </div>
                      <div className="text-xs mt-0.5">Pre-recorded</div>
                    </button>
                    <button
                      onClick={() => handleToggleMode('live')}
                      disabled={isProcessing}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        !isDemo
                          ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                          : 'bg-surfaceElevated border-white/10 text-textSecondary hover:border-white/20'
                      } disabled:opacity-50 relative`}
                    >
                      <div className="font-medium flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Live
                        {!isAuthenticated && (
                          <Lock className="w-3 h-3 text-textTertiary" />
                        )}
                      </div>
                      <div className="text-xs mt-0.5">
                        {isAuthenticated ? 'Real-time AI' : 'Auth required'}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Info Banner - Only for Sonny */}
              {selectedAgent === 'sonny' && (
                <>
                  {isDemo && (
                    <div className={`mb-4 p-3 ${themeClasses.bgLight} border ${themeClasses.borderLight} rounded-lg`}>
                      <p className="text-xs text-textSecondary">
                        <strong className="text-textPrimary">Demo Mode:</strong> Using pre-recorded scenarios. No API calls.
                      </p>
                    </div>
                  )}

                  {!isDemo && isAuthenticated && (
                    <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-xs text-textSecondary">
                        <strong className="text-success">Live Mode:</strong> Real-time AI agents with full analysis capabilities.
                      </p>
                    </div>
                  )}

                  {!isDemo && !isAuthenticated && (
                    <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-xs text-textSecondary">
                        <strong className="text-warning">⚠️ Authentication Required:</strong> Please authenticate to use Live Mode.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Execution Mode Selection (Fast/Thorough) - Only for Sonny */}
              {selectedAgent === 'sonny' && !isDemo && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Execution Speed
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('fast')}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        mode === 'fast'
                          ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                          : 'bg-surfaceElevated border-white/10 text-textSecondary hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium">Fast</div>
                      <div className="text-xs mt-0.5">~30s</div>
                    </button>
                    <button
                      onClick={() => setMode('thorough')}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                        mode === 'thorough'
                          ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                          : 'bg-surfaceElevated border-white/10 text-textSecondary hover:border-white/20'
                      }`}
                    >
                      <div className="font-medium">Thorough</div>
                      <div className="text-xs mt-0.5">~2-3min</div>
                    </button>
                  </div>
                </div>
              )}


              {/* Query Input - Removed for Patent Agent, Financial Agent, Clinical Agent, and Market Research Agent (shown at bottom instead) */}
              {selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && (
                <div className="mb-4">
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        selectedAgent === 'sonny'
                          ? `Ask Sonny about ${targetName}...`
                          : selectedAgent === 'regulatory'
                          ? `Ask about FDA pathways, approval timelines, or compliance...`
                          : selectedAgent === 'market_research'
                          ? `Ask about market size, competitors, or pricing...`
                          : selectedAgent === 'target_biology'
                          ? `Ask about biological mechanisms, genetics, or druggability...`
                          : `Ask ${currentAgentInfo.name}...`
                      }
                      className={`w-full pl-12 pr-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-white/30 resize-none`}
                      rows={6}
                      disabled={isProcessing}
                    />
                  </div>
                  <p className="text-xs text-textTertiary mt-2">
                    Press ⌘+Enter or Ctrl+Enter to start analysis
                  </p>
                </div>
              )}


              {/* Clinical Agent - Tabbed Interface - Use full ClinicalAgentInterface component */}
              {selectedAgent === 'clinical' && (
                <>
                  {/* Agent Selector - Match Patent/Financial Agent structure exactly (same padding and width) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Talking to:
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                        className={`w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                          isAgentDropdownOpen ? getThemeClasses('blue').border : ''
                        } hover:border-white/20`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currentAgentInfo.icon}</span>
                          <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isAgentDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                        >
                          {/* Sonny Option */}
                          <button
                            onClick={() => handleAgentSelect('sonny')}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
                          >
                            <span className="text-lg">{SONNY_INFO.icon}</span>
                            <div className="flex-1">
                              <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                              <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
                            </div>
                          </button>
                          
                          {/* Individual Agent Options */}
                          {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                            const agentInfo = AGENT_INFO[agent];
                            const agentThemeClasses = getThemeClasses(AGENT_COLORS[agent]);
                            return (
                              <button
                                key={agent}
                                onClick={() => handleAgentSelect(agent)}
                                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                                  selectedAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                                }`}
                              >
                                <span className="text-lg">{agentInfo.icon}</span>
                                <div className="flex-1">
                                  <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                                  <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-textTertiary mt-2">
                      {currentAgentInfo.description}
                    </p>
                  </div>
                  
                  {/* Render full ClinicalAgentInterface but without the back button */}
                  <ClinicalAgentInterface 
                    onBackToChat={undefined}
                  />
                </>
              )}

              {/* Financial Agent - Tabbed Interface - Use full FinancialAgentInterface component */}
              {selectedAgent === 'financial' && !showFinancialAnalysis && (
                <>
                  {/* Agent Selector - Match Patent Agent structure exactly (same padding and width) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Talking to:
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                        className={`w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                          isAgentDropdownOpen ? getThemeClasses('green').border : ''
                        } hover:border-white/20`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currentAgentInfo.icon}</span>
                          <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isAgentDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                        >
                          {/* Sonny Option */}
                          <button
                            onClick={() => handleAgentSelect('sonny')}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
                          >
                            <span className="text-lg">{SONNY_INFO.icon}</span>
                            <div className="flex-1">
                              <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                              <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
                            </div>
                          </button>
                          
                          {/* Individual Agent Options */}
                          {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                            const agentInfo = AGENT_INFO[agent];
                            const agentThemeClasses = getThemeClasses(AGENT_COLORS[agent]);
                            return (
                              <button
                                key={agent}
                                onClick={() => handleAgentSelect(agent)}
                                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                                  selectedAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                                }`}
                              >
                                <span className="text-lg">{agentInfo.icon}</span>
                                <div className="flex-1">
                                  <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                                  <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-textTertiary mt-2">
                      {currentAgentInfo.description}
                    </p>
                  </div>
                  
                  {/* Render full FinancialAgentInterface but without the back button */}
                  <FinancialAgentInterface 
                    onBackToChat={undefined}
                  />
                </>
              )}

              {/* Market Research Agent - Tabbed Interface - Use full MarketResearchAgentInterface component */}
              {selectedAgent === 'market_research' && (
                <>
                  {/* Agent Selector - Match Patent/Financial/Clinical Agent structure exactly (same padding and width) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Talking to:
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                        className={`w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                          isAgentDropdownOpen ? getThemeClasses('teal').border : ''
                        } hover:border-white/20`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currentAgentInfo.icon}</span>
                          <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isAgentDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                        >
                          {/* Sonny Option */}
                          <button
                            onClick={() => handleAgentSelect('sonny')}
                            className="w-full px-4 py-3 text-left hover:bg-surface transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">🤖</span>
                            <div className="flex-1">
                              <div className="font-medium text-textPrimary">Sonny</div>
                              <div className="text-xs text-textSecondary">General AI assistant</div>
                            </div>
                          </button>
                          
                          {/* Other Agent Options */}
                          {Object.entries(AGENT_INFO).map(([key, info]) => (
                            <button
                              key={key}
                              onClick={() => handleAgentSelect(key as AgentType)}
                              className={`w-full px-4 py-3 text-left hover:bg-surface transition-colors flex items-center gap-3 ${
                                selectedAgent === key ? 'bg-surface' : ''
                              }`}
                            >
                              <span className="text-lg">{info.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium text-textPrimary">{info.name}</div>
                                <div className="text-xs text-textSecondary">{info.description}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-textTertiary mt-2">
                      {currentAgentInfo.description}
                    </p>
                  </div>

                  {/* Render full MarketResearchAgentInterface but without the back button */}
                  <MarketResearchAgentInterface
                    onBackToChat={undefined}
                  />
                </>
              )}

              {/* Regulatory Agent - Tabbed Interface - Use full RegulatoryAgentInterface component */}
              {selectedAgent === 'regulatory' && (
                <>
                  {/* Agent Selector - Match Patent/Financial/Clinical/Market Agent structure exactly (same padding and width) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Talking to:
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                        className={`w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-left flex items-center justify-between transition-colors ${
                          isAgentDropdownOpen ? getThemeClasses('orange').border : ''
                        } hover:border-white/20`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{currentAgentInfo.icon}</span>
                          <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isAgentDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden"
                        >
                          {/* Sonny Option */}
                          <button
                            onClick={() => handleAgentSelect('sonny')}
                            className="w-full px-4 py-3 text-left hover:bg-surface transition-colors flex items-center gap-3"
                          >
                            <span className="text-lg">🤖</span>
                            <div className="flex-1">
                              <div className="font-medium text-textPrimary">Sonny</div>
                              <div className="text-xs text-textSecondary">General AI assistant</div>
                            </div>
                          </button>
                          
                          {/* Other Agent Options */}
                          {Object.entries(AGENT_INFO).map(([key, info]) => (
                            <button
                              key={key}
                              onClick={() => handleAgentSelect(key as AgentType)}
                              className={`w-full px-4 py-3 text-left hover:bg-surface transition-colors flex items-center gap-3 ${
                                selectedAgent === key ? 'bg-surface' : ''
                              }`}
                            >
                              <span className="text-lg">{info.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium text-textPrimary">{info.name}</div>
                                <div className="text-xs text-textSecondary">{info.description}</div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-textTertiary mt-2">
                      {currentAgentInfo.description}
                    </p>
                  </div>

                  {/* Render full RegulatoryAgentInterface but without the back button */}
                  <RegulatoryAgentInterface
                    onBackToChat={undefined}
                  />
                </>
              )}

              {/* Patent Agent - Tabbed Interface */}
              {selectedAgent === 'patent' && (
                <>
                  {/* Tabs - Match Financial Agent styling exactly (no agent selector here, it's in the main section) */}
                  <div className="mb-4 px-6 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                    {[
                      { id: 'analyze' as const, label: 'Analyze', icon: FileText },
                      { id: 'landscape' as const, label: 'Landscape', icon: Grid3X3 },
                      { id: 'fto' as const, label: 'FTO', icon: Shield },
                      { id: 'portfolio' as const, label: 'Portfolio', icon: Briefcase },
                    ].map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setPatentActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-0 ${
                            patentActiveTab === tab.id
                              ? 'bg-surface text-primary shadow-sm'
                              : 'text-textSecondary hover:text-textPrimary'
                          }`}
                        >
                          <TabIcon size={14} className="flex-shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content - Match Financial Agent spacing exactly */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                  {patentActiveTab === 'analyze' && (
                    <>
                      {/* Skills Section - Enhanced */}
                      <CollapsibleSection
                        title="Analysis Modules"
                        icon={Layers}
                        defaultOpen={true}
                      >
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setShowPatentAnalysis(true);
                              // Dispatch event to show claims extraction panel
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('show-claims-extraction'));
                              }, 100);
                            }}
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                                <FileText size={20} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Claims Extraction & Parsing</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-textSecondary mt-1 line-clamp-2">
                                  Extract and structure independent/dependent claims with element mapping
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">Claims</span>
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">Structure</span>
                                </div>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setShowPatentAnalysis(true);
                              // Dispatch event to show sequence extraction panel
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('show-sequence-extraction'));
                              }, 100);
                            }}
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left group relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                <Dna size={20} className="text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Sequence Extraction</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-textSecondary mt-1 line-clamp-2">
                                  Extract antibody CDRs, nucleic acids, and protein sequences with validation
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">Sequences</span>
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">Validation</span>
                                </div>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setShowPatentAnalysis(true);
                              // TODO: Navigate to FTO analysis
                            }}
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left group relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                                <Shield size={20} className="text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Freedom-to-Operate Analysis</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-primary transition-colors" />
                                </div>
                                <p className="text-xs text-textSecondary mt-1 line-clamp-2">
                                  Assess claim coverage, infringement risk, and design-around options
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">FTO</span>
                                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">Risk</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      </CollapsibleSection>

                      {/* Recent Analysis - Collapsible */}
                      <CollapsibleSection
                        title="Recent Analysis"
                        icon={Clock}
                        defaultOpen={true}
                      >
                        <RecentPatentAnalysisList onRestoreAnalysis={(patent) => {
                          setShowPatentAnalysis(true);
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('restore-patent-analysis', { detail: patent }));
                          }, 100);
                        }} />
                      </CollapsibleSection>
                    </>
                  )}

                  {patentActiveTab === 'landscape' && (
                    <>
                      <CollapsibleSection
                        title="Landscape Search"
                        icon={Search}
                        defaultOpen={true}
                      >
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Search by target, company, indication..."
                            className="w-full px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <div className="flex gap-2">
                            <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50">
                              <option>All Modalities</option>
                              <option>Small Molecule</option>
                              <option>Antibody</option>
                              <option>Cell Therapy</option>
                              <option>Gene Therapy</option>
                            </select>
                            <select className="flex-1 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50">
                              <option>All Jurisdictions</option>
                              <option>US</option>
                              <option>EP</option>
                              <option>WO</option>
                            </select>
                          </div>
                          <button className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                            <Search size={14} />
                            Search Patent Databases
                          </button>
                        </div>
                      </CollapsibleSection>
                    </>
                  )}

                  {patentActiveTab === 'fto' && (
                    <>
                      <CollapsibleSection
                        title="FTO Assessment"
                        icon={Shield}
                        defaultOpen={true}
                      >
                        <div className="p-4 bg-surfaceElevated border border-white/10 rounded-xl mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-sm font-semibold text-textPrimary">Overall FTO Risk</h4>
                                <p className="text-xs text-textSecondary">Based on analyzed patents</p>
                              </div>
                              <div className="text-center">
                                <div className="w-12 h-12 rounded-full border-3 border-warning flex items-center justify-center mb-1">
                                  <span className="text-lg">🟡</span>
                                </div>
                                <span className="text-xs font-medium text-warning">Medium</span>
                              </div>
                            </div>
                          </div>
                      </CollapsibleSection>
                    </>
                  )}

                  {patentActiveTab === 'portfolio' && (
                    <>
                      <CollapsibleSection
                        title="Portfolio Overview"
                        icon={Briefcase}
                        defaultOpen={true}
                        className="px-6"
                      >
                        <div className="px-6">
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="p-3 bg-surfaceElevated border border-white/10 rounded-lg">
                              <p className="text-xs text-textSecondary mb-1">Total Patents</p>
                              <p className="text-2xl font-bold text-textPrimary">0</p>
                            </div>
                            <div className="p-3 bg-surfaceElevated border border-white/10 rounded-lg">
                              <p className="text-xs text-textSecondary mb-1">Portfolio Score</p>
                              <p className="text-2xl font-bold text-primary">0</p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleSection>
                    </>
                  )}
                  </div>

                  {/* Data Sources & Generate Report - Match Financial Agent spacing */}
                  <DataSourcesSection
                    defaultOpen={false}
                    onConfigure={() => {
                      setShowDataSourcesConfig(true);
                    }}
                  />

                  {/* Generate Report - Collapsible */}
                  <GenerateReportSection
                    defaultOpen={false}
                    onGenerate={(reportType) => {
                      // TODO: Generate report
                      console.log('Generate report:', reportType);
                    }}
                  />

                  {/* Chat Input - Match other agents */}
                  <div className="border-t border-white/10 bg-surfaceElevated p-6 mt-6">
                    <div className="relative mb-3">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-textTertiary pointer-events-none" />
                      <textarea
                        value={patentChatInput}
                        onChange={(e) => setPatentChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            // TODO: Handle chat send
                          }
                        }}
                        placeholder="Ask about patents, IP strength, FTO analysis, or patent landscape..."
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 resize-none"
                        disabled={isPatentProcessing}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!patentChatInput.trim() || isPatentProcessing) return;
                        setIsPatentProcessing(true);
                        try {
                          const response = await fetch('/api/agents/patent-expert', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              messages: [{ role: 'user', content: patentChatInput }],
                              documents: [],
                            }),
                            credentials: 'include',
                          });
                          if (response.ok) {
                            const data = await response.json();
                            // TODO: Display response
                            setPatentChatInput('');
                          }
                        } catch (err) {
                          console.error('Chat error:', err);
                        } finally {
                          setIsPatentProcessing(false);
                        }
                      }}
                      disabled={!patentChatInput.trim() || isPatentProcessing}
                      className="w-full py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isPatentProcessing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Send
                        </>
                      )}
                    </button>
                    <p className="text-xs text-textTertiary mt-2 text-center">
                      Press ⌘+Enter or Ctrl+Enter to send
                    </p>
                  </div>
                </>
              )}

              {/* Example Queries - Agent-specific (context-aware) - Hide for Patent, Financial, Clinical, Market Research, and Regulatory Agent (they use their own interfaces) */}
              {selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && (
                <div>
                  <p className="text-sm text-textSecondary mb-2">Try asking:</p>
                  <div className="space-y-2">
                    {(() => {
                      // Context-aware examples
                      const hasPatentContext = agentContext?.patentData;
                      const examples = 
                        selectedAgent === 'target_biology' && hasPatentContext
                          ? [
                              `Evaluate PD-1 as a target based on ${agentContext.patentData.patentNumber}`,
                              `Assess the ${agentContext.patentData.antibodiesCount} antibodies' mechanism vs pembrolizumab`,
                              `What's the differentiation potential for these antibodies?`,
                              `Compare binding affinity to known PD-1 therapeutics`,
                            ]
                          : selectedAgent === 'regulatory'
                          ? [
                              `What's the regulatory pathway for ${targetName}?`,
                              `What are the FDA requirements for ${targetName}?`,
                              `Compare ${targetName} approval timeline to competitors`,
                              `What are the regulatory risks for ${targetName}?`,
                            ]
                          : selectedAgent === 'target_biology'
                          ? [
                              `What's the biological mechanism of ${targetName}?`,
                              `What are the genetic associations with ${targetName}?`,
                              `Compare ${targetName} to similar targets`,
                              `What's the druggability of ${targetName}?`,
                            ]
                          : [
                              `Compare ${targetName} to HER2`,
                              `What are the key safety concerns for ${targetName}?`,
                              `What patents exist related to ${targetName}?`,
                              `What's the market opportunity for ${targetName}?`,
                            ];
                      return examples.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(example.replace(/^[📄🧬⚖️📊🔬💰📋📊🧬] /, ''));
                            if (selectedAgent === 'sonny') {
                              setTimeout(() => handleStartAnalysis(), 100);
                            }
                          }}
                          disabled={isProcessing}
                          className={`w-full text-left px-3 py-2 text-sm text-textSecondary bg-surfaceElevated border border-white/10 rounded-lg hover:border-white/20 hover:text-textPrimary transition-colors disabled:opacity-50`}
                        >
                          {example}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>

                {/* Start Button - Hide for Patent Agent, Financial Agent, Clinical Agent, and Market Research Agent (they use their own interfaces) */}
                {selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={handleStartAnalysis}
                      disabled={!query.trim() || isProcessing}
                      className={`w-full px-4 py-3 ${themeClasses.bg} text-white rounded-lg ${themeClasses.bgHover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2`}
                    >
                      <Sparkles className="w-5 h-5" />
                      {isProcessing ? 'Processing...' : 'Start Analysis'}
                    </button>
                  </div>
                )}



          </div>
        ) : (
          // Analysis View
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-white/10 bg-surfaceElevated flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm text-textSecondary hover:text-textPrimary hover:bg-surface rounded-lg transition-colors"
                >
                  ← New Query
                </button>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-sm text-textSecondary">
                  Mode: <span className="text-textPrimary font-medium">{isDemo ? 'Demo' : `${mode} (Live)`}</span>
                </span>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-textSecondary">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Analyzing...</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              }>
                <MultiAgentCollaboration
                  query={query}
                  documents={processedDocuments}
                  mode={mode}
                  isDemo={isDemo}
                  customAgents={undefined}
                  mcpEnabled={false}
                  onComplete={(synthesis: string, cost: number) => {
                    setIsProcessing(false);
                    console.log('Analysis complete:', { synthesis: synthesis.substring(0, 100), cost });
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Data Sources Configuration Modal */}
      <DataSourcesConfigModal
        isOpen={showDataSourcesConfig}
        onClose={() => setShowDataSourcesConfig(false)}
        dataSources={[
          { id: 'uspto', name: 'USPTO', status: 'connected', endpoint: 'https://api.uspto.gov' },
          { id: 'epo', name: 'EPO', status: 'connected', endpoint: 'https://ops.epo.org' },
          { id: 'google', name: 'Google Patents', status: 'connected', endpoint: 'https://patents.google.com' },
          { id: 'wipo', name: 'WIPO', status: 'connected', endpoint: 'https://www.wipo.int' },
        ]}
        onUpdate={(sources) => {
          // TODO: Save data source configuration
          console.log('Data sources updated:', sources);
        }}
      />
    </motion.aside>
  );
}
