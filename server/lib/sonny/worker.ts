import type { TraceEvent, Briefing } from '@mrsirquanzo/sonny-shared';
import { buildEngineDeps, type EngineDeps, type Backend } from './engineDeps.js';
import type { UploadedDocument } from './documentTool.js';
import { installUsageSniffer, type RunMeta } from './runCost.js';

export type WorkerMessage =
  | { kind: 'trace'; event: TraceEvent }
  | { kind: 'done'; briefing: Briefing; runMeta?: RunMeta }
  | { kind: 'error'; message: string };

export interface WorkerOpts {
  runId: string;
  target: string;
  mode: 'fast' | 'thorough';
  backend: Backend;
  documents?: UploadedDocument[];
}

// Injectable engine boundary (defaults to the real engine when omitted).
export interface EngineInjection {
  produceBriefing: (opts: { target: string; emit: (e: TraceEvent) => void } & EngineDeps) => Promise<Briefing>;
  buildEngineDeps: (backend: Backend, mode: 'fast' | 'thorough', documents?: UploadedDocument[]) => Promise<EngineDeps>;
}

export async function runInWorker(
  post: (m: WorkerMessage) => void,
  opts: WorkerOpts,
  engine?: EngineInjection,
): Promise<void> {
  try {
    const produceBriefing = engine?.produceBriefing
      ?? (await import('@mrsirquanzo/sonny-core')).produceBriefing;
    const build = engine?.buildEngineDeps ?? buildEngineDeps;
    const deps = await build(opts.backend, opts.mode, opts.documents);
    const sniffer = installUsageSniffer();
    const startedAt = Date.now();
    let briefing: Briefing;
    try {
      briefing = await produceBriefing({
        target: opts.target, ...deps,
        emit: (event) => post({ kind: 'trace', event }),
      });
    } finally {
      sniffer.restore();
    }
    const runMeta: RunMeta = { backend: opts.backend, elapsedMs: Date.now() - startedAt, ...(await sniffer.summary(opts.backend)) };
    post({ kind: 'done', briefing, runMeta });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
}

// Bottom-of-file worker wiring: runs ONLY inside a real worker thread, never on import in tests.
import { parentPort, workerData, isMainThread } from 'worker_threads';
if (!isMainThread && parentPort) {
  const port = parentPort;
  void runInWorker((m) => port.postMessage(m), workerData as WorkerOpts);
}
