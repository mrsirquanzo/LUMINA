import { useEffect } from 'react';
import { useDeepResearchStream } from '../../hooks/useDeepResearchStream';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { ResearchComposer } from './ResearchComposer';
import GlassBoxTrace from './GlassBoxTrace.js';
import { AlertTriangle } from 'lucide-react';

export function SonnyResearchDashboard() {
  const s = useDeepResearchStream();

  // On mount: hydrate from URL ?runId=
  useEffect(() => {
    const runId = new URLSearchParams(window.location.search).get('runId');
    if (runId) {
      s.hydrate(runId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Select briefing for current run from persistent store
  const briefing = useBriefingStore((st) => (s.runId ? st.briefings[s.runId] : undefined));

  if (s.status === 'idle') {
    return (
      <div className="w-full min-h-full">
        <ResearchComposer
          onStart={(t, m) => s.start(t, m)}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-6">
      {/* Error banner */}
      {s.status === 'error' && s.error && (
        <div className="mb-4 flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{s.error}</span>
        </div>
      )}

      {/* Active-run two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: trace / reasoning steps */}
        <div className="bg-surfaceElevated/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-h-[400px]">
          <p className="text-xs text-textTertiary font-medium tracking-wider uppercase mb-3">Reasoning Trace</p>
          <GlassBoxTrace traceStore={s.traceStore} status={s.status} />
        </div>

        {/* Right: dossier / briefing */}
        <div className="bg-surfaceElevated/60 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-h-[400px]">
          <p className="text-xs text-textTertiary font-medium tracking-wider uppercase mb-3">Dossier</p>
          {briefing ? (
            // TODO(2.9): Replace with <ResearchDossier briefing={briefing} runId={s.runId} />
            <div className="text-textTertiary text-sm italic">dossier</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
              <p className="text-sm text-textSecondary">Researching...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SonnyResearchDashboard;
