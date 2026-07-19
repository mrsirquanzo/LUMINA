'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationBadge, SourcesReferencedSection } from './CitationBadge';

interface CitedMarkdownProps {
  content: string;
  className?: string;
  /**
   * When explicitly provided, renders a Demo/Live indicator banner.
   * - true: DEMO banner
   * - false: LIVE banner
   * - undefined: no banner
   */
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
export function CitedMarkdown({ content, className = '', isDemo }: CitedMarkdownProps) {
  // Parse out the Sources Referenced / References section - support both formats
  // Match with flexible newline handling (1 or 2 newlines after heading)
  const sourcesMatch = content.match(/## (?:📚 Sources Referenced|References)\n+([\s\S]*?)(?=\n##|$)/);
  const mainContent = sourcesMatch
    ? content.replace(/## (?:📚 Sources Referenced|References)\n+[\s\S]*?(?=\n##|$)/, '').trim()
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
        className="text-blue-300 hover:text-blue-200 underline decoration-blue-400/40 hover:decoration-blue-300 transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    table: ({ children, ...props }: any) => (
      <div className="w-full overflow-x-auto rounded-lg border border-border bg-subtle">
        <table className="min-w-full border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-surface/60" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-textPrimary uppercase border-b border-border align-top whitespace-nowrap" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-3 text-left text-sm text-textSecondary border-b border-border align-top break-words" {...props}>
        {children}
      </td>
    ),
    code: ({ inline, children, ...props }: any) => (
      inline ? (
        <code className="px-1 py-0.5 rounded bg-subtle border border-border text-textPrimary text-xs" {...props}>
          {children}
        </code>
      ) : (
        <code className="text-textPrimary text-xs" {...props}>
          {children}
        </code>
      )
    ),
    pre: ({ children, ...props }: any) => (
      <pre className="p-4 rounded-lg bg-subtle border border-border overflow-x-auto text-xs text-textPrimary" {...props}>
        {children}
      </pre>
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

      return <p className="text-textSecondary mb-3 leading-relaxed" {...props}>{processedChildren}</p>;
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

      return <li className="text-textSecondary mb-2" {...props}>{processedChildren}</li>;
    },
    h1: ({ children, ...props }: any) => <h1 className="text-textPrimary text-2xl font-bold mb-4 mt-6" {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="text-textPrimary text-xl font-bold mb-3 mt-5" {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="text-textPrimary text-lg font-semibold mb-2 mt-4" {...props}>{children}</h3>,
    strong: ({ children, ...props }: any) => <strong className="text-textPrimary font-semibold" {...props}>{children}</strong>,
    em: ({ children, ...props }: any) => <em className="text-textSecondary" {...props}>{children}</em>,
  };

  return (
    <div className={`min-w-0 overflow-x-hidden ${className}`}>
      {/* Main content with citation parsing */}
      <div
        className="agent-output relative max-w-none break-words overflow-x-hidden rounded-lg border border-border p-4 bg-subtle"
      >
        <div className="relative">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {mainContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Sources section */}
      {sources.length > 0 && (
        <SourcesReferencedSection sources={sources} />
      )}
    </div>
  );
}

export default CitedMarkdown;
