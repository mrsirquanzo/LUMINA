import { Router, Request, Response } from 'express';
import type { Briefing } from '@mrsirquanzo/sonny-shared';
import { startRun as realStartRun } from '../../lib/sonny/adapter.js';
import { subscribe as realSubscribe } from '../../lib/sonny/runBus.js';
import type { BusEvent } from '../../lib/sonny/runBus.js';
import { loadBriefing as realLoadBriefing } from '../../lib/sonny/runStore.js';
import { loadDemoBriefing as realLoadDemoBriefing } from '../../lib/sonny/runStore.js';

export type { BusEvent };

export interface UploadedDocumentInput { name: string; text: string; }

export interface DeepResearchDeps {
  makeRunId: (target: string) => string;
  startRun: (input: { runId: string; target: string; mode: 'fast' | 'thorough'; backend?: string; documents?: UploadedDocumentInput[] }) => void;
  subscribe: (runId: string, fn: (e: BusEvent) => void) => () => void;
  loadBriefing: (runId: string) => Promise<Briefing | null>;
  loadDemoBriefing: (target: string) => Promise<{ runId: string; briefing: Briefing } | null>;
}

const MAX_DOCUMENTS = 8;
const MAX_DOCUMENT_CHARS = 400_000; // total across all attached documents

// Accept only well-formed {name, text} entries and bound the total payload so a
// pasted document can't blow up the worker context.
function sanitizeDocuments(raw: unknown): UploadedDocumentInput[] {
  if (!Array.isArray(raw)) return [];
  const out: UploadedDocumentInput[] = [];
  let total = 0;
  for (const item of raw) {
    if (out.length >= MAX_DOCUMENTS) break;
    if (!item || typeof item !== 'object') continue;
    const name = (item as { name?: unknown }).name;
    const text = (item as { text?: unknown }).text;
    if (typeof name !== 'string' || typeof text !== 'string' || !text.trim()) continue;
    const remaining = MAX_DOCUMENT_CHARS - total;
    if (remaining <= 0) break;
    const clipped = text.slice(0, remaining);
    total += clipped.length;
    out.push({ name: name.slice(0, 200), text: clipped });
  }
  return out;
}

let counter = 0;

function defaultMakeRunId(target: string): string {
  return `${String(target).replace(/[^A-Za-z0-9._-]/g, '_')}-${Date.now().toString(36)}${(counter++).toString(36)}`;
}

export function makeDeepResearchRouter(deps: DeepResearchDeps): Router {
  const router = Router();

  // POST / - start a run and stream via SSE
  router.post('/', (req: Request, res: Response) => {
    const { target, mode } = req.body;
    const documents = sanitizeDocuments(req.body?.documents);

    if (!target || typeof target !== 'string') {
      res.status(400).json({ error: 'target is required and must be a non-empty string' });
      return;
    }

    // Fast mode is retired - every run is thorough (4 rounds), regardless of
    // what the client sends.
    void mode;
    const resolvedMode: 'fast' | 'thorough' = 'thorough';

    const runId = deps.makeRunId(target);

    // Set SSE headers (mirrors orchestrator.ts)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Write the first frame
    res.write(`data: ${JSON.stringify({ type: 'run_started', runId })}\n\n`);

    // Start the engine
    deps.startRun({
      runId,
      target,
      mode: resolvedMode,
      backend: process.env.SONNY_BACKEND || 'ollama',
      ...(documents.length ? { documents } : {}),
    });

    // Subscribe and forward bus events
    const off = deps.subscribe(runId, (e: BusEvent) => {
      res.write(`data: ${JSON.stringify(e)}\n\n`);
      if (e.type === 'done' || e.type === 'error') {
        off();
        res.end();
      }
    });
  });

  // GET /demo/:target - resolve a deterministic cached run without starting the engine
  router.get('/demo/:target', async (req: Request, res: Response) => {
    const cached = await deps.loadDemoBriefing(req.params.target);
    if (cached) {
      res.json(cached);
    } else {
      res.status(404).json({ error: `No cached report for ${req.params.target} in demo mode.` });
    }
  });

  // GET /:runId - hydrate a finished report
  router.get('/:runId', async (req: Request, res: Response) => {
    const b = await deps.loadBriefing(req.params.runId);
    if (b) {
      res.json(b);
    } else {
      res.status(404).json({ error: 'not found' });
    }
  });

  return router;
}

// Default export uses the real Phase 1 deps
const deepResearchRoutes = makeDeepResearchRouter({
  makeRunId: defaultMakeRunId,
  startRun: realStartRun,
  subscribe: realSubscribe,
  loadBriefing: realLoadBriefing,
  loadDemoBriefing: realLoadDemoBriefing,
});

export default deepResearchRoutes;
