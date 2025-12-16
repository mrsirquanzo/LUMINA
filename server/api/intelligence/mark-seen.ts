import { Router } from 'express';
import { buildEntryKey, markSeen } from '../../lib/intelligence/store';

const router = Router();

router.post('/', async (req, res) => {
  const target = String(req.body?.target || req.query.target || '').trim() || undefined;
  const asset = String(req.body?.asset || req.query.asset || '').trim() || undefined;
  const company = String(req.body?.company || req.query.company || '').trim() || undefined;
  const indication = String(req.body?.indication || req.query.indication || '').trim() || undefined;

  const entryKey = buildEntryKey({ target, asset, company, indication });
  const result = await markSeen(entryKey);
  return res.json({ entryKey, ...result });
});

export default router;

