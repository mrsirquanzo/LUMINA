import { describe, expect, it } from 'vitest';
import gatingData from '../../../../../public/workbook/flow/gating_events.json';
import { cloneGateState, computeCascade, computeMetrics, type GatingData } from './model';

const data = gatingData as GatingData;

describe('flow gate cascade', () => {
  it('reproduces the full-file baseline from the compact event sample', () => {
    const cascade = computeCascade(data, data.defaults);
    const metrics = computeMetrics(data, cascade);

    expect(metrics.cellPct).toBeCloseTo(92.4, 5);
    expect(metrics.bCellCount).toBe(6216);
    expect(metrics.subsets.naive).toBeCloseTo(41.1, 5);
    expect(cascade.cell.length).toBeLessThan(cascade.all.length);
    expect(cascade.bCells.length).toBeLessThan(cascade.live.length);
  });

  it('cascades an upstream cell gate into every downstream population', () => {
    const defaults = computeCascade(data, data.defaults);
    const narrowed = cloneGateState(data.defaults);
    narrowed.cell.fscMax = 260_000;
    const cascade = computeCascade(data, narrowed);

    expect(cascade.cell.length).toBeLessThan(defaults.cell.length);
    expect(cascade.singlet.length).toBeLessThan(defaults.singlet.length);
    expect(cascade.live.length).toBeLessThan(defaults.live.length);
    expect(cascade.bCells.length).toBeLessThan(defaults.bCells.length);
    expect(computeMetrics(data, cascade).bCellCount).toBeLessThan(6216);
  });

  it('updates subset percentages when the subset crosshair changes', () => {
    const shifted = cloneGateState(data.defaults);
    shifted.subsets.igd += 0.8;
    const metrics = computeMetrics(data, computeCascade(data, shifted));

    expect(metrics.subsets.naive).not.toBeCloseTo(41.1, 1);
    expect(Object.values(metrics.subsets).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 5);
  });
});
