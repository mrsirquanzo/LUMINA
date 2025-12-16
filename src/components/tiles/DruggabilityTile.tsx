import { useState } from 'react';
import Tile from '../Tile';
import { FlaskConical } from 'lucide-react';

interface DruggabilityTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function DruggabilityTile({ data, loading, onAgentClick, extendedIntelligence }: DruggabilityTileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'compounds' | 'modalities'>(
    'overview'
  );

  return (
    <Tile
      title="Druggability"
      icon={<FlaskConical className="w-5 h-5" />}
      tileType="general"
      loading={loading}
      className="h-[380px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex gap-2 mb-4 border-b border-white/5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
        {(['overview', 'structure', 'compounds', 'modalities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-base font-semibold transition-colors capitalize whitespace-nowrap flex-shrink-0 ${
              activeTab === tab
                ? 'text-textPrimary border-b-2 border-primary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden pr-2 pb-2">
        {activeTab === 'overview' && (
          <div className="space-y-5 pb-4 px-1">
            <p className="text-base leading-relaxed text-textPrimary">{data.tractabilityAssessment}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">PDB Count</p>
                <p className="text-2xl font-bold text-textPrimary leading-tight">{data.structuralData.pdbCount}</p>
              </div>
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">AlphaFold</p>
                <p className="text-2xl font-bold text-textPrimary leading-tight">
                  {data.structuralData.alphafoldConfidence}%
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'compounds' && (
          <div className="space-y-3 pb-4 px-1">
            {data.existingCompounds.map((compound: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <p className="text-base font-semibold text-textPrimary mb-2">{compound.name}</p>
                <p className="text-base text-textPrimary font-medium mb-1">{compound.phase}</p>
                {compound.mechanism && (
                  <p className="text-base text-textPrimary">{compound.mechanism}</p>
                )}
                {compound.activity && (
                  <p className="text-base text-textPrimary font-medium mt-1">Activity: {compound.activity}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'modalities' && (
          <div className="space-y-3 pb-4 px-1">
            {data.modalityRecommendations.map((mod: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-semibold text-textPrimary">{mod.modality}</p>
                  <span className={`text-sm px-3 py-1 rounded font-medium ${
                    mod.feasibility === 'High' ? 'bg-success/20 text-success' :
                    mod.feasibility === 'Medium' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                    {mod.feasibility}
                  </span>
                </div>
                <p className="text-base leading-relaxed text-textPrimary">{mod.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}
