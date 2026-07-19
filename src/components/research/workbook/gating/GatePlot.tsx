import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { useGating } from './gatingStore';
import { fieldIndexes, type FlowEvent, type FlowField, type GateState, type GatingStep } from './model';

const TEAL = '#2f9e8f';
const PAD = { left: 58, right: 18, top: 20, bottom: 48 };
const MIN_CANVAS_HEIGHT = 330;

type DragTarget = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'lo' | 'hi' | 'x' | 'y';

interface DragState {
  target: DragTarget;
  x: number;
  y: number;
  gates: GateState;
}

interface PlotGeometry {
  width: number;
  height: number;
  chartLeft: number;
  chartRight: number;
  chartTop: number;
  chartBottom: number;
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
function formatTick(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return `${Math.round(value / 1000)}k`;
  if (absolute >= 10) return Math.round(value).toString();
  return value.toFixed(1).replace(/\.0$/, '');
}

function axisLabel(field: FlowField) {
  return ({
    fscA: 'FSC-A', fscH: 'FSC-H', sscA: 'SSC-A', zombie: 'Zombie-NIR',
    cd3: 'CD3 (arcsinh)', cd19: 'CD19 (arcsinh)', igd: 'IgD (arcsinh)', cd27: 'CD27 (arcsinh)',
  } satisfies Record<FlowField, string>)[field];
}

function geometry(width: number, height: number): PlotGeometry {
  return {
    width,
    height,
    chartLeft: PAD.left,
    chartRight: width - PAD.right,
    chartTop: PAD.top,
    chartBottom: height - PAD.bottom,
  };
}

function dataToCanvas(value: number, range: [number, number], start: number, end: number) {
  return start + (value - range[0]) / (range[1] - range[0]) * (end - start);
}

function canvasToData(value: number, range: [number, number], start: number, end: number) {
  return range[0] + (value - start) / (end - start) * (range[1] - range[0]);
}

function drawAxes(
  context: CanvasRenderingContext2D,
  plot: PlotGeometry,
  xField: FlowField,
  yField: FlowField | undefined,
  xRange: [number, number],
  yRange: [number, number],
) {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, plot.width, plot.height);
  context.font = '10px Geist, Inter, sans-serif';
  context.lineWidth = 1;
  context.textAlign = 'center';
  context.textBaseline = 'top';

  for (let step = 0; step <= 4; step += 1) {
    const x = plot.chartLeft + (plot.chartRight - plot.chartLeft) * step / 4;
    const y = plot.chartBottom - (plot.chartBottom - plot.chartTop) * step / 4;
    context.strokeStyle = step === 0 ? '#cbd5e1' : '#eef2f7';
    context.beginPath();
    context.moveTo(x, plot.chartTop);
    context.lineTo(x, plot.chartBottom);
    context.stroke();
    context.beginPath();
    context.moveTo(plot.chartLeft, y);
    context.lineTo(plot.chartRight, y);
    context.stroke();
    context.fillStyle = '#64748b';
    context.fillText(formatTick(xRange[0] + (xRange[1] - xRange[0]) * step / 4), x, plot.chartBottom + 8);
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText(formatTick(yRange[0] + (yRange[1] - yRange[0]) * step / 4), plot.chartLeft - 8, y);
    context.textAlign = 'center';
    context.textBaseline = 'top';
  }

  context.fillStyle = '#334155';
  context.font = '11px Geist, Inter, sans-serif';
  context.fillText(axisLabel(xField), (plot.chartLeft + plot.chartRight) / 2, plot.height - 17);
  context.save();
  context.translate(14, (plot.chartTop + plot.chartBottom) / 2);
  context.rotate(-Math.PI / 2);
  context.textBaseline = 'top';
  context.fillText(yField ? axisLabel(yField) : 'Events', 0, 0);
  context.restore();
}

function drawPoints(
  context: CanvasRenderingContext2D,
  plot: PlotGeometry,
  events: FlowEvent[],
  xIndex: number,
  yIndex: number,
  xRange: [number, number],
  yRange: [number, number],
) {
  context.save();
  context.beginPath();
  context.rect(plot.chartLeft, plot.chartTop, plot.chartRight - plot.chartLeft, plot.chartBottom - plot.chartTop);
  context.clip();
  context.fillStyle = 'rgba(15, 23, 42, 0.16)';
  events.forEach((event) => {
    const x = dataToCanvas(event[xIndex], xRange, plot.chartLeft, plot.chartRight);
    const y = dataToCanvas(event[yIndex], yRange, plot.chartBottom, plot.chartTop);
    context.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
  });
  context.restore();
}

function gateEvents(step: GatingStep, cascade: NonNullable<ReturnType<typeof useGating>>['cascade']) {
  if (step.id === 'cell') return cascade.all;
  if (step.id === 'singlet') return cascade.cell;
  if (step.id === 'viability') return cascade.singlet;
  if (step.id === 'lineage') return cascade.live;
  return cascade.bCells;
}

export function GatePlot({ stepId }: { stepId: string }) {
  const gating = useGating();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingUpdate = useRef<((current: GateState) => GateState) | null>(null);
  const [size, setSize] = useState({ width: 680, height: 380 });

  const step = gating?.data.steps.find((candidate) => candidate.id === stepId);
  const scheduleGateUpdate = useCallback((update: (current: GateState) => GateState) => {
    if (!gating) return;
    pendingUpdate.current = update;
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      if (pendingUpdate.current) gating.setGates(pendingUpdate.current);
      pendingUpdate.current = null;
      frameRef.current = null;
    });
  }, [gating]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const update = () => {
      const width = Math.max(320, Math.floor(shell.clientWidth));
      setSize({ width, height: Math.max(MIN_CANVAS_HEIGHT, Math.min(430, Math.round(width * 0.56))) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const events = useMemo(() => gating && step ? gateEvents(step, gating.cascade) : [], [gating, step]);

  useEffect(() => {
    if (!gating || !step || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.width * ratio);
    canvas.height = Math.round(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const plot = geometry(size.width, size.height);
    const xRange = gating.data.display[step.x];
    const yField = step.y;
    const yRange: [number, number] = yField ? gating.data.display[yField] : [0, 1];
    const indexes = fieldIndexes(gating.data);
    let histogramCounts: number[] | null = null;
    if (step.kind === 'threshold') {
      histogramCounts = Array.from({ length: 48 }, () => 0);
      events.forEach((event) => {
        const position = clamp(Math.floor((event[indexes[step.x]] - xRange[0]) / (xRange[1] - xRange[0]) * histogramCounts!.length), 0, histogramCounts!.length - 1);
        histogramCounts![position] += 1;
      });
    }
    const histogramMaximum = histogramCounts ? Math.max(1, ...histogramCounts) : 1;
    drawAxes(context, plot, step.x, yField, xRange, histogramCounts ? [0, histogramMaximum] : yRange);

    if (step.kind === 'threshold' && histogramCounts) {
      const binWidth = (plot.chartRight - plot.chartLeft) / histogramCounts.length;
      histogramCounts.forEach((count, bin) => {
        const x = plot.chartLeft + bin * binWidth;
        const value = xRange[0] + (bin + 0.5) / histogramCounts!.length * (xRange[1] - xRange[0]);
        const barHeight = count / histogramMaximum * (plot.chartBottom - plot.chartTop);
        context.fillStyle = value < gating.gates.viability ? 'rgba(47, 158, 143, 0.58)' : 'rgba(100, 116, 139, 0.3)';
        context.fillRect(x + 0.5, plot.chartBottom - barHeight, Math.max(1, binWidth - 1), barHeight);
      });
      const thresholdX = dataToCanvas(gating.gates.viability, xRange, plot.chartLeft, plot.chartRight);
      context.strokeStyle = TEAL;
      context.lineWidth = 2;
      context.setLineDash([6, 4]);
      context.beginPath();
      context.moveTo(thresholdX, plot.chartTop);
      context.lineTo(thresholdX, plot.chartBottom);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = TEAL;
      context.font = '600 10px Geist, Inter, sans-serif';
      context.textAlign = thresholdX > plot.chartRight - 85 ? 'right' : 'left';
      context.fillText('live | dead', thresholdX + (thresholdX > plot.chartRight - 85 ? -6 : 6), plot.chartTop + 7);
      return;
    }

    if (!yField) return;
    if (step.kind === 'quadrant') {
      const thresholdX = step.id === 'lineage' ? gating.gates.lineage.cd3 : gating.gates.subsets.igd;
      const thresholdY = step.id === 'lineage' ? gating.gates.lineage.cd19 : gating.gates.subsets.cd27;
      const crossX = dataToCanvas(thresholdX, xRange, plot.chartLeft, plot.chartRight);
      const crossY = dataToCanvas(thresholdY, yRange, plot.chartBottom, plot.chartTop);
      if (step.id === 'lineage') {
        context.fillStyle = 'rgba(47, 158, 143, 0.1)';
        context.fillRect(plot.chartLeft, plot.chartTop, crossX - plot.chartLeft, crossY - plot.chartTop);
      } else {
        context.fillStyle = 'rgba(47, 158, 143, 0.055)';
        context.fillRect(crossX, crossY, plot.chartRight - crossX, plot.chartBottom - crossY);
      }
      drawPoints(context, plot, events, indexes[step.x], indexes[yField], xRange, yRange);
      context.strokeStyle = TEAL;
      context.lineWidth = 1.8;
      context.setLineDash([6, 4]);
      context.beginPath();
      context.moveTo(crossX, plot.chartTop);
      context.lineTo(crossX, plot.chartBottom);
      context.moveTo(plot.chartLeft, crossY);
      context.lineTo(plot.chartRight, crossY);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = '#334155';
      context.font = '600 10px Geist, Inter, sans-serif';
      if (step.id === 'lineage') {
        context.textAlign = 'left';
        context.fillText('CD3- CD19+ B cells', plot.chartLeft + 8, plot.chartTop + 8);
      } else {
        const labels = [
          { text: `Switched ${gating.metrics.subsets.switched.toFixed(1)}%`, x: plot.chartLeft + 8, y: plot.chartTop + 8, align: 'left' as const },
          { text: `Unswitched ${gating.metrics.subsets.unswitched.toFixed(1)}%`, x: plot.chartRight - 8, y: plot.chartTop + 8, align: 'right' as const },
          { text: `DN ${gating.metrics.subsets.doubleNegative.toFixed(1)}%`, x: plot.chartLeft + 8, y: plot.chartBottom - 18, align: 'left' as const },
          { text: `Naive ${gating.metrics.subsets.naive.toFixed(1)}%`, x: plot.chartRight - 8, y: plot.chartBottom - 18, align: 'right' as const },
        ];
        labels.forEach((label) => {
          context.textAlign = label.align;
          context.fillText(label.text, label.x, label.y);
        });
      }
      return;
    }

    drawPoints(context, plot, events, indexes[step.x], indexes[yField], xRange, yRange);
    context.strokeStyle = TEAL;
    context.fillStyle = 'rgba(47, 158, 143, 0.09)';
    context.lineWidth = 1.8;
    context.setLineDash([6, 4]);

    if (step.kind === 'rect-gate') {
      const left = dataToCanvas(gating.gates.cell.fscMin, xRange, plot.chartLeft, plot.chartRight);
      const right = dataToCanvas(gating.gates.cell.fscMax, xRange, plot.chartLeft, plot.chartRight);
      const top = dataToCanvas(gating.gates.cell.sscMax, yRange, plot.chartBottom, plot.chartTop);
      const bottom = dataToCanvas(gating.gates.cell.sscMin, yRange, plot.chartBottom, plot.chartTop);
      context.fillRect(left, top, right - left, bottom - top);
      context.strokeRect(left, top, right - left, bottom - top);
      context.setLineDash([]);
      context.fillStyle = TEAL;
      [[left, top], [right, top], [left, bottom], [right, bottom]].forEach(([x, y]) => context.fillRect(x - 4, y - 4, 8, 8));
    } else {
      const lo = gating.gates.singletRatio.lo;
      const hi = gating.gates.singletRatio.hi;
      const x0 = xRange[0];
      const x1 = xRange[1];
      const lineY = (slope: number, x: number) => dataToCanvas(slope * x, yRange, plot.chartBottom, plot.chartTop);
      context.save();
      context.beginPath();
      context.rect(plot.chartLeft, plot.chartTop, plot.chartRight - plot.chartLeft, plot.chartBottom - plot.chartTop);
      context.clip();
      context.beginPath();
      context.moveTo(plot.chartLeft, lineY(lo, x0));
      context.lineTo(plot.chartRight, lineY(lo, x1));
      context.lineTo(plot.chartRight, lineY(hi, x1));
      context.lineTo(plot.chartLeft, lineY(hi, x0));
      context.closePath();
      context.fill();
      [lo, hi].forEach((slope) => {
        context.beginPath();
        context.moveTo(plot.chartLeft, lineY(slope, x0));
        context.lineTo(plot.chartRight, lineY(slope, x1));
        context.stroke();
      });
      context.restore();
      context.setLineDash([]);
    }
  }, [events, gating, size, step]);

  if (!gating || !step) {
    return <div className="surface-inset t-meta min-h-44 animate-pulse p-4 text-textTertiary">Loading real event data...</div>;
  }

  const xRange = gating.data.display[step.x];
  const yRange = step.y ? gating.data.display[step.y] : [0, 1] as [number, number];
  const plot = geometry(size.width, size.height);
  const pointFromEvent = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const dataPoint = (x: number, y: number) => ({
    x: canvasToData(x, xRange, plot.chartLeft, plot.chartRight),
    y: canvasToData(y, yRange, plot.chartBottom, plot.chartTop),
  });

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    let target: DragTarget = 'x';
    if (step.kind === 'rect-gate') {
      const left = dataToCanvas(gating.gates.cell.fscMin, xRange, plot.chartLeft, plot.chartRight);
      const right = dataToCanvas(gating.gates.cell.fscMax, xRange, plot.chartLeft, plot.chartRight);
      const top = dataToCanvas(gating.gates.cell.sscMax, yRange, plot.chartBottom, plot.chartTop);
      const bottom = dataToCanvas(gating.gates.cell.sscMin, yRange, plot.chartBottom, plot.chartTop);
      const horizontal = Math.abs(point.x - left) < 11 ? 'w' : Math.abs(point.x - right) < 11 ? 'e' : '';
      const vertical = Math.abs(point.y - top) < 11 ? 'n' : Math.abs(point.y - bottom) < 11 ? 's' : '';
      target = `${vertical}${horizontal}` as DragTarget;
      if (!horizontal && !vertical) target = point.x > left && point.x < right && point.y > top && point.y < bottom ? 'move' : 'se';
    } else if (step.kind === 'ratio-band') {
      const value = dataPoint(point.x, point.y);
      const ratio = value.x === 0 ? 0 : value.y / value.x;
      target = Math.abs(ratio - gating.gates.singletRatio.lo) < Math.abs(ratio - gating.gates.singletRatio.hi) ? 'lo' : 'hi';
    } else if (step.kind === 'quadrant') {
      const thresholdX = step.id === 'lineage' ? gating.gates.lineage.cd3 : gating.gates.subsets.igd;
      const thresholdY = step.id === 'lineage' ? gating.gates.lineage.cd19 : gating.gates.subsets.cd27;
      const crossX = dataToCanvas(thresholdX, xRange, plot.chartLeft, plot.chartRight);
      const crossY = dataToCanvas(thresholdY, yRange, plot.chartBottom, plot.chartTop);
      target = Math.abs(point.x - crossX) <= Math.abs(point.y - crossY) ? 'x' : 'y';
    }
    dragRef.current = { target, x: point.x, y: point.y, gates: gating.gates };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointFromEvent(event);
    const current = dataPoint(point.x, point.y);
    const start = dataPoint(drag.x, drag.y);
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const minimumX = (xRange[1] - xRange[0]) * 0.025;
    const minimumY = (yRange[1] - yRange[0]) * 0.025;

    scheduleGateUpdate(() => {
      const next = { ...drag.gates };
      if (step.kind === 'rect-gate') {
        const cell = { ...drag.gates.cell };
        if (drag.target === 'move') {
          const width = cell.fscMax - cell.fscMin;
          const height = cell.sscMax - cell.sscMin;
          cell.fscMin = clamp(cell.fscMin + dx, xRange[0], xRange[1] - width);
          cell.fscMax = cell.fscMin + width;
          cell.sscMin = clamp(cell.sscMin + dy, yRange[0], yRange[1] - height);
          cell.sscMax = cell.sscMin + height;
        } else {
          if (drag.target.includes('w')) cell.fscMin = clamp(cell.fscMin + dx, xRange[0], cell.fscMax - minimumX);
          if (drag.target.includes('e')) cell.fscMax = clamp(cell.fscMax + dx, cell.fscMin + minimumX, xRange[1]);
          if (drag.target.includes('s')) cell.sscMin = clamp(cell.sscMin + dy, yRange[0], cell.sscMax - minimumY);
          if (drag.target.includes('n')) cell.sscMax = clamp(cell.sscMax + dy, cell.sscMin + minimumY, yRange[1]);
        }
        next.cell = cell;
      } else if (step.kind === 'ratio-band') {
        const ratio = clamp(current.x === 0 ? 0 : current.y / current.x, 0.02, 2);
        next.singletRatio = drag.target === 'lo'
          ? { ...drag.gates.singletRatio, lo: Math.min(ratio, drag.gates.singletRatio.hi - 0.02) }
          : { ...drag.gates.singletRatio, hi: Math.max(ratio, drag.gates.singletRatio.lo + 0.02) };
      } else if (step.kind === 'threshold') {
        next.viability = clamp(current.x, xRange[0], xRange[1]);
      } else if (step.id === 'lineage') {
        next.lineage = {
          cd3: drag.target === 'x' ? clamp(current.x, xRange[0], xRange[1]) : drag.gates.lineage.cd3,
          cd19: drag.target === 'y' ? clamp(current.y, yRange[0], yRange[1]) : drag.gates.lineage.cd19,
        };
      } else {
        next.subsets = {
          igd: drag.target === 'x' ? clamp(current.x, xRange[0], xRange[1]) : drag.gates.subsets.igd,
          cd27: drag.target === 'y' ? clamp(current.y, yRange[0], yRange[1]) : drag.gates.subsets.cd27,
        };
      }
      return next;
    });
  };

  const stopDragging = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1;
    const xNudge = (xRange[1] - xRange[0]) * (event.shiftKey ? 0.025 : 0.01) * direction;
    const yNudge = (yRange[1] - yRange[0]) * (event.shiftKey ? 0.025 : 0.01) * direction;
    gating.setGates((current) => {
      const next = { ...current };
      if (step.kind === 'rect-gate') {
        const cell = { ...current.cell };
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          const width = cell.fscMax - cell.fscMin;
          cell.fscMin = clamp(cell.fscMin + xNudge, xRange[0], xRange[1] - width);
          cell.fscMax = cell.fscMin + width;
        } else {
          const height = cell.sscMax - cell.sscMin;
          cell.sscMin = clamp(cell.sscMin + yNudge, yRange[0], yRange[1] - height);
          cell.sscMax = cell.sscMin + height;
        }
        next.cell = cell;
      } else if (step.kind === 'threshold') next.viability = clamp(current.viability + xNudge, xRange[0], xRange[1]);
      else if (step.kind === 'ratio-band') {
        const delta = direction * (event.shiftKey ? 0.025 : 0.01);
        next.singletRatio = { lo: clamp(current.singletRatio.lo + delta, 0.02, current.singletRatio.hi - 0.02), hi: current.singletRatio.hi };
      } else if (step.id === 'lineage') {
        next.lineage = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
          ? { ...current.lineage, cd3: clamp(current.lineage.cd3 + xNudge, xRange[0], xRange[1]) }
          : { ...current.lineage, cd19: clamp(current.lineage.cd19 + yNudge, yRange[0], yRange[1]) };
      } else {
        next.subsets = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
          ? { ...current.subsets, igd: clamp(current.subsets.igd + xNudge, xRange[0], xRange[1]) }
          : { ...current.subsets, cd27: clamp(current.subsets.cd27 + yNudge, yRange[0], yRange[1]) };
      }
      return next;
    });
  };

  const readout = step.id === 'cell'
    ? `Cell gate: ${gating.metrics.cellPct.toFixed(1)}% (~${gating.metrics.cellCount.toLocaleString()} of ${gating.metrics.total.toLocaleString()})`
    : step.id === 'singlet'
      ? `Singlets: ${gating.metrics.singletPct.toFixed(1)}% of gated`
      : step.id === 'viability'
        ? `Viable: ${gating.metrics.viabilityPct.toFixed(1)}%`
        : step.id === 'lineage'
          ? `B cells: ${gating.metrics.bCellLivePct.toFixed(1)}% of live (~${gating.metrics.bCellCount.toLocaleString()})`
          : `Naive ${gating.metrics.subsets.naive.toFixed(1)}% · Switched ${gating.metrics.subsets.switched.toFixed(1)}% · DN ${gating.metrics.subsets.doubleNegative.toFixed(1)}% · Unswitched ${gating.metrics.subsets.unswitched.toFixed(1)}%`;

  return (
    <section className="surface-inset overflow-hidden bg-white" data-gate-plot={step.id} aria-label={step.label}>
      <header className="flex flex-col gap-2 border-b border-borderSoft px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="t-eyebrow text-[#2f9e8f]">USER-DEFINED GATE · {events.length.toLocaleString()} EVENTS SHOWN</p>
          <p className="t-body-sm mt-1 font-mono font-semibold tabular-nums text-textPrimary" aria-live="polite">{readout}</p>
        </div>
        <button
          type="button"
          onClick={gating.resetGates}
          disabled={gating.isDefault}
          className="quiet-action t-meta inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 font-semibold text-textTertiary hover:bg-subtle hover:text-[#2f9e8f] disabled:cursor-default disabled:opacity-45"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
          Reset gates
        </button>
      </header>
      <div ref={shellRef} className="w-full bg-white">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="block max-w-full touch-none cursor-crosshair focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f9e8f] focus-visible:ring-inset"
          aria-label={`${step.label}. Drag the teal gate handles to adjust. Arrow keys nudge the active gate.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onKeyDown={onKeyDown}
        />
      </div>
      <p className="t-meta border-t border-borderSoft bg-subtle/45 px-3.5 py-2 text-textTertiary">
        Drag the teal boundary to set this gate. Downstream populations and the final report update together.
      </p>
    </section>
  );
}
