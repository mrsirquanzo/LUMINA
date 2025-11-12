import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

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
- Cite data sources when relevant
- Highlight both opportunities and risks
- Use clear, professional language
- Ask clarifying questions when needed
- Format responses with clear sections and bullet points`;

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
    console.error('Error in Data Analyst API:', error);

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
    name: 'Data Analyst Agent API',
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    description: 'AI agent for analyzing biotech clinical and preclinical data',
  });
}
