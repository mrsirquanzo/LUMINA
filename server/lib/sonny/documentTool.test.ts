import { describe, it, expect } from 'vitest';
import { documentEvidence, makeDocumentTool } from './documentTool.js';

describe('documentTool', () => {
  it('returns null when there are no documents', () => {
    expect(makeDocumentTool([])).toBeNull();
  });

  it('emits citable DOC: evidence with the uploaded source', () => {
    const ev = documentEvidence([{ name: 'internal.pdf', text: 'CDCP1 is membranous in NSCLC.' }]);
    expect(ev).toHaveLength(1);
    expect(ev[0].id).toBe('DOC:internal#1');
    expect(ev[0].kind).toBe('dataset');
    expect(ev[0].source).toContain('internal.pdf');
    expect(ev[0].snippet).toContain('CDCP1');
  });

  it('chunks long documents into multiple numbered passages', () => {
    const long = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} `.repeat(60)).join('\n\n');
    const ev = documentEvidence([{ name: 'big.docx', text: long }]);
    expect(ev.length).toBeGreaterThan(1);
    expect(ev.every((e) => e.id.startsWith('DOC:big#'))).toBe(true);
  });

  it('exposes an uploaded_documents tool whose call returns the evidence', async () => {
    const tool = makeDocumentTool([{ name: 'a.txt', text: 'hello world' }]);
    expect(tool?.name).toBe('uploaded_documents');
    const out = await tool!.call({});
    expect(out[0].id).toBe('DOC:a#1');
  });
});
