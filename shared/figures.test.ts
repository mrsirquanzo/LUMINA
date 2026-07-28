import { describe, it, expect } from 'vitest';
import { parseFigure, MAX_FIGURE_BARS } from './figures.js';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    plot: 'tissue_expression_bar',
    id: 'gtex:TACSTD2',
    title: 'TACSTD2 expression across normal tissues',
    subtitle: 'High normal-tissue expression narrows the off-tumor safety window.',
    params: { gene: 'TACSTD2', dataset: 'GTEx v8', tissues: 54 },
    unit: 'median TPM',
    bars: [
      { label: 'Esophagus Mucosa', value: 1828.16 },
      { label: 'Skin Sun Exposed', value: 931.4 },
    ],
    reference: { label: 'across-tissue median', value: 12.5 },
    stats: [{ label: 'tissues', value: '54' }],
    source: {
      label: 'GTEx v8 · median gene expression',
      url: 'https://gtexportal.org/home/gene/TACSTD2',
      retrievedAt: '2026-07-28T18:00:00.000Z',
    },
    ...overrides,
  };
}

describe('parseFigure', () => {
  it('accepts a well-formed tissue expression figure', () => {
    const figure = parseFigure(validPayload());
    expect(figure).not.toBeNull();
    expect(figure!.id).toBe('gtex:TACSTD2');
    expect(figure!.bars).toHaveLength(2);
    expect(figure!.reference).toEqual({ label: 'across-tissue median', value: 12.5 });
    expect(figure!.params.tissues).toBe(54);
  });

  it('rejects an unknown plot type', () => {
    expect(parseFigure(validPayload({ plot: 'volcano' }))).toBeNull();
  });

  it('rejects non-object input', () => {
    expect(parseFigure(null)).toBeNull();
    expect(parseFigure('gtex')).toBeNull();
    expect(parseFigure([])).toBeNull();
  });

  it.each(['id', 'title', 'unit'])('rejects a figure missing %s', (field) => {
    expect(parseFigure(validPayload({ [field]: '' }))).toBeNull();
  });

  it('rejects a figure with no bars', () => {
    expect(parseFigure(validPayload({ bars: [] }))).toBeNull();
    expect(parseFigure(validPayload({ bars: 'many' }))).toBeNull();
  });

  it('rejects a figure whose bars are all malformed', () => {
    expect(parseFigure(validPayload({ bars: [{ label: 'Lung' }, { value: 3 }] }))).toBeNull();
  });

  it('drops individual malformed bars but keeps the figure', () => {
    const figure = parseFigure(
      validPayload({
        bars: [
          { label: 'Lung', value: 12 },
          { label: 'Liver', value: Number.NaN },
          { label: '', value: 4 },
          { label: 'Colon', value: 7 },
        ],
      }),
    );
    expect(figure!.bars.map((bar) => bar.label)).toEqual(['Lung', 'Colon']);
  });

  it('caps bars so an upstream bug cannot render an unbounded chart', () => {
    const bars = Array.from({ length: MAX_FIGURE_BARS + 25 }, (_, i) => ({
      label: `Tissue ${i}`,
      value: i,
    }));
    const figure = parseFigure(validPayload({ bars }));
    expect(figure!.bars).toHaveLength(MAX_FIGURE_BARS);
  });

  it('rejects a figure with no source', () => {
    expect(parseFigure(validPayload({ source: undefined }))).toBeNull();
    expect(parseFigure(validPayload({ source: { label: 'GTEx' } }))).toBeNull();
  });

  it('rejects a non-http source url rather than rendering it as a link', () => {
    const payload = validPayload({
      source: { label: 'GTEx', url: 'javascript:alert(1)', retrievedAt: '' },
    });
    expect(parseFigure(payload)).toBeNull();
  });

  it('drops a malformed reference line instead of failing the figure', () => {
    const figure = parseFigure(validPayload({ reference: { label: 'median' } }));
    expect(figure).not.toBeNull();
    expect(figure!.reference).toBeUndefined();
  });

  it('keeps only string and finite-number params', () => {
    const figure = parseFigure(
      validPayload({ params: { gene: 'TACSTD2', bad: null, worse: Number.NaN, count: 3 } }),
    );
    expect(figure!.params).toEqual({ gene: 'TACSTD2', count: 3 });
  });
});
