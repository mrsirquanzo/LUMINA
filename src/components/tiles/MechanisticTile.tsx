import Tile from '../Tile';
import { TestTube, Sparkles } from 'lucide-react';

interface MechanisticTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function MechanisticTile({ data, loading, onAgentClick, extendedIntelligence }: MechanisticTileProps) {
  return (
    <Tile
      title="Mechanistic Rationale"
      icon={<TestTube className="w-5 h-5" />}
      tileType="general"
      loading={loading}
      className="h-[360px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        <div>
          <p className="text-base leading-relaxed text-textPrimary">{data.pathwayContext}</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-textPrimary">Sonny Insight</p>
          </div>
          <p className="text-base leading-relaxed text-textPrimary">{data.preclinicalEvidence}</p>
        </div>
        <div>
          <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">
            Key Publications
          </p>
          <div className="space-y-3">
            {data.keyPublications.map((pub: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <p className="text-base font-semibold text-textPrimary mb-2">{pub.title}</p>
                <p className="text-base text-textPrimary font-medium">{pub.authors}, {pub.journal} ({pub.year})</p>
                {pub.keyFinding && (
                  <p className="text-base text-textPrimary mt-2 italic leading-relaxed">{pub.keyFinding}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Tile>
  );
}
