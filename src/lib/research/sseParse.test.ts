import { describe, it, expect } from 'vitest';
import { createSSEParser } from './sseParse.js';

describe('createSSEParser', () => {
  it('parses complete frames and buffers a frame split across chunks', () => {
    const p = createSSEParser();
    // a frame arrives split across two pushes
    const out1 = p.push('data: {"type":"a"}\n\ndata: {"ty');
    expect(out1).toEqual([{ type: 'a' }]);          // only the complete frame so far
    const out2 = p.push('pe":"done","briefing":{"target":"X"}}\n\n');
    expect(out2).toEqual([{ type: 'done', briefing: { target: 'X' } }]);  // completed across the boundary
  });

  it('skips blank/separator lines and keeps a trailing partial', () => {
    const p = createSSEParser();
    expect(p.push('data: {"n":1}\n')).toEqual([{ n: 1 }]);
    expect(p.push('data: {"n":2}')).toEqual([]);     // no newline yet -> buffered
    expect(p.push('\n')).toEqual([{ n: 2 }]);
  });
});
