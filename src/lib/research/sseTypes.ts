import type { FigureSpec } from '../../../shared/figures.js';

// A permissive view of the engine TraceEvent union; we key off `type` and known fields.
export type ResearchTraceEvent = { type: string; [k: string]: unknown };

// A rendered trace log line. `role` groups the visual treatment (tool card vs
// read/thought vs evidence); `detail` is the human-readable specifics pulled
// from the raw event (tool args, evidence title, source locator).
//
// A `figure` entry holds no content of its own - it marks the position in the
// trail where a figure was produced, and `figureId` resolves it out of
// `TraceAggregate.figures`. Keeping the figure body out of the log means a
// re-emit updates one record instead of leaving a stale copy behind.
export interface TraceLogEntry {
  type: string;
  label: string;
  detail?: string;
  role?: 'tool' | 'tool_result' | 'read' | 'evidence' | 'section' | 'audit' | 'verdict' | 'degraded' | 'figure' | 'event';
  figureId?: string;
}

export interface TraceAggregate {
  phase: string;
  counts: Record<string, number>;
  sectionsRag: Record<string, 'red' | 'amber' | 'green'>;
  auditFlags: number;
  log: TraceLogEntry[];
  /** Figures produced during the run, keyed by their stable id. */
  figures: Record<string, FigureSpec>;
}

// Frozen at the top level; foldTrace always copies (spreads) before writing, so the
// nested empties are never mutated. Avoids the `readonly never[]` cast that breaks tsc -b.
export const EMPTY_AGGREGATE: TraceAggregate = Object.freeze({
  phase: 'idle',
  counts: {} as Record<string, number>,
  sectionsRag: {} as Record<string, 'red' | 'amber' | 'green'>,
  auditFlags: 0,
  log: [] as TraceLogEntry[],
  figures: {} as Record<string, FigureSpec>,
});

export interface BriefingView {
  target?: string;
  /**
   * Figures produced during the run, attached to the briefing when it
   * completes.
   *
   * Riding on the briefing rather than a parallel channel is what makes them
   * durable for free: the briefing is what gets persisted server-side, what
   * `GET /:runId` returns, and what the client keeps in localStorage. A figure
   * you saw during the run is therefore still in the report when you reopen it
   * tomorrow.
   */
  figures?: FigureSpec[];
  recommendation?: {
    verdict?: string;
    thesis?: string;
    bull?: Array<{ point?: string; citations?: string[] }>;
    bear?: Array<{ point?: string; citations?: string[] }>;
    conditions?: string[];
  };
  executiveRead?: string;
  sections?: Array<{ id?: string; title?: string; takeaway?: string; rag?: 'red' | 'amber' | 'green'; claims?: Array<{ text?: string; citations?: string[] }> }>;
  references?: Array<{ id?: string; kind?: string; source?: string; title?: string; url?: string; snippet?: string; raw?: unknown }>;
  kolCluster?: { labs?: Array<{ investigator?: string; institution?: string; paperCount?: number }> };
}
