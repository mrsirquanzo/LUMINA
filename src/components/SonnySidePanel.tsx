import { useState, useEffect, lazy, Suspense, useRef, type ReactNode } from 'react';
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import { saveTilesToRecent } from '../lib/tiles/recentStorage';
import WorkspaceSaveModal from './shared/WorkspaceSaveModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Lock,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
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
  Lightbulb,
  AlertTriangle,
  BookOpen,
  TrendingUp,
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
import ClinicalAgentInterfaceV2 from './clinical/ClinicalAgentInterfaceV2';
import ClinicalDataSourcesSection from './clinical/ClinicalDataSourcesSection';
import ClinicalGenerateReportSection from './clinical/ClinicalGenerateReportSection';
import MarketResearchAgentInterface from './market/MarketResearchAgentInterface';
import MarketResearchAgentInterfaceV2 from './market/MarketResearchAgentInterfaceV2';
import RegulatoryAgentInterface from './regulatory/RegulatoryAgentInterface';
import RegulatoryAgentInterfaceV2 from './regulatory/RegulatoryAgentInterfaceV2';
import TargetBiologyAgentInterface from './target-biology/TargetBiologyAgentInterface';
import TargetBiologyAgentInterfaceV2 from './target-biology/TargetBiologyAgentInterfaceV2';
import PatentAgentInterfaceV2 from './patent/PatentAgentInterfaceV2';
import FinancialAgentInterfaceV2 from './financial/FinancialAgentInterfaceV2';
import { SonnyHeroInterface } from './sonny';
import DataSourcesConfigModal from './patent/DataSourcesConfigModal';
import { getStoredAgentMode, onAgentModeRequested, setStoredAgentMode } from '../lib/agentMode';

// Feature flag for Hero Skills redesign
const USE_HERO_SKILLS = true;

// Custom Panel Icon - Window with left sidebar (matches left sidebar)
const PanelIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outer window */}
    <rect x="1" y="1" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Left sidebar strip */}
    <rect x="2.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
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
  name: 'Sonny',
  icon: '🤖',
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
  targetName = '',
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
  const [pendingModeRequest, setPendingModeRequest] = useState<'demo' | 'live' | null>(null);
  const [liveMissingKeys, setLiveMissingKeys] = useState<string[]>([]);
  const [isCheckingLiveReady, setIsCheckingLiveReady] = useState(false);
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showSaveWorkspaceModal, setShowSaveWorkspaceModal] = useState(false);
  const [showSaveNewWorkspaceModal, setShowSaveNewWorkspaceModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');
  const previousWorkspaceRef = useRef<{ id: string; name: string; target: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get tile store and workspace store
  const tiles = useTileStore((state) => state.tiles);
  const activeWorkspace = useTileStore((state) => state.activeWorkspace);
  // Allow global header to open the "Save workspace" modal without placing the button in the side panel UI.
  useEffect(() => {
    const handleOpenSaveWorkspace = () => {
      // In demo mode we don't want to prompt "save workspace" during investor flows.
      if (isDemo) return;
      const wsId = useTileStore.getState().activeWorkspace;
      if (!wsId) return;
      const allTiles = useTileStore.getState().tiles;
      const tileCount = allTiles.filter((t) => t.workspaceIds.includes(wsId)).length;
      if (tileCount === 0) return;
      setShowSaveNewWorkspaceModal(true);
    };

    window.addEventListener('open-save-workspace', handleOpenSaveWorkspace as EventListener);
    return () => window.removeEventListener('open-save-workspace', handleOpenSaveWorkspace as EventListener);
  }, []);
  const clearAllTiles = useTileStore((state) => state.clearAllTiles);
  const getWorkspaceById = useWorkspaceStore((state) => state.getWorkspaceById);

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

  // Check live readiness (keys configured) on mount
  useEffect(() => {
    let isCancelled = false;
    const checkReady = async () => {
      try {
        const res = await fetch('/api/ready', { method: 'GET' });
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; missing?: string[] };
        if (isCancelled) return;
        setLiveMissingKeys(Array.isArray(data.missing) ? data.missing : []);
      } catch {
        // ignore
      }
    };
    void checkReady();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Initialize demo/live mode from localStorage (but do not force login on first load)
  useEffect(() => {
    const stored = getStoredAgentMode();
    if (stored === 'demo') setIsDemo(true);
    // If stored is live, we only switch once authenticated (handled below)
  }, []);

  // If user previously selected live and is authenticated, switch to live
  useEffect(() => {
    const stored = getStoredAgentMode();
    if (stored === 'live' && isAuthenticated) {
      setIsDemo(false);
    }
  }, [isAuthenticated]);

  // If stored mode is live but the user is not authenticated, downgrade to demo for consistency
  useEffect(() => {
    if (isCheckingAuth) return;
    const stored = getStoredAgentMode();
    if (stored === 'live' && !isAuthenticated) {
      setIsDemo(true);
      setStoredAgentMode('demo');
    }
  }, [isCheckingAuth, isAuthenticated]);

  // If the user requested live while auth was still checking, resolve it once we know auth state.
  useEffect(() => {
    if (pendingModeRequest !== 'live') return;
    if (isCheckingAuth) return;

    if (isAuthenticated) {
      setIsDemo(false);
      setStoredAgentMode('live');
      setPendingModeRequest(null);
      setShowLoginModal(false);
      return;
    }

    // Not authenticated: prompt login (and keep demo until they log in).
    setShowLoginModal(true);
  }, [pendingModeRequest, isCheckingAuth, isAuthenticated]);

  // Allow other UI (Header) to request demo/live changes
  useEffect(() => {
    return onAgentModeRequested(async (mode) => {
      // Open panel if collapsed so user can see auth prompt/status
      if (isCollapsed) onToggleCollapse();
      await handleToggleMode(mode);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed, onToggleCollapse, isAuthenticated]);

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

  // Auto-start if initial query is provided (no delay - using pre-recorded data)
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !showAnalysis && !isCollapsed) {
      // Check if we need to save current workspace first
      const visibleTiles = activeWorkspace 
        ? tiles.filter(t => t.workspaceIds.includes(activeWorkspace))
        : tiles;
      
      if (visibleTiles.length > 0 && activeWorkspace) {
        // Save current tiles to recent before clearing
        const currentWorkspace = getWorkspaceById(activeWorkspace);
        if (currentWorkspace) {
          saveTilesToRecent(
            String(activeWorkspace),
            currentWorkspace.name,
            currentWorkspace.target,
            visibleTiles
          );
          
          // Store previous workspace info for save prompt
          previousWorkspaceRef.current = {
            id: String(activeWorkspace),
            name: currentWorkspace.name,
            target: currentWorkspace.target,
          };
          
          // Prompt to save as workspace
          setShowSaveWorkspaceModal(true);
          setPendingQuery(initialQuery.trim());
          return; // Don't start analysis yet
        }
      }
      
      // No existing tiles, proceed directly
      setQuery(initialQuery);
      setShowAnalysis(true);
      setIsProcessing(true);
    }
  }, [initialQuery, isCollapsed, activeWorkspace, tiles, getWorkspaceById, clearAllTiles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when collapsed
  useEffect(() => {
    if (isCollapsed && showAnalysis) {
      // Don't reset, just hide - user might want to see it again
    }
  }, [isCollapsed, showAnalysis]);

  // Listen for reset-demo event to reset panel state
  useEffect(() => {
    const handleResetDemo = () => {
      setShowAnalysis(false);
      setQuery('');
      setIsProcessing(false);
    };

    window.addEventListener('reset-demo', handleResetDemo);
    return () => window.removeEventListener('reset-demo', handleResetDemo);
  }, []);

  const handleStartAnalysis = () => {
    if (query.trim() && !isProcessing) {
      // Check if there are existing tiles
      const visibleTiles = activeWorkspace 
        ? tiles.filter(t => t.workspaceIds.includes(activeWorkspace))
        : tiles;
      
      if (visibleTiles.length > 0 && activeWorkspace) {
        // Save current tiles to recent before clearing
        const currentWorkspace = getWorkspaceById(activeWorkspace);
        if (currentWorkspace) {
          saveTilesToRecent(
            String(activeWorkspace),
            currentWorkspace.name,
            currentWorkspace.target,
            visibleTiles
          );
          
          // Store previous workspace info for save prompt
          previousWorkspaceRef.current = {
            id: String(activeWorkspace),
            name: currentWorkspace.name,
            target: currentWorkspace.target,
          };
          
          // Prompt to save as workspace
          setShowSaveWorkspaceModal(true);
          setPendingQuery(query.trim());
          return; // Don't start analysis yet
        }
      }
      
      // No existing tiles, proceed directly
      startNewAnalysis(query.trim());
    }
  };

  const startNewAnalysis = (analysisQuery: string) => {
    // Start analysis
    setIsProcessing(true);
    setShowAnalysis(true);
    setQuery(analysisQuery);
    setShowSaveWorkspaceModal(false);
  };

  const handleSaveWorkspace = (workspaceName: string) => {
    if (!workspaceName.trim() || !previousWorkspaceRef.current) {
      startNewAnalysis(pendingQuery);
      return;
    }

    const previousWorkspace = previousWorkspaceRef.current;
    const workspaceId = previousWorkspace.id;

    // Update the existing workspace with the new name
    const workspace = getWorkspaceById(workspaceId);
    if (workspace) {
      useWorkspaceStore.getState().updateWorkspace(workspaceId, {
        name: workspaceName.trim(),
        lastModified: new Date().toISOString(),
      });
    } else {
      // If workspace doesn't exist, create a new one
      const newWorkspace = useWorkspaceStore.getState().addWorkspace({
        name: workspaceName.trim(),
        target: previousWorkspace.target,
        persona: 'scientist',
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'active',
      });
      
      // Associate all tiles with the new workspace
      const tilesToUpdate = tiles.filter(t => t.workspaceIds.includes(workspaceId));
      tilesToUpdate.forEach(tile => {
        useTileStore.getState().addTileToWorkspace(tile.id, String(newWorkspace.id));
        // Remove from old workspace if it exists
        if (tile.workspaceIds.includes(workspaceId)) {
          useTileStore.getState().removeTileFromWorkspace(tile.id, workspaceId);
        }
      });

      // Use the new workspace ID going forward
      previousWorkspaceRef.current = {
        id: String(newWorkspace.id),
        name: newWorkspace.name,
        target: newWorkspace.target,
      };
    }

    // Set as active workspace
    const nextWorkspaceId = previousWorkspaceRef.current?.id || workspaceId;
    useWorkspaceStore.getState().setActiveWorkspace(nextWorkspaceId);
    useTileStore.getState().setActiveWorkspace(nextWorkspaceId);

    // Proceed with new analysis
    startNewAnalysis(pendingQuery);
  };

  const handleSkipSave = () => {
    // Skip saving, just proceed with new analysis
    startNewAnalysis(pendingQuery);
  };

  const handleToggleMode = async (newMode: 'demo' | 'live') => {
    if (newMode === 'live') {
      // Gate live mode on backend readiness (API keys configured)
      setIsCheckingLiveReady(true);
      try {
        const res = await fetch('/api/ready', { method: 'GET' });
        if (res.ok) {
          const ready = (await res.json()) as { ok?: boolean; missing?: string[] };
          const missing = Array.isArray(ready.missing) ? ready.missing : [];
          setLiveMissingKeys(missing);
          if (missing.length > 0) {
            // Keep demo mode; show a clear banner in the panel.
            setIsDemo(true);
            setStoredAgentMode('demo');
            setPendingModeRequest(null);
            setShowLoginModal(false);
            return;
          }
        }
      } catch {
        // If readiness check fails, keep demo to avoid a broken live experience.
        setIsDemo(true);
        setStoredAgentMode('demo');
        setPendingModeRequest(null);
        setShowLoginModal(false);
        return;
      } finally {
        setIsCheckingLiveReady(false);
      }

      // If auth is still being determined, defer the switch until the check completes.
      if (isCheckingAuth) {
        setPendingModeRequest('live');
        return;
      }
      // Check authentication before enabling live mode
      if (!isAuthenticated) {
        setPendingModeRequest('live');
        setShowLoginModal(true);
        return;
      }
      setIsDemo(false);
      setStoredAgentMode('live');
      setPendingModeRequest(null);
    } else {
      setIsDemo(true);
      setStoredAgentMode('demo');
      setPendingModeRequest(null);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsDemo(false);
    setStoredAgentMode('live');
    setPendingModeRequest(null);
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
  
  // Listen for tile click events to open agent panel
  useEffect(() => {
    const handleOpenAgentPanel = (event: CustomEvent) => {
      const { agent, tileId, context } = event.detail;
      
      // Open panel if collapsed
      if (isCollapsed) {
        onToggleCollapse();
        // Wait for panel to open before switching agent
        setTimeout(() => {
          // Switch to the selected agent (including sonny)
          if (agent) {
            setSelectedAgent(agent as AgentType | 'sonny');
          }
        }, 300);
      } else {
        // Switch to relevant agent immediately
        if (agent) {
          setSelectedAgent(agent as AgentType | 'sonny');
        }
      }
      
      // Pre-populate context if available
      if (context) {
        // Store full context for agent with tile information
        setAgentContext({
          ...context,
          fromTile: true,
          tileId: tileId || `tile-${Date.now()}`,
          tileTitle: context.tileTitle,
          fromAgent: agent,
          targetAgent: agent,
        });
        
        // Pre-populate query with context-aware prompt
        if (context.target && context.tileTitle) {
          const contextPrompt = `Based on the ${context.tileTitle || 'analysis'} for ${context.target}, `;
          setQuery(contextPrompt);
        }
        
        // Show suggested questions
        if (context.suggestedQuestions && context.suggestedQuestions.length > 0) {
          setShowSuggestions(true);
        }

        // Only show the "Context Available" card for contexts it can actually summarize (patent handoffs).
        // Tile-origin context is still kept (for suggested questions + prompt prefill), but should not block agent navigation.
        setShowContextSummary(Boolean((context as any)?.patentData));
      }
    };
    
    window.addEventListener('open-agent-panel', handleOpenAgentPanel as EventListener);
    return () => window.removeEventListener('open-agent-panel', handleOpenAgentPanel as EventListener);
  }, [isCollapsed, onToggleCollapse]);

  const handleAgentSelect = (agent: AgentType | 'sonny') => {
    // Close dropdown immediately
    setIsAgentDropdownOpen(false);
    
    const isTileContext = Boolean(agentContext?.fromTile);
    // Check if we have context from previous agent (agent-to-agent handoff, not tile-origin)
    const hasContext = agentContext && agentContext.fromAgent !== agent;

    // For non-tile contexts (e.g. Patent → another agent), keep the explicit handoff confirmation.
    // For tile-origin context, switching agents should be immediate and non-blocking.
    if (!isTileContext && hasContext && agent !== 'sonny') {
      // Show context summary before switching
      setAgentContext({ ...agentContext, targetAgent: agent });
      setShowContextSummary(true);
      // Don't switch yet - wait for user decision
      return;
    }
    
    // Switch agent
    setSelectedAgent(agent);

    if (isTileContext) {
      // Preserve tile context + any prefilled query so users can freely browse agents
      setAgentContext((prev: any) => (prev ? { ...prev, fromAgent: agent, targetAgent: agent } : prev));
      setShowContextSummary(false);
    } else {
      // Normal switch without context
      setShowContextSummary(false);
      setAgentContext(null);
      // Reset query and analysis view when switching agents
      setQuery('');
    }

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
      gradient: string;
      gradientFrom: string;
      gradientTo: string;
      chatFocus: string;
      sendButton: string;
      sendButtonHover: string;
      tabActive: string;
    }> = {
      // Sonny - Spectrum gradient scheme (coordination of all agents)
      primary: {
        bg: 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500',
        border: 'border-purple-500',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400',
        bgHover: 'hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600',
        bgLight: 'bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-500/20',
        borderLight: 'border-purple-500/30',
        gradient: 'from-purple-600 via-blue-600 to-cyan-500',
        gradientFrom: 'from-purple-600',
        gradientTo: 'to-cyan-500',
        chatFocus: 'focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
        sendButton: 'bg-gradient-to-r from-purple-600 to-cyan-500',
        sendButtonHover: 'hover:from-purple-700 hover:to-cyan-600',
        tabActive: 'bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-500/20 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400',
      },
      // Clinical - Medical Blue
      blue: {
        bg: 'bg-blue-600',
        border: 'border-blue-500',
        text: 'text-blue-400',
        bgHover: 'hover:bg-blue-700',
        bgLight: 'bg-blue-600/20',
        borderLight: 'border-blue-500/30',
        gradient: 'from-blue-600 to-blue-500',
        gradientFrom: 'from-blue-600',
        gradientTo: 'to-blue-500',
        chatFocus: 'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
        sendButton: 'bg-blue-600',
        sendButtonHover: 'hover:bg-blue-700',
        tabActive: 'bg-blue-600/20 text-blue-400',
      },
      // Patent - Intellectual Purple
      purple: {
        bg: 'bg-purple-600',
        border: 'border-purple-500',
        text: 'text-purple-400',
        bgHover: 'hover:bg-purple-700',
        bgLight: 'bg-purple-600/20',
        borderLight: 'border-purple-500/30',
        gradient: 'from-purple-600 to-purple-500',
        gradientFrom: 'from-purple-600',
        gradientTo: 'to-purple-500',
        chatFocus: 'focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
        sendButton: 'bg-purple-600',
        sendButtonHover: 'hover:bg-purple-700',
        tabActive: 'bg-purple-600/20 text-purple-400',
      },
      // Financial - Money Green
      green: {
        bg: 'bg-green-600',
        border: 'border-green-500',
        text: 'text-green-400',
        bgHover: 'hover:bg-green-700',
        bgLight: 'bg-green-600/20',
        borderLight: 'border-green-500/30',
        gradient: 'from-green-600 to-green-500',
        gradientFrom: 'from-green-600',
        gradientTo: 'to-green-500',
        chatFocus: 'focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20',
        sendButton: 'bg-green-600',
        sendButtonHover: 'hover:bg-green-700',
        tabActive: 'bg-green-600/20 text-green-400',
      },
      // Regulatory - Compliance Orange
      orange: {
        bg: 'bg-orange-600',
        border: 'border-orange-500',
        text: 'text-orange-400',
        bgHover: 'hover:bg-orange-700',
        bgLight: 'bg-orange-600/20',
        borderLight: 'border-orange-500/30',
        gradient: 'from-orange-600 to-orange-500',
        gradientFrom: 'from-orange-600',
        gradientTo: 'to-orange-500',
        chatFocus: 'focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20',
        sendButton: 'bg-orange-600',
        sendButtonHover: 'hover:bg-orange-700',
        tabActive: 'bg-orange-600/20 text-orange-400',
      },
      // Market Research - Analytics Teal
      teal: {
        bg: 'bg-teal-600',
        border: 'border-teal-500',
        text: 'text-teal-400',
        bgHover: 'hover:bg-teal-700',
        bgLight: 'bg-teal-600/20',
        borderLight: 'border-teal-500/30',
        gradient: 'from-teal-600 to-teal-500',
        gradientFrom: 'from-teal-600',
        gradientTo: 'to-teal-500',
        chatFocus: 'focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20',
        sendButton: 'bg-teal-600',
        sendButtonHover: 'hover:bg-teal-700',
        tabActive: 'bg-teal-600/20 text-teal-400',
      },
      // Target Biology - Life Sciences Emerald
      emerald: {
        bg: 'bg-emerald-600',
        border: 'border-emerald-500',
        text: 'text-emerald-400',
        bgHover: 'hover:bg-emerald-700',
        bgLight: 'bg-emerald-600/20',
        borderLight: 'border-emerald-500/30',
        gradient: 'from-emerald-600 to-emerald-500',
        gradientFrom: 'from-emerald-600',
        gradientTo: 'to-emerald-500',
        chatFocus: 'focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20',
        sendButton: 'bg-emerald-600',
        sendButtonHover: 'hover:bg-emerald-700',
        tabActive: 'bg-emerald-600/20 text-emerald-400',
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
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-gradient-to-b from-purple-500/60 via-blue-500/60 to-cyan-500/60 transition-colors" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-gradient-to-b from-purple-500/30 via-blue-500/30 to-cyan-500/30 rounded-full transition-colors" />
        </div>
      )}


      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col pt-4">
        {/* Agent Selector - Always visible at top (except in multi-agent analysis or when in agent-specific analysis views) */}
        {/* Don't show top-level selector when in Financial/Patent/Clinical/Market Research analysis views - they have their own */}
        {/* Also don't show when Financial Agent, Clinical Agent, or Market Research Agent tabbed interface is active - they have their own */}
        {/* Also don't show when Hero Skills V2 interfaces are active */}
        {!showAnalysis && 
         !(selectedAgent === 'patent' && showPatentAnalysis) && 
         !(selectedAgent === 'financial' && showFinancialAnalysis) && 
         !(USE_HERO_SKILLS && selectedAgent === 'financial' && !showFinancialAnalysis) &&
         !(USE_HERO_SKILLS && selectedAgent === 'clinical') &&
         !(USE_HERO_SKILLS && selectedAgent === 'market_research') &&
         !(USE_HERO_SKILLS && selectedAgent === 'regulatory') &&
         !(USE_HERO_SKILLS && selectedAgent === 'target_biology') &&
         !(USE_HERO_SKILLS && selectedAgent === 'patent' && !showPatentAnalysis) &&
         !(USE_HERO_SKILLS && selectedAgent === 'sonny') && (
          <div className="px-6 py-4 border-b border-white/10">
            {/* Enhanced Agent Selector Header - Card-based design */}
            <div className="bg-surfaceElevated border border-white/10 rounded-lg p-4 mb-4">
              {/* Agent Name and Description */}
              <div className="relative mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentAgentInfo.icon}</span>
                    <div>
                      <div className="text-textPrimary font-semibold text-base">{currentAgentInfo.name}</div>
                      <div className="text-xs text-textSecondary mt-0.5">{currentAgentInfo.description}</div>
                  </div>
                  </div>
                  <button
                    onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                  <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                </div>
                
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

              {/* Inline Mode Controls - Only for Sonny */}
              {selectedAgent === 'sonny' && (
                <>
                  <div className="h-px bg-white/10 my-3" />
                  <div className="space-y-3">
                    {/* Agent Mode: Demo/Live */}
                    <div>
                      <label className="block text-xs font-medium text-textSecondary mb-2">
                        Agent Mode
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleMode('demo')}
                          disabled={isProcessing}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                            isDemo
                              ? `${themeClasses.bgLight} ${themeClasses.border} text-white`
                              : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="font-medium">Demo</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleToggleMode('live')}
                          disabled={isProcessing}
                          className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                            !isDemo
                              ? `${themeClasses.bgLight} ${themeClasses.border} text-white`
                              : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                          } disabled:opacity-50 relative`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="font-medium">Live</span>
                            {!isAuthenticated && (
                              <Lock className="w-3 h-3 ml-1" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Execution Speed: Fast/Thorough - Only show in Live mode */}
                    {!isDemo && (
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-2">
                          Execution Speed
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMode('fast')}
                            className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                              mode === 'fast'
                                ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                                : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                            }`}
                          >
                            <span>Fast</span>
                            <div className="text-xs mt-0.5 opacity-75">~30s</div>
                          </button>
                          <button
                            onClick={() => setMode('thorough')}
                            className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                              mode === 'thorough'
                                ? `${themeClasses.bgLight} ${themeClasses.border} ${themeClasses.text}`
                                : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                            }`}
                          >
                            <span>Thorough</span>
                            <div className="text-xs mt-0.5 opacity-75">~2-3min</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:border-green-500/50 hover:bg-surface transition-colors text-sm text-textSecondary hover:text-textPrimary"
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

              {/* Mode Info Banner - Only for Sonny, shown below header card */}
              {selectedAgent === 'sonny' && (
                <>
                  {!isDemo && liveMissingKeys.length > 0 && (
                    <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-xs text-textSecondary">
                        <strong className="text-warning">Live not ready:</strong> Missing required API keys:{' '}
                        <span className="font-mono">{liveMissingKeys.join(', ')}</span>. Add them in Vercel →
                        Settings → Environment Variables, then retry Live.
                      </p>
                    </div>
                  )}
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

              {/* Sonny Hero Interface - V2 */}
              {selectedAgent === 'sonny' && USE_HERO_SKILLS ? (
                <SonnyHeroInterface
                  targetName={targetName}
                  isDemo={isDemo}
                  currentAgent={selectedAgent}
                  onAgentSelect={handleAgentSelect}
                />
              ) : null}

              {/* Enhanced Query Input Area - Removed for Patent Agent, Financial Agent, Clinical Agent, Market Research Agent, Regulatory Agent, and Target Biology Agent (shown at bottom instead) - Also hide when Hero Skills enabled */}
              {!USE_HERO_SKILLS && selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && selectedAgent !== 'target_biology' && (
                <div className="mb-4">
                  {/* Query Input Card */}
                  <div className="bg-surfaceElevated border border-white/10 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-semibold text-textPrimary mb-3">
                      Ask {selectedAgent === 'sonny' ? 'Sonny' : currentAgentInfo.name}
                    </label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-textTertiary pointer-events-none" />
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        selectedAgent === 'sonny'
                          ? `Ask Sonny about ${targetName || 'a target'}...`
                          : selectedAgent === 'target_biology'
                          ? `Ask about biological mechanisms, genetics, or druggability...`
                          : selectedAgent === 'regulatory'
                          ? `Ask about FDA pathways, approval timelines, or compliance...`
                          : selectedAgent === 'market_research'
                          ? `Ask about market size, competitors, or pricing...`
                          : `Ask ${currentAgentInfo.name}...`
                      }
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition-colors"
                        rows={4}
                      disabled={isProcessing}
                    />
                  </div>
                  <p className="text-xs text-textTertiary mt-2">
                    Press ⌘+Enter or Ctrl+Enter to start analysis
                  </p>
                  </div>
                </div>
              )}

              {/* Clinical Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'clinical' && (
                USE_HERO_SKILLS ? (
                  <ClinicalAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
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
                      <p className="text-xs text-textSecondary mt-2">
                        {currentAgentInfo.description}
                      </p>
                    </div>

                    {/* Agent Mode Controls */}
                    <div className="mb-4 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Agent Mode: Demo/Live */}
                        <div>
                          <label className="block text-xs font-medium text-textPrimary mb-2">
                            Agent Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMode('demo')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                isDemo
                                  ? `${getThemeClasses('blue').bgLight} ${getThemeClasses('blue').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="font-medium">Demo</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleToggleMode('live')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                !isDemo
                                  ? `${getThemeClasses('blue').bgLight} ${getThemeClasses('blue').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50 relative`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">Live</span>
                                {!isAuthenticated && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render full ClinicalAgentInterface but without the back button */}
                    <ClinicalAgentInterface 
                      onBackToChat={undefined}
                    />
                  </>
                )
              )}

              {/* Financial Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'financial' && !showFinancialAnalysis && (
                USE_HERO_SKILLS ? (
                  <FinancialAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
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

                    {/* Agent Mode Controls */}
                    <div className="mb-4 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Agent Mode: Demo/Live */}
                        <div>
                          <label className="block text-xs font-medium text-textPrimary mb-2">
                            Agent Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMode('demo')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                isDemo
                                  ? 'bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-500/20 border-purple-500/50 text-white'
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="font-medium">Demo</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleToggleMode('live')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                !isDemo
                                  ? 'bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-500/20 border-purple-500/50 text-white'
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50 relative`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">Live</span>
                                {!isAuthenticated && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render full FinancialAgentInterface but without the back button */}
                    <FinancialAgentInterface 
                      onBackToChat={undefined}
                    />
                  </>
                )
              )}

              {/* Market Research Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'market_research' && (
                USE_HERO_SKILLS ? (
                  <MarketResearchAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
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
                      <p className="text-xs text-textSecondary mt-2">
                        {currentAgentInfo.description}
                      </p>
                    </div>

                    {/* Agent Mode Controls */}
                    <div className="mb-4 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Agent Mode: Demo/Live */}
                        <div>
                          <label className="block text-xs font-medium text-textPrimary mb-2">
                            Agent Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMode('demo')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                isDemo
                                  ? `${getThemeClasses('teal').bgLight} ${getThemeClasses('teal').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="font-medium">Demo</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleToggleMode('live')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                !isDemo
                                  ? `${getThemeClasses('teal').bgLight} ${getThemeClasses('teal').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50 relative`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">Live</span>
                                {!isAuthenticated && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Render full MarketResearchAgentInterface but without the back button */}
                    <MarketResearchAgentInterface
                      onBackToChat={undefined}
                    />
                  </>
                )
              )}

              {/* Regulatory Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'regulatory' && (
                USE_HERO_SKILLS ? (
                  <RegulatoryAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
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
                      <p className="text-xs text-textSecondary mt-2">
                        {currentAgentInfo.description}
                      </p>
                    </div>

                    {/* Agent Mode Controls */}
                    <div className="mb-4 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Agent Mode: Demo/Live */}
                        <div>
                          <label className="block text-xs font-medium text-textPrimary mb-2">
                            Agent Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMode('demo')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                isDemo
                                  ? `${getThemeClasses('orange').bgLight} ${getThemeClasses('orange').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="font-medium">Demo</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleToggleMode('live')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                !isDemo
                                  ? `${getThemeClasses('orange').bgLight} ${getThemeClasses('orange').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50 relative`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">Live</span>
                                {!isAuthenticated && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Render full RegulatoryAgentInterface but without the back button */}
                    <RegulatoryAgentInterface
                      onBackToChat={undefined}
                    />
                  </>
                )
              )}

              {/* Target Biology Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'target_biology' && (
                USE_HERO_SKILLS ? (
                  <TargetBiologyAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
                  <>
                    {/* Agent Mode Controls */}
                    <div className="mb-4 px-6 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        {/* Agent Mode: Demo/Live */}
                        <div>
                          <label className="block text-xs font-medium text-textSecondary mb-2">
                            Agent Mode
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleMode('demo')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                isDemo
                                  ? `${getThemeClasses('emerald').bgLight} ${getThemeClasses('emerald').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="font-medium">Demo</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleToggleMode('live')}
                              disabled={isProcessing}
                              className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                                !isDemo
                                  ? `${getThemeClasses('emerald').bgLight} ${getThemeClasses('emerald').border} text-white`
                                  : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                              } disabled:opacity-50 relative`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="font-medium">Live</span>
                                {!isAuthenticated && (
                                  <Lock className="w-3 h-3 ml-1" />
                                )}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <TargetBiologyAgentInterface 
                      onBackToChat={undefined}
                      targetSymbol={targetName}
                    />
                  </>
                )
              )}

              {/* Patent Agent - Hero Skills V2 or Tabbed Interface */}
              {selectedAgent === 'patent' && !showPatentAnalysis && (
                USE_HERO_SKILLS ? (
                  <PatentAgentInterfaceV2
                    targetName={targetName}
                    currentAgent={selectedAgent}
                    onAgentSelect={handleAgentSelect}
                  />
                ) : (
                  <>
                  {/* Agent Mode Controls */}
                  <div className="mb-4 px-6 bg-surfaceElevated border border-white/10 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Agent Mode: Demo/Live */}
                      <div>
                        <label className="block text-xs font-medium text-textSecondary mb-2">
                          Agent Mode
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleMode('demo')}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                              isDemo
                                ? `${getThemeClasses('purple').bgLight} ${getThemeClasses('purple').border} text-white`
                                : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                            } disabled:opacity-50`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" />
                              <span className="font-medium">Demo</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleToggleMode('live')}
                            disabled={isProcessing}
                            className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm font-medium text-center ${
                              !isDemo
                                ? `${getThemeClasses('purple').bgLight} ${getThemeClasses('purple').border} text-white`
                                : 'bg-surface border-white/10 text-textSecondary hover:border-white/20 hover:text-textPrimary'
                            } disabled:opacity-50 relative`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="font-medium">Live</span>
                              {!isAuthenticated && (
                                <Lock className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs - Match Financial Agent styling exactly */}
                  <div className="mb-4 px-6 flex gap-1 p-1 bg-surfaceElevated rounded-lg overflow-x-auto">
                    {[
                      { id: 'analyze' as const, label: 'Analyze' },
                      { id: 'landscape' as const, label: 'Landscape' },
                      { id: 'fto' as const, label: 'FTO' },
                      { id: 'portfolio' as const, label: 'Portfolio' },
                    ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPatentActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-all min-w-0 overflow-hidden ${
                            patentActiveTab === tab.id
                            ? 'bg-purple-600/20 text-purple-400 shadow-sm border border-purple-500/30'
                            : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceElevated'
                          }`}
                        >
                        <span className="truncate w-full text-center">{tab.label}</span>
                        </button>
                    ))}
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
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all text-left group relative overflow-visible"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                                <FileText size={20} className="text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Claims Extraction & Parsing</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-purple-400 transition-colors" />
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
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all text-left group relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                                <Dna size={20} className="text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Sequence Extraction</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-purple-400 transition-colors" />
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
                            className="w-full p-4 bg-surfaceElevated border border-white/10 rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all text-left group relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                                <Shield size={20} className="text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-textPrimary text-sm">Freedom-to-Operate Analysis</h4>
                                  <ChevronRight size={16} className="text-textSecondary group-hover:text-purple-400 transition-colors" />
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
                          <button className="w-full py-2 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
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
                              <p className="text-2xl font-bold text-purple-400">0</p>
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
                        className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none transition-colors"
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
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
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
                )
              )}

              {/* Enhanced Example Queries - Collapsible with icons - Hide for Patent, Financial, Clinical, Market Research, Regulatory, and Target Biology Agent (they use their own interfaces) */}
              {selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && selectedAgent !== 'target_biology' && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="flex items-center justify-between w-full mb-2 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <span>Suggested Questions</span>
                    </span>
                    {showSuggestions ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                    {(() => {
                        // Use suggested questions from tile context if available
                        if (agentContext?.suggestedQuestions && agentContext.suggestedQuestions.length > 0) {
                          return agentContext.suggestedQuestions.map((question: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQuery(question);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 bg-surfaceElevated hover:bg-surface border border-white/10 rounded-lg transition-colors text-sm text-textSecondary hover:text-textPrimary"
                            >
                              <span className="flex-1">{question}</span>
                            </button>
                          ));
                        }
                        
                        // Context-aware examples with icons
                      const hasPatentContext = agentContext?.patentData;
                        let examples: Array<{ text: string; icon: ReactNode }>;
                      const agent = selectedAgent as AgentType | 'sonny';
                      
                      if (agent === 'regulatory') {
                        examples = [
                            { text: `What's the regulatory pathway for ${targetName}?`, icon: <Shield className="w-4 h-4" /> },
                            { text: `What are the FDA requirements for ${targetName}?`, icon: <FileText className="w-4 h-4" /> },
                            { text: `Compare ${targetName} approval timeline to competitors`, icon: <TrendingUp className="w-4 h-4" /> },
                            { text: `What are the regulatory risks for ${targetName}?`, icon: <AlertTriangle className="w-4 h-4" /> },
                        ];
                      } else if (agent === 'target_biology' && hasPatentContext) {
                        examples = [
                            { text: `Evaluate PD-1 as a target based on ${agentContext.patentData.patentNumber}`, icon: <Dna className="w-4 h-4" /> },
                            { text: `Assess the ${agentContext.patentData.antibodiesCount} antibodies' mechanism vs pembrolizumab`, icon: <Activity className="w-4 h-4" /> },
                            { text: `What's the differentiation potential for these antibodies?`, icon: <TrendingUp className="w-4 h-4" /> },
                            { text: `Compare binding affinity to known PD-1 therapeutics`, icon: <BarChart3 className="w-4 h-4" /> },
                        ];
                      } else if (agent === 'target_biology') {
                        examples = [
                            { text: `What's the biological mechanism of ${targetName || 'this target'}?`, icon: <Dna className="w-4 h-4" /> },
                            { text: `Assess the genetic validation for ${targetName || 'this target'}`, icon: <Activity className="w-4 h-4" /> },
                            { text: `What's the druggability profile of ${targetName || 'this target'}?`, icon: <BarChart3 className="w-4 h-4" /> },
                            { text: `Evaluate safety concerns for ${targetName || 'this target'}`, icon: <AlertTriangle className="w-4 h-4" /> },
                        ];
                      } else {
                        examples = [
                            { text: `Compare ${targetName || 'this target'} to HER2`, icon: <BarChart3 className="w-4 h-4" /> },
                            { text: `What are the key safety concerns for ${targetName || 'this target'}?`, icon: <AlertTriangle className="w-4 h-4" /> },
                            { text: `What patents exist related to ${targetName || 'this target'}?`, icon: <FileText className="w-4 h-4" /> },
                            { text: `What's the market opportunity for ${targetName || 'this target'}?`, icon: <TrendingUp className="w-4 h-4" /> },
                        ];
                      }
                      
                      return examples.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                              setQuery(example.text.replace(/^(?:📄|🧬|⚖️|📊|🔬|💰|📋|👩‍⚕️)\s/, ''));
                            if (selectedAgent === 'sonny') {
                              // Start immediately - no delay needed for pre-recorded data
                              handleStartAnalysis();
                            }
                          }}
                          disabled={isProcessing}
                            className="w-full text-left px-3 py-2.5 text-sm text-textSecondary bg-surfaceElevated border border-white/10 rounded-lg hover:border-purple-500/50 hover:text-textPrimary hover:bg-surface transition-all disabled:opacity-50 flex items-center gap-3 group"
                        >
                            <span className="flex items-center justify-center w-5 h-5 shrink-0 text-textTertiary group-hover:text-purple-400 transition-colors">
                              {example.icon}
                            </span>
                            <span className="flex-1 min-w-0">{example.text}</span>
                        </button>
                      ));
                    })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Enhanced Start Button - Card-style with context - Hide for Patent Agent, Financial Agent, Clinical Agent, Market Research Agent, Regulatory Agent, and Target Biology Agent (they use their own interfaces) - Also hide when Hero Skills enabled */}
              {!USE_HERO_SKILLS && selectedAgent !== 'patent' && selectedAgent !== 'financial' && selectedAgent !== 'clinical' && selectedAgent !== 'market_research' && selectedAgent !== 'regulatory' && selectedAgent !== 'target_biology' && (
                <div className="mt-4">
                    <button
                      onClick={handleStartAnalysis}
                      disabled={!query.trim() || isProcessing}
                    className={`w-full px-4 py-4 ${
                      selectedAgent === 'sonny' 
                        ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600' 
                        : `${themeClasses.bg} ${themeClasses.bgHover}`
                    } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex flex-col items-center gap-2 shadow-lg hover:shadow-xl`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-base">{isProcessing ? 'Processing...' : 'Start Analysis'}</span>
                    </div>
                    {selectedAgent === 'sonny' && !isProcessing && (
                      <div className="text-xs opacity-90 font-normal">
                        {isDemo ? 'Multi-agent collaboration • Demo mode' : `Multi-agent collaboration • ${mode === 'fast' ? '~30s' : '~2-3min'}`}
                      </div>
                    )}
                    </button>
                  </div>
                )}
            </div>
          </div>
        ) : (
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
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold tracking-wide uppercase ${
                    isDemo
                      ? 'bg-warning/20 text-warning border-warning/30'
                      : 'bg-success/20 text-success border-success/30'
                  }`}
                >
                  {isDemo ? 'Demo' : 'Live'}
                </span>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-textSecondary">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Analyzing...</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </div>
              }>
                <MultiAgentCollaboration
                  query={query}
                  documents={processedDocuments}
                  mode={mode}
                  isDemo={isDemo}
                  demoScenarioId={undefined} // Let orchestration engine match query to scenario
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

      {/* Workspace Save Modal - Before starting new analysis */}
      <WorkspaceSaveModal
        isOpen={showSaveWorkspaceModal}
        onClose={() => {
          setShowSaveWorkspaceModal(false);
          setPendingQuery('');
        }}
        onSave={handleSaveWorkspace}
        onSkip={handleSkipSave}
        workspaceName={previousWorkspaceRef.current?.name}
        tileCount={previousWorkspaceRef.current ? tiles.filter(t => t.workspaceIds.includes(previousWorkspaceRef.current!.id)).length : 0}
      />

      {/* Workspace Save Modal - After analysis completes */}
      <WorkspaceSaveModal
        isOpen={showSaveNewWorkspaceModal}
        onClose={() => setShowSaveNewWorkspaceModal(false)}
        onSave={(workspaceName: string) => {
          if (workspaceName.trim() && activeWorkspace) {
            // Update workspace name
            useWorkspaceStore.getState().updateWorkspace(activeWorkspace, {
              name: workspaceName.trim(),
              lastModified: new Date().toISOString(),
            });
          }
          setShowSaveNewWorkspaceModal(false);
        }}
        onSkip={() => setShowSaveNewWorkspaceModal(false)}
        workspaceName={activeWorkspace ? getWorkspaceById(activeWorkspace)?.name : undefined}
        tileCount={tiles.filter(t => activeWorkspace ? t.workspaceIds.includes(activeWorkspace) : false).length}
      />
    </motion.aside>
  );
}
