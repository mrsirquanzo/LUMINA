import type { TraceEvent, Briefing } from '@mrsirquanzo/sonny-shared';

export type BusEvent =
  | TraceEvent
  | { type: 'done'; briefing: Briefing }
  | { type: 'error'; message: string };

const subscribers = new Map<string, Set<(e: BusEvent) => void>>();

export function publish(runId: string, e: BusEvent): void {
  const fns = subscribers.get(runId);
  if (!fns) return;
  // iterate a copy so unsubscribes during delivery do not corrupt iteration
  for (const fn of [...fns]) {
    fn(e);
  }
}

export function subscribe(runId: string, fn: (e: BusEvent) => void): () => void {
  let fns = subscribers.get(runId);
  if (!fns) {
    fns = new Set();
    subscribers.set(runId, fns);
  }
  fns.add(fn);
  return () => {
    fns!.delete(fn);
  };
}

export function closeRun(runId: string): void {
  subscribers.delete(runId);
}
