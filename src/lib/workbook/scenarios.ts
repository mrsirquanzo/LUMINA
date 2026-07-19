import comboScenarioData from './comboScenario.json';
import flowScenarioData from './flowScenario.json';
import westernScenarioData from './westernScenario.json';
import type { WorkbookRun } from './types';

const scenarios = [comboScenarioData, flowScenarioData, westernScenarioData] as WorkbookRun[];

const byCapability = new Map(scenarios.map((scenario) => [scenario.capability, scenario]));
const byScenarioId = new Map<string, WorkbookRun>([
  ['combination-screening', comboScenarioData as WorkbookRun],
  ['flow', flowScenarioData as WorkbookRun],
  ['western-blot', westernScenarioData as WorkbookRun],
]);

export function getWorkbookByCapability(capability: string): WorkbookRun | undefined {
  return byCapability.get(capability);
}

export function getWorkbookScenario(capability: string, scenarioId?: string): WorkbookRun | undefined {
  return (scenarioId ? byScenarioId.get(scenarioId) : undefined) ?? getWorkbookByCapability(capability);
}
