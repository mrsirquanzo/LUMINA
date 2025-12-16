import { Router } from 'express';
import { buildEntryKey, getDigest, saveDigest, saveProcessedItems } from '../../lib/intelligence/store';
import * as cheerio from 'cheerio';

// Reuse existing LLM client setup from src (shared across server and frontend code in this repo)
import { createLLMClient } from '../../../src/lib/llm/clientFactory';
import { SYNTHESIS_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { validateApiKeys } from '../../../src/lib/llm/clientFactory';
import {
  SONNY_DIGEST_SYNTHESIZER_PROMPT,
  SONNY_SINGLE_ITEM_PROCESSOR_PROMPT,
} from '../../../src/lib/intelligence/sonnyIntelligencePrompts';

type RawFeedItemInput = {
  sourceId: string;
  type: string;
  name: string;
  url: string;
  publicationDate?: string | null;
  capturedAt: string;
  title: string;
  snippet?: string | null;
  abstract?: string | null;
  targetContext: {
    target?: string | null;
    asset?: string | null;
    company?: string | null;
    indication?: string | null;
  };
  evidenceIds?: string[];
  evidence?: Array<{ id: string; field: string; text: string }>;
  relatedItems?: string[];
};

type DigestRequest = {
  generatedAt: string;
  persona?: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  targetContext: RawFeedItemInput['targetContext'];
  items: RawFeedItemInput[];
  isDemo?: boolean;
};

const router = Router();

const FETCH_TIMEOUT_MS = 12_000;

async function fetchText(url: string): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'LUMINA/1.0 (+https://lumina.local)',
        accept: 'application/xml, text/xml;q=0.9, application/json;q=0.8, text/plain;q=0.7, */*;q=0.5',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    const contentType = res.headers.get('content-type') || '';
    return { text: await res.text(), contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
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
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function safeIsoDate(input: string | undefined | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function extractPubmedId(urlOrId: string): string | null {
  // URLs like https://pubmed.ncbi.nlm.nih.gov/24791904/
  const m1 = urlOrId.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\b/);
  if (m1) return m1[1];
  // IDs like PubMed:publication:24791904
  const m2 = urlOrId.match(/PubMed:publication:(\d+)/i);
  if (m2) return m2[1];
  return null;
}

async function enrichPubmed(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  const pmid = extractPubmedId(item.url) || extractPubmedId(item.sourceId);
  if (!pmid) return item;

  const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${encodeURIComponent(
    pmid
  )}&retmode=xml`;
  try {
    const { text: xml } = await fetchText(efetchUrl);
    const $ = cheerio.load(xml, { xmlMode: true });

    const title = $('ArticleTitle').first().text().trim() || item.title;
    const journal = $('Journal Title').first().text().trim();
    const abstractText = $('Abstract AbstractText')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter(Boolean)
      .join('\n\n');

    const pubDate =
      $('ArticleDate Year').first().text().trim() ||
      $('PubDate Year').first().text().trim() ||
      $('PubMedPubDate[PubStatus="pubmed"] Year').first().text().trim();
    const month =
      $('ArticleDate Month').first().text().trim() ||
      $('PubDate Month').first().text().trim() ||
      $('PubMedPubDate[PubStatus="pubmed"] Month').first().text().trim();
    const day =
      $('ArticleDate Day').first().text().trim() ||
      $('PubDate Day').first().text().trim() ||
      $('PubMedPubDate[PubStatus="pubmed"] Day').first().text().trim();

    const pubdateIso = safeIsoDate([pubDate, month, day].filter(Boolean).join('-')) || item.publicationDate || null;

    const evidence: Array<{ id: string; field: string; text: string }> = [];
    evidence.push({ id: `pubmed:${pmid}:title`, field: 'title', text: title });
    if (journal) evidence.push({ id: `pubmed:${pmid}:journal`, field: 'journal', text: journal });
    if (abstractText) evidence.push({ id: `pubmed:${pmid}:abstract`, field: 'abstract', text: abstractText });

    const snippet = item.snippet || (abstractText ? abstractText.slice(0, 800) : null);

    return {
      ...item,
      title,
      name: journal || item.name,
      publicationDate: pubdateIso,
      abstract: abstractText || item.abstract || null,
      snippet,
      evidenceIds: evidence.map((e) => e.id),
      evidence,
    };
  } catch (e) {
    // Degrade gracefully on rate limit/network errors.
    const evidence: Array<{ id: string; field: string; text: string }> = [
      { id: `pubmed:${pmid}:title`, field: 'title', text: item.title },
      ...(item.snippet ? [{ id: `pubmed:${pmid}:snippet`, field: 'snippet', text: item.snippet }] : []),
    ];
    const evidenceIds = evidence.map((ev) => ev.id);
    return { ...item, evidence, evidenceIds, abstract: item.abstract ?? null };
  }
}

function extractNctId(urlOrId: string): string | null {
  const m1 = urlOrId.match(/clinicaltrials\.gov\/study\/(NCT\d+)\b/i);
  if (m1) return m1[1].toUpperCase();
  const m2 = urlOrId.match(/\b(NCT\d{8})\b/i);
  if (m2) return m2[1].toUpperCase();
  return null;
}

async function enrichClinicalTrials(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  const nct = extractNctId(item.url) || extractNctId(item.sourceId);
  if (!nct) return item;

  // Try the direct endpoint first; fall back to search.
  let study: any | null = null;
  try {
    study = await fetchJson<any>(`https://clinicaltrials.gov/api/v2/studies/${encodeURIComponent(nct)}`);
  } catch {
    try {
      const search = await fetchJson<any>(
        `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(nct)}&pageSize=1`
      );
      study = search?.studies?.[0] ?? null;
    } catch {
      study = null;
    }
  }

  if (!study) return item;

  const idMod = study.protocolSection?.identificationModule;
  const statusMod = study.protocolSection?.statusModule;
  const descMod = study.protocolSection?.descriptionModule;
  const designMod = study.protocolSection?.designModule;
  const outcomesMod = study.protocolSection?.outcomesModule;

  const title = (idMod?.briefTitle || idMod?.officialTitle || item.title).trim();
  const sponsor = idMod?.organization?.fullName?.trim();
  const status = statusMod?.overallStatus?.trim();
  const updated = statusMod?.lastUpdatePostDateStruct?.date?.trim();
  const phase = (designMod?.phases ?? []).filter(Boolean).join(', ');
  const primaryEndpoints = (outcomesMod?.primaryOutcomes ?? [])
    .map((o: any) => o?.measure?.trim())
    .filter(Boolean)
    .slice(0, 3);
  const summaryText = descMod?.briefSummary ? String(descMod.briefSummary).trim() : '';

  const evidence: Array<{ id: string; field: string; text: string }> = [];
  evidence.push({ id: `ctr:${nct}:title`, field: 'title', text: title });
  if (sponsor) evidence.push({ id: `ctr:${nct}:sponsor`, field: 'sponsor', text: sponsor });
  if (status) evidence.push({ id: `ctr:${nct}:status`, field: 'status', text: status });
  if (phase) evidence.push({ id: `ctr:${nct}:phase`, field: 'phase', text: phase });
  if (primaryEndpoints.length) evidence.push({ id: `ctr:${nct}:primary-endpoints`, field: 'primaryEndpoint', text: primaryEndpoints.join(' | ') });
  if (summaryText) evidence.push({ id: `ctr:${nct}:summary`, field: 'summary', text: summaryText });

  return {
    ...item,
    title,
    publicationDate: safeIsoDate(updated) || item.publicationDate || null,
    snippet: item.snippet || summaryText?.slice(0, 900) || null,
    abstract: item.abstract || null,
    evidenceIds: evidence.map((e) => e.id),
    evidence,
  };
}

const DEFAULT_ALLOWED_HOSTS = [
  'clinicaltrials.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'nih.gov',
  'fda.gov',
  'ema.europa.eu',
  'sec.gov',
  'statnews.com',
  'endpts.com',
  'fiercepharma.com',
  'fiercebiotech.com',
  'biopharmadive.com',
  'prnewswire.com',
  'businesswire.com',
  'globenewswire.com',
].map((h) => h.toLowerCase());

function getAllowedHosts(): string[] {
  const env = process.env.INTELLIGENCE_FETCH_ALLOWLIST;
  if (!env) return DEFAULT_ALLOWED_HOSTS;
  const fromEnv = env
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_HOSTS;
}

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    const allowed = getAllowedHosts();
    return allowed.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function extractReadableText(html: string): { title: string; description: string; text: string } {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, aside, iframe, noscript, svg, form, header').remove();

  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').text().trim() ||
    '';
  const description =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    '';

  const selectors = ['article', 'main', '[role="main"]', '#content', '.content', '.article', '.post', 'body'];
  let raw = '';
  for (const sel of selectors) {
    const el = $(sel).first();
    if (!el.length) continue;
    raw = el.text().trim();
    if (raw.length >= 400) break;
  }
  const text = raw.replace(/\s+/g, ' ').trim();
  return { title, description, text };
}

async function enrichWebContent(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  if (!isAllowedUrl(item.url)) return item;

  const { text: html, contentType } = await fetchText(item.url);
  if (contentType.toLowerCase().includes('pdf')) return item;
  if (!contentType.toLowerCase().includes('html') && !html.trim().startsWith('<')) return item;

  const { title, description, text } = extractReadableText(html);
  const clipped = text.slice(0, 8000);

  const evidence: Array<{ id: string; field: string; text: string }> = [];
  evidence.push({ id: `${item.sourceId}:title`, field: 'title', text: item.title });
  if (item.snippet) evidence.push({ id: `${item.sourceId}:snippet`, field: 'snippet', text: item.snippet });
  if (title && title !== item.title) evidence.push({ id: `${item.sourceId}:page-title`, field: 'pageTitle', text: title });
  if (description) evidence.push({ id: `${item.sourceId}:meta-description`, field: 'metaDescription', text: description });
  if (clipped) evidence.push({ id: `${item.sourceId}:content`, field: 'content', text: clipped });

  const evidenceIds = evidence.map((e) => e.id);
  return {
    ...item,
    // preserve item.title; page title is evidence only
    snippet: item.snippet || description || null,
    evidence,
    evidenceIds,
  };
}

async function enrichItem(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  if (item.type === 'PUB') return await enrichPubmed(item);
  if (item.type === 'CTR') return await enrichClinicalTrials(item);
  // NEWS/PR/REG/etc: try allowlisted full-text extraction; fall back to snippet evidence.
  const enriched = await enrichWebContent(item);
  const evidence = enriched.evidence?.length
    ? enriched.evidence
    : [
        { id: `${item.sourceId}:title`, field: 'title', text: item.title },
        ...(item.snippet ? [{ id: `${item.sourceId}:snippet`, field: 'snippet', text: item.snippet }] : []),
      ];
  const evidenceIds = enriched.evidenceIds?.length ? enriched.evidenceIds : evidence.map((e) => e.id);
  return { ...enriched, evidence, evidenceIds };
}

function extractJsonObject(text: string): any {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found');
  const candidate = text.slice(start, end + 1);
  return JSON.parse(candidate);
}

function validateProcessedItemShape(obj: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  function req(path: string, cond: boolean) {
    if (!cond) errors.push(path);
  }

  req('id', typeof obj?.id === 'string' && obj.id.length > 0);
  req('capturedAt', typeof obj?.capturedAt === 'string' && obj.capturedAt.length > 0);
  req('source.sourceId', typeof obj?.source?.sourceId === 'string' && obj.source.sourceId.length > 0);
  req('source.url', typeof obj?.source?.url === 'string' && obj.source.url.length > 0);
  req('summary.headline', typeof obj?.summary?.headline === 'string');
  req('summary.headlineEvidenceIds', Array.isArray(obj?.summary?.headlineEvidenceIds));
  req('summary.body', typeof obj?.summary?.body === 'string');
  req('summary.bodyEvidenceIds', Array.isArray(obj?.summary?.bodyEvidenceIds));
  req('summary.targetImplications', typeof obj?.summary?.targetImplications === 'string');
  req('summary.targetImplicationsEvidenceIds', Array.isArray(obj?.summary?.targetImplicationsEvidenceIds));
  req('relevance.evidenceIds', Array.isArray(obj?.relevance?.evidenceIds));
  req('verification.methodEvidenceIds', Array.isArray(obj?.verification?.methodEvidenceIds));
  req('confidence.rationaleEvidenceIds', Array.isArray(obj?.confidence?.rationaleEvidenceIds));

  return { ok: errors.length === 0, errors };
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

function buildDemoProcessedItem(item: RawFeedItemInput) {
  const evidence = item.evidenceIds?.length ? item.evidenceIds : [item.sourceId];
  return {
    id: `processed-${item.sourceId}`,
    targetContext: item.targetContext,
    capturedAt: item.capturedAt,
    source: {
      sourceId: item.sourceId,
      type: item.type,
      name: item.name,
      url: item.url,
      publicationDate: item.publicationDate ?? null,
      reliabilityTier: 3,
      recencyScore: 'CURRENT',
      authorCredibility: 'UNKNOWN',
      potentialBias: 'LOW',
      biasDirection: null,
    },
    relevance: {
      level: 'SUPPORTING',
      targetMentioned: true,
      targetRole: 'MENTIONED',
      whyRelevant: 'Matches the provided target context based on title/snippet.',
      evidenceIds: evidence,
    },
    classification: {
      category: 'COMPETITIVE',
      urgency: 'INFORMATIONAL',
      sentiment: 'NEUTRAL',
      impactLevel: 'LOW',
    },
    summary: {
      headline: item.title.slice(0, 90),
      headlineEvidenceIds: evidence,
      body: (item.abstract || item.snippet || '').slice(0, 280) || 'No additional content provided in demo mode.',
      bodyEvidenceIds: evidence,
      keyData: [],
      targetImplications: 'Demo mode: implications require live verification.',
      targetImplicationsEvidenceIds: evidence,
    },
    facts: [],
    verification: {
      status: 'UNVERIFIED',
      method: 'Demo mode: no external verification performed.',
      methodEvidenceIds: evidence,
      crossReferences: [],
    },
    confidence: {
      level: 'INSUFFICIENT',
      rationale: 'Demo mode output; treat as placeholder.',
      rationaleEvidenceIds: evidence,
      dataGaps: ['Primary source text', 'Structured evidence'],
    },
    relatedItems: item.relatedItems ?? [],
  };
}

router.get('/', async (req, res) => {
  const target = String(req.query.target || '').trim() || undefined;
  const asset = String(req.query.asset || '').trim() || undefined;
  const company = String(req.query.company || '').trim() || undefined;
  const indication = String(req.query.indication || '').trim() || undefined;
  const entryKey = buildEntryKey({ target, asset, company, indication });

  const digest = await getDigest(entryKey);
  return res.json({ entryKey, digest });
});

router.post('/', async (req, res) => {
  const body = req.body as DigestRequest;
  if (!body?.generatedAt || !body?.targetContext || !Array.isArray(body?.items)) {
    return res.status(400).json({ error: 'Invalid payload: expected {generatedAt, targetContext, items[]}' });
  }

  const entryKey = buildEntryKey({
    target: body.targetContext.target || undefined,
    asset: body.targetContext.asset || undefined,
    company: body.targetContext.company || undefined,
    indication: body.targetContext.indication || undefined,
  });

  const persona = body.persona || 'GENERAL';
  const isDemo = Boolean(body.isDemo);

  // Demo mode: no external API calls; return a deterministic placeholder digest.
  if (isDemo) {
    const processedItems = body.items.slice(0, 8).map(buildDemoProcessedItem);
    const sourcesTable = processedItems
      .map((it: any) => `| ${it.source.sourceId} | ${it.source.name} | ${it.source.type} | Tier ${it.source.reliabilityTier} | ${it.source.url} |`)
      .join('\n');

    const digestMarkdown = [
      `## Intelligence Digest — ${body.targetContext.target || body.targetContext.asset || body.targetContext.company || 'Intelligence'}`,
      ``,
      `**Generated:** ${body.generatedAt} | **Items analyzed:** ${processedItems.length} | **Persona:** ${persona}`,
      ``,
      `---`,
      ``,
      `### Executive Takeaways`,
      `- Demo mode: summaries are placeholders; switch to Live for verified synthesis.`,
      ``,
      `---`,
      ``,
      `### What's New (Top Developments)`,
      ...processedItems.slice(0, 3).map((it: any, i: number) => {
        const title = it.summary.headline;
        const cite = `[source:${it.source.sourceId}]`;
        return `**${i + 1}. ${title}**\n\n${it.summary.body} ${cite}\n`;
      }),
      `---`,
      ``,
      `### Needs Verification ⚠️`,
      `- Demo mode: run live extraction and digest generation for verified outputs. [gap:demo-mode]`,
      ``,
      `---`,
      ``,
      `### Sources`,
      `| ID | Source | Type | Reliability | Link |`,
      `|----|--------|------|-------------|------|`,
      sourcesTable,
      ``,
    ].join('\n');

    await saveProcessedItems(entryKey, processedItems);
    await saveDigest(entryKey, { generatedAt: body.generatedAt, persona, markdown: digestMarkdown, sourceIds: processedItems.map((it: any) => it.source.sourceId) });
    return res.json({ entryKey, digestMarkdown, processedItems });
  }

  const keyCheck = validateApiKeys([SYNTHESIS_MODEL_CONFIG.provider]);
  if (!keyCheck.valid) {
    return res.status(400).json({
      error: `Missing API key(s) for provider: ${keyCheck.missing.join(', ')}`,
    });
  }

  try {
    const client = createLLMClient(SYNTHESIS_MODEL_CONFIG);

    // Enrich items with higher-quality evidence before asking Sonny.
    const rawItems = await mapLimit(body.items.slice(0, 10), 3, async (item) => {
      try {
        return await enrichItem(item);
      } catch (e) {
        // If enrichment fails, fall back to original item
        return await enrichItem({ ...item, evidence: item.evidence ?? undefined });
      }
    });

    const processedItems = await mapLimit(rawItems, 3, async (item) => {
      const userMessage = JSON.stringify(item, null, 2);
      const resp = await client.sendMessage(SONNY_SINGLE_ITEM_PROCESSOR_PROMPT, userMessage, {
        maxTokens: 1800,
        temperature: 0.2,
      });

      try {
        const parsed = extractJsonObject(resp.content);
        const v = validateProcessedItemShape(parsed);
        if (!v.ok) throw new Error(`Invalid processed item shape: ${v.errors.join(', ')}`);
        return parsed;
      } catch (e) {
        // One repair attempt
        const repairPrompt = `${SONNY_SINGLE_ITEM_PROCESSOR_PROMPT}

IMPORTANT:
- Your previous output was invalid or did not match the required schema.
- Return ONLY a valid JSON object matching the schema.
- Ensure all evidenceId companion arrays are present: headlineEvidenceIds, bodyEvidenceIds, targetImplicationsEvidenceIds, relevance.evidenceIds, verification.methodEvidenceIds, confidence.rationaleEvidenceIds.`;
        const repairUser = `INPUT JSON:
${userMessage}

PREVIOUS OUTPUT:
${resp.content}

REPAIR NOTES:
${e instanceof Error ? e.message : 'Unknown validation error'}`;
        const repaired = await client.sendMessage(repairPrompt, repairUser, { maxTokens: 1800, temperature: 0.0 });
        const parsed = extractJsonObject(repaired.content);
        const v = validateProcessedItemShape(parsed);
        if (!v.ok) throw new Error(`Invalid processed item after repair: ${v.errors.join(', ')}`);
        return parsed;
      }
    });

    const digestInput = {
      generatedAt: body.generatedAt,
      targetContext: body.targetContext,
      persona,
      items: processedItems,
    };

    const digestResp = await client.sendMessage(
      SONNY_DIGEST_SYNTHESIZER_PROMPT,
      JSON.stringify(digestInput, null, 2),
      { maxTokens: 2200, temperature: 0.4 }
    );

    const digestMarkdown = digestResp.content;

    await saveProcessedItems(entryKey, processedItems);
    await saveDigest(entryKey, {
      generatedAt: body.generatedAt,
      persona,
      markdown: digestMarkdown,
      sourceIds: processedItems.map((it: any) => it?.source?.sourceId).filter(Boolean),
    });

    return res.json({ entryKey, digestMarkdown, processedItems });
  } catch (err) {
    console.error('[intelligence-digest] error', err);
    return res.status(500).json({
      error: 'Failed to generate digest',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;

