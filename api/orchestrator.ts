import type { IncomingMessage, ServerResponse } from 'node:http';

type ExecutionMode = 'fast' | 'thorough';

type SSEEvent =
  | { type: 'status'; data: { message: string } }
  | { type: 'plan'; data: { plan: string } }
  | { type: 'synthesis'; data: { step: string; synthesis?: string } }
  | { type: 'complete'; data: { synthesis: string; cost?: number } }
  | { type: 'error'; data: { message: string } };

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
  if (!process.env.GOOGLE_API_KEY) missing.push('GOOGLE_API_KEY');
  if (!process.env.PERPLEXITY_API_KEY) missing.push('PERPLEXITY_API_KEY');
  return missing;
}

function writeSse(res: ServerResponse, event: SSEEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

async function callAnthropic(query: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  const payload = {
    model,
    max_tokens: 1200,
    temperature: 0.2,
    system:
      'You are Sonny, an expert biotech analyst. Provide a concise, structured answer with bullet points and clear headings.',
    messages: [{ role: 'user', content: query }],
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

  if (method === 'GET') {
    return json(res, 200, {
      name: 'Sonny Orchestrator (Vercel)',
      status: 'active',
      modes: ['fast', 'thorough'],
      liveKeysMissing: getMissingLiveKeys(),
    });
  }

  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const missing = getMissingLiveKeys();
  if (missing.length > 0) return json(res, 503, { error: 'Live mode not ready', missing });

  const body = await readJson(req);
  const query = body?.query;
  const mode = body?.mode as ExecutionMode | undefined;
  const isDemo = Boolean(body?.isDemo);

  // This endpoint is intended for live mode only.
  if (isDemo) return json(res, 400, { error: 'Demo mode uses local playback; do not call /api/orchestrator' });
  if (!query || typeof query !== 'string') return json(res, 400, { error: 'Query is required and must be a string' });
  if (!mode || !['fast', 'thorough'].includes(mode)) return json(res, 400, { error: 'Mode must be either "fast" or "thorough"' });

  res.statusCode = 200;
  res.setHeader('content-type', 'text/event-stream');
  res.setHeader('cache-control', 'no-cache, no-transform');
  res.setHeader('connection', 'keep-alive');
  res.setHeader('x-accel-buffering', 'no');

  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  const safeWrite = (event: SSEEvent) => {
    if (isClosed) return;
    writeSse(res, event);
  };

  try {
    safeWrite({ type: 'status', data: { message: 'Starting live analysis…' } });
    safeWrite({ type: 'plan', data: { plan: '1) Interpret query\n2) Retrieve key context\n3) Produce structured analysis' } });
    safeWrite({ type: 'synthesis', data: { step: 'Calling LLM…' } });

    const synthesis = await callAnthropic(query);

    safeWrite({ type: 'synthesis', data: { step: 'Finalizing…', synthesis } });
    safeWrite({ type: 'complete', data: { synthesis, cost: 0 } });
    res.end();
  } catch (e: any) {
    safeWrite({ type: 'error', data: { message: e?.message || 'Live orchestration failed' } });
    res.end();
  }
}

