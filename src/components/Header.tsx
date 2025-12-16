import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Grid,
  List,
  Search,
  X,
  Trash2,
  Radio,
  RotateCcw,
  FolderPlus,
} from 'lucide-react';
import type { Persona } from '../types';
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import { getStoredAgentMode, onAgentModeUpdated, requestAgentMode, type AgentMode } from '../lib/agentMode';

interface HeaderProps {
  persona: Persona;
  targetName?: string; // Optional, will use active workspace if not provided
  indication?: string;
  dataFreshness?: string;
  onSearch?: (query: string) => void;
  onExport: (format: 'pdf' | 'pptx' | 'docx') => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onOpenSonnyPanel?: () => void;
  sonnyPanelCollapsed?: boolean;
  onToggleSonnyPanel?: () => void;
}

export default function Header({
  persona,
  targetName: targetNameProp,
  indication,
  dataFreshness = '2h ago',
  onSearch,
  viewMode = 'grid',
  onViewModeChange,
  onOpenSonnyPanel,
  sonnyPanelCollapsed = false,
  onToggleSonnyPanel,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>(() => getStoredAgentMode());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const clearAllTiles = useTileStore((state) => state.clearAllTiles);
  const tiles = useTileStore((state) => state.tiles);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const getWorkspaceById = useWorkspaceStore((state) => state.getWorkspaceById);
  
  // Get current target from active workspace or use prop
  // Return empty string if no target is selected (initial load)
  const currentTarget = useMemo(() => {
    if (targetNameProp) return targetNameProp;
    if (activeWorkspaceId) {
      const activeWorkspace = getWorkspaceById(activeWorkspaceId);
      return activeWorkspace?.target || '';
    }
    return ''; // Empty on initial load when no workspace is active
  }, [targetNameProp, activeWorkspaceId, getWorkspaceById]);
  
  // Memoize visible tiles to prevent infinite loops
  const visibleTiles = useMemo(() => {
    if (!activeWorkspaceId) return tiles;
    return tiles.filter((tile) => tile.workspaceIds.includes(activeWorkspaceId));
  }, [tiles, activeWorkspaceId]);

  const canSaveWorkspace = useMemo(() => {
    if (!activeWorkspaceId) return false;
    return visibleTiles.length > 0;
  }, [activeWorkspaceId, visibleTiles.length]);
  
  // Check if there are any tiles to clear (either dynamic tiles or baseline tiles for TROP2)
  const hasTilesToClear = useMemo(() => {
    // Always show if there are any dynamic tiles
    if (tiles.length > 0) return true;
    
    // For TROP2 workspace, also consider baseline tiles exist
    if (activeWorkspaceId) {
      const activeWorkspace = getWorkspaceById(activeWorkspaceId);
      if (activeWorkspace?.target?.toUpperCase() === 'TROP2') {
        return true; // TROP2 always has baseline tiles
      }
    }
    
    return false;
  }, [tiles.length, activeWorkspaceId, getWorkspaceById]);

  // Keep header toggle synced with Sonny panel mode
  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      // Open Sonny panel if provided
      if (onOpenSonnyPanel) {
        onOpenSonnyPanel();
      }
      // Pass query to Sonny via onSearch callback
      onSearch?.(query);
      // Clear the search input after submitting
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleClearAllTiles = () => {
    // Count tiles for current workspace, or all tiles if no workspace
    const tileCount = visibleTiles.length;
    if (tileCount === 0) {
      return; // No tiles to clear
    }
    
    const workspaceName = activeWorkspaceId 
      ? getWorkspaceById(activeWorkspaceId)?.name || 'workspace'
      : 'dashboard';
    
    if (window.confirm(`Are you sure you want to clear all ${tileCount} tile${tileCount > 1 ? 's' : ''} from ${workspaceName}? This action cannot be undone.`)) {
      clearAllTiles();
    }
  };

  const handleResetDemo = () => {
    if (!window.confirm('Reset demo state?\n\nThis will clear generated tiles and reset analysis panels so you can rerun the investor flow cleanly.')) {
      return;
    }
    window.dispatchEvent(new CustomEvent('reset-demo'));
  };

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPersonaTitle = () => {
    if (persona === 'scientist') {
      return currentTarget || ''; // Empty string when no target selected
    } else {
      return `TargetCo / TRX-101`; // Example BD format
    }
  };


  return (
    <header className="sticky top-0 z-50 h-20 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Left Section - Simplified Context */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-textPrimary truncate">{getPersonaTitle()}</h1>
          </div>
        </div>

        {/* Center Section - Search Bar */}
        <div className="flex-1 max-w-2xl mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              isSearchFocused ? 'text-primary' : 'text-textTertiary'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search targets, assets, companies..."
              className="w-full pl-10 pr-10 py-2.5 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1.5 text-xs text-textTertiary">
                <kbd className="px-1.5 py-0.5 bg-surface border border-white/10 rounded text-textSecondary">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface border border-white/10 rounded text-textSecondary">K</kbd>
              </div>
            )}
          </form>
        </div>


        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Demo/Live Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-surface rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => requestAgentMode('demo')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                agentMode === 'demo' ? 'bg-surfaceElevated text-textPrimary' : 'text-textSecondary hover:text-textPrimary'
              }`}
              aria-label="Use demo mode (no API calls)"
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenSonnyPanel?.();
                requestAgentMode('live');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                agentMode === 'live'
                  ? 'bg-success/20 text-success'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
              aria-label="Use live mode (real agent APIs)"
            >
              <Radio className="w-3.5 h-3.5" />
              Live
            </button>
          </div>

          {/* View Toggle */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-white/10">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-surfaceElevated text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-surfaceElevated text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="w-px h-6 bg-white/10" />

          {/* Clear All Tiles - Show in all workspaces if there are any tiles */}
          {(tiles.length > 0 || activeWorkspaceId) && (
            <>
              {/* Save workspace (hidden in demo mode to keep investor flow clean) */}
              {agentMode !== 'demo' && (
                <button
                  type="button"
                  onClick={() => {
                    // Ensure the modal host (Sonny panel) is mounted.
                    onOpenSonnyPanel?.();
                    // Dispatch after a short tick so the panel can mount its listener.
                    setTimeout(() => window.dispatchEvent(new Event('open-save-workspace')), 50);
                  }}
                  disabled={!canSaveWorkspace}
                  className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated/50 text-textPrimary border border-white/10 rounded-lg hover:bg-surfaceElevated/70 hover:border-white/20 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={canSaveWorkspace ? 'Save this analysis as a workspace' : 'No workspace/tiles to save yet'}
                >
                  <FolderPlus className="w-4 h-4 text-textSecondary" />
                  <span className="hidden md:inline">Save workspace</span>
                </button>
              )}
              <button
                onClick={handleClearAllTiles}
                disabled={visibleTiles.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:border-red-500/30 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={visibleTiles.length > 0 ? "Clear all tiles" : "No tiles to clear"}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Clear Tiles</span>
              </button>
              {agentMode === 'demo' && (
                <button
                  onClick={handleResetDemo}
                  className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated/50 text-textPrimary border border-white/10 rounded-lg hover:bg-surfaceElevated/70 hover:border-white/20 transition-colors font-medium text-sm"
                  title="Reset demo (clear generated tiles + analysis state)"
                >
                  <RotateCcw className="w-4 h-4 text-textSecondary" />
                  <span className="hidden md:inline">Reset Demo</span>
                </button>
              )}
              <div className="w-px h-6 bg-white/10" />
            </>
          )}

          {/* Sonny Panel Toggle - Enhanced with glassmorphism and gradient */}
          {onToggleSonnyPanel && (
            <button
              onClick={onToggleSonnyPanel}
              className={`relative p-2.5 rounded-xl transition-all duration-300 group ${
                sonnyPanelCollapsed
                  ? 'bg-surfaceElevated/50 border border-white/10 hover:border-white/20 hover:bg-surfaceElevated/70'
                  : 'bg-gradient-to-br from-primary/20 via-primary/15 to-cyan-500/20 border border-primary/30 shadow-lg shadow-primary/20 backdrop-blur-md'
              }`}
              aria-label={sonnyPanelCollapsed ? 'Show Sonny panel' : 'Hide Sonny panel'}
              title={sonnyPanelCollapsed ? 'Show Sonny panel (⌘J)' : 'Hide Sonny panel (⌘J)'}
            >
              <Sparkles 
                className={`w-5 h-5 transition-all duration-300 ${
                  sonnyPanelCollapsed
                    ? 'text-textSecondary group-hover:text-primary'
                    : 'text-primary drop-shadow-sm'
                }`}
              />
              {!sonnyPanelCollapsed && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </button>
          )}
        </div>
      </div>

    </header>
  );
}
