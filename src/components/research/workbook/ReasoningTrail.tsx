import { BrainCircuit } from 'lucide-react';

interface ReasoningTrailProps {
  lines: string[];
}

export function ReasoningTrail({ lines }: ReasoningTrailProps) {
  return (
    <section className="surface-card px-5 py-5" aria-label="Reasoning trail">
      <div className="mb-4 flex items-center gap-2 text-textTertiary">
        <BrainCircuit className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
        <p className="t-eyebrow">Reasoning trail</p>
      </div>
      <div className="space-y-3" aria-live="polite" aria-atomic="false">
        {lines.length === 0 ? (
          <div className="h-5 w-2/3 rounded bg-subtle motion-safe:animate-pulse" aria-label="Reading flow cytometry file" />
        ) : lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className="flex items-start gap-3 motion-safe:animate-[slideUp_.32s_cubic-bezier(.16,1,.3,1)]"
          >
            <span className="t-eyebrow mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-primary/20 bg-primary/[0.05] tabular-nums text-primary" aria-hidden="true">
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
