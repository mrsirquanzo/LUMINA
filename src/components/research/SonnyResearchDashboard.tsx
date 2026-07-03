import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDeepResearchStream } from '../../hooks/useDeepResearchStream';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { ResearchComposer } from './ResearchComposer';
import { CapabilityCards } from './CapabilityCards';
import GlassBoxTrace from './GlassBoxTrace.js';
import ResearchDossier from './ResearchDossier.js';

interface SonnyResearchDashboardProps {
  initialQuery?: string;
}

export function SonnyResearchDashboard({ initialQuery }: SonnyResearchDashboardProps) {
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

  // ---- HOME (idle) ----
  if (s.status === 'idle') {
    return (
      <div
        className="w-full min-h-full overflow-auto bg-page"
      >
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            padding: '52px 40px 64px',
            position: 'relative',
          }}
        >
          {/* Wordmark */}
          <div className="text-center mb-10" style={{ position: 'relative', zIndex: 1 }}>
            <h1
              className="font-display text-textPrimary"
              style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}
            >
              Ask Sonny
            </h1>
            <p className="text-textSecondary" style={{ fontSize: 15 }}>
              Grounded biomedical intelligence. Enter a target to start.
            </p>
          </div>

          {/* Composer */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 40 }}>
            <ResearchComposer
              onStart={(t, m) => s.start(t, m)}
              initialQuery={initialQuery}
            />
          </div>

          {/* Capability cards */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CapabilityCards />
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE RUN (hydrating / running / done / error) ----
  return (
    <div className="w-full min-h-full p-6 bg-page">
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
        <div className="bg-surface border border-border rounded-2xl p-4 min-h-[400px]">
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase mb-3">Reasoning Trace</p>
          <GlassBoxTrace traceStore={s.traceStore} status={s.status} />
        </div>

        {/* Right: dossier / briefing */}
        <div className="bg-surface border border-border rounded-2xl p-4 min-h-[400px]">
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase mb-3">Dossier</p>
          {briefing ? (
            <ResearchDossier briefing={briefing} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-border border-t-primary animate-spin" />
              <p className="text-sm text-textSecondary">Researching...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SonnyResearchDashboard;
