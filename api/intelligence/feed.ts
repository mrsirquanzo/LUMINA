import type { IncomingMessage, ServerResponse } from 'node:http';

type FeedItemKind = 'publication' | 'news' | 'regulatory' | 'deal' | 'clinical';
type FeedItemRelevance = 'high' | 'medium' | 'low';

interface NormalizedFeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO string
  summary: string;
  kind: FeedItemKind;
  relevance: FeedItemRelevance;
  tags: string[];
  score: number; // 0..1
  matchedTerms: string[];
  matchedFields: Array<'title' | 'summary'>;
}

interface FeedResponse {
  query: string;
  queryPack: {
    target?: string;
    asset?: string;
    company?: string;
    indication?: string;
    synonyms: string[];
    pubmedQuery: string;
    newsQuery: string;
    trialsQuery: string;
    terms: string[];
  };
  sources: string[];
  items: NormalizedFeedItem[];
  fetchedAt: string;
  cached: boolean;
  partial: boolean;
  errors: Array<{ sourceId: string; source: string; message: string }>;
}

const DEFAULT_LIMIT = 30;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;

const cache = new Map<string, { expiresAt: number; data: FeedResponse }>();

const AMBIGUOUS_SYMBOLS = new Set(['MET', 'KIT', 'YES', 'AND', 'OR', 'NOT']);

function json(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function getUrl(req: IncomingMessage): URL {
  const host = req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return new URL(req.url || '/', `${proto}://${host}`);
}

function toIsoDate(input: string | undefined): string {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function clamp(s: string, maxLen = 260): string {
  const v = (s || '').replace(/\s+/g, ' ').trim();
  if (v.length <= maxLen) return v;
  return `${v.slice(0, maxLen - 1).trimEnd()}…`;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function uniqStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = v.trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripXmlTags(text: string): string {
  return decodeXml(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isAmbiguousSymbol(term: string): boolean {
  const t = term.trim();
  if (!t) return false;
  const compact = t.replace(/\s+/g, '');
  if (compact.length <= 3 && /^[A-Za-z]+$/.test(compact)) return true;
  return AMBIGUOUS_SYMBOLS.has(compact.toUpperCase());
}

function expandKnownSynonyms(targetOrQuery: string): string[] {
  const t = targetOrQuery.trim();
  if (!t) return [];
  const compact = t.replace(/\s+/g, '').toUpperCase();
  if (compact === 'CMET' || compact === 'C-MET' || compact === 'MET')
    return ['c-MET', 'HGFR', 'hepatocyte growth factor receptor', 'proto-oncogene c-met'];
  if (compact === 'HER2' || compact === 'ERBB2')
    return ['HER2', 'ERBB2', 'HER-2', 'neu', 'receptor tyrosine-protein kinase erbB-2'];
  if (compact === 'TROP2' || compact === 'TACSTD2') return ['TROP2', 'TACSTD2', 'trophoblast cell-surface antigen 2'];
  return [];
}

function buildPubmedQuery(params: { terms: string[]; strict: boolean }): string {
  const terms = uniqStrings(params.terms);
  const tiabClauses: string[] = [];

  for (const term of terms) {
    const compactUpper = term.replace(/\s+/g, '').toUpperCase();
    // Disambiguate especially ambiguous short symbols (e.g., MET)
    if (compactUpper === 'MET') {
      tiabClauses.push('("c-MET"[TIAB] OR "cMET"[TIAB] OR "HGFR"[TIAB] OR "hepatocyte growth factor receptor"[TIAB] OR "proto-oncogene c-met"[TIAB])');
      continue;
    }

    const quoted = term.includes(' ') || term.includes('-') || term.includes('/') || term.includes('.') ? `"${term}"` : term;
    tiabClauses.push(`${quoted}[TIAB]`);
  }

  const anyMention = `(${tiabClauses.join(' OR ')})`;
  const oncologyContext =
    '(cancer[TIAB] OR oncology[TIAB] OR tumor[TIAB] OR tumour[TIAB] OR carcinoma[TIAB] OR neoplasm[TIAB] OR metastatic[TIAB])';
  const drugDevContext =
    '(inhibitor[TIAB] OR antibody[TIAB] OR adc[TIAB] OR "clinical trial"[TIAB] OR phase[TIAB] OR resistance[TIAB] OR kinase[TIAB] OR receptor[TIAB] OR biomarker[TIAB])';

  // Be extremely selective by default:
  // - require explicit target/asset mention in title/abstract
  // - constrain to oncology
  // - prefer drug-development related contexts to avoid "junk"
  return params.strict ? `${anyMention} AND ${oncologyContext} AND ${drugDevContext}` : `${anyMention} AND ${oncologyContext}`;
}

async function fetchPubmedAbstracts(ids: string[], apiKey: string | undefined): Promise<Map<string, { title: string; abstract: string }>> {
  const out = new Map<string, { title: string; abstract: string }>();
  if (!ids.length) return out;

  const efetch = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');
  efetch.searchParams.set('db', 'pubmed');
  efetch.searchParams.set('retmode', 'xml');
  efetch.searchParams.set('id', ids.join(','));
  if (apiKey) efetch.searchParams.set('api_key', apiKey);

  const res = await fetchWithTimeout(efetch.toString());
  if (!res.ok) return out;
  const xml = await res.text();

  const articles = xml.split(/<\/PubmedArticle>/i);
  for (const chunk of articles) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/i)?.[1];
    if (!pmid) continue;

    const rawTitle = chunk.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/i)?.[1] || '';
    const abstractParts = Array.from(chunk.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)).map((m) => m[1] || '');
    const rawAbstract = abstractParts.join('\n');

    out.set(pmid, {
      title: stripXmlTags(rawTitle),
      abstract: stripXmlTags(rawAbstract),
    });
  }

  return out;
}

function buildTermMatchers(terms: string[]) {
  const matchers = terms.map((t) => {
    const compact = t.replace(/\s+/g, '');
    if (/^cmet$/i.test(compact) || /^c-met$/i.test(compact)) {
      return { term: t, isAmbiguous: true, re: /\bc[-\s]?met\b/i };
    }
    const isAmbiguous = isAmbiguousSymbol(t);
    const escaped = escapeRegExp(t);
    const re = isAmbiguous ? new RegExp(`\\b${escaped}\\b`, 'i') : new RegExp(escaped, 'i');
    return { term: t, isAmbiguous, re };
  });

  return matchers;
}

async function fetchPubmedItems(params: { pubmedQuery: string; terms: string[] }, max: number): Promise<NormalizedFeedItem[]> {
  // PubMed eutils: esearch -> esummary
  const esearch = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  esearch.searchParams.set('db', 'pubmed');
  esearch.searchParams.set('retmode', 'json');
  // Pull extra candidates; we'll hard-filter by target mention below.
  esearch.searchParams.set('retmax', String(Math.min(30, Math.max(10, max * 3))));
  esearch.searchParams.set('term', params.pubmedQuery);
  esearch.searchParams.set('sort', 'pub+date');
  // Optional API key (improves rate limit)
  const apiKey = process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY;
  if (apiKey) esearch.searchParams.set('api_key', apiKey);

  const searchRes = await fetchWithTimeout(esearch.toString());
  if (!searchRes.ok) throw new Error(`PubMed esearch failed (${searchRes.status})`);
  const searchJson = (await searchRes.json()) as any;
  const ids: string[] = searchJson?.esearchresult?.idlist || [];
  if (!ids.length) return [];

  const esummary = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  esummary.searchParams.set('db', 'pubmed');
  esummary.searchParams.set('retmode', 'json');
  esummary.searchParams.set('id', ids.join(','));
  if (apiKey) esummary.searchParams.set('api_key', apiKey);

  const sumRes = await fetchWithTimeout(esummary.toString());
  if (!sumRes.ok) throw new Error(`PubMed esummary failed (${sumRes.status})`);
  const sumJson = (await sumRes.json()) as any;
  const result = sumJson?.result || {};

  const abstractsById = await fetchPubmedAbstracts(ids, apiKey);
  const matchers = buildTermMatchers(params.terms);

  const items: NormalizedFeedItem[] = [];
  for (const id of ids) {
    const it = result?.[id];
    if (!it) continue;
    const titleFromSummary = String(it.title || '').trim();
    const abs = abstractsById.get(id);
    const title = (abs?.title || titleFromSummary).trim();
    const pubDate = toIsoDate(it.pubdate || it.epubdate);

    const hayTitle = title.toLowerCase();
    const hayAbs = (abs?.abstract || '').toLowerCase();

    const matchedTerms: string[] = [];
    const matchedFields = new Set<'title' | 'summary'>();
    let matchedAmbiguousOnly = true;

    for (const m of matchers) {
      const inTitle = m.re.test(hayTitle);
      const inAbs = hayAbs ? m.re.test(hayAbs) : false;
      if (!inTitle && !inAbs) continue;
      matchedTerms.push(m.term);
      if (inTitle) matchedFields.add('title');
      if (inAbs) matchedFields.add('summary');
      if (!m.isAmbiguous) matchedAmbiguousOnly = false;
    }

    // Extremely selective: drop anything that doesn't explicitly mention the target/asset.
    if (!matchedTerms.length) continue;

    // If the only matches are ambiguous short symbols, require a title match.
    if (matchedAmbiguousOnly && !matchedFields.has('title')) continue;

    // Further disambiguation for MET-like symbols: require gene/receptor context when we match ambiguous tokens.
    if (matchedAmbiguousOnly) {
      const contextRe = /\b(gene|receptor|oncogene|kinase|hgfr|c[-\s]?met|proto-oncogene)\b/i;
      const ctxOk = contextRe.test(title) || contextRe.test(abs?.abstract || '');
      if (!ctxOk) continue;
    }

    // Score: title mention > abstract mention; newer gets a slight boost via overall sort.
    const score = (matchedFields.has('title') ? 0.92 : 0.82) + (matchedFields.has('summary') ? 0.04 : 0);

    items.push({
      id: `PMID:${id}`,
      title: title || `PubMed ${id}`,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: 'PubMed',
      publishedAt: pubDate,
      summary: clamp(abs?.abstract || it.source ? `${it.source}. ${it.fulljournalname || ''}` : it.fulljournalname || '', 260),
      kind: 'publication',
      relevance: matchedFields.has('title') ? 'high' : 'medium',
      tags: ['pubmed', matchedFields.has('title') ? 'target-in-title' : 'target-in-abstract'],
      score,
      matchedTerms: uniqStrings(matchedTerms),
      matchedFields: Array.from(matchedFields),
    });
  }
  return items.slice(0, max);
}

async function fetchClinicalTrialsItems(query: string, max: number): Promise<NormalizedFeedItem[]> {
  const url = new URL('https://clinicaltrials.gov/api/v2/studies');
  url.searchParams.set('query.term', query);
  url.searchParams.set('pageSize', String(Math.min(10, max)));
  // Keep it light: summary fields only
  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) throw new Error(`ClinicalTrials.gov failed (${res.status})`);
  const jsonBody = (await res.json()) as any;
  const studies: any[] = jsonBody?.studies || [];

  const items: NormalizedFeedItem[] = [];
  for (const s of studies) {
    const protocol = s?.protocolSection;
    const idMod = protocol?.identificationModule;
    const statusMod = protocol?.statusModule;
    const nct = idMod?.nctId;
    if (!nct) continue;
    const title = idMod?.briefTitle || `Clinical trial ${nct}`;
    const date = toIsoDate(statusMod?.studyFirstSubmitDate || statusMod?.startDateStruct?.date);
    const condition = (protocol?.conditionsModule?.conditions || []).slice(0, 2).join(', ');
    items.push({
      id: `NCT:${nct}`,
      title,
      url: `https://clinicaltrials.gov/study/${encodeURIComponent(nct)}`,
      source: 'ClinicalTrials.gov',
      publishedAt: date,
      summary: clamp(condition ? `Conditions: ${condition}` : 'Clinical trial record', 220),
      kind: 'clinical',
      relevance: 'medium',
      tags: ['clinical trial'],
      score: 0.75,
      matchedTerms: [],
      matchedFields: [],
    });
  }
  return items.slice(0, max);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const url = getUrl(req);
    const target = url.searchParams.get('target')?.trim() || undefined;
    const q = url.searchParams.get('q')?.trim() || undefined;
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || DEFAULT_LIMIT)));
    const fresh = url.searchParams.get('fresh') === 'true';

    const query = target || q;
    if (!query) return json(res, 400, { error: 'Missing target or q' });

    const key = `feed:${query.toLowerCase()}:${limit}`;
    const cached = cache.get(key);
    if (!fresh && cached && cached.expiresAt > Date.now()) {
      return json(res, 200, { ...cached.data, cached: true });
    }

    const synonyms = (url.searchParams.get('synonyms') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const expanded = expandKnownSynonyms(query);
    const asset = url.searchParams.get('asset')?.trim() || undefined;
    const company = url.searchParams.get('company')?.trim() || undefined;

    const terms = uniqStrings([query, ...synonyms, ...expanded, asset || ''].filter(Boolean));

    const queryPack = {
      target,
      asset,
      company,
      indication: url.searchParams.get('indication')?.trim() || undefined,
      synonyms: uniqStrings([...synonyms, ...expanded]).slice(0, 10),
      pubmedQuery: buildPubmedQuery({ terms, strict: true }),
      newsQuery: `${query} biotech OR pharma`,
      trialsQuery: `${query} AND (trial OR phase)`,
      terms,
    };

    const errors: FeedResponse['errors'] = [];
    const items: NormalizedFeedItem[] = [];
    let partial = false;

    try {
      items.push(...(await fetchPubmedItems({ pubmedQuery: queryPack.pubmedQuery, terms: queryPack.terms }, Math.ceil(limit / 2))));
    } catch (e: any) {
      partial = true;
      errors.push({ sourceId: 'pubmed', source: 'PubMed', message: e?.message || 'PubMed fetch failed' });
    }

    try {
      items.push(...(await fetchClinicalTrialsItems(queryPack.trialsQuery, Math.ceil(limit / 2))));
    } catch (e: any) {
      partial = true;
      errors.push({
        sourceId: 'clinicaltrials',
        source: 'ClinicalTrials.gov',
        message: e?.message || 'ClinicalTrials fetch failed',
      });
    }

    // Sort by score then recency
    items.sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const response: FeedResponse = {
      query,
      queryPack,
      sources: Array.from(new Set(items.map((i) => i.source))),
      items: items.slice(0, limit),
      fetchedAt: new Date().toISOString(),
      cached: false,
      partial,
      errors,
    };

    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data: response });
    return json(res, 200, response);
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Failed to build feed' });
  }
}

