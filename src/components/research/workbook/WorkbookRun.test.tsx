import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import comboScenarioData from '../../../lib/workbook/comboScenario.json';
import flowScenarioData from '../../../lib/workbook/flowScenario.json';
import westernScenarioData from '../../../lib/workbook/westernScenario.json';
import type { WorkbookRun as WorkbookRunData } from '../../../lib/workbook/types';
import { CapabilityCards } from '../CapabilityCards';
import { WorkbookReport } from './WorkbookReport';
import { WorkbookRun } from './WorkbookRun';

const comboScenario = comboScenarioData as WorkbookRunData;
const flowScenario = flowScenarioData as WorkbookRunData;
const westernScenario = westernScenarioData as WorkbookRunData;

describe('CapabilityCards', () => {
  it('renders the capabilities with their figures and honest actions', () => {
    const html = renderToStaticMarkup(<CapabilityCards onSelectWorkbook={() => undefined} />);

    // Available capabilities, in order: deep research, IHC, flow, western.
    expect(html).toContain('Deep target research');
    expect(html).toContain('/deep-research.png');
    expect(html).toContain('Start a report');
    expect(html).toContain('Flow cytometry analysis');
    expect(html).toContain('/workbook/flow/04_lineage.png');
    expect(html).toContain('Western blot analysis');
    expect(html).toContain('/workbook/western/annotated.png');
    expect(html).toContain('background-corrected densitometry');
    expect(html).toContain('Analyze blot');
    expect(html).toContain('IHC analysis');
    expect(html).toContain('/workbook/ihc/05_intensity_bins.png');
    expect(html).toContain('H-score and % positivity');
    // "Open workbook" is the action for both flow and IHC.
    expect(html.match(/Open workbook/g)?.length).toBeGreaterThanOrEqual(2);

    // Combination screening and patent extraction are both coming soon.
    expect(html).toContain('Combination drug screening');
    expect(html).toContain('/workbook/combo/fig_synergy_matrices.png');
    expect(html).toContain('Patent sequence extraction');
    expect(html).toContain('/patent-ip.png');
    expect(html.match(/Coming soon/g)).toHaveLength(2);
  });
});

describe('WorkbookRun', () => {
  it('frames the combination workbook with its biological goal and dataset context', () => {
    const html = renderToStaticMarkup(<WorkbookRun run={comboScenario} onBack={() => undefined} />);

    expect(html).toContain('Which drug combinations are synergistic in MALME-3M melanoma');
    expect(html).toContain('MALME-3M melanoma (NCI-60)');
    expect(html).toContain('everolimus (mTOR)');
    expect(html).toContain('romidepsin (HDAC)');
    expect(html).toContain('% inhibition on 8x8 dose-response grids');
  });

  it('falls back cleanly to the flow title and panel', () => {
    const html = renderToStaticMarkup(<WorkbookRun run={flowScenario} onBack={() => undefined} />);

    expect(html).toContain('Analyze flow cytometry data');
    expect(html).toContain('13-colour B-cell immunophenotyping');
  });

  it('frames the western blot workbook with its biological question and assay context', () => {
    const html = renderToStaticMarkup(<WorkbookRun run={westernScenario} onBack={() => undefined} />);

    expect(html).toContain('Does trastuzumab lower HER2 and drive compensatory HSP90');
    expect(html).toContain('HER2, HSP90, GAPDH loading control');
    expect(html).toContain('trastuzumab 0 / 25 / 50 ug/mL, 72 h');
    expect(html).toContain('band intensity (background-corrected integrated density)');
  });
});

describe('WorkbookReport western blot output', () => {
  it('renders the qualitative findings without combination-only hypotheses', () => {
    const html = renderToStaticMarkup(
      <WorkbookReport report={westernScenario.report} title="Western blot analysis report" />,
    );

    expect(html).toContain('HER2 decreases');
    expect(html).toContain('HSP90 increases');
    expect(html).toContain('Single blot (n=1)');
    expect(html).toContain('2 figures');
    expect(html).toContain('Detailed Answer');
    expect(html).toContain('Methods');
    expect(html).toContain('Assumptions Made');
    expect(html).not.toContain('Proposed hypotheses for wet-lab testing');
  });

  it('renders research claim citations as accessible evidence buttons', () => {
    const html = renderToStaticMarkup(
      <WorkbookReport
        report={westernScenario.report}
        contentSections={[{
          id: 'expression',
          title: 'Expression',
          content: 'Normal tissue baseline.',
          claims: [{ text: 'CDCP1 is tissue enhanced.', citations: ['HPA:CDCP1'] }],
        }]}
        references={[{
          id: 'HPA:CDCP1',
          source: 'Human Protein Atlas',
          title: 'CDCP1 expression and localization',
          url: 'https://www.proteinatlas.org/ENSG00000163814',
        }]}
      />,
    );

    expect(html).toContain('HPA:CDCP1');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-label="Review evidence HPA:CDCP1"');
  });
});

describe('WorkbookReport synergy ranking', () => {
  it('uses real HSA values and ordering when HSA is selected', () => {
    const html = renderToStaticMarkup(
      <WorkbookReport
        report={comboScenario.report}
        rankings={comboScenario.rankings}
        selectedSynergyModel="HSA (highest single agent)"
      />,
    );

    expect(html).toContain('SELECTED MODEL: HSA');
    expect(html).toContain('+11.2');
    expect(html).toContain('+8.9');
    expect(html).toContain('+2.8');
    expect(html.indexOf('Cladribine + Romidepsin')).toBeLessThan(html.indexOf('Gefitinib + Vismodegib'));
  });

  it('uses Bliss and explains the fallback for models not computed in the demo', () => {
    const html = renderToStaticMarkup(
      <WorkbookReport
        report={comboScenario.report}
        rankings={comboScenario.rankings}
        selectedSynergyModel="ZIP"
      />,
    );

    expect(html).toContain('Loewe/ZIP not computed in this demo - showing Bliss.');
    expect(html).toContain('data-ranking-model="bliss"');
    expect(html).toContain('+11.1');
  });
});
