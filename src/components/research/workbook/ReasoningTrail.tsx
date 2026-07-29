import { useEffect, useRef } from 'react';
import { BrainCircuit } from 'lucide-react';

interface ReasoningTrailProps {
  lines: string[];
  /** True while the run is still producing steps; drives the follow-the-tail scroll. */
  live?: boolean;
  /** True when earlier steps have aged out of the trace log's 300-entry cap. */
  trimmed?: boolean;
}

export function ReasoningTrail({ lines, live = false, trimmed = false }: ReasoningTrailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Follow the tail during a live run. Without this the trail sits on step 01
  // while the agent is on step 400, which is the opposite of watching it work.
  useEffect(() => {
    if (!live) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines.length, live]);

  return (
    <section className="surface-card px-5 py-5" aria-label="Reasoning trail">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-textTertiary">
          <BrainCircuit className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <p className="t-eyebrow">Reasoning trail</p>
        </div>
        {/* State the count. The trail used to render a rolling window of the
            last twelve steps numbered 01-12, which read as the whole run
            rather than its tail. */}
        {lines.length > 0 && (
          <p className="t-meta font-mono tabular-nums text-textTertiary">
            {trimmed ? 'most recent ' : ''}
            {lines.length} step{lines.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
      <div
        ref={scrollRef}
        className="max-h-[420px] space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
        aria-live="polite"
        aria-atomic="false"
      >
        {lines.length === 0 ? (
          <div className="h-5 w-2/3 rounded bg-subtle motion-safe:animate-pulse" aria-label="Waiting for the first reasoning step" />
        ) : lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className="flex items-start gap-3 motion-safe:animate-[slideUp_.32s_cubic-bezier(.16,1,.3,1)]"
          >
            <span
              className="t-eyebrow mt-0.5 flex h-5 min-w-5 flex-none items-center justify-center rounded-md border border-primary/20 bg-primary/[0.05] px-1 tabular-nums text-primary"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="t-meta font-mono text-textSecondary">
              {line}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
