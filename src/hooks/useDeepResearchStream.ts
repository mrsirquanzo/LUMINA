import { useState, useRef, useEffect } from 'react';
import { createTraceStore } from '../lib/research/traceStore.js';
import { createTraceBuffer } from '../lib/research/traceBuffer.js';
import { useBriefingStore } from '../lib/research/briefingStore.js';
import { startDeepResearch, fetchBriefing } from '../lib/research/api.js';
import type { ResearchTraceEvent, BriefingView } from '../lib/research/sseTypes.js';
import { createSSEParser } from '../lib/research/sseParse.js';

export type RunStatus = 'idle' | 'hydrating' | 'running' | 'done' | 'error';

export interface UseDeepResearchStream {
  traceStore: ReturnType<typeof createTraceStore> | null;
  status: RunStatus;
  runId: string | null;
  error: string | null;
  start(target: string, mode?: 'fast' | 'thorough'): Promise<void>;
  hydrate(runId: string): Promise<void>;
}

export function useDeepResearchStream(): UseDeepResearchStream {
  const [traceStore, setTraceStore] = useState<ReturnType<typeof createTraceStore> | null>(null);
  const [status, setStatus] = useState<RunStatus>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storeRef = useRef<ReturnType<typeof createTraceStore> | null>(null);
  const bufferRef = useRef<ReturnType<typeof createTraceBuffer<ResearchTraceEvent>> | null>(null);

  useEffect(() => {
    return () => {
      bufferRef.current?.dispose();
    };
  }, []);

  async function start(target: string, mode: 'fast' | 'thorough' = 'thorough'): Promise<void> {
    // Create a fresh trace store for this run
    const store = createTraceStore();
    store.getState().reset();
    storeRef.current = store;
    setTraceStore(store);
    setStatus('running');
    setError(null);
    setRunId(null);

    // Dispose previous buffer if any
    bufferRef.current?.dispose();

    // Create the throttled buffer with rAF + 100ms fallback
    const buffer = createTraceBuffer<ResearchTraceEvent>({
      onFlush: (batch) => store.getState().applyBatch(batch),
      schedule: (cb) => {
        let done = false;
        const run = () => {
          if (done) return;
          done = true;
          cb();
        };
        const id = requestAnimationFrame(run);
        const t = setTimeout(run, 100);
        return () => {
          cancelAnimationFrame(id);
          clearTimeout(t);
        };
      },
    });
    bufferRef.current = buffer;

    let currentRunId: string | null = null;
    let currentStatus: RunStatus = 'running';

    try {
      const res = await startDeepResearch(target, mode);
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      const parser = createSSEParser();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const events = parser.push(decoder.decode(value, { stream: true }));

        for (const event of events as ResearchTraceEvent[]) {
          if (event.type === 'run_started') {
            const rid = event.runId as string | undefined;
            if (rid) {
              currentRunId = rid;
              setRunId(rid);
            }
          } else {
            buffer.push(event);
          }

          if (event.type === 'done') {
            buffer.flush();
            if (currentRunId && event.briefing) {
              useBriefingStore.getState().setBriefing(currentRunId, event.briefing as BriefingView);
            }
            currentStatus = 'done';
            setStatus('done');
          } else if (event.type === 'error') {
            buffer.flush();
            const msg = (event.message as string | undefined) ?? 'Unknown error';
            currentStatus = 'error';
            setStatus('error');
            setError(msg);
          }
        }
      }

      // Stream ended - if still running, flush and mark done
      if (currentStatus === 'running') {
        buffer.flush();
        setStatus('done');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setError(msg);
    }
  }

  async function hydrate(rid: string): Promise<void> {
    setStatus('hydrating');
    try {
      const b = await fetchBriefing(rid);
      if (b) {
        useBriefingStore.getState().setBriefing(rid, b);
        setRunId(rid);
        setStatus('done');
      } else {
        setStatus('idle');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setError(msg);
    }
  }

  return { traceStore, status, runId, error, start, hydrate };
}
