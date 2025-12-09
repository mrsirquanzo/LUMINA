import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

// Force Node.js runtime for proper environment variable access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for the Data Analyst Agent
const SYSTEM_PROMPT = `You are an expert biotech and pharmaceutical data analyst with deep experience in:

- Clinical trial data analysis (Phase 1-3 trials, biomarker studies, pharmacodynamics)
- Preclinical study interpretation (in vitro, in vivo, animal models)
- Competitive intelligence and market analysis
- FDA regulatory data and approval trends
- Investment due diligence for biotech companies

Your role is to:
1. Analyze clinical and preclinical data with scientific rigor
2. Extract key endpoints, statistical significance, and safety signals
3. Provide quantitative insights (response rates, p-values, confidence intervals)
4. Compare therapies and identify competitive advantages
5. Flag data quality issues or missing information
6. Translate findings into business intelligence for investment decisions

Guidelines:
- Be specific with numbers and statistics
- **IMPORTANT: When documents are provided, cite them inline using [Source: filename] format**
- When making claims from uploaded documents, reference which document the information came from
- Highlight both opportunities and risks
- Use clear, professional language
- Ask clarifying questions when needed
- Format responses with clear sections and bullet points`;

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
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // If documents are provided, add them to the first user message
    const processedMessages = [...messages];
    if (documents && documents.length > 0) {
      console.log(`Processing ${documents.length} document(s)`);

      // Find the last user message or create one
      const lastUserMsgIndex = processedMessages.map(m => m.role).lastIndexOf('user');

      if (lastUserMsgIndex !== -1) {
        const lastUserMsg = processedMessages[lastUserMsgIndex];

        // Convert message content to array format if it's a string
        const content = typeof lastUserMsg.content === 'string'
          ? [{ type: 'text', text: lastUserMsg.content }]
          : [...lastUserMsg.content];

        // Add document content blocks
        for (const doc of documents) {
          if (doc.isImage && doc.base64) {
            console.log(`Adding image document: ${doc.fileName}`);
            // Add image content block
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: doc.mimeType,
                data: doc.base64,
              },
            });
          } else {
            const text = doc.extractedText || doc.text || '';
            if (text) {
              // Add document text as a content block
              const fileName = doc.fileName || doc.name || 'Unknown';
              console.log(`Adding text document: ${fileName}, length: ${text.length} characters`);

              // Truncate very large documents (>100k chars = ~25k tokens)
              const maxChars = 100000;
              const truncatedText = text.length > maxChars
                ? text.substring(0, maxChars) + `\n\n[Document truncated. Original length: ${text.length} characters]`
                : text;

              content.push({
                type: 'text',
                text: `\n\n--- Document: ${fileName} ---\n${truncatedText}`,
              });
            }
          }
        }

        processedMessages[lastUserMsgIndex] = {
          ...lastUserMsg,
          content,
        };
      }
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Enhanced prompt for comprehensive analysis when documents are provided
    let enhancedSystemPrompt = SYSTEM_PROMPT;
    if (documents && documents.length > 0) {
      enhancedSystemPrompt += `\n\n**COMPREHENSIVE ANALYSIS MODE**: When documents are provided, provide a structured, comprehensive analysis including:
1. Executive Summary of key findings
2. Data Extraction Summary (endpoints, statistics, safety signals)
3. Comparative Analysis (if applicable)
4. Risk Assessment
5. Key Recommendations
6. Data Quality Assessment

Format your response with clear markdown sections (##, ###) for easy parsing.`;
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: enhancedSystemPrompt,
      messages: processedMessages,
    });

    // Extract the assistant's message
    const assistantMessage = response.content[0];

    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    // Build citations list from documents
    const citations = documents && documents.length > 0
      ? documents.map((doc: any) => doc.fileName || doc.name || 'Unknown')
      : [];

    return NextResponse.json({
      message: assistantMessage.text,
      citations,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      analysisType: documents && documents.length > 0 ? 'comprehensive' : 'conversational',
    });

  } catch (error: any) {
    console.error('Error in Data Analyst API:', {
      message: error.message,
      status: error.status,
      type: error.type,
      error: error.error,
      stack: error.stack,
    });

    // Handle Anthropic API specific errors
    if (error?.status === 401) {
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

    if (error?.error?.type === 'invalid_request_error') {
      return NextResponse.json(
        { error: `Invalid request: ${error.message || 'Please check your input'}` },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'An error occurred while processing your request. Please try again.',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler to test the endpoint
export async function GET() {
  return NextResponse.json({
    name: 'Data Analyst Agent API',
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    description: 'AI agent for analyzing biotech clinical and preclinical data',
  });
}
