import { useMemo, useState } from 'react';
import {
  PROTEIN_LEVELS,
  type ProteinLevel,
  type ProteinTissueLevelsFigure,
} from '../../../../shared/figures.js';

/**
 * Antibody-scored protein level per tissue.
 *
 * Drawn on an ORDINAL axis with four named positions rather than a numeric
 * one. A pathologist scored each slide into one of four buckets; spacing them
 * as though "high" were some measured multiple of "low" would invent a
 * precision the assay never had.
 */

const COLLAPSED_ROWS = 8;
const ROW_HEIGHT = 19;
const LABEL_WIDTH = 132;
const LABEL_GUTTER = 8;
const LABEL_CHAR_WIDTH = 5.8;
const PLOT_RIGHT_PAD = 24;
const AXIS_HEIGHT = 18;

const INK = 'rgba(0,0,0,0.95)';
const MUTED = '#615d59';
const RULE = '#e6e6e6';

// One hue, four steps. Ordinal data gets an ordinal ramp, not four unrelated
// colors that would read as four unrelated categories.
const LEVEL_FILL: Record<ProteinLevel, string> = {
  'not detected': '#FFFFFF',
  low: 'rgba(0, 117, 222, 0.32)',
  medium: 'rgba(0, 117, 222, 0.64)',
  high: 'rgb(0 117 222)',
};

const LEVEL_TICK: Record<ProteinLevel, string> = {
  'not detected': 'none',
  low: 'low',
  medium: 'med',
  high: 'high',
};

const MAX_LABEL_CHARS = Math.floor((LABEL_WIDTH - LABEL_GUTTER) / LABEL_CHAR_WIDTH);

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS
    ? `${label.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…`
    : label;
}

interface Props {
  figure: ProteinTissueLevelsFigure;
  width?: number;
}

export function ProteinTissueLevels({ figure, width = 300 }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = figure.levels.length - COLLAPSED_ROWS;
  const isTruncatable = hiddenCount > 0;
  const rows = useMemo(
    () => (expanded || !isTruncatable ? figure.levels : figure.levels.slice(0, COLLAPSED_ROWS)),
    [expanded, isTruncatable, figure.levels],
  );

  const plotWidth = Math.max(80, width - LABEL_WIDTH - PLOT_RIGHT_PAD);
  const step = plotWidth / (PROTEIN_LEVELS.length - 1);
  const plotHeight = rows.length * ROW_HEIGHT;

  return (
    <div>
      <svg
        width={width}
        height={plotHeight + AXIS_HEIGHT}
        role="img"
        aria-label={`${figure.title}. ${rows.length} of ${figure.levels.length} tissues shown, scored none / low / medium / high.`}
      >
        <g transform={`translate(${LABEL_WIDTH}, 0)`}>
          {PROTEIN_LEVELS.map((level, index) => (
            <line
              key={`grid-${level}`}
              x1={index * step}
              x2={index * step}
              y1={0}
              y2={plotHeight}
              stroke={RULE}
              strokeWidth={1}
            />
          ))}

          {rows.map((row, rowIndex) => {
            const y = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
            const x = PROTEIN_LEVELS.indexOf(row.level) * step;
            return (
              <g key={row.label}>
                <title>
                  {`${row.label}${row.organ ? ` (${row.organ})` : ''}: ${row.level}`}
                </title>
                <line x1={0} x2={x} y1={y} y2={y} stroke={RULE} strokeWidth={1} />
                <circle
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill={LEVEL_FILL[row.level]}
                  stroke={row.level === 'not detected' ? MUTED : 'none'}
                  strokeWidth={1}
                />
              </g>
            );
          })}

          <line x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} stroke={RULE} strokeWidth={1} />
          {PROTEIN_LEVELS.map((level, index) => (
            <text
              key={`tick-${level}`}
              x={index * step}
              y={plotHeight + 12}
              textAnchor="middle"
              fontSize={9}
              fill={MUTED}
            >
              {LEVEL_TICK[level]}
            </text>
          ))}
        </g>

        {rows.map((row, rowIndex) => (
          <text
            key={`label-${row.label}`}
            x={LABEL_WIDTH - LABEL_GUTTER}
            y={rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 + 3}
            textAnchor="end"
            fontSize={10}
            fill={INK}
          >
            <title>{row.organ ? `${row.label} · ${row.organ}` : row.label}</title>
            {truncateLabel(row.label)}
          </text>
        ))}
      </svg>

      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="t-meta whitespace-nowrap text-textTertiary">
          IHC staining intensity · ordinal
        </span>

        {isTruncatable && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="t-meta flex-none font-medium text-primary underline-offset-2 hover:underline"
          >
            {expanded ? `Show top ${COLLAPSED_ROWS}` : `Show all ${figure.levels.length} tissues`}
          </button>
        )}
      </div>
    </div>
  );
}
