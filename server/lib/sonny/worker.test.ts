import { describe, it, expect } from 'vitest';
import { runInWorker, guardWorkerExit, type WorkerMessage, type EngineInjection } from './worker.js';
import type { Briefing } from '@mrsirquanzo/sonny-shared';

const fakeBriefing = { target: 'TEST' } as unknown as Briefing;

const okEngine: EngineInjection = {
  buildEngineDeps: async () => ({} as never),
  produceBriefing: async (opts) => {
    opts.emit({ type: 'lead_decompose', specialists: [] } as never);
    opts.emit({ type: 'recommendation', verdict: 'watch' } as never);
    return fakeBriefing;
  },
};

describe('runInWorker', () => {
  it('posts trace events then a done message carrying the briefing', async () => {
    const msgs: WorkerMessage[] = [];
    await runInWorker((m) => msgs.push(m), { runId: 'r1', target: 'TEST', mode: 'fast', backend: 'ollama' }, okEngine);
    expect(msgs.filter((m) => m.kind === 'trace')).toHaveLength(2);
    expect(msgs[msgs.length - 1]).toMatchObject({ kind: 'done', briefing: fakeBriefing });
  });

  it('posts a single error message when the engine throws', async () => {
    const msgs: WorkerMessage[] = [];
    const boomEngine: EngineInjection = {
      buildEngineDeps: async () => ({} as never),
      produceBriefing: async () => { throw new Error('boom'); },
    };
    await runInWorker((m) => msgs.push(m), { runId: 'r1', target: 'X', mode: 'fast', backend: 'ollama' }, boomEngine);
    expect(msgs).toEqual([{ kind: 'error', message: 'boom' }]);
  });
});

describe('guardWorkerExit', () => {
  function fakeProcess() {
    const listeners = new Map<string, (arg?: unknown) => void>();
    const on = (event: string, listener: (arg?: unknown) => void) => { listeners.set(event, listener); };
    const emit = (event: string, arg?: unknown) => listeners.get(event)?.(arg);
    return { on, emit };
  }

  it('reports an error when the event loop drains before a briefing was posted', () => {
    const sent: WorkerMessage[] = [];
    const { on, emit } = fakeProcess();
    guardWorkerExit((m) => sent.push(m), on);

    emit('beforeExit');

    // The failure that killed two real runs: thread exits 0 having posted
    // nothing, so the SSE stream stops mid-event with no terminal frame.
    expect(sent).toHaveLength(1);
    expect(sent[0].kind).toBe('error');
    expect((sent[0] as { message: string }).message).toContain('event loop drained');
  });

  it('stays silent when the run already finished', () => {
    const sent: WorkerMessage[] = [];
    const { on, emit } = fakeProcess();
    const post = guardWorkerExit((m) => sent.push(m), on);

    post({ kind: 'done', briefing: { target: 'T' } } as unknown as WorkerMessage);
    emit('beforeExit');

    expect(sent.map((m) => m.kind)).toEqual(['done']);
  });

  it('does not report twice when several failure signals fire', () => {
    const sent: WorkerMessage[] = [];
    const { on, emit } = fakeProcess();
    guardWorkerExit((m) => sent.push(m), on);

    emit('unhandledRejection', new Error('boom'));
    emit('beforeExit');
    emit('uncaughtException', new Error('later'));

    expect(sent).toHaveLength(1);
    expect((sent[0] as { message: string }).message).toContain('boom');
  });

  it('surfaces an unhandled rejection raised outside the awaited chain', () => {
    const sent: WorkerMessage[] = [];
    const { on, emit } = fakeProcess();
    guardWorkerExit((m) => sent.push(m), on);

    emit('unhandledRejection', new Error('socket hang up'));

    expect((sent[0] as { message: string }).message).toContain('socket hang up');
  });

  it('passes normal messages straight through', () => {
    const sent: WorkerMessage[] = [];
    const { on } = fakeProcess();
    const post = guardWorkerExit((m) => sent.push(m), on);

    post({ kind: 'trace', event: { type: 'lead_decompose' } } as unknown as WorkerMessage);

    expect(sent).toHaveLength(1);
    expect(sent[0].kind).toBe('trace');
  });
});
