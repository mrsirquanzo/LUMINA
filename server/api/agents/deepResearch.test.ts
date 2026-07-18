import { describe, it, expect } from 'vitest';
import { makeDeepResearchRouter } from './deepResearch.js';
import type { BusEvent } from './deepResearch.js';
import type { Router } from 'express';

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

interface RouterLayer {
  route?: {
    path?: string;
    methods?: Record<string, boolean>;
    stack: Array<{ handle: (req: unknown, res: unknown) => void | Promise<void> }>;
  };
}

function routeHandler(router: Router, path: string, method: string) {
  const layers = (router as unknown as { stack: RouterLayer[] }).stack;
  const layer = layers.find((item) => item.route?.path === path && item.route.methods?.[method]);
  if (!layer?.route) throw new Error(`Missing ${method.toUpperCase()} ${path} route`);
  return layer.route.stack[0].handle;
}

describe('deepResearch router', () => {
  it('POST streams run_started, forwards bus events, ends on done', async () => {
    let handler: ((e: BusEvent) => void) | null = null;
    const deps = {
      makeRunId: () => 'RID',
      startRun: () => {},
      subscribe: (_r: string, fn: (e: BusEvent) => void) => { handler = fn; return () => {}; },
      loadBriefing: async () => null,
      loadDemoBriefing: async () => null,
    };
    const router = makeDeepResearchRouter(deps);
    const post = routeHandler(router, '/', 'post');
    const res = fakeRes();
    await post({ body: { target: 'CDCP1', mode: 'fast' } }, res);
    handler!({ type: 'lead_decompose', specialists: [] } as BusEvent);
    handler!({ type: 'done', briefing: { target: 'CDCP1' } } as BusEvent);
    const joined = res.chunks.join('');
    expect(joined).toContain('"type":"run_started"');
    expect(joined).toContain('"runId":"RID"');
    expect(joined).toContain('lead_decompose');
    expect(res.ended).toBe(true);
  });

  it('GET /:runId returns 404 json when no briefing', async () => {
    const deps = { makeRunId: () => 'x', startRun: () => {}, subscribe: () => () => {}, loadBriefing: async () => null, loadDemoBriefing: async () => null };
    const router = makeDeepResearchRouter(deps);
    const get = routeHandler(router, '/:runId', 'get');
    const res = fakeRes();
    await get({ params: { runId: 'missing' } }, res);
    expect(res.chunks.join('')).toContain('JSON:');
    expect(res.ended).toBe(true);
  });

  it('GET /demo/:target returns a cached briefing without starting a run', async () => {
    let starts = 0;
    const deps = {
      makeRunId: () => 'x',
      startRun: () => { starts += 1; },
      subscribe: () => () => {},
      loadBriefing: async () => null,
      loadDemoBriefing: async () => ({ runId: 'TROP2-cached', briefing: { target: 'TROP2' } }),
    };
    const router = makeDeepResearchRouter(deps);
    const get = routeHandler(router, '/demo/:target', 'get');
    const res = fakeRes();
    await get({ params: { target: 'TROP2' } }, res);
    expect(res.chunks.join('')).toContain('TROP2-cached');
    expect(starts).toBe(0);
  });
});
