import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createLLMClient } from '@/lib/llm/clientFactory';
import { AGENT_MODEL_CONFIG } from '@/lib/llm/agentConfig';
import { AGENT_PROMPTS } from '@/lib/agentPrompts';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to use the live agent.' },
        { status: 401 }
      );
    }

    // Parse request body
    const { messages, documents } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Build context with documents if provided
    let userMessage = lastUserMessage.content;
    if (documents && documents.length > 0) {
      userMessage += `\n\nDocuments provided:\n${documents.map((d: any) => `- ${d.fileName}`).join('\n')}`;
    }

    // Create LLM client for regulatory agent (Claude Sonnet 4)
    const client = createLLMClient(AGENT_MODEL_CONFIG.regulatory);

    // Call LLM
    const response = await client.sendMessage(
      AGENT_PROMPTS.regulatory,
      userMessage,
      { maxTokens: 4096 }
    );

    return NextResponse.json({
      response: response.content,
      model: AGENT_MODEL_CONFIG.regulatory.model,
      provider: AGENT_MODEL_CONFIG.regulatory.provider,
    });
  } catch (error: any) {
    console.error('Regulatory Agent Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
