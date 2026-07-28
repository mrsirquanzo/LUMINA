/**
 * The figure contract shared by the engine side (which emits) and the UI side
 * (which renders).
 *
 * Deliberately a CLOSED set of plot types with fixed parameter shapes, not
 * free-form chart config. A figure that reaches the trail is one the UI knows
 * how to draw and label; there is no path where the model invents a chart.
 */

/** Every plot type LUMINA can render. Adding a plot means adding a variant. */
export type FigurePlot = 'tissue_expression_bar';

/** A labelled number rendered in the figure header, e.g. "median · 4.2 TPM". */
export interface FigureStat {
  label: string;
  value: string;
}

export interface FigureBar {
  label: string;
  value: number;
}

/** Provenance. Every figure carries one; a figure without a source cannot render. */
export interface FigureSource {
  label: string;
  url: string;
  retrievedAt: string;
}

/**
 * Median expression across normal tissues, sorted descending.
 * The off-tumor safety-window figure: how much target sits in healthy tissue.
 */
export interface TissueExpressionFigure {
  plot: 'tissue_expression_bar';
  /**
   * Stable across re-emits, so a second emit for the same gene replaces the
   * figure in place rather than appending a duplicate to the trail.
   */
  id: string;
  title: string;
  subtitle?: string;
  /** The parameters the agent actually chose, rendered verbatim under the title. */
  params: Record<string, string | number>;
  unit: string;
  bars: FigureBar[];
  /** Horizontal reference line, e.g. the across-tissue median. */
  reference?: { label: string; value: number };
  stats: FigureStat[];
  source: FigureSource;
}

export type FigureSpec = TissueExpressionFigure;

/** Hard cap on bars. GTEx returns ~54 tissues; anything beyond this is a bug upstream. */
export const MAX_FIGURE_BARS = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseBars(value: unknown): FigureBar[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const bars: FigureBar[] = [];
  for (const item of value.slice(0, MAX_FIGURE_BARS)) {
    if (!isRecord(item)) continue;
    const label = str(item.label);
    const barValue = finiteNumber(item.value);
    if (label === null || barValue === null) continue;
    bars.push({ label, value: barValue });
  }
  return bars.length ? bars : null;
}

function parseStats(value: unknown): FigureStat[] {
  if (!Array.isArray(value)) return [];
  const stats: FigureStat[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const label = str(item.label);
    const statValue = str(item.value);
    if (label === null || statValue === null) continue;
    stats.push({ label, value: statValue });
  }
  return stats;
}

function parseParams(value: unknown): Record<string, string | number> {
  if (!isRecord(value)) return {};
  const params: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' && raw.trim()) params[key] = raw.trim();
    else if (typeof raw === 'number' && Number.isFinite(raw)) params[key] = raw;
  }
  return params;
}

function parseSource(value: unknown): FigureSource | null {
  if (!isRecord(value)) return null;
  const label = str(value.label);
  const url = str(value.url);
  if (label === null || url === null) return null;
  // Only http(s) provenance links are renderable; anything else is dropped
  // rather than turned into a clickable unknown scheme.
  if (!/^https?:\/\//i.test(url)) return null;
  return { label, url, retrievedAt: str(value.retrievedAt) ?? '' };
}

function parseReference(value: unknown): { label: string; value: number } | undefined {
  if (!isRecord(value)) return undefined;
  const label = str(value.label);
  const refValue = finiteNumber(value.value);
  if (label === null || refValue === null) return undefined;
  return { label, value: refValue };
}

/**
 * Narrow an untrusted SSE payload to a FigureSpec, or null.
 *
 * The trail renders whatever survives this function, so it is the only place
 * that decides a figure is well-formed. A partially-formed figure is dropped
 * whole rather than rendered with holes in it.
 */
export function parseFigure(value: unknown): FigureSpec | null {
  if (!isRecord(value)) return null;
  if (value.plot !== 'tissue_expression_bar') return null;

  const id = str(value.id);
  const title = str(value.title);
  const unit = str(value.unit);
  const bars = parseBars(value.bars);
  const source = parseSource(value.source);
  if (id === null || title === null || unit === null || bars === null || source === null) return null;

  const subtitle = str(value.subtitle);
  const reference = parseReference(value.reference);

  return {
    plot: 'tissue_expression_bar',
    id,
    title,
    ...(subtitle ? { subtitle } : {}),
    params: parseParams(value.params),
    unit,
    bars,
    ...(reference ? { reference } : {}),
    stats: parseStats(value.stats),
    source,
  };
}
