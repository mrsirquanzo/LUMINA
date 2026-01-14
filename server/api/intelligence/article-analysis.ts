import { Router } from 'express';
import * as cheerio from 'cheerio';
import { createLLMClient } from '../../../src/lib/llm/clientFactory';
import { SYNTHESIS_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { validateApiKeys } from '../../../src/lib/llm/clientFactory';
import {
  SONNY_ARTICLE_ANALYSIS_PROMPT,
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

type ArticleAnalysisRequest = {
  persona?: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  targetContext: RawFeedItemInput['targetContext'];
  item: RawFeedItemInput;
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
  const m1 = urlOrId.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\b/);
  if (m1) return m1[1];
  const m0 = urlOrId.match(/\bPMID:(\d+)\b/i);
  if (m0) return m0[1];
  const m2 = urlOrId.match(/PubMed:publication:(\d+)/i);
  if (m2) return m2[1];
  const m3 = urlOrId.match(/^\d{5,10}$/);
  if (m3) return m3[0];
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

    return {
      ...item,
      title,
      name: journal || item.name,
      publicationDate: pubdateIso,
      abstract: abstractText || item.abstract || null,
      snippet: item.snippet || (abstractText ? abstractText.slice(0, 800) : null),
      evidenceIds: evidence.map((e) => e.id),
      evidence,
    };
  } catch {
    const evidence: Array<{ id: string; field: string; text: string }> = [
      { id: `pubmed:${pmid}:title`, field: 'title', text: item.title },
      ...(item.snippet ? [{ id: `pubmed:${pmid}:snippet`, field: 'snippet', text: item.snippet }] : []),
    ];
    return { ...item, evidence, evidenceIds: evidence.map((e) => e.id) };
  }
}

function extractNctId(urlOrId: string): string | null {
  const m1 = urlOrId.match(/clinicaltrials\.gov\/study\/(NCT\d+)\b/i);
  if (m1) return m1[1].toUpperCase();
  const m0 = urlOrId.match(/\bNCT:(NCT\d{8})\b/i);
  if (m0) return m0[1].toUpperCase();
  const m2 = urlOrId.match(/\b(NCT\d{8})\b/i);
  if (m2) return m2[1].toUpperCase();
  return null;
}

async function enrichClinicalTrials(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  const nct = extractNctId(item.url) || extractNctId(item.sourceId);
  if (!nct) return item;

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
  if (primaryEndpoints.length)
    evidence.push({ id: `ctr:${nct}:primary-endpoints`, field: 'primaryEndpoint', text: primaryEndpoints.join(' | ') });
  if (summaryText) evidence.push({ id: `ctr:${nct}:summary`, field: 'summary', text: summaryText });

  return {
    ...item,
    title,
    publicationDate: safeIsoDate(updated) || item.publicationDate || null,
    snippet: item.snippet || summaryText?.slice(0, 900) || null,
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

  return { ...item, snippet: item.snippet || description || null, evidence, evidenceIds: evidence.map((e) => e.id) };
}

async function enrichItem(item: RawFeedItemInput): Promise<RawFeedItemInput> {
  if (item.type === 'PUB') return await enrichPubmed(item);
  if (item.type === 'CTR') return await enrichClinicalTrials(item);
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

function stripCodeFences(text: string): string {
  const t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fence?.[1]?.trim() || t;
}

function findFirstBalancedJsonObject(text: string): string | null {
  const s = stripCodeFences(text);
  for (let start = s.indexOf('{'); start !== -1; start = s.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) return s.slice(start, i + 1);
        if (depth < 0) break;
      }
    }
  }
  return null;
}

function extractJsonObject(text: string): any {
  const candidate = findFirstBalancedJsonObject(text);
  if (!candidate) throw new Error('No JSON object found');
  return JSON.parse(candidate);
}

function buildFallbackAnalysis(args: {
  persona: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  item: RawFeedItemInput;
  evidenceIds: string[];
}) {
  const { persona, item, evidenceIds } = args;
  const sourceTier =
    item.type === 'PUB' || item.type === 'CTR' || item.type === 'REG' || item.type === 'SEC' || item.type === 'PAT' ? 'primary-grade' : 'context-grade';
  const core = (item.abstract || item.snippet || '').trim();
  const news = core
    ? `The source states: ${core}`
    : `Only the headline is available in the payload; the source content was not extracted.`;

  const context =
    sourceTier === 'primary-grade'
      ? `Treat this as a higher-reliability signal (tier-1/2). Weight it as a constraint or anchor—but still check what is explicitly stated vs implied.`
      : `Treat this as contextual (trade/secondary). Weight it as a signal that requires corroboration before it changes a model.`;

  const implication =
    persona === 'SCIENTIST'
      ? `Implication: translate this into a falsifiable hypothesis (biomarker, mechanism, exposure/response). The key risk is over-reading narrative without the underlying data.`
      : persona === 'SCOUT'
        ? `Implication: convert this into positioning leverage—what claim does it support, what does it constrain, and what wedge would force adoption?`
        : persona === 'VC'
          ? `Implication: update underwriting around time-to-proof and execution risk. The key question is what catalyst would actually change probability-of-success.`
          : `Implication: translate this into a decision-grade watchpoint (what changes, for whom, and on what timeline).`;

  const question = `What specific primary data or regulatory-grade detail would confirm the key claim here (and what would falsify it)?`;

  return {
    sourceId: item.sourceId,
    url: item.url,
    title: item.title,
    persona,
    confidencePct: core ? 68 : 55,
    keyThemes: [
      {
        theme: sourceTier === 'primary-grade' ? 'Regulatory/primary signal' : 'Narrative signal',
        direction: sourceTier === 'primary-grade' ? 'neutral' : 'watch',
        rationale: `Confidence is limited by the amount of extracted evidence available.`,
        evidenceIds,
      },
    ],
    sections: {
      theNews: { text: news, evidenceIds },
      theContext: { text: context, evidenceIds },
      theImplication: { text: implication, evidenceIds },
      theQuestion: { text: question, evidenceIds },
    },
    actions: [
      { action: 'Pull the primary source text', why: 'Increase evidence density before changing strategy', priority: 'high' },
      { action: 'Map to one decision', why: 'Convert narrative into a falsifiable watchpoint', priority: 'medium' },
    ],
  };
}

router.post('/', async (req, res) => {
  const body = req.body as ArticleAnalysisRequest;
  if (!body?.targetContext || !body?.item?.sourceId || !body?.item?.url || !body?.item?.title) {
    return res.status(400).json({ error: 'Invalid payload: expected { targetContext, item } with sourceId/url/title' });
  }

  const persona = body.persona || 'GENERAL';

  // If keys are missing, degrade gracefully with a deterministic fallback analysis.
  const keyCheck = validateApiKeys([SYNTHESIS_MODEL_CONFIG.provider]);
  if (!keyCheck.valid) {
    const evidenceIds = body.item.evidenceIds?.length ? body.item.evidenceIds : [body.item.sourceId];
    const analysis = buildFallbackAnalysis({ persona, item: body.item, evidenceIds });
    return res.json({ analysis, mode: 'fallback', missingKeys: keyCheck.missing });
  }

  try {
    const client = createLLMClient(SYNTHESIS_MODEL_CONFIG);

    // Enrich item with more evidence (PubMed/CTR/web extraction)
    const enriched = await enrichItem(body.item);

    // Step 1: per-item processing (strict schema) to improve downstream grounding.
    const processedResp = await client.sendMessage(
      SONNY_SINGLE_ITEM_PROCESSOR_PROMPT,
      JSON.stringify(enriched, null, 2),
      { maxTokens: 1800, temperature: 0.2 }
    );
    const processed = extractJsonObject(processedResp.content);

    // Step 2: digest-style per-article analysis (News/Context/Implication/Question)
    const analysisInput = {
      persona,
      targetContext: body.targetContext,
      item: processed,
    };
    const analysisResp = await client.sendMessage(
      SONNY_ARTICLE_ANALYSIS_PROMPT,
      JSON.stringify(analysisInput, null, 2),
      { maxTokens: 1400, temperature: 0.35 }
    );
    const analysis = extractJsonObject(analysisResp.content);
    return res.json({ analysis, mode: 'live' });
  } catch (err) {
    console.error('[intelligence-article-analysis] error', err);
    return res.status(500).json({
      error: 'Failed to generate article analysis',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export default router;

