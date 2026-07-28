import { describe, it, expect } from 'vitest';
import { foldTrace } from './aggregate.js';
import { EMPTY_AGGREGATE } from './sseTypes.js';
import type { ResearchTraceEvent } from './sseTypes.js';

function figureEvent(overrides: Record<string, unknown> = {}): ResearchTraceEvent {
  return {
    type: 'figure',
    figure: {
      plot: 'tissue_expression_bar',
      id: 'gtex:TACSTD2',
      title: 'TACSTD2 expression across normal tissues',
      params: { gene: 'TACSTD2' },
      unit: 'median TPM',
      bars: [{ label: 'Esophagus Mucosa', value: 1828.16 }],
      stats: [{ label: 'tissues', value: '54' }],
      source: {
        label: 'GTEx v8',
        url: 'https://gtexportal.org/home/gene/TACSTD2',
        retrievedAt: '2026-07-28T18:00:00.000Z',
      },
      ...overrides,
    },
  };
}

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

describe('foldTrace figures', () => {
  it('stores the figure and drops a marker into the log where it happened', () => {
    const aggregate = foldTrace(EMPTY_AGGREGATE, [
      { type: 'tool_call', tool: 'gtex_expression' },
      figureEvent(),
    ]);

    expect(Object.keys(aggregate.figures)).toEqual(['gtex:TACSTD2']);
    expect(aggregate.log).toHaveLength(2);
    expect(aggregate.log[1]).toMatchObject({
      type: 'figure',
      role: 'figure',
      figureId: 'gtex:TACSTD2',
      label: 'TACSTD2 expression across normal tissues',
    });
  });

  it('replaces a re-emitted figure in place without appending a second marker', () => {
    const first = foldTrace(EMPTY_AGGREGATE, [figureEvent()]);
    const second = foldTrace(first, [
      figureEvent({ bars: [{ label: 'Esophagus Mucosa', value: 1900 }] }),
    ]);

    expect(second.log.filter((entry) => entry.role === 'figure')).toHaveLength(1);
    const updated = second.figures['gtex:TACSTD2'];
    if (updated.plot !== 'tissue_expression_bar') throw new Error('wrong variant');
    expect(updated.bars[0].value).toBe(1900);
  });

  it('keeps distinct figure ids as separate entries', () => {
    const aggregate = foldTrace(EMPTY_AGGREGATE, [
      figureEvent(),
      figureEvent({ id: 'gtex:ERBB2', title: 'ERBB2 expression across normal tissues' }),
    ]);
    expect(Object.keys(aggregate.figures)).toHaveLength(2);
    expect(aggregate.log.filter((entry) => entry.role === 'figure')).toHaveLength(2);
  });

  it('drops a malformed figure whole rather than logging an unrenderable marker', () => {
    const aggregate = foldTrace(EMPTY_AGGREGATE, [figureEvent({ source: undefined })]);
    expect(aggregate.figures).toEqual({});
    expect(aggregate.log).toHaveLength(0);
    // Still counted - the event arrived, it just was not renderable.
    expect(aggregate.counts.figure).toBe(1);
  });

  it('prunes figure bodies whose marker fell off the end of the capped log', () => {
    const withFigure = foldTrace(EMPTY_AGGREGATE, [figureEvent()]);
    expect(withFigure.figures['gtex:TACSTD2']).toBeDefined();

    const noise: ResearchTraceEvent[] = Array.from({ length: 320 }, () => ({
      type: 'research_read',
    }));
    const capped = foldTrace(withFigure, noise);

    expect(capped.log).toHaveLength(300);
    expect(capped.log.some((entry) => entry.role === 'figure')).toBe(false);
    expect(capped.figures).toEqual({});
  });

  it('does not mutate the previous aggregate', () => {
    const first = foldTrace(EMPTY_AGGREGATE, [figureEvent()]);
    foldTrace(first, [figureEvent({ id: 'gtex:ERBB2' })]);
    expect(Object.keys(first.figures)).toEqual(['gtex:TACSTD2']);
    expect(EMPTY_AGGREGATE.figures).toEqual({});
  });
});
