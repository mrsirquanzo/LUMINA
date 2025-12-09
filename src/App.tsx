import { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ScientistDashboard from './components/ScientistDashboard';
import ScoutDashboard from './components/ScoutDashboard';
import IntelligenceFeed from './components/views/IntelligenceFeed';
import Workspaces from './components/views/Workspaces';
import CompareView from './components/views/CompareView';
import DashboardSkeleton from './components/DashboardSkeleton';
import SearchModal from './components/SearchModal';
import ExportModal from './components/ExportModal';
import { ToastContainer } from './components/Toast';
import SkipLink from './components/SkipLink';
import SonnySidePanel from './components/SonnySidePanel';
import { PersonaProvider } from './contexts/PersonaContext';
import { TargetProvider, type TargetData } from './contexts/TargetContext';
import { useToast } from './hooks/useToast';
import { Persona, type ViewState } from './types';
import { WORKSPACES } from './constants';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

function AppContent() {
  const [activePersona, setActivePersona] = useState<Persona>(Persona.SCIENTIST);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
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
  const [currentTarget, setCurrentTarget] = useState<TargetData | null>({
    id: 'trop2',
    name: 'TROP2',
    indication: 'Solid Tumors',
    dataFreshness: '2h ago',
  });
  const [isLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const toast = useToast();

  // Theme switching effect
  useEffect(() => {
    const root = document.documentElement;
    if (activePersona === Persona.SCIENTIST) {
      root.style.setProperty('--color-primary', '191 90 242'); // Purple
      root.className = 'scientist-theme';
    } else {
      root.style.setProperty('--color-primary', '255 159 10'); // Orange
      root.className = 'scout-theme';
    }
  }, [activePersona]);


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
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setExportOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sonnyPanelCollapsed]);

  const handleSearch = (query: string) => {
    // Open Sonny panel if collapsed, and pass query to it
    if (sonnyPanelCollapsed) {
      setSonnyPanelCollapsed(false);
    }
    // The Sonny panel will handle the query via URL/state - for now just show toast
    toast.info(`Query sent to Sonny: ${query}`);
  };

  const handleExport = (format: 'pdf' | 'pptx' | 'docx') => {
    toast.success(`Exporting as ${format.toUpperCase()}...`);
    // Handle export logic
  };

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
            currentTarget={currentTarget?.name}
            recentWorkspaces={WORKSPACES}
          />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              persona={activePersona}
              targetName={currentTarget?.name || 'TROP2'}
              indication={currentTarget?.indication}
              dataFreshness={currentTarget?.dataFreshness}
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
              {/* Background gradient blob */}
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" aria-hidden="true" />

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

                {currentView === 'compare' && (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <CompareView />
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

          {/* Toast notifications */}
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
          
          {/* Sonny Side Panel - Persistent right panel for agent interactions */}
          <SonnySidePanel
            isCollapsed={sonnyPanelCollapsed}
            onToggleCollapse={() => setSonnyPanelCollapsed(!sonnyPanelCollapsed)}
            targetName={currentTarget?.name || 'TROP2'}
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
