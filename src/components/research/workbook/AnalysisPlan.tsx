import { useRef, useState } from 'react';
import { Check, ChevronDown, Circle, LoaderCircle, Maximize2, RefreshCw, X } from 'lucide-react';
import type { RuntimePlanStep } from '../../../lib/workbook/replayDriver';
import { CorrelationHeatmap } from './gating/CorrelationHeatmap';
import { GatePlot } from './gating/GatePlot';
import { SubsetComposition } from './gating/SubsetComposition';

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

  // Remaining static step figures open in a lightbox, matching the Figures
  // grid in the report - live gating outputs don't need it.
  const [activeFigure, setActiveFigure] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openFigure = (src: string) => {
    setActiveFigure(src);
    window.requestAnimationFrame(() => dialogRef.current?.showModal());
  };
  const closeFigure = () => {
    dialogRef.current?.close();
    setActiveFigure(null);
  };

  return (
    <section className="surface-card overflow-hidden" aria-labelledby="analysis-plan-title">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-5">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <h2 id="analysis-plan-title" className="t-h3 text-textPrimary">Analysis plan</h2>
        </div>
        <span className="t-meta font-mono tabular-nums text-textTertiary">{current}/{total} steps</span>
      </header>

      <div className="divide-y divide-borderSoft">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const hasOutput = step.figures.length > 0 || step.interactive;
          const showFigures = Boolean(hasOutput && (step.status === 'done' || expanded.has(step.id)));
          return (
            <article key={step.id} className={isRunning ? 'border-l-2 border-primary bg-primary/[0.045]' : 'border-l-2 border-transparent bg-white'}>
              <button
                type="button"
                onClick={() => toggle(step.id)}
                className="quiet-action flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-primary/[0.025]"
                aria-expanded={showFigures}
              >
                <span className={isRunning ? 'text-primary' : ''}><StatusGlyph status={step.status} /></span>
                <span className={`t-body-sm min-w-0 flex-1 font-medium ${isRunning ? 'text-primary' : 'text-textPrimary'}`}>
                  {step.title}
                </span>
                {isRunning && <span className="t-eyebrow hidden text-primary sm:inline">Running</span>}
                {hasOutput && (
                  <ChevronDown
                    className={`h-4 w-4 flex-none transition-transform ${showFigures ? 'rotate-180' : ''} ${isRunning ? 'text-primary' : 'text-textTertiary'}`}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                )}
              </button>
              {showFigures && (
                <div className={`grid gap-3 px-3 pb-4 sm:px-5 sm:pl-12 ${!step.interactive && step.figures.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                  {step.interactive ? (
                    <GatePlot stepId={step.id} />
                  ) : step.id === 'heatmap' ? (
                    <CorrelationHeatmap />
                  ) : step.id === 'report' ? (
                    <SubsetComposition />
                  ) : step.figures.map((figure) => (
                      <button
                        key={figure}
                        type="button"
                        onClick={() => openFigure(figure)}
                        aria-label={`Enlarge ${step.title}`}
                        className="group surface-inset relative block w-full max-w-sm cursor-zoom-in overflow-hidden p-0 motion-safe:animate-[fadeIn_.22s_ease-out]"
                      >
                        <img
                          src={figure}
                          alt={`Output for ${step.title}`}
                          className="max-h-44 w-full object-contain p-2"
                        />
                        <span className="absolute right-2 top-2 rounded-md bg-white/85 p-1 text-textTertiary opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(event) => { event.preventDefault(); closeFigure(); }}
        onClick={(event) => { if (event.target === event.currentTarget) closeFigure(); }}
        className="m-auto w-[min(94vw,1100px)] rounded-[14px] border border-border bg-white p-0 text-textPrimary shadow-card-hover backdrop:bg-slate-950/55"
        aria-label="Expanded analysis figure"
      >
        {activeFigure && (
          <div>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="t-eyebrow text-textTertiary">Full figure</p>
              <button type="button" onClick={closeFigure} className="icon-action h-8 w-8 border-transparent bg-transparent" aria-label="Close expanded figure">
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[72dvh] overflow-auto bg-subtle p-3 sm:p-5">
              <img src={activeFigure} alt="Expanded analysis figure" className="mx-auto max-h-[66dvh] w-auto max-w-full rounded-lg border border-border bg-white object-contain" />
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
