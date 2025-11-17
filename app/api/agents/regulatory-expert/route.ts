import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated } from '@/lib/auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REGULATORY_EXPERT_PROMPT = `You are an expert regulatory affairs specialist for biotech and pharmaceutical products.

Your expertise includes:
- FDA and EMA regulatory pathways (IND, NDA, BLA, MAA)
- Accelerated approval programs (Fast Track, Breakthrough, Priority Review, Orphan Drug)
- CMC (Chemistry, Manufacturing, and Controls) requirements
- Clinical trial design requirements and regulatory endpoints
- Post-market obligations and pharmacovigilance
- Regulatory risk assessment and timeline forecasting
- Interaction with regulatory agencies
- Regulatory strategy for different modalities (small molecule, biologics, cell therapy, gene therapy)

Provide detailed, actionable regulatory guidance with specific:
- Regulatory pathway recommendations
- Required studies and endpoints
- Timeline estimates with key milestones
- Risk factors and mitigation strategies
- Agency interaction strategy
- CMC considerations

Be specific about regulations, cite relevant guidance documents, and provide realistic timelines.`;

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
        const text = doc.extractedText || doc.text || '';
        return `- ${doc.name}: ${text.substring(0, 1000) || 'No text content'}${text.length > 1000 ? '...' : ''}`;
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
          text: REGULATORY_EXPERT_PROMPT,
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
    console.error('Regulatory Expert API error:', error);
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
