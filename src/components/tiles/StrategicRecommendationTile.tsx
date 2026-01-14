import { useState } from 'react';
import Tile from '../Tile';
import {
  CheckCircle2,
  FileText,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StrategicRecommendationTileProps {
  data: {
    strategicRationale: string;
    keyDiligenceQuestions: string[];
    proposedNextSteps: Array<{
      action: string;
      owner: string;
      timeline: string;
      priority?: string;
    }>;
    dealConsiderations: string[];
    riskMitigation: string[];
    walkAwayCriteria: string[];
    agents?: readonly ('sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research')[];
    primaryAgent?: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research';
  };
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function StrategicRecommendationTile({
  data,
  loading,
  onAgentClick,
  extendedIntelligence,
}: StrategicRecommendationTileProps) {
  const [showWalkAway, setShowWalkAway] = useState(false);

  return (
    <Tile
      title="Decision Support"
      icon={<CheckCircle2 className="w-5 h-5" />}
      tileType="deal"
      loading={loading}
      className=""
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">

        <p className="text-base leading-relaxed text-textSecondary mb-6">
          {data.strategicRationale}
        </p>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Key Diligence Questions */}
          <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
            <p className="text-sm font-semibold text-textTertiary mb-4 uppercase tracking-wider">
              Key Diligence Questions
            </p>
            <ol className="space-y-3">
              {data.keyDiligenceQuestions.slice(0, 5).map((question, idx) => (
                <li key={idx} className="text-base leading-relaxed text-textSecondary flex items-baseline gap-3">
                  <span className="text-warning font-bold flex-shrink-0">{idx + 1}.</span>
                  <span className="flex-1">{question}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Column 2: Proposed Next Steps */}
          <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
            <p className="text-sm font-semibold text-textTertiary mb-4 uppercase tracking-wider">
              Proposed Next Steps
            </p>
            <div className="space-y-3">
              {data.proposedNextSteps.slice(0, 4).map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-warning w-4 h-4 flex-shrink-0"
                    id={`step-${idx}`}
                  />
                  <label htmlFor={`step-${idx}`} className="flex-1">
                    <p className="text-base text-textPrimary font-semibold">{step.action}</p>
                    <p className="text-sm text-textTertiary mt-1">
                      {step.owner} • {step.timeline}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Deal Considerations */}
          <div className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
            <p className="text-sm font-semibold text-textTertiary mb-4 uppercase tracking-wider">
              Deal Considerations
            </p>
            <ul className="space-y-2.5">
              {data.dealConsiderations.slice(0, 3).map((consideration, idx) => (
                <li key={idx} className="text-base leading-relaxed text-textSecondary flex items-baseline gap-3">
                  <span className="text-warning text-lg font-bold flex-shrink-0">•</span>
                  <span className="flex-1">{consideration}</span>
                </li>
              ))}
            </ul>

            {/* Walk-Away Criteria (Collapsible) */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowWalkAway(!showWalkAway)}
                className="flex items-center justify-between w-full text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
              >
                <span>Disconfirming evidence (stop / park conditions)</span>
                {showWalkAway ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showWalkAway && (
                <ul className="mt-3 space-y-2">
                  {data.walkAwayCriteria.slice(0, 3).map((criteria, idx) => (
                    <li key={idx} className="text-base leading-relaxed text-danger flex items-baseline gap-3">
                      <span className="font-bold flex-shrink-0">×</span>
                      <span className="flex-1">{criteria}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - More compact */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="px-4 py-2 bg-warning text-black rounded-lg hover:bg-warning/90 transition-colors font-semibold text-sm text-center">
            Request Data Room
          </button>
          <button className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-sm font-medium text-textPrimary text-center flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-sm font-medium text-textPrimary text-center flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Memo
          </button>
          <button
            className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary"
            aria-label="Export to PowerPoint"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Tile>
  );
}
