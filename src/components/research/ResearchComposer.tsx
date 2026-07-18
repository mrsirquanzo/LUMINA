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
        className="composer-shell relative"
      >
        {/* Top-right utility icons */}
        <div className="absolute right-5 top-5 flex items-center gap-2 text-textSecondary">
          <button type="button" aria-label="Expand" className="icon-action h-8 w-8 border-transparent bg-transparent">
            <Maximize2 className="w-[15px] h-[15px]" />
          </button>
          <button type="button" aria-label="Help" className="icon-action h-8 w-8 border-transparent bg-transparent">
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
          rows={5}
          className="t-lead min-h-[176px] w-full resize-none bg-transparent px-5 pb-3 pr-28 pt-5 text-textPrimary outline-none placeholder:text-textSecondary sm:px-6 sm:pt-6"
          autoFocus
        />

        {contextChip && (
          <div className="px-5 pb-3 sm:px-6">
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
        <div className="flex items-center gap-2 border-t border-borderSoft px-5 pb-4 pt-3">
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

          {/* Circular submit */}
          <button
            type="button"
            onClick={handleStart}
            disabled={!canRun}
            aria-label="Run"
            className="quiet-action ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <ArrowRight className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

    </div>
  );
}

export default ResearchComposer;
