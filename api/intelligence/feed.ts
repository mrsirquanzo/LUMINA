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

async function fetchPubmedItems(query: string, max: number): Promise<NormalizedFeedItem[]> {
  // PubMed eutils: esearch -> esummary
  const esearch = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  esearch.searchParams.set('db', 'pubmed');
  esearch.searchParams.set('retmode', 'json');
  esearch.searchParams.set('retmax', String(Math.min(10, max)));
  esearch.searchParams.set('term', query);
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

  const items: NormalizedFeedItem[] = [];
  for (const id of ids) {
    const it = result?.[id];
    if (!it) continue;
    const title = String(it.title || '').trim();
    const pubDate = toIsoDate(it.pubdate || it.epubdate);
    items.push({
      id: `PMID:${id}`,
      title: title || `PubMed ${id}`,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: 'PubMed',
      publishedAt: pubDate,
      summary: clamp(it.source ? `${it.source}. ${it.fulljournalname || ''}` : it.fulljournalname || '', 220),
      kind: 'publication',
      relevance: 'high',
      tags: ['pubmed'],
      score: 0.9,
      matchedTerms: [],
      matchedFields: [],
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

    const terms = [query, ...synonyms].filter(Boolean);
    const termQuery = terms.map((t) => `"${t}"`).join(' OR ');

    const queryPack = {
      target,
      asset: url.searchParams.get('asset')?.trim() || undefined,
      company: url.searchParams.get('company')?.trim() || undefined,
      indication: url.searchParams.get('indication')?.trim() || undefined,
      synonyms,
      pubmedQuery: `${termQuery} AND (cancer OR oncology)`,
      newsQuery: `${query} biotech OR pharma`,
      trialsQuery: `${query} AND (trial OR phase)`,
      terms,
    };

    const errors: FeedResponse['errors'] = [];
    const items: NormalizedFeedItem[] = [];
    let partial = false;

    try {
      items.push(...(await fetchPubmedItems(queryPack.pubmedQuery, Math.ceil(limit / 2))));
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

