import { afterEach, describe, expect, it, vi } from 'vitest';
import { gtexExpressionTool } from './gtexTool.js';
import { setFigureSink } from './figureSink.js';
import type { FigureSpec } from '../../../shared/figures.js';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

const TISSUES = [
  { tissueSiteDetailId: 'Esophagus_Mucosa', median: 35.8, unit: 'TPM' },
  { tissueSiteDetailId: 'Lung', median: 7.7, unit: 'TPM' },
  { tissueSiteDetailId: 'Breast_Mammary_Tissue', median: 3.2, unit: 'TPM' },
  { tissueSiteDetailId: 'Pancreas', median: 1.1, unit: 'TPM' },
  { tissueSiteDetailId: 'Brain_Cortex', median: 0.2, unit: 'TPM' },
];

function gtexFetch(tissues: unknown[] = TISSUES, symbol = 'CDCP1'): typeof fetch {
  const responses = [
    { hits: [{ symbol, ensembl: { gene: [{ gene: 'ENSG00000163814' }] } }] },
    { data: [{ gencodeId: 'ENSG00000163814.7' }] },
    { data: tissues },
  ];
  return vi.fn(async () => jsonResponse(responses.shift())) as unknown as typeof fetch;
}

afterEach(() => {
  setFigureSink(null);
});

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

  it('emits the full tissue distribution as a figure, not just the prose top four', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    await gtexExpressionTool.call({ query: 'CDCP1' }, gtexFetch());

    expect(figures).toHaveLength(1);
    const figure = figures[0];
    expect(figure.plot).toBe('tissue_expression_bar');
    expect(figure.id).toBe('gtex:CDCP1');
    expect(figure.unit).toBe('TPM');
    // Every tissue reaches the figure, while the snippet only names the top four.
    expect(figure.bars).toHaveLength(TISSUES.length);
    expect(figure.bars[0]).toEqual({ label: 'Esophagus Mucosa', value: 35.8 });
    expect(figure.bars.at(-1)).toEqual({ label: 'Brain Cortex', value: 0.2 });
    expect(figure.reference).toEqual({ label: 'median', value: 3.2 });
    expect(figure.source.url).toBe('https://gtexportal.org/home/gene/CDCP1');
    expect(figure.stats).toContainEqual({ label: 'max', value: '35.8 TPM' });
    expect(figure.stats).toContainEqual({ label: 'median', value: '3.20 TPM' });
    // Dynamic range is the statistic that decides the safety window.
    expect(figure.stats).toContainEqual({ label: 'range', value: '11.2×' });
  });

  it('emits no figure when the gene cannot be resolved', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    const fetchImpl = vi.fn(async () => jsonResponse({ hits: [] })) as unknown as typeof fetch;
    await gtexExpressionTool.call({ symbol: 'NOTAGENE' }, fetchImpl);

    expect(figures).toEqual([]);
  });

  it('still returns evidence when the figure sink throws', async () => {
    setFigureSink(() => {
      throw new Error('render pipeline exploded');
    });

    const evidence = await gtexExpressionTool.call({ query: 'CDCP1' }, gtexFetch());
    expect(evidence).toHaveLength(1);
    expect(evidence[0].id).toBe('GTEX:CDCP1');
  });
});

describe('gtexExpressionTool alias resolution', () => {
  it('queries mygene by symbol OR alias, not symbol alone', async () => {
    const calls: string[] = [];
    const responses: unknown[] = [
      { hits: [{ symbol: 'TACSTD2', ensembl: { gene: [{ gene: 'ENSG00000184292' }] } }] },
      { data: [{ gencodeId: 'ENSG00000184292.6' }] },
      { data: TISSUES },
    ];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(String(url));
      return jsonResponse(responses.shift());
    }) as unknown as typeof fetch;

    await gtexExpressionTool.call({ query: 'TROP2' }, fetchImpl);

    // A symbol-only lookup returns nothing for TROP2, so the tool used to
    // contribute no GTEx evidence at all on the most-researched targets.
    // URLSearchParams encodes the space as '+', which mygene accepts.
    expect(decodeURIComponent(calls[0])).toContain('symbol:TROP2+OR+alias:TROP2');
  });

  it('labels the figure with the resolved HGNC symbol and names the alias asked for', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    await gtexExpressionTool.call({ query: 'TROP2' }, gtexFetch(TISSUES, 'TACSTD2'));

    const figure = figures[0];
    expect(figure.id).toBe('gtex:TACSTD2');
    expect(figure.title).toBe('TACSTD2 expression across normal tissues');
    // The reader must be able to see which gene was actually plotted.
    expect(figure.params.gene).toBe('TACSTD2 (asked as TROP2)');
    expect(figure.source.url).toBe('https://gtexportal.org/home/gene/TACSTD2');
  });

  it('does not add an alias note when the official symbol was requested', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    await gtexExpressionTool.call({ query: 'TACSTD2' }, gtexFetch(TISSUES, 'TACSTD2'));

    expect(figures[0].params.gene).toBe('TACSTD2');
  });
});
