import { describe, it, expect } from 'vitest';
import { publish, subscribe, closeRun, type BusEvent } from './runBus.js';

describe('runBus', () => {
  it('delivers published events to all live subscribers and stops after close/unsubscribe', () => {
    const seenA: string[] = [];
    const seenB: string[] = [];
    const offA = subscribe('r1', (e) => seenA.push(e.type));
    subscribe('r1', (e) => seenB.push(e.type));
    publish('r1', { type: 'lead_decompose', specialists: [] } as BusEvent);
    offA();
    publish('r1', { type: 'recommendation', verdict: 'watch' } as BusEvent);
    closeRun('r1');
    publish('r1', { type: 'error', message: 'late' });
    expect(seenA).toEqual(['lead_decompose']);
    expect(seenB).toEqual(['lead_decompose', 'recommendation']);
  });

  it('isolates runs by id', () => {
    const seen: string[] = [];
    subscribe('a', (e) => seen.push(`a:${e.type}`));
    subscribe('b', (e) => seen.push(`b:${e.type}`));
    publish('a', { type: 'error', message: 'x' });
    expect(seen).toEqual(['a:error']);
  });
});
