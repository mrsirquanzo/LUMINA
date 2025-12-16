import Tile from '../Tile';
import { ClipboardList } from 'lucide-react';

interface ClinicalPrecedentTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function ClinicalPrecedentTile({ data, loading, onAgentClick, extendedIntelligence }: ClinicalPrecedentTileProps) {
  return (
    <Tile
      title="Clinical Precedent"
      icon={<ClipboardList className="w-5 h-5" />}
      tileType="clinical"
      loading={loading}
      className="h-[360px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        {/* Key Findings moved to top */}
        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wide">Key Findings</p>
          <p className="text-base leading-relaxed text-textPrimary">{data.keyFindings}</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          <div className="bg-surfaceElevated rounded-lg p-5 text-center border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
            <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">Total</p>
            <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-textPrimary leading-none tracking-tight tabular-nums truncate">
              {data.programsSummary.total}
            </p>
          </div>
          <div className="bg-surfaceElevated rounded-lg p-5 text-center border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
            <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">Active</p>
            <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-success leading-none tracking-tight tabular-nums truncate">
              {data.programsSummary.active}
            </p>
          </div>
          <div className="bg-surfaceElevated rounded-lg p-5 text-center border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
            <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">Approved</p>
            <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-success leading-none tracking-tight tabular-nums truncate">
              {data.programsSummary.approved}
            </p>
          </div>
          <div className="bg-surfaceElevated rounded-lg p-5 text-center border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
            <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">Failed</p>
            <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-danger leading-none tracking-tight tabular-nums truncate">
              {data.programsSummary.failed}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {data.clinicalTrials.slice(0, 3).map((trial: any, idx: number) => (
            <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                <p className="text-base font-semibold text-textPrimary flex-1 min-w-0 break-words">{trial.title}</p>
                <span className="text-sm px-3 py-1 bg-primary/20 text-primary rounded font-medium flex-shrink-0 ml-3">
                  {trial.phase}
                </span>
              </div>
              <p className="text-sm text-textSecondary mb-2">{trial.sponsor} • {trial.indication}</p>
              {trial.results && (
                <p className="text-sm text-textSecondary font-medium">
                  ORR: {trial.results.orr} • PFS: {trial.results.pfs}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </Tile>
  );
}
