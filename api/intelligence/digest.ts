import type { IncomingMessage, ServerResponse } from 'node:http';
import { SONNY_DIGEST_SYNTHESIZER_PROMPT } from '../../src/lib/intelligence/sonnyIntelligencePrompts';
import * as cheerio from 'cheerio';

function json(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function getMissingLiveKeys(): string[] {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  return missing;
}

const DEFAULT_ALLOWED_HOSTS = [
  'clinicaltrials.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'nih.gov',
  'fda.gov',
  'ema.europa.eu',
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

function isLikelyHomepageUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const path = (u.pathname || '').trim();
    return path === '' || path === '/';
  } catch {
    return true;
  }
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqStrings(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = (v || '').trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function buildTargetTerms(targetContext: any): string[] {
  const base = uniqStrings([
    String(targetContext?.target || ''),
    String(targetContext?.asset || ''),
    String(targetContext?.company || ''),
  ]);
  const expanded: string[] = [];
  const key = base.join(' ').replace(/\s+/g, '').toUpperCase();
  if (key.includes('HER2') || key.includes('ERBB2')) expanded.push('HER2', 'ERBB2', 'HER-2', 'neu');
  if (key.includes('TROP2') || key.includes('TACSTD2')) expanded.push('TROP2', 'TACSTD2', 'TROP-2');
  if (key.includes('CMET') || key.includes('C-MET') || key === 'MET') expanded.push('c-MET', 'cMET', 'HGFR', 'hepatocyte growth factor receptor');
  return uniqStrings([...base, ...expanded]).filter(Boolean);
}

function hasBiomedicalContext(text: string, termUpper: string): boolean {
  const base = /\b(gene|receptor|oncogene|kinase|mutation|mutant|fusion|amplif|overexpress|phospho|tyrosine|pathway|signaling|inhibitor|antibody|adc|biomarker)\b/i;
  if (base.test(text)) return true;
  if (termUpper === 'MET') return /\b(hgfr|c[-\s]?met|hepatocyte growth factor receptor|proto-oncogene)\b/i.test(text);
  return false;
}

function matchesTargetInText(text: string, terms: string[]) {
  const hay = (text || '').toLowerCase();
  const matchers = terms.map((t) => {
    const compact = t.replace(/\s+/g, '');
    if (/^cmet$/i.test(compact) || /^c-met$/i.test(compact)) return { term: t, isAmbiguous: true, re: /\bc[-\s]?met\b/i };
    const isAmbiguous = compact.length <= 3 && /^[A-Za-z]+$/.test(compact);
    const re = isAmbiguous ? new RegExp(`\\b${escapeRegExp(t)}\\b`, 'i') : new RegExp(escapeRegExp(t), 'i');
    return { term: t, isAmbiguous, re };
  });

  const matchedTerms: string[] = [];
  let matchedAmbiguousOnly = true;
  for (const m of matchers) {
    if (!m.re.test(hay)) continue;
    matchedTerms.push(m.term);
    if (!m.isAmbiguous) matchedAmbiguousOnly = false;
  }
  const unique = uniqStrings(matchedTerms);
  return { ok: unique.length > 0, matchedTerms: unique, matchedAmbiguousOnly };
}

async function fetchText(url: string): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'LUMINA/1.0 (+https://lumina.local)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

function extractReadableText(html: string): { title: string; description: string; text: string } {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, aside, iframe, noscript, svg, form, header').remove();
  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').text().trim() ||
    '';
  const description =
    $('meta[property="og:description"]').attr('content')?.trim() || $('meta[name="description"]').attr('content')?.trim() || '';
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

async function vetAndEnrichItem(item: any, targetTerms: string[]) {
  const url = String(item?.url || '').trim();
  if (!url) return null;
  if (!isAllowedUrl(url)) return null;
  if (isLikelyHomepageUrl(url)) return null;

  // First-pass: must at least mention the target in the provided title/snippet
  const seedText = `${String(item?.title || '')}\n${String(item?.snippet || '')}`;
  const seedMatch = matchesTargetInText(seedText, targetTerms);
  if (!seedMatch.ok) return null;

  // Second-pass: fetch and verify page actually contains the target
  try {
    const { text: html, contentType } = await fetchText(url);
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) return null;
    const extracted = extractReadableText(html);
    const combined = `${extracted.title}\n${extracted.description}\n${extracted.text}`.slice(0, 20_000);
    const match = matchesTargetInText(combined, targetTerms);
    if (!match.ok) return null;
    if (match.matchedAmbiguousOnly) {
      const termUpper = (match.matchedTerms[0] || '').replace(/\s+/g, '').toUpperCase();
      if (!hasBiomedicalContext(combined, termUpper)) return null;
    }

    const evidenceId = `url:${item.sourceId}:verified`;
    const evidenceText = `${extracted.title}\n\n${extracted.description}\n\n${extracted.text}`.slice(0, 6000);
    return {
      ...item,
      title: extracted.title || item.title,
      snippet: extracted.description || item.snippet,
      abstract: item.abstract || null,
      evidenceIds: uniqStrings([...(item.evidenceIds || []), evidenceId]),
      evidence: [
        ...(Array.isArray(item.evidence) ? item.evidence : []),
        { id: evidenceId, field: 'verified_page_text', text: evidenceText },
      ],
    };
  } catch {
    return null;
  }
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing API key(s): ANTHROPIC_API_KEY');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const payload = {
    model,
    // Allow a more thorough digest (still bounded)
    max_tokens: 2200,
    temperature: 0.2,
    system,
    messages: [{ role: 'user', content: user }],
  };

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Anthropic failed (${resp.status}): ${text || resp.statusText}`);
  }

  const data = (await resp.json()) as any;
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const text = blocks
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => String(b?.text || ''))
    .join('\n')
    .trim();
  return text || 'No response.';
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = (req.method || 'GET').toUpperCase();

  // We don't persist digests server-side yet; GET returns empty so the UI can proceed.
  if (method === 'GET') return json(res, 200, { digest: null });

  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const missing = getMissingLiveKeys();
  if (missing.length > 0) return json(res, 503, { error: 'Missing API key(s)', missing });

  try {
    const body = await readJson(req);
    const persona = String(body?.persona || 'GENERAL');
    const targetContext = body?.targetContext || {};
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    const targetTerms = buildTargetTerms(targetContext);

    // Vet all non-primary URLs so Sonny never cites irrelevant pages.
    // For now, we only keep items that pass URL verification.
    const vetted: any[] = [];
    const maxItems = 10;
    for (const it of rawItems.slice(0, maxItems)) {
      const type = String(it?.type || '');
      // PubMed / ClinicalTrials are canonical and already target-filtered upstream; keep as-is.
      if (type === 'PUB' || type === 'CTR') {
        vetted.push(it);
        continue;
      }
      const enriched = await vetAndEnrichItem(it, targetTerms);
      if (enriched) vetted.push(enriched);
    }

    // Use the full Sonny digest prompt (structured, grounded, citation-first).
    // We provide the raw digest input JSON; model must not use outside facts.
    const digestInput = {
      generatedAt: body?.generatedAt || new Date().toISOString(),
      persona,
      targetContext,
      items: vetted,
    };

    const user = JSON.stringify(digestInput, null, 2);
    const digestMarkdown = await callAnthropic(SONNY_DIGEST_SYNTHESIZER_PROMPT, user);
    return json(res, 200, { digestMarkdown });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Failed to generate digest' });
  }
}

