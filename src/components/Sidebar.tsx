import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  ChevronRight,
  Plus,
  Radio,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import type { ViewState } from '../types';
import { SonnyLogo } from './SonnyLogo';
import { useWatchlistStore } from '../lib/watchlist/store';
import { useProjectStore, type Project } from '../lib/projects/store';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { getStoredAgentMode, onAgentModeUpdated, requestAgentMode, type AgentMode } from '../lib/agentMode';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (v: ViewState) => void;
  onOpenFeedForTarget?: (target?: string) => void;
  selectedProjectId?: string | null;
  onOpenProject: (projectId: string) => void;
}

interface NavItem {
  id: ViewState;
  icon: typeof Sparkles;
  label: string;
}

interface EmojiOption {
  emoji: string;
  name: string;
}

interface EmojiGroup {
  label: string;
  options: EmojiOption[];
}

const navItems: NavItem[] = [
  { id: 'research', icon: Sparkles, label: 'Sonny' },
  { id: 'feed', icon: Bell, label: 'News Feed' },
];

const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: 'Research',
    options: [
      ['🧬', 'dna'], ['🔬', 'microscope'], ['🧪', 'test tube'], ['🧫', 'petri dish'], ['🦠', 'microbe'],
      ['💊', 'pill'], ['🩺', 'stethoscope'], ['🧠', 'brain'], ['🫀', 'heart organ'], ['🫁', 'lungs'],
      ['🩸', 'blood'], ['⚗️', 'alembic'], ['🥼', 'lab coat'], ['📡', 'signal'], ['🧲', 'magnet'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Documents',
    options: [
      ['📄', 'document'], ['📑', 'bookmarks'], ['📊', 'chart'], ['📈', 'growth chart'], ['📉', 'decline chart'],
      ['🗂️', 'file folders'], ['📁', 'folder'], ['📝', 'memo'], ['📚', 'books'], ['📖', 'open book'],
      ['🔖', 'bookmark'], ['🗒️', 'notepad'], ['📰', 'newspaper'], ['🧾', 'receipt'], ['📋', 'clipboard'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Objects',
    options: [
      ['💡', 'idea'], ['🔍', 'search'], ['🔭', 'telescope'], ['🧭', 'compass'], ['⚙️', 'settings'],
      ['🧰', 'toolbox'], ['🔐', 'lock'], ['🔑', 'key'], ['🎯', 'target'], ['🧩', 'puzzle'],
      ['💎', 'diamond'], ['🔔', 'bell'], ['📌', 'pin'], ['🏷️', 'label'], ['🪄', 'magic wand'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Status',
    options: [
      ['✅', 'complete'], ['☑️', 'checked'], ['⚠️', 'warning'], ['🚨', 'alert'], ['⏳', 'waiting'],
      ['🔄', 'refresh'], ['✨', 'sparkles'], ['⭐', 'star'], ['🔥', 'priority'], ['💥', 'impact'],
      ['🚀', 'launch'], ['💬', 'comment'], ['👀', 'watching'], ['💭', 'thinking'], ['❓', 'question'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Nature',
    options: [
      ['🌱', 'seedling'], ['🌿', 'herb'], ['🍀', 'clover'], ['🌳', 'tree'], ['🌊', 'wave'],
      ['☀️', 'sun'], ['🌙', 'moon'], ['🌍', 'globe'], ['🪐', 'planet'], ['⚡', 'energy'],
      ['❄️', 'snowflake'], ['🌈', 'rainbow'], ['🌸', 'flower'], ['🍄', 'mushroom'], ['🪨', 'rock'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Teams',
    options: [
      ['👤', 'person'], ['👥', 'team'], ['🤝', 'partnership'], ['🏢', 'company'], ['🏥', 'hospital'],
      ['🏛️', 'institution'], ['🎓', 'academic'], ['💼', 'briefcase'], ['🧑‍🔬', 'scientist'], ['🧑‍💻', 'developer'],
      ['🧑‍⚕️', 'clinician'], ['🕵️', 'investigator'], ['👩‍🏫', 'teacher'], ['🧑‍🚀', 'astronaut'], ['🦸', 'hero'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
  {
    label: 'Symbols',
    options: [
      ['🔵', 'blue circle'], ['🟢', 'green circle'], ['🟡', 'yellow circle'], ['🔴', 'red circle'], ['🟣', 'purple circle'],
      ['⬛', 'black square'], ['⬜', 'white square'], ['🔷', 'blue diamond'], ['🔶', 'orange diamond'], ['➕', 'plus'],
      ['➖', 'minus'], ['♻️', 'recycle'], ['♾️', 'infinity'], ['©️', 'copyright'], ['™️', 'trademark'],
    ].map(([emoji, name]) => ({ emoji, name })),
  },
];

function EmojiPicker({
  project,
  anchor,
  onClose,
}: {
  project: Project;
  anchor: DOMRect;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handleViewportChange = () => onClose();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [onClose]);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return EMOJI_GROUPS;
    return EMOJI_GROUPS
      .map((group) => ({ ...group, options: group.options.filter((option) => option.name.includes(needle)) }))
      .filter((group) => group.options.length > 0);
  }, [query]);

  const width = 288;
  const height = 392;
  const left = Math.max(12, Math.min(anchor.right + 8, window.innerWidth - width - 12));
  const top = Math.max(12, Math.min(anchor.top - 10, window.innerHeight - height - 12));

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[60] flex w-72 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_48px_rgba(15,23,42,.16),0_2px_8px_rgba(15,23,42,.08)]"
      style={{ left, top, maxHeight: height }}
      role="dialog"
      aria-label={`Choose an icon for ${project.name}`}
    >
      <div className="border-b border-border p-2.5">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
          className="t-body-sm h-8 w-full rounded-md border border-border bg-subtle px-2.5 text-textPrimary outline-none placeholder:text-textTertiary focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
      </div>
      <div className="custom-scrollbar overflow-y-auto p-2.5">
        {filteredGroups.length > 0 ? filteredGroups.map((group) => (
          <section key={group.label} className="mb-3 last:mb-0" aria-label={group.label}>
            <p className="t-eyebrow mb-1.5 px-1 text-textTertiary">{group.label}</p>
            <div className="grid grid-cols-8 gap-0.5">
              {group.options.map((option) => (
                <button
                  key={`${group.label}-${option.emoji}`}
                  type="button"
                  onClick={() => {
                    useProjectStore.getState().setIcon(project.id, option.emoji);
                    onClose();
                  }}
                  className={`emoji-glyph flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${project.icon === option.emoji ? 'bg-primary/[0.08]' : ''}`}
                  aria-label={option.name}
                  title={option.name}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </section>
        )) : (
          <p className="t-body-sm px-2 py-6 text-center text-textTertiary">No emoji found</p>
        )}
      </div>
    </div>,
    document.body,
  );
}

const Sidebar = memo(function Sidebar({ currentView, onViewChange, onOpenFeedForTarget, selectedProjectId, onOpenProject }: SidebarProps) {
  const [agentMode, setAgentMode] = useState<AgentMode>(() => getStoredAgentMode());
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [picker, setPicker] = useState<{ projectId: string; anchor: DOMRect } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const projects = useProjectStore((state) => state.projects);
  const targets = useWatchlistStore((state) => state.targets);
  const unread = useUnreadCounts(targets);
  const feedUnread = targets.reduce((count, target) => count + (unread[target] ?? 0), 0);
  const activePickerProject = picker ? projects.find((project) => project.id === picker.projectId) : undefined;

  useEffect(() => onAgentModeUpdated(setAgentMode), []);
  useEffect(() => { if (editingId) editInputRef.current?.select(); }, [editingId]);

  const handleResetDemo = () => {
    if (!window.confirm('Reset demo state?\n\nThis will clear generated tiles and reset analysis panels so you can rerun the investor flow cleanly.')) return;
    window.dispatchEvent(new CustomEvent('reset-demo'));
  };

  const startRename = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const commitRename = () => {
    if (editingId && editingName.trim()) useProjectStore.getState().rename(editingId, editingName);
    setEditingId(null);
  };

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitRename();
    }
    if (event.key === 'Escape') setEditingId(null);
  };

  const addProject = () => {
    const existing = new Set(projects.map((project) => project.name.toLowerCase()));
    let index = 1;
    let name = 'Untitled project';
    while (existing.has(name.toLowerCase())) name = `Untitled project ${++index}`;
    useProjectStore.getState().add(name);
    const created = useProjectStore.getState().projects.find((project) => project.name === name);
    if (created) {
      startRename(created);
      onOpenProject(created.id);
    }
    setProjectsOpen(true);
  };

  return (
    <aside className="flex w-[248px] flex-shrink-0 flex-col border-r border-border bg-[#FBFBFA]" aria-label="Main navigation">
      <header className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <SonnyLogo size={30} className="flex-shrink-0" />
        <span className="t-h2 select-none leading-none text-textPrimary">Sonny</span>
      </header>

      <nav className="space-y-0.5 px-2 pb-2" aria-label="Workspace">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => id === 'feed' && onOpenFeedForTarget ? onOpenFeedForTarget() : onViewChange(id)}
              className={`tactile relative flex min-h-[30px] w-full items-center gap-2 rounded-md px-2.5 py-1 text-left transition-colors ${
                isActive ? 'bg-primary/[0.07] text-primary' : 'text-textSecondary hover:bg-[rgba(15,23,42,.05)] hover:text-textPrimary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" aria-hidden="true" />}
              <Icon className="h-4 w-4 flex-none opacity-80" strokeWidth={1.75} aria-hidden="true" />
              <span className="t-body-sm min-w-0 flex-1 truncate font-medium">{label}</span>
              {id === 'feed' && feedUnread > 0 && <span className="t-meta tabular-nums text-primary">{feedUnread}</span>}
            </button>
          );
        })}
      </nav>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <section aria-labelledby="projects-label">
          <button
            type="button"
            onClick={() => setProjectsOpen((open) => !open)}
            className="group flex min-h-[30px] w-full items-center gap-1 rounded-md px-2 py-1 text-left text-textTertiary transition-colors hover:bg-[rgba(15,23,42,.04)] hover:text-textSecondary"
            aria-expanded={projectsOpen}
          >
            <ChevronRight className={`h-3.5 w-3.5 flex-none transition-transform ${projectsOpen ? 'rotate-90' : ''}`} strokeWidth={1.8} aria-hidden="true" />
            <span id="projects-label" className="t-eyebrow flex-1">Projects</span>
            {projects.length > 0 && <span className="t-meta tabular-nums opacity-70">{projects.length}</span>}
          </button>

          {projectsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`group/project relative flex min-h-[30px] items-center gap-1 rounded-md px-1.5 transition-colors ${currentView === 'project' && selectedProjectId === project.id ? 'bg-primary/[0.07] text-primary' : 'text-textSecondary hover:bg-[rgba(15,23,42,.05)] hover:text-textPrimary'}`}
                >
                  {currentView === 'project' && selectedProjectId === project.id && <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={(event) => setPicker({ projectId: project.id, anchor: event.currentTarget.getBoundingClientRect() })}
                    className="emoji-glyph flex h-7 w-7 flex-none items-center justify-center rounded-md transition-colors hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    aria-label={`Change icon for ${project.name}`}
                    title="Change icon"
                  >
                    {project.icon}
                  </button>

                  {editingId === project.id ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleRenameKeyDown}
                      className="t-body-sm h-7 min-w-0 flex-1 rounded border border-primary/30 bg-white px-1.5 text-textPrimary outline-none ring-2 ring-primary/10"
                      aria-label="Project name"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenProject(project.id)}
                      onDoubleClick={() => startRename(project)}
                      className="t-body-sm min-w-0 flex-1 truncate py-1 text-left font-medium"
                      title={`${project.name}. Double-click to rename.`}
                    >
                      {project.name}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => useProjectStore.getState().remove(project.id)}
                    className="hidden h-7 w-7 flex-none items-center justify-center rounded-md text-textTertiary transition-colors hover:bg-black/[0.06] hover:text-textPrimary focus:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 group-hover/project:flex"
                    aria-label={`Remove ${project.name}`}
                    title="Remove project"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addProject}
                className="tactile flex min-h-[30px] w-full items-center gap-2 rounded-md px-2.5 py-1 text-textTertiary transition-colors hover:bg-[rgba(15,23,42,.05)] hover:text-textPrimary"
              >
                <Plus className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
                <span className="t-body-sm font-medium">New project</span>
              </button>
            </div>
          )}
        </section>
      </div>

      <footer className="border-t border-border px-3 pb-3 pt-2.5">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="t-eyebrow text-textTertiary">Agent mode</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="t-meta font-medium text-textSecondary">Engine online</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-subtle p-1">
          <button
            type="button"
            onClick={() => requestAgentMode('demo')}
            className={`tactile t-meta rounded-md px-2.5 py-1.5 font-semibold transition-colors ${agentMode === 'demo' ? 'bg-surface text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
            aria-label="Use demo mode (no API calls)"
            aria-pressed={agentMode === 'demo'}
          >
            Demo
          </button>
          <button
            type="button"
            onClick={() => requestAgentMode('live')}
            className={`tactile t-meta flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition-colors ${agentMode === 'live' ? 'bg-success/15 text-success' : 'text-textSecondary hover:text-textPrimary'}`}
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
            className="tactile t-meta mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-textSecondary transition-colors hover:bg-subtle hover:text-textPrimary"
            title="Reset demo (clear analysis state)"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Demo
          </button>
        )}
      </footer>

      {picker && activePickerProject && (
        <EmojiPicker project={activePickerProject} anchor={picker.anchor} onClose={() => setPicker(null)} />
      )}
    </aside>
  );
});

export default Sidebar;
