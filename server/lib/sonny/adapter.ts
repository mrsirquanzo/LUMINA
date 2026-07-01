import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { buildSync } from 'esbuild';
import { publish, closeRun } from './runBus.js';
import type { WorkerMessage, WorkerOpts } from './worker.js';
import { saveBriefing } from './runStore.js';
import type { Briefing } from '@mrsirquanzo/sonny-shared';

export type PersistBriefing = (runId: string, briefing: Briefing) => Promise<void>;

export interface WorkerHandle {
  on(event: 'message', cb: (m: WorkerMessage) => void): void;
  on(event: 'error', cb: (e: Error) => void): void;
  on(event: 'exit', cb: (code: number) => void): void;
  terminate(): void;
}

export type SpawnWorker = (opts: WorkerOpts) => WorkerHandle;

// The worker's TS module graph cannot be spawned directly: a worker_thread loading a `.ts`
// file resolves its `.js` sibling imports against native Node, not tsx (proven: tsx only
// rewrites extensions in the main CLI process, not in spawned workers). So we bundle the
// worker into a single self-contained ESM file with esbuild, keeping the engine EXTERNAL so
// its runtime `await import()` still resolves from node_modules. Bundled once per process,
// cached under node_modules/.cache (gitignored). Resolves from source (dev) via process.cwd().
let cachedWorkerBundle: string | null = null;
function resolveWorkerBundle(): string {
  if (cachedWorkerBundle && fs.existsSync(cachedWorkerBundle)) return cachedWorkerBundle;
  const cwd = process.cwd();
  const src = path.join(cwd, 'server/lib/sonny/worker.ts');
  const out = path.join(cwd, 'node_modules/.cache/sonny/worker.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  buildSync({
    entryPoints: [src], outfile: out, bundle: true, format: 'esm',
    platform: 'node', target: 'node20', external: ['@mrsirquanzo/*'],
  });
  cachedWorkerBundle = out;
  return out;
}

const defaultSpawn: SpawnWorker = (opts) => {
  const w = new Worker(resolveWorkerBundle(), { workerData: opts });
  return {
    on: (ev: 'message' | 'error' | 'exit', cb: (arg: never) => void) => { w.on(ev, cb as (a: unknown) => void); },
    terminate: () => { void w.terminate(); },
  };
};

export function startRun(input: WorkerOpts, spawn: SpawnWorker = defaultSpawn, persist: PersistBriefing = saveBriefing): void {
  const handle = spawn(input);
  let finished = false;

  function finish(): void {
    if (finished) return;
    finished = true;
    closeRun(input.runId);
    handle.terminate();
  }

  handle.on('message', (m: WorkerMessage) => {
    if (finished) return;
    if (m.kind === 'trace') {
      publish(input.runId, m.event);
    } else if (m.kind === 'done') {
      publish(input.runId, { type: 'done', briefing: m.briefing });
      void persist(input.runId, m.briefing).catch((err) => {
        console.error(`[sonny] failed to persist run ${input.runId}:`, err);
      });
      finish();
    } else if (m.kind === 'error') {
      publish(input.runId, { type: 'error', message: m.message });
      finish();
    }
  });

  handle.on('error', (e: Error) => {
    if (finished) return;
    publish(input.runId, { type: 'error', message: e.message });
    finish();
  });

  handle.on('exit', (code: number) => {
    if (finished) return;
    if (code !== 0) {
      publish(input.runId, { type: 'error', message: `worker exited ${code}` });
      closeRun(input.runId);
    }
  });
}
