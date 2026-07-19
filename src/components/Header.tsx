import { useEffect, useState } from 'react';
import { Radio, RotateCcw } from 'lucide-react';
import { getStoredAgentMode, onAgentModeUpdated, requestAgentMode, type AgentMode } from '../lib/agentMode';

export default function Header() {
  const [agentMode, setAgentMode] = useState<AgentMode>(() => getStoredAgentMode());

  // Keep header toggle synced with Sonny panel mode
  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  const handleResetDemo = () => {
    if (!window.confirm('Reset demo state?\n\nThis will clear generated tiles and reset analysis panels so you can rerun the investor flow cleanly.')) {
      return;
    }
    window.dispatchEvent(new CustomEvent('reset-demo'));
  };

  return (
    <header className="sticky top-0 z-50 h-20 glass border-b border-border">
      <div className="h-full px-6 flex items-center justify-end">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Demo/Live Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
            <button
              type="button"
              onClick={() => requestAgentMode('demo')}
              className={`tactile px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                agentMode === 'demo' ? 'bg-surfaceElevated text-textPrimary' : 'text-textSecondary hover:text-textPrimary'
              }`}
              aria-label="Use demo mode (no API calls)"
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => {
                requestAgentMode('live');
              }}
              className={`tactile px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                agentMode === 'live'
                  ? 'bg-success/20 text-success'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
              aria-label="Use live mode (real agent APIs)"
            >
              <Radio className="w-3.5 h-3.5" />
              Live
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

          {agentMode === 'demo' && (
            <button
              onClick={handleResetDemo}
              className="tactile flex items-center gap-2 px-3 py-2 bg-surfaceElevated/50 text-textPrimary border border-border rounded-lg hover:bg-surfaceElevated/70 hover:border-slate-300 transition-colors font-medium text-sm"
              title="Reset demo (clear analysis state)"
            >
              <RotateCcw className="w-4 h-4 text-textSecondary" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
