/**
 * API Route: Generate Investment Memo
 *
 * Endpoint for generating professional investment memos from agent analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvestmentMemo } from '@/lib/deliverables/extraction';
import { generateInvestmentMemoPDF, generateInvestmentMemoMarkdown } from '@/lib/deliverables/pdf-generator';
import { AgentResponses } from '@/lib/deliverables/types';

export const maxDuration = 300; // 5 minutes for complex memo generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentResponses,
      companyName,
      analysisId,
      generatedBy,
      format = 'pdf' // 'pdf' or 'markdown'
    }: {
      agentResponses: AgentResponses;
      companyName?: string;
      analysisId?: string;
      generatedBy?: string;
      format?: 'pdf' | 'markdown';
    } = body;

    // Validate inputs
    if (!agentResponses || !agentResponses.synthesis) {
      return NextResponse.json(
        { error: 'Agent responses are required. At minimum, synthesis response must be provided.' },
        { status: 400 }
      );
    }

    console.log('[Investment Memo] Starting generation...');
    console.log('[Investment Memo] Company:', companyName || 'Unknown');
    console.log('[Investment Memo] Format:', format);
    console.log('[Investment Memo] Available agent responses:', Object.keys(agentResponses));
    console.log('[Investment Memo] Agent response lengths:', Object.entries(agentResponses).map(([key, val]) =>
      `${key}: ${val ? (typeof val === 'string' ? val.length : 'not a string') : 'undefined'} chars`
    ));

    // Generate memo content by extracting sections
    const { sections, metadata } = await generateInvestmentMemo(agentResponses, {
      companyName,
      analysisId,
      generatedBy
    });

    console.log('Memo content generated. Total words:', metadata.totalWords);
    console.log('Sections extracted:', Object.keys(sections).length);

    // Generate output in requested format
    if (format === 'pdf') {
      const pdfBlob = generateInvestmentMemoPDF(sections, metadata);
      const buffer = Buffer.from(await pdfBlob.arrayBuffer());

      const filename = companyName
        ? `investment-memo-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`
        : `investment-memo-${Date.now()}.pdf`;

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Total-Words': metadata.totalWords.toString(),
          'X-Total-Sections': Object.keys(sections).length.toString()
        }
      });
    } else if (format === 'markdown') {
      const markdownContent = generateInvestmentMemoMarkdown(sections, metadata);

      const filename = companyName
        ? `investment-memo-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.md`
        : `investment-memo-${Date.now()}.md`;

      return new NextResponse(markdownContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Total-Words': metadata.totalWords.toString(),
          'X-Total-Sections': Object.keys(sections).length.toString()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf" or "markdown".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Investment Memo] Generation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Investment Memo] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    // If it's an Anthropic API error, provide more specific details
    if (errorMessage.includes('API') || errorMessage.includes('Anthropic')) {
      return NextResponse.json(
        {
          error: 'Failed to generate investment memo - API Error',
          details: errorMessage,
          suggestion: 'This may be due to API rate limits or authentication issues. Please check your Anthropic API key and try again.',
          technicalDetails: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate investment memo',
        details: errorMessage,
        suggestion: 'Please ensure all required agent responses are provided and try again.',
        technicalDetails: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve available templates
 */
export async function GET() {
  try {
    const templates = [
      {
        id: 'investment-memo',
        title: 'Investment Memo - Institutional Grade',
        description: 'Comprehensive 15-25 page investment analysis suitable for IC presentation',
        estimatedPages: '15-25 pages',
        estimatedWords: '6,000-10,000 words',
        requiredAgents: ['synthesis'],
        optionalAgents: ['clinical', 'patent', 'financial', 'market', 'regulatory'],
        sections: 16
      }
    ];

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
