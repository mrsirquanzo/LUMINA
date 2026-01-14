import type { IncomingMessage, ServerResponse } from 'node:http';
import * as cheerio from 'cheerio';
import {
  SONNY_ARTICLE_ANALYSIS_PROMPT,
  SONNY_SINGLE_ITEM_PROCESSOR_PROMPT,
} from '../../src/lib/intelligence/sonnyIntelligencePrompts';

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

function isLikelyHomepageUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const path = (u.pathname || '').trim();
    return path === '' || path === '/';
  } catch {
    return true;
  }
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

async function callAnthropic(system: string, user: string, maxTokens = 1400, temperature = 0.25): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing API key(s): ANTHROPIC_API_KEY');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const payload = {
    model,
    max_tokens: maxTokens,
    temperature,
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
  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const missing = getMissingLiveKeys();
  if (missing.length > 0) return json(res, 503, { error: 'Missing API key(s)', missing });

  try {
    const body = await readJson(req);
    const persona = String(body?.persona || 'GENERAL').toUpperCase();
    const targetContext = body?.targetContext || {};
    const item = body?.item || {};

    if (!item?.sourceId || !item?.url || !item?.title) return json(res, 400, { error: 'Invalid payload' });

    // Best-effort enrichment for allowlisted HTML sources (avoid homepages).
    const url = String(item.url || '').trim();
    let enriched = item;
    if (url && isAllowedUrl(url) && !isLikelyHomepageUrl(url)) {
      const type = String(item.type || '');
      if (type !== 'PUB' && type !== 'CTR') {
        const { text: html, contentType } = await fetchText(url);
        if (contentType.toLowerCase().includes('html') || html.trim().startsWith('<')) {
          const extracted = extractReadableText(html);
          const evidenceId = `${String(item.sourceId)}:content`;
          const evidenceText = `${extracted.title}\n\n${extracted.description}\n\n${extracted.text}`.slice(0, 6000);
          enriched = {
            ...item,
            snippet: item.snippet || extracted.description || null,
            evidenceIds: Array.from(new Set([...(item.evidenceIds || []), evidenceId])),
            evidence: [...(Array.isArray(item.evidence) ? item.evidence : []), { id: evidenceId, field: 'content', text: evidenceText }],
          };
        }
      }
    }

    // Optional: run single-item processor first for stronger grounding.
    const processedText = await callAnthropic(SONNY_SINGLE_ITEM_PROCESSOR_PROMPT, JSON.stringify(enriched, null, 2), 1800, 0.2);
    const processed = extractJsonObject(processedText);

    const analysisInput = { persona, targetContext, item: processed };
    const analysisText = await callAnthropic(SONNY_ARTICLE_ANALYSIS_PROMPT, JSON.stringify(analysisInput, null, 2), 1400, 0.35);
    const analysis = extractJsonObject(analysisText);

    return json(res, 200, { analysis });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Failed to generate article analysis' });
  }
}

