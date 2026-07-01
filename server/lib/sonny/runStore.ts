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
