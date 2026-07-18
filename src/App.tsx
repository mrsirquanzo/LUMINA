import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import IntelligenceFeed from './components/views/IntelligenceFeed';
import SonnyResearchDashboard from './components/research/SonnyResearchDashboard';
import DossiersLibrary from './components/dossiers/DossiersLibrary';
import WatchlistView from './components/watchlist/WatchlistView';
import DashboardSkeleton from './components/DashboardSkeleton';
import SearchModal from './components/SearchModal';
import SettingsModal from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import SkipLink from './components/SkipLink';
import { TargetProvider, type TargetData } from './contexts/TargetContext';
import { useToast } from './hooks/useToast';
import { type ViewState } from './types';


export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('research');
  const [feedTarget, setFeedTarget] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<TargetData | null>(null);
  const [isLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openFeedForTarget = (target?: string) => { setFeedTarget(target ?? null); setCurrentView('feed'); };
  const toast = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k': // Search
            e.preventDefault();
            setSearchOpen(true);
            break;
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [sonnyQuery, setSonnyQuery] = useState<string>('');

  // Global reset for investor demo reruns (single action).
  useEffect(() => {
    const handleResetDemo = () => {
      // Close transient modals.
      setSearchOpen(false);
      setSettingsOpen(false);

      // Reset the Sonny query to prevent auto-start effect from re-triggering
      setSonnyQuery('');

      toast.success('Reset complete.');
    };

    window.addEventListener('reset-demo', handleResetDemo as EventListener);
    return () => window.removeEventListener('reset-demo', handleResetDemo as EventListener);
  }, [toast]);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Set the query to trigger auto-start in Sonny panel
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

  return (
    <TargetProvider currentTarget={currentTarget} setCurrentTarget={setCurrentTarget}>
      <SkipLink />
      <div className="flex h-screen bg-background text-textPrimary overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenFeedForTarget={openFeedForTarget}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Header />

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
                  <IntelligenceFeed initialTarget={feedTarget ?? undefined} />
                </Suspense>
              )}

              {currentView === 'research' && (
                <Suspense fallback={<DashboardSkeleton />}>
                  <SonnyResearchDashboard initialQuery={sonnyQuery || undefined} onOpenFeed={() => openFeedForTarget()} />
                </Suspense>
              )}

              {currentView === 'dossiers' && (
                <DossiersLibrary onOpenSonny={() => setCurrentView('research')} />
              )}

              {currentView === 'watchlist' && (
                <WatchlistView onViewInFeed={openFeedForTarget} />
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
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />

        {/* Toast notifications */}
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      </div>
    </TargetProvider>
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
