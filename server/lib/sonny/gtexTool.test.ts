import { describe, expect, it, vi } from 'vitest';
import { gtexExpressionTool } from './gtexTool.js';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

describe('gtexExpressionTool', () => {
  it('returns a concise normal-tissue expression baseline', async () => {
    const responses = [
      { hits: [{ ensembl: { gene: [{ gene: 'ENSG00000163814' }] } }] },
      { data: [{ gencodeId: 'ENSG00000163814.7' }] },
      { data: [
        { tissueSiteDetailId: 'Esophagus_Mucosa', median: 35.8, unit: 'TPM' },
        { tissueSiteDetailId: 'Lung', median: 7.7, unit: 'TPM' },
        { tissueSiteDetailId: 'Breast_Mammary_Tissue', median: 3.2, unit: 'TPM' },
        { tissueSiteDetailId: 'Pancreas', median: 1.1, unit: 'TPM' },
        { tissueSiteDetailId: 'Brain_Cortex', median: 0.2, unit: 'TPM' },
      ] },
    ];
    const fetchImpl = vi.fn(async () => jsonResponse(responses.shift())) as unknown as typeof fetch;
    const evidence = await gtexExpressionTool.call({ query: 'CDCP1' }, fetchImpl);

    expect(evidence).toHaveLength(1);
    expect(evidence[0].id).toBe('GTEX:CDCP1');
    expect(evidence[0].kind).toBe('dataset');
    expect(evidence[0].source).toBe('GTEx (normal tissue)');
    expect(evidence[0].snippet).toContain('across 5 tissues');
    expect(evidence[0].snippet).toContain('Esophagus Mucosa 35.8 TPM');
    expect(evidence[0].snippet).toContain('Overall median 3.2 TPM');
    expect(evidence[0].snippet).toContain('off-tumor safety window');
  });

  it('returns no evidence for an empty gene', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(gtexExpressionTool.call({ target: '  ' }, fetchImpl)).resolves.toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns no evidence when a fetch fails', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false)) as unknown as typeof fetch;
    await expect(gtexExpressionTool.call({ symbol: 'CDCP1' }, fetchImpl)).resolves.toEqual([]);
  });
});
