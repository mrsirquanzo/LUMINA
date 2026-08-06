import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { FigureSpec } from '../../../../shared/figures.js';
import { FigureCard } from './FigureCard';

const FIGURE: FigureSpec = {
  plot: 'tissue_expression_bar',
  id: 'gtex:TACSTD2',
  title: 'TACSTD2 expression across normal tissues',
  subtitle: 'High normal-tissue expression narrows the off-tumor safety window.',
  params: { gene: 'TACSTD2', dataset: 'GTEx v8', tissues: 54 },
  unit: 'TPM',
  bars: [
    { label: 'Esophagus Mucosa', value: 1828.16 },
    { label: 'Skin Sun Exposed', value: 931.4 },
    { label: 'Lung', value: 158.82 },
  ],
  reference: { label: 'across-tissue median', value: 12.5 },
  stats: [
    { label: 'tissues', value: '54' },
    { label: 'highest', value: 'Esophagus Mucosa · 1,828.16 TPM' },
    { label: 'median', value: '12.5 TPM' },
  ],
  source: {
    label: 'GTEx v8 · median gene expression',
    url: 'https://gtexportal.org/home/gene/TACSTD2',
    retrievedAt: '2026-07-28T18:00:00.000Z',
  },
};

describe('FigureCard', () => {
  it('renders the title, subtitle, and the parameters the agent chose', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);

    expect(html).toContain('TACSTD2 expression across normal tissues');
    expect(html).toContain('narrows the off-tumor safety window');
    // Parameters are shown verbatim: what was asked of the data, not a caption.
    expect(html).toContain('gene: TACSTD2');
    expect(html).toContain('dataset: GTEx v8');
    expect(html).toContain('tissues: 54');
  });

  it('renders every statistic inside the figure rather than in surrounding prose', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);

    for (const stat of FIGURE.stats) {
      expect(html).toContain(stat.label);
      expect(html).toContain(stat.value);
    }
  });

  it('renders a traceable source link', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);

    expect(html).toContain('href="https://gtexportal.org/home/gene/TACSTD2"');
    expect(html).toContain('rel="noreferrer noopener"');
    expect(html).toContain('GTEx v8');
  });

  it('labels the reference line so a dashed rule is never unexplained', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);
    // The dashed rule is named in the legend; its VALUE lives in the stats row,
    // so the legend does not restate a number the reader already has.
    expect(html).toContain('across-tissue median');
    expect(html).toContain('log scale');
  });

  it('offers to expand when the distribution is longer than the resting view', () => {
    const long: FigureSpec = {
      ...FIGURE,
      bars: Array.from({ length: 54 }, (_, i) => ({ label: `Tissue ${i}`, value: 54 - i })),
    };
    const html = renderToStaticMarkup(<FigureCard figure={long} />);
    expect(html).toContain('Show all 54 tissues');
  });

  it('does not offer to expand a distribution that already fits', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);
    expect(html).not.toContain('Show all');
  });

  it('renders as a figure element with its caption, not a bare div', () => {
    const html = renderToStaticMarkup(<FigureCard figure={FIGURE} />);
    expect(html).toContain('<figure');
    expect(html).toContain('<figcaption');
  });
});
