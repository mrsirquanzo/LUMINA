import { describe, it, expect } from 'vitest';
import { makeDeepResearchRouter } from './deepResearch.js';

interface FakeRes {
  setHeader(): void;
  write(c: string): void;
  end(): void;
  status(): this;
  json(o: unknown): void;
  readonly chunks: string[];
  readonly ended: boolean;
}

function fakeRes(): FakeRes {
  const chunks: string[] = []; let ended = false;
  return {
    setHeader() {}, write(c: string) { chunks.push(c); }, end() { ended = true; },
    status() { return this; }, json(o: unknown) { chunks.push('JSON:' + JSON.stringify(o)); ended = true; },
    get chunks() { return chunks; }, get ended() { return ended; },
  } as unknown as FakeRes;
}

describe('deepResearch router', () => {
  it('POST streams run_started, forwards bus events, ends on done', async () => {
    let handler: ((e: unknown) => void) | null = null;
    const deps = {
      makeRunId: () => 'RID',
      startRun: () => {},
      subscribe: (_r: string, fn: (e: unknown) => void) => { handler = fn; return () => {}; },
      loadBriefing: async () => null,
    };
    const router = makeDeepResearchRouter(deps);
    const post = (router.stack.find((l: any) => l.route?.path === '/' && l.route?.methods?.post) as any).route.stack[0].handle;
    const res = fakeRes();
    await post({ body: { target: 'CDCP1', mode: 'fast' } }, res);
    handler!({ type: 'lead_decompose', specialists: [] });
    handler!({ type: 'done', briefing: { target: 'CDCP1' } });
    const joined = res.chunks.join('');
    expect(joined).toContain('"type":"run_started"');
    expect(joined).toContain('"runId":"RID"');
    expect(joined).toContain('lead_decompose');
    expect(res.ended).toBe(true);
  });

  it('GET /:runId returns 404 json when no briefing', async () => {
    const deps = { makeRunId: () => 'x', startRun: () => {}, subscribe: () => () => {}, loadBriefing: async () => null };
    const router = makeDeepResearchRouter(deps);
    const get = (router.stack.find((l: any) => l.route?.methods?.get) as any).route.stack[0].handle;
    const res = fakeRes();
    await get({ params: { runId: 'missing' } }, res);
    expect(res.chunks.join('')).toContain('JSON:');
    expect(res.ended).toBe(true);
  });
});
