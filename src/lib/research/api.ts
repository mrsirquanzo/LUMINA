import type { BriefingView } from './sseTypes.js';

export function deepResearchPath(): string {
  if (typeof window === 'undefined') return '/api/agents/deep-research';
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1'
    ? '/api/agents/deep-research'
    : '/api/deep-research';
}

export async function startDeepResearch(
  target: string,
  mode: 'fast' | 'thorough'
): Promise<Response> {
  return fetch(deepResearchPath(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ target, mode }),
  });
}

export async function fetchBriefing(runId: string): Promise<BriefingView | null> {
  const res = await fetch(`${deepResearchPath()}/${encodeURIComponent(runId)}`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return (await res.json()) as BriefingView;
}
