import { useEffect, useRef, useState } from 'react';
import { Plus, AtSign, ArrowRight, X, FolderOpen, ChevronsUpDown } from 'lucide-react';
import type { ResearchTemplate } from './CapabilityCards';
import { useProjectStore } from '../../lib/projects/store';
import {
  hasUnresolvedTargetPlaceholder,
  resolveRunTarget,
  shouldClearRunTarget,
  TARGET_PLACEHOLDER,
} from './researchTemplateState';

interface ResearchComposerProps {
  onStart: (target: string, mode: 'fast' | 'thorough') => void;
  initialQuery?: string;
  seed?: ResearchTemplate;
  onOpenProject?: (projectId: string) => void;
}

export function ResearchComposer({ onStart, initialQuery, seed, onOpenProject }: ResearchComposerProps) {
  const projects = useProjectStore((state) => state.projects);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const activeSeed = initialQuery ? undefined : seed;
  const [prompt, setPrompt] = useState(initialQuery ?? activeSeed?.prompt ?? '');
  const [runTarget, setRunTarget] = useState(activeSeed?.target);
  const [seededPrompt, setSeededPrompt] = useState(activeSeed?.prompt);
  const [contextChip, setContextChip] = useState(activeSeed?.contextChip);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canRun = prompt.trim().length > 0 && !hasUnresolvedTargetPlaceholder(prompt);

  useEffect(() => {
    const placeholderStart = prompt.indexOf(TARGET_PLACEHOLDER);
    if (placeholderStart === -1 || !activeSeed) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(placeholderStart, placeholderStart + TARGET_PLACEHOLDER.length);
  }, [activeSeed, prompt]);

  const handleStart = () => {
    const trimmed = prompt.trim();
    if (!trimmed || hasUnresolvedTargetPlaceholder(prompt)) return;
    onStart(resolveRunTarget(prompt, runTarget), 'fast');
  };

  const handlePromptChange = (nextPrompt: string) => {
    setPrompt(nextPrompt);
    if (shouldClearRunTarget(nextPrompt, seededPrompt)) {
      setRunTarget(undefined);
      setSeededPrompt(undefined);
      if (runTarget) setContextChip(undefined);
    }
  };

  // Close the project quick-nav menu on outside click.
  useEffect(() => {
    if (!projectMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!projectMenuRef.current?.contains(event.target as Node)) setProjectMenuOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [projectMenuOpen]);

  // Enter submits; Shift+Enter inserts a newline.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="w-full">
      <div className="composer-shell relative">
        {/* Prompt textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Sonny to research a target, screen drug combinations, or analyze data..."
          rows={4}
          className="command-center-input min-h-[128px] w-full resize-none bg-transparent px-6 pb-3 pt-6 text-textPrimary outline-none placeholder:text-textSecondary sm:min-h-[140px] sm:px-7 sm:pt-7"
          autoFocus
        />

        {contextChip && (
          <div className="px-6 pb-3 sm:px-7">
            <span className="t-eyebrow inline-flex items-center gap-1.5 rounded-md border border-border bg-subtle px-2 py-1 text-textTertiary">
              {contextChip}
              <button
                type="button"
                onClick={() => setContextChip(undefined)}
                aria-label={`Remove ${contextChip} context`}
                className="rounded-sm text-textTertiary transition-colors hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          </div>
        )}

        {/* Bottom control bar */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-1 sm:px-5">
          {/* Upload (coming soon) */}
          <span className="group relative inline-flex">
            <button
              type="button"
              disabled
              aria-label="Upload data (coming soon)"
              className="icon-action h-9 w-9 rounded-full"
            >
              <Plus className="w-[18px] h-[18px]" />
            </button>
            <span className="t-meta pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Upload - coming soon
            </span>
          </span>

          {/* Reference / mention (coming soon) */}
          <span className="group relative inline-flex">
            <button
              type="button"
              disabled
              aria-label="Reference files (coming soon)"
              className="icon-action h-9 w-9 rounded-full"
            >
              <AtSign className="w-[16px] h-[16px]" />
            </button>
            <span className="t-meta pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Reference files - coming soon
            </span>
          </span>

          {/* Project quick-nav: jumps to a project workspace in the sidebar */}
          {projects.length > 0 && onOpenProject && (
            <div ref={projectMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProjectMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={projectMenuOpen}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white pl-3 pr-2.5 text-[13px] font-medium text-textSecondary transition-colors hover:border-primary/25 hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <FolderOpen className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Project
                <ChevronsUpDown className="h-3.5 w-3.5 text-textTertiary" aria-hidden="true" />
              </button>

              {projectMenuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full left-0 z-50 mb-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                >
                  <p className="t-eyebrow px-2.5 pb-1.5 pt-1 text-textTertiary">Go to project</p>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProjectMenuOpen(false);
                        onOpenProject(project.id);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] text-textPrimary transition-colors hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
                    >
                      <span className="text-base leading-none" aria-hidden="true">{project.icon}</span>
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Primary submit - circular arrow */}
          <button
            type="button"
            onClick={handleStart}
            disabled={!canRun}
            aria-label="Ask Sonny"
            className="composer-send ml-auto"
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResearchComposer;
