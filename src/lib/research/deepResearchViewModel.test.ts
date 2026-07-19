import { describe, expect, it } from 'vitest';
import { foldTrace } from './aggregate';
import { EMPTY_AGGREGATE } from './sseTypes';
import { analysisPlan, briefingReport, buildDemoReplayEvents, reasoningLines } from './deepResearchViewModel';

describe('deep research workbook mapping', () => {
  it('maps live trace progress into reasoning and plan steps', () => {
    const aggregate = foldTrace(EMPTY_AGGREGATE, [
      { type: 'tool_call', tool: 'open_targets_target', args: { symbol: 'TROP2' } },
      { type: 'tool_result', tool: 'open_targets_target', count: 1 },
      { type: 'source_unavailable', message: 'clinical trials source unavailable' },
      { type: 'lead_decompose', specialists: ['biology'] },
      { type: 'research_read', specialist: 'biology', sourceId: 'PMID:1' },
    ]);
    const plan = analysisPlan(aggregate, 'running', 1);

    expect(reasoningLines(aggregate).join(' ')).toContain('degraded coverage');
    expect(plan.steps[0].status).toBe('done');
    expect(plan.steps[1].status).toBe('running');
  });

  it('maps briefing summary and sections into the shared report contract', () => {
    const mapped = briefingReport({
      target: 'TROP2',
      executiveRead: 'Executive summary',
      recommendation: { thesis: 'Watch the target.', verdict: 'watch' },
      sections: [{ id: 'biology', title: 'Target biology', takeaway: 'Strong expression.' }],
    });

    expect(mapped.report.summary).toEqual(['Watch the target.', 'Executive summary']);
    expect(mapped.report.figures).toEqual([]);
    expect(mapped.contentSections).toEqual([
      { id: 'biology', title: 'Target biology', content: 'Strong expression.' },
    ]);
  });

  it('builds a complete cached replay without a live start event', () => {
    const events = buildDemoReplayEvents({
      target: 'TROP2',
      sections: [{ id: 'biology', title: 'Target biology', rag: 'green' }],
      recommendation: { verdict: 'watch' },
    }, 'fallback');

    expect(events.map((event) => event.type)).toEqual([
      'tool_call',
      'tool_result',
      'tool_call',
      'tool_result',
      'lead_decompose',
      'research_read',
      'section_complete',
      'developability_assessment',
      'kol_cluster',
      'recommendation',
    ]);
    expect(events.some((event) => event.type === 'run_started')).toBe(false);
  });
});
