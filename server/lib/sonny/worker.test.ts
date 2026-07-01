import { describe, it, expect } from 'vitest';
import { runInWorker, type WorkerMessage, type EngineInjection } from './worker.js';
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
