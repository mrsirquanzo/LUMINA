import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWatchlistStore, loadTargets } from './store.js';

describe('watchlist store', () => {
  let mem: Record<string, string> = {};
  beforeEach(() => {
    mem = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
      clear: () => { mem = {}; },
    });
    vi.stubGlobal('window', {});
    useWatchlistStore.setState({ targets: [] });
  });

  it('add normalizes, dedupes case-insensitively, and persists', () => {
    useWatchlistStore.getState().add('cdcp1');
    useWatchlistStore.getState().add('CDCP1'); // dupe (case-insensitive)
    const { targets } = useWatchlistStore.getState();
    expect(targets.length).toBe(1);
    expect(JSON.parse(mem['lumina:intelligence:trackedTargets:v1'])).toEqual(targets);
  });

  it('add caps at 8, keeping the 8 most recent', () => {
    for (let i = 1; i <= 10; i++) useWatchlistStore.getState().add(`T${i}`);
    const { targets } = useWatchlistStore.getState();
    expect(targets.length).toBe(8);
    expect(targets).toContain('T10'); // newest kept
    expect(targets).toContain('T3');  // 8th-newest kept
    expect(targets).not.toContain('T1'); // oldest dropped
    expect(targets).not.toContain('T2');
  });

  it('remove is case-insensitive and persists', () => {
    useWatchlistStore.getState().add('TROP2');
    useWatchlistStore.getState().remove('trop2');
    expect(useWatchlistStore.getState().targets).toEqual([]);
  });

  it('seedIfEmpty only seeds when empty', () => {
    useWatchlistStore.getState().seedIfEmpty(['CDCP1', 'CDCP1', 'TROP2']);
    expect(useWatchlistStore.getState().targets).toEqual(['CDCP1', 'TROP2']); // deduped
    useWatchlistStore.getState().seedIfEmpty(['KRAS']);
    expect(useWatchlistStore.getState().targets).toEqual(['CDCP1', 'TROP2']); // no-op when non-empty
  });

  it('loadTargets reads + normalizes pre-existing key data', () => {
    mem['lumina:intelligence:trackedTargets:v1'] = JSON.stringify(['cdcp1', 'cdcp1', 'trop2']);
    expect(loadTargets()).toEqual(['cdcp1', 'TROP2']); // formatTargetDisplayName upcases TROP2 (known alias), leaves cdcp1 unchanged
  });
});
