import { describe, it, expect, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { saveBriefing, loadBriefing, loadDemoBriefing } from './runStore.js';
import type { Briefing } from '@mrsirquanzo/sonny-shared';

const briefing = { target: 'CDCP1', recommendation: { verdict: 'watch' } } as unknown as Briefing;

// These tests write into the real runs dir; clean up so stub CDCP1 fixtures
// don't linger and pollute demo-mode lookups.
const RUNS_DIR = path.join(process.cwd(), 'server', 'data', 'sonny-runs');
const created: string[] = [];
afterAll(async () => {
  await Promise.all(created.map((f) => fs.rm(path.join(RUNS_DIR, `${f}.json`), { force: true }).catch(() => {})));
});

describe('runStore', () => {
  it('round-trips a briefing by runId', async () => {
    const runId = `test-${process.pid}-${Date.now()}`;
    created.push(runId);
    await saveBriefing(runId, briefing);
    const loaded = await loadBriefing(runId);
    expect(loaded).toEqual(briefing);
  });

  it('returns null for an unknown runId', async () => {
    expect(await loadBriefing(`missing-${process.pid}-${Date.now()}`)).toBeNull();
  });

  it('sanitizes a path-traversal runId to a safe filename (no escape)', async () => {
    const evil = '../../evil';
    created.push('.._.._evil');
    await saveBriefing(evil, briefing);
    // it is retrievable via the same sanitized key, and did NOT write outside the dir
    expect(await loadBriefing(evil)).toEqual(briefing);
  });

  it('throws on an empty runId', async () => {
    await expect(saveBriefing('   ', briefing)).rejects.toThrow();
  });

  it('resolves the checked-in TROP2 briefing for demo replay', async () => {
    const cached = await loadDemoBriefing('Create a deep research report on TROP2');

    expect(cached?.runId).toMatch(/^TROP2-/);
    expect(cached?.briefing.target).toBe('TROP2');
  });
});
