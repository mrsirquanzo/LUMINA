import type { IncomingMessage, ServerResponse } from 'node:http';

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

async function callAnthropic(system: string, user: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing API key(s): ANTHROPIC_API_KEY');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const payload = {
    model,
    max_tokens: 1400,
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
    const items = Array.isArray(body?.items) ? body.items : [];

    const heading = targetContext?.target || targetContext?.company || targetContext?.asset || 'Intelligence';
    const system = `You are Sonny. Write a concise investor-ready intelligence digest in markdown.
Rules:
- Use headings, bullets, and be decisive.
- Include a "### Sources" section as a markdown table with columns: id, source, type, tier, url.
- When citing, include inline markers like [source:<id>] in the text, matching the table id column.
- Keep it under ~700 words.`;

    const sources = items
      .slice(0, 12)
      .map((it: any) => ({
        id: String(it?.sourceId || ''),
        source: String(it?.name || it?.source || ''),
        type: String(it?.type || ''),
        title: String(it?.title || ''),
        url: String(it?.url || ''),
        date: String(it?.publicationDate || it?.capturedAt || ''),
        snippet: String(it?.snippet || ''),
      }))
      .filter((s: any) => s.id && s.url);

    const user = `Persona: ${persona}
Context: ${JSON.stringify(targetContext)}
Digest topic: ${heading}

Sources (use these only; do not invent new links):
${sources
  .map(
    (s: any) =>
      `- ${s.id} | ${s.source} | ${s.type} | ${s.date}\n  ${s.title}\n  ${s.url}\n  ${s.snippet}`
  )
  .join('\n\n')}`;

    const digestMarkdown = await callAnthropic(system, user);
    return json(res, 200, { digestMarkdown });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Failed to generate digest' });
  }
}

