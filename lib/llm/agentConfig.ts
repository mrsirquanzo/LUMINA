// Agent-to-Model Configuration

import { LLMClientConfig, LLMProvider } from './types';

export type AgentType = 'clinical' | 'patent' | 'financial' | 'market_research' | 'regulatory';

/**
 * Model configurations for each agent
 * This is the multi-model architecture mapping
 */
export const AGENT_MODEL_CONFIG: Record<AgentType, LLMClientConfig> = {
  // Clinical Data Analyst - Claude Sonnet 4 (best reasoning for complex clinical trials)
  clinical: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 1.0,
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  // Patent Expert - Perplexity Sonar Pro (real-time patent database searches with deeper retrieval)
  patent: {
    provider: 'perplexity',
    model: 'sonar-pro', // Deep retrieval with real-time search
    maxTokens: 4096,
    temperature: 0.7,
    apiKey: process.env.PERPLEXITY_API_KEY,
  },

  // Financial Analyst - Gemini Pro (large context + cost-effective)
  // Note: Use 'gemini-pro' for wider availability, or 'gemini-1.5-pro' if available in your region
  financial: {
    provider: 'google',
    model: 'gemini-pro',
    maxTokens: 4096,
    temperature: 1.0,
    apiKey: process.env.GOOGLE_API_KEY,
  },

  // Market Research - Perplexity Sonar Pro (real-time market data and competitor intelligence with deeper retrieval)
  market_research: {
    provider: 'perplexity',
    model: 'sonar-pro', // Deep retrieval with real-time search
    maxTokens: 4096,
    temperature: 0.7,
    apiKey: process.env.PERPLEXITY_API_KEY,
  },

  // Regulatory Agent - Claude Sonnet 4 (superior reasoning for complex regulatory pathways)
  regulatory: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 1.0,
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
};

/**
 * Synthesis uses Claude Sonnet 4 for best integration quality
 */
export const SYNTHESIS_MODEL_CONFIG: LLMClientConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 1.0,
  apiKey: process.env.ANTHROPIC_API_KEY,
};

/**
 * Get all unique providers used in the configuration
 */
export function getRequiredProviders(): LLMProvider[] {
  const providers = new Set<LLMProvider>();

  Object.values(AGENT_MODEL_CONFIG).forEach(config => {
    providers.add(config.provider);
  });

  providers.add(SYNTHESIS_MODEL_CONFIG.provider);

  return Array.from(providers);
}

/**
 * Get human-readable agent name
 */
export function getAgentName(agent: AgentType): string {
  const names: Record<AgentType, string> = {
    clinical: 'Clinical Data Analyst',
    patent: 'Patent Expert',
    financial: 'Financial Analyst',
    market_research: 'Market Research Analyst',
    regulatory: 'Regulatory Specialist',
  };
  return names[agent];
}

/**
 * Get model display name
 */
export function getModelDisplayName(config: LLMClientConfig): string {
  const providerNames: Record<LLMProvider, string> = {
    anthropic: 'Claude',
    google: 'Gemini',
    perplexity: 'Perplexity',
  };

  return `${providerNames[config.provider]} ${config.model}`;
}
