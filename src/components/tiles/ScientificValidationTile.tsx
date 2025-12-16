import Tile from '../Tile';
import { FlaskConical, Star } from 'lucide-react';

interface ScientificValidationTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function ScientificValidationTile({ data, loading, onAgentClick, extendedIntelligence }: ScientificValidationTileProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-warning text-warning' : 'fill-none text-textTertiary'
        }`}
      />
    ));
  };

  return (
    <Tile
      title="Scientific Validation"
      icon={<FlaskConical className="w-5 h-5" />}
      tileType="general"
      loading={loading}
      className=""
      agents={data?.agents}
      primaryAgent={data?.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        {/* Star Ratings */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-textSecondary">Target Validation</span>
            <div className="flex items-center gap-1">{renderStars(5)}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-textSecondary">Clinical PoC (Validated)</span>
            <div className="flex items-center gap-1">{renderStars(4)}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-textSecondary">Differentiation Data (Early)</span>
            <div className="flex items-center gap-1">{renderStars(3)}</div>
          </div>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Validation Summary
          </p>
          <p className="text-base leading-relaxed text-textPrimary">
            Strong clinical validation with FDA-approved ADC demonstrating proof-of-concept. Early
            differentiation data suggests improved safety profile. Additional data needed for full
            validation of differentiation claims.
          </p>
        </div>

        <div>
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Key Evidence</p>
          <ul className="space-y-2.5">
            {[
              'FDA-approved Trodelvy validates mechanism',
              'Phase 1 data shows comparable efficacy',
              'Differentiated safety profile in early studies',
              'Multiple active programs confirm interest',
            ].map((item, idx) => (
              <li key={idx} className="text-base leading-relaxed text-textPrimary flex items-baseline gap-3">
                <span className="text-success text-lg font-bold flex-shrink-0">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <p className="text-base font-bold text-warning mb-3 flex items-center gap-2">Diligence Concerns</p>
          <ul className="space-y-2 text-base leading-relaxed text-textPrimary">
            <li className="flex items-baseline gap-2">
              <span className="text-warning font-bold flex-shrink-0">•</span>
              <span>Limited Phase 1 data (n=42)</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-warning font-bold flex-shrink-0">•</span>
              <span>Differentiation needs validation in larger studies</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="text-warning font-bold flex-shrink-0">•</span>
              <span>Competitive landscape moving fast</span>
            </li>
          </ul>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Differentiation Statement
          </p>
          <p className="text-base leading-relaxed text-textPrimary">
            Novel linker technology enables improved therapeutic index with lower GI toxicity versus
            market leader. Proprietary IP provides competitive moat through 2038.
          </p>
        </div>
      </div>
    </Tile>
  );
}
