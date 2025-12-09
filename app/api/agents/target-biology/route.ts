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
    const { messages, documents, targetSymbol, query, depth, analysisType } = await req.json();

    // Validate messages or query
    let userMessage = '';
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
      if (lastUserMessage) {
        userMessage = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : lastUserMessage.content.find((c: any) => c.type === 'text')?.text || '';
      }
    } else if (query) {
      userMessage = query;
    } else {
      return NextResponse.json(
        { error: 'Messages array or query is required' },
        { status: 400 }
      );
    }

    // Enhanced prompt for comprehensive analysis
    let enhancedPrompt = AGENT_PROMPTS.target_biology;
    
    // Add context if provided
    if (targetSymbol) {
      enhancedPrompt += `\n\n**CURRENT TARGET**: ${targetSymbol}`;
    }
    
    if (analysisType) {
      enhancedPrompt += `\n\n**ANALYSIS TYPE**: ${analysisType}`;
    }
    
    if (depth) {
      enhancedPrompt += `\n\n**ANALYSIS DEPTH**: ${depth}`;
    }

    if (documents && documents.length > 0) {
      enhancedPrompt += `\n\n**COMPREHENSIVE ANALYSIS MODE**: When documents are provided, provide a structured, comprehensive target biology analysis including:
1. Executive Summary with key biological findings
2. Human Genetic Validation
3. Disease Biology & Mechanism
4. Expression Analysis
5. Druggability Assessment
6. Safety Assessment
7. Translational Confidence
8. Competitive Landscape

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
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create LLM client for target biology agent (Claude Sonnet 4)
    const client = createLLMClient(AGENT_MODEL_CONFIG.target_biology);

    // Call LLM
    const response = await client.sendMessage(
      enhancedPrompt,
      userMessage,
      { maxTokens: 4096 }
    );

    // Build citations list from documents
    const citations = documents && documents.length > 0
      ? documents.map((doc: any, idx: number) => ({
          id: idx + 1,
          title: doc.fileName || doc.name || `Document ${idx + 1}`,
          url: doc.url || '',
          type: 'document',
        }))
      : [];

    return NextResponse.json({
      response: response.content,
      citations,
      model: AGENT_MODEL_CONFIG.target_biology.model,
    });
  } catch (error: any) {
    console.error('Target Biology Agent API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get response from target biology agent',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
