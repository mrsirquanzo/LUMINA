import { promises as fs } from 'fs';
import path from 'path';
import type { Briefing } from '@mrsirquanzo/sonny-shared';

const RUNS_DIR = path.join(process.cwd(), 'server', 'data', 'sonny-runs');

/**
 * Sanitize a runId so it is safe to use as a filename.
 * Allows only [A-Za-z0-9._-]; replaces any other character with '_'.
 * Throws if the result (after trimming whitespace) is empty.
 */
function sanitizeRunId(runId: string): string {
  if (!runId || !runId.trim()) {
    throw new Error('runId must not be empty or whitespace-only');
  }
  return runId.replace(/[^A-Za-z0-9._-]/g, '_');
}

export async function saveBriefing(runId: string, briefing: Briefing): Promise<void> {
  const safeId = sanitizeRunId(runId);
  await fs.mkdir(RUNS_DIR, { recursive: true });
  const target = path.join(RUNS_DIR, `${safeId}.json`);
  const tmp = `${target}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(briefing, null, 2), 'utf-8');
  await fs.rename(tmp, target);
}

export async function loadBriefing(runId: string): Promise<Briefing | null> {
  const safeId = sanitizeRunId(runId);
  const filePath = path.join(RUNS_DIR, `${safeId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Briefing;
  } catch {
    return null;
  }
}

export interface CachedBriefing {
  runId: string;
  briefing: Briefing;
}

function normalizeTarget(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Resolve a canonical target mentioned in a demo prompt to a persisted run.
 * Only concise target names are considered so old runs whose target was the
 * entire prompt cannot shadow the canonical TROP2/CDCP1 caches.
 */
export async function loadDemoBriefing(input: string): Promise<CachedBriefing | null> {
  const requested = normalizeTarget(input);
  if (!requested) return null;

  let files: string[];
  try {
    files = (await fs.readdir(RUNS_DIR))
      .filter((file) => file.endsWith('.json'))
      .sort()
      .reverse();
  } catch {
    return null;
  }

  let containedMatch: CachedBriefing | null = null;
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(RUNS_DIR, file), 'utf-8');
      const briefing = JSON.parse(raw) as Briefing;
      const target = typeof briefing.target === 'string' ? briefing.target.trim() : '';
      if (!target || target.length > 20 || !/^[A-Za-z0-9._-]+$/.test(target)) continue;

      const normalized = normalizeTarget(target);
      const match = { runId: file.slice(0, -'.json'.length), briefing };
      if (requested === normalized) return match;
      if (!containedMatch && normalized.length >= 4 && requested.includes(normalized)) {
        containedMatch = match;
      }
    } catch {
      // A malformed cache entry must not make demo lookup fail.
    }
  }

  return containedMatch;
}
