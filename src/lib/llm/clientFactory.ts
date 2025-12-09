// LLM Client Factory

import type { ILLMClient, LLMClientConfig, LLMProvider } from './types';
import { AnthropicClient } from './anthropicClient';
import { GeminiClient } from './geminiClient';
import { PerplexityClient } from './perplexityClient';

/**
 * Create an LLM client based on provider
 */
export function createLLMClient(config: LLMClientConfig): ILLMClient {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicClient(config);
    case 'google':
      return new GeminiClient(config);
    case 'perplexity':
      return new PerplexityClient(config);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

/**
 * Validate that required API keys are configured
 */
export function validateApiKeys(providers: LLMProvider[]): {
  valid: boolean;
  missing: LLMProvider[];
} {
  const missing: LLMProvider[] = [];

  for (const provider of providers) {
    switch (provider) {
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          missing.push(provider);
        }
        break;
      case 'google':
        if (!process.env.GOOGLE_API_KEY) {
          missing.push(provider);
        }
        break;
      case 'perplexity':
        if (!process.env.PERPLEXITY_API_KEY) {
          missing.push(provider);
        }
        break;
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
