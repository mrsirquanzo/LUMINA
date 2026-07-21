// Real per-run accounting emitted by the engine worker on the `done` event.
// Tokens and wall-clock are measured; cost is measured tokens × provider list price.
export interface RunMeta {
  backend: string;
  elapsedMs: number;
  modelCalls: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number | null;
  priced: boolean;
}

export function isRunMeta(v: unknown): v is RunMeta {
  return !!v && typeof v === 'object' && typeof (v as RunMeta).elapsedMs === 'number';
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

export function formatCost(meta: RunMeta): string {
  if (meta.costUsd === null) return '—';
  if (meta.backend === 'ollama') return 'local · free';
  if (meta.costUsd < 0.01) return `$${meta.costUsd.toFixed(4)}`;
  return `$${meta.costUsd.toFixed(2)}`;
}

export function backendLabel(backend: string): string {
  if (backend === 'openai') return 'Groq · open models';
  if (backend === 'anthropic') return 'Anthropic';
  if (backend === 'ollama') return 'local Ollama';
  return backend;
}
