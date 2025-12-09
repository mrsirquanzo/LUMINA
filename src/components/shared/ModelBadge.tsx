'use client';

import React from 'react';

export interface ModelBadgeProps {
  provider: 'Anthropic' | 'Google' | 'Perplexity';
  modelName: string;
  compact?: boolean;
  className?: string;
}

/**
 * ModelBadge - Compact inline badge showing AI model provider and name
 *
 * Usage:
 * - In agent headers for quick model identification
 * - Displays provider icon and model name
 * - Color-coded by provider
 */
export function ModelBadge({ provider, modelName, compact = false, className = '' }: ModelBadgeProps) {
  const providerIcons = {
    Anthropic: '🤖',
    Google: '🔵',
    Perplexity: '🔍',
  };

  const providerColors = {
    Anthropic: 'bg-orange-100 border-orange-300 text-orange-800',
    Google: 'bg-blue-100 border-blue-300 text-blue-800',
    Perplexity: 'bg-purple-100 border-purple-300 text-purple-800',
  };

  const providerNames = {
    Anthropic: 'Claude',
    Google: 'Gemini',
    Perplexity: 'Perplexity',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full font-medium ${
        compact ? 'text-xs' : 'text-sm'
      } ${providerColors[provider]} ${className}`}
    >
      <span className={compact ? 'text-xs' : 'text-sm'}>{providerIcons[provider]}</span>
      <span>
        {compact ? (
          modelName
        ) : (
          <>
            {providerNames[provider]} <span className="font-mono">{modelName}</span>
          </>
        )}
      </span>
    </span>
  );
}

export default ModelBadge;
