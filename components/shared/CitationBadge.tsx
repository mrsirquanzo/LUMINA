'use client';

import React, { useState } from 'react';

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
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] mx-0.5 px-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded-sm hover:bg-blue-200 transition-colors cursor-help">
          {number}
        </span>

        {/* Tooltip on hover */}
        {citation && (
          <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
            <span className="font-semibold text-blue-300">[{number}]</span> {citation}
            {/* Tooltip arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></span>
          </span>
        )}
      </sup>
    );
  }

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors">
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
    <div className="mt-6 pt-6 border-t-2 border-gray-300">
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 mb-4 hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors group"
      >
        <span className="text-2xl">📚</span>
        <h3 className="text-lg font-bold text-gray-900">Sources Referenced</h3>
        <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full border border-green-300">
          ✓ {sources.length} {sources.length === 1 ? 'Source' : 'Sources'} Cited
        </span>
        <span className="ml-auto text-gray-500 group-hover:text-gray-700 transition-colors">
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
                className="flex gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded">
                    {source.number}
                  </span>
                </div>
                <div className="flex-1 text-sm text-gray-800 leading-relaxed">
                  {source.citation}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in duration-200">
            <div className="flex items-start gap-2 text-xs text-blue-900">
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
        <p className="text-sm text-gray-600 italic">
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
