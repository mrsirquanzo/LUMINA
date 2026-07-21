import comboScenarioData from './comboScenario.json';
import flowScenarioData from './flowScenario.json';
import ihcScenarioData from './ihcScenario.json';
import westernScenarioData from './westernScenario.json';
import type { WorkbookRun } from './types';

const scenarios = [comboScenarioData, flowScenarioData, ihcScenarioData, westernScenarioData] as WorkbookRun[];

const byCapability = new Map(scenarios.map((scenario) => [scenario.capability, scenario]));
const byScenarioId = new Map<string, WorkbookRun>([
  ['combination-screening', comboScenarioData as WorkbookRun],
  ['flow', flowScenarioData as WorkbookRun],
  ['ihc', ihcScenarioData as WorkbookRun],
  ['western-blot', westernScenarioData as WorkbookRun],
]);

export function getWorkbookByCapability(capability: string): WorkbookRun | undefined {
  return byCapability.get(capability);
}

export function getWorkbookScenario(capability: string, scenarioId?: string): WorkbookRun | undefined {
  return (scenarioId ? byScenarioId.get(scenarioId) : undefined) ?? getWorkbookByCapability(capability);
}
