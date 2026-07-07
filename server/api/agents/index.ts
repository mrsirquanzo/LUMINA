import { Router, Request, Response } from 'express';
import type { AgentType } from '../../../src/lib/llm/agentConfig';
import { AGENT_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { AGENT_PROMPTS } from '../../../src/lib/agentPrompts';
import { createLLMClient } from '../../../src/lib/llm/clientFactory';
import { isAuthenticated } from '../../lib/auth';

const router = Router();

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

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Individual agent routes (follow-up chat available at POST /api/agents/chat).',
    agents: ['clinical', 'patent', 'financial', 'market_research', 'regulatory', 'target_biology'],
  });
});

/**
 * POST /api/agents/chat
 * Lightweight follow-up chat with a single agent (used by the UI "Ask Follow-up Questions")
 */
router.post('/chat', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const agentType = req.body?.agentType as AgentType | undefined;
    if (!agentType || !(agentType in AGENT_MODEL_CONFIG)) {
      return res.status(400).json({ error: 'agentType is required and must be a valid agent type' });
    }

    const userMessage = getUserMessageFromBody(req.body);
    if (!userMessage) return res.status(400).json({ error: 'messages/query is required' });

    const llmConfig = AGENT_MODEL_CONFIG[agentType];
    const client = createLLMClient(llmConfig);
    const systemPrompt = buildFollowUpSystemPrompt(agentType);

    const response = await client.sendMessage(systemPrompt, userMessage, {
      maxTokens: Math.min(llmConfig.maxTokens || 1200, 1200),
      temperature: llmConfig.temperature,
    });

    return res.json({
      message: response.content,
      provider: response.provider,
      model: response.model,
    });
  } catch (error: any) {
    console.error('[Agents Chat API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process follow-up chat',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;
