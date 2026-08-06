import { afterEach, describe, expect, it, vi } from 'vitest';
import { humanProteinAtlasTool, parseProteinTissuePanel } from './hpaTool.js';
import { setFigureSink } from './figureSink.js';
import type { FigureSpec } from '../../../shared/figures.js';

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

function textResponse(body: string, ok = true): Response {
  return { ok, status: ok ? 200 : 500, text: async () => body } as Response;
}

// Shaped like a real HPA record, trimmed to the parts the panel reads.
// Deliberately includes the two traps: a non-IHC assay block that must be
// ignored, and a tissue scored "not detected" whose cell type scores "high".
const HPA_XML = `<?xml version="1.0" encoding="UTF-8"?>
<proteinAtlas>
  <entry>
    <tissueExpression assayType="tissue" technology="RNA">
      <summary>RNA block that must not be read as protein.</summary>
      <data>
        <tissue organ="Bone marrow &amp; lymphoid tissues">Bone marrow</tissue>
        <level type="expression">high</level>
      </data>
    </tissueExpression>
    <tissueExpression assayType="cancer" technology="IHC">
      <summary>Cancer block that must not be read as normal tissue.</summary>
      <data>
        <tissue organ="Cancer">Breast cancer</tissue>
        <level type="expression">high</level>
      </data>
    </tissueExpression>
    <tissueExpression assayType="tissue" technology="IHC">
      <summary>Abundant expression in squamous epithelia.</summary>
      <verification type="reliability">enhanced</verification>
      <data>
        <tissue organ="Liver &amp; Gallbladder">Liver</tissue>
        <level type="expression">not detected</level>
        <tissueCell>
          <cellType>Hepatocytes</cellType>
          <level type="expression">high</level>
        </tissueCell>
      </data>
      <data>
        <tissue organ="Skin">Skin 1</tissue>
        <level type="expression">high</level>
        <tissueCell>
          <cellType>Keratinocytes</cellType>
          <level type="expression">high</level>
        </tissueCell>
      </data>
      <data>
        <tissue organ="Proximal digestive tract">Esophagus</tissue>
        <level type="expression">medium</level>
      </data>
      <data>
        <tissue organ="Kidney &amp; urinary bladder">Kidney</tissue>
        <level type="expression">low</level>
      </data>
    </tissueExpression>
  </entry>
</proteinAtlas>`;

/** Route by URL so the JSON search and the XML entry can be mocked together. */
function hpaFetch(options: { xml?: string | null } = {}): typeof fetch {
  return vi.fn(async (url: string) => {
    if (String(url).endsWith('.xml')) {
      if (options.xml === null) throw new Error('xml unavailable');
      return textResponse(options.xml ?? HPA_XML);
    }
    return jsonResponse([HPA_RECORD]);
  }) as unknown as typeof fetch;
}

afterEach(() => {
  setFigureSink(null);
});

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

describe('parseProteinTissuePanel', () => {
  it('reads the IHC normal-tissue block and ignores the other assays', () => {
    const panel = parseProteinTissuePanel(HPA_XML)!;
    expect(panel.levels.map((row) => row.label)).not.toContain('Bone marrow');
    expect(panel.levels.map((row) => row.label)).not.toContain('Breast cancer');
    expect(panel.levels).toHaveLength(4);
    expect(panel.reliability).toBe('enhanced');
    expect(panel.summary).toBe('Abundant expression in squamous epithelia.');
  });

  it('scores the tissue, not the first cell type inside it', () => {
    const panel = parseProteinTissuePanel(HPA_XML)!;
    const liver = panel.levels.find((row) => row.label === 'Liver')!;
    // Hepatocytes stain high; the tissue as a whole is not detected. Reading
    // the cell-type score here would overstate off-tumor liver exposure.
    expect(liver.level).toBe('not detected');
  });

  it('sorts strongest staining first so the risk tissues lead', () => {
    const panel = parseProteinTissuePanel(HPA_XML)!;
    expect(panel.levels.map((row) => row.level)).toEqual([
      'high',
      'medium',
      'low',
      'not detected',
    ]);
  });

  it('keeps the organ system for context', () => {
    const panel = parseProteinTissuePanel(HPA_XML)!;
    expect(panel.levels[0]).toEqual({ label: 'Skin 1', organ: 'Skin', level: 'high' });
  });

  it('returns null when there is no IHC normal-tissue block', () => {
    expect(parseProteinTissuePanel('<proteinAtlas><entry/></proteinAtlas>')).toBeNull();
  });
});

describe('humanProteinAtlasTool protein figure', () => {
  it('emits the antibody-scored tissue panel as a figure', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    await humanProteinAtlasTool.call({ symbol: 'CDCP1' }, hpaFetch());

    expect(figures).toHaveLength(1);
    const figure = figures[0];
    if (figure.plot !== 'protein_tissue_levels') throw new Error('wrong variant');
    expect(figure.id).toBe('hpa:CDCP1');
    expect(figure.levels).toHaveLength(4);
    expect(figure.stats).toContainEqual({ label: 'detected', value: '3/4' });
    expect(figure.stats).toContainEqual({ label: 'medium+', value: '2' });
    expect(figure.source.note).toBe('antibody reliability enhanced');
    // An "enhanced" grade is trustworthy, so nothing is flagged.
    expect(figure.caveat).toBeUndefined();
  });

  it('flags a weak antibody reliability grade on the figure itself', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    const weak = HPA_XML.replace('>enhanced<', '>uncertain<');
    await humanProteinAtlasTool.call({ symbol: 'CDCP1' }, hpaFetch({ xml: weak }));

    expect(figures[0].caveat).toContain('uncertain');
    expect(figures[0].caveat).toContain('indicative, not settled');
  });

  it('folds the panel into the snippet so a text-only reader loses nothing', async () => {
    const evidence = await humanProteinAtlasTool.call({ symbol: 'CDCP1' }, hpaFetch());
    expect(evidence[0].snippet).toContain('detected in 3/4 normal tissues');
    expect(evidence[0].snippet).toContain('medium or high in 2');
    expect(evidence[0].snippet).toContain('reliability enhanced');
  });

  it('still returns the primary evidence when the XML record is unavailable', async () => {
    const figures: FigureSpec[] = [];
    setFigureSink((figure) => figures.push(figure));

    const evidence = await humanProteinAtlasTool.call({ symbol: 'CDCP1' }, hpaFetch({ xml: null }));

    // The figure is a bonus round trip; losing it must not lose the HPA call.
    expect(figures).toEqual([]);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].id).toBe('HPA:CDCP1');
    expect(evidence[0].snippet).toContain('Tissue enhanced');
  });
});
