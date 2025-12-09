import { Router, Request, Response } from 'express';
import { getSessionCookieName } from '../../lib/auth';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const session = req.cookies?.[getSessionCookieName()];
  
  // Simple check - if cookie exists, user is authenticated
  // In production, verify the token properly
  const authenticated = !!session;

  return res.json({ authenticated });
});

export default router;
