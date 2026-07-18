import { AlertTriangle, ArrowLeft, Database, RotateCcw } from 'lucide-react';
import { useStore } from 'zustand';
import type { RunStatus } from '../../hooks/useDeepResearchStream';
import type { BriefingView } from '../../lib/research/sseTypes';
import type { createTraceStore } from '../../lib/research/traceStore';
import { analysisPlan, briefingReport, reasoningLines } from '../../lib/research/deepResearchViewModel';
import { getStoredAgentMode } from '../../lib/agentMode';
import { AnalysisPlan } from './workbook/AnalysisPlan';
import { ReasoningTrail } from './workbook/ReasoningTrail';
import { WorkbookReport } from './workbook/WorkbookReport';

interface DeepResearchRunProps {
  status: RunStatus;
  runId: string | null;
  traceStore: ReturnType<typeof createTraceStore> | null;
  briefing?: BriefingView;
  error: string | null;
  onBack: () => void;
}

export function DeepResearchRun({ status, runId, traceStore, briefing, error, onBack }: DeepResearchRunProps) {
  const aggregate = useStore(traceStore ?? EMPTY_STORE, (state) => state.agg);
  const plan = analysisPlan(aggregate, status, briefing?.sections?.length ?? 0);
  const mappedReport = briefing ? briefingReport(briefing) : null;
  const target = briefing?.target ?? runId?.split('-')[0] ?? 'Research target';
  const demo = getStoredAgentMode() === 'demo';
  const liveReasoning = reasoningLines(aggregate);
  const visibleReasoning = liveReasoning.length > 0
    ? liveReasoning
    : briefing
      ? [
          `Restored completed research for ${target}.`,
          ...(briefing.sections ?? []).slice(0, 4).map((section) => `Restored ${section.title ?? 'research section'} evidence.`),
        ]
      : [];

  return (
    <div className="min-h-full w-full bg-page px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1040px]">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-4 shadow-card sm:px-5 sm:flex-row sm:items-center sm:justify-between">
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
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-primary">Sonny research</span>
                <span className="rounded-full border border-primary/20 bg-primary/[0.05] px-2 py-0.5 font-mono text-[9px] text-primary">
                  {demo ? 'CACHED REPLAY' : 'LIVE'}
                </span>
              </div>
              <h1 className="mt-1 truncate font-display text-[25px] font-semibold tracking-tight text-textPrimary">{target} deep research</h1>
              <p className="mt-1 text-[11px] text-textTertiary">
                {status === 'done' ? 'Research complete' : 'Reading sources and synthesizing evidence'}
              </p>
            </div>
          </div>
          <div className="flex max-w-full items-center gap-2 overflow-hidden font-mono text-[9px] text-textTertiary sm:max-w-[320px]">
            <Database className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{runId ?? 'Preparing run'}</span>
          </div>
        </header>

        <main className="space-y-5">
          {status === 'error' && error && (
            <div className="flex items-start gap-3 rounded-xl border border-nogo/25 bg-white px-4 py-3.5" role="alert">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-nogo-tint text-nogo">
                <AlertTriangle className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-nogo-text">Report unavailable</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-textSecondary">{error}</p>
              </div>
            </div>
          )}
          <ReasoningTrail lines={visibleReasoning} />
          <AnalysisPlan steps={plan.steps} current={plan.current} total={plan.total} />
          {mappedReport && (
            <WorkbookReport
              report={mappedReport.report}
              title={`${target} report`}
              eyebrow={`${briefing?.recommendation?.verdict?.toUpperCase() ?? 'RESEARCH'} - ANALYSIS COMPLETE`}
              contentSections={mappedReport.contentSections}
            />
          )}
          {status !== 'done' && !briefing && (
            <div className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-card" aria-busy="true" aria-label="Preparing report">
              <div className="h-3 w-24 rounded bg-subtle motion-safe:animate-pulse" />
              <div className="mt-3 h-7 w-2/5 rounded bg-subtle motion-safe:animate-pulse" />
              <div className="mt-5 h-3 w-full rounded bg-subtle motion-safe:animate-pulse" />
              <div className="mt-2 h-3 w-4/5 rounded bg-subtle motion-safe:animate-pulse" />
            </div>
          )}
        </main>

        {status === 'error' && (
          <button type="button" onClick={onBack} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-[12px] font-semibold text-textSecondary">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Start another report
          </button>
        )}
      </div>
    </div>
  );
}

const EMPTY_STORE = {
  getState: () => ({ agg: { phase: 'idle', counts: {}, sectionsRag: {}, auditFlags: 0, log: [] } }),
  getInitialState: () => ({ agg: { phase: 'idle', counts: {}, sectionsRag: {}, auditFlags: 0, log: [] } }),
  subscribe: () => () => undefined,
} as unknown as ReturnType<typeof createTraceStore>;
