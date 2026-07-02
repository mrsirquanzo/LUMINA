import Tile from '../Tile';
import { AlertTriangle } from 'lucide-react';

interface SafetyAssessmentTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function SafetyAssessmentTile({ data, loading, onAgentClick, extendedIntelligence }: SafetyAssessmentTileProps) {
  return (
    <Tile
      title="Safety Assessment"
      icon={<AlertTriangle className="w-5 h-5" />}
      tileType="safety"
      loading={loading}
      className="h-[340px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        <div>
          <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">
            Expression Concerns
          </p>
          <div className="space-y-3">
            {data.expressionConcerns.slice(0, 3).map((concern: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-base font-semibold text-textPrimary">{concern.organ}</p>
                  <span
                    className={`text-sm px-3 py-1 rounded font-medium flex-shrink-0 ml-3 ${
                      concern.severity === 'High'
                        ? 'bg-danger/20 text-danger'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {concern.severity}
                  </span>
                </div>
                <p className="text-sm text-textSecondary mb-1 font-medium">{concern.expression}</p>
                <p className="text-sm leading-relaxed text-textSecondary">{concern.concern}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surfaceElevated rounded-lg p-5 border border-border">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wide">Therapeutic Index</p>
          <p className="text-base font-bold text-textPrimary mb-2">{data.therapeuticIndex.estimate}</p>
          <p className="text-base leading-relaxed text-textPrimary">{data.therapeuticIndex.basis}</p>
        </div>
      </div>
    </Tile>
  );
}
