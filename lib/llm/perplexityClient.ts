// Perplexity AI Client Adapter
// Perplexity uses OpenAI-compatible API

import OpenAI from 'openai';
import { ILLMClient, LLMResponse, LLMClientConfig } from './types';

export class PerplexityClient implements ILLMClient {
  private client: OpenAI;
  private config: LLMClientConfig;

  constructor(config: LLMClientConfig) {
    this.config = config;
    const apiKey = config.apiKey || process.env.PERPLEXITY_API_KEY || '';
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
  }

  async sendMessage(
    systemPrompt: string,
    userMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
      temperature: options?.temperature || this.config.temperature || 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      // Enable search mode for online/real-time capabilities
      // Perplexity-specific parameters (not in OpenAI types but accepted by API)
      search_domain_filter: undefined, // Allow all domains
      return_citations: true, // Get source citations
      search_recency_filter: 'month', // Focus on recent information
    } as any);

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error('Unexpected response from Perplexity');
    }

    return {
      content: message.content,
      model: this.config.model,
      usage: response.usage ? {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      } : undefined,
      provider: 'perplexity',
    };
  }
}
