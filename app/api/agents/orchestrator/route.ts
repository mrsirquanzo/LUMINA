import { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { ProcessedDocument, ExecutionMode, SSEEvent } from '@/lib/multiAgentTypes';
import { runOrchestration } from '@/lib/orchestrationEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Parse request body
    const { query, documents, mode, isDemo, demoScenarioId } = await req.json();

    // Validate inputs
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!mode || !['fast', 'thorough'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Mode must be either "fast" or "thorough"' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const processedDocuments: ProcessedDocument[] = documents || [];

    // Create SSE stream
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: SSEEvent) => {
          const eventData = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          // Run orchestration with streaming updates
          await runOrchestration(
            query,
            processedDocuments,
            mode as ExecutionMode,
            sendEvent,
            isDemo,
            demoScenarioId
          );

          controller.close();
        } catch (error: any) {
          console.error('Orchestration error:', error);
          sendEvent({
            type: 'error',
            data: {
              message: error.message || 'An error occurred during analysis',
            },
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: any) {
    console.error('Error in orchestrator API:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to start orchestration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Optional: Add a GET handler to test the endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      name: 'Multi-Agent Orchestrator API',
      status: 'active',
      description: 'Coordinates Clinical, Patent, and Financial agents for comprehensive analysis',
      modes: ['fast', 'thorough'],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
