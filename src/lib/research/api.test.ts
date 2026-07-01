import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBriefing } from './api.js';

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
