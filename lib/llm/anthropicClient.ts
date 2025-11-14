// Anthropic Claude Client Adapter

import Anthropic from '@anthropic-ai/sdk';
import { ILLMClient, LLMResponse, LLMClientConfig } from './types';

export class AnthropicClient implements ILLMClient {
  private client: Anthropic;
  private config: LLMClientConfig;

  constructor(config: LLMClientConfig) {
    this.config = config;

    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Anthropic API key is required. Please set ANTHROPIC_API_KEY environment variable.'
      );
    }

    this.client = new Anthropic({
      apiKey: apiKey,
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
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: options?.maxTokens || this.config.maxTokens || 4096,
      temperature: options?.temperature || this.config.temperature || 1.0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const message = response.content[0];
    if (message.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return {
      content: message.text,
      model: this.config.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      provider: 'anthropic',
    };
  }
}
