import type { Evidence } from '@mrsirquanzo/sonny-shared';
import type { Tool } from '@mrsirquanzo/sonny-mcp-gateway';
import { load } from 'cheerio';
import { emitFigure } from './figureSink.js';
import { PROTEIN_LEVELS, type ProteinLevel, type ProteinTissueLevel } from '../../../shared/figures.js';

const HPA_SEARCH = 'https://www.proteinatlas.org/api/search_download.php';
const HPA_COLUMNS = [
  'g', 'gs', 'eg', 'rnats', 'rnatsm', 'scl', 'scml',
  't_RNA_lung', 't_RNA_breast', 't_RNA_pancreas', 't_RNA_ovary',
  'prognostic_lung_cancer', 'prognostic_breast_cancer',
  'prognostic_pancreatic_cancer', 'prognostic_ovarian_cancer',
].join(',');
const REQUEST_TIMEOUT_MS = 8_000;
// The per-tissue IHC panel is only in the full XML record; the search API
// returns just the handful of tissues HPA flags as "specific".
const HPA_ENTRY_XML = (ensembl: string) => `https://www.proteinatlas.org/${ensembl}.xml`;
const XML_TIMEOUT_MS = 12_000;
// A reliability grade below these means the antibody staining is not
// dependable enough to read the panel without saying so out loud.
const TRUSTED_RELIABILITY = new Set(['enhanced', 'supported']);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function textList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.filter(present).map((item) => String(item).trim());
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HPA HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string, fetchImpl: typeof fetch): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), XML_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HPA XML HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export interface ProteinTissuePanel {
  levels: ProteinTissueLevel[];
  /** HPA's antibody reliability grade for this gene: enhanced/supported/approved/uncertain. */
  reliability: string;
  /** HPA's own one-line read of the staining pattern. */
  summary: string;
}

const LEVEL_RANK = new Map<ProteinLevel, number>(PROTEIN_LEVELS.map((level, i) => [level, i]));

function asProteinLevel(value: string): ProteinLevel | null {
  const normalized = value.trim().toLowerCase();
  return (PROTEIN_LEVELS as readonly string[]).includes(normalized)
    ? (normalized as ProteinLevel)
    : null;
}

/**
 * Pull the antibody-scored tissue panel out of an HPA gene record.
 *
 * Scoped to the IHC / normal-tissue block specifically: the same document also
 * carries cancer-tissue and cell-line assays, and mixing those into a
 * "normal tissue" figure would misstate the safety window in the direction
 * that flatters the target.
 */
export function parseProteinTissuePanel(xml: string): ProteinTissuePanel | null {
  const $ = load(xml, { xmlMode: true });
  const block = $('tissueExpression[technology="IHC"][assayType="tissue"]').first();
  if (block.length === 0) return null;

  const levels: ProteinTissueLevel[] = [];
  block.find('data').each((_, element) => {
    const node = $(element);
    const tissue = node.find('tissue').first();
    const label = tissue.text().trim();
    // children(), not find(): a `data` node also holds per-cell-type levels,
    // and find() would pick the first cell type's score as the tissue score.
    const level = asProteinLevel(node.children('level[type="expression"]').first().text());
    if (!label || level === null) return;
    const organ = tissue.attr('organ')?.trim();
    levels.push({ label, level, ...(organ ? { organ } : {}) });
  });
  if (!levels.length) return null;

  levels.sort(
    (a, b) =>
      (LEVEL_RANK.get(b.level) ?? 0) - (LEVEL_RANK.get(a.level) ?? 0) ||
      a.label.localeCompare(b.label),
  );

  return {
    levels,
    reliability: block.find('verification').first().text().trim().toLowerCase(),
    summary: block.find('summary').first().text().trim(),
  };
}

function compactValue(value: unknown): string {
  if (Array.isArray(value)) return value.filter(present).map(String).join(', ');
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([, item]) => present(item))
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join(', ');
  }
  return String(value);
}

function buildSnippet(record: JsonRecord): string {
  const parts: string[] = [];

  if (present(record['RNA tissue specificity'])) {
    parts.push(`RNA tissue specificity: ${String(record['RNA tissue specificity']).trim()}`);
  }

  const specificNtpm = record['RNA tissue specific nTPM'];
  if (isRecord(specificNtpm)) {
    const values = Object.entries(specificNtpm)
      .filter(([, value]) => present(value))
      .map(([tissue, value]) => `${tissue} ${String(value)} nTPM`);
    if (values.length) parts.push(`Tissue-specific expression: ${values.join(', ')}`);
  }

  const locations = textList(record['Subcellular main location']);
  const fallbackLocations = locations.length ? locations : textList(record['Subcellular location']);
  if (fallbackLocations.length) {
    parts.push(`Subcellular location: ${[...new Set(fallbackLocations)].join(', ')}`);
  }

  const tissueValues = Object.entries(record)
    .map(([key, value]) => {
      const match = key.match(/^Tissue RNA - (.+) \[nTPM\]$/i);
      return match && present(value) ? `${match[1]} ${String(value)} nTPM` : null;
    })
    .filter((value): value is string => value !== null);
  if (tissueValues.length) parts.push(`Tissue RNA: ${tissueValues.join(', ')}`);

  const prognosticValues = Object.entries(record)
    .filter(([key, value]) => /^prognostic_/i.test(key) && present(value))
    .map(([key, value]) => {
      const cancer = key.replace(/^prognostic_/i, '').replace(/_/g, ' ');
      return `prognostic in ${cancer}: ${compactValue(value)}`;
    });
  if (prognosticValues.length) parts.push(prognosticValues.join(', '));

  const snippet = parts.map((part) => `${part}.`).join(' ');
  return snippet.length <= 600 ? snippet : `${snippet.slice(0, 597).trimEnd()}...`;
}

function countAtLeast(levels: ProteinTissueLevel[], minimum: ProteinLevel): number {
  const floor = LEVEL_RANK.get(minimum) ?? 0;
  return levels.filter((entry) => (LEVEL_RANK.get(entry.level) ?? 0) >= floor).length;
}

/** Fold the panel back into the tool's prose so a text-only reader loses nothing. */
function panelSnippet(panel: ProteinTissuePanel | null): string {
  if (!panel) return '';
  const total = panel.levels.length;
  const detected = countAtLeast(panel.levels, 'low');
  const strong = countAtLeast(panel.levels, 'medium');
  return (
    `Antibody-scored protein detected in ${detected}/${total} normal tissues ` +
    `(medium or high in ${strong}); staining reliability ${panel.reliability || 'unstated'}.`
  );
}

/**
 * Fetch the IHC panel and publish it as a figure.
 *
 * Best-effort by construction: the XML record is large and this is a second
 * round trip, so any failure returns null and leaves the tool's primary
 * evidence untouched rather than losing the whole HPA call to a figure.
 */
async function emitProteinTissueFigure(input: {
  gene: string;
  ensembl: string;
  geneUrl: string;
  retrievedAt: string;
  fetchImpl: typeof fetch;
}): Promise<ProteinTissuePanel | null> {
  let panel: ProteinTissuePanel | null = null;
  try {
    const xml = await fetchText(HPA_ENTRY_XML(input.ensembl), input.fetchImpl);
    panel = parseProteinTissuePanel(xml);
  } catch {
    return null;
  }
  if (!panel) return null;

  const total = panel.levels.length;
  const detected = countAtLeast(panel.levels, 'low');
  const strong = countAtLeast(panel.levels, 'medium');
  const isTrusted = TRUSTED_RELIABILITY.has(panel.reliability);

  emitFigure({
    plot: 'protein_tissue_levels',
    id: `hpa:${input.gene.toUpperCase()}`,
    title: `${input.gene.toUpperCase()} protein across normal tissues`,
    subtitle:
      panel.summary ||
      'Antibody-scored staining intensity per tissue. Protein is often far more restricted than RNA.',
    params: { gene: input.gene.toUpperCase(), dataset: 'HPA IHC', tissues: total },
    // `strong` is the number that matters for an ADC or a cytotoxic payload:
    // tissues staining medium or high are the ones that would take the hit.
    stats: [
      { label: 'detected', value: `${detected}/${total}` },
      { label: 'medium+', value: String(strong) },
    ],
    levels: panel.levels,
    source: {
      label: 'Human Protein Atlas · IHC normal tissue',
      url: input.geneUrl,
      retrievedAt: input.retrievedAt,
      // Assay quality sits with the source, not the statistics: it says how
      // much to trust the panel, not what the panel measured.
      note: `antibody reliability ${panel.reliability || 'unstated'}`,
    },
    // A weak antibody grade does not invalidate the panel, but reading it as
    // though it were settled would be wrong, so it is stated on the figure.
    ...(isTrusted
      ? {}
      : {
          caveat: `HPA antibody reliability is "${panel.reliability || 'unstated'}"; treat these levels as indicative, not settled.`,
        }),
  });

  return panel;
}

export const humanProteinAtlasTool: Tool = {
  name: 'human_protein_atlas',
  description:
    'Human Protein Atlas - the authoritative source for a target’s protein/RNA expression across normal AND tumor tissues, tissue specificity, subcellular localization, and cancer prognostic association. Use this to ground tumor-vs-normal selectivity, membrane localization, and therapeutic-window claims (which tissues express the target and how selectively).',
  async call(args, fetchImpl = fetch): Promise<Evidence[]> {
    const gene = String(args.symbol ?? args.query ?? args.target ?? args.gene ?? '').trim();
    if (!gene) return [];

    try {
      const params = new URLSearchParams({
        search: gene,
        format: 'json',
        compress: 'no',
        columns: HPA_COLUMNS,
      });
      const body = await fetchJson(`${HPA_SEARCH}?${params.toString()}`, fetchImpl);
      if (!Array.isArray(body)) return [];

      const records = body.filter(isRecord);
      const record = records.find((item) =>
        String(item.Gene ?? '').localeCompare(gene, undefined, { sensitivity: 'accent' }) === 0,
      ) ?? records[0];
      if (!record) return [];

      const recordGene = present(record.Gene) ? String(record.Gene).trim() : gene;
      const ensembl = present(record.Ensembl) ? String(record.Ensembl).trim() : '';
      const retrievedAt = new Date().toISOString();
      const geneUrl = ensembl
        ? `https://www.proteinatlas.org/${encodeURIComponent(ensembl)}`
        : `https://www.proteinatlas.org/search/${encodeURIComponent(gene)}`;

      const panel = ensembl
        ? await emitProteinTissueFigure({
            gene: recordGene,
            ensembl,
            geneUrl,
            retrievedAt,
            fetchImpl,
          })
        : null;

      return [{
        id: `HPA:${gene.toUpperCase()}`,
        kind: 'dataset',
        source: 'Human Protein Atlas',
        title: `${recordGene} - Human Protein Atlas expression & localization`,
        snippet: [buildSnippet(record), panelSnippet(panel)].filter(Boolean).join(' '),
        url: geneUrl,
        raw: { ...record, ...(panel ? { proteinTissuePanel: panel } : {}) },
        retrievedAt,
      } as Evidence];
    } catch {
      return [];
    }
  },
};
