import { useEffect, useRef, useState } from 'react';
import { Plus, AtSign, Maximize2, HelpCircle, ArrowRight, X } from 'lucide-react';
import type { ResearchTemplate } from './CapabilityCards';
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
}

export function ResearchComposer({ onStart, initialQuery, seed }: ResearchComposerProps) {
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

  // Enter submits; Shift+Enter inserts a newline.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="w-full">
      {/* Composer shell - tall, calm, Science-Machine-style */}
      <div
        className="relative bg-surface border border-border rounded-[16px] transition-all duration-200 focus-within:border-primary/50"
        style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.05)' }}
      >
        {/* Top-right utility icons */}
        <div className="absolute top-3.5 right-4 flex items-center gap-3 text-textTertiary">
          <button type="button" aria-label="Expand" className="hover:text-textSecondary transition-colors">
            <Maximize2 className="w-[15px] h-[15px]" />
          </button>
          <button type="button" aria-label="Help" className="hover:text-textSecondary transition-colors">
            <HelpCircle className="w-[16px] h-[16px]" />
          </button>
        </div>

        {/* Prompt textarea */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Sonny to research a target, map a landscape, or analyze data..."
          rows={3}
          className="w-full bg-transparent text-textPrimary placeholder:text-textTertiary outline-none resize-none px-5 pt-[18px] pb-2"
          style={{ font: '400 16px var(--font-sans, Geist, sans-serif)', minHeight: 132, lineHeight: 1.5 }}
          autoFocus
        />

        {contextChip && (
          <div className="px-5 pb-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-subtle px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-textTertiary">
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
        <div className="flex items-center gap-2 px-4 pb-3.5 pt-1">
          {/* Upload (coming soon) */}
          <span className="group relative inline-flex">
            <button
              type="button"
              disabled
              aria-label="Upload data (coming soon)"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-textSecondary cursor-not-allowed opacity-70"
            >
              <Plus className="w-[18px] h-[18px]" />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-ink text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Upload - coming soon
            </span>
          </span>

          {/* Reference / mention (coming soon) */}
          <span className="group relative inline-flex">
            <button
              type="button"
              disabled
              aria-label="Reference files (coming soon)"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-textSecondary cursor-not-allowed opacity-70"
            >
              <AtSign className="w-[16px] h-[16px]" />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-ink text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Reference files - coming soon
            </span>
          </span>

          {/* Circular submit */}
          <button
            type="button"
            onClick={handleStart}
            disabled={!canRun}
            aria-label="Run"
            className="ml-auto w-10 h-10 flex items-center justify-center rounded-full text-white transition-all disabled:cursor-not-allowed"
            style={{
              background: canRun ? 'rgb(29 78 216)' : '#CBD5E1',
              boxShadow: canRun ? '0 1px 3px rgba(29,78,216,.4)' : 'none',
            }}
            onMouseEnter={(e) => { if (canRun) (e.currentTarget as HTMLButtonElement).style.background = 'rgb(30 64 175)'; }}
            onMouseLeave={(e) => { if (canRun) (e.currentTarget as HTMLButtonElement).style.background = 'rgb(29 78 216)'; }}
          >
            <ArrowRight className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default ResearchComposer;
