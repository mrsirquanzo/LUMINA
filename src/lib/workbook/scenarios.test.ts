import { describe, expect, it } from 'vitest';
import { getWorkbookScenario } from './scenarios.js';

describe('workbook scenario registry', () => {
  it.each([
    ['western-blot', 'western-blot', 'BT474_trastuzumab_blot.png'],
    ['flow-cytometry', 'flow', 'A02 Well - A02 WLSM.fcs'],
    ['combination-screening', 'combination-screening', 'drug_combination_testing_data.xlsx'],
  ])('resolves %s with %s to the real workbook', (capability, scenarioId, fileName) => {
    expect(getWorkbookScenario(capability, scenarioId)?.file.name).toBe(fileName);
  });
});
