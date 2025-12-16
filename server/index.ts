import app from './app';
import { startIntelligenceJobRunner } from './lib/intelligence/jobRunner';
import { runDigestJob } from './lib/intelligence/digestWorker';

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LUMINA Backend Server running on port ${PORT}`);
  console.log('📡 CORS enabled');

  // Phase 3: resume queued/running digest jobs after restarts
  startIntelligenceJobRunner(async (jobId, payload, entryKey) => {
    await runDigestJob(jobId, payload, entryKey);
  });
});

export default app;
