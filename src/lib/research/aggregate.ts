import type { ResearchTraceEvent, TraceAggregate, TraceLogEntry } from './sseTypes.js';

const PHASE_MAP: Record<string, string> = {
  lead_decompose: 'specialists',
  developability_assessment: 'developability',
  kol_cluster: 'mapping labs',
  recommendation: 'done',
};

const LABEL_MAP: Record<string, string> = {
  research_read: 'reading',
  evidence_registered: 'evidence',
  tool_call: 'tool call',
  tool_result: 'tool result',
  methodological_critique: 'audit flag',
  section_complete: 'section done',
  recommendation: 'verdict',
  source_unavailable: 'source unavailable',
};

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

// Turn "{'symbol': 'TROP2'}" style args into "symbol: TROP2".
function prettyArgs(v: unknown): string | undefined {
  const s = str(v) ?? (v && typeof v === 'object' ? JSON.stringify(v) : undefined);
  if (!s) return undefined;
  return s.replace(/[{}"']/g, '').replace(/\s*:\s*/g, ': ').replace(/\s*,\s*/g, ', ').trim() || undefined;
}

// Derive the rich, human-readable line for one raw event.
function describe(e: ResearchTraceEvent): TraceLogEntry {
  const type = e.type;
  switch (type) {
    case 'tool_call':
      return { type, role: 'tool', label: str(e.tool) ?? 'tool call', detail: prettyArgs(e.args) };
    case 'tool_result': {
      const count = typeof e.count === 'number' || typeof e.count === 'string' ? String(e.count) : undefined;
      return { type, role: 'tool_result', label: str(e.tool) ?? 'tool result', detail: count ? `${count} results` : undefined };
    }
    case 'evidence_registered':
      return { type, role: 'evidence', label: 'evidence', detail: str(e.title) ?? str(e.id) };
    case 'query_parsed': {
      const scope = [
        str(e.target) ? `target ${str(e.target)}` : undefined,
        str(e.indication) ? `indication ${str(e.indication)}` : undefined,
        str(e.modality) ? `modality ${str(e.modality)}` : undefined,
      ].filter(Boolean).join(' · ');
      return { type, role: 'read', label: 'understood request', detail: scope || undefined };
    }
    case 'research_read': {
      const src = [str(e.sourceId), str(e.locator)].filter(Boolean).join(' · ');
      return { type, role: 'read', label: str(e.specialist) ? `${str(e.specialist)} reading` : 'reading', detail: src || undefined };
    }
    case 'section_complete':
      return { type, role: 'section', label: 'section done', detail: [str(e.id), str(e.rag)?.toUpperCase()].filter(Boolean).join(' · ') || undefined };
    case 'methodological_critique':
      return { type, role: 'audit', label: 'audit flag', detail: str(e.note) ?? str(e.message) };
    case 'source_unavailable':
      return { type, role: 'degraded', label: 'source unavailable', detail: str(e.message) };
    case 'recommendation':
      return { type, role: 'verdict', label: 'verdict', detail: str(e.verdict)?.toUpperCase() };
    default:
      return { type, role: 'event', label: LABEL_MAP[type] ?? type };
  }
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
  const log: TraceLogEntry[] = [...prev.log];

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

    // Append the rich, described entry to the log
    log.push(describe(e));
  }

  // Cap log to most recent 300 entries
  const cappedLog = log.length > 300 ? log.slice(log.length - 300) : log;

  return { phase, counts, sectionsRag, auditFlags, log: cappedLog };
}
