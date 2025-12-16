import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ProcessedDocument, ExecutionMode, SSEEvent } from '../../src/lib/multiAgentTypes';
import { runOrchestration } from '../../src/lib/orchestrationEngine';

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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    return json(res, 200, {
      name: 'Sonny - Multi-Agent Orchestrator API',
      status: 'active',
      modes: ['fast', 'thorough'],
    });
  }

  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const query = body?.query;
    const mode = body?.mode;
    const isDemo = Boolean(body?.isDemo);
    const demoScenarioId = body?.demoScenarioId;
    const customAgents = body?.customAgents;
    const mcpEnabled = body?.mcpEnabled;
    const documents: ProcessedDocument[] = Array.isArray(body?.documents) ? body.documents : [];

    if (!query || typeof query !== 'string') return json(res, 400, { error: 'Query is required and must be a string' });
    if (!mode || !['fast', 'thorough'].includes(mode)) return json(res, 400, { error: 'Mode must be either "fast" or "thorough"' });

    // SSE headers
    res.statusCode = 200;
    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');

    const sendEvent = (event: SSEEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Stop work if client disconnects
    let isClosed = false;
    req.on('close', () => {
      isClosed = true;
    });

    const guardedSend = (event: SSEEvent) => {
      if (isClosed) return;
      sendEvent(event);
    };

    await runOrchestration(
      query,
      documents,
      mode as ExecutionMode,
      guardedSend,
      isDemo,
      demoScenarioId,
      customAgents,
      mcpEnabled
    );

    res.end();
  } catch (e: any) {
    // If SSE already started, try to send an SSE error event
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', data: { message: e?.message || 'Failed to start orchestration' } })}\n\n`);
    } catch {
      // ignore
    }
    if (!res.headersSent) return json(res, 500, { error: e?.message || 'Failed to start orchestration' });
    res.end();
  }
}

