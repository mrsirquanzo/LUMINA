// Unified LLM Client Types

export type LLMProvider = 'anthropic' | 'google' | 'perplexity';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: LLMProvider;
}

export interface LLMClientConfig {
  provider: LLMProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export interface ILLMClient {
  /**
   * Send a message and get a response
   */
  sendMessage(
    systemPrompt: string,
    userMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<LLMResponse>;

  /**
   * Stream a response (for future use)
   */
  streamMessage?(
    systemPrompt: string,
    userMessage: string,
    onChunk: (chunk: StreamChunk) => void,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<LLMResponse>;
}
