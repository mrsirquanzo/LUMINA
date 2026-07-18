import { useState } from 'react';
import { Check, ChevronDown, Circle, LoaderCircle, RefreshCw } from 'lucide-react';
import type { RuntimePlanStep } from '../../../lib/workbook/replayDriver';

interface AnalysisPlanProps {
  steps: RuntimePlanStep[];
  current: number;
  total: number;
}

function StatusGlyph({ status }: { status: RuntimePlanStep['status'] }) {
  if (status === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
        <Check className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
      </span>
    );
  }
  if (status === 'running') {
    return <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" strokeWidth={1.8} aria-hidden="true" />;
  }
  return <Circle className="h-5 w-5 text-textTertiary" strokeWidth={1.5} aria-hidden="true" />;
}

export function AnalysisPlan({ steps, current, total }: AnalysisPlanProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) => {
    setExpanded((currentExpanded) => {
      const next = new Set(currentExpanded);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card" aria-labelledby="analysis-plan-title">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 text-primary motion-safe:animate-[spin_2.4s_linear_infinite]" strokeWidth={1.75} aria-hidden="true" />
          <h2 id="analysis-plan-title" className="text-[14px] font-semibold text-textPrimary">Analysis Plan</h2>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-textTertiary">{current}/{total} steps</span>
      </header>

      <div className="divide-y divide-borderSoft">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const showFigures = step.figures.length > 0 && (step.status === 'done' || expanded.has(step.id));
          return (
            <article key={step.id} className={isRunning ? 'bg-slate-900 text-white' : 'bg-white'}>
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left active:translate-y-px"
                aria-expanded={showFigures}
              >
                <span className={isRunning ? 'text-white' : ''}><StatusGlyph status={step.status} /></span>
                <span className={`min-w-0 flex-1 text-[12.5px] font-medium ${isRunning ? 'text-white' : 'text-textPrimary'}`}>
                  {step.title}
                </span>
                {isRunning && <span className="hidden font-mono text-[9px] tracking-[0.08em] text-slate-300 sm:inline">RUNNING</span>}
                <ChevronDown
                  className={`h-4 w-4 flex-none transition-transform ${showFigures ? 'rotate-180' : ''} ${isRunning ? 'text-slate-300' : 'text-textTertiary'}`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              {showFigures && (
                <div className={`grid gap-3 px-5 pb-4 pl-12 ${step.figures.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                  {step.figures.map((figure) => (
                    <img
                      key={figure}
                      src={figure}
                      alt={`Output for ${step.title}`}
                      className="max-h-44 w-full max-w-sm rounded-lg border border-border bg-white object-contain p-1 motion-safe:animate-[fadeIn_.3s_ease-out]"
                    />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
