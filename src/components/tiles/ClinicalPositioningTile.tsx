import Tile from '../Tile';
import { ClipboardList, Calendar } from 'lucide-react';

interface ClinicalPositioningTileProps {
  data: any;
  loading?: boolean;
}

export default function ClinicalPositioningTile({ data, loading }: ClinicalPositioningTileProps) {
  const stages = ['Preclinical', 'Phase 1', 'Phase 2', 'Phase 3', 'Approved'];
  const currentIndex = stages.indexOf('Phase 2');

  return (
    <Tile
      title="Clinical Positioning"
      icon={<ClipboardList className="w-5 h-5" />}
      tileType="clinical"
      loading={loading}
      className="h-[300px]"
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        {/* Development Stage Progress Bar */}
        <div>
          <p className="text-sm font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Development Stage
          </p>
          <div className="relative">
            <div className="h-2 bg-surfaceElevated rounded-full">
              <div
                className="h-2 bg-warning rounded-full transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-3">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full mb-2 ${
                      idx <= currentIndex ? 'bg-warning' : 'bg-textSecondary/30'
                    }`}
                  />
                  <span className="text-base text-textPrimary text-center max-w-[80px] font-semibold">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Program Status
          </p>
          <p className="text-base leading-relaxed text-textPrimary">
            {data.programsSummary.active} active programs across multiple indications. Phase 1/2 data
            demonstrates promising safety profile with differentiated tolerability. Pivotal trial
            planning underway for lead indication.
          </p>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Clinical Data</p>
          <p className="text-base leading-relaxed text-textPrimary">
            Early efficacy signals comparable to approved agents. Safety profile suggests improved
            therapeutic index. Key differentiator appears to be reduced GI toxicity.
          </p>
        </div>

        {/* Active Trials */}
        <div>
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Active Trials</p>
          <div className="space-y-3">
            {data.clinicalTrials
              .filter((t: any) => t.status === 'Active' || t.status === 'Recruiting')
              .slice(0, 2)
              .map((trial: any, idx: number) => (
                <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-textPrimary">{trial.nctId}</p>
                    <p className="text-base text-textPrimary mt-1 font-medium">{trial.phase}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-textPrimary font-semibold">{trial.status}</p>
                    {trial.expectedReadout && (
                      <p className="text-base text-textPrimary mt-1 font-medium">{trial.expectedReadout}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Next Inflection Point */}
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-warning" />
            <p className="text-base font-bold text-warning">Next Inflection Point</p>
          </div>
          <p className="text-base font-bold text-textPrimary mb-2">Phase 2 Data Readout</p>
          <p className="text-base text-textPrimary leading-relaxed font-medium">Q2 2024 • Key milestone for go/no-go decision</p>
        </div>
      </div>
    </Tile>
  );
}
