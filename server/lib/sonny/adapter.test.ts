import { describe, it, expect } from 'vitest';
import { startRun, type WorkerHandle, type SpawnWorker } from './adapter.js';
import { subscribe, publish } from './runBus.js';
import type { WorkerMessage } from './worker.js';

function fakeSpawn() {
  const h: Record<string, Array<(arg: unknown) => void>> = { message: [], error: [], exit: [] };
  let terminated = false;
  const handle: WorkerHandle = {
    on: (ev: string, cb: (arg: unknown) => void) => { h[ev].push(cb); },
    terminate: () => { terminated = true; },
  } as unknown as WorkerHandle;
  const spawn: SpawnWorker = () => handle;
  const emit = (ev: string, arg: unknown) => h[ev].forEach((f) => f(arg));
  return { spawn, emit, wasTerminated: () => terminated };
}

describe('startRun adapter', () => {
  it('forwards trace then done onto the bus, closes and terminates on done', () => {
    const { spawn, emit, wasTerminated } = fakeSpawn();
    const seen: string[] = [];
    subscribe('r1', (e) => seen.push(e.type));
    startRun({ runId: 'r1', target: 'T', mode: 'fast', backend: 'ollama' }, spawn, async () => {});
    emit('message', { kind: 'trace', event: { type: 'lead_decompose', specialists: [] } } as WorkerMessage);
    emit('message', { kind: 'done', briefing: { target: 'T' } } as unknown as WorkerMessage);
    const afterDone = seen.length;
    publish('r1', { type: 'error', message: 'late' } as never); // run closed -> no-op
    expect(seen).toEqual(['lead_decompose', 'done']);
    expect(seen.length).toBe(afterDone);
    expect(wasTerminated()).toBe(true);
  });

  it('keeps a caught seed failure non-terminal and continues to done', () => {
    const { spawn, emit, wasTerminated } = fakeSpawn();
    const got: Array<{ type: string; message?: string }> = [];
    subscribe('seed-soft-failure', (event) => got.push(event as never));
    startRun({ runId: 'seed-soft-failure', target: 'TROP2', mode: 'fast', backend: 'ollama' }, spawn, async () => {});

    emit('message', {
      kind: 'trace',
      event: { type: 'error', message: 'seed clinical_trials_search failed: ClinicalTrials.gov HTTP 400' },
    } as WorkerMessage);
    emit('message', { kind: 'trace', event: { type: 'lead_decompose', specialists: [] } } as WorkerMessage);
    emit('message', { kind: 'done', briefing: { target: 'TROP2' } } as unknown as WorkerMessage);

    expect(got.map((event) => event.type)).toEqual(['source_unavailable', 'lead_decompose', 'done']);
    expect(got[0].message).toContain('clinical_trials_search');
    expect(wasTerminated()).toBe(true);
  });

  it('forwards a worker error onto the bus and closes the run', () => {
    const { spawn, emit } = fakeSpawn();
    const got: Array<{ type: string; message?: string }> = [];
    subscribe('r2', (e) => got.push(e as never));
    startRun({ runId: 'r2', target: 'T', mode: 'fast', backend: 'ollama' }, spawn, async () => {});
    emit('error', new Error('worker crashed'));
    expect(got).toEqual([{ type: 'error', message: 'worker crashed' }]);
  });

  it('does not double-report when a nonzero exit follows a done', () => {
    const { spawn, emit } = fakeSpawn();
    const got: Array<{ type: string }> = [];
    subscribe('r3', (e) => got.push(e as never));
    startRun({ runId: 'r3', target: 'T', mode: 'fast', backend: 'ollama' }, spawn, async () => {});
    emit('message', { kind: 'done', briefing: { target: 'T' } } as unknown as WorkerMessage);
    emit('exit', 1);
    expect(got.map((e) => e.type)).toEqual(['done']); // no trailing error
  });

  it('closes and terminates the run on a silent clean exit (code 0, no done posted)', () => {
    const { spawn, emit, wasTerminated } = fakeSpawn();
    const got: Array<{ type: string }> = [];
    subscribe('r4', (e) => got.push(e as never));
    startRun({ runId: 'r4', target: 'T', mode: 'fast', backend: 'ollama' }, spawn, async () => {});
    emit('exit', 0);
    // run is now closed: a later publish is a no-op, and the worker was terminated
    publish('r4', { type: 'error', message: 'late' } as never);
    expect(got).toEqual([]); // no terminal event fabricated for a clean exit
    expect(wasTerminated()).toBe(true);
  });

  it('reports an error and closes on a nonzero exit with no prior done', () => {
    const { spawn, emit, wasTerminated } = fakeSpawn();
    const got: Array<{ type: string; message?: string }> = [];
    subscribe('r5', (e) => got.push(e as never));
    startRun({ runId: 'r5', target: 'T', mode: 'fast', backend: 'ollama' }, spawn, async () => {});
    emit('exit', 3);
    expect(got).toEqual([{ type: 'error', message: 'worker exited 3' }]);
    expect(wasTerminated()).toBe(true);
  });

  it('persists the briefing on done, with the runId, and not on error', async () => {
    const { spawn, emit } = fakeSpawn();
    const calls: Array<{ runId: string; target: string }> = [];
    const persist = async (runId: string, briefing: { target?: string }) => {
      calls.push({ runId, target: briefing.target ?? '' });
    };
    subscribe('p1', () => {});
    startRun({ runId: 'p1', target: 'CDCP1', mode: 'fast', backend: 'ollama' }, spawn, persist as never);
    emit('message', { kind: 'done', briefing: { target: 'CDCP1' } } as never);
    // fire-and-forget: allow the microtask to run
    await Promise.resolve();
    expect(calls).toEqual([{ runId: 'p1', target: 'CDCP1' }]);

    // error path must NOT persist
    const { spawn: spawn2, emit: emit2 } = fakeSpawn();
    const calls2: unknown[] = [];
    startRun({ runId: 'p2', target: 'X', mode: 'fast', backend: 'ollama' }, spawn2, (async () => { calls2.push(1); }) as never);
    emit2('message', { kind: 'error', message: 'boom' } as never);
    await Promise.resolve();
    expect(calls2).toEqual([]);
  });
});
