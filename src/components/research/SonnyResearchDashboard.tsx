import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useDeepResearchStream } from '../../hooks/useDeepResearchStream';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { ResearchComposer } from './ResearchComposer';
import { CapabilityCards } from './CapabilityCards';
import type { ResearchTemplate } from './CapabilityCards';
import GlassBoxTrace from './GlassBoxTrace.js';
import ResearchDossier from './ResearchDossier.js';
import LatestSignals from './LatestSignals';

interface SonnyResearchDashboardProps {
  initialQuery?: string;
  onOpenFeed?: () => void;
}

// Skeleton shimmer row - respects prefers-reduced-motion via CSS class.
function SkeletonLine({ w = '100%', h = 12 }: { w?: string; h?: number }) {
  return (
    <div
      className="rounded motion-safe:animate-[shimmer_1.4s_infinite_linear] bg-[length:800px_100%]"
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(90deg,#EEF2F7 25%,#F7FAFC 37%,#EEF2F7 63%)',
        backgroundSize: '800px 100%',
      }}
      aria-hidden="true"
    />
  );
}

// Skeleton for the trace panel.
function TraceSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-busy="true" aria-label="Loading trace">
      {/* Steps skeleton */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-subtle flex-none" />
            <SkeletonLine w={`${50 + i * 10}%`} h={11} />
          </div>
        ))}
      </div>
      {/* Counters skeleton */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-subtle border border-border rounded-xl px-3 py-3 flex flex-col items-center gap-1">
            <SkeletonLine w="40px" h={17} />
            <SkeletonLine w="50px" h={9} />
          </div>
        ))}
      </div>
      {/* Log skeleton */}
      <div className="flex flex-col gap-1.5">
        <SkeletonLine w="88%" h={9} />
        <SkeletonLine w="72%" h={9} />
        <SkeletonLine w="60%" h={9} />
      </div>
    </div>
  );
}

// Skeleton for the dossier panel.
function DossierSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-busy="true" aria-label="Loading dossier">
      {/* Verdict pill skeleton */}
      <div className="flex items-center gap-3 pb-5 border-b border-border">
        <div className="h-8 w-20 rounded-full bg-subtle" />
        <SkeletonLine w="160px" h={18} />
      </div>
      {/* Executive read skeleton */}
      <div className="flex flex-col gap-2 mt-1">
        <SkeletonLine w="96%" h={13} />
        <SkeletonLine w="88%" h={13} />
        <SkeletonLine w="74%" h={13} />
        <SkeletonLine w="82%" h={13} />
      </div>
      {/* Section skeleton */}
      <div className="mt-2 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 py-3 border-t border-border first:border-0 first:pt-0">
            <div className="flex items-center gap-2">
              <div className="h-5 w-10 rounded-full bg-subtle" />
              <SkeletonLine w="120px" h={13} />
            </div>
            <SkeletonLine w="90%" h={11} />
            <SkeletonLine w="70%" h={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SonnyResearchDashboard({ initialQuery, onOpenFeed }: SonnyResearchDashboardProps) {
  const s = useDeepResearchStream();
  // Template seed keeps the displayed prompt separate from the canonical run target.
  const [seed, setSeed] = useState<ResearchTemplate>();
  const [seedRevision, setSeedRevision] = useState(0);
  const composerRef = useRef<HTMLDivElement>(null);
  const seedFromCard = (template: ResearchTemplate) => {
    setSeed({ ...template });
    setSeedRevision((revision) => revision + 1);
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
          {/* Composer */}
          <div ref={composerRef} style={{ position: 'relative', zIndex: 1, marginBottom: 40 }}>
            <ResearchComposer
              key={`${initialQuery ?? ''}:${seedRevision}`}
              onStart={(t, m) => s.start(t, m)}
              initialQuery={initialQuery}
              seed={seed}
            />
          </div>

          {/* Capability cards */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 40 }}>
            <CapabilityCards onSelectTemplate={seedFromCard} />
          </div>

          {/* Latest signals block */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <LatestSignals onOpenFeed={onOpenFeed ?? (() => {})} />
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE RUN (hydrating / running / done / error) ----
  // Determine if still spinning up (no trace events yet).
  const isHydrating = s.status === 'hydrating';

  // A hydrated (deep-linked) run has a persisted dossier but no live trace store,
  // so the glass-box panel would render empty. In that case, present the dossier
  // full-width instead of a lopsided two-column split.
  const hasLiveTrace = !!s.traceStore;

  const runCount = (s.status === 'running' || s.status === 'done' || !!s.runId) ? '1 run' : '0 runs';

  return (
    <div className="w-full min-h-full p-6 bg-page">

      {/* Error banner - inline recoverable */}
      {s.status === 'error' && s.error && (
        <div className="mb-5 flex items-start gap-3 bg-white border border-nogo/25 rounded-xl px-4 py-3.5" style={{ background: '#FEFCFC' }}>
          <span className="flex-none w-[34px] h-[34px] rounded-[9px] bg-nogo-tint text-nogo flex items-center justify-center">
            <AlertTriangle className="w-[18px] h-[18px]" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-nogo-text">Research run failed</p>
            <p className="text-[12.5px] text-textSecondary mt-0.5 leading-relaxed">{s.error}</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white border border-border text-textSecondary hover:border-[#C7D2E4] transition-colors active:scale-[.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Runs section frame */}
      <section>
        {/* Runs header row */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-semibold text-textPrimary" style={{ fontSize: 15 }}>Runs</span>
          <span className="text-xs text-textTertiary">{runCount}</span>
        </div>

        {/* Active-run layout: two columns when a live trace is streaming,
            single full-width dossier when a saved run is hydrated. */}
        <div className={hasLiveTrace ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'max-w-[860px] mx-auto'}>

          {/* Left: glass-box trace - only when a live run is streaming */}
          {hasLiveTrace && (
            <div className="bg-surface border border-border rounded-2xl p-5 min-h-[400px]" style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}>
              <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-4">
                Glass-box trace
              </p>
              {isHydrating ? (
                <TraceSkeleton />
              ) : (
                <GlassBoxTrace traceStore={s.traceStore} status={s.status} />
              )}
            </div>
          )}

          {/* Dossier */}
          <div className="bg-surface border border-border rounded-2xl p-5 min-h-[400px]" style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}>
            <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-4">
              Dossier
            </p>
            {briefing ? (
              <ResearchDossier briefing={briefing} />
            ) : (
              <DossierSkeleton />
            )}
          </div>

        </div>
      </section>
    </div>
  );
}

export default SonnyResearchDashboard;
