import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import comboScenarioData from '../../../lib/workbook/comboScenario.json';
import flowScenarioData from '../../../lib/workbook/flowScenario.json';
import type { WorkbookRun as WorkbookRunData } from '../../../lib/workbook/types';
import { WorkbookReport } from './WorkbookReport';
import { WorkbookRun } from './WorkbookRun';

const comboScenario = comboScenarioData as WorkbookRunData;
const flowScenario = flowScenarioData as WorkbookRunData;

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
