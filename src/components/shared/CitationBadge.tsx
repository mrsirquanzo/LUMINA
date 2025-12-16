'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface CitationBadgeProps {
  number: string;
  inline?: boolean;
  citation?: string; // Full citation text for tooltip
}

/**
 * CitationBadge - Visual component for inline numbered citations
 * Shows full citation on hover for instant verification
 */
export function CitationBadge({ number, inline = true, citation }: CitationBadgeProps) {
  if (inline) {
    return (
      <sup className="relative group inline-block">
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] mx-0.5 px-1 text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 rounded-sm hover:bg-primary/25 transition-colors cursor-help">
          {number}
        </span>

        {/* Tooltip on hover */}
        {citation && (
          <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-surfaceElevated text-textPrimary border border-white/10 text-xs rounded-lg shadow-xl z-50 pointer-events-none">
            <span className="font-semibold text-primary">[{number}]</span> {citation}
            {/* Tooltip arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surfaceElevated"></span>
          </span>
        )}
      </sup>
    );
  }

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-primary bg-primary/15 border border-primary/30 rounded hover:bg-primary/25 transition-colors">
      {number}
    </span>
  );
}

interface SourcesReferencedSectionProps {
  sources: Array<{
    number: string;
    citation: string;
  }>;
}

/**
 * SourcesReferencedSection - Collapsible section displaying all sources
 * Saves space while keeping citations accessible with one click
 */
export function SourcesReferencedSection({ sources }: SourcesReferencedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 mb-4 hover:bg-white/5 p-2 -m-2 rounded-lg transition-colors group"
      >
        <span className="text-2xl">📚</span>
        <h3 className="text-lg font-bold text-textPrimary">Sources Referenced</h3>
        <span className="text-sm text-textSecondary bg-success/15 px-3 py-1 rounded-full border border-success/30">
          ✓ {sources.length} {sources.length === 1 ? 'Source' : 'Sources'} Cited
        </span>
        <span className="ml-auto text-textTertiary group-hover:text-textSecondary transition-colors">
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 bg-surface/40 border border-white/10 rounded-lg hover:bg-surface/60 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-primary bg-primary/15 border border-primary/30 rounded">
                    {source.number}
                  </span>
                </div>
                <div className="flex-1 text-sm text-textSecondary leading-relaxed prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 underline decoration-primary/40 hover:decoration-primary transition-colors"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      p: ({ children }) => <>{children}</>,
                    }}
                  >
                    {source.citation}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in duration-200">
            <div className="flex items-start gap-2 text-xs text-textPrimary">
              <span className="flex-shrink-0 mt-0.5">ℹ️</span>
              <p>
                <strong>Verification:</strong> All citations reference specific documents, page numbers, and publication details.
                In Live mode, sources are extracted from uploaded documents and real-time data searches.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <p className="text-sm text-textTertiary italic">
          Click to view {sources.length} source{sources.length !== 1 ? 's' : ''} with full bibliographic details
        </p>
      )}
    </div>
  );
}

/**
 * TrustIndicator - Badge showing source credibility
 */
export function TrustIndicator({ type }: { type: 'peer-reviewed' | 'sec-filing' | 'patent' | 'clinical-trial' | 'high-confidence' }) {
  const badges = {
    'peer-reviewed': {
      icon: '✓',
      label: 'Peer-reviewed',
      color: 'bg-green-100 text-green-800 border-green-300',
    },
    'sec-filing': {
      icon: '📄',
      label: 'SEC Filing',
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    'patent': {
      icon: '⚖️',
      label: 'USPTO Patent',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    },
    'clinical-trial': {
      icon: '🔬',
      label: 'Clinical Trial',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    'high-confidence': {
      icon: '✓',
      label: 'High Confidence',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  };

  const badge = badges[type];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${badge.color}`}>
      <span>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}

/**
 * DataFreshnessBadge - Shows how current the data is
 */
export function DataFreshnessBadge({ date, label }: { date: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 rounded-full">
      <span>📅</span>
      <span>{label || 'Data from'} {date}</span>
    </span>
  );
}

export default CitationBadge;
