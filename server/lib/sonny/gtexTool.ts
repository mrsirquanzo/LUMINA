import type { Evidence } from '@mrsirquanzo/sonny-shared';
import type { Tool } from '@mrsirquanzo/sonny-mcp-gateway';
import { emitFigure } from './figureSink.js';

const MYGENE_QUERY = 'https://mygene.info/v3/query';
const GTEX_API = 'https://gtexportal.org/api/v2';
const REQUEST_TIMEOUT_MS = 8_000;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Expression API HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function ensemblGene(value: unknown): string | null {
  const candidates = Array.isArray(value) ? value : [value];
  for (const candidate of candidates) {
    const raw = isRecord(candidate) ? candidate.gene : candidate;
    if (typeof raw !== 'string') continue;
    const match = raw.match(/ENSG\d+/i);
    if (match) return match[0].toUpperCase();
  }
  return null;
}

function formatTpm(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Headline statistics carry only the precision the magnitude justifies. A
// fold-change rendered as "684.38x" claims a resolution the medians behind it
// do not have, and it costs a line of width to say nothing.
function formatMagnitude(value: number): string {
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// GTEx tissue ids are snake_case ("Adipose_Subcutaneous"); axis labels are not.
function tissueLabel(value: unknown): string {
  return String(value).replace(/_/g, ' ');
}

export const gtexExpressionTool: Tool = {
  name: 'gtex_expression',
  description:
    'GTEx v8 normal-tissue expression - the authoritative baseline for how much a target is expressed across ~54 healthy human tissues (median TPM). Use this to quantify normal-tissue / off-tumor expression that defines an ADC or targeted-therapy safety window, and to judge tumor-vs-normal selectivity against a normal baseline.',
  async call(args, fetchImpl = fetch): Promise<Evidence[]> {
    const gene = String(args.symbol ?? args.query ?? args.target ?? args.gene ?? '').trim();
    if (!gene) return [];

    try {
      const queryParams = new URLSearchParams({
        q: `symbol:${gene}`,
        species: 'human',
        fields: 'ensembl.gene',
      });
      const queryBody = await fetchJson(`${MYGENE_QUERY}?${queryParams.toString()}`, fetchImpl);
      const hit = isRecord(queryBody) && Array.isArray(queryBody.hits) && isRecord(queryBody.hits[0])
        ? queryBody.hits[0]
        : null;
      const ensembl = hit && isRecord(hit.ensembl)
        ? ensemblGene(hit.ensembl.gene)
        : null;
      if (!ensembl) return [];

      const referenceBody = await fetchJson(
        `${GTEX_API}/reference/gene?geneId=${encodeURIComponent(ensembl)}`,
        fetchImpl,
      );
      const reference = isRecord(referenceBody) && Array.isArray(referenceBody.data) && isRecord(referenceBody.data[0])
        ? referenceBody.data[0]
        : null;
      const gencodeId = reference && typeof reference.gencodeId === 'string'
        ? reference.gencodeId.trim()
        : '';
      if (!gencodeId) return [];

      const expressionBody = await fetchJson(
        `${GTEX_API}/expression/medianGeneExpression?gencodeId=${encodeURIComponent(gencodeId)}&datasetId=gtex_v8`,
        fetchImpl,
      );
      if (!isRecord(expressionBody) || !Array.isArray(expressionBody.data)) return [];

      const tissues = expressionBody.data
        .filter(isRecord)
        .map((tissue) => ({ tissue, median: Number(tissue.median) }))
        .filter((entry) =>
          typeof entry.tissue.tissueSiteDetailId === 'string' && Number.isFinite(entry.median),
        )
        .sort((a, b) => b.median - a.median);
      if (!tissues.length) return [];

      const medians = tissues.map((entry) => entry.median).sort((a, b) => a - b);
      const middle = Math.floor(medians.length / 2);
      const overallMedian = medians.length % 2
        ? medians[middle]
        : (medians[middle - 1] + medians[middle]) / 2;
      const highest = tissues.slice(0, 4).map(({ tissue, median }) =>
        `${tissueLabel(tissue.tissueSiteDetailId)} ${formatTpm(median)} TPM`,
      );

      const retrievedAt = new Date().toISOString();
      const geneUrl = `https://gtexportal.org/home/gene/${encodeURIComponent(gene)}`;

      // The full tissue distribution is the therapeutic-window argument. Emit it
      // as a figure so the reader sees the shape, not just the top four in prose.
      emitFigure({
        plot: 'tissue_expression_bar',
        id: `gtex:${gene.toUpperCase()}`,
        title: `${gene.toUpperCase()} expression across normal tissues`,
        subtitle:
          'Median TPM per tissue. High normal-tissue expression narrows the off-tumor safety window.',
        params: { gene: gene.toUpperCase(), dataset: 'GTEx v8', tissues: tissues.length },
        // Bare unit: "median" belongs in the subtitle, not repeated on every
        // value, or the reference legend reads "12.5 median TPM".
        unit: 'TPM',

        bars: tissues.map(({ tissue, median }) => ({
          label: tissueLabel(tissue.tissueSiteDetailId),
          value: median,
        })),
        reference: { label: 'median', value: overallMedian },
        // The three numbers that carry the safety-window argument. `range` is
        // the one that actually decides it: a target whose peak normal tissue
        // sits hundreds of fold above the typical tissue has a narrow window,
        // and that ratio is invisible if you only read the top-line maximum.
        stats: [
          { label: 'max', value: `${formatMagnitude(tissues[0].median)} TPM` },
          { label: 'median', value: `${formatMagnitude(overallMedian)} TPM` },
          ...(overallMedian > 0
            ? [{ label: 'range', value: `${formatMagnitude(tissues[0].median / overallMedian)}×` }]
            : []),
        ],
        source: { label: 'GTEx v8 · median gene expression', url: geneUrl, retrievedAt },
      });

      const snippet =
        `Normal-tissue baseline across ${tissues.length} tissues. ` +
        `Highest median expression: ${highest.join(', ')}. ` +
        `Overall median ${formatTpm(overallMedian)} TPM; max ${formatTpm(tissues[0].median)} TPM, ` +
        'informing the off-tumor safety window.';

      return [{
        id: `GTEX:${gene.toUpperCase()}`,
        kind: 'dataset',
        source: 'GTEx (normal tissue)',
        title: `${gene.toUpperCase()} - GTEx normal-tissue median expression`,
        snippet,
        url: geneUrl,
        raw: { gencodeId, tissues: tissues.slice(0, 15).map((entry) => entry.tissue) },
        retrievedAt,
      } as Evidence];
    } catch {
      return [];
    }
  },
};
