/**
 * The figure contract shared by the engine side (which emits) and the UI side
 * (which renders).
 *
 * Deliberately a CLOSED set of plot types with fixed parameter shapes, not
 * free-form chart config. A figure that reaches the trail is one the UI knows
 * how to draw and label; there is no path where the model invents a chart.
 */

/** Every plot type LUMINA can render. Adding a plot means adding a variant. */
export type FigurePlot = 'tissue_expression_bar' | 'protein_tissue_levels';

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
  /**
   * A qualifier on the source itself rather than on the measurement - assay
   * reliability, dataset version, cohort size. Sits with the provenance line
   * instead of the statistics, because it says how much to trust the numbers,
   * not what they are.
   */
  note?: string;
}

/** Fields every figure carries, whatever it draws. */
interface FigureBase {
  /**
   * Stable across re-emits, so a second emit for the same gene replaces the
   * figure in place rather than appending a duplicate to the trail.
   */
  id: string;
  title: string;
  subtitle?: string;
  /** The parameters the agent actually chose, rendered verbatim under the title. */
  params: Record<string, string | number>;
  stats: FigureStat[];
  source: FigureSource;
  /**
   * A limitation the reader must see to read the figure honestly - a weak
   * assay reliability grade, a small n, a proxy measurement. Rendered as a
   * warning, never buried in prose.
   */
  caveat?: string;
}

/**
 * Median expression across normal tissues, sorted descending.
 * The off-tumor safety-window figure: how much target sits in healthy tissue.
 */
export interface TissueExpressionFigure extends FigureBase {
  plot: 'tissue_expression_bar';
  unit: string;
  bars: FigureBar[];
  /** Horizontal reference line, e.g. the across-tissue median. */
  reference?: { label: string; value: number };
}

/**
 * Antibody-scored protein level per tissue, as read off stained sections.
 *
 * Deliberately ORDINAL, not numeric. A pathologist scores a slide as one of
 * four buckets; turning that into a number would invent precision the assay
 * never had, and would invite a reader to compute ratios between grades.
 */
export const PROTEIN_LEVELS = ['not detected', 'low', 'medium', 'high'] as const;
export type ProteinLevel = (typeof PROTEIN_LEVELS)[number];

export interface ProteinTissueLevel {
  label: string;
  /** Organ system the tissue belongs to, for grouping and context. */
  organ?: string;
  level: ProteinLevel;
}

export interface ProteinTissueLevelsFigure extends FigureBase {
  plot: 'protein_tissue_levels';
  levels: ProteinTissueLevel[];
}

export type FigureSpec = TissueExpressionFigure | ProteinTissueLevelsFigure;

/** Hard cap on rows. GTEx returns ~54 tissues and HPA ~48; beyond this is a bug upstream. */
export const MAX_FIGURE_BARS = 80;

function isProteinLevel(value: unknown): value is ProteinLevel {
  return typeof value === 'string' && (PROTEIN_LEVELS as readonly string[]).includes(value);
}

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
  const note = str(value.note);
  return { label, url, retrievedAt: str(value.retrievedAt) ?? '', ...(note ? { note } : {}) };
}

function parseReference(value: unknown): { label: string; value: number } | undefined {
  if (!isRecord(value)) return undefined;
  const label = str(value.label);
  const refValue = finiteNumber(value.value);
  if (label === null || refValue === null) return undefined;
  return { label, value: refValue };
}

function parseLevels(value: unknown): ProteinTissueLevel[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const levels: ProteinTissueLevel[] = [];
  for (const item of value.slice(0, MAX_FIGURE_BARS)) {
    if (!isRecord(item)) continue;
    const label = str(item.label);
    if (label === null || !isProteinLevel(item.level)) continue;
    const organ = str(item.organ);
    levels.push({ label, level: item.level, ...(organ ? { organ } : {}) });
  }
  return levels.length ? levels : null;
}

/** The fields shared by every figure, or null if any required one is missing. */
function parseBase(value: Record<string, unknown>): (FigureBase & { id: string }) | null {
  const id = str(value.id);
  const title = str(value.title);
  const source = parseSource(value.source);
  if (id === null || title === null || source === null) return null;

  const subtitle = str(value.subtitle);
  const caveat = str(value.caveat);
  return {
    id,
    title,
    ...(subtitle ? { subtitle } : {}),
    params: parseParams(value.params),
    stats: parseStats(value.stats),
    source,
    ...(caveat ? { caveat } : {}),
  };
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

  const base = parseBase(value);
  if (base === null) return null;

  if (value.plot === 'protein_tissue_levels') {
    const levels = parseLevels(value.levels);
    if (levels === null) return null;
    return { ...base, plot: 'protein_tissue_levels', levels };
  }

  if (value.plot !== 'tissue_expression_bar') return null;

  const unit = str(value.unit);
  const bars = parseBars(value.bars);
  if (unit === null || bars === null) return null;

  const reference = parseReference(value.reference);

  return {
    ...base,
    plot: 'tissue_expression_bar',
    unit,
    bars,
    ...(reference ? { reference } : {}),
  };
}
