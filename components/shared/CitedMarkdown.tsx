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
  // Parse out the Sources Referenced section
  const sourcesMatch = content.match(/## 📚 Sources Referenced\n\n([\s\S]*?)(?=\n##|$)/);
  const mainContent = sourcesMatch
    ? content.replace(/## 📚 Sources Referenced\n\n[\s\S]*?(?=\n##|$)/, '').trim()
    : content;

  // Extract sources if they exist
  const sources: Array<{ number: string; citation: string }> = [];
  const citationMap = new Map<string, string>();

  if (sourcesMatch) {
    const sourcesText = sourcesMatch[1];
    const sourceLines = sourcesText.split('\n').filter(line => line.trim().startsWith('['));

    sourceLines.forEach(line => {
      const match = line.match(/\[(\d+)\]\s+(.*)/);
      if (match) {
        const number = match[1];
        const citation = match[2];
        sources.push({ number, citation });
        citationMap.set(number, citation);
      }
    });
  }

  // Custom component to render inline citations with tooltips
  const components = {
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
        <div className="mb-4 p-2.5 bg-gray-50 border border-gray-300 rounded-lg flex items-center gap-2 text-sm">
          {isDemo ? (
            <>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded font-medium text-xs">
                DEMO MODE
              </span>
              <span className="text-gray-700">
                Showing pre-recorded analysis with illustrative sources
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded font-medium text-xs">
                ✓ LIVE ANALYSIS
              </span>
              <span className="text-gray-700">
                Sources extracted from uploaded documents and real-time data
              </span>
            </>
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
