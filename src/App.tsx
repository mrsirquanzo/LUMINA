import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { SonnyLogo } from './components/SonnyLogo';
import IntelligenceFeed from './components/views/IntelligenceFeed';
import SonnyResearchDashboard from './components/research/SonnyResearchDashboard';
import WatchlistView from './components/watchlist/WatchlistView';
import ProjectWorkspace from './components/projects/ProjectWorkspace';
import { WorkbookRun } from './components/research/workbook/WorkbookRun';
import DashboardSkeleton from './components/DashboardSkeleton';
import SearchModal from './components/SearchModal';
import SettingsModal from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import SkipLink from './components/SkipLink';
import { TargetProvider, type TargetData } from './contexts/TargetContext';
import { useToast } from './hooks/useToast';
import { type ViewState } from './types';
import { DEFAULT_PROJECTS, useProjectStore } from './lib/projects/store';
import { getWorkbookScenario } from './lib/workbook/scenarios';
import type { WorkbookRun as WorkbookRunData } from './lib/workbook/types';


export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('research');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [workspaceWorkbook, setWorkspaceWorkbook] = useState<WorkbookRunData | null>(null);
  const [feedTarget, setFeedTarget] = useState<string | null>(null);
  const [currentTarget, setCurrentTarget] = useState<TargetData | null>(null);
  const [isLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const openFeedForTarget = (target?: string) => {
    setWorkspaceWorkbook(null);
    setFeedTarget(target ?? null);
    setCurrentView('feed');
    setMobileNavOpen(false);
  };
  const changeView = (view: ViewState) => {
    setWorkspaceWorkbook(null);
    setCurrentView(view);
    setMobileNavOpen(false);
  };
  const openProject = (projectId: string) => {
    setWorkspaceWorkbook(null);
    setSelectedProjectId(projectId);
    setCurrentView('project');
    setMobileNavOpen(false);
  };
  const toast = useToast();

  useEffect(() => {
    useProjectStore.getState().seedIfEmpty(DEFAULT_PROJECTS);
  }, []);

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
          onViewChange={changeView}
          onOpenFeedForTarget={openFeedForTarget}
          selectedProjectId={selectedProjectId}
          onOpenProject={openProject}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        {/* Mobile drawer backdrop */}
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-30 bg-ink/30 md:hidden"
          />
        )}

        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar with menu toggle (hidden on md+) */}
          <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 md:hidden">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
              className="icon-action h-9 w-9 rounded-md"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-2">
              <SonnyLogo size={24} />
              <span className="t-h2 relative top-[2px] select-none leading-none text-textPrimary">Sonny</span>
            </div>
          </div>
          <div
            id="main-content"
            className="flex-1 overflow-y-auto custom-scrollbar relative transition-all duration-300"
            role="main"
            aria-label="Main content"
          >

            {/* Content area */}
            <div className="min-h-full relative z-10 p-4 md:p-6 pb-20 w-full">
              {isLoading && <DashboardSkeleton />}

              {workspaceWorkbook ? (
                <WorkbookRun run={workspaceWorkbook} onBack={() => setWorkspaceWorkbook(null)} />
              ) : currentView === 'feed' && (
                <Suspense fallback={<DashboardSkeleton />}>
                  <IntelligenceFeed initialTarget={feedTarget ?? undefined} />
                </Suspense>
              )}

              {!workspaceWorkbook && currentView === 'research' && (
                <Suspense fallback={<DashboardSkeleton />}>
                  <SonnyResearchDashboard initialQuery={sonnyQuery || undefined} onOpenFeed={() => openFeedForTarget()} onOpenProject={openProject} />
                </Suspense>
              )}

              {!workspaceWorkbook && currentView === 'project' && selectedProjectId && (
                <ProjectWorkspace
                  projectId={selectedProjectId}
                  onOpenWorkbook={(capability, scenarioId) => {
                    const workbook = getWorkbookScenario(capability, scenarioId);
                    if (workbook) setWorkspaceWorkbook(workbook);
                  }}
                />
              )}

              {!workspaceWorkbook && currentView === 'watchlist' && (
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
