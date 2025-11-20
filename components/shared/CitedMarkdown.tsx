'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationBadge, SourcesReferencedSection } from './CitationBadge';

interface CitedMarkdownProps {
  content: string;
  className?: string;
  isDemo?: boolean;
}

/**
 * CitedMarkdown - Enhanced markdown renderer with automatic citation parsing
 *
 * Features:
 * - Detects numbered citations [1], [2], etc. and renders them with CitationBadge
 * - Automatically extracts "Sources Referenced" section and renders it prominently
 * - Adds demo/live indicators for transparency
 */
export function CitedMarkdown({ content, className = '', isDemo = false }: CitedMarkdownProps) {
  // Parse out the Sources Referenced / References section - support both formats
  const sourcesMatch = content.match(/## (?:📚 Sources Referenced|References)\n\n([\s\S]*?)(?=\n##|$)/);
  const mainContent = sourcesMatch
    ? content.replace(/## (?:📚 Sources Referenced|References)\n\n[\s\S]*?(?=\n##|$)/, '').trim()
    : content;

  // Extract sources if they exist
  const sources: Array<{ number: string; citation: string }> = [];
  const citationMap = new Map<string, string>();

  if (sourcesMatch) {
    const sourcesText = sourcesMatch[1];

    // Split by citation numbers and extract multi-line citations
    const citationBlocks = sourcesText.split(/(?=^\[\d+\])/gm).filter(block => block.trim());

    citationBlocks.forEach(block => {
      // Match citation number and all subsequent lines until next citation or end
      const match = block.match(/^\[(\d+)\]\s+([\s\S]*?)$/);
      if (match) {
        const number = match[1];
        // Get all lines for this citation, join them, and render markdown
        const rawCitation = match[2].trim();
        sources.push({ number, citation: rawCitation });
        citationMap.set(number, rawCitation);
      }
    });
  }

  // Custom component to render inline citations with tooltips and clickable links
  const components = {
    // Render links properly with proper styling
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    p: ({ children, ...props }: any) => {
      // Process text nodes to detect [1], [2] style citations
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          // Split by citation pattern
          const parts = child.split(/(\[\d+\])/g);
          return parts.map((part, index) => {
            const citationMatch = part.match(/\[(\d+)\]/);
            if (citationMatch) {
              const citNumber = citationMatch[1];
              const citText = citationMap.get(citNumber);
              return <CitationBadge key={`${part}-${index}`} number={citNumber} citation={citText} inline />;
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
          });
        }
        return child;
      });

      return <p {...props}>{processedChildren}</p>;
    },
    li: ({ children, ...props }: any) => {
      // Process list items similarly
      const processedChildren = React.Children.map(children, (child) => {
        if (typeof child === 'string') {
          const parts = child.split(/(\[\d+\])/g);
          return parts.map((part, index) => {
            const citationMatch = part.match(/\[(\d+)\]/);
            if (citationMatch) {
              const citNumber = citationMatch[1];
              const citText = citationMap.get(citNumber);
              return <CitationBadge key={`${part}-${index}`} number={citNumber} citation={citText} inline />;
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
          });
        }
        return child;
      });

      return <li {...props}>{processedChildren}</li>;
    },
  };

  return (
    <div className={className}>
      {/* Demo/Live indicator */}
      {isDemo !== undefined && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-2 text-sm mb-2">
            {isDemo ? (
              <>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-medium text-xs">
                  DEMO MODE
                </span>
                <span className="text-gray-700 font-medium">
                  Showing pre-recorded analysis with illustrative sources
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded font-medium text-xs">
                  ✓ LIVE ANALYSIS
                </span>
                <span className="text-gray-700 font-medium">
                  Sources extracted from uploaded documents and real-time data
                </span>
              </>
            )}
          </div>
          {isDemo && (
            <p className="text-xs text-gray-600 italic leading-relaxed">
              Note: Document names (e.g., "ADC_Patent_Landscape.pdf") are placeholders showing what you would upload in Live mode.
              Citations demonstrate the format you'll see when analyzing your actual files with page-level verification.
            </p>
          )}
        </div>
      )}

      {/* Main content with citation parsing */}
      <div className="agent-output">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {mainContent}
        </ReactMarkdown>
      </div>

      {/* Sources section */}
      {sources.length > 0 && (
        <SourcesReferencedSection sources={sources} />
      )}
    </div>
  );
}

export default CitedMarkdown;
