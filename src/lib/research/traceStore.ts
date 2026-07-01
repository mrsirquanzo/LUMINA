import { createStore } from 'zustand/vanilla';
import type { ResearchTraceEvent, TraceAggregate } from './sseTypes.js';
import { EMPTY_AGGREGATE } from './sseTypes.js';
import { foldTrace } from './aggregate.js';

export interface TraceStoreState {
  agg: TraceAggregate;
  applyBatch(events: ResearchTraceEvent[]): void;
  reset(): void;
}

export function createTraceStore() {
  return createStore<TraceStoreState>((set, get) => ({
    agg: EMPTY_AGGREGATE,
    applyBatch(events: ResearchTraceEvent[]) {
      set({ agg: foldTrace(get().agg, events) });
    },
    reset() {
      set({ agg: EMPTY_AGGREGATE });
    },
  }));
}
