import type { BriefingView } from './sseTypes.js';

export function deepResearchPath(): string {
  if (typeof window === 'undefined') return '/api/agents/deep-research';
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1'
    ? '/api/agents/deep-research'
    : '/api/deep-research';
}

export interface AttachedDocument {
  name: string;
  text: string;
}

export interface ResearchScope {
  indication?: string;
  modality?: string;
}

export async function startDeepResearch(
  target: string,
  mode: 'fast' | 'thorough',
  documents: AttachedDocument[] = [],
  scope?: ResearchScope,
): Promise<Response> {
  return fetch(deepResearchPath(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      target,
      mode,
      ...(documents.length ? { documents } : {}),
      ...(scope && (scope.indication || scope.modality) ? { context: scope } : {}),
    }),
  });
}

export async function fetchBriefing(runId: string): Promise<BriefingView | null> {
  const res = await fetch(`${deepResearchPath()}/${encodeURIComponent(runId)}`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return (await res.json()) as BriefingView;
}

export interface DemoBriefing {
  runId: string;
  briefing: BriefingView;
}

export async function fetchDemoBriefing(target: string): Promise<DemoBriefing | null> {
  const res = await fetch(`${deepResearchPath()}/demo/${encodeURIComponent(target)}`, {
    credentials: 'include',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Demo cache request failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as DemoBriefing;
}
