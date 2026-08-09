import { useEffect, useRef, useState, type ReactElement } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { FigureSpec } from '../../../../shared/figures.js';
import { TissueExpressionPlot } from './TissueExpressionPlot.js';
import { ProteinTissueLevels } from './ProteinTissueLevels.js';

const FALLBACK_PLOT_WIDTH = 300;

/**
 * Measure the card so the plot can lay out real pixels rather than scale a
 * viewBox (which would shrink axis labels along with the chart). Falls back to
 * a fixed width on the server and wherever ResizeObserver is unavailable.
 */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FALLBACK_PLOT_WIDTH);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured && measured > 0) setWidth(measured);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

// The parameters the agent chose, rendered as the reader sees them: this is
// what was asked of the data, not a caption written after the fact.
function ParamLine({ params }: { params: Record<string, string | number> }) {
  const entries = Object.entries(params);
  if (entries.length === 0) return null;
  return (
    <p className="t-meta mt-0.5 font-mono text-textTertiary">
      {entries.map(([key, value]) => `${key}: ${value}`).join('  ·  ')}
    </p>
  );
}

/**
 * The frame every figure renders inside: what was asked, what came back, what
 * it measures, and where it came from. The source line is not optional - a
 * figure the reader cannot trace back is worth less than the sentence it replaced.
 */
export function FigureCard({ figure }: { figure: FigureSpec }): ReactElement {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();

  return (
    <figure className="rounded-lg border border-border bg-surface px-3 py-2.5">
      <figcaption>
        <p className="t-eyebrow text-textTertiary">figure</p>
        <p className="t-body-sm mt-1 font-medium text-textPrimary">{figure.title}</p>
        {figure.subtitle && (
          <p className="t-meta mt-0.5 text-textSecondary">{figure.subtitle}</p>
        )}
        <ParamLine params={figure.params} />
      </figcaption>

      {/* Stat labels use tighter tracking than `t-eyebrow`: at 0.2em three
          statistics wrap to a second line, reading as two groups of numbers
          rather than one row. */}
      {figure.stats.length > 0 && (
        <dl className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1">
          {figure.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-textTertiary">
                {stat.label}
              </dt>
              <dd className="t-meta font-mono tabular-nums text-textPrimary">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div ref={ref} className="mt-2.5">
        {figure.plot === 'tissue_expression_bar' ? (
          <TissueExpressionPlot figure={figure} width={width} />
        ) : (
          <ProteinTissueLevels figure={figure} width={width} />
        )}
      </div>

      {figure.caveat && (
        <p className="t-meta mt-2 flex items-start gap-1.5 text-watch-text">
          <AlertTriangle className="mt-px h-3 w-3 flex-none" aria-hidden="true" />
          {figure.caveat}
        </p>
      )}

      <p className="t-meta mt-2 text-textTertiary">
        <a
          href={figure.source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          {figure.source.label}
          <ExternalLink className="h-3 w-3 flex-none" aria-hidden="true" />
        </a>
        {figure.source.note && <span> · {figure.source.note}</span>}
      </p>
    </figure>
  );
}
