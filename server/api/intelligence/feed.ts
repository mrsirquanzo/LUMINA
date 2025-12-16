import { Router } from 'express';
import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import { buildEntryKey, upsertFeedItems, getStoredFeedItems } from '../../lib/intelligence/store';

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

interface QueryPack {
  target?: string;
  asset?: string;
  company?: string;
  indication?: string;
  synonyms: string[];
  pubmedQuery: string;
  newsQuery: string;
  trialsQuery: string;
  terms: string[];
}

interface FeedResponse {
  query: string;
  queryPack: QueryPack;
  sources: string[];
  items: NormalizedFeedItem[];
  fetchedAt: string;
  cached: boolean;
  partial: boolean;
  errors: Array<{ sourceId: string; source: string; message: string }>;
  unreadCount?: number;
  entryKey?: string;
}

const router = Router();

const DEFAULT_LIMIT = 30;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 12_000;

const cache = new Map<string, { expiresAt: number; data: FeedResponse }>();

// Conservative alias-based normalization for target-like strings
// (kept intentionally small to avoid mangling general terms).
const TARGET_DISPLAY_ALIASES: Record<string, string> = {
  // TROP2 (TACSTD2)
  trop2: 'TROP2',
  'trop-2': 'TROP2',
  'trop 2': 'TROP2',
  tacstd2: 'TROP2',

  // HER2 (ERBB2)
  her2: 'HER2',
  'her-2': 'HER2',
  'her 2': 'HER2',
  erbb2: 'HER2',

  // KRAS G12C
  'kras g12c': 'KRAS G12C',
  'kras-g12c': 'KRAS G12C',
  krasg12c: 'KRAS G12C',
};

function normalizeAliasKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '');
}

function canonicalizeTargetTerm(input: string | undefined): string | undefined {
  const trimmed = input?.trim();
  if (!trimmed) return undefined;

  const key = normalizeAliasKey(trimmed);
  const direct = TARGET_DISPLAY_ALIASES[key];
  if (direct) return direct;

  const compact = TARGET_DISPLAY_ALIASES[key.replace(/[\s-]/g, '')];
  if (compact) return compact;

  return trimmed;
}

function toIsoDate(input: string | undefined): string {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function stripHtml(input: string): string {
  if (!input) return '';
  // Many feeds embed HTML inside <description>/<content>.
  const $ = cheerio.load(input);
  return $.text().replace(/\s+/g, ' ').trim();
}

function clampSummary(input: string, maxLen = 260): string {
  const s = stripHtml(input);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1).trimEnd()}…`;
}

function sourceKey(source: string): string {
  return source
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortHash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 10);
}

function extractPmid(rawUrlOrId: string): string | null {
  const m1 = rawUrlOrId.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\b/i);
  if (m1) return m1[1];
  const m2 = rawUrlOrId.match(/\bPMID:(\d+)\b/i);
  if (m2) return m2[1];
  const m3 = rawUrlOrId.match(/PubMed:publication:(\d+)/i);
  if (m3) return m3[1];
  return null;
}

function extractNctId(rawUrlOrId: string): string | null {
  const m1 = rawUrlOrId.match(/clinicaltrials\.gov\/study\/(NCT\d{8})\b/i);
  if (m1) return m1[1].toUpperCase();
  const m2 = rawUrlOrId.match(/\bNCT:(NCT\d{8})\b/i);
  if (m2) return m2[1].toUpperCase();
  const m3 = rawUrlOrId.match(/\b(NCT\d{8})\b/i);
  if (m3) return m3[1].toUpperCase();
  return null;
}

function canonicalizeItemUrl(source: string, url: string): string {
  if (source.toLowerCase() !== 'pubmed') return url;
  const pmid = extractPmid(url);
  if (!pmid) return url;
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

function canonicalizeItemId(source: string, kind: FeedItemKind, url: string): string {
  const s = source.trim();
  const sk = sourceKey(s);

  if (s.toLowerCase() === 'pubmed') {
    const pmid = extractPmid(url);
    if (pmid) return `PMID:${pmid}`;
  }

  if (s.toLowerCase().includes('clinicaltrials')) {
    const nct = extractNctId(url);
    if (nct) return `NCT:${nct}`;
  }

  return `${sk}:${kind}:${shortHash(url)}`;
}

function safeText($: cheerio.CheerioAPI, el: unknown, selector: string): string {
  return $(el as never).find(selector).first().text().trim();
}

function getFirstLink($: cheerio.CheerioAPI, el: unknown): string {
  const rssLink = $(el as never).find('link').first().text().trim();
  if (rssLink) return rssLink;
  const atomHref = $(el as never).find('link').first().attr('href')?.trim();
  if (atomHref) return atomHref;
  // Some Atom feeds have multiple <link rel="alternate" href="...">
  const altHref = $(el as never).find('link[rel="alternate"]').first().attr('href')?.trim();
  return altHref || '';
}

function computeRelevance(tags: string[], haystack: string): FeedItemRelevance {
  const q = haystack.toLowerCase();
  if (!q) return 'low';

  const strongHits = tags.filter((t) => q.includes(t.toLowerCase())).length;
  if (strongHits >= 2) return 'high';
  if (strongHits >= 1) return 'medium';
  return 'low';
}

function extractQueryTags(query: string): string[] {
  // Very lightweight tokenization; avoid single-letter noise.
  const tokens = query
    .split(/[\s,+/()]+/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 3);

  // Deduplicate while preserving order.
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of tokens) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(t);
  }
  return tags.slice(0, 6);
}

function uniqPreserve<T>(items: T[]): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const key = String(it).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function normalizeTerm(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

function expandTermVariants(term: string): string[] {
  const t = normalizeTerm(term);
  if (!t) return [];
  const lower = t.toLowerCase();
  const noDash = lower.replace(/[-‐‑‒–—]/g, '');
  const dashed = lower.replace(/(\w)(\d+)/g, '$1-$2');
  return uniqPreserve([t, lower, noDash, dashed]).filter(Boolean);
}

const STOPWORD_TERMS = new Set(
  [
    'oncology',
    'cancer',
    'tumor',
    'tumour',
    'biotech',
    'pharma',
    'pharmaceutical',
    'drug',
    'drugs',
    'therapy',
    'therapeutic',
    'clinical',
    'trial',
    'trials',
    'study',
    'studies',
    'disease',
    'treatment',
  ].map((s) => s.toLowerCase())
);

function filterDisplayTerms(terms: string[]): string[] {
  return terms
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 3)
    .filter((t) => !STOPWORD_TERMS.has(t.toLowerCase()))
    .slice(0, 8);
}

function buildVariantIndex(terms: string[]) {
  return terms.map((canonical) => ({ canonical, variants: expandTermVariants(canonical) }));
}

function buildQueryPack(input: {
  q?: string;
  target?: string;
  asset?: string;
  company?: string;
  indication?: string;
  synonyms?: string[];
}): QueryPack {
  const target = canonicalizeTargetTerm(input.target);
  const asset = input.asset?.trim() || undefined;
  const company = input.company?.trim() || undefined;
  const indication = input.indication?.trim() || undefined;
  const synonyms = (input.synonyms ?? [])
    .map(normalizeTerm)
    .map((t) => canonicalizeTargetTerm(t) ?? t)
    .filter(Boolean);

  const baseQ = input.q?.trim();

  // Canonical terms (no variants) that we want to surface to users.
  const canonicalTerms = uniqPreserve(
    [target, asset, company, indication, ...synonyms, ...(baseQ ? extractQueryTags(baseQ) : [])]
      .map((t) => (typeof t === 'string' ? (canonicalizeTargetTerm(t) ?? t) : t))
      .filter(Boolean) as string[]
  );

  // Keep display terms small + avoid generic buzzwords.
  const terms = filterDisplayTerms(canonicalTerms);

  // If user provided a freeform topic, keep it as the main query.
  const seed = baseQ || [target, asset, company, indication].filter(Boolean).join(' ') || 'biotech';

  const pubmedParts = uniqPreserve([target, asset, ...synonyms].filter(Boolean) as string[]);
  const pubmedQuery =
    pubmedParts.length > 0
      ? pubmedParts.map((p) => `"${p}"[Title/Abstract]`).join(' OR ')
      : seed;

  const newsParts = uniqPreserve([seed, target, asset, company, ...synonyms].filter(Boolean) as string[]);
  const newsQuery = newsParts.join(' ');

  const trialsParts = uniqPreserve([target, asset, company, ...synonyms].filter(Boolean) as string[]);
  const trialsQuery = trialsParts.length ? trialsParts.join(' ') : seed;

  return {
    target,
    asset,
    company,
    indication,
    synonyms,
    pubmedQuery,
    newsQuery,
    trialsQuery,
    terms,
  };
}

function computeMatchMeta(args: {
  title: string;
  summary: string;
  termIndex: Array<{ canonical: string; variants: string[] }>;
}) {
  const title = args.title.toLowerCase();
  const summary = args.summary.toLowerCase();
  const matchedTerms: string[] = [];
  const matchedFields: Array<'title' | 'summary'> = [];

  for (const { canonical, variants } of args.termIndex) {
    const needles = variants.map((v) => v.toLowerCase()).filter((v) => v.length >= 3);
    if (!needles.length) continue;

    const inTitle = needles.some((n) => title.includes(n));
    const inSummary = needles.some((n) => summary.includes(n));
    if (!inTitle && !inSummary) continue;

    matchedTerms.push(canonical);
    if (inTitle && !matchedFields.includes('title')) matchedFields.push('title');
    if (inSummary && !matchedFields.includes('summary')) matchedFields.push('summary');
  }

  const uniqMatched = uniqPreserve(matchedTerms)
    .filter((t) => !STOPWORD_TERMS.has(t.toLowerCase()))
    .slice(0, 6);
  return { matchedTerms: uniqMatched, matchedFields };
}

function computeScore(args: {
  publishedAt: string;
  matchedTerms: string[];
  matchedFields: Array<'title' | 'summary'>;
}): number {
  const now = Date.now();
  const ts = new Date(args.publishedAt).getTime();
  const ageDays = Number.isFinite(ts) ? Math.max(0, (now - ts) / (1000 * 60 * 60 * 24)) : 365;
  const recency = Math.exp(-ageDays / 14); // ~2-week half-life-ish

  const termBoost = Math.min(1, args.matchedTerms.length / 4);
  const fieldBoost = args.matchedFields.includes('title') ? 1 : 0.7;
  const score = 0.55 * recency + 0.35 * termBoost + 0.10 * fieldBoost;
  return Math.max(0, Math.min(1, score));
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'LUMINA/1.0 (+https://lumina.local)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch feed (${res.status})`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFinalUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(7_000, FETCH_TIMEOUT_MS));
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'LUMINA/1.0 (+https://lumina.local)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    const finalUrl = res.url || url;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('html')) return finalUrl;
    const html = await res.text();
    // Try to extract explicit ?url=... redirects from page HTML
    const m = html.match(/https?:\/\/[^"'\\s>]+/g)?.find((u) => u.startsWith('http') && !u.includes('news.google.com'));
    return m || finalUrl;
  } catch {
    return url;
  } finally {
    clearTimeout(timeout);
  }
}

function tryDecodeGoogleNewsUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const urlParam = u.searchParams.get('url');
    if (urlParam && /^https?:\/\//i.test(urlParam)) return urlParam;
  } catch {
    // ignore
  }
  const m = rawUrl.match(/[?&]url=(https?:%2F%2F[^&]+)/i);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  return null;
}

async function resolveGoogleNewsUrl(rawUrl: string): Promise<string> {
  const decoded = tryDecodeGoogleNewsUrl(rawUrl);
  if (decoded) return decoded;
  if (!rawUrl.includes('news.google.com')) return rawUrl;
  const finalUrl = await fetchFinalUrl(rawUrl);
  const decoded2 = tryDecodeGoogleNewsUrl(finalUrl);
  return decoded2 || finalUrl;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'LUMINA/1.0 (+https://lumina.local)',
        accept: 'application/json, text/json;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch feed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRssOrAtom(xml: string, source: string, kind: FeedItemKind, queryPack: QueryPack): NormalizedFeedItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });

  const queryTags = queryPack.terms.length ? queryPack.terms : extractQueryTags(queryPack.newsQuery);
  const termIndex = buildVariantIndex(queryTags);

  const rssItems = $('item');
  if (rssItems.length > 0) {
    const items: NormalizedFeedItem[] = [];
    rssItems.each((idx, el) => {
      const title = safeText($, el, 'title') || '(untitled)';
      const url = getFirstLink($, el);
      const publishedAt =
        toIsoDate(safeText($, el, 'pubDate') || safeText($, el, 'dc\\:date') || safeText($, el, 'date'));
      const summary =
        clampSummary(safeText($, el, 'description') || safeText($, el, 'content\\:encoded') || '');

      if (!url) return;
      const urlOut = canonicalizeItemUrl(source, url);
      const tags = queryTags;
      const matchMeta = computeMatchMeta({ title, summary, termIndex });
      const score = computeScore({ publishedAt, matchedTerms: matchMeta.matchedTerms, matchedFields: matchMeta.matchedFields });
      items.push({
        id: canonicalizeItemId(source, kind, urlOut),
        title,
        url: urlOut,
        source,
        publishedAt,
        summary,
        kind,
        relevance: computeRelevance(tags, `${title} ${summary}`),
        tags,
        score,
        matchedTerms: matchMeta.matchedTerms,
        matchedFields: matchMeta.matchedFields,
      });
    });
    return items;
  }

  const atomEntries = $('entry');
  if (atomEntries.length > 0) {
    const items: NormalizedFeedItem[] = [];
    atomEntries.each((idx, el) => {
      const title = safeText($, el, 'title') || '(untitled)';
      const url = getFirstLink($, el);
      const publishedAt = toIsoDate(safeText($, el, 'published') || safeText($, el, 'updated'));
      const summary = clampSummary(safeText($, el, 'summary') || safeText($, el, 'content') || '');

      if (!url) return;
      const urlOut = canonicalizeItemUrl(source, url);
      const tags = queryTags;
      const matchMeta = computeMatchMeta({ title, summary, termIndex });
      const score = computeScore({ publishedAt, matchedTerms: matchMeta.matchedTerms, matchedFields: matchMeta.matchedFields });
      items.push({
        id: canonicalizeItemId(source, kind, urlOut),
        title,
        url: urlOut,
        source,
        publishedAt,
        summary,
        kind,
        relevance: computeRelevance(tags, `${title} ${summary}`),
        tags,
        score,
        matchedTerms: matchMeta.matchedTerms,
        matchedFields: matchMeta.matchedFields,
      });
    });
    return items;
  }

  return [];
}

function getDefaultFeedUrls(query: string): Array<{ id: string; url: string; source: string; kind: FeedItemKind }> {
  // Start with sources that don't require API keys and reliably support query-based freshness.
  const q = encodeURIComponent(query);
  return [
    {
      id: 'pubmed',
      url: `https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=${q}&sort=date`,
      source: 'PubMed',
      kind: 'publication',
    },
    {
      id: 'clinicaltrials',
      url: `https://clinicaltrials.gov/api/v2/studies?query.term=${q}&pageSize=25`,
      source: 'ClinicalTrials.gov',
      kind: 'clinical',
    },
    {
      id: 'gdelt',
      url: `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=ArtList&format=json&sort=HybridRel&maxrecords=25`,
      source: 'GDELT',
      kind: 'news',
    },
  ];
}

async function fetchGdeltNews(query: string, queryPack: QueryPack, limit: number): Promise<NormalizedFeedItem[]> {
  const q = encodeURIComponent(query);
  const pageSize = Math.max(1, Math.min(50, limit));
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=ArtList&format=json&sort=HybridRel&maxrecords=${pageSize}`;
  const data = await fetchJsonWithTimeout<{
    articles?: Array<{
      url?: string;
      title?: string;
      seendate?: string;
      domain?: string;
      sourceCountry?: string;
      language?: string;
      socialimage?: string;
    }>;
  }>(url);

  const tags = queryPack.terms.length ? queryPack.terms : extractQueryTags(query);
  const termIndex = buildVariantIndex(tags);
  const items: NormalizedFeedItem[] = [];

  for (const a of data.articles ?? []) {
    const urlOut = String(a.url || '').trim();
    if (!urlOut) continue;
    const title = String(a.title || '').trim() || '(untitled)';
    const publishedAt = toIsoDate(a.seendate ? String(a.seendate) : undefined);
    const domain = String(a.domain || '').trim();
    const summary = clampSummary(domain ? `Source: ${domain}` : 'News article', 200);
    const matchMeta = computeMatchMeta({ title, summary, termIndex });
    const score = computeScore({ publishedAt, matchedTerms: matchMeta.matchedTerms, matchedFields: matchMeta.matchedFields });

    items.push({
      id: canonicalizeItemId('GDELT', 'news', urlOut),
      title,
      url: urlOut,
      source: domain || 'GDELT',
      publishedAt,
      summary,
      kind: 'news',
      relevance: computeRelevance(tags, `${title} ${summary}`),
      tags,
      score,
      matchedTerms: matchMeta.matchedTerms,
      matchedFields: matchMeta.matchedFields,
    });
  }

  return items;
}

async function fetchClinicalTrialsGov(query: string, queryPack: QueryPack, limit: number): Promise<NormalizedFeedItem[]> {
  const q = encodeURIComponent(query);
  const pageSize = Math.max(1, Math.min(50, limit));
  const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${q}&pageSize=${pageSize}`;
  const data = await fetchJsonWithTimeout<{
    studies?: Array<{
      protocolSection?: {
        identificationModule?: {
          nctId?: string;
          briefTitle?: string;
          officialTitle?: string;
          organization?: { fullName?: string };
        };
        statusModule?: {
          overallStatus?: string;
          lastUpdatePostDateStruct?: { date?: string };
          startDateStruct?: { date?: string };
        };
        descriptionModule?: { briefSummary?: string };
        conditionsModule?: { conditions?: string[] };
        designModule?: { phases?: string[]; studyType?: string };
      };
    }>;
  }>(url);

  const terms = queryPack.terms;
  const tags = terms.length ? terms : extractQueryTags(query);
  const termIndex = buildVariantIndex(tags);

  const items: NormalizedFeedItem[] = [];
  for (const s of data.studies ?? []) {
    const idMod = s.protocolSection?.identificationModule;
    const statusMod = s.protocolSection?.statusModule;
    const descMod = s.protocolSection?.descriptionModule;
    const condMod = s.protocolSection?.conditionsModule;
    const designMod = s.protocolSection?.designModule;

    const nctId = idMod?.nctId?.trim();
    if (!nctId) continue;

    const title = (idMod?.briefTitle || idMod?.officialTitle || `Clinical trial ${nctId}`).trim();
    const sponsor = idMod?.organization?.fullName?.trim();
    const status = statusMod?.overallStatus?.trim();
    const updatedAt = statusMod?.lastUpdatePostDateStruct?.date?.trim();
    const startAt = statusMod?.startDateStruct?.date?.trim();
    const publishedAt = toIsoDate(updatedAt || startAt);
    const phases = (designMod?.phases ?? []).filter(Boolean).join(', ');
    const conditions = (condMod?.conditions ?? []).slice(0, 3).join(', ');
    const summaryText = descMod?.briefSummary ? clampSummary(descMod.briefSummary, 260) : '';
    const summaryParts = [
      phases ? `Phase: ${phases}` : undefined,
      status ? `Status: ${status}` : undefined,
      sponsor ? `Sponsor: ${sponsor}` : undefined,
      conditions ? `Conditions: ${conditions}` : undefined,
    ].filter(Boolean);
    const summary = summaryText || summaryParts.join(' • ');

    const urlOut = `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`;
    const matchMeta = computeMatchMeta({ title, summary, termIndex });
    const score = computeScore({ publishedAt, matchedTerms: matchMeta.matchedTerms, matchedFields: matchMeta.matchedFields });

    items.push({
      id: `NCT:${nctId}`,
      title,
      url: urlOut,
      source: 'ClinicalTrials.gov',
      publishedAt,
      summary,
      kind: 'clinical',
      relevance: computeRelevance(tags, `${title} ${summary}`),
      tags,
      score,
      matchedTerms: matchMeta.matchedTerms,
      matchedFields: matchMeta.matchedFields,
    });
  }

  return items;
}

async function fetchPubmedViaEutils(query: string, queryPack: QueryPack, limit: number): Promise<NormalizedFeedItem[]> {
  // PubMed RSS is sometimes flaky; E-utilities tends to be more stable.
  const q = encodeURIComponent(query);
  const retmax = Math.max(1, Math.min(50, limit));
  const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=date&retmax=${retmax}&term=${q}`;

  const esearch = await fetchJsonWithTimeout<{
    esearchresult?: { idlist?: string[] };
  }>(esearchUrl);

  const ids = esearch.esearchresult?.idlist?.filter(Boolean) ?? [];
  if (!ids.length) return [];

  const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${encodeURIComponent(
    ids.join(',')
  )}`;

  const esummary = await fetchJsonWithTimeout<{
    result?: Record<
      string,
      | {
          uid?: string;
          title?: string;
          pubdate?: string;
          source?: string;
          authors?: Array<{ name?: string }>;
          elocationid?: string;
        }
      | unknown
    > & { uids?: string[] };
  }>(esummaryUrl);

  const result = esummary.result ?? {};
  const uids = (result.uids as string[] | undefined)?.filter(Boolean) ?? ids;
  const queryTags = queryPack.terms.length ? queryPack.terms : extractQueryTags(query);
  const termIndex = buildVariantIndex(queryTags);

  const items: NormalizedFeedItem[] = [];
  for (const uid of uids) {
    const entry = result[uid] as
      | {
          uid?: string;
          title?: string;
          pubdate?: string;
          source?: string;
          authors?: Array<{ name?: string }>;
        }
      | undefined;

    if (!entry || typeof entry !== 'object') continue;
    const title = String(entry.title || '').trim() || '(untitled)';
    const publishedAt = toIsoDate(String(entry.pubdate || '').trim());
    const journal = String(entry.source || 'PubMed').trim();
    const author = entry.authors?.[0]?.name ? ` • ${entry.authors[0].name}` : '';
    const url = `https://pubmed.ncbi.nlm.nih.gov/${uid}/`;
    const summary = clampSummary(`${journal}${author}`, 200);
    const tags = queryTags;
    const matchMeta = computeMatchMeta({ title, summary, termIndex });
    const score = computeScore({ publishedAt, matchedTerms: matchMeta.matchedTerms, matchedFields: matchMeta.matchedFields });

    items.push({
      id: `PMID:${uid}`,
      title,
      url,
      source: 'PubMed',
      publishedAt,
      summary,
      kind: 'publication',
      relevance: computeRelevance(tags, `${title} ${summary}`),
      tags,
      score,
      matchedTerms: matchMeta.matchedTerms,
      matchedFields: matchMeta.matchedFields,
    });
  }

  return items;
}

async function fetchSourceItems(
  feed: { id: string; url: string; source: string; kind: FeedItemKind },
  query: string,
  queryPack: QueryPack,
  limit: number
) {
  if (feed.id === 'pubmed') {
    try {
      return await fetchPubmedViaEutils(query, queryPack, limit);
    } catch (e) {
      // Fall back to RSS in case E-utilities fails for some reason.
      const xml = await fetchWithTimeout(feed.url);
      return parseRssOrAtom(xml, feed.source, feed.kind, queryPack);
    }
  }

  if (feed.id === 'clinicaltrials') {
    return await fetchClinicalTrialsGov(query, queryPack, limit);
  }

  if (feed.id === 'gdelt') {
    return await fetchGdeltNews(query, queryPack, limit);
  }

  const xml = await fetchWithTimeout(feed.url);
  const parsed = parseRssOrAtom(xml, feed.source, feed.kind, queryPack);
  if (feed.id === 'google-news') {
    // Best-effort: resolve Google News RSS links to underlying publisher URLs.
    const resolved = await mapLimit(parsed, 5, async (it) => {
      const resolvedUrl = await resolveGoogleNewsUrl(it.url);
      const urlOut = resolvedUrl || it.url;
      return { ...it, url: urlOut, id: canonicalizeItemId(feed.source, feed.kind, urlOut) };
    });
    return resolved;
  }
  return parsed;
}

router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const target = String(req.query.target || '').trim();
  const asset = String(req.query.asset || '').trim();
  const company = String(req.query.company || '').trim();
  const indication = String(req.query.indication || '').trim();
  const synonyms = String(req.query.synonyms || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const queryPack = buildQueryPack({
    q: q || undefined,
    target: target || undefined,
    asset: asset || undefined,
    company: company || undefined,
    indication: indication || undefined,
    synonyms,
  });

  const query = q || queryPack.pubmedQuery || 'biotech';

  const limit = Math.max(1, Math.min(100, Number(req.query.limit || DEFAULT_LIMIT)));
  const forceFresh = String(req.query.fresh || '').toLowerCase() === 'true';
  console.info('[intelligence-feed] request', {
    q: q || undefined,
    target: queryPack.target,
    asset: queryPack.asset,
    company: queryPack.company,
    limit,
    forceFresh,
  });

  const sourcesParam = String(req.query.sources || '').trim();
  const requestedSources = sourcesParam
    ? sourcesParam
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const allFeeds = getDefaultFeedUrls(queryPack.newsQuery || query);
  const feeds = requestedSources.length
    ? allFeeds.filter((f) => requestedSources.includes(f.id))
    : allFeeds;

  const cacheKey = JSON.stringify({ queryPack, limit, sources: feeds.map((f) => f.id).sort() });
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (!forceFresh && cached && cached.expiresAt > now) {
    res.setHeader('cache-control', 'private, max-age=0, must-revalidate');
    return res.json(cached.data);
  }

  try {
    const settled = await Promise.allSettled(
      feeds.map(async (f) => {
        const sourceQuery =
          f.id === 'pubmed'
            ? queryPack.pubmedQuery
            : f.id === 'clinicaltrials'
              ? queryPack.trialsQuery
              : queryPack.newsQuery;
        return await fetchSourceItems(f, sourceQuery || query, queryPack, limit);
      })
    );

    const errors: FeedResponse['errors'] = [];
    const feedResults: NormalizedFeedItem[][] = [];

    for (const [idx, result] of settled.entries()) {
      const feed = feeds[idx];
      if (result.status === 'fulfilled') {
        feedResults.push(result.value);
        continue;
      }

      const message = result.reason instanceof Error ? result.reason.message : 'Unknown error';
      errors.push({ sourceId: feed?.id || 'unknown', source: feed?.source || 'Unknown', message });
    }
    if (errors.length) console.warn('[intelligence-feed] source errors', errors);

    let items = feedResults
      .flat()
      .filter((it) => it.url)
      .sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);

    // Compute entryKey early so we can use it for fallback
    const entryKey = buildEntryKey({
      target: queryPack.target,
      asset: queryPack.asset,
      company: queryPack.company,
      indication: queryPack.indication,
    });

    // Fallback: if all live sources failed or returned nothing, serve last known items
    let usingFallback = false;
    let fallbackFetchedAt: string | undefined;
    if (items.length === 0) {
      const stored = await getStoredFeedItems(entryKey);
      if (stored.items.length > 0) {
        console.info('[intelligence-feed] serving fallback items from store', { 
          requestedKey: entryKey, 
          matchedKey: stored.matchedKey,
          count: stored.items.length 
        });
        items = stored.items.slice(0, limit).map((it) => ({
          id: it.id,
          title: it.title,
          url: it.url,
          source: it.source,
          publishedAt: it.publishedAt,
          summary: it.summary,
          kind: it.kind as FeedItemKind,
          relevance: 'medium' as FeedItemRelevance,
          tags: [],
          score: 0.5,
          matchedTerms: [],
          matchedFields: [],
        }));
        usingFallback = true;
        fallbackFetchedAt = stored.lastFetchedAt;
      }
    }

    const data: FeedResponse = {
      query,
      queryPack,
      sources: feeds.map((f) => f.id),
      items,
      fetchedAt: usingFallback && fallbackFetchedAt ? fallbackFetchedAt : new Date().toISOString(),
      cached: usingFallback,
      partial: errors.length > 0,
      errors,
    };

    // Phase 2: persist + compute unread count for this target/asset context
    // Only persist if we got fresh items (not fallback)
    if (!usingFallback && items.length > 0) {
      const persisted = await upsertFeedItems({
        entryKey,
        fetchedAt: data.fetchedAt,
        items: items.map((it) => ({
          id: it.id,
          url: it.url,
          title: it.title,
          source: it.source,
          kind: it.kind,
          publishedAt: it.publishedAt,
          summary: it.summary,
        })),
      });
      data.unreadCount = persisted.unreadCount;
    }
    data.entryKey = entryKey;

    cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data });
    res.setHeader('cache-control', 'private, max-age=0, must-revalidate');
    return res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[intelligence-feed] fatal', err);
    return res.status(500).json({ error: 'Failed to load intelligence feed', message });
  }
});

export default router;
