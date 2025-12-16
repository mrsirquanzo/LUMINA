import {
  getJob,
  loadStore,
  saveStore,
  updateJob,
  type IntelligenceJob,
  type IntelligenceJobStatus,
} from './store';

/**
 * Background job runner (Phase 3)
 *
 * Purpose:
 * - Resume queued/running digest jobs after a server restart
 * - Requeue jobs that were "running" but lost their worker (no recent heartbeat)
 *
 * Notes:
 * - This is a simple single-process runner (no Redis).
 * - It is safe for local/dev and single-instance deployments.
 */

type DigestRunner = (jobId: string, payload: any, entryKey: string) => Promise<void>;

const HEARTBEAT_STALE_MS = 60_000; // 60s without heartbeat -> assume worker died
const POLL_INTERVAL_MS = 1_000;

let isStarted = false;
let currentJobId: string | null = null;

function isActiveStatus(status: IntelligenceJobStatus): boolean {
  // Runner should ONLY pick queued jobs.
  // "running" jobs are either in-flight in this process or will be re-queued if stale.
  return status === 'queued';
}

function isStaleHeartbeat(job: IntelligenceJob): boolean {
  if (job.status !== 'running') return false;
  if (!job.heartbeatAt) return true;
  const t = new Date(job.heartbeatAt).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > HEARTBEAT_STALE_MS;
}

async function repairStaleRunningJobs(): Promise<void> {
  const store = await loadStore();
  const jobs = Object.values(store.jobs ?? {});

  for (const job of jobs) {
    if (!isStaleHeartbeat(job)) continue;
    // Mark stale running jobs back to queued so they can be retried.
    store.jobs = store.jobs ?? {};
    store.jobs[job.id] = {
      ...job,
      status: 'queued',
      message: 'Re-queued after restart (stale heartbeat)',
      error: undefined,
      startedAt: undefined,
      finishedAt: undefined,
      progress: job.progress ?? 0,
      heartbeatAt: new Date().toISOString(),
    };
  }

  await saveStore(store);
}

async function pickNextJob(): Promise<IntelligenceJob | null> {
  const store = await loadStore();
  const jobs = Object.values(store.jobs ?? {}).filter((j) => isActiveStatus(j.status) && j.type === 'digest');
  jobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return jobs[0] ?? null;
}

async function runLoop(runDigest: DigestRunner): Promise<void> {
  if (currentJobId) return;

  await repairStaleRunningJobs();
  const job = await pickNextJob();
  if (!job) return;
  if (!job.payload) {
    await updateJob(job.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      progress: 1,
      message: 'Failed',
      error: 'Missing job payload; cannot resume.',
    });
    return;
  }

  currentJobId = job.id;
  try {
    await runDigest(job.id, job.payload, job.entryKey);
  } catch (e) {
    await updateJob(job.id, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      progress: 1,
      message: 'Failed',
      error: e instanceof Error ? e.message : 'Unknown error',
      heartbeatAt: new Date().toISOString(),
    });
  } finally {
    currentJobId = null;
  }
}

export function startIntelligenceJobRunner(runDigest: DigestRunner): void {
  if (isStarted) return;
  isStarted = true;

  // Kick once immediately, then poll.
  void runLoop(runDigest);
  setInterval(() => {
    void runLoop(runDigest);
  }, POLL_INTERVAL_MS);
}

export async function getCurrentJob(): Promise<IntelligenceJob | null> {
  if (!currentJobId) return null;
  return await getJob(currentJobId);
}

