import { describe, expect, it, vi } from 'vitest';
import { humanProteinAtlasTool } from './hpaTool.js';

const HPA_RECORD = {
  Gene: 'CDCP1',
  'Gene synonym': ['CD318', 'SIMA135'],
  Ensembl: 'ENSG00000163814',
  'RNA tissue specificity': 'Tissue enhanced',
  'RNA tissue specific nTPM': { esophagus: '35.8' },
  'Subcellular location': ['Nucleoplasm', 'Vesicles'],
  'Subcellular main location': ['Nucleoplasm', 'Vesicles'],
  'Tissue RNA - lung [nTPM]': '7.7',
  prognostic_lung_cancer: 'unfavorable',
};

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

describe('humanProteinAtlasTool', () => {
  it('returns HPA expression and localisation evidence', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([HPA_RECORD])) as unknown as typeof fetch;
    const evidence = await humanProteinAtlasTool.call({ symbol: 'cdcp1' }, fetchImpl);

    expect(evidence).toHaveLength(1);
    expect(evidence[0].id).toBe('HPA:CDCP1');
    expect(evidence[0].kind).toBe('dataset');
    expect(evidence[0].source).toBe('Human Protein Atlas');
    expect(evidence[0].snippet).toContain('Tissue enhanced');
    expect(evidence[0].snippet).toContain('esophagus 35.8 nTPM');
    expect(evidence[0].snippet).toContain('Nucleoplasm');
    expect(evidence[0].snippet).toContain('lung 7.7 nTPM');
    expect(evidence[0].snippet).toContain('prognostic in lung cancer: unfavorable');
  });

  it('returns no evidence for an empty gene', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(humanProteinAtlasTool.call({}, fetchImpl)).resolves.toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns no evidence when the fetch fails', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch;
    await expect(humanProteinAtlasTool.call({ gene: 'CDCP1' }, fetchImpl)).resolves.toEqual([]);
  });
});
