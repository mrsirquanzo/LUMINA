export interface EvidenceReference {
  id?: string;
  kind?: string;
  source?: string;
  title?: string;
  url?: string;
  snippet?: string;
  passage?: string;
  raw?: unknown;
}

export interface StructuredDataRow {
  key: string;
  value: string;
}

export function baseEvidenceId(id: string): string {
  return id.trim().replace(/#.*$/, '');
}

export function resolveEvidence(
  citationId: string,
  references: readonly EvidenceReference[] = [],
): EvidenceReference | undefined {
  const requestedId = citationId.trim();
  if (!requestedId) return undefined;

  const exact = references.find((reference) => reference.id?.trim() === requestedId);
  if (exact) return exact;

  const requestedBase = baseEvidenceId(requestedId);
  return references.find((reference) => (
    reference.id ? baseEvidenceId(reference.id) === requestedBase : false
  ));
}

export function sourceLabelForCitation(
  citationId: string,
  reference?: EvidenceReference,
): string {
  if (reference?.source?.trim()) return reference.source.trim();

  const id = baseEvidenceId(citationId).toUpperCase();
  if (id.startsWith('HPA:')) return 'Human Protein Atlas';
  if (id.startsWith('GTEX:')) return 'GTEx';
  if (id.startsWith('PMCID:')) return 'PubMed Central';
  if (id.startsWith('PMID:')) return 'PubMed';
  if (id.startsWith('ENSG')) return 'Open Targets';
  if (id.startsWith('UNIPROT:')) return 'UniProt';
  if (id.startsWith('PATENT:')) return 'EPO Espacenet';
  if (id.startsWith('NCT')) return 'ClinicalTrials.gov';
  if (id.startsWith('DOC:')) return 'Uploaded document';
  return 'Evidence source';
}

export function safeExternalUrl(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function displayStructuredValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  try {
    return JSON.stringify(
      value,
      (_key, item: unknown) => typeof item === 'bigint' ? String(item) : item,
      2,
    ) ?? String(value);
  } catch {
    return 'Structured value could not be displayed.';
  }
}

export function structuredDataRows(raw: unknown): StructuredDataRow[] {
  if (typeof raw !== 'object' || raw === null) return [];

  try {
    const entries: Array<[string, unknown]> = Array.isArray(raw)
      ? raw.map((value, index) => [String(index), value])
      : Object.entries(raw);

    return entries.map(([key, value]) => ({
      key,
      value: displayStructuredValue(value),
    }));
  } catch {
    return [{ key: 'Raw data', value: 'Structured data could not be displayed.' }];
  }
}
