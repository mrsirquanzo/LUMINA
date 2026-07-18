import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileChartColumn, Microscope, Pin, RotateCcw } from 'lucide-react';
import type { WorkbookRun as WorkbookRunData } from '../../../lib/workbook/types';
import { useWorkbookReplay, type WorkbookPhase } from '../../../lib/workbook/replayDriver';
import { useProjectStore, type ProjectExperiment } from '../../../lib/projects/store';
import { AnalysisPlan } from './AnalysisPlan';
import { AssumptionsPanel } from './AssumptionsPanel';
import { ReasoningTrail } from './ReasoningTrail';
import { ResponseRequired } from './ResponseRequired';
import { WorkbookReport } from './WorkbookReport';
import { GatingProvider } from './gating/GatingContext';
import { useGating } from './gating/gatingStore';

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
  if (capability === 'western-blot') return 'Western blot analysis report';
  return 'Analysis report';
}

function getProjectExperiment(run: WorkbookRunData): ProjectExperiment {
  if (run.capability === 'western-blot') {
    return { id: 'western', label: 'Western blot densitometry', capability: run.capability, scenarioId: 'western-blot' };
  }
  if (run.capability === 'flow-cytometry') {
    return { id: 'flow', label: 'Flow cytometry gating', capability: run.capability, scenarioId: 'flow' };
  }
  if (run.capability === 'combination-screening') {
    return { id: 'combo', label: 'Synergy screen', capability: run.capability, scenarioId: 'combination-screening' };
  }
  return { id: run.id, label: run.title, capability: run.capability, scenarioId: run.id };
}

function WorkbookRunContent({ run, onBack }: WorkbookRunProps) {
  const replay = useWorkbookReplay(run);
  const gating = useGating();
  const { accept, reset } = replay;
  const defaultSynergyModel = run.clarifications.find((clarification) => clarification.id === 'model')?.default ?? 'Bliss independence';
  const [selectedSynergyModel, setSelectedSynergyModel] = useState(defaultSynergyModel);
  const [pinProjectId, setPinProjectId] = useState('');
  const projects = useProjectStore((state) => state.projects);
  const experiment = getProjectExperiment(run);
  const selectedProject = projects.find((project) => project.id === pinProjectId);
  const alreadyPinned = selectedProject?.experiments.some((item) => item.id === experiment.id) ?? false;
  const resetReplay = useCallback(() => {
    setSelectedSynergyModel(defaultSynergyModel);
    gating?.resetGates();
    reset();
  }, [defaultSynergyModel, gating, reset]);

  const acceptResponse = useCallback((answers: Record<string, string>) => {
    setSelectedSynergyModel(answers.model ?? defaultSynergyModel);
    accept();
  }, [accept, defaultSynergyModel]);

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
        <header className="surface-card mb-5 flex flex-col gap-4 px-4 py-5 sm:px-5 lg:flex-row lg:items-start lg:justify-between lg:px-6 lg:py-6">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="icon-action mt-0.5 h-8 w-8 flex-none"
              aria-label="Back to Sonny research home"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="t-eyebrow text-primary">Sonny Workbook</span>
                <span className="t-eyebrow rounded-full border border-primary/20 bg-primary/[0.05] px-2 py-0.5 text-primary">Replay</span>
              </div>
              <h1 className="t-h1 mt-2 max-w-[900px] text-balance text-textPrimary">
                {run.question ?? run.title}
              </h1>
              <p className="t-meta mt-2 max-w-[100ch] text-pretty text-textSecondary">{context}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetReplay}
            className="quiet-action t-meta inline-flex w-fit items-center gap-2 rounded-[10px] border border-border bg-white px-3.5 py-2 font-semibold text-textSecondary hover:border-primary/25 hover:text-primary"
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

          <aside className="surface-card p-4 lg:sticky lg:top-4" aria-label="Workbook file details">
            <div className="flex items-center gap-2">
              <FileChartColumn className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <p className="t-eyebrow text-textTertiary">Files</p>
            </div>
            <div className="surface-inset mt-3 p-3">
              <p className="t-meta break-words font-semibold text-textPrimary">{run.file.name}</p>
              <p className="t-eyebrow mt-1 tabular-nums text-textTertiary">
                {run.file.sizeMB.toFixed(2)} MB · {run.file.name.split('.').pop()?.toUpperCase() ?? 'DATA'}
              </p>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-textTertiary">
                  <Microscope className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <p className="t-eyebrow">Instrument</p>
                </div>
                <p className="t-meta mt-1.5 text-textSecondary">{run.file.instrument}</p>
              </div>
              <div>
                <p className="t-eyebrow text-textTertiary">Panel</p>
                <p className="t-meta mt-1.5 text-textSecondary">{run.file.panel}</p>
              </div>
            </div>
            {replay.phase === 'done' && projects.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-textTertiary">
                  <Pin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  <p className="t-eyebrow">Pin to project</p>
                </div>
                <select
                  value={pinProjectId}
                  onChange={(event) => setPinProjectId(event.target.value)}
                  className="t-meta mt-2.5 h-9 w-full rounded-lg border border-border bg-white px-2.5 text-textSecondary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  aria-label="Project for this experiment"
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <button
                  type="button"
                  disabled={!pinProjectId || alreadyPinned}
                  onClick={() => useProjectStore.getState().pinExperiment(pinProjectId, experiment)}
                  className="quiet-action t-meta mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 font-semibold text-primary disabled:cursor-not-allowed disabled:text-textTertiary disabled:opacity-60"
                >
                  {alreadyPinned ? 'Already pinned' : 'Pin experiment'}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function WorkbookRun(props: WorkbookRunProps) {
  return (
    <GatingProvider url={props.run.gatingData}>
      <WorkbookRunContent {...props} />
    </GatingProvider>
  );
}
