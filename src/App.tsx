import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ScientistDashboard from './components/ScientistDashboard';
import ScoutDashboard from './components/ScoutDashboard';
import IntelligenceFeed from './components/views/IntelligenceFeed';
import Workspaces from './components/views/Workspaces';
import Recent from './components/views/Recent';
import SonnyResearchDashboard from './components/research/SonnyResearchDashboard';
import DashboardSkeleton from './components/DashboardSkeleton';
import SearchModal from './components/SearchModal';
import ExportModal from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import SkipLink from './components/SkipLink';
import SonnySidePanel from './components/SonnySidePanel';
import LandingAnimation from './components/LandingAnimation';
import { PersonaProvider } from './contexts/PersonaContext';
import { TargetProvider, type TargetData } from './contexts/TargetContext';
import { useToast } from './hooks/useToast';
import { Persona, type ViewState } from './types';
import { WORKSPACES } from './constants';
import { useWorkspaceStore } from './lib/workspaces/store';
import { useTileStore } from './lib/tiles/store';
import { buildTilesMarkdownReport, exportMarkdownReport } from './lib/reportExport';
import { formatTargetDisplayName } from './lib/targetNaming';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

function isReloadNavigation(): boolean {
  if (typeof performance === 'undefined') return false;

  // Modern Navigation Timing API
  const entries = performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] | undefined;
  const entry = entries?.[0];
  if (entry?.type) return entry.type === 'reload';

  // Legacy API fallback
  // eslint-disable-next-line deprecation/deprecation
  const legacyType = (performance as any).navigation?.type;
  return legacyType === 1;
}

function AppContent() {
  const [activePersona, setActivePersona] = useState<Persona>(Persona.SCIENTIST);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [showLandingAnimation, setShowLandingAnimation] = useState(() => {
    // Check if user has seen the intro in this session
    if (typeof window !== 'undefined') {
      const hasSeenIntro = sessionStorage.getItem('lumina-has-seen-intro');
      return !hasSeenIntro;
    }
    return true;
  });
  
  // Listen for navigate-to-dashboard event
  useEffect(() => {
    const handleNavigate = () => {
      setCurrentView('dashboard');
    };
    window.addEventListener('navigate-to-dashboard', handleNavigate);
    return () => window.removeEventListener('navigate-to-dashboard', handleNavigate);
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Initialize sonnyPanelCollapsed from localStorage immediately to prevent layout shift
  const [sonnyPanelCollapsed, setSonnyPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sonnyPanelCollapsed');
      if (savedState !== null) {
        return savedState === 'true';
      }
    }
    return false; // Default to expanded
  });
  const [sonnyPanelWidth, setSonnyPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('lumina-sonny-panel-width');
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= 400 && width <= 900) {
          return width;
        }
      }
    }
    return 600; // Default width
  });
  const [currentTarget, setCurrentTarget] = useState<TargetData | null>(null); // Start with null - no target selected
  const [isLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const toast = useToast();
  // Refresh semantics: sessionStorage persists across a refresh, but we want a lobby after every refresh.
  // Detect once at boot and reuse consistently.
  const forceLobbyOnLoadRef = useRef(typeof window !== 'undefined' && isReloadNavigation());

  // Clean up old/duplicate workspaces on first load and ensure empty state shows when appropriate
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Use setTimeout to defer cleanup and prevent blocking render
    setTimeout(() => {
      // Clean up old/duplicate workspaces
      useWorkspaceStore.getState().cleanupWorkspaces();

      // On a browser refresh, always land in the lobby (do NOT restore the last active workspace).
      if (forceLobbyOnLoadRef.current && typeof window !== 'undefined') {
        sessionStorage.removeItem('lumina-has-selected-target');
        sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');
        useTileStore.getState().setActiveWorkspace(null);
        useWorkspaceStore.getState().setActiveWorkspace(null);
        console.log('[App] Forced lobby on refresh (cleared active workspace).');
      }

      // On first-time entry, show the lobby (recommended targets) instead of auto-loading demo TROP2 baseline.
      // We gate on session selection to ensure the app lands in the lobby after intro,
      // even if a previous workspace was persisted from earlier sessions.
      const hasSelectedTargetThisSession =
        typeof window !== 'undefined' && sessionStorage.getItem('lumina-has-selected-target') === 'true';
      const tiles = useTileStore.getState().tiles;

      if (!hasSelectedTargetThisSession) {
        useTileStore.getState().setActiveWorkspace(null);
        useWorkspaceStore.getState().setActiveWorkspace(null);
        console.log('[App] Cleared restored workspace to show lobby (new session).', { tiles: tiles.length });
      }
      
      // Check if we should show empty state
      const activeWorkspaceAfter = useTileStore.getState().activeWorkspace;
      const activeWorkspaceIdAfter = useWorkspaceStore.getState().activeWorkspaceId;
      
      // If no tiles exist, clear active workspace to show empty state
      if (tiles.length === 0) {
        if (activeWorkspaceAfter || activeWorkspaceIdAfter) {
          useTileStore.getState().setActiveWorkspace(null);
          useWorkspaceStore.getState().setActiveWorkspace(null);
          console.log('[App] Cleared active workspace to show empty state (no tiles)');
        }
      } else {
        // If tiles exist but no active workspace, we might want to show them
        // But for now, let's still clear to show empty state on first load
        if (!activeWorkspaceAfter && !activeWorkspaceIdAfter) {
          console.log('[App] Tiles exist but no active workspace - tiles will show');
        }
      }
    }, 100); // Small delay to ensure stores are ready
  }, []); // Empty dependency array - only run once on mount

  // Theme switching effect
  useEffect(() => {
    const root = document.documentElement;
    if (activePersona === Persona.SCIENTIST) {
      root.style.setProperty('--color-primary', '29 78 216'); // Trust blue (accent unified; persona concept unchanged)
      root.className = 'scientist-theme';
    } else {
      root.style.setProperty('--color-primary', '29 78 216'); // Trust blue (accent unified; persona concept unchanged)
      root.className = 'scout-theme';
    }
  }, [activePersona]);


  // Subscribe to active workspace changes
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const getWorkspaceById = useWorkspaceStore((state) => state.getWorkspaceById);
  const tileActiveWorkspaceId = useTileStore((state) => state.activeWorkspace);
  const isLobby = !tileActiveWorkspaceId && !activeWorkspaceId;
  const lobbyLayoutAppliedRef = useRef(false);

  // Keep workspace store + tile store active workspace IDs in sync.
  // They both persist to the same localStorage key, but don't automatically notify each other.
  useEffect(() => {
    if (tileActiveWorkspaceId === activeWorkspaceId) return;

    // Prefer whichever store currently has a value.
    if (tileActiveWorkspaceId) {
      useWorkspaceStore.getState().setActiveWorkspace(tileActiveWorkspaceId);
      return;
    }

    if (activeWorkspaceId) {
      useTileStore.getState().setActiveWorkspace(activeWorkspaceId);
    }
  }, [tileActiveWorkspaceId, activeWorkspaceId]);

  // Lobby layout preset: when we land in the lobby (no active workspace) after the intro,
  // minimize side panels to match the intended first impression.
  // We only apply this once per "lobby entry" so users can expand panels manually if they want.
  useEffect(() => {
    if (showLandingAnimation) return;

    if (!isLobby) {
      lobbyLayoutAppliedRef.current = false;
      return;
    }

    if (lobbyLayoutAppliedRef.current) return;
    lobbyLayoutAppliedRef.current = true;

    setSidebarCollapsed(true);
    setSonnyPanelCollapsed(true);
  }, [isLobby, showLandingAnimation]);
  
  // Update currentTarget when active workspace changes
  useEffect(() => {
    const effectiveWorkspaceId = tileActiveWorkspaceId || activeWorkspaceId;
    if (effectiveWorkspaceId) {
      const activeWorkspace = getWorkspaceById(effectiveWorkspaceId);
      if (activeWorkspace) {
        setCurrentTarget({
          id: String(activeWorkspace.id),
          name: formatTargetDisplayName(activeWorkspace.target),
          indication: 'Oncology', // Default indication
          dataFreshness: 'Just now',
        });
      } else {
        setCurrentTarget(null);
      }
    } else {
      // No active workspace - clear target
      setCurrentTarget(null);
    }
  }, [tileActiveWorkspaceId, activeWorkspaceId, getWorkspaceById]);

  // Save Sonny panel state to localStorage
  useEffect(() => {
    localStorage.setItem('sonnyPanelCollapsed', String(sonnyPanelCollapsed));
  }, [sonnyPanelCollapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k': // Search / Toggle Sonny panel
            e.preventDefault();
            if (sonnyPanelCollapsed) {
              setSonnyPanelCollapsed(false);
            } else {
              setSearchOpen(true);
            }
            break;
          case '1': // Scientist view
            e.preventDefault();
            setActivePersona(Persona.SCIENTIST);
            break;
          case '2': // Scout view
            e.preventDefault();
            setActivePersona(Persona.BD);
            break;
          case 'e': // Export
            e.preventDefault();
            setExportOpen(true);
            break;
          case 'j': // Toggle Sonny panel
            e.preventDefault();
            setSonnyPanelCollapsed(!sonnyPanelCollapsed);
            break;
          case 'r': // Replay landing animation
            e.preventDefault();
            replayLandingAnimation();
            break;
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setExportOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sonnyPanelCollapsed, showLandingAnimation]);

  const [sonnyQuery, setSonnyQuery] = useState<string>('');

  // Global reset for investor demo reruns (single action).
  useEffect(() => {
    const handleResetDemo = () => {
      // Clear dynamic tiles and return to lobby (no active workspace).
      useTileStore.getState().clearAllTiles();
      useTileStore.getState().setActiveWorkspace(null);
      useWorkspaceStore.getState().setActiveWorkspace(null);

      // Mark session as "no selected target" so the lobby renders.
      sessionStorage.removeItem('lumina-has-selected-target');

      // If an analysis is currently running in Sonny, don't cancel it.
      // Instead, suppress tile/workspace creation while the lobby is showing.
      sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');

      // Close transient modals.
      setSearchOpen(false);
      setExportOpen(false);
      setSettingsOpen(false);

      // Reset the Sonny query to prevent auto-start effect from re-triggering
      setSonnyQuery('');

      toast.success('Reset complete: returned to lobby.');
    };

    window.addEventListener('reset-demo', handleResetDemo as EventListener);
    return () => window.removeEventListener('reset-demo', handleResetDemo as EventListener);
  }, [toast]);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Mark that the user explicitly chose a target for this session (so we can exit lobby).
      sessionStorage.setItem('lumina-has-selected-target', 'true');
      sessionStorage.removeItem('lumina-suppress-orchestration-tiles');

      // Open Sonny panel if collapsed, then set query immediately
      // React will batch these updates, so both happen in the same render cycle
      if (sonnyPanelCollapsed) {
        setSonnyPanelCollapsed(false);
      }
      // Set the query to trigger auto-start in Sonny panel (no delay needed)
      setSonnyQuery(query);
    }
  }, [sonnyPanelCollapsed]);
  
  // Use a ref to always have the latest handleSearch function
  const handleSearchRef = useRef(handleSearch);
  useEffect(() => {
    handleSearchRef.current = handleSearch;
  }, [handleSearch]);
  
  // Listen for quick start triggers - use ref to avoid stale closure issues
  useEffect(() => {
    const handleTriggerSearch = (event: CustomEvent<string>) => {
      handleSearchRef.current(event.detail);
    };
    
    window.addEventListener('trigger-search', handleTriggerSearch as EventListener);
    return () => {
      window.removeEventListener('trigger-search', handleTriggerSearch as EventListener);
    };
  }, []);

  const handleQueryProcessed = () => {
    setSonnyQuery('');
  };

  const handleExport = (format: 'pdf' | 'pptx' | 'docx') => {
    try {
      const tiles = useTileStore.getState().tiles;
      const activeWsId = useWorkspaceStore.getState().activeWorkspaceId;
      const getWs = useWorkspaceStore.getState().getWorkspaceById;
      const activeWs = activeWsId ? getWs(activeWsId) : undefined;

      const visibleTiles = activeWsId
        ? tiles.filter((t) => t.workspaceIds.includes(activeWsId))
        : tiles;

      if (visibleTiles.length === 0) {
        toast.error('Nothing to export yet. Create a few tiles first.');
        return;
      }

      const now = new Date();
      const dateStamp = now.toISOString().split('T')[0];

      const title = activeWs?.target
        ? `${activeWs.target} • Lumina Report`
        : 'Lumina Report';

      const markdown = buildTilesMarkdownReport(
        {
          title,
          subtitle: activeWs?.name ? `Workspace: ${activeWs.name}` : undefined,
          generatedAt: now,
          persona: String(activePersona),
          workspaceName: activeWs?.name,
          target: activeWs?.target,
        },
        visibleTiles
      );

      const filenameBase = `${activeWs?.target || 'lumina'}-report-${dateStamp}`;
      exportMarkdownReport(format, filenameBase, title, markdown);

      toast.success(
        format === 'pptx'
          ? 'Exported as Markdown outline (PPTX generator coming soon).'
          : format === 'docx'
            ? 'Exported as Word-compatible document.'
            : 'Opened print preview for PDF export.'
      );
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  const handleLandingComplete = () => {
    // Mark as seen in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lumina-has-seen-intro', 'true');
      
      // Ensure we show the lobby after landing animation (not restore previous workspace)
      // unless user has already selected a target this session
      const hasSelectedTargetThisSession = sessionStorage.getItem('lumina-has-selected-target') === 'true';
      if (!hasSelectedTargetThisSession || forceLobbyOnLoadRef.current) {
        useTileStore.getState().setActiveWorkspace(null);
        useWorkspaceStore.getState().setActiveWorkspace(null);
        sessionStorage.removeItem('lumina-has-selected-target');
        sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');

        // Lobby should start with minimized side panels.
        setSidebarCollapsed(true);
        setSonnyPanelCollapsed(true);
      }
    }
    setShowLandingAnimation(false);
  };

  const handleLandingSkip = () => {
    // Mark as seen in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lumina-has-seen-intro', 'true');
      
      // Ensure we show the lobby after skipping (not restore previous workspace)
      // unless user has already selected a target this session
      const hasSelectedTargetThisSession = sessionStorage.getItem('lumina-has-selected-target') === 'true';
      if (!hasSelectedTargetThisSession || forceLobbyOnLoadRef.current) {
        useTileStore.getState().setActiveWorkspace(null);
        useWorkspaceStore.getState().setActiveWorkspace(null);
        sessionStorage.removeItem('lumina-has-selected-target');
        sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');

        // Lobby should start with minimized side panels.
        setSidebarCollapsed(true);
        setSonnyPanelCollapsed(true);
      }
    }
    setShowLandingAnimation(false);
  };

  const replayLandingAnimation = () => {
    // Clear session storage to allow replay
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lumina-has-seen-intro');
    }
    setShowLandingAnimation(true);
  };

  // Show landing animation if needed
  if (showLandingAnimation) {
    return (
      <LandingAnimation
        onComplete={handleLandingComplete}
        onSkip={handleLandingSkip}
      />
    );
  }

  return (
    <PersonaProvider activePersona={activePersona} setActivePersona={setActivePersona}>
      <TargetProvider currentTarget={currentTarget} setCurrentTarget={setCurrentTarget}>
        <SkipLink />
        <div className="flex h-screen bg-background text-textPrimary overflow-hidden">
          <Sidebar
            activePersona={activePersona}
            onPersonaChange={setActivePersona}
            currentView={currentView}
            onViewChange={setCurrentView}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              persona={activePersona}
              onSearch={handleSearch}
              onExport={handleExport}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenSonnyPanel={() => {
                if (sonnyPanelCollapsed) {
                  setSonnyPanelCollapsed(false);
                }
              }}
              sonnyPanelCollapsed={sonnyPanelCollapsed}
              onToggleSonnyPanel={() => setSonnyPanelCollapsed(!sonnyPanelCollapsed)}
            />

            <div
              id="main-content"
              className="flex-1 overflow-y-auto custom-scrollbar relative transition-all duration-300"
              role="main"
              aria-label="Main content"
              style={{
                paddingRight: !sonnyPanelCollapsed ? `${sonnyPanelWidth}px` : '0',
                transition: 'padding-right 0.3s ease-in-out',
                width: '100%',
                maxWidth: '100%',
              }}
            >

              {/* Content area */}
              <div className="min-h-full relative z-10 p-4 md:p-6 pb-20 w-full">
                {isLoading && <DashboardSkeleton />}

                {!isLoading && currentView === 'dashboard' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    {activePersona === Persona.SCIENTIST ? (
                      <ScientistDashboard viewMode={viewMode} />
                    ) : (
                      <ScoutDashboard viewMode={viewMode} />
                    )}
                  </Suspense>
                )}

                {currentView === 'feed' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <IntelligenceFeed />
                  </Suspense>
                )}

                {currentView === 'workspaces' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Workspaces />
                  </Suspense>
                )}
                
                {currentView === 'history' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Recent />
                  </Suspense>
                )}

                {currentView === 'research' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <SonnyResearchDashboard />
                  </Suspense>
                )}
              </div>
            </div>
          </main>

          {/* Global modals */}
          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSearch={handleSearch}
          />
          <ExportModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            onExport={handleExport}
          />
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onReplayLanding={replayLandingAnimation}
          />

          {/* Toast notifications */}
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
          
          {/* Sonny Side Panel - Persistent right panel for agent interactions */}
          <SonnySidePanel
            isCollapsed={sonnyPanelCollapsed}
            onToggleCollapse={() => setSonnyPanelCollapsed(!sonnyPanelCollapsed)}
            targetName={currentTarget?.name || ''}
            initialQuery={sonnyQuery}
            width={sonnyPanelWidth}
            onWidthChange={setSonnyPanelWidth}
          />
        </div>
      </TargetProvider>
    </PersonaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        <AppContent />
      </Suspense>
    </ErrorBoundary>
  );
}
