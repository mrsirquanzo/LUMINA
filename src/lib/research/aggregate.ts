import type { ResearchTraceEvent, TraceAggregate } from './sseTypes.js';

const PHASE_MAP: Record<string, string> = {
  lead_decompose: 'specialists',
  developability_assessment: 'developability',
  kol_cluster: 'mapping labs',
  recommendation: 'done',
};

const LABEL_MAP: Record<string, string> = {
  research_read: 'read paper',
  evidence_registered: 'registered evidence',
  tool_call: 'tool call',
  methodological_critique: 'audit flag',
  section_complete: 'section done',
  recommendation: 'verdict',
};

function labelFor(type: string): string {
  return LABEL_MAP[type] ?? type;
}

/**
 * Pure reducer - folds a batch of SSE trace events into a new TraceAggregate.
 * Never mutates `prev`.
 */
export function foldTrace(
  prev: TraceAggregate,
  events: ResearchTraceEvent[],
): TraceAggregate {
  let phase = prev.phase;
  let auditFlags = prev.auditFlags;
  const counts: Record<string, number> = { ...prev.counts };
  const sectionsRag: Record<string, 'red' | 'amber' | 'green'> = { ...prev.sectionsRag };
  const log: Array<{ type: string; label: string }> = [...prev.log];

  for (const e of events) {
    // Count every event
    counts[e.type] = (counts[e.type] ?? 0) + 1;

    // Section RAG status
    if (
      e.type === 'section_complete' &&
      typeof e.id === 'string' &&
      (e.rag === 'red' || e.rag === 'amber' || e.rag === 'green')
    ) {
      sectionsRag[e.id] = e.rag;
    }

    // Audit flags
    if (e.type === 'methodological_critique') {
      auditFlags += 1;
    }

    // Phase mapping - last matching event wins
    if (e.type in PHASE_MAP) {
      phase = PHASE_MAP[e.type];
    }

    // Append to log
    log.push({ type: e.type, label: labelFor(e.type) });
  }

  // Cap log to most recent 300 entries
  const cappedLog = log.length > 300 ? log.slice(log.length - 300) : log;

  return { phase, counts, sectionsRag, auditFlags, log: cappedLog };
}
