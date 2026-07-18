import { memo, useEffect, useState } from 'react';
import { Sparkles, Bell, Library, Eye, Plus, Radio, RotateCcw } from 'lucide-react';
import type { ViewState } from '../types';
import { useWatchlistStore } from '../lib/watchlist/store';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useBriefingStore } from '../lib/research/briefingStore';
import { getStoredAgentMode, onAgentModeUpdated, requestAgentMode, type AgentMode } from '../lib/agentMode';

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
  { id: 'research', icon: Sparkles, label: 'Sonny' },
  { id: 'feed',     icon: Bell,     label: 'News Feed' },
  { id: 'dossiers', icon: Library,  label: 'Reports' },
  { id: 'watchlist',icon: Eye,      label: 'Projects' },
];

const Sidebar = memo(function Sidebar({
  currentView,
  onViewChange,
  onOpenFeedForTarget,
}: SidebarProps) {
  const [agentMode, setAgentMode] = useState<AgentMode>(() => getStoredAgentMode());
  const targets = useWatchlistStore((s) => s.targets);
  const unread = useUnreadCounts(targets);
  const briefings = useBriefingStore((s) => s.briefings);
  const dossierCount = Object.keys(briefings).length;
  const feedUnread = targets.reduce((n, t) => n + (unread[t] ?? 0), 0);

  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  const handleResetDemo = () => {
    if (!window.confirm('Reset demo state?\n\nThis will clear generated tiles and reset analysis panels so you can rerun the investor flow cleanly.')) {
      return;
    }
    window.dispatchEvent(new CustomEvent('reset-demo'));
  };

  // Most recent dossiers for the sidebar rail.
  const recentDossiers = Object.entries(briefings)
    .map(([runId, b]) => ({ runId, target: b.target ?? runId, verdict: (b.recommendation?.verdict ?? '').toUpperCase() }))
    .slice(-6)
    .reverse();

  const verdictDot = (v: string) =>
    v === 'GO' ? 'bg-go' : v === 'NO-GO' ? 'bg-nogo' : v === 'WATCH' ? 'bg-watch' : 'bg-textTertiary';

  return (
    <aside
      className="w-[248px] flex-shrink-0 bg-surface border-r border-border flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Wordmark */}
      <div className="px-5 pb-4 pt-5">
        <span className="select-none font-display text-2xl font-semibold tracking-tight text-textPrimary">
          Sonny
        </span>
        <p className="mt-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-textTertiary">Research workspace</p>
      </div>

      {/* Nav items */}
      <nav className="space-y-0.5 px-3 pb-3">
        <p className="px-3 pb-1.5 pt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-textTertiary">Workspace</p>
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              onClick={() => (id === 'feed' && onOpenFeedForTarget) ? onOpenFeedForTarget() : onViewChange(id)}
              className={`tactile relative flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
                isActive
                  ? 'bg-primary/[0.08] text-primary'
                  : 'text-textSecondary hover:bg-subtle hover:text-textPrimary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
              )}
              <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
              <span className="flex-1 text-[13px] font-medium leading-relaxed">{label}</span>
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

      {/* Recent dossiers rail - fills the space, gives quick access */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 custom-scrollbar">
        {recentDossiers.length > 0 && (
          <>
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-textTertiary">
                Recent reports
              </span>
            </div>
            <div className="space-y-0.5">
              {recentDossiers.map(({ runId, target, verdict }) => (
                <button
                  key={runId}
                  onClick={() => onViewChange('dossiers')}
                  className="tactile w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-subtle transition-colors duration-150"
                  title={`${target}${verdict ? ` - ${verdict}` : ''}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-none ${verdictDot(verdict)}`} aria-hidden="true" />
                  <span className="text-xs font-medium truncate leading-relaxed flex-1 text-left">{target}</span>
                  {verdict && (
                    <span className="flex-none font-mono text-[9px] uppercase tracking-[0.08em] text-textTertiary">{verdict}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Projects section */}
      <div className="px-3 pb-2 border-t border-border pt-2">
        {/* Section header */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-textTertiary">
            Projects
          </span>
          {targets.length > 0 && (
            <span className="text-[11px] font-semibold text-textTertiary">{targets.length}</span>
          )}
        </div>

        {/* Project list */}
        <div className="space-y-0.5">
          {targets.map((t) => (
            <button
              key={t}
              onClick={() => onOpenFeedForTarget ? onOpenFeedForTarget(t) : onViewChange('feed')}
              className="tactile flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-textSecondary transition-colors duration-150 hover:bg-subtle hover:text-textPrimary"
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

        {/* New project row */}
        <button
          onClick={() => onViewChange('watchlist')}
          className="tactile flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-textSecondary transition-colors duration-150 hover:bg-subtle hover:text-textPrimary"
        >
          <Plus className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-[13px] font-medium">New project</span>
        </button>
      </div>

      {/* Mode controls and engine status */}
      <div className="border-t border-border px-4 pb-4 pt-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-textTertiary">
            Agent mode
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="text-[11px] font-medium text-textSecondary">Engine online</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-subtle p-1">
          <button
            type="button"
            onClick={() => requestAgentMode('demo')}
            className={`tactile rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              agentMode === 'demo'
                ? 'bg-surface text-textPrimary shadow-sm'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
            aria-label="Use demo mode (no API calls)"
            aria-pressed={agentMode === 'demo'}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => requestAgentMode('live')}
            className={`tactile flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              agentMode === 'live'
                ? 'bg-success/15 text-success'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
            aria-label="Use live mode (real agent APIs)"
            aria-pressed={agentMode === 'live'}
          >
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            Live
          </button>
        </div>

        {agentMode === 'demo' && (
          <button
            type="button"
            onClick={handleResetDemo}
            className="tactile mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:bg-subtle hover:text-textPrimary"
            title="Reset demo (clear analysis state)"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Demo
          </button>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
