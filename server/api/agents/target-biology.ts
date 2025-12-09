import { Router, Request, Response } from 'express';
import { TargetBiologyAgent } from '../../../src/lib/agents/targetBiologyAgent';
import { AGENT_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { isAuthenticated } from '../../lib/auth';

const router = Router();

/**
 * POST /api/agents/target-biology
 * Assess a target or answer a query about a target
 */
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { targetSymbol, indication, depth, query, format } = req.body;

    if (!targetSymbol) {
      return res.status(400).json({ error: 'targetSymbol is required' });
    }

    console.log('[Target Biology API] Request:', {
      targetSymbol,
      indication,
      depth,
      hasQuery: !!query,
      format,
    });

    const llmConfig = AGENT_MODEL_CONFIG.target_biology;
    const agent = new TargetBiologyAgent(llmConfig);

    // If query provided, use it; otherwise do full assessment
    let result: any;
    
    if (query) {
      // For tile chat queries: assess target and answer query
      const report = await agent.assessTarget(targetSymbol, {
        indication,
        depth: depth || 'standard',
      });
      
      const answer = await agent.answerQuery(query, report);
      
      result = {
        targetSymbol,
        query,
        answer,
        report: format === 'full' ? report : undefined, // Include full report if requested
      };
    } else {
      // Full assessment
      const report = await agent.assessTarget(targetSymbol, {
        indication,
        depth: depth || 'standard',
      });
      
      // Format based on persona or default
      const formatted = format === 'bd' 
        ? agent.formatBDOutput(report)
        : format === 'scientist'
        ? agent.formatScientistOutput(report)
        : report.executiveSummary; // Default to executive summary
      
      result = {
        targetSymbol,
        report,
        formatted,
      };
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Target Biology API] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to assess target',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/agents/target-biology/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agent: 'target_biology',
    timestamp: new Date().toISOString(),
  });
});

export default router;
