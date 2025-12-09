import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { createLLMClient } from '@/lib/llm/clientFactory';
import { AGENT_MODEL_CONFIG } from '@/lib/llm/agentConfig';
import { AGENT_PROMPTS } from '@/lib/agentPrompts';

// Force Node.js runtime for proper environment variable access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const { messages, documents, targetSymbol, analysisType, context } = await req.json();

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

    // Enhanced prompt for comprehensive analysis when documents are provided
    let enhancedPrompt = AGENT_PROMPTS.target_biology;
    
    // Add context if provided (target, analysis type, etc.)
    if (targetSymbol) {
      enhancedPrompt += `\n\n**CURRENT TARGET CONTEXT**: ${targetSymbol}`;
    }
    
    if (analysisType) {
      enhancedPrompt += `\n\n**ANALYSIS TYPE**: ${analysisType}`;
    }
    
    if (context) {
      enhancedPrompt += `\n\n**ADDITIONAL CONTEXT**: ${context}`;
    }

    if (documents && documents.length > 0) {
      enhancedPrompt += `\n\n**COMPREHENSIVE ANALYSIS MODE**: When documents are provided, provide a structured, comprehensive target biology analysis including:
1. Executive Summary with key biological findings
2. Human Genetic Validation
3. Disease Biology & Mechanism
4. Expression Analysis
5. Druggability Assessment
6. Mechanism of Action Clarity
7. Translational Confidence
8. Key Biological Risks & Derisking Plan

Format your response with clear markdown sections (##, ###) for easy parsing.`;

      const docContext = documents.map((doc: any) => {
        if (doc.text) {
          return `\n\n--- Document: ${doc.fileName || doc.name} ---\n${doc.text}`;
        }
        return `- ${doc.fileName || doc.name}`;
      }).join('\n');
      userMessage += `\n\nDocuments provided:${docContext}`;
    }

    // Validate API key
    const modelConfig = AGENT_MODEL_CONFIG.target_biology;
    if (modelConfig.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    if (modelConfig.provider === 'google' && !process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create LLM client for target biology agent
    const client = createLLMClient(modelConfig);

    // Call LLM
    const response = await client.sendMessage(
      enhancedPrompt,
      userMessage,
      { maxTokens: 4096 }
    );

    // Build citations list from documents
    const citations = documents && documents.length > 0
      ? documents.map((doc: any) => doc.fileName || doc.name || 'Unknown')
      : [];

    return NextResponse.json({
      message: response.content,
      response: response.content, // Alias for compatibility
      citations,
      usage: response.usage ? {
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
      } : undefined,
      model: modelConfig.model,
      provider: modelConfig.provider,
      analysisType: documents && documents.length > 0 ? 'comprehensive' : 'conversational',
    });
  } catch (error: any) {
    console.error('Target Biology Agent Error:', error);

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
    name: 'Target Biology Expert Agent API',
    status: 'active',
    model: AGENT_MODEL_CONFIG.target_biology.model,
    provider: AGENT_MODEL_CONFIG.target_biology.provider,
    description: 'AI agent for analyzing target biology, validation, mechanism of action, and druggability',
  });
}
