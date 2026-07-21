// Real per-run cost/token/latency accounting.
//
// The engine's model wrapper does not surface token usage, so we capture it at
// the source: patch global fetch inside the worker and read the `usage` block
// that the LLM APIs return (Groq/OpenAI: usage.prompt_tokens/completion_tokens;
// Ollama: prompt_eval_count/eval_count; Anthropic: usage.input/output_tokens).
// Only LLM endpoints are counted - MCP/data-tool HTTP calls are ignored.

export interface RunMeta {
  backend: string;
  elapsedMs: number;
  modelCalls: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number | null; // null when unpriced
  priced: boolean;        // true = real list-price cost; false = local/free or unknown
}

// USD per 1,000,000 tokens (provider list prices; tokens themselves are measured).
const RATES: Array<{ match: RegExp; in: number; out: number }> = [
  { match: /gpt-oss-120b/i, in: 0.15, out: 0.75 },
  { match: /llama-3\.3-70b/i, in: 0.59, out: 0.79 },
  { match: /claude-opus/i, in: 15, out: 75 },
  { match: /claude-sonnet/i, in: 3, out: 15 },
];

function priceFor(model: string): { in: number; out: number } | null {
  return RATES.find((r) => r.match.test(model)) ?? null;
}

const LLM_URL = /\/chat\/completions|\/api\/generate|\/api\/chat|\/v1\/messages/;

interface CallUsage { model: string; prompt: number; completion: number; }

export interface UsageSniffer {
  restore: () => void;
  summary: (backend: string) => Promise<Omit<RunMeta, 'elapsedMs' | 'backend'> & { backend?: never }>;
}

export function installUsageSniffer(): UsageSniffer {
  const original = globalThis.fetch;
  const pending: Promise<CallUsage | null>[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const res = await original(input as never, init as never);
    if (url && LLM_URL.test(url)) {
      const clone = res.clone();
      pending.push(
        clone.json().then((body: unknown) => readUsage(body)).catch(() => null),
      );
    }
    return res;
  }) as typeof fetch;

  return {
    restore: () => { globalThis.fetch = original; },
    async summary(backend: string) {
      const calls = (await Promise.all(pending)).filter((c): c is CallUsage => c !== null);
      let prompt = 0, completion = 0, cost = 0, anyPriced = false;
      for (const c of calls) {
        prompt += c.prompt;
        completion += c.completion;
        const rate = priceFor(c.model);
        if (rate) { cost += (c.prompt * rate.in + c.completion * rate.out) / 1_000_000; anyPriced = true; }
      }
      const priced = anyPriced && backend !== 'ollama';
      return {
        modelCalls: calls.length,
        promptTokens: prompt,
        completionTokens: completion,
        costUsd: priced ? Number(cost.toFixed(4)) : (backend === 'ollama' ? 0 : null),
        priced,
      };
    },
  };
}

function num(v: unknown): number { return typeof v === 'number' && Number.isFinite(v) ? v : 0; }

function readUsage(body: unknown): CallUsage | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const model = typeof b.model === 'string' ? b.model : 'unknown';
  const usage = b.usage as Record<string, unknown> | undefined;
  // OpenAI / Groq
  if (usage && ('prompt_tokens' in usage || 'completion_tokens' in usage)) {
    return { model, prompt: num(usage.prompt_tokens), completion: num(usage.completion_tokens) };
  }
  // Anthropic
  if (usage && ('input_tokens' in usage || 'output_tokens' in usage)) {
    return { model, prompt: num(usage.input_tokens), completion: num(usage.output_tokens) };
  }
  // Ollama
  if ('eval_count' in b || 'prompt_eval_count' in b) {
    return { model, prompt: num(b.prompt_eval_count), completion: num(b.eval_count) };
  }
  return null;
}
