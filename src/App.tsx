import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import IntelligenceFeed from './components/views/IntelligenceFeed';
import SonnyResearchDashboard from './components/research/SonnyResearchDashboard';
import DossiersLibrary from './components/dossiers/DossiersLibrary';
import DashboardSkeleton from './components/DashboardSkeleton';
import SearchModal from './components/SearchModal';
import ExportModal from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import SkipLink from './components/SkipLink';
import LandingAnimation from './components/LandingAnimation';
import { PersonaProvider } from './contexts/PersonaContext';
import { TargetProvider, type TargetData } from './contexts/TargetContext';
import { useToast } from './hooks/useToast';
import { Persona, type ViewState } from './types';


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
  const [currentView, setCurrentView] = useState<ViewState>('research');
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

  // On a browser refresh, always land in the lobby.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (forceLobbyOnLoadRef.current && typeof window !== 'undefined') {
      sessionStorage.removeItem('lumina-has-selected-target');
      sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');
    }
  }, []);

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



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k': // Search
            e.preventDefault();
            setSearchOpen(true);
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
  }, [showLandingAnimation]);

  const [sonnyQuery, setSonnyQuery] = useState<string>('');

  // Global reset for investor demo reruns (single action).
  useEffect(() => {
    const handleResetDemo = () => {
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

      // Set the query to trigger auto-start in Sonny panel (no delay needed)
      setSonnyQuery(query);
    }
  }, []);
  
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

  const handleLandingComplete = () => {
    // Mark as seen in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lumina-has-seen-intro', 'true');
      
      // Ensure we show the lobby after landing animation (not restore previous workspace)
      // unless user has already selected a target this session
      const hasSelectedTargetThisSession = sessionStorage.getItem('lumina-has-selected-target') === 'true';
      if (!hasSelectedTargetThisSession || forceLobbyOnLoadRef.current) {
        sessionStorage.removeItem('lumina-has-selected-target');
        sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');

        // Lobby should start with minimized sidebar.
        setSidebarCollapsed(true);
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
        sessionStorage.removeItem('lumina-has-selected-target');
        sessionStorage.setItem('lumina-suppress-orchestration-tiles', 'true');

        // Lobby should start with minimized sidebar.
        setSidebarCollapsed(true);
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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <div
              id="main-content"
              className="flex-1 overflow-y-auto custom-scrollbar relative transition-all duration-300"
              role="main"
              aria-label="Main content"
            >

              {/* Content area */}
              <div className="min-h-full relative z-10 p-4 md:p-6 pb-20 w-full">
                {isLoading && <DashboardSkeleton />}

                {currentView === 'feed' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <IntelligenceFeed />
                  </Suspense>
                )}

                {currentView === 'research' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <SonnyResearchDashboard initialQuery={sonnyQuery || undefined} />
                  </Suspense>
                )}

                {currentView === 'dossiers' && (
                  <DossiersLibrary onOpenSonny={() => setCurrentView('research')} />
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
          />
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onReplayLanding={replayLandingAnimation}
          />

          {/* Toast notifications */}
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
          
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
