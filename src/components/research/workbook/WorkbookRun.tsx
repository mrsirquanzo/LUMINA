import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileChartColumn, Microscope, RotateCcw } from 'lucide-react';
import type { WorkbookRun as WorkbookRunData } from '../../../lib/workbook/types';
import { useWorkbookReplay, type WorkbookPhase } from '../../../lib/workbook/replayDriver';
import { AnalysisPlan } from './AnalysisPlan';
import { AssumptionsPanel } from './AssumptionsPanel';
import { ReasoningTrail } from './ReasoningTrail';
import { ResponseRequired } from './ResponseRequired';
import { WorkbookReport } from './WorkbookReport';

interface WorkbookRunProps {
  run: WorkbookRunData;
  onBack: () => void;
}

const PHASE_ORDER: WorkbookPhase[] = ['reasoning', 'assumptions', 'awaiting-input', 'running', 'done'];

function reached(current: WorkbookPhase, target: WorkbookPhase) {
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target);
}

function getReportTitle(capability: string) {
  if (capability === 'combination-screening') return 'Combination drug screening report';
  if (capability === 'flow-cytometry') return 'Flow cytometry report';
  return 'Analysis report';
}

export function WorkbookRun({ run, onBack }: WorkbookRunProps) {
  const replay = useWorkbookReplay(run);
  const defaultSynergyModel = run.clarifications.find((clarification) => clarification.id === 'model')?.default ?? 'Bliss independence';
  const [selectedSynergyModel, setSelectedSynergyModel] = useState(defaultSynergyModel);
  const resetReplay = useCallback(() => {
    setSelectedSynergyModel(defaultSynergyModel);
    replay.reset();
  }, [defaultSynergyModel, replay.reset]);

  const acceptResponse = useCallback((answers: Record<string, string>) => {
    setSelectedSynergyModel(answers.model ?? defaultSynergyModel);
    replay.accept();
  }, [defaultSynergyModel, replay.accept]);

  const context = [run.file.panel, run.file.drugs && `Drugs and targets: ${run.file.drugs}`, run.file.readout && `Readout: ${run.file.readout}`]
    .filter(Boolean)
    .join(' - ');

  useEffect(() => {
    const handleResetDemo = () => resetReplay();
    window.addEventListener('reset-demo', handleResetDemo);
    return () => window.removeEventListener('reset-demo', handleResetDemo);
  }, [resetReplay]);

  return (
    <div className="min-h-full w-full bg-page px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-5 shadow-card sm:px-5 lg:flex-row lg:items-start lg:justify-between lg:px-6 lg:py-6">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border text-textSecondary transition-colors hover:border-slate-300 hover:text-textPrimary active:translate-y-px"
              aria-label="Back to Sonny research home"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-primary">Sonny Workbook</span>
                <span className="rounded-full border border-primary/20 bg-primary/[0.05] px-2 py-0.5 font-mono text-[9px] text-primary">REPLAY</span>
              </div>
              <h1 className="mt-2 max-w-[900px] text-balance font-display text-[27px] font-semibold leading-[1.12] tracking-tight text-textPrimary sm:text-[32px]">
                {run.question ?? run.title}
              </h1>
              <p className="mt-2 max-w-[100ch] text-pretty text-[12px] leading-relaxed text-textSecondary">{context}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetReplay}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-[12px] font-semibold text-textSecondary transition-colors hover:border-slate-300 hover:text-textPrimary active:translate-y-px"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Restart replay
          </button>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
          <main className="min-w-0 space-y-5">
            <ReasoningTrail lines={replay.visibleReasoning} />

            {reached(replay.phase, 'assumptions') && (
              <div className="motion-safe:animate-[slideUp_.35s_cubic-bezier(.16,1,.3,1)]">
                <AssumptionsPanel assumptions={run.assumptions} />
              </div>
            )}

            {reached(replay.phase, 'awaiting-input') && (
              <div className="motion-safe:animate-[slideUp_.35s_cubic-bezier(.16,1,.3,1)]">
                <ResponseRequired
                  clarifications={run.clarifications}
                  accepted={replay.phase === 'running' || replay.phase === 'done'}
                  onAccept={acceptResponse}
                />
              </div>
            )}

            {reached(replay.phase, 'running') && (
              <div className="motion-safe:animate-[slideUp_.35s_cubic-bezier(.16,1,.3,1)]">
                <AnalysisPlan steps={replay.steps} current={replay.current} total={replay.total} />
              </div>
            )}

            {replay.phase === 'done' && (
              <WorkbookReport
                report={run.report}
                title={getReportTitle(run.capability)}
                rankings={run.rankings}
                selectedSynergyModel={selectedSynergyModel}
              />
            )}
          </main>

          <aside className="rounded-2xl border border-border bg-surface p-4 shadow-card lg:sticky lg:top-4" aria-label="Workbook file details">
            <div className="flex items-center gap-2">
              <FileChartColumn className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <p className="font-mono text-[10px] font-semibold tracking-[0.11em] text-textTertiary">FILES</p>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-subtle/60 p-3">
              <p className="break-words text-[12px] font-semibold leading-snug text-textPrimary">{run.file.name}</p>
              <p className="mt-1 font-mono text-[9px] tabular-nums text-textTertiary">
                {run.file.sizeMB.toFixed(2)} MB · {run.file.name.split('.').pop()?.toUpperCase() ?? 'DATA'}
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-textTertiary">
                  <Microscope className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <p className="font-mono text-[9px] tracking-[0.08em]">INSTRUMENT</p>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-textSecondary">{run.file.instrument}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] tracking-[0.08em] text-textTertiary">PANEL</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-textSecondary">{run.file.panel}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
