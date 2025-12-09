// Google Gemini Client Adapter

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ILLMClient, LLMResponse, LLMClientConfig } from './types';

export class GeminiClient implements ILLMClient {
  private client: GoogleGenerativeAI;
  private config: LLMClientConfig;

  constructor(config: LLMClientConfig) {
    this.config = config;
    const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || '';
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(
    systemPrompt: string,
    userMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<LLMResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      systemInstruction: systemPrompt,
    });

    const generationConfig = {
      maxOutputTokens: options?.maxTokens || this.config.maxTokens || 4096,
      temperature: options?.temperature || this.config.temperature || 1.0,
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    // Gemini usage metadata
    const usage = response.usageMetadata;

    return {
      content: text,
      model: this.config.model,
      usage: usage ? {
        inputTokens: usage.promptTokenCount || 0,
        outputTokens: usage.candidatesTokenCount || 0,
      } : undefined,
      provider: 'google',
    };
  }
}
