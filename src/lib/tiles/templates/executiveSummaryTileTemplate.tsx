/**
 * Executive Summary Tile Template
 * Template for rendering synthesis/executive summary data in tiles
 */

import type { TileData } from '../types';
import { AgentWalkthrough } from '../../../components/shared/AgentWalkthrough';

export function ExecutiveSummarySummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-4">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      {summary.confidence && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Confidence Level</p>
          <p className={`text-sm font-medium ${
            summary.confidence === 'HIGH' ? 'text-emerald-700' :
            summary.confidence === 'MEDIUM' ? 'text-yellow-700' :
            'text-gray-700'
          }`}>
            {summary.confidence}
          </p>
        </div>
      )}
      
      {summary.keyFindings && summary.keyFindings.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Key Findings</p>
          <ul className="space-y-1">
            {summary.keyFindings.slice(0, 3).map((finding: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span className="flex-1">{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {summary.preview && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Summary</p>
          <p className="text-sm text-gray-700 line-clamp-3">{summary.preview}</p>
        </div>
      )}
    </div>
  );
}

export function ExecutiveSummaryDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="sonny" data={data} title="Executive Synthesis Walkthrough" />
    </div>
  );
}

import type { TileTemplate } from '../types';

export const executiveSummaryTileTemplate: TileTemplate = {
  type: 'general' as any, // Use 'general' as base type for executive summary
  agent: 'synthesis' as any,
  name: 'Executive Summary',
  description: 'Strategic synthesis and decision support',
  defaultSize: 'full-width' as any,
  icon: '📋',
  color: 'purple',
  renderSummary: (data: TileData) => <ExecutiveSummarySummaryView data={data} />,
  renderDetailed: (data: TileData) => <ExecutiveSummaryDetailedView data={data} />,
};

