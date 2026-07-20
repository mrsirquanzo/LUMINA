import { useMemo } from 'react';
import { useGating } from './gatingStore';
import { bCellMarkerCorrelation } from './model';

const NEGATIVE = [220, 38, 38] as const;
const NEUTRAL = [248, 250, 252] as const;
const POSITIVE = [29, 78, 216] as const;

function correlationCellStyle(value: number) {
  const bounded = Math.max(-1, Math.min(1, value));
  const target = bounded < 0 ? NEGATIVE : POSITIVE;
  const strength = Math.abs(bounded);
  const channels = NEUTRAL.map((channel, index) => (
    Math.round(channel + (target[index] - channel) * strength)
  ));
  const luminance = channels.reduce((sum, channel, index) => {
    const normalized = channel / 255;
    const linear = normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  return {
    backgroundColor: `rgb(${channels.join(' ')})`,
    color: 1.05 / (luminance + 0.05) >= 4.5 ? '#ffffff' : '#0f172a',
  };
}

export function CorrelationHeatmap() {
  const gating = useGating();
  const data = gating?.data;
  const cascade = gating?.cascade;
  const correlation = useMemo(
    () => data && cascade ? bCellMarkerCorrelation(data, cascade) : null,
    [data, cascade],
  );

  if (!gating || !correlation) {
    return <div className="surface-inset t-meta min-h-44 animate-pulse p-4 text-textTertiary">Loading real event data...</div>;
  }

  const { labels, matrix, n } = correlation;
  const gridTemplateColumns = `minmax(3.75rem, 1.25fr) repeat(${labels.length}, minmax(2.5rem, 1fr))`;

  return (
    <section className="surface-inset overflow-hidden bg-white" aria-label="Live B-cell marker correlation heatmap">
      <div className="overflow-x-auto p-3 sm:p-4">
        <div className="grid min-w-[17rem] gap-1" style={{ gridTemplateColumns }}>
          <span aria-hidden="true" />
          {labels.map((label) => (
            <span key={`column-${label}`} className="t-meta flex min-h-8 items-end justify-center pb-1 text-center font-semibold text-textSecondary">
              {label}
            </span>
          ))}
          {matrix.map((row, rowIndex) => (
            <div key={`row-${labels[rowIndex]}`} className="contents">
              <span className="t-meta flex items-center pr-1 font-semibold text-textSecondary">{labels[rowIndex]}</span>
              {row.map((value, columnIndex) => (
                <span
                  key={`${labels[rowIndex]}-${labels[columnIndex]}`}
                  className="t-meta flex aspect-square items-center justify-center rounded-md font-mono font-semibold tabular-nums"
                  style={correlationCellStyle(value)}
                  title={`${labels[rowIndex]} and ${labels[columnIndex]}: ${value.toFixed(2)}`}
                >
                  {value.toFixed(2)}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2" aria-label="Correlation color scale from negative one to positive one">
          <span className="t-meta font-mono tabular-nums text-textTertiary">-1</span>
          <span className="h-2 flex-1 rounded-full bg-[linear-gradient(90deg,#dc2626_0%,#f8fafc_50%,rgb(var(--color-primary))_100%)]" aria-hidden="true" />
          <span className="t-meta font-mono tabular-nums text-textTertiary">+1</span>
        </div>
      </div>
      <p className="t-meta border-t border-borderSoft bg-subtle/45 px-3.5 py-2 text-textTertiary" aria-live="polite">
        Spearman correlation - current B-cell population (N = {n.toLocaleString()})
      </p>
    </section>
  );
}
