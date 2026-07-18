import { BrainCircuit } from 'lucide-react';

interface ReasoningTrailProps {
  lines: string[];
}

export function ReasoningTrail({ lines }: ReasoningTrailProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-card" aria-label="Reasoning trail">
      <div className="mb-3 flex items-center gap-2 text-textTertiary">
        <BrainCircuit className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <p className="font-mono text-[10px] font-semibold tracking-[0.11em]">REASONING TRAIL</p>
      </div>
      <div className="space-y-2.5" aria-live="polite">
        {lines.length === 0 ? (
          <div className="h-5 w-2/3 rounded bg-subtle motion-safe:animate-pulse" aria-label="Reading flow cytometry file" />
        ) : lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className="flex items-start gap-3 motion-safe:animate-[slideUp_.28s_cubic-bezier(.16,1,.3,1)]"
          >
            <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
            <p className="font-mono text-[12px] leading-relaxed text-textSecondary">
              <span className="mr-2 text-textTertiary">{String(index + 1).padStart(2, '0')}</span>
              {line}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
