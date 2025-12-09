/**
 * Generate Investment Memo Button Component
 *
 * Triggers institutional-grade investment memo generation from multi-agent analysis
 */

'use client';

import { useState } from 'react';
import { FiFileText, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface GenerateInvestmentMemoButtonProps {
  agentResponses: {
    clinical?: string;
    patent?: string;
    financial?: string;
    market?: string;
    regulatory?: string;
    synthesis: string;
  };
  companyName?: string;
  analysisId?: string;
  className?: string;
}

export function GenerateInvestmentMemoButton({
  agentResponses,
  companyName,
  analysisId,
  className = ''
}: GenerateInvestmentMemoButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [generationStats, setGenerationStats] = useState<{
    totalWords?: number;
    totalSections?: number;
  }>({});

  const handleGenerate = async (format: 'pdf' | 'markdown' = 'pdf') => {
    setIsGenerating(true);
    setStatus('generating');
    setErrorMessage('');

    try {
      console.log('Starting investment memo generation...');
      console.log('Company:', companyName);
      console.log('Available agents:', Object.keys(agentResponses));

      // Create AbortController with 5-minute timeout (matches server maxDuration)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      try {
        const response = await fetch('/api/deliverables/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentResponses,
            companyName,
            analysisId,
            generatedBy: 'Sonny: Multi-Agent System',
            format
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to parse error as JSON, but handle plain text errors gracefully
          let errorMessage = 'Failed to generate memo';
          try {
            const errorData = await response.json();
            errorMessage = errorData.details || errorData.error || errorMessage;
          } catch {
            // Response is not JSON, try to read as text
            try {
              const errorText = await response.text();
              errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
          }
          throw new Error(errorMessage);
        }

        // Extract metadata from headers
        const totalWords = response.headers.get('X-Total-Words');
        const totalSections = response.headers.get('X-Total-Sections');

        if (totalWords && totalSections) {
          setGenerationStats({
            totalWords: parseInt(totalWords),
            totalSections: parseInt(totalSections)
          });
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Download file
        const a = document.createElement('a');
        a.href = url;
        a.download = companyName
          ? `investment-memo-${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${format === 'pdf' ? 'pdf' : 'md'}`
          : `investment-memo-${Date.now()}.${format === 'pdf' ? 'pdf' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('success');
        console.log('Investment memo generated successfully!');

        // Reset to idle after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setIsGenerating(false);
        }, 5000);
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle specific fetch errors
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout: Memo generation took longer than 5 minutes. Please try again with a smaller analysis or contact support.');
          } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('network')) {
            throw new Error('Network error: Connection lost during memo generation. Please check your internet connection and try again.');
          }
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error generating memo:', error);
      setStatus('error');

      // Provide user-friendly error messages
      let userMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        userMessage = error.message;

        // Handle specific error types
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NETWORK_IO_SUSPENDED')) {
          userMessage = 'Network connection lost during generation. Please ensure your device stays active and try again.';
        }
      }

      setErrorMessage(userMessage);
      setIsGenerating(false);
    }
  };

  const statusConfig = {
    idle: {
      icon: FiFileText,
      text: 'Generate Investment Memo',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    generating: {
      icon: FiLoader,
      text: 'Generating Memo...',
      color: 'bg-blue-500',
      textColor: 'text-white'
    },
    success: {
      icon: FiCheckCircle,
      text: `Memo Generated! ${generationStats.totalWords ? `(${generationStats.totalWords?.toLocaleString()} words)` : ''}`,
      color: 'bg-green-600',
      textColor: 'text-white'
    },
    error: {
      icon: FiAlertCircle,
      text: 'Generation Failed',
      color: 'bg-red-600',
      textColor: 'text-white'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        {/* Main button */}
        <button
          onClick={() => handleGenerate('pdf')}
          disabled={isGenerating}
          className={`flex items-center justify-center gap-2 px-4 py-2 ${config.color} ${config.textColor} rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
          title="Generate comprehensive 15-25 page institutional-grade investment memo"
        >
          <Icon className={`w-5 h-5 ${status === 'generating' ? 'animate-spin' : ''}`} />
          {config.text}
        </button>

        {/* Format options (when idle) */}
        {status === 'idle' && !isGenerating && (
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => handleGenerate('pdf')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              PDF
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => handleGenerate('markdown')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Markdown
            </button>
          </div>
        )}

        {/* Success stats */}
        {status === 'success' && generationStats.totalSections && (
          <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
            ✓ Generated {generationStats.totalSections} sections with {generationStats.totalWords?.toLocaleString()} words
          </div>
        )}

        {/* Error message */}
        {status === 'error' && errorMessage && (
          <div className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded">
            <p className="font-semibold">Error: {errorMessage}</p>
            <p className="mt-1">Please try again or contact support if the issue persists.</p>
          </div>
        )}

        {/* Info text */}
        {status === 'idle' && (
          <p className="text-xs text-gray-600">
            Generates a professional 15-25 page investment memo with valuation analysis,
            risk assessment, and IC-ready recommendations.
          </p>
        )}

        {/* Loading indicator with details */}
        {status === 'generating' && (
          <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded space-y-1">
            <p className="font-semibold">⏳ Generating your investment memo...</p>
            <p>Processing 16 sections in parallel. This typically takes 30-60 seconds.</p>
            <p className="text-amber-700 font-medium mt-1">
              ⚠️ Please keep this tab active during generation.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1 flex-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
