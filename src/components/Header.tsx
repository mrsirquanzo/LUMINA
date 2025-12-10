import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Grid,
  List,
  Loader2,
  FileDown,
  Presentation,
  File,
  Search,
  X,
} from 'lucide-react';
import type { Persona } from '../types';

interface HeaderProps {
  persona: Persona;
  targetName: string;
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
  targetName,
  indication = 'Solid Tumors',
  dataFreshness = '2h ago',
  onSearch,
  onExport,
  viewMode = 'grid',
  onViewModeChange,
  onOpenSonnyPanel,
  sonnyPanelCollapsed = false,
  onToggleSonnyPanel,
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close menus
      if (e.key === 'Escape') {
        setShowExportMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'pdf' | 'pptx' | 'docx') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate export
      onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      // Open Sonny panel if provided
      if (onOpenSonnyPanel) {
        onOpenSonnyPanel();
      }
      // Also call onSearch if provided (for backwards compatibility)
      onSearch?.(query);
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
      return targetName;
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

          {/* Status Badge - Only indication */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-md">
              {indication}
            </span>
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

          {/* Export Report */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden md:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span className="hidden md:inline">Export</span>
                </>
              )}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-slide-up">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-textPrimary hover:bg-surface transition-colors"
                >
                  <FileDown className="w-4 h-4 text-textTertiary" />
                  <div>
                    <p className="text-sm font-medium">Export as PDF</p>
                    <p className="text-xs text-textTertiary">Portable document</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('pptx')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-textPrimary hover:bg-surface transition-colors border-t border-white/5"
                >
                  <Presentation className="w-4 h-4 text-textTertiary" />
                  <div>
                    <p className="text-sm font-medium">Export as PowerPoint</p>
                    <p className="text-xs text-textTertiary">Presentation deck</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-textPrimary hover:bg-surface transition-colors border-t border-white/5"
                >
                  <File className="w-4 h-4 text-textTertiary" />
                  <div>
                    <p className="text-sm font-medium">Export as Word</p>
                    <p className="text-xs text-textTertiary">Document format</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

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
