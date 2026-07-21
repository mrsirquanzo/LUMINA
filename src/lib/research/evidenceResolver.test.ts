import { describe, expect, it } from 'vitest';
import {
  resolveEvidence,
  safeExternalUrl,
  sourceLabelForCitation,
  structuredDataRows,
} from './evidenceResolver';

describe('evidence resolver', () => {
  it('prefers an exact locator and falls back to the underlying source', () => {
    const references = [
      { id: 'ENSG00000163814', title: 'Target record' },
      { id: 'ENSG00000163814#expression', title: 'Expression record' },
    ];

    expect(resolveEvidence('ENSG00000163814#expression', references)?.title).toBe('Expression record');
    expect(resolveEvidence('ENSG00000163814#tractability', references)?.title).toBe('Target record');
  });

  it('provides human source labels when reference metadata is narrow', () => {
    expect(sourceLabelForCitation('HPA:CDCP1')).toBe('Human Protein Atlas');
    expect(sourceLabelForCitation('NCT:NCT04500000')).toBe('ClinicalTrials.gov');
    expect(sourceLabelForCitation('PMID:123', { source: 'Europe PMC' })).toBe('Europe PMC');
  });

  it('renders object and array raw data as safe rows', () => {
    expect(structuredDataRows({ tissue: 'lung', median: 7.7 })).toEqual([
      { key: 'tissue', value: 'lung' },
      { key: 'median', value: '7.7' },
    ]);
    expect(structuredDataRows(['lung'])).toEqual([{ key: '0', value: 'lung' }]);
    expect(structuredDataRows('not structured')).toEqual([]);
  });

  it('only exposes HTTP source links', () => {
    expect(safeExternalUrl('https://www.proteinatlas.org/ENSG00000163814')).toContain('proteinatlas.org');
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined();
  });
});
