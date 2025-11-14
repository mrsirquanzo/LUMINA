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
    let userMessage = typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : lastUserMessage.content.find((c: any) => c.type === 'text')?.text || '';

    if (documents && documents.length > 0) {
      const docContext = documents.map((doc: any) => {
        if (doc.text) {
          return `\n\n--- Document: ${doc.fileName} ---\n${doc.text}`;
        }
        return `- ${doc.fileName}`;
      }).join('\n');
      userMessage += `\n\nDocuments provided:${docContext}`;
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create LLM client for regulatory agent (Claude Sonnet 4)
    const client = createLLMClient(AGENT_MODEL_CONFIG.regulatory);

    // Call LLM
    const response = await client.sendMessage(
      AGENT_PROMPTS.regulatory,
      userMessage,
      { maxTokens: 4096 }
    );

    // Build citations list from documents
    const citations = documents && documents.length > 0
      ? documents.map((doc: any) => doc.fileName)
      : [];

    return NextResponse.json({
      message: response.content,
      citations,
      usage: response.usage ? {
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
      } : undefined,
      model: AGENT_MODEL_CONFIG.regulatory.model,
      provider: AGENT_MODEL_CONFIG.regulatory.provider,
    });
  } catch (error: any) {
    console.error('Regulatory Agent Error:', error);

    // Handle API-specific errors
    if (error?.status === 401 || error?.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your configuration.' },
        { status: 401 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler to test the endpoint
export async function GET() {
  return NextResponse.json({
    name: 'Regulatory Expert Agent API',
    status: 'active',
    model: AGENT_MODEL_CONFIG.regulatory.model,
    provider: AGENT_MODEL_CONFIG.regulatory.provider,
    description: 'AI agent for regulatory pathway analysis and compliance',
  });
}
