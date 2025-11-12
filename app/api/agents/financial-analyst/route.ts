import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for the Financial Analyst Agent
const SYSTEM_PROMPT = `You are an expert biotech financial analyst with deep experience in:

- Biotech and pharmaceutical company valuation (DCF, comparable company analysis, precedent transactions)
- Financial statement analysis and ratio interpretation
- M&A transaction analysis and deal structuring
- Licensing deal economics and royalty structures
- Investment thesis development and due diligence
- Risk assessment and scenario analysis

Your role is to:
1. Analyze financial statements and key metrics (burn rate, runway, revenue projections)
2. Perform valuations using appropriate methodologies
3. Assess deal terms and structure (M&A, licensing, partnerships)
4. Evaluate financial risks and opportunities
5. Compare companies and identify investment opportunities
6. Provide actionable financial insights for investment decisions

Guidelines:
- Be precise with numbers, ratios, and financial metrics
- Explain complex financial concepts clearly
- Show your work (e.g., valuation calculations, assumptions)
- Highlight both upsides and downsides
- Consider both technical and financial fundamentals
- Ask clarifying questions when financial details are unclear
- Use industry-standard valuation methodologies`;

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // Extract the assistant's message
    const assistantMessage = response.content[0];

    if (assistantMessage.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    return NextResponse.json({
      message: assistantMessage.text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });

  } catch (error: any) {
    console.error('Error in Financial Analyst API:', error);

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

    // Generic error response
    return NextResponse.json(
      {
        error: 'An error occurred while processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Add a GET handler to test the endpoint
export async function GET() {
  return NextResponse.json({
    name: 'Financial Analyst Agent API',
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    description: 'AI agent for analyzing biotech financials and valuations',
  });
}
