import { describe, it, expect } from 'vitest';
import { createTraceBuffer } from './traceBuffer.js';

describe('createTraceBuffer', () => {
  it('coalesces many pushes into one flush and drains', () => {
    const flushes: number[][] = [];
    let scheduled: (() => void) | null = null;
    const buf = createTraceBuffer<number>({
      onFlush: (batch) => flushes.push(batch),
      schedule: (cb) => { scheduled = cb; return () => { scheduled = null; }; },
    });
    buf.push(1); buf.push(2); buf.push(3);
    expect(flushes).toEqual([]);
    scheduled!();
    expect(flushes).toEqual([[1, 2, 3]]);
    buf.flush();
    expect(flushes).toEqual([[1, 2, 3]]);
  });

  it('re-arms scheduling after a flush', () => {
    const flushes: number[][] = [];
    let scheduled: (() => void) | null = null;
    const buf = createTraceBuffer<number>({
      onFlush: (b) => flushes.push(b),
      schedule: (cb) => { scheduled = cb; return () => {}; },
    });
    buf.push(1); scheduled!();
    buf.push(2); scheduled!();
    expect(flushes).toEqual([[1], [2]]);
  });
});
