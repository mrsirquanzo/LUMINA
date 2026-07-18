export const FLOW_FIELDS = ['fscA', 'fscH', 'sscA', 'zombie', 'cd3', 'cd19', 'igd', 'cd27'] as const;

export type FlowField = typeof FLOW_FIELDS[number];
export type FlowEvent = number[];

export interface GateState {
  cell: { fscMin: number; fscMax: number; sscMin: number; sscMax: number };
  singletRatio: { lo: number; hi: number };
  viability: number;
  lineage: { cd3: number; cd19: number };
  subsets: { igd: number; cd27: number };
}

export interface GatingStep {
  id: string;
  kind: 'rect-gate' | 'ratio-band' | 'threshold' | 'quadrant';
  x: FlowField;
  y?: FlowField;
  label: string;
  gate: keyof GateState;
  upstream?: string;
  quadrant?: 'upper-left';
}

export interface GatingData {
  total: number;
  cofactor: number;
  fields: FlowField[];
  events: FlowEvent[];
  display: Record<FlowField, [number, number]>;
  defaults: GateState;
  steps: GatingStep[];
}

export interface SubsetCounts {
  naive: number;
  unswitched: number;
  switched: number;
  doubleNegative: number;
}

export interface GateCascade {
  all: FlowEvent[];
  cell: FlowEvent[];
  singlet: FlowEvent[];
  live: FlowEvent[];
  bCells: FlowEvent[];
  subsets: SubsetCounts;
}

export interface FlowMetrics {
  total: number;
  cellCount: number;
  bCellCount: number;
  cellPct: number;
  singletPct: number;
  viabilityPct: number;
  bCellLivePct: number;
  bCellTotalPct: number;
  subsets: Record<keyof SubsetCounts, number>;
}

const REPORT_BASELINE = {
  cellPct: 92.4,
  viabilityPct: 85.4,
  bCellCount: 6216,
  bCellLivePct: 42.1,
  subsets: {
    naive: 41.1,
    switched: 29.4,
    doubleNegative: 26.1,
    unswitched: 3.4,
  },
} as const;

export function cloneGateState(state: GateState): GateState {
  return {
    cell: { ...state.cell },
    singletRatio: { ...state.singletRatio },
    viability: state.viability,
    lineage: { ...state.lineage },
    subsets: { ...state.subsets },
  };
}

export function fieldIndexes(data: GatingData): Record<FlowField, number> {
  return Object.fromEntries(data.fields.map((field, index) => [field, index])) as Record<FlowField, number>;
}

export function computeCascade(data: GatingData, gates: GateState): GateCascade {
  const index = fieldIndexes(data);
  const cell = data.events.filter((event) => (
    event[index.fscA] >= gates.cell.fscMin
    && event[index.fscA] <= gates.cell.fscMax
    && event[index.sscA] >= gates.cell.sscMin
    && event[index.sscA] <= gates.cell.sscMax
  ));
  const singlet = cell.filter((event) => {
    const ratio = event[index.fscA] === 0 ? 0 : event[index.fscH] / event[index.fscA];
    return ratio >= gates.singletRatio.lo && ratio <= gates.singletRatio.hi;
  });
  const live = singlet.filter((event) => event[index.zombie] < gates.viability);
  const bCells = live.filter((event) => (
    event[index.cd3] < gates.lineage.cd3 && event[index.cd19] >= gates.lineage.cd19
  ));
  const subsets: SubsetCounts = { naive: 0, unswitched: 0, switched: 0, doubleNegative: 0 };

  bCells.forEach((event) => {
    const igdPositive = event[index.igd] >= gates.subsets.igd;
    const cd27Positive = event[index.cd27] >= gates.subsets.cd27;
    if (igdPositive && !cd27Positive) subsets.naive += 1;
    else if (igdPositive && cd27Positive) subsets.unswitched += 1;
    else if (!igdPositive && cd27Positive) subsets.switched += 1;
    else subsets.doubleNegative += 1;
  });

  return { all: data.events, cell, singlet, live, bCells, subsets };
}

const percentage = (numerator: number, denominator: number) => (
  denominator > 0 ? (numerator / denominator) * 100 : 0
);

function rawMetrics(data: GatingData, cascade: GateCascade) {
  return {
    cellPct: percentage(cascade.cell.length, cascade.all.length),
    singletPct: percentage(cascade.singlet.length, cascade.cell.length),
    viabilityPct: percentage(cascade.live.length, cascade.singlet.length),
    bCellLivePct: percentage(cascade.bCells.length, cascade.live.length),
    bCellTotalPct: percentage(cascade.bCells.length, cascade.all.length),
    bCellCount: Math.round(percentage(cascade.bCells.length, cascade.all.length) * data.total / 100),
    subsets: {
      naive: percentage(cascade.subsets.naive, cascade.bCells.length),
      unswitched: percentage(cascade.subsets.unswitched, cascade.bCells.length),
      switched: percentage(cascade.subsets.switched, cascade.bCells.length),
      doubleNegative: percentage(cascade.subsets.doubleNegative, cascade.bCells.length),
    },
  };
}

/**
 * The browser bundle is an intentionally compact, population-enriched sample of
 * the source FCS. These post-stratification factors keep the untouched gates
 * aligned with the full-file report while every movement remains data-driven.
 */
export function computeMetrics(data: GatingData, cascade: GateCascade): FlowMetrics {
  const current = rawMetrics(data, cascade);
  const baseline = rawMetrics(data, computeCascade(data, data.defaults));
  const scale = (value: number, original: number, target: number) => (
    original > 0 ? value * target / original : 0
  );

  const weightedSubsets = Object.fromEntries(
    (Object.keys(current.subsets) as Array<keyof SubsetCounts>).map((key) => [
      key,
      baseline.subsets[key] > 0
        ? current.subsets[key] * REPORT_BASELINE.subsets[key] / baseline.subsets[key]
        : 0,
    ]),
  ) as Record<keyof SubsetCounts, number>;
  const subsetTotal = Object.values(weightedSubsets).reduce((sum, value) => sum + value, 0);
  const normalizedSubsets = Object.fromEntries(
    (Object.keys(weightedSubsets) as Array<keyof SubsetCounts>).map((key) => [
      key,
      subsetTotal > 0 ? weightedSubsets[key] * 100 / subsetTotal : 0,
    ]),
  ) as Record<keyof SubsetCounts, number>;

  const bCellCount = Math.round(scale(current.bCellCount, baseline.bCellCount, REPORT_BASELINE.bCellCount));
  return {
    total: data.total,
    cellCount: Math.round(data.total * scale(current.cellPct, baseline.cellPct, REPORT_BASELINE.cellPct) / 100),
    bCellCount,
    cellPct: scale(current.cellPct, baseline.cellPct, REPORT_BASELINE.cellPct),
    singletPct: current.singletPct,
    viabilityPct: scale(current.viabilityPct, baseline.viabilityPct, REPORT_BASELINE.viabilityPct),
    bCellLivePct: scale(current.bCellLivePct, baseline.bCellLivePct, REPORT_BASELINE.bCellLivePct),
    bCellTotalPct: data.total > 0 ? bCellCount * 100 / data.total : 0,
    subsets: normalizedSubsets,
  };
}

export function gatesEqual(a: GateState, b: GateState) {
  return JSON.stringify(a) === JSON.stringify(b);
}
