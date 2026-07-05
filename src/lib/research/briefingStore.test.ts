import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBriefingStore, loadState } from './briefingStore.js';
import type { BriefingView } from './sseTypes.js';

describe('briefingStore', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    useBriefingStore.setState({ briefings: {}, savedAt: {} });
    // Mock localStorage for each test
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    });
    // Ensure window is defined for localStorage checks
    vi.stubGlobal('window', {});
  });

  it('round-trips a briefing by runId', () => {
    useBriefingStore.getState().setBriefing('r1', { target: 'CDCP1' } as BriefingView);
    expect(useBriefingStore.getState().getBriefing('r1')?.target).toBe('CDCP1');
    expect(useBriefingStore.getState().getBriefing('nope')).toBeUndefined();
  });

  it('records a savedAt timestamp when a briefing is set', () => {
    const before = Date.now();
    useBriefingStore.getState().setBriefing('TROP2-abc', { target: 'TROP2' } as BriefingView);
    const { briefings, savedAt } = useBriefingStore.getState();
    // read shape unchanged: briefings[runId] is the BriefingView
    expect(briefings['TROP2-abc']).toEqual({ target: 'TROP2' });
    // savedAt recorded as a recent epoch ms
    expect(typeof savedAt['TROP2-abc']).toBe('number');
    expect(savedAt['TROP2-abc']).toBeGreaterThanOrEqual(before);
  });

  it('loads pre-existing briefings that have no savedAt map (backward compat)', () => {
    // Simulate old persisted data: only the briefings blob, no savedAt key
    store['lumina:research:briefings:v1'] = JSON.stringify({ 'OLD-1': { target: 'KRAS' } });
    // Don't include savedAt key to simulate old data

    const loaded = loadState();
    expect(loaded.briefings['OLD-1']).toEqual({ target: 'KRAS' });
    expect(loaded.savedAt['OLD-1']).toBeUndefined(); // missing -> undefined, sorts last
  });
});
