import { describe, it, expect } from 'vitest';
import { foldTrace } from './aggregate.js';
import { EMPTY_AGGREGATE } from './sseTypes.js';

describe('foldTrace', () => {
  it('counts events, tracks section RAG, audit flags, and phase', () => {
    const a = foldTrace(EMPTY_AGGREGATE, [
      { type: 'research_read' }, { type: 'research_read' },
      { type: 'section_complete', id: 'clinical', rag: 'amber' },
      { type: 'methodological_critique' },
      { type: 'lead_decompose', specialists: [] },
    ]);
    expect(a.counts.research_read).toBe(2);
    expect(a.sectionsRag.clinical).toBe('amber');
    expect(a.auditFlags).toBe(1);
    expect(a.phase).toBe('specialists');
    expect(a.log.length).toBe(5);
  });

  it('caps the log at 300 and does not mutate prev', () => {
    const many = Array.from({ length: 350 }, () => ({ type: 'evidence_registered' }));
    const a = foldTrace(EMPTY_AGGREGATE, many);
    expect(a.log.length).toBe(300);
    expect(EMPTY_AGGREGATE.log.length).toBe(0);
    expect(a.counts.evidence_registered).toBe(350);
  });

  it('keeps a degraded source visible as a non-terminal trace line', () => {
    const aggregate = foldTrace(EMPTY_AGGREGATE, [
      { type: 'source_unavailable', message: 'seed clinical_trials_search failed' },
      { type: 'lead_decompose', specialists: [] },
    ]);
    expect(aggregate.log[0]).toMatchObject({ role: 'degraded', label: 'source unavailable' });
    expect(aggregate.phase).toBe('specialists');
  });
});
