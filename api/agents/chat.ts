import type { IncomingMessage, ServerResponse } from 'node:http';
import { AGENT_MODEL_CONFIG } from '../../src/lib/llm/agentConfig';
import type { AgentType } from '../../src/lib/llm/agentConfig';
import { AGENT_PROMPTS } from '../../src/lib/agentPrompts';
import { createLLMClient } from '../../src/lib/llm/clientFactory';

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

function getUserMessageFromBody(body: any): string {
  if (typeof body?.query === 'string' && body.query.trim()) return body.query.trim();
  if (typeof body?.message === 'string' && body.message.trim()) return body.message.trim();

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const formatted = messages
    .map((m: any) => {
      const role = m?.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${String(m?.content || '').trim()}`;
    })
    .filter(Boolean)
    .join('\n\n');
  return formatted.trim();
}

function buildFollowUpSystemPrompt(agentType: AgentType): string {
  const base = AGENT_PROMPTS[agentType] || '';
  const followUp = `

## Follow-up Q&A mode (non-negotiable)
- You are answering a single follow-up question based on the provided context and any provided documents.
- Do not invent facts. If something is not assessable from the provided context, say NOT ASSESSABLE and list what would verify it.
- Keep answers crisp and decision-support oriented (no prescriptive directives).`;
  return `${base}\n${followUp}`.trim();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const agentType = body?.agentType as AgentType | undefined;
    if (!agentType || !(agentType in AGENT_MODEL_CONFIG)) {
      return json(res, 400, { error: 'agentType is required and must be a valid agent type' });
    }

    const userMessage = getUserMessageFromBody(body);
    if (!userMessage) return json(res, 400, { error: 'messages/query is required' });

    const llmConfig = AGENT_MODEL_CONFIG[agentType];
    const client = createLLMClient(llmConfig);
    const systemPrompt = buildFollowUpSystemPrompt(agentType);

    const response = await client.sendMessage(systemPrompt, userMessage, {
      maxTokens: Math.min(llmConfig.maxTokens || 1200, 1200),
      temperature: llmConfig.temperature,
    });

    return json(res, 200, {
      message: response.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (error: any) {
    console.error('[Vercel Agents Chat] Error:', error);
    return json(res, 500, { error: error.message || 'Failed to process follow-up chat' });
  }
}

