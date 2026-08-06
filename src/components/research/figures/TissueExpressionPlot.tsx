import { useMemo, useState } from 'react';
import type { TissueExpressionFigure } from '../../../../shared/figures.js';

/**
 * Expression across tissues, drawn as a dot plot on a log axis.
 *
 * Both choices are forced by the data rather than taste. A target like TACSTD2
 * spans ~0.2 to ~1400 TPM across GTEx tissues: on a linear axis every tissue
 * below the top handful collapses into the axis and the distribution the reader
 * needs - where the safety window actually sits - becomes invisible. And bars
 * on a log axis encode a ratio to an arbitrary baseline, so the mark is a dot
 * with a light connector, which is how GTEx and the Human Protein Atlas draw
 * the same measurement.
 */

const COLLAPSED_ROWS = 8;
const ROW_HEIGHT = 19;
const LABEL_WIDTH = 132;
const LABEL_GUTTER = 8;
// Geist at 10px averages a little over 5px per character. Budgeting slightly
// wide keeps a long GTEx tissue name inside the label column instead of letting
// it run off the left edge of the card.
const LABEL_CHAR_WIDTH = 5.8;
const PLOT_RIGHT_PAD = 8;
const AXIS_HEIGHT = 18;
const DOT_RADIUS = 3;
// Zero and sub-floor values would run to negative infinity on a log axis.
const FLOOR_TPM = 0.1;

const INK = '#0F172A';
const MUTED = '#5F6D80';
const RULE = '#E6EBF2';
const ACCENT = 'rgb(29 78 216)';

function formatValue(value: number): string {
  if (value >= 100) return Math.round(value).toLocaleString('en-US');
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

function formatTick(value: number): string {
  return value >= 1000 ? `${value / 1000}k` : String(value);
}

const MAX_LABEL_CHARS = Math.floor((LABEL_WIDTH - LABEL_GUTTER) / LABEL_CHAR_WIDTH);

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS
    ? `${label.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…`
    : label;
}

/** Powers of ten spanning the domain, so the axis reads 0.1 / 1 / 10 / 100 / 1k. */
function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const start = Math.floor(Math.log10(min));
  const end = Math.ceil(Math.log10(max));
  for (let power = start; power <= end; power += 1) {
    const tick = 10 ** power;
    if (tick >= min && tick <= max) ticks.push(tick);
  }
  return ticks;
}

interface Props {
  figure: TissueExpressionFigure;
  /** Plot width in px. The trail column is fixed, so this is measured by the caller. */
  width?: number;
}

export function TissueExpressionPlot({ figure, width = 300 }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = figure.bars.length - COLLAPSED_ROWS;
  const isTruncatable = hiddenCount > 0;
  const rows = useMemo(
    () => (expanded || !isTruncatable ? figure.bars : figure.bars.slice(0, COLLAPSED_ROWS)),
    [expanded, isTruncatable, figure.bars],
  );

  // Scale over the WHOLE distribution, not the visible slice, so expanding the
  // plot does not silently rescale the dots the reader was just looking at.
  const { toX, ticks, plotWidth } = useMemo(() => {
    const values = figure.bars.map((bar) => Math.max(bar.value, FLOOR_TPM));
    const min = Math.min(...values, FLOOR_TPM);
    const max = Math.max(...values, min * 10);
    const inner = Math.max(80, width - LABEL_WIDTH - PLOT_RIGHT_PAD);
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const span = logMax - logMin || 1;
    return {
      plotWidth: inner,
      ticks: logTicks(min, max),
      toX: (value: number) =>
        ((Math.log10(Math.max(value, FLOOR_TPM)) - logMin) / span) * inner,
    };
  }, [figure.bars, width]);

  const plotHeight = rows.length * ROW_HEIGHT;
  const referenceValue = figure.reference?.value;

  return (
    <div>
      <svg
        width={width}
        height={plotHeight + AXIS_HEIGHT}
        role="img"
        aria-label={`${figure.title}. ${rows.length} of ${figure.bars.length} tissues shown, log scale, ${figure.unit}.`}
      >
        <g transform={`translate(${LABEL_WIDTH}, 0)`}>
          {/* Gridlines at each power of ten */}
          {ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={toX(tick)}
              x2={toX(tick)}
              y1={0}
              y2={plotHeight}
              stroke={RULE}
              strokeWidth={1}
            />
          ))}

          {referenceValue !== undefined && (
            <line
              x1={toX(referenceValue)}
              x2={toX(referenceValue)}
              y1={0}
              y2={plotHeight}
              stroke={MUTED}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {rows.map((row, index) => {
            const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
            const x = toX(row.value);
            return (
              <g key={row.label}>
                <title>{`${row.label}: ${formatValue(row.value)} ${figure.unit}`}</title>
                <line x1={0} x2={x} y1={y} y2={y} stroke={RULE} strokeWidth={1} />
                <circle cx={x} cy={y} r={DOT_RADIUS} fill={ACCENT} />
              </g>
            );
          })}

          {/* Axis */}
          <line
            x1={0}
            x2={plotWidth}
            y1={plotHeight}
            y2={plotHeight}
            stroke={RULE}
            strokeWidth={1}
          />
          {ticks.map((tick) => (
            <text
              key={`tick-${tick}`}
              x={toX(tick)}
              y={plotHeight + 12}
              textAnchor="middle"
              fontSize={9}
              fill={MUTED}
            >
              {formatTick(tick)}
            </text>
          ))}
        </g>

        {/* Tissue labels. The full name stays reachable on hover when truncated. */}
        {rows.map((row, index) => (
          <text
            key={`label-${row.label}`}
            x={LABEL_WIDTH - LABEL_GUTTER}
            y={index * ROW_HEIGHT + ROW_HEIGHT / 2 + 3}
            textAnchor="end"
            fontSize={10}
            fill={INK}
          >
            <title>{row.label}</title>
            {truncateLabel(row.label)}
          </text>
        ))}
      </svg>

      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="t-meta whitespace-nowrap text-textTertiary">
          {figure.unit} · log scale
          {figure.reference && (
            <>
              {' · '}
              <span className="inline-block h-px w-3 translate-y-[-3px] border-t border-dashed border-textTertiary" aria-hidden="true" />
              {` ${figure.reference.label}`}
            </>
          )}
        </span>

        {isTruncatable && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="t-meta flex-none font-medium text-primary underline-offset-2 hover:underline"
          >
            {expanded ? `Show top ${COLLAPSED_ROWS}` : `Show all ${figure.bars.length} tissues`}
          </button>
        )}
      </div>
    </div>
  );
}
