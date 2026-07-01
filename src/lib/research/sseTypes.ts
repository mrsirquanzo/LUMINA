// A permissive view of the engine TraceEvent union; we key off `type` and known fields.
export type ResearchTraceEvent = { type: string; [k: string]: unknown };

export interface TraceAggregate {
  phase: string;
  counts: Record<string, number>;
  sectionsRag: Record<string, 'red' | 'amber' | 'green'>;
  auditFlags: number;
  log: Array<{ type: string; label: string }>;
}

// Frozen at the top level; foldTrace always copies (spreads) before writing, so the
// nested empties are never mutated. Avoids the `readonly never[]` cast that breaks tsc -b.
export const EMPTY_AGGREGATE: TraceAggregate = Object.freeze({
  phase: 'idle',
  counts: {} as Record<string, number>,
  sectionsRag: {} as Record<string, 'red' | 'amber' | 'green'>,
  auditFlags: 0,
  log: [] as Array<{ type: string; label: string }>,
});

export interface BriefingView {
  target?: string;
  recommendation?: {
    verdict?: string;
    thesis?: string;
    bull?: Array<{ point?: string; citations?: string[] }>;
    bear?: Array<{ point?: string; citations?: string[] }>;
    conditions?: string[];
  };
  executiveRead?: string;
  sections?: Array<{ id?: string; title?: string; takeaway?: string; rag?: 'red' | 'amber' | 'green'; claims?: Array<{ text?: string; citations?: string[] }> }>;
  references?: Array<{ id?: string; title?: string; url?: string }>;
  kolCluster?: { labs?: Array<{ investigator?: string; institution?: string; paperCount?: number }> };
}
