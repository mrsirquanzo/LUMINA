import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ResearchDossier from './ResearchDossier';
import type { BriefingView } from '../../lib/research/sseTypes';

const FIGURE = {
  plot: 'tissue_expression_bar' as const,
  id: 'gtex:TACSTD2',
  title: 'TACSTD2 expression across normal tissues',
  params: { gene: 'TACSTD2' },
  unit: 'TPM',
  bars: [{ label: 'Esophagus Mucosa', value: 1419.1 }],
  stats: [{ label: 'max', value: '1,419 TPM' }],
  source: {
    label: 'GTEx v8 · median gene expression',
    url: 'https://gtexportal.org/home/gene/TACSTD2',
    retrievedAt: '2026-07-28T18:00:00.000Z',
  },
};

const BRIEFING: BriefingView = {
  target: 'TROP2',
  executiveRead: 'Executive summary text.',
  sections: [{ id: 'biology', title: 'Target biology', takeaway: 'Strong expression.' }],
};

describe('ResearchDossier figures', () => {
  it('renders figures carried on the finished briefing', () => {
    const html = renderToStaticMarkup(
      <ResearchDossier briefing={{ ...BRIEFING, figures: [FIGURE] }} />,
    );
    expect(html).toContain('Figures');
    expect(html).toContain('TACSTD2 expression across normal tissues');
    expect(html).toContain('gtexportal.org');
  });

  it('renders no figures block when the run produced none', () => {
    const html = renderToStaticMarkup(<ResearchDossier briefing={BRIEFING} />);
    expect(html).not.toContain('>Figures<');
  });

  it('drops a stored figure this build can no longer draw, keeping the report', () => {
    const html = renderToStaticMarkup(
      <ResearchDossier
        briefing={{
          ...BRIEFING,
          // Written by a future/older build: a plot type this one does not know.
          figures: [{ ...FIGURE, plot: 'volcano' } as never, FIGURE],
        }}
      />,
    );
    expect(html).toContain('Executive summary text.');
    expect(html).toContain('TACSTD2 expression across normal tissues');
    // Exactly one card survived, not two.
    expect(html.split('gtexportal.org').length - 1).toBe(1);
  });
});
