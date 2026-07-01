import { describe, it, expect } from 'vitest';
import { useBriefingStore } from './briefingStore.js';

describe('briefingStore', () => {
  it('round-trips a briefing by runId', () => {
    useBriefingStore.getState().setBriefing('r1', { target: 'CDCP1' });
    expect(useBriefingStore.getState().getBriefing('r1')?.target).toBe('CDCP1');
    expect(useBriefingStore.getState().getBriefing('nope')).toBeUndefined();
  });
});
