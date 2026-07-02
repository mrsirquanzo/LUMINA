import type { ReactElement } from 'react';
import { useStore } from 'zustand';
import type { createTraceStore } from '../../lib/research/traceStore.js';

interface Props {
  traceStore: ReturnType<typeof createTraceStore> | null;
  status: string;
}

// Inner panel: hooks are unconditional here; only rendered when traceStore is non-null.
function TracePanel({ traceStore }: { traceStore: ReturnType<typeof createTraceStore> }) {
  const phase = useStore(traceStore, (s) => s.agg.phase);
  const counts = useStore(traceStore, (s) => s.agg.counts);
  const sectionsRag = useStore(traceStore, (s) => s.agg.sectionsRag);
  const auditFlags = useStore(traceStore, (s) => s.agg.auditFlags);
  const log = useStore(traceStore, (s) => s.agg.log);

  const ragColor: Record<string, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Phase pill */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold tracking-wide uppercase">
          {phase}
        </span>
        {auditFlags > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            {auditFlags} flag{auditFlags !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* RAG section dots */}
      {Object.keys(sectionsRag).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(sectionsRag).map(([id, rag]) => (
            <div
              key={id}
              title={`${id}: ${rag}`}
              className="flex items-center gap-1.5 text-xs text-textSecondary"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ragColor[rag] ?? 'bg-gray-500'}`} />
              <span className="truncate max-w-[80px]">{id}</span>
            </div>
          ))}
        </div>
      )}

      {/* Counters */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-semibold text-textPrimary tabular-nums">
            {counts['research_read'] ?? 0}
          </p>
          <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-0.5">Papers</p>
        </div>
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-semibold text-textPrimary tabular-nums">
            {counts['evidence_registered'] ?? 0}
          </p>
          <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-0.5">Evidence</p>
        </div>
        <div className="bg-subtle border border-border rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-semibold text-textPrimary tabular-nums">
            {counts['tool_call'] ?? 0}
          </p>
          <p className="text-[10px] text-textSecondary uppercase tracking-wider mt-0.5">Tools</p>
        </div>
      </div>

      {/* Live log - capped at 300 entries by the store */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-textSecondary uppercase tracking-wider mb-1.5">Live log</p>
        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          {log.length === 0 ? (
            <p className="text-xs text-textSecondary italic">Waiting for events...</p>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-textSecondary py-0.5">
                <span className="text-textSecondary flex-shrink-0 font-mono text-[10px] mt-px">{entry.type}</span>
                <span className="text-textSecondary truncate">{entry.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Idle / null state shown when no run is active.
function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
        <span className="text-textSecondary text-xs">-</span>
      </div>
      <p className="text-xs text-textSecondary">No active run</p>
    </div>
  );
}

export default function GlassBoxTrace({ traceStore, status: _status }: Props): ReactElement {
  if (traceStore === null) {
    return <IdleState />;
  }
  return <TracePanel traceStore={traceStore} />;
}
