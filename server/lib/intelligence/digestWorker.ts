import * as cheerio from 'cheerio';
import { createLLMClient } from '../../../src/lib/llm/clientFactory';
import { SYNTHESIS_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { validateApiKeys } from '../../../src/lib/llm/clientFactory';
import {
  SONNY_DIGEST_SYNTHESIZER_PROMPT,
  SONNY_SINGLE_ITEM_PROCESSOR_PROMPT,
} from '../../../src/lib/intelligence/sonnyIntelligencePrompts';
import { saveDigest, saveProcessedItems, updateJob } from './store';

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

export type DigestJobPayload = {
  generatedAt: string;
  persona?: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  targetContext: RawFeedItemInput['targetContext'];
  items: RawFeedItemInput[];
  isDemo?: boolean;
};

const FETCH_TIMEOUT_MS = 12_000;
const ENRICH_CONCURRENCY = 3;
const PROCESS_CONCURRENCY = 3;

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
        if (ch === '\\\\') {
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

function buildFallbackProcessedItem(input: RawFeedItemInput): any {
  const evidenceIds = input.evidenceIds?.length ? input.evidenceIds : [input.sourceId];
  const safe = (s: string | null | undefined) => (s ? String(s).trim() : '');
  const title = safe(input.title) || '(untitled)';
  const snippet = safe(input.snippet) || safe(input.abstract);
  const body = snippet ? snippet.slice(0, 500) : 'Insufficient evidence to summarize beyond headline/snippet.';

  return {
    id: input.sourceId,
    targetContext: {
      target: input.targetContext.target ?? null,
      asset: input.targetContext.asset ?? null,
      company: input.targetContext.company ?? null,
      indication: input.targetContext.indication ?? null,
    },
    capturedAt: input.capturedAt,
    source: {
      sourceId: input.sourceId,
      type: input.type,
      name: input.name,
      url: input.url,
      publicationDate: input.publicationDate ?? null,
      reliabilityTier: input.type === 'PUB' || input.type === 'CTR' || input.type === 'REG' || input.type === 'SEC' || input.type === 'PAT' ? 1 : 3,
      recencyScore: 'CURRENT',
      authorCredibility: 'UNKNOWN',
      potentialBias: 'LOW',
      biasDirection: null,
    },
    relevance: {
      level: 'SUPPORTING',
      targetMentioned: Boolean(input.targetContext.target),
      targetRole: 'MENTIONED',
      whyRelevant: 'Fallback: model output was not valid JSON; using only provided evidence.',
      evidenceIds,
    },
    classification: {
      category: 'SCIENTIFIC',
      urgency: 'INFORMATIONAL',
      sentiment: 'NEUTRAL',
      impactLevel: 'LOW',
    },
    summary: {
      headline: title,
      headlineEvidenceIds: evidenceIds,
      body,
      bodyEvidenceIds: evidenceIds,
      keyData: [],
      targetImplications: 'Needs verified extraction; insufficient structured evidence.',
      targetImplicationsEvidenceIds: evidenceIds,
    },
    facts: [],
    verification: {
      status: 'UNVERIFIED',
      method: 'Fallback (no valid JSON from model).',
      methodEvidenceIds: evidenceIds,
      crossReferences: [],
    },
    confidence: {
      level: 'INSUFFICIENT',
      rationale: 'Model output could not be parsed as valid JSON; falling back to headline/snippet only.',
      rationaleEvidenceIds: evidenceIds,
      dataGaps: ['valid-processor-json'],
    },
    relatedItems: input.relatedItems ?? [],
  };
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

function canonicalizeProcessedItem(parsed: any, input: RawFeedItemInput): any {
  if (!parsed || typeof parsed !== 'object') return parsed;
  parsed.id = input.sourceId;
  parsed.capturedAt = input.capturedAt;
  parsed.targetContext = input.targetContext;
  parsed.source = parsed.source && typeof parsed.source === 'object' ? parsed.source : {};
  parsed.source.sourceId = input.sourceId;
  parsed.source.url = input.url;
  parsed.source.name = input.name;
  parsed.source.type = input.type;
  parsed.source.publicationDate = input.publicationDate ?? null;
  return parsed;
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

export async function runDigestJob(jobId: string, payload: DigestJobPayload, entryKey: string): Promise<void> {
  await updateJob(jobId, {
    status: 'running',
    startedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
    progress: 0.05,
    message: 'Enriching sources',
  });

  const baseItems = payload.items.slice(0, 10);
  const total = Math.max(1, baseItems.length);
  let enrichedDone = 0;

  const enrichedItems = await mapLimit(baseItems, ENRICH_CONCURRENCY, async (it, idx) => {
    try {
      const out = await enrichItem(it);
      enrichedDone += 1;
      await updateJob(jobId, {
        heartbeatAt: new Date().toISOString(),
        progress: 0.05 + (enrichedDone / total) * 0.20,
        message: `Enriching sources ${enrichedDone}/${total}`,
      });
      return out;
    } catch {
      const out = await enrichItem({ ...it, evidence: it.evidence ?? undefined });
      enrichedDone += 1;
      await updateJob(jobId, {
        heartbeatAt: new Date().toISOString(),
        progress: 0.05 + (enrichedDone / total) * 0.20,
        message: `Enriching sources ${enrichedDone}/${total}`,
      });
      return out;
    }
  });

  await updateJob(jobId, { heartbeatAt: new Date().toISOString(), progress: 0.25, message: 'Running per-item extraction' });

  const persona = payload.persona || 'GENERAL';
  let isDemo = Boolean(payload.isDemo);

  // Auto-fallback to demo mode if API keys are missing (don't fail the job)
  const keyCheck = validateApiKeys([SYNTHESIS_MODEL_CONFIG.provider]);
  if (!keyCheck.valid) {
    console.warn(`[digestWorker] Missing API key(s) for provider: ${keyCheck.missing.join(', ')} — falling back to demo mode`);
    isDemo = true;
  }

  if (isDemo) {
    const digestMarkdown = `## Intelligence Digest — ${payload.targetContext.target || payload.targetContext.asset || payload.targetContext.company || 'Intelligence'}\n\n**Generated:** ${payload.generatedAt} | **Items analyzed:** ${enrichedItems.length} | **Persona:** ${persona}\n\n---\n\n### Executive Takeaways\n- Demo mode: enable Live keys for verified synthesis.\n\n---\n\n### Needs Verification ⚠️\n- Demo mode digest. [gap:demo-mode]\n`;
    await saveProcessedItems(entryKey, []);
    await saveDigest(entryKey, {
      generatedAt: payload.generatedAt,
      persona: `${persona} (demo)`,
      markdown: digestMarkdown,
      sourceIds: enrichedItems.map((i) => i.sourceId),
    });
    await updateJob(jobId, { heartbeatAt: new Date().toISOString(), status: 'completed', finishedAt: new Date().toISOString(), progress: 1, message: 'Completed (demo mode)' });
    return;
  }

  const client = createLLMClient(SYNTHESIS_MODEL_CONFIG);

  const processedItems = await mapLimit(enrichedItems, PROCESS_CONCURRENCY, async (item, idx) => {
    await updateJob(jobId, {
      heartbeatAt: new Date().toISOString(),
      progress: 0.25 + (idx / Math.max(1, enrichedItems.length)) * 0.5,
      message: `Extracting item ${idx + 1}/${enrichedItems.length}`,
    });

    const userMessage = JSON.stringify(item, null, 2);
    const resp = await client.sendMessage(SONNY_SINGLE_ITEM_PROCESSOR_PROMPT, userMessage, { maxTokens: 1800, temperature: 0.2 });
    try {
      const parsed = extractJsonObject(resp.content);
      const v = validateProcessedItemShape(parsed);
      if (!v.ok) throw new Error(`Invalid processed item shape: ${v.errors.join(', ')}`);
      return canonicalizeProcessedItem(parsed, item);
    } catch (e) {
      const repairPrompt = `${SONNY_SINGLE_ITEM_PROCESSOR_PROMPT}\n\nIMPORTANT: Return ONLY valid JSON matching the schema. Ensure all evidenceId companion arrays are present.`;
      const repairUser = `INPUT JSON:\n${userMessage}\n\nPREVIOUS OUTPUT:\n${resp.content}\n\nREPAIR NOTES:\n${e instanceof Error ? e.message : 'Unknown error'}`;
      try {
        const repaired = await client.sendMessage(repairPrompt, repairUser, { maxTokens: 1800, temperature: 0.0 });
        const parsed = extractJsonObject(repaired.content);
        const v = validateProcessedItemShape(parsed);
        if (!v.ok) throw new Error(`Invalid processed item after repair: ${v.errors.join(', ')}`);
        return canonicalizeProcessedItem(parsed, item);
      } catch (repairErr) {
        // Do not fail the entire digest because one item output is malformed.
        // Produce a strict, citation-safe fallback item so the digest can still complete.
        await updateJob(jobId, {
          heartbeatAt: new Date().toISOString(),
          message: `Fallback extraction for item ${idx + 1}/${enrichedItems.length}`,
        });
        return canonicalizeProcessedItem(buildFallbackProcessedItem(item), item);
      }
    }
  });

  await updateJob(jobId, { heartbeatAt: new Date().toISOString(), progress: 0.8, message: 'Synthesizing digest' });

  const digestInput = { generatedAt: payload.generatedAt, targetContext: payload.targetContext, persona, items: processedItems };
  const digestResp = await client.sendMessage(SONNY_DIGEST_SYNTHESIZER_PROMPT, JSON.stringify(digestInput, null, 2), { maxTokens: 2200, temperature: 0.4 });

  await saveProcessedItems(entryKey, processedItems);
  await saveDigest(entryKey, {
    generatedAt: payload.generatedAt,
    persona,
    markdown: digestResp.content,
    sourceIds: processedItems.map((it: any) => it?.source?.sourceId).filter(Boolean),
  });

  await updateJob(jobId, { heartbeatAt: new Date().toISOString(), status: 'completed', finishedAt: new Date().toISOString(), progress: 1, message: 'Completed' });
}

