import { describe, it, expect } from 'vitest';
import { createTraceStore } from './traceStore.js';

describe('createTraceStore', () => {
  it('folds batches into the aggregate and resets', () => {
    const store = createTraceStore();
    store.getState().applyBatch([{ type: 'research_read' }, { type: 'methodological_critique' }]);
    expect(store.getState().agg.counts.research_read).toBe(1);
    expect(store.getState().agg.auditFlags).toBe(1);
    store.getState().reset();
    expect(store.getState().agg.auditFlags).toBe(0);
    expect(store.getState().agg.counts.research_read ?? 0).toBe(0);
  });

  it('makes independent stores per call', () => {
    const a = createTraceStore(); const b = createTraceStore();
    a.getState().applyBatch([{ type: 'tool_call' }]);
    expect(a.getState().agg.counts.tool_call).toBe(1);
    expect(b.getState().agg.counts.tool_call ?? 0).toBe(0);
  });
});
