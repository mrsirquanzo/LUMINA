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
// Longer cache for demo stability; clients can force refresh with fresh=true
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 12_000;

const cache = new Map<string, { expiresAt: number; data: FeedResponse }>();

const AMBIGUOUS_SYMBOLS = new Set(['MET', 'KIT', 'YES', 'AND', 'OR', 'NOT']);

const RSS_SOURCES = [
  {
    id: 'stat',
    name: 'STAT News',
    url: 'https://www.statnews.com/feed/',
    kind: 'news' as const,
    weight: 0.92,
  },
  {
    id: 'endpts',
    name: 'Endpoints News',
    url: 'https://endpts.com/feed/',
    kind: 'news' as const,
    weight: 0.88,
  },
  {
    id: 'fiercebiotech',
    name: 'Fierce Biotech',
    url: 'https://www.fiercebiotech.com/rss/xml',
    kind: 'news' as const,
    weight: 0.86,
  },
  {
    id: 'fiercepharma',
    name: 'Fierce Pharma',
    url: 'https://www.fiercepharma.com/rss/xml',
    kind: 'news' as const,
    weight: 0.82,
  },
  {
    id: 'fda-press',
    name: 'FDA Press Announcements',
    url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-announcements/rss.xml',
    kind: 'regulatory' as const,
    weight: 0.9,
  },
  {
    id: 'ema-news',
    name: 'EMA News',
    url: 'https://www.ema.europa.eu/en/news/rss.xml',
    kind: 'regulatory' as const,
    weight: 0.88,
  },
] as const;

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

function makeCacheKey(input: {
  target?: string;
  q?: string;
  asset?: string;
  company?: string;
  indication?: string;
  synonyms: string[];
  limit: number;
}) {
  const parts = [
    'v3',
    `t:${(input.target || '').toLowerCase()}`,
    `q:${(input.q || '').toLowerCase()}`,
    `a:${(input.asset || '').toLowerCase()}`,
    `c:${(input.company || '').toLowerCase()}`,
    `i:${(input.indication || '').toLowerCase()}`,
    `s:${uniqStrings(input.synonyms).map((s) => s.toLowerCase()).join('|')}`,
    `l:${input.limit}`,
  ];
  return `feed:${parts.join(':')}`;
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
  if (compact === 'KIT') return ['KIT', 'CD117', 'stem cell factor receptor', 'c-KIT'];
  if (compact === 'ALK') return ['ALK', 'anaplastic lymphoma kinase'];
  if (compact === 'YES') return ['YES1', 'Yamaguchi sarcoma viral oncogene homolog 1'];
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

function hasBiomedicalContext(text: string, termUpper: string): boolean {
  const base = /\b(gene|receptor|oncogene|kinase|mutation|mutant|fusion|amplif|overexpress|phospho|tyrosine|pathway|signaling|inhibitor|antibody|adc|biomarker)\b/i;
  if (base.test(text)) return true;

  // Term-specific aliases/context for ambiguous symbols
  if (termUpper === 'MET') return /\b(hgfr|c[-\s]?met|hepatocyte growth factor receptor|proto-oncogene)\b/i.test(text);
  if (termUpper === 'KIT') return /\b(cd117|c[-\s]?kit|stem cell factor receptor)\b/i.test(text);
  if (termUpper === 'ALK') return /\b(anaplastic lymphoma kinase|fusion)\b/i.test(text);
  if (termUpper === 'YES') return /\b(yes1|src family|tyrosine kinase)\b/i.test(text);

  // Generic: allow if the ambiguous token is adjacent to a biomedical qualifier
  // e.g., "ALK fusion", "KIT mutation", "MET inhibitor"
  const adjacent = new RegExp(`\\b${escapeRegExp(termUpper)}\\b\\s*(gene|receptor|kinase|mutation|fusion|inhibitor|antibody)\\b`, 'i');
  return adjacent.test(text);
}

function dedupeItems(items: NormalizedFeedItem[]): NormalizedFeedItem[] {
  const out: NormalizedFeedItem[] = [];
  const seen = new Set<string>();

  for (const it of items) {
    let key = it.url;
    try {
      const u = new URL(it.url);
      u.searchParams.delete('utm_source');
      u.searchParams.delete('utm_medium');
      u.searchParams.delete('utm_campaign');
      u.searchParams.delete('utm_term');
      u.searchParams.delete('utm_content');
      key = u.toString();
    } catch {
      // ignore
    }
    const k = `${it.kind}:${key}`.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }

  return out;
}

function parseRssItems(xml: string): Array<{ title: string; url: string; publishedAt?: string; summary?: string }> {
  // Minimal RSS/Atom parsing without deps; assumes trusted source feeds.
  const items: Array<{ title: string; url: string; publishedAt?: string; summary?: string }> = [];

  // RSS <item> blocks
  const rssBlocks = xml.split(/<\/item>/i);
  for (const block of rssBlocks) {
    if (!/<item\b/i.test(block)) continue;
    const title = stripXmlTags(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
    const link = stripXmlTags(block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || '');
    const pubDate = stripXmlTags(block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || '');
    const desc = stripXmlTags(block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || '');
    if (!title || !link) continue;
    items.push({
      title,
      url: link.trim(),
      publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      summary: desc || undefined,
    });
  }

  // Atom <entry> blocks (fallback)
  if (!items.length) {
    const entryBlocks = xml.split(/<\/entry>/i);
    for (const block of entryBlocks) {
      if (!/<entry\b/i.test(block)) continue;
      const title = stripXmlTags(block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
      const linkHref = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i)?.[1] || '';
      const updated = stripXmlTags(block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || '');
      const summary = stripXmlTags(block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || '');
      if (!title || !linkHref) continue;
      items.push({
        title,
        url: linkHref.trim(),
        publishedAt: updated ? new Date(updated).toISOString() : undefined,
        summary: summary || undefined,
      });
    }
  }

  return items;
}

async function fetchRssNewsItems(params: { terms: string[] }, max: number): Promise<NormalizedFeedItem[]> {
  const matchers = buildTermMatchers(params.terms);

  // Fetch multiple sources in parallel
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const res = await fetchWithTimeout(src.url);
      if (!res.ok) throw new Error(`RSS failed (${res.status})`);
      const xml = await res.text();
      return { src, items: parseRssItems(xml) };
    })
  );

  const out: NormalizedFeedItem[] = [];
  for (const settled of results) {
    if (settled.status !== 'fulfilled') continue;
    const { src, items } = settled.value;

    for (const it of items) {
      const title = it.title.trim();
      const url = it.url.trim();
      if (!title || !url) continue;

      const hayTitle = title.toLowerCase();
      const haySummary = (it.summary || '').toLowerCase();

      const matchedTerms: string[] = [];
      const matchedFields = new Set<'title' | 'summary'>();
      let matchedAmbiguousOnly = true;

      for (const m of matchers) {
        const inTitle = m.re.test(hayTitle);
        const inSummary = haySummary ? m.re.test(haySummary) : false;
        if (!inTitle && !inSummary) continue;
        matchedTerms.push(m.term);
        if (inTitle) matchedFields.add('title');
        if (inSummary) matchedFields.add('summary');
        if (!m.isAmbiguous) matchedAmbiguousOnly = false;
      }

      // Extremely selective: require explicit mention in title or summary
      if (!matchedTerms.length) continue;
      // If only ambiguous matches, require title match plus gene/receptor context
      if (matchedAmbiguousOnly) {
        if (!matchedFields.has('title')) continue;
        // Require biomedical context so we don't match "met", "kit", "yes" as common words
        const termUpper = matchedTerms[0]?.replace(/\s+/g, '').toUpperCase() || '';
        const combined = `${title}\n${it.summary || ''}`;
        if (!hasBiomedicalContext(combined, termUpper)) continue;
      }

      const publishedAt = toIsoDate(it.publishedAt);
      const score = src.weight + (matchedFields.has('title') ? 0.05 : 0) + (matchedFields.has('summary') ? 0.02 : 0);

      out.push({
        id: `URL:${src.id}:${hashToBase36(url)}`,
        title,
        url,
        source: src.name,
        publishedAt,
        summary: clamp(it.summary || src.name, 260),
        kind: src.kind,
        relevance: matchedFields.has('title') ? 'high' : 'medium',
        tags: ['news', src.id, matchedFields.has('title') ? 'target-in-title' : 'target-in-summary'],
        score,
        matchedTerms: uniqStrings(matchedTerms),
        matchedFields: Array.from(matchedFields),
      });
    }
  }

  // Sort and cap
  out.sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return out.slice(0, max);
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

async function fetchClinicalTrialsItems(params: { query: string; terms: string[] }, max: number): Promise<NormalizedFeedItem[]> {
  const url = new URL('https://clinicaltrials.gov/api/v2/studies');
  url.searchParams.set('query.term', params.query);
  url.searchParams.set('pageSize', String(Math.min(10, max)));
  // Keep it light: summary fields only
  const res = await fetchWithTimeout(url.toString());
  if (!res.ok) throw new Error(`ClinicalTrials.gov failed (${res.status})`);
  const jsonBody = (await res.json()) as any;
  const studies: any[] = jsonBody?.studies || [];

  const matchers = buildTermMatchers(params.terms);

  const items: NormalizedFeedItem[] = [];
  for (const s of studies) {
    const protocol = s?.protocolSection;
    const idMod = protocol?.identificationModule;
    const statusMod = protocol?.statusModule;
    const descMod = protocol?.descriptionModule;
    const condMod = protocol?.conditionsModule;
    const armsMod = protocol?.armsInterventionsModule;
    const nct = idMod?.nctId;
    if (!nct) continue;
    const title = String(idMod?.briefTitle || idMod?.officialTitle || `Clinical trial ${nct}`).trim();
    const date = toIsoDate(statusMod?.studyFirstSubmitDate || statusMod?.startDateStruct?.date);

    const conditions = (condMod?.conditions || []).slice(0, 4).map((c: any) => String(c)).filter(Boolean);
    const keywords = (condMod?.keywords || []).slice(0, 6).map((k: any) => String(k)).filter(Boolean);
    const briefSummary = String(descMod?.briefSummary || '').trim();
    const interventions = (armsMod?.interventions || [])
      .slice(0, 6)
      .map((iv: any) => String(iv?.name || iv?.description || '').trim())
      .filter(Boolean);

    const hayTitle = title.toLowerCase();
    const haySummary = [briefSummary, ...conditions, ...keywords, ...interventions].join(' ').toLowerCase();

    const matchedTerms: string[] = [];
    const matchedFields = new Set<'title' | 'summary'>();
    let matchedAmbiguousOnly = true;

    for (const m of matchers) {
      const inTitle = m.re.test(hayTitle);
      const inSummary = haySummary ? m.re.test(haySummary) : false;
      if (!inTitle && !inSummary) continue;
      matchedTerms.push(m.term);
      if (inTitle) matchedFields.add('title');
      if (inSummary) matchedFields.add('summary');
      if (!m.isAmbiguous) matchedAmbiguousOnly = false;
    }

    // Extremely selective: require explicit mention in title/summary/interventions/keywords
    if (!matchedTerms.length) continue;

    // If only ambiguous matches (e.g., MET), require title match and gene/receptor context.
    if (matchedAmbiguousOnly) {
      if (!matchedFields.has('title')) continue;
      const contextRe = /\b(gene|receptor|oncogene|kinase|hgfr|c[-\s]?met|proto-oncogene)\b/i;
      const ctxOk =
        contextRe.test(title) ||
        contextRe.test(briefSummary) ||
        interventions.some((v: string) => contextRe.test(v)) ||
        keywords.some((v: string) => contextRe.test(v));
      if (!ctxOk) continue;
    }

    const condition = conditions.slice(0, 2).join(', ');
    const summary = clamp(
      briefSummary ||
        (interventions.length ? `Interventions: ${interventions.slice(0, 2).join(', ')}` : condition ? `Conditions: ${condition}` : 'Clinical trial record'),
      220
    );

    const score = 0.78 + (matchedFields.has('title') ? 0.06 : 0) + (matchedFields.has('summary') ? 0.03 : 0);

    items.push({
      id: `NCT:${nct}`,
      title,
      url: `https://clinicaltrials.gov/study/${encodeURIComponent(nct)}`,
      source: 'ClinicalTrials.gov',
      publishedAt: date,
      summary,
      kind: 'clinical',
      relevance: matchedFields.has('title') ? 'high' : 'medium',
      tags: ['clinical trial', matchedFields.has('title') ? 'target-in-title' : 'target-in-summary'],
      score,
      matchedTerms: uniqStrings(matchedTerms),
      matchedFields: Array.from(matchedFields),
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

    const synonyms = (url.searchParams.get('synonyms') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const expanded = expandKnownSynonyms(query);
    const asset = url.searchParams.get('asset')?.trim() || undefined;
    const company = url.searchParams.get('company')?.trim() || undefined;
    const indication = url.searchParams.get('indication')?.trim() || undefined;

    const terms = uniqStrings([query, ...synonyms, ...expanded, asset || ''].filter(Boolean));
    const allSynonyms = uniqStrings([...synonyms, ...expanded]).slice(0, 10);

    const cacheKey = makeCacheKey({
      target,
      q,
      asset,
      company,
      indication,
      synonyms: allSynonyms,
      limit,
    });

    const cached = cache.get(cacheKey);
    if (!fresh && cached && cached.expiresAt > Date.now()) {
      return json(res, 200, { ...cached.data, cached: true });
    }

    const queryPack = {
      target,
      asset,
      company,
      indication,
      synonyms: allSynonyms,
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
      items.push(...(await fetchRssNewsItems({ terms: queryPack.terms }, Math.ceil(limit / 2))));
    } catch (e: any) {
      partial = true;
      errors.push({ sourceId: 'news', source: 'News', message: e?.message || 'News fetch failed' });
    }

    try {
      items.push(...(await fetchClinicalTrialsItems({ query: queryPack.trialsQuery, terms: queryPack.terms }, Math.ceil(limit / 2))));
    } catch (e: any) {
      partial = true;
      errors.push({
        sourceId: 'clinicaltrials',
        source: 'ClinicalTrials.gov',
        message: e?.message || 'ClinicalTrials fetch failed',
      });
    }

    // Sort by score then recency, then dedupe
    items.sort((a, b) => b.score - a.score || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const deduped = dedupeItems(items);

    const response: FeedResponse = {
      query,
      queryPack,
      sources: Array.from(new Set(deduped.map((i) => i.source))),
      items: deduped.slice(0, limit),
      fetchedAt: new Date().toISOString(),
      cached: false,
      partial,
      errors,
    };

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: response });
    return json(res, 200, response);
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Failed to build feed' });
  }
}

