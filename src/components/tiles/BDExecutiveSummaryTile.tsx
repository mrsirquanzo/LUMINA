import Tile from '../Tile';
import { Briefcase, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { OpportunityRating, StrategicFit } from '../../types';

interface BDExecutiveSummaryTileProps {
  data: {
    opportunityRating: OpportunityRating;
    strategicFit: StrategicFit;
    summaryText: string;
    quickMetrics: {
      developmentStage: string;
      patentLife: string;
      marketOpportunity: string;
      competitivePosition: string;
      totalDealValue?: string;
    };
    keyValueDrivers: string[];
    keyRisks: string[];
    recommendedAction: string;
  };
  loading?: boolean;
}

export default function BDExecutiveSummaryTile({ data, loading }: BDExecutiveSummaryTileProps) {
  return (
    <Tile
      title="Executive Summary"
      icon={<Briefcase className="w-5 h-5" />}
      tileType="market"
      loading={loading}
      className="min-h-[240px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary (Main Content) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Text - Main content */}
          <div>
            <p className="text-lg leading-relaxed text-textPrimary">{data.summaryText}</p>
          </div>
        </div>

        {/* Right: Value Drivers & Risks */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Value Drivers */}
          <div>
            <h4 className="text-lg font-bold text-textPrimary mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Key Value Drivers
            </h4>
            <ul className="space-y-3">
              {data.keyValueDrivers.slice(0, 3).map((driver, idx) => (
                <li key={idx} className="text-lg leading-relaxed text-textPrimary flex items-baseline gap-2.5">
                  <span className="text-success text-xl font-bold flex-shrink-0">•</span>
                  <span className="flex-1">{driver}</span>
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
}
