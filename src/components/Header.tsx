import { useState, useEffect, useRef } from 'react';
import {
  Grid,
  List,
  Search,
  X,
  Radio,
  RotateCcw,
} from 'lucide-react';
import type { Persona } from '../types';
import { getStoredAgentMode, onAgentModeUpdated, requestAgentMode, type AgentMode } from '../lib/agentMode';

interface HeaderProps {
  persona: Persona;
  targetName?: string; // Optional, will use active workspace if not provided
  indication?: string;
  dataFreshness?: string;
  onSearch?: (query: string) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export default function Header({
  persona,
  targetName: targetNameProp,
  indication,
  dataFreshness = '2h ago',
  onSearch,
  viewMode = 'grid',
  onViewModeChange,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [agentMode, setAgentMode] = useState<AgentMode>(() => getStoredAgentMode());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentTarget = targetNameProp || '';


  // Keep header toggle synced with Sonny panel mode
  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  const handleSearch = async (query: string) => {
    if (query.trim()) {
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
    <header className="sticky top-0 z-50 h-20 glass border-b border-border">
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
              className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
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
                <kbd className="px-1.5 py-0.5 bg-subtle border border-border rounded text-textSecondary">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-subtle border border-border rounded text-textSecondary">K</kbd>
              </div>
            )}
          </form>
        </div>


        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Demo/Live Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
            <button
              type="button"
              onClick={() => requestAgentMode('demo')}
              className={`tactile px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                agentMode === 'demo' ? 'bg-surfaceElevated text-textPrimary' : 'text-textSecondary hover:text-textPrimary'
              }`}
              aria-label="Use demo mode (no API calls)"
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => {
                requestAgentMode('live');
              }}
              className={`tactile px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
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
            <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`tactile p-1.5 rounded transition-colors ${
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
                className={`tactile p-1.5 rounded transition-colors ${
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

          <div className="w-px h-6 bg-border" />

          {agentMode === 'demo' && (
            <button
              onClick={handleResetDemo}
              className="tactile flex items-center gap-2 px-3 py-2 bg-surfaceElevated/50 text-textPrimary border border-border rounded-lg hover:bg-surfaceElevated/70 hover:border-slate-300 transition-colors font-medium text-sm"
              title="Reset demo (clear analysis state)"
            >
              <RotateCcw className="w-4 h-4 text-textSecondary" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          )}

        </div>
      </div>

    </header>
  );
}
