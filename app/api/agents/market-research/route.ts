import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MARKET_RESEARCH_PROMPT = `You are an expert market research analyst specializing in biotech and pharmaceutical markets.

Your expertise includes:
- Market sizing and epidemiology analysis
- Competitive landscape mapping and positioning
- Pricing and reimbursement dynamics
- Payer landscape and market access strategies
- Revenue forecasting and peak sales estimation
- Commercial opportunity assessment
- Patient journey and treatment algorithms
- KOL (Key Opinion Leader) landscape
- Commercial launch readiness
- Market segmentation and targeting

Provide detailed, data-driven market analysis with:
- Market size calculations (TAM, SAM, SOM)
- Patient population estimates with prevalence/incidence data
- Competitive positioning vs. existing therapies
- Pricing benchmarks and willingness-to-pay
- Revenue forecasts with assumptions clearly stated
- Market access barriers and strategies
- Commercial risk factors

Be quantitative, cite relevant market data sources, and provide realistic forecasts with clear assumptions.`;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { query, documents } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build context from documents
    let documentContext = '';
    if (documents && documents.length > 0) {
      documentContext = '\n\nDocuments provided:\n' + documents.map((doc: any) => {
        return `- ${doc.fileName}: ${doc.text?.substring(0, 500) || 'No text content'}...`;
      }).join('\n');
    }

    const userMessage = `${query}${documentContext}`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: MARKET_RESEARCH_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const message = response.content[0];
    if (message.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Calculate cost (approximate)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

    return new Response(
      JSON.stringify({
        response: message.text,
        cost: cost,
        usage: {
          inputTokens,
          outputTokens,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Market Research API error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
