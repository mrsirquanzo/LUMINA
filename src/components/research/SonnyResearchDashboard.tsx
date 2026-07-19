import { useEffect, useState, useRef } from 'react';
import { useDeepResearchStream } from '../../hooks/useDeepResearchStream';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { ResearchComposer } from './ResearchComposer';
import { CapabilityCards } from './CapabilityCards';
import type { ResearchTemplate } from './CapabilityCards';
import LatestSignals from './LatestSignals';
import { DeepResearchRun } from './DeepResearchRun';
import { WorkbookRun } from './workbook/WorkbookRun';
import { getWorkbookByCapability } from '../../lib/workbook/scenarios';
import type { WorkbookRun as WorkbookRunData } from '../../lib/workbook/types';

interface SonnyResearchDashboardProps {
  initialQuery?: string;
  onOpenFeed?: () => void;
}

export function SonnyResearchDashboard({ initialQuery, onOpenFeed }: SonnyResearchDashboardProps) {
  const s = useDeepResearchStream();
  const [selectedWorkbook, setSelectedWorkbook] = useState<WorkbookRunData | null>(null);
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

  if (s.status === 'idle' && selectedWorkbook) {
    return <WorkbookRun run={selectedWorkbook} onBack={() => setSelectedWorkbook(null)} />;
  }

  // ---- HOME (idle) ----
  if (s.status === 'idle') {
    return (
      <div className="sonny-home-canvas min-h-full w-full overflow-auto">
        <div className="relative mx-auto max-w-[1120px] px-4 pb-20 pt-9 sm:px-8 sm:pt-14 lg:px-10 lg:pb-24 lg:pt-[72px]">
          {/* Composer */}
          <div ref={composerRef} className="relative z-[1] mx-auto mb-14 max-w-[920px] sm:mb-16">
            <ResearchComposer
              key={`${initialQuery ?? ''}:${seedRevision}`}
              onStart={(t, m) => s.start(t, m)}
              initialQuery={initialQuery}
              seed={seed}
            />
          </div>

          {/* Capability cards */}
          <div className="relative z-[1] mb-14 sm:mb-16">
            <CapabilityCards
              onSelectTemplate={seedFromCard}
              onSelectWorkbook={(capabilityId) => {
                const workbook = getWorkbookByCapability(capabilityId);
                if (workbook) setSelectedWorkbook(workbook);
              }}
            />
          </div>

          {/* Latest signals block */}
          <div className="relative z-[1] rounded-2xl border border-border bg-white/80 p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-7">
            <LatestSignals onOpenFeed={onOpenFeed ?? (() => {})} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DeepResearchRun
      status={s.status}
      runId={s.runId}
      traceStore={s.traceStore}
      briefing={briefing}
      error={s.error}
      onBack={s.reset}
    />
  );
}

export default SonnyResearchDashboard;
