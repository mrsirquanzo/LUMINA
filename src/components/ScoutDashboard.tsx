import BDExecutiveSummaryTile from './tiles/BDExecutiveSummaryTile';
import ScientificValidationTile from './tiles/ScientificValidationTile';
import CompetitiveLandscapeTile from './tiles/CompetitiveLandscapeTile';
import ClinicalPositioningTile from './tiles/ClinicalPositioningTile';
import IPFreedomToOperateTile from './tiles/IPFreedomToOperateTile';
import MarketOpportunityTile from './tiles/MarketOpportunityTile';
import DealLandscapeTile from './tiles/DealLandscapeTile';
import StrategicRecommendationTile from './tiles/StrategicRecommendationTile';
import DynamicTile from './DynamicTile';
import EmptyStateDashboard from './EmptyStateDashboard';
import InitializingState from './InitializingState';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalystWalkthrough } from './shared/AnalystWalkthrough';

// Baseline tile animation order - Executive Summary is LAST (appears after synthesis)
// Thresholds are based on step progress: 8 tiles = ~12.5% per tile
const BD_BASELINE_TILE_ORDER = [
  { id: 'scientific', threshold: 12 },      // Step 1: ~12.5%
  { id: 'competitive', threshold: 24 },     // Step 2: ~25%
  { id: 'clinical', threshold: 36 },        // Step 3: ~37.5%
  { id: 'ip', threshold: 48 },              // Step 4: ~50%
  { id: 'market', threshold: 60 },          // Step 5: ~62.5%
  { id: 'deal', threshold: 72 },            // Step 6: ~75%
  { id: 'strategic', threshold: 84 },       // Step 7: ~87.5%
  { id: 'executive', threshold: 96 },       // Step 8: Executive Summary appears LAST
] as const;

type BaselineTileId = (typeof BD_BASELINE_TILE_ORDER)[number]['id'];

const tileVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import type { AgentType } from '../lib/multiAgentTypes';
import { getStoredAgentMode, onAgentModeUpdated } from '../lib/agentMode';
import { stripMarkdown } from '../utils/scoring';
import {
  BD_EXECUTIVE_SUMMARY,
  COMPETITIVE_LANDSCAPE_DATA,
  IP_FTO_DATA,
  MARKET_OPPORTUNITY_DATA,
  DEAL_LANDSCAPE_DATA,
  STRATEGIC_RECOMMENDATION_DATA,
  CLINICAL_PRECEDENT_DATA,
  HER2_BD_EXECUTIVE_SUMMARY,
  HER2_COMPETITIVE_LANDSCAPE_DATA,
  HER2_IP_FTO_DATA,
  HER2_MARKET_OPPORTUNITY_DATA,
  HER2_DEAL_LANDSCAPE_DATA,
  HER2_STRATEGIC_RECOMMENDATION_DATA,
  HER2_CLINICAL_PRECEDENT_DATA,
} from '../constants';

interface ScoutDashboardProps {
  viewMode?: 'grid' | 'list';
}

export default function ScoutDashboard({ viewMode = 'grid' }: ScoutDashboardProps) {
  const [loading] = useState(false);
  const [orchestrationProgress, setOrchestrationProgress] = useState<number | null>(null);
  const [agentMode, setAgentMode] = useState(() => getStoredAgentMode());
  const tiles = useTileStore((state) => state.tiles);
  const activeWorkspace = useTileStore((state) => state.activeWorkspace);
  const allWorkspaces = useWorkspaceStore((state) => state.workspaces);

  // Handler for agent badge clicks - opens agent panel with tile context
  const handleAgentClick = useCallback((agent: AgentType | 'sonny', tileTitle: string, tileData?: any) => {
    // Extract target from active workspace
    const activeWorkspace = useWorkspaceStore.getState().activeWorkspaceId;
    const allWorkspaces = useWorkspaceStore.getState().workspaces;
    const workspace = allWorkspaces.find((ws) => String(ws.id) === String(activeWorkspace));
    const target = workspace?.target || 'this target';

    // Dispatch event to open agent panel
    window.dispatchEvent(new CustomEvent('open-agent-panel', {
      detail: {
        agent,
        tileId: `baseline-${tileTitle.toLowerCase().replace(/\s+/g, '-')}`,
        context: {
          target,
          data: tileData,
          tileTitle,
        },
      },
    }));
  }, []);
  
  // Listen for orchestration progress updates
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent<number>) => {
      setOrchestrationProgress(event.detail);
    };
    
    window.addEventListener('orchestration-progress', handleProgressUpdate as EventListener);
    return () => window.removeEventListener('orchestration-progress', handleProgressUpdate as EventListener);
  }, []);
  
  // Listen for orchestration start/end
  useEffect(() => {
    const handleStart = () => setOrchestrationProgress(0);
    const handleEnd = () => {
      setTimeout(() => setOrchestrationProgress(null), 1000);
    };
    
    window.addEventListener('orchestration-start', handleStart);
    window.addEventListener('orchestration-end', handleEnd);
    return () => {
      window.removeEventListener('orchestration-start', handleStart);
      window.removeEventListener('orchestration-end', handleEnd);
    };
  }, []);

  // React to demo/live mode changes (stored in localStorage + emitted as an event)
  useEffect(() => {
    setAgentMode(getStoredAgentMode());
    return onAgentModeUpdated((mode) => setAgentMode(mode));
  }, []);
  
  // Show baseline tiles only for TROP2 workspace (not when no workspace is active - show empty state instead)
  // Memoize to prevent infinite loops
  const activeBaselineTarget = useMemo(() => {
    if (!activeWorkspace) return null;
    const ws = allWorkspaces.find((w) => String(w.id) === String(activeWorkspace));
    return ws?.target ? String(ws.target).toUpperCase() : null;
  }, [activeWorkspace, allWorkspaces]);

  const showBaselineTiles = useMemo(() => {
    // Demo mode: always use baseline-style tiles + reveal animation for any selected workspace.
    // Live mode: allow generated tiles to render normally.
    if (!activeWorkspace) return false;
    return agentMode === 'demo';
  }, [activeWorkspace, agentMode]);

  const revealTimerRef = useRef<number | null>(null);
  const lastAnimatedWorkspaceIdRef = useRef<string | null>(null);

  // Memoize visible tiles to prevent infinite loops
  // If no active workspace, return empty array to show empty state (not all tiles)
  // When baseline tiles are showing, filter out generated tiles to avoid duplication
  const visibleTiles = useMemo(() => {
    if (!activeWorkspace) return []; // Return empty array when no workspace to show empty state
    const workspaceTiles = tiles.filter((tile) => tile.workspaceIds.includes(activeWorkspace));
    // If we're showing baseline tiles, don't show generated tiles (avoid duplicate/ugly markdown)
    if (showBaselineTiles) {
      return workspaceTiles.filter(tile => tile.isPinned); // Only show pinned custom tiles
    }
    return workspaceTiles;
  }, [tiles, activeWorkspace, showBaselineTiles]);

  // Local reveal animation state - triggers when a workspace is selected in demo mode.
  // NOTE: We intentionally decouple baseline reveal from orchestrationProgress because orchestration
  // can jump forward quickly and cause multiple tiles to mount at once (no visible staggering).
  const [revealProgress, setRevealProgress] = useState(0);

  // Trigger staggered reveal animation when baseline workspace is selected
  useEffect(() => {
    if (!showBaselineTiles || !activeWorkspace) return;
    if (lastAnimatedWorkspaceIdRef.current === activeWorkspace) return;

    // Clear any previous timer
    if (revealTimerRef.current) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    lastAnimatedWorkspaceIdRef.current = activeWorkspace;

    // Show the first tile immediately to avoid a “blank delay” feeling.
    setRevealProgress(BD_BASELINE_TILE_ORDER[0]?.threshold ?? 0);

    const steps = BD_BASELINE_TILE_ORDER.length;
    const stepDuration = 650; // ms per tile (slower, more "real-time analysis" feel)
    let currentStep = 1; // Step 1 already revealed above

    revealTimerRef.current = window.setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setRevealProgress(progress);

      if (currentStep >= steps) {
        if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
        setRevealProgress(100);
      }
    }, stepDuration);

    return () => {
      if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
      // React 18 StrictMode runs effects twice in dev (mount → cleanup → mount).
      // Reset this guard in cleanup so the second mount can start the timer again.
      if (lastAnimatedWorkspaceIdRef.current === activeWorkspace) {
        lastAnimatedWorkspaceIdRef.current = null;
      }
    };
  }, [showBaselineTiles, activeWorkspace]);

  // Track which baseline tiles should be visible based on orchestration OR local reveal progress
  const visibleBaselineTileIds = useMemo(() => {
    // Always use local reveal progress for baseline staggering.
    const progress = revealProgress;
    
    // Progressive reveal based on progress
    return BD_BASELINE_TILE_ORDER
      .filter(t => progress >= t.threshold)
      .map(t => t.id);
  }, [revealProgress]);

  // Helper to check if a baseline tile should be visible
  const isTileVisible = useCallback((tileId: BaselineTileId) => {
    return visibleBaselineTileIds.includes(tileId);
  }, [visibleBaselineTileIds]);

  const baseline = useMemo(() => {
    if (activeBaselineTarget === 'HER2') {
      return {
        executiveSummary: HER2_BD_EXECUTIVE_SUMMARY,
        competitiveLandscape: HER2_COMPETITIVE_LANDSCAPE_DATA,
        ipFto: HER2_IP_FTO_DATA,
        marketOpportunity: HER2_MARKET_OPPORTUNITY_DATA,
        dealLandscape: HER2_DEAL_LANDSCAPE_DATA,
        strategicRecommendation: HER2_STRATEGIC_RECOMMENDATION_DATA,
        clinicalPrecedent: HER2_CLINICAL_PRECEDENT_DATA,
      };
    }
    return {
      executiveSummary: BD_EXECUTIVE_SUMMARY,
      competitiveLandscape: COMPETITIVE_LANDSCAPE_DATA,
      ipFto: IP_FTO_DATA,
      marketOpportunity: MARKET_OPPORTUNITY_DATA,
      dealLandscape: DEAL_LANDSCAPE_DATA,
      strategicRecommendation: STRATEGIC_RECOMMENDATION_DATA,
      clinicalPrecedent: CLINICAL_PRECEDENT_DATA,
    };
  }, [activeBaselineTarget]);
  
  // Determine if we should show empty state
  // Show empty state when: no tiles exist, no baseline tiles should show, and not initializing
  const isEmpty = useMemo(() => {
    // Lobby: no active workspace selected
    if (!activeWorkspace) return true;
    return visibleTiles.length === 0 && !showBaselineTiles && orchestrationProgress === null;
  }, [visibleTiles.length, showBaselineTiles, orchestrationProgress, activeWorkspace]);

  // If we return to lobby mid-run, make sure orchestration progress doesn't “stick” and block the empty state.
  useEffect(() => {
    if (activeWorkspace) return;
    setOrchestrationProgress(null);
  }, [activeWorkspace]);
  
  // Determine if we should show initializing state
  // Don't show for baseline workspaces - they animate tiles directly
  const isInitializing = useMemo(() => {
    if (showBaselineTiles) return false; // Baseline tiles animate directly, no overlay
    return orchestrationProgress !== null && orchestrationProgress < 10;
  }, [orchestrationProgress, showBaselineTiles]);
  
  // Get current target for initializing state
  const currentTarget = useMemo(() => {
    if (activeWorkspace) {
      const workspace = allWorkspaces.find((ws) => String(ws.id) === String(activeWorkspace));
      return workspace?.target || 'target';
    }
    return 'target';
  }, [activeWorkspace, allWorkspaces]);

  // Sort tiles: pinned first, then by creation date
  const sortedTiles = useMemo(() => {
    return [...visibleTiles].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visibleTiles]);

  const latestTileByAgent = useMemo(() => {
    const map = new Map<string, (typeof visibleTiles)[number]>();
    for (const t of visibleTiles) {
      if (!t.agent) continue;
      const key = String(t.agent);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, t);
        continue;
      }
      const a = new Date(existing.updatedAt || existing.createdAt).getTime();
      const b = new Date(t.updatedAt || t.createdAt).getTime();
      if (b > a) map.set(key, t);
    }
    return map;
  }, [visibleTiles]);

  const getAgentSourceMarkdown = useCallback((agent: string): string | null => {
    const t = latestTileByAgent.get(agent);
    const detailed = (t?.data as any)?.detailed;
    if (typeof detailed?.fullResponse === 'string' && detailed.fullResponse.trim()) return detailed.fullResponse;
    if (typeof detailed?.fullSynthesis === 'string' && detailed.fullSynthesis.trim()) return detailed.fullSynthesis;
    return null;
  }, [latestTileByAgent]);

  function extractBulletsFromSection(markdown: string, sectionTitleContains: string, max = 6): string[] {
    const lines = markdown.split(/\r?\n/);
    const startIdx = lines.findIndex((l) => l.toLowerCase().includes(sectionTitleContains.toLowerCase()));
    if (startIdx < 0) return [];
    const bullets: string[] = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.startsWith('## ')) break;
      if (/^[-*•]\s+/.test(l)) bullets.push(stripMarkdown(l.replace(/^[-*•]\s+/, '').trim()));
      if (bullets.length >= max) break;
    }
    return bullets;
  }

  const effectiveBDExecutiveSummary = useMemo(() => {
    const base = baseline.executiveSummary;
    
    // For baseline-enabled workspaces (TROP2, HER2), always use polished baseline data
    // This ensures demos show clean, investor-ready tiles instead of raw markdown
    if (showBaselineTiles) return base;
    
    const synth = latestTileByAgent.get('synthesis');
    const synthesisText: string | undefined = (synth?.data as any)?.detailed?.fullSynthesis;
    const isDemoPreamble =
      typeof synthesisText === 'string' &&
      (synthesisText.includes('This is a **synthesized analysis**') ||
        synthesisText.includes('**REAL data**') ||
        synthesisText.includes('Switch to Live Model'));
    if (!synthesisText || isDemoPreamble) return base;
    // Use first summary paragraph only (avoid orphaned headers like "**Key Findings:**")
    const summaryText = synthesisText
      .split(/\n{2,}/)
      .filter((p) => {
        const trimmed = p.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('#') || trimmed.startsWith('---')) return false;
        // Skip standalone headers like "**Key Findings:**" that would appear orphaned
        if (/^\*\*[^*]+:\*\*$/.test(trimmed)) return false;
        return true;
      })
      .slice(0, 1)
      .join('\n\n');
    const drivers = extractBulletsFromSection(synthesisText, 'convergent strengths', 6);
    const risks = extractBulletsFromSection(synthesisText, 'convergent concerns', 6);
    return {
      ...base,
      summaryText: summaryText || base.summaryText,
      keyValueDrivers: drivers.length > 0 ? drivers.slice(0, 5) : base.keyValueDrivers,
      keyRisks: risks.length > 0 ? risks.slice(0, 5) : base.keyRisks,
      agents: ['sonny'] as const,
      primaryAgent: 'sonny' as const,
    };
  }, [latestTileByAgent, baseline, showBaselineTiles]);

  const bdExecExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="BD Executive Walkthrough"
      agent="sonny"
      intro="This view translates science into a business decision: where value exists, what kills the deal, and what evidence is needed to confidently act."
      questions={[
        'Is there a commercially rational path to differentiation vs incumbents?',
        'What is the risk-adjusted value of advancing now vs waiting?',
        'What diligence items are gating and how do we resolve them quickly?',
      ]}
      keyTakeaways={[
        effectiveBDExecutiveSummary.summaryText,
      ].filter(Boolean).slice(0, 3)}
      whatWeLearn={[
        { label: 'Value drivers', value: <ul className="space-y-2">{effectiveBDExecutiveSummary.keyValueDrivers.slice(0, 6).map((d: string, i: number) => <li key={i} className="text-sm text-textSecondary">• {d}</li>)}</ul> },
        { label: 'Risks', value: <ul className="space-y-2">{effectiveBDExecutiveSummary.keyRisks.slice(0, 6).map((r: string, i: number) => <li key={i} className="text-sm text-textSecondary">• {r}</li>)}</ul> },
      ]}
      flags={[
        { title: `Differentiation bar is high in ${currentTarget}`, severity: 'high', rationale: 'Without a clear, evidence-backed differentiation axis (safety/efficacy/biomarker/indication), the asset risks being a “me-too”.' },
      ]}
      nextSteps={[
        'Align on a single differentiation hypothesis and define what data would prove it.',
        'Validate IP/FTO for that hypothesis and quantify value (TAM/segment, pricing, share).',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('synthesis') || undefined}
    />
  ), [effectiveBDExecutiveSummary, getAgentSourceMarkdown, currentTarget]);

  const marketExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="Market Opportunity Walkthrough"
      agent="market_research"
      intro="Market analysis answers: if the science works, is there enough economic headroom and access to justify development, and which segments matter most?"
      questions={[
        'How big is the addressable market for the best-fit indications?',
        'How will competition and sequencing affect achievable share?',
        'What pricing/access constraints could cap upside?',
      ]}
      keyTakeaways={[
        (latestTileByAgent.get('market_research')?.data as any)?.summary?.tam ? `Agent TAM: ${(latestTileByAgent.get('market_research')?.data as any)?.summary?.tam}` : '',
        (latestTileByAgent.get('market_research')?.data as any)?.summary?.growth ? `Growth: ${(latestTileByAgent.get('market_research')?.data as any)?.summary?.growth}` : '',
      ].filter(Boolean)}
      flags={[
        { title: 'Crowded market may compress pricing/uptake', severity: 'medium', rationale: 'High competition shifts value to clear differentiation and strong evidence (endpoints, safety, sequencing).' },
      ]}
      nextSteps={[
        'Specify initial segment(s) and validate patient counts + competitive sequencing assumptions.',
        'Stress-test pricing and access under crowded ADC dynamics.',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('market_research') || undefined}
    />
  ), [getAgentSourceMarkdown, latestTileByAgent]);

  const competitionExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="Competitive Landscape Walkthrough"
      agent="market_research"
      intro="Competition determines the bar: what you must beat, where you can win, and how quickly the window closes."
      questions={[
        'Who defines standard of care and what does “better” mean clinically?',
        'What differentiation is defensible and valued?',
        'Where is there white space (indication, biomarker, modality, safety)?',
      ]}
      flags={[
        { title: 'Window for incremental improvements may be closing', severity: 'high', rationale: 'If incumbents are approved/late-stage, “slightly better” is often not enough—need a crisp wedge.' },
      ]}
      nextSteps={[
        'Map competitors by indication, timing, and differentiators; pick a wedge.',
        'Validate whether your wedge is defensible via IP and development feasibility.',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('market_research') || undefined}
    />
  ), [getAgentSourceMarkdown]);

  const ipExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="IP & FTO Walkthrough"
      agent="patent"
      intro="IP diligence answers: can we build and commercialize a differentiated program without being blocked, and do we have room to create a moat?"
      questions={[
        'Is freedom-to-operate clear for our intended modality/construct?',
        'Where are the blocking claims most likely (epitope, linker/payload, method)?',
        'What white space exists for new filings and differentiation protection?',
      ]}
      flags={[
        { title: 'FTO is often the gating item in crowded ADC targets', severity: 'high', rationale: 'Treat any “moderate/high” FTO signal as gating until counsel review and claim charts are complete.' },
      ]}
      nextSteps={[
        'Do claim charts on the 2–3 most relevant families and map design-around options.',
        'File provisional(s) aligned to the differentiation hypothesis (epitope/linker/payload/biomarker).',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('patent') || undefined}
    />
  ), [getAgentSourceMarkdown]);

  const dealExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="Deal Landscape Walkthrough"
      agent="financial"
      intro="Deal landscape anchors expectations: what comparable assets commanded, what drove value, and what terms make sense given risk."
      questions={[
        'What comps are most relevant (stage, modality, indication)?',
        'What terms are rational given competitive timing and uncertainty?',
        'What milestones should be tied to gating risks (tox, differentiation, IP)?',
      ]}
      flags={[
        { title: 'Valuation should be gated to differentiation proof', severity: 'medium', rationale: 'In crowded targets, value concentrates around clear differentiation and late-stage execution risk reduction.' },
      ]}
      nextSteps={[
        'Pick 3–5 true comps and normalize terms by stage and differentiation strength.',
        'Define milestone structure tied to the most material risks.',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('financial') || undefined}
    />
  ), [getAgentSourceMarkdown]);

  const strategyExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="Decision Support Walkthrough"
      agent="sonny"
      intro="This tile is decision support: what to validate next, what could change the view, and what would invalidate the thesis."
      questions={[
        'What are the 2–3 most decision-relevant uncertainties?',
        'What evidence would resolve each uncertainty (and where would it come from)?',
        'What are explicit stop/park conditions to avoid sunk-cost drift?',
      ]}
      nextSteps={[
        'Turn the uncertainties into a diligence checklist with owners and deadlines.',
        'Set walk-away criteria early to prevent sunk-cost drift.',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('synthesis') || undefined}
    />
  ), [getAgentSourceMarkdown]);

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 [grid-auto-rows:minmax(300px,500px)]'
    : 'flex flex-col gap-6';
  
  // Handle quick start
  const handleQuickStart = (target: string) => {
    window.dispatchEvent(new CustomEvent('trigger-search', { detail: target }));
  };

  // Show empty state
  if (isEmpty) {
    return (
      <EmptyStateDashboard
        onQuickStart={handleQuickStart}
      />
    );
  }

  return (
    <div className="p-6 relative">
      {/* Show initializing overlay if orchestration is starting, but keep baseline tiles visible */}
      {isInitializing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <InitializingState
            target={currentTarget}
            progress={orchestrationProgress || 0}
          />
        </div>
      )}
      
      <div className={gridClasses}>
        {/* User-Created Tiles (pinned first) */}
        {sortedTiles
          .filter(tile => tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}

        {/* Baseline Tiles - Animated appearance based on orchestration progress */}
        {/* Order: Scientific → Competitive → Clinical → IP → Market → Deal → Strategic → Executive Summary (LAST) */}
        {showBaselineTiles && (
          <AnimatePresence mode="popLayout">
            {/* Scientific Validation - appears first */}
            {isTileVisible('scientific') && (
              <motion.div
                key="scientific"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <ScientificValidationTile
                  data={baseline.clinicalPrecedent as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Scientific Validation Walkthrough"
                      agent="clinical"
                      intro="Validation is about risk: how confident should we be the target will translate, and what would change that confidence?"
                      questions={[
                        'What evidence establishes proof-of-concept for the target class?',
                        'What remains uncertain about differentiation and safety?',
                        'What is the minimum dataset required to proceed confidently?',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('clinical') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* Competitive Landscape */}
            {isTileVisible('competitive') && (
              <motion.div
                key="competitive"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <CompetitiveLandscapeTile
                  data={baseline.competitiveLandscape as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={competitionExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Clinical Positioning */}
            {isTileVisible('clinical') && (
              <motion.div
                key="clinical"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <ClinicalPositioningTile
                  data={baseline.clinicalPrecedent as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Clinical Positioning Walkthrough"
                      agent="clinical"
                      intro="Positioning is about where and how this asset would win clinically (line of therapy, population, endpoints), given existing and upcoming standards."
                      questions={[
                        'What is the best initial indication/setting to demonstrate differentiation?',
                        'What endpoints matter most to regulators, clinicians, and payers here?',
                        'Where do safety/liability tradeoffs constrain positioning?',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('clinical') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* IP & FTO */}
            {isTileVisible('ip') && (
              <motion.div
                key="ip"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <IPFreedomToOperateTile
                  data={baseline.ipFto as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={ipExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Market Opportunity */}
            {isTileVisible('market') && (
              <motion.div
                key="market"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <MarketOpportunityTile
                  data={baseline.marketOpportunity as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={marketExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Deal Landscape */}
            {isTileVisible('deal') && (
              <motion.div
                key="deal"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <DealLandscapeTile
                  data={baseline.dealLandscape as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={dealExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Strategic Recommendation */}
            {isTileVisible('strategic') && (
              <motion.div
                key="strategic"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <StrategicRecommendationTile
                  data={baseline.strategicRecommendation as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={strategyExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Executive Summary - appears LAST after synthesis but positioned at TOP via CSS order */}
            {isTileVisible('executive') && (
              <motion.div
                key="executive"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                style={{ order: -1 }}
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <BDExecutiveSummaryTile
                  data={effectiveBDExecutiveSummary}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={bdExecExtendedIntelligence}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* User-Created Tiles (non-pinned) */}
        {sortedTiles
          .filter(tile => !tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}
      </div>
    </div>
  );
}
