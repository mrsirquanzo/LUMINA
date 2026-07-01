import { describe, it, expect } from 'vitest';
import { startRun, type WorkerHandle, type SpawnWorker } from './adapter.js';
import { subscribe, publish } from './runBus.js';
import type { WorkerMessage } from './worker.js';

function fakeSpawn() {
  const h: Record<string, Function[]> = { message: [], error: [], exit: [] };
  let terminated = false;
  const handle: WorkerHandle = {
    on: (ev: string, cb: Function) => { h[ev].push(cb); },
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
    startRun({ runId: 'r1', target: 'T', mode: 'fast', backend: 'ollama' }, spawn);
    emit('message', { kind: 'trace', event: { type: 'lead_decompose', specialists: [] } } as WorkerMessage);
    emit('message', { kind: 'done', briefing: { target: 'T' } } as unknown as WorkerMessage);
    const afterDone = seen.length;
    publish('r1', { type: 'error', message: 'late' } as never); // run closed -> no-op
    expect(seen).toEqual(['lead_decompose', 'done']);
    expect(seen.length).toBe(afterDone);
    expect(wasTerminated()).toBe(true);
  });

  it('forwards a worker error onto the bus and closes the run', () => {
    const { spawn, emit } = fakeSpawn();
    const seen: WorkerMessage[] = [] as never;
    const got: Array<{ type: string; message?: string }> = [];
    subscribe('r2', (e) => got.push(e as never));
    startRun({ runId: 'r2', target: 'T', mode: 'fast', backend: 'ollama' }, spawn);
    emit('error', new Error('worker crashed'));
    expect(got).toEqual([{ type: 'error', message: 'worker crashed' }]);
  });

  it('does not double-report when a nonzero exit follows a done', () => {
    const { spawn, emit } = fakeSpawn();
    const got: Array<{ type: string }> = [];
    subscribe('r3', (e) => got.push(e as never));
    startRun({ runId: 'r3', target: 'T', mode: 'fast', backend: 'ollama' }, spawn);
    emit('message', { kind: 'done', briefing: { target: 'T' } } as unknown as WorkerMessage);
    emit('exit', 1);
    expect(got.map((e) => e.type)).toEqual(['done']); // no trailing error
  });
});
