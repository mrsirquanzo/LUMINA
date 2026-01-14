import Tile from '../Tile';
import { CheckCircle2, XCircle } from 'lucide-react';

interface KeyExperimentsTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function KeyExperimentsTile({ data, loading, onAgentClick, extendedIntelligence }: KeyExperimentsTileProps) {
  return (
    <Tile
      title="Key Experiments"
      icon={<CheckCircle2 className="w-5 h-5" />}
      tileType="general"
      loading={loading}
      className="h-[340px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence ?? (
        <div className="flex flex-col h-full">
          {/* Evidence Gaps Section */}
          <div className="flex-1 flex flex-col min-h-0 mb-8">
            <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">
              Evidence Gaps
            </p>
            <div className="flex-1 grid grid-cols-1 gap-4">
              {data.evidenceGaps.map((gap: any, idx: number) => (
                <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-base font-semibold text-textPrimary flex-1">{gap.gap}</p>
                    <span
                      className={`text-sm px-3 py-1 rounded font-medium ml-3 ${
                        gap.priority === 'High'
                          ? 'bg-danger/20 text-danger'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {gap.priority}
                    </span>
                  </div>
                  {gap.type && (
                    <p className="text-sm text-textSecondary mt-2">Type: {gap.type}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decision thresholds (non-prescriptive) */}
          <div className="flex-1 flex flex-col min-h-0 mb-8">
            <div className="grid grid-cols-2 gap-6 h-full">
              <div className="flex flex-col">
                <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">Confidence increases if</p>
                <div className="flex-1 space-y-3">
                  {data.goNoGoCriteria.advanceIf.map((criteria: string, idx: number) => (
                    <div key={idx} className="flex items-baseline gap-3 text-base leading-relaxed text-textSecondary">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="flex-1">{criteria}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">Pause / pivot if</p>
                <div className="flex-1 space-y-3">
                  {data.goNoGoCriteria.stopIf.map((criteria: string, idx: number) => (
                    <div key={idx} className="flex items-baseline gap-3 text-base leading-relaxed text-textSecondary">
                      <XCircle className="w-5 h-5 text-danger flex-shrink-0" />
                      <span className="flex-1">{criteria}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and Resource Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
              <p className="text-base font-bold text-textSecondary mb-2 uppercase tracking-wider">Timeline to Decision</p>
              <p className="text-base font-bold text-textPrimary">{data.timelineToDecision}</p>
            </div>
            {data.resourceEstimate && (
              <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <p className="text-base font-bold text-textSecondary mb-2 uppercase tracking-wider">Resource Estimate</p>
                <p className="text-base font-bold text-textPrimary">{data.resourceEstimate}</p>
              </div>
            )}
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        <div>
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Evidence Gaps
          </p>
          <div className="space-y-2">
            {data.evidenceGaps.slice(0, 3).map((gap: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-3 border border-white/5">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-base font-semibold text-textPrimary">{gap.gap}</p>
                  <span
                    className={`text-sm px-2 py-1 rounded font-medium ${
                      gap.priority === 'High'
                        ? 'bg-danger/20 text-danger'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {gap.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Confidence increases if</p>
            <div className="space-y-2">
              {data.goNoGoCriteria.advanceIf.slice(0, 2).map((criteria: string, idx: number) => (
                <div key={idx} className="flex items-baseline gap-2 text-sm leading-relaxed text-textSecondary">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{criteria}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Pause / pivot if</p>
            <div className="space-y-2">
              {data.goNoGoCriteria.stopIf.slice(0, 2).map((criteria: string, idx: number) => (
                <div key={idx} className="flex items-baseline gap-2 text-sm leading-relaxed text-textSecondary">
                  <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span>{criteria}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-2 uppercase tracking-wider">Timeline to Decision</p>
          <p className="text-base font-bold text-textPrimary">{data.timelineToDecision}</p>
        </div>
      </div>
    </Tile>
  );
}
