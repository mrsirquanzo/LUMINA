import type { ReactElement } from 'react';
import { useStore } from 'zustand';
import type { createTraceStore } from '../../lib/research/traceStore.js';

interface Props {
  traceStore: ReturnType<typeof createTraceStore> | null;
  status: string;
}

// Phase pipeline - ordered steps a run progresses through.
const PHASE_STEPS = [
  { key: 'specialists', label: 'Running specialists' },
  { key: 'developability', label: 'Developability assessment' },
  { key: 'mapping labs', label: 'Mapping KOL terrain' },
  { key: 'done', label: 'Synthesis complete' },
] as const;

// Determine step state given the current phase.
function stepState(
  stepKey: string,
  currentPhase: string,
): 'done' | 'current' | 'future' {
  const order = PHASE_STEPS.map((s) => s.key);
  const currentIdx = order.indexOf(currentPhase as typeof order[number]);
  const stepIdx = order.indexOf(stepKey as typeof order[number]);
  if (stepIdx === -1 || currentIdx === -1) {
    // Treat idle (pre-run) as everything future.
    return 'future';
  }
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'current';
  return 'future';
}

function ragDotClass(rag: 'red' | 'amber' | 'green'): string {
  if (rag === 'green') return 'bg-go';
  if (rag === 'amber') return 'bg-watch';
  return 'bg-nogo';
}

// Spinner ring - blue, animates only if reduced-motion is not set.
function SpinnerRing() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-border border-t-primary flex-none motion-safe:animate-spin"
      aria-hidden="true"
    />
  );
}

// Green check circle for done steps.
function CheckCircle() {
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-go flex-none"
      aria-hidden="true"
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

// Hollow slate ring for future steps.
function HollowRing() {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border-2 border-border flex-none"
      aria-hidden="true"
    />
  );
}

// Inner panel: hooks are unconditional here; only rendered when traceStore is non-null.
function TracePanel({ traceStore }: { traceStore: ReturnType<typeof createTraceStore> }) {
  const phase = useStore(traceStore, (s) => s.agg.phase);
  const counts = useStore(traceStore, (s) => s.agg.counts);
  const sectionsRag = useStore(traceStore, (s) => s.agg.sectionsRag);
  const auditFlags = useStore(traceStore, (s) => s.agg.auditFlags);
  const log = useStore(traceStore, (s) => s.agg.log);

  const sectionEntries = Object.entries(sectionsRag);

  return (
    <div className="flex flex-col gap-5">

      {/* Steps - vertical checklist */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-3">
          Progress
        </p>
        <ol className="flex flex-col gap-3">
          {PHASE_STEPS.map((step) => {
            const state = stepState(step.key, phase);
            return (
              <li key={step.key} className="flex items-center gap-2.5">
                {state === 'done' && <CheckCircle />}
                {state === 'current' && <SpinnerRing />}
                {state === 'future' && <HollowRing />}
                <span
                  className={
                    state === 'done'
                      ? 'text-[12.5px] font-medium text-textSecondary'
                      : state === 'current'
                      ? 'text-[12.5px] font-semibold text-textPrimary'
                      : 'text-[12.5px] text-textTertiary'
                  }
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Specialist threads grid - 2-column, gains a RAG dot on section_complete */}
      {sectionEntries.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-2">
            Specialists
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {sectionEntries.map(([id, rag]) => (
              <div key={id} className="flex items-center gap-2 text-[12.5px]">
                <span
                  className={`w-2 h-2 rounded-full flex-none ${ragDotClass(rag)}`}
                  aria-label={rag}
                />
                <span className="text-textSecondary font-medium truncate">{id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="font-mono text-[17px] font-semibold text-textPrimary tabular-nums">
            {counts['research_read'] ?? 0}
          </p>
          <p className="text-[10px] font-semibold tracking-[0.05em] uppercase text-textTertiary mt-0.5">
            Papers
          </p>
        </div>
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="font-mono text-[17px] font-semibold text-textPrimary tabular-nums">
            {counts['evidence_registered'] ?? 0}
          </p>
          <p className="text-[10px] font-semibold tracking-[0.05em] uppercase text-textTertiary mt-0.5">
            Evidence
          </p>
        </div>
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="font-mono text-[17px] font-semibold text-textPrimary tabular-nums">
            {counts['tool_call'] ?? 0}
          </p>
          <p className="text-[10px] font-semibold tracking-[0.05em] uppercase text-textTertiary mt-0.5">
            Tools
          </p>
        </div>
      </div>

      {/* Audit flags - shown if any */}
      {auditFlags > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-watch-tint border border-amber-500/30 text-watch-text text-xs font-semibold self-start">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          {auditFlags} audit flag{auditFlags !== 1 ? 's' : ''}
        </div>
      )}

      {/* Live log - legible and calm, capped at 300 entries by the store */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-1.5">
          Live log
        </p>
        <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {log.length === 0 ? (
            <p className="text-xs text-textTertiary italic">Waiting for events...</p>
          ) : (
            log.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-2 py-px"
              >
                <span className="font-mono text-[10px] text-textTertiary flex-none mt-px w-[90px] truncate">
                  {entry.type}
                </span>
                <span className="text-[11.5px] text-textSecondary truncate">
                  {entry.label}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

// Empty state shown when no run is active.
function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-subtle border border-border flex items-center justify-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-semibold text-textPrimary font-display">
          No active run
        </p>
        <p className="text-[13px] text-textSecondary mt-1 max-w-[32ch] leading-relaxed">
          Ask Sonny a question; the run and its glass-box appear here.
        </p>
      </div>
    </div>
  );
}

export default function GlassBoxTrace({ traceStore, status: _status }: Props): ReactElement {
  if (traceStore === null) {
    return <IdleState />;
  }
  return <TracePanel traceStore={traceStore} />;
}
