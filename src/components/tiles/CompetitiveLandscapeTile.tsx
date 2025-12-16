import { useState } from 'react';
import Tile from '../Tile';
import { Users, AlertTriangle, Target } from 'lucide-react';
import type { CompetitiveIntensity } from '../../types';

interface CompetitiveLandscapeTileProps {
  data: {
    competitiveIntensity: CompetitiveIntensity;
    competitors: Array<{
      company: string;
      asset: string;
      modality: string;
      stage: string;
      indication: string;
      differentiation: string;
      expectedMilestone?: string;
      milestoneDate?: string;
    }>;
    differentiationAnalysis: string;
    competitiveRisks: string[];
    whiteSpaceOpportunities: Array<{
      opportunity: string;
      rationale: string;
    }>;
    agents?: readonly ('sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research')[];
    primaryAgent?: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research';
  };
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function CompetitiveLandscapeTile({ data, loading, onAgentClick, extendedIntelligence }: CompetitiveLandscapeTileProps) {
  const [showTable] = useState(true);

  const getIntensityColor = (intensity: CompetitiveIntensity) => {
    switch (intensity) {
      case 'Crowded':
        return 'bg-danger/20 text-danger border-danger/50';
      case 'Active':
        return 'bg-warning/20 text-warning border-warning/50';
      case 'Emerging':
        return 'bg-info/20 text-info border-info/50';
      case 'White Space':
        return 'bg-success/20 text-success border-success/50';
    }
  };

  return (
    <Tile
      title="Competitive Landscape"
      icon={<Users className="w-5 h-5" />}
      tileType="market"
      loading={loading}
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      className="h-[280px]"
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        <div
          className={`inline-block px-4 py-2 rounded-lg border-2 text-sm font-bold ${getIntensityColor(
            data.competitiveIntensity
          )}`}
        >
          {data.competitiveIntensity}
        </div>

        {showTable && (
          <div className="bg-surfaceElevated rounded-lg overflow-hidden border border-white/5">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-base">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Company</th>
                    <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Asset</th>
                    <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Stage</th>
                    <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitors.slice(0, 4).map((competitor, idx) => (
                    <tr
                      key={idx}
                      className={`border-t border-white/5 ${
                        competitor.stage === 'Approved' || competitor.stage === 'Phase 3'
                          ? 'bg-warning/5'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-textPrimary font-medium align-middle text-base">{competitor.company}</td>
                      <td className="px-4 py-3 text-textPrimary font-semibold align-middle text-base">{competitor.asset}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex items-center justify-center min-w-[100px] text-sm px-3 py-1.5 bg-primary/20 text-primary rounded-full font-semibold whitespace-nowrap">
                          {competitor.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-textPrimary text-base font-medium align-middle">
                        {competitor.expectedMilestone ? (
                          <>
                            {competitor.expectedMilestone}
                            {competitor.milestoneDate && (
                              <span className="ml-2 text-textSecondary">({competitor.milestoneDate})</span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-base leading-relaxed text-textPrimary">{data.differentiationAnalysis}</p>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <p className="text-base font-bold text-warning mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Competitive Risks
          </p>
          <ul className="space-y-2 text-base leading-relaxed text-textPrimary">
            {data.competitiveRisks.slice(0, 3).map((risk, idx) => (
              <li key={idx} className="flex items-baseline gap-2">
                <span className="text-warning font-bold flex-shrink-0">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {data.whiteSpaceOpportunities.length > 0 && (
          <div>
            <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-5 h-5" />
              White Space Opportunities
            </p>
            <div className="space-y-3">
              {data.whiteSpaceOpportunities.slice(0, 2).map((opp, idx) => (
                <div key={idx} className="bg-success/10 border border-success/30 rounded-lg p-4">
                  <p className="text-base font-bold text-textPrimary mb-2">{opp.opportunity}</p>
                  <p className="text-base leading-relaxed text-textPrimary">{opp.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Tile>
  );
}
