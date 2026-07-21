import type { Evidence } from '@mrsirquanzo/sonny-shared';
import type { Tool } from '@mrsirquanzo/sonny-mcp-gateway';

const HPA_SEARCH = 'https://www.proteinatlas.org/api/search_download.php';
const HPA_COLUMNS = [
  'g', 'gs', 'eg', 'rnats', 'rnatsm', 'scl', 'scml',
  't_RNA_lung', 't_RNA_breast', 't_RNA_pancreas', 't_RNA_ovary',
  'prognostic_lung_cancer', 'prognostic_breast_cancer',
  'prognostic_pancreatic_cancer', 'prognostic_ovarian_cancer',
].join(',');
const REQUEST_TIMEOUT_MS = 8_000;

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

export const humanProteinAtlasTool: Tool = {
  name: 'human_protein_atlas',
  description:
    'Fetch Human Protein Atlas expression, tissue specificity, subcellular localisation, and cancer prognostic annotations for a human gene symbol.',
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
      return [{
        id: `HPA:${gene.toUpperCase()}`,
        kind: 'dataset',
        source: 'Human Protein Atlas',
        title: `${recordGene} - Human Protein Atlas expression & localization`,
        snippet: buildSnippet(record),
        url: ensembl
          ? `https://www.proteinatlas.org/${encodeURIComponent(ensembl)}`
          : `https://www.proteinatlas.org/search/${encodeURIComponent(gene)}`,
        raw: record,
        retrievedAt: new Date().toISOString(),
      } as Evidence];
    } catch {
      return [];
    }
  },
};
