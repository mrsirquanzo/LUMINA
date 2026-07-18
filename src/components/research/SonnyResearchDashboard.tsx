import { useEffect, useState, useRef } from 'react';
import { useDeepResearchStream } from '../../hooks/useDeepResearchStream';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { ResearchComposer } from './ResearchComposer';
import { CapabilityCards } from './CapabilityCards';
import type { ResearchTemplate } from './CapabilityCards';
import LatestSignals from './LatestSignals';
import { DeepResearchRun } from './DeepResearchRun';
import { WorkbookRun } from './workbook/WorkbookRun';
import comboScenarioData from '../../lib/workbook/comboScenario.json';
import flowScenarioData from '../../lib/workbook/flowScenario.json';
import westernScenarioData from '../../lib/workbook/westernScenario.json';
import type { WorkbookRun as WorkbookRunData } from '../../lib/workbook/types';

const FLOW_SCENARIO = flowScenarioData as WorkbookRunData;
const COMBO_SCENARIO = comboScenarioData as WorkbookRunData;
const WESTERN_SCENARIO = westernScenarioData as WorkbookRunData;
const WORKBOOKS: Record<string, WorkbookRunData> = {
  [COMBO_SCENARIO.capability]: COMBO_SCENARIO,
  [FLOW_SCENARIO.capability]: FLOW_SCENARIO,
  [WESTERN_SCENARIO.capability]: WESTERN_SCENARIO,
};

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
      <div
        className="w-full min-h-full overflow-auto bg-page"
      >
        <div
          style={{
            maxWidth: 840,
            margin: '0 auto',
            padding: '60px 40px 72px',
            position: 'relative',
          }}
        >
          {/* Composer */}
          <div ref={composerRef} style={{ position: 'relative', zIndex: 1, marginBottom: 44 }}>
            <ResearchComposer
              key={`${initialQuery ?? ''}:${seedRevision}`}
              onStart={(t, m) => s.start(t, m)}
              initialQuery={initialQuery}
              seed={seed}
            />
          </div>

          {/* Capability cards */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 44 }}>
            <CapabilityCards
              onSelectTemplate={seedFromCard}
              onSelectWorkbook={(capabilityId) => {
                const workbook = WORKBOOKS[capabilityId];
                if (workbook) setSelectedWorkbook(workbook);
              }}
            />
          </div>

          {/* Latest signals block */}
          <div style={{ position: 'relative', zIndex: 1 }}>
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
