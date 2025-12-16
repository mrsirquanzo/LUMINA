import { Router } from 'express';
import { buildEntryKey, getUnread } from '../../lib/intelligence/store';

const router = Router();

router.get('/', async (req, res) => {
  const target = String(req.query.target || '').trim() || undefined;
  const asset = String(req.query.asset || '').trim() || undefined;
  const company = String(req.query.company || '').trim() || undefined;
  const indication = String(req.query.indication || '').trim() || undefined;

  const entryKey = buildEntryKey({ target, asset, company, indication });
  const result = await getUnread(entryKey);
  return res.json({ entryKey, ...result });
});

export default router;

