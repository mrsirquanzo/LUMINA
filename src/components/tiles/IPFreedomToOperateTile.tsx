import { useState } from 'react';
import Tile from '../Tile';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { IPPosition } from '../../types';
import { formatPatentNumber } from '../../lib/formatUtils';

interface IPFreedomToOperateTileProps {
  data: {
    ipPosition: IPPosition;
    patentSummary: string;
    keyPatents: Array<{
      patentNumber: string;
      title: string;
      owner: string;
      type: string;
      filingDate: string;
      expiryDate: string;
      relevance: string;
      claims: string[];
    }>;
    ftoAssessment: string;
    ipRisks: string[];
    ipOpportunities: string[];
    litigationHistory: string;
    agents?: readonly ('sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research')[];
    primaryAgent?: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research';
  };
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function IPFreedomToOperateTile({ data, loading, onAgentClick, extendedIntelligence }: IPFreedomToOperateTileProps) {
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);

  const getIPColor = (position: IPPosition) => {
    switch (position) {
      case 'Strong':
        return 'bg-success/20 text-success border-success/50';
      case 'Moderate':
        return 'bg-warning/20 text-warning border-warning/50';
      case 'Weak':
        return 'bg-danger/20 text-danger border-danger/50';
      case 'Contested':
        return 'bg-danger/20 text-danger border-danger/50';
    }
  };

  const calculateYearsRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const years = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, Math.round(years));
  };

  const maxYears = 20; // Assuming max patent life
  const yearsRemaining = calculateYearsRemaining(data.keyPatents[0]?.expiryDate || '2038-01-01');

  return (
    <Tile
      title="IP & Freedom to Operate"
      icon={<FileText className="w-5 h-5" />}
      tileType="ip"
      loading={loading}
      className="h-[300px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        <div
          className={`inline-block px-4 py-2 rounded-lg border-2 text-sm font-bold ${getIPColor(
            data.ipPosition
          )}`}
        >
          {data.ipPosition}
        </div>

        <p className="text-base leading-relaxed text-textSecondary">{data.patentSummary}</p>

        {/* Patent Life Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-textTertiary">Patent Life Remaining</p>
            <p className="text-base font-bold text-textPrimary">{yearsRemaining} years</p>
          </div>
          <div className="h-3 bg-surfaceElevated rounded-full">
            <div
              className="h-3 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(yearsRemaining / maxYears) * 100}%` }}
            />
          </div>
        </div>

        {/* Key Patents */}
        <div>
          <p className="text-sm font-semibold text-textTertiary mb-4 uppercase tracking-wider">Key Patents</p>
          <div className="space-y-3">
            {data.keyPatents.slice(0, 2).map((patent, idx) => (
              <div
                key={idx}
                className="bg-surfaceElevated rounded-lg p-4 border border-white/5 cursor-pointer hover:bg-surface transition-colors"
                onClick={() =>
                  setExpandedPatent(expandedPatent === patent.patentNumber ? null : patent.patentNumber)
                }
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-textPrimary font-mono">{formatPatentNumber(patent.patentNumber)}</p>
                    <p className="text-sm text-textSecondary mt-1 leading-relaxed">{patent.title}</p>
                  </div>
                  <span
                    className={`text-sm px-3 py-1 rounded font-medium flex-shrink-0 ml-3 ${
                      patent.relevance === 'High'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-textTertiary/20 text-textTertiary'
                    }`}
                  >
                    {patent.relevance}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-textTertiary mt-2">
                  <span className="font-medium">{patent.owner}</span>
                  <span>Expires: {new Date(patent.expiryDate).getFullYear()}</span>
                </div>
                {expandedPatent === patent.patentNumber && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-textTertiary mb-2">Claims:</p>
                    <ul className="space-y-2">
                      {patent.claims.slice(0, 2).map((claim, claimIdx) => (
                        <li key={claimIdx} className="text-sm leading-relaxed text-textSecondary flex items-baseline gap-2">
                          <span className="text-primary font-bold flex-shrink-0">•</span>
                          <span>{claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-sm font-semibold text-textTertiary mb-3 uppercase tracking-wider">FTO Assessment</p>
          <p className="text-base leading-relaxed text-textSecondary">{data.ftoAssessment}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm font-bold text-warning mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              IP Risks
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-textSecondary">
              {data.ipRisks.slice(0, 2).map((risk, idx) => (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="text-warning font-bold flex-shrink-0">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-success/10 border border-success/30 rounded-lg p-4">
            <p className="text-sm font-bold text-success mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              IP Opportunities
            </p>
            <ul className="space-y-2 text-sm leading-relaxed text-textSecondary">
              {data.ipOpportunities.slice(0, 2).map((opp, idx) => (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="text-success font-bold flex-shrink-0">•</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Tile>
  );
}
