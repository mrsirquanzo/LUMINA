import { memo } from 'react';
import { Sparkles, Bell, Library, Eye, Plus } from 'lucide-react';
import type { ViewState } from '../types';
import { useWatchlistStore } from '../lib/watchlist/store';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useBriefingStore } from '../lib/research/briefingStore';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (v: ViewState) => void;
  onOpenFeedForTarget?: (target?: string) => void;
}

interface NavItem {
  id: ViewState;
  icon: typeof Sparkles;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'research', icon: Sparkles, label: 'Ask Sonny' },
  { id: 'feed',     icon: Bell,     label: 'Feed' },
  { id: 'dossiers', icon: Library,  label: 'Dossiers' },
  { id: 'watchlist',icon: Eye,      label: 'Watchlist' },
];

const Sidebar = memo(function Sidebar({
  currentView,
  onViewChange,
  onOpenFeedForTarget,
}: SidebarProps) {
  const targets = useWatchlistStore((s) => s.targets);
  const unread = useUnreadCounts(targets);
  const dossierCount = useBriefingStore((s) => Object.keys(s.briefings).length);
  const feedUnread = targets.reduce((n, t) => n + (unread[t] ?? 0), 0);

  return (
    <aside
      className="w-[248px] flex-shrink-0 bg-surface border-r border-border flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-border">
        <span className="font-display text-2xl font-semibold text-textPrimary tracking-tight select-none">
          Sonny
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              onClick={() => (id === 'feed' && onOpenFeedForTarget) ? onOpenFeedForTarget() : onViewChange(id)}
              className={`tactile relative w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                isActive
                  ? 'bg-primary/10 text-textPrimary'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-subtle'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium leading-relaxed flex-1">{label}</span>
              {id === 'feed' && feedUnread > 0 && (
                <span className="flex-shrink-0 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {feedUnread}
                </span>
              )}
              {id === 'dossiers' && dossierCount > 0 && (
                <span className="flex-shrink-0 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {dossierCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Watchlist section */}
      <div className="px-3 pb-2">
        {/* Section header */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-textTertiary">
            Watchlist
          </span>
          {targets.length > 0 && (
            <span className="text-[11px] font-semibold text-textTertiary">{targets.length}</span>
          )}
        </div>

        {/* Watched-target list */}
        <div className="space-y-0.5">
          {targets.map((t) => (
            <button
              key={t}
              onClick={() => onOpenFeedForTarget ? onOpenFeedForTarget(t) : onViewChange('feed')}
              className="tactile w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-subtle transition-colors duration-150"
            >
              <span className="text-xs font-medium truncate leading-relaxed">{t}</span>
              {unread[t] > 0 && (
                <span className="flex-shrink-0 text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {unread[t]} new
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Add-to-watchlist row */}
        <button
          onClick={() => onViewChange('watchlist')}
          className="tactile w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-textSecondary hover:text-textPrimary transition-colors duration-150"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Add to watchlist</span>
        </button>
      </div>

      {/* Engine status pill */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs text-textSecondary font-medium">Engine online</span>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
