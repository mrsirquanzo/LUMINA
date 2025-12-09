import { Router, Request, Response } from 'express';
import { ProcessedDocument, ExecutionMode, SSEEvent } from '../../../src/lib/multiAgentTypes';
import { runOrchestration } from '../../../src/lib/orchestrationEngine';
import { isAuthenticated } from '../../lib/auth';

const router = Router();

// GET handler for health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Sonny - Multi-Agent Orchestrator API',
    status: 'active',
    description: 'Sonny coordinates specialized AI agents for comprehensive biotech analysis',
    modes: ['fast', 'thorough'],
  });
});

// POST handler for orchestration (with optional auth middleware)
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { query, documents, mode, isDemo, demoScenarioId, customAgents, mcpEnabled } = req.body;

    console.log('[Sonny Orchestrator API] Received request:', {
      query: query?.substring(0, 50) + '...',
      mode,
      isDemo,
      demoScenarioId,
      documentsCount: documents?.length || 0,
    });

    // Validate inputs
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    if (!mode || !['fast', 'thorough'].includes(mode)) {
      return res.status(400).json({ error: 'Mode must be either "fast" or "thorough"' });
    }

    const processedDocuments: ProcessedDocument[] = documents || [];

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Create SSE stream
    const encoder = new TextEncoder();

    const sendEvent = (event: SSEEvent) => {
      const eventData = `data: ${JSON.stringify(event)}\n\n`;
      res.write(encoder.encode(eventData));
    };

    try {
      // Run orchestration with streaming updates
      await runOrchestration(
        query,
        processedDocuments,
        mode as ExecutionMode,
        sendEvent,
        isDemo,
        demoScenarioId,
        customAgents,
        mcpEnabled
      );

      res.end();
    } catch (error: any) {
      console.error('Orchestration error:', error);
      sendEvent({
        type: 'error',
        data: {
          message: error.message || 'An error occurred during analysis',
        },
      });
      res.end();
    }
  } catch (error: any) {
    console.error('Error in Sonny orchestrator API:', error);
    res.status(500).json({
      error: error.message || 'Failed to start orchestration',
    });
  }
});

export default router;
