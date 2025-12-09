import { memo } from 'react';
import Tile from '../Tile';
import { CheckCircle2, AlertTriangle, Target } from 'lucide-react';
import { format } from 'date-fns';
import type { Recommendation } from '../../types';

interface ExecutiveSummaryTileProps {
  data: {
    overallScore: number;
    recommendation: Recommendation;
    confidenceLevel: number;
    dataFreshness: string;
    summaryText: string;
    quickMetrics: {
      geneticValidation: string;
      therapeuticWindow: string;
      druggability: string;
      safetyProfile: string;
    };
    keyStrengths: string[];
    keyRisks: string[];
    weightedScoring: {
      genetic: { score: number; weight: number };
      expression: { score: number; weight: number };
      druggability: { score: number; weight: number };
      safety: { score: number; weight: number };
      clinical: { score: number; weight: number };
    };
  };
  loading?: boolean;
}

const ExecutiveSummaryTile = memo(function ExecutiveSummaryTile({ data }: ExecutiveSummaryTileProps) {

  // Format date to current date or remove if not present
  const formatDate = (dateString: string) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return undefined;
    // Use current date instead of dataFreshness date
    return `Updated ${format(new Date(), 'MMM d, yyyy')}`;
  };

  return (
    <Tile
      title="Executive Summary"
      icon={<Target className="w-5 h-5" />}
      tileType="general"
      dataFreshness={formatDate(data.dataFreshness)}
      className="min-h-[300px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary (Main Content) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Text - Main content */}
          <div>
            <p className="text-lg leading-relaxed text-textPrimary">{data.summaryText}</p>
          </div>
        </div>

        {/* Right: Strengths & Risks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Strengths */}
          <div>
            <h4 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Key Strengths
            </h4>
            <ul className="space-y-3">
              {data.keyStrengths.slice(0, 3).map((strength, idx) => (
                <li key={idx} className="text-lg leading-relaxed text-textPrimary flex items-baseline gap-2.5">
                  <span className="text-success text-xl font-bold flex-shrink-0">•</span>
                  <span className="flex-1">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Risks */}
          <div>
            <h4 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Key Risks
            </h4>
            <ul className="space-y-3">
              {data.keyRisks.slice(0, 3).map((risk, idx) => (
                <li key={idx} className="text-lg leading-relaxed text-textPrimary flex items-baseline gap-2.5">
                  <span className="text-warning text-xl font-bold flex-shrink-0">•</span>
                  <span className="flex-1">{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Tile>
  );
});

ExecutiveSummaryTile.displayName = 'ExecutiveSummaryTile';

export default ExecutiveSummaryTile;
