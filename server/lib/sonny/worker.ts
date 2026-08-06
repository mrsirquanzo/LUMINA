import type { TraceEvent, Briefing } from '@mrsirquanzo/sonny-shared';
import { buildEngineDeps, type EngineDeps, type Backend } from './engineDeps.js';
import type { UploadedDocument } from './documentTool.js';
import { installUsageSniffer, type RunMeta } from './runCost.js';
import { setFigureSink } from './figureSink.js';
import type { FigureSpec } from '../../../shared/figures.js';

export type WorkerMessage =
  | { kind: 'trace'; event: TraceEvent }
  | { kind: 'figure'; figure: FigureSpec }
  | { kind: 'done'; briefing: Briefing; runMeta?: RunMeta }
  | { kind: 'error'; message: string };

export interface WorkerOpts {
  runId: string;
  target: string;
  mode: 'fast' | 'thorough';
  backend: Backend;
  documents?: UploadedDocument[];
  context?: { indication?: string; modality?: string };
}

// Injectable engine boundary (defaults to the real engine when omitted).
export interface EngineInjection {
  produceBriefing: (opts: {
    target: string;
    emit: (e: TraceEvent) => void;
    context?: { indication?: string; modality?: string };
  } & EngineDeps) => Promise<Briefing>;
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
    // Tools emit figures through a module-level sink; route them onto the same
    // message channel the trace uses so they land in the live trail in order.
    setFigureSink((figure) => post({ kind: 'figure', figure }));
    const startedAt = Date.now();
    let briefing: Briefing;
    try {
      briefing = await produceBriefing({
        target: opts.target, ...deps,
        emit: (event) => post({ kind: 'trace', event }),
        ...(opts.context ? { context: opts.context } : {}),
      });
    } finally {
      sniffer.restore();
      setFigureSink(null);
    }
    const runMeta: RunMeta = { backend: opts.backend, elapsedMs: Date.now() - startedAt, ...(await sniffer.summary(opts.backend)) };
    post({ kind: 'done', briefing, runMeta });
  } catch (err) {
    post({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
}

function describeReason(reason: unknown): string {
  if (reason instanceof Error) return reason.stack ?? reason.message;
  return typeof reason === 'string' ? reason : JSON.stringify(reason);
}

/**
 * Wrap `post` so the worker cannot terminate without telling the parent why.
 *
 * `runInWorker` already try/catches its own body, but that only covers failures
 * that actually reject. Three do not:
 *
 * - `beforeExit`: the event loop drained while `produceBriefing` was still
 *   awaited, i.e. a promise that can never settle with no timer or socket left
 *   holding the thread open. The thread exits 0 having posted nothing, and the
 *   SSE stream just stops mid-event. This is what killed two real runs.
 * - `unhandledRejection` / `uncaughtException`: raised outside the awaited
 *   chain, so the try/catch never sees them.
 *
 * Each is converted into a `kind: 'error'` message, once, so the run always
 * ends with a terminal frame the client can act on.
 */
export function guardWorkerExit(
  rawPost: (m: WorkerMessage) => void,
  on: (event: string, listener: (arg?: unknown) => void) => void,
): (m: WorkerMessage) => void {
  let settled = false;

  const fail = (message: string) => {
    if (settled) return;
    settled = true;
    rawPost({ kind: 'error', message });
  };

  on('beforeExit', () => fail(
    'The research worker stopped before producing a report: its event loop drained while work was still outstanding. This usually means a source request never settled.',
  ));
  on('unhandledRejection', (reason) => fail(
    `Unhandled rejection in the research worker: ${describeReason(reason)}`,
  ));
  on('uncaughtException', (error) => fail(
    `Uncaught exception in the research worker: ${describeReason(error)}`,
  ));

  return (m: WorkerMessage) => {
    if (m.kind === 'done' || m.kind === 'error') settled = true;
    rawPost(m);
  };
}

// Bottom-of-file worker wiring: runs ONLY inside a real worker thread, never on import in tests.
import { parentPort, workerData, isMainThread } from 'worker_threads';
if (!isMainThread && parentPort) {
  const port = parentPort;
  const post = guardWorkerExit(
    (m) => port.postMessage(m),
    (event, listener) => { process.on(event as 'beforeExit', listener); },
  );
  void runInWorker(post, workerData as WorkerOpts);
}
