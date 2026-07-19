import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBriefing, fetchDemoBriefing } from './api.js';

afterEach(() => vi.unstubAllGlobals());

describe('fetchBriefing', () => {
  it('returns null on 404', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 } as Response));
    expect(await fetchBriefing('missing')).toBeNull();
  });

  it('returns the briefing on 200', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, json: async () => ({ target: 'X' }) } as Response));
    expect((await fetchBriefing('r1'))?.target).toBe('X');
  });
});

describe('fetchDemoBriefing', () => {
  it('uses the cache-only demo endpoint and returns its run id', async () => {
    let requestedUrl = '';
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubGlobal('fetch', async (url: string) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ runId: 'TROP2-cached', briefing: { target: 'TROP2' } }),
      } as Response;
    });

    expect((await fetchDemoBriefing('TROP2'))?.runId).toBe('TROP2-cached');
    expect(requestedUrl).toBe('/api/agents/deep-research/demo/TROP2');
  });
});
