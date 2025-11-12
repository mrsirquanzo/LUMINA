import { NextRequest, NextResponse } from 'next/server';
import { estimateMultiAgentCost } from '@/lib/costEstimation';
import { ProcessedDocument, ExecutionMode } from '@/lib/multiAgentTypes';

export async function POST(req: NextRequest) {
  try {
    const { query, documents, mode } = await req.json();

    // Validate inputs
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (!mode || !['fast', 'thorough'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be either "fast" or "thorough"' },
        { status: 400 }
      );
    }

    const processedDocuments: ProcessedDocument[] = documents || [];

    // Calculate cost estimate
    const estimate = estimateMultiAgentCost(query, processedDocuments, mode as ExecutionMode);

    return NextResponse.json({
      success: true,
      estimate,
    });

  } catch (error: any) {
    console.error('Error estimating cost:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate cost' },
      { status: 500 }
    );
  }
}
