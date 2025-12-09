import { Router } from 'express';

// Placeholder for individual agent routes
// These can be added later if needed for direct agent access

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Individual agent routes - use /api/agents/orchestrator for multi-agent orchestration',
    agents: ['clinical', 'patent', 'financial', 'market_research', 'regulatory'],
  });
});

export default router;
