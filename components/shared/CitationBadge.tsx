'use client';

import React from 'react';

interface CitationBadgeProps {
  number: string;
  inline?: boolean;
}

/**
 * CitationBadge - Visual component for inline numbered citations
 * Makes citations prominent and trustworthy
 */
export function CitationBadge({ number, inline = true }: CitationBadgeProps) {
  if (inline) {
    return (
      <sup className="inline-flex items-center justify-center min-w-[18px] h-[18px] mx-0.5 px-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded-sm hover:bg-blue-200 transition-colors cursor-help">
        {number}
      </sup>
    );
  }

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors">
      {number}
    </span>
  );
}

interface SourcesReferenced SectionProps {
  sources: Array<{
    number: string;
    citation: string;
  }>;
}

/**
 * SourcesReferencedSection - Displays all sources in a prominent, organized manner
 */
export function SourcesReferencedSection({ sources }: SourcesReferencedSectionProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t-2 border-gray-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📚</span>
        <h3 className="text-lg font-bold text-gray-900">Sources Referenced</h3>
        <span className="ml-auto text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full border border-green-300">
          ✓ {sources.length} {sources.length === 1 ? 'Source' : 'Sources'} Cited
        </span>
      </div>

      <div className="space-y-2.5">
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

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-blue-900">
          <span className="flex-shrink-0 mt-0.5">ℹ️</span>
          <p>
            <strong>Verification:</strong> All citations reference specific documents, page numbers, and publication details.
            In Live mode, sources are extracted from uploaded documents and real-time data searches.
          </p>
        </div>
      </div>
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
