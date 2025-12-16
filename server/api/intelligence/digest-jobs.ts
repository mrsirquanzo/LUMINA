import { Router } from 'express';
import { buildEntryKey, createJob, findActiveJob, getJob, updateJob } from '../../lib/intelligence/store';
import type { DigestJobPayload } from '../../lib/intelligence/digestWorker';

const router = Router();

router.post('/start', async (req, res) => {
  const body = req.body as DigestJobPayload;
  if (!body?.generatedAt || !body?.targetContext || !Array.isArray(body?.items)) {
    return res.status(400).json({ error: 'Invalid payload: expected {generatedAt, targetContext, items[]}' });
  }

  const entryKey = buildEntryKey({
    target: body.targetContext.target || undefined,
    asset: body.targetContext.asset || undefined,
    company: body.targetContext.company || undefined,
    indication: body.targetContext.indication || undefined,
  });

  const existing = await findActiveJob(entryKey);
  if (existing) return res.json({ jobId: existing.id, entryKey, status: existing.status });

  const jobPayload: DigestJobPayload = {
    generatedAt: body.generatedAt,
    persona: body.persona || 'GENERAL',
    targetContext: body.targetContext,
    items: body.items.slice(0, 10),
    isDemo: Boolean(body.isDemo),
  };

  const job = await createJob(entryKey, jobPayload);
  res.json({ jobId: job.id, entryKey, status: job.status });
  // Execution is handled by the background job runner started in `server/index.ts`.
});

router.get('/:jobId', async (req, res) => {
  const job = await getJob(String(req.params.jobId));
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json(job);
});

export default router;

