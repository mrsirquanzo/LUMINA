import { useState, memo, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExecutiveSummaryTile from './tiles/ExecutiveSummaryTile';
import GeneticValidationTile from './tiles/GeneticValidationTile';
import DruggabilityTile from './tiles/DruggabilityTile';
import ExpressionBiologyTile from './tiles/ExpressionBiologyTile';
import MechanisticTile from './tiles/MechanisticTile';
import ClinicalPrecedentTile from './tiles/ClinicalPrecedentTile';
import SafetyAssessmentTile from './tiles/SafetyAssessmentTile';
import KeyExperimentsTile from './tiles/KeyExperimentsTile';
import DynamicTile from './DynamicTile';
import EmptyStateDashboard from './EmptyStateDashboard';
import InitializingState from './InitializingState';
import { AnalystWalkthrough } from './shared/AnalystWalkthrough';

// Baseline tile animation order - Executive Summary is LAST (appears after synthesis)
// Thresholds are based on step progress: 8 tiles = ~12.5% per tile
const BASELINE_TILE_ORDER = [
  { id: 'expression', threshold: 12 },      // Step 1: ~12.5%
  { id: 'mechanistic', threshold: 24 },     // Step 2: ~25%
  { id: 'clinical', threshold: 36 },        // Step 3: ~37.5%
  { id: 'safety', threshold: 48 },          // Step 4: ~50%
  { id: 'genetic', threshold: 60 },         // Step 5: ~62.5%
  { id: 'experiments', threshold: 72 },     // Step 6: ~75%
  { id: 'druggability', threshold: 84 },    // Step 7: ~87.5%
  { id: 'executive', threshold: 96 },       // Step 8: Executive Summary appears LAST
] as const;

type BaselineTileId = (typeof BASELINE_TILE_ORDER)[number]['id'];

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
import { formatTPM, stripMarkdown } from '../utils/scoring';
import {
  SCIENTIST_EXECUTIVE_SUMMARY,
  GENETIC_VALIDATION_DATA,
  DRUGGABILITY_DATA,
  EXPRESSION_DATA,
  MECHANISTIC_DATA,
  CLINICAL_PRECEDENT_DATA,
  SAFETY_DATA,
  KEY_EXPERIMENTS_DATA,
  HER2_SCIENTIST_EXECUTIVE_SUMMARY,
  HER2_GENETIC_VALIDATION_DATA,
  HER2_DRUGGABILITY_DATA,
  HER2_EXPRESSION_DATA,
  HER2_MECHANISTIC_DATA,
  HER2_CLINICAL_PRECEDENT_DATA,
  HER2_SAFETY_DATA,
  HER2_KEY_EXPERIMENTS_DATA,
} from '../constants';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, duration: 0.3 },
  },
};

interface ScientistDashboardProps {
  viewMode?: 'grid' | 'list';
}

const ScientistDashboard = memo(function ScientistDashboard({ viewMode = 'grid' }: ScientistDashboardProps) {
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
    setRevealProgress(BASELINE_TILE_ORDER[0]?.threshold ?? 0);

    const steps = BASELINE_TILE_ORDER.length;
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
    return BASELINE_TILE_ORDER
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
        executiveSummary: HER2_SCIENTIST_EXECUTIVE_SUMMARY,
        geneticValidation: HER2_GENETIC_VALIDATION_DATA,
        druggability: HER2_DRUGGABILITY_DATA,
        expression: HER2_EXPRESSION_DATA,
        mechanistic: HER2_MECHANISTIC_DATA,
        clinicalPrecedent: HER2_CLINICAL_PRECEDENT_DATA,
        safety: HER2_SAFETY_DATA,
        keyExperiments: HER2_KEY_EXPERIMENTS_DATA,
      };
    }
    // Default: TROP2 baseline (existing behavior)
    return {
      executiveSummary: SCIENTIST_EXECUTIVE_SUMMARY,
      geneticValidation: GENETIC_VALIDATION_DATA,
      druggability: DRUGGABILITY_DATA,
      expression: EXPRESSION_DATA,
      mechanistic: MECHANISTIC_DATA,
      clinicalPrecedent: CLINICAL_PRECEDENT_DATA,
      safety: SAFETY_DATA,
      keyExperiments: KEY_EXPERIMENTS_DATA,
    };
  }, [activeBaselineTarget]);
  
  // Determine if we should show empty state
  // Show empty state when: no tiles exist, no baseline tiles should show, and not initializing
  const isEmpty = useMemo(() => {
    // Lobby: no active workspace selected
    if (!activeWorkspace) return true;

    const shouldShowEmpty = visibleTiles.length === 0 && !showBaselineTiles && orchestrationProgress === null;
    // Debug logging
    if (shouldShowEmpty) {
      console.log('[ScientistDashboard] Showing empty state:', {
        visibleTiles: visibleTiles.length,
        showBaselineTiles,
        orchestrationProgress,
        activeWorkspace,
        allTiles: tiles.length,
      });
    }
    return shouldShowEmpty;
  }, [visibleTiles.length, showBaselineTiles, orchestrationProgress, activeWorkspace, tiles.length]);

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

  // Map latest imported/generated tiles by agent for the active workspace.
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

  function extractBulletsFromSection(markdown: string, sectionTitleContains: string, max = 5): string[] {
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

  // Baseline tile overrides sourced from imported/generated agent tiles (when present).
  const effectiveExecutiveSummary = useMemo(() => {
    const base = baseline.executiveSummary;
    
    // For baseline-enabled workspaces (TROP2, HER2), always use polished baseline data
    // This ensures demos show clean, investor-ready tiles instead of raw markdown
    if (showBaselineTiles) return base;
    
    const synthesisTile = latestTileByAgent.get('synthesis');
    if (!synthesisTile) return base;

    const synthesisText: string | undefined = (synthesisTile.data as any)?.detailed?.fullSynthesis;
    // Demo synthesis includes a preamble that looks like an internal disclaimer.
    // Keep the dashboard clean by falling back to the structured baseline dataset.
    const isDemoPreamble =
      typeof synthesisText === 'string' &&
      (synthesisText.includes('This is a **synthesized analysis**') ||
        synthesisText.includes('**REAL data**') ||
        synthesisText.includes('Switch to Live Model'));
    if (!synthesisText || isDemoPreamble) return base;
    const strengths = synthesisText ? extractBulletsFromSection(synthesisText, 'convergent strengths', 6) : [];
    const concerns = synthesisText ? extractBulletsFromSection(synthesisText, 'convergent concerns', 6) : [];

    // Use first summary paragraph only (avoid orphaned headers like "**Key Findings:**")
    const summaryText = synthesisText
      ? synthesisText
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
          .join('\n\n')
      : base.summaryText;

    const targetBioSummary = (latestTileByAgent.get('target_biology')?.data as any)?.summary;
    const quickMetrics = {
      geneticValidation: (targetBioSummary?.geneticScore || base.quickMetrics.geneticValidation) as any,
      therapeuticWindow: base.quickMetrics.therapeuticWindow,
      druggability: (targetBioSummary?.druggability || base.quickMetrics.druggability) as any,
      safetyProfile: (targetBioSummary?.safety || base.quickMetrics.safetyProfile) as any,
    };

    return {
      ...base,
      dataFreshness: new Date().toISOString(),
      summaryText: summaryText || base.summaryText,
      keyStrengths: strengths.length > 0 ? strengths.slice(0, 5) : base.keyStrengths,
      keyRisks: concerns.length > 0 ? concerns.slice(0, 5) : base.keyRisks,
      quickMetrics,
      agents: ['sonny'] as const,
      primaryAgent: 'sonny' as const,
    };
  }, [latestTileByAgent, baseline, showBaselineTiles]);

  const effectiveClinicalPrecedent = useMemo(() => {
    const base = baseline.clinicalPrecedent;
    // For baseline-enabled workspaces, always use polished baseline data
    if (showBaselineTiles) return base;
    const clinicalTile = latestTileByAgent.get('clinical');
    if (!clinicalTile) return base;
    const s = (clinicalTile.data as any)?.summary || {};
    const verified = Array.isArray(s.verifiedHighlights) ? s.verifiedHighlights : [];
    const ascent = s.ascent || {};

    const updatedTrials = base.clinicalTrials.map((t) => {
      if (t.title === 'ASCENT Trial' && t.results) {
        return {
          ...t,
          results: {
            ...t.results,
            orr: ascent.orr || t.results.orr,
            pfs: ascent.mpfs || t.results.pfs,
            os: ascent.mos || t.results.os,
          },
        };
      }
      return t;
    });

    const keyFindings = verified.length
      ? verified.slice(0, 3).join(' ')
      : base.keyFindings;

    return {
      ...base,
      clinicalTrials: updatedTrials as any,
      keyFindings,
      agents: ['clinical'] as const,
      primaryAgent: 'clinical' as const,
    };
  }, [latestTileByAgent, baseline, showBaselineTiles]);

  const effectiveExpressionData = useMemo(() => {
    const base = baseline.expression;
    // For baseline-enabled workspaces, always use polished baseline data
    if (showBaselineTiles) return base;
    const clinicalTile = latestTileByAgent.get('clinical');
    const expr = (clinicalTile?.data as any)?.summary?.expression || (clinicalTile?.data as any)?.detailed?.expression;
    const gtex = Array.isArray(expr?.gtexNormalTissues) ? expr.gtexNormalTissues : [];
    const tumorUp = Array.isArray(expr?.tumorUpregulation) ? expr.tumorUpregulation : [];

    const gtexTissues = gtex
      .map((r: any) => {
        const name = String(r.tissue || r.name || '').trim();
        const tpm = typeof r.medianTpm === 'number' ? r.medianTpm : Number.parseFloat(String(r.medianTpm || r.tpm || '').replace(/[^\d.]/g, ''));
        if (!name || !Number.isFinite(tpm)) return null;
        const lower = name.toLowerCase();
        const category =
          lower.includes('skin') ? 'skin' :
          lower.includes('lung') ? 'lung' :
          lower.includes('colon') || lower.includes('esophagus') || lower.includes('stomach') ? 'gi' :
          lower.includes('heart') ? 'heart' :
          lower.includes('brain') ? 'brain' :
          lower.includes('liver') ? 'liver' :
          lower.includes('kidney') ? 'kidney' :
          'other';
        const isSafetyOrgan = category === 'skin' || category === 'lung' || category === 'gi';
        return {
          name,
          tpm,
          category,
          isSafetyOrgan,
          implications: r.implications || '',
          citations: r.citations || [],
        };
      })
      .filter(Boolean);

    const normalLookup = new Map<string, number>();
    for (const t of gtexTissues as any[]) normalLookup.set(String(t.name).toLowerCase(), Number(t.tpm));

    const foldChangeData = tumorUp
      .map((u: any) => {
        const indication = String(u.indication || '').trim();
        const foldChange = typeof u.foldChange === 'number' ? u.foldChange : Number.parseFloat(String(u.foldChange || '').replace(/[^\d.]/g, ''));
        if (!indication || !Number.isFinite(foldChange)) return null;

        const lower = indication.toLowerCase();
        const normalTpm =
          lower.includes('breast') ? normalLookup.get('breast') :
          lower.includes('lung') ? normalLookup.get('lung') :
          null;

        const tumorTpm = normalTpm !== null && normalTpm !== undefined ? Number((normalTpm * foldChange).toFixed(1)) : null;
        return {
          indication,
          foldChange,
          normalTPM: normalTpm ?? null,
          tumorTPM: tumorTpm,
          citations: Array.isArray(u.citations) ? u.citations : [],
          pValue: u.pValue ?? null,
        };
      })
      .filter(Boolean);

    const best = foldChangeData.length > 0
      ? foldChangeData.reduce((acc: any, cur: any) => (cur.foldChange > acc.foldChange ? cur : acc), foldChangeData[0] as any)
      : null;

    return {
      ...base,
      gtexNormalTissues: gtexTissues.length > 0 ? (gtexTissues as any) : base.gtexNormalTissues,
      foldChangeData: foldChangeData.length > 0 ? (foldChangeData as any) : base.foldChangeData,
      bestIndication: best
        ? { name: best.indication, foldChange: best.foldChange, rank: 1 }
        : base.bestIndication,
      agents: ['clinical'] as const,
      primaryAgent: 'clinical' as const,
    };
  }, [latestTileByAgent, baseline, showBaselineTiles]);

  const expressionExtendedIntelligence = useMemo(() => {
    const clinicalSource = getAgentSourceMarkdown('clinical');
    const gtex = (effectiveExpressionData as any)?.gtexNormalTissues || [];
    const fc = (effectiveExpressionData as any)?.foldChangeData || [];

    const topNormal = [...gtex]
      .sort((a: any, b: any) => (b?.tpm || 0) - (a?.tpm || 0))
      .slice(0, 5)
      .map((t: any) => `${t.name}: ${formatTPM(t.tpm)} TPM${t.implications ? ` — ${t.implications}` : ''}`);

    const topFold = [...fc]
      .sort((a: any, b: any) => (b?.foldChange || 0) - (a?.foldChange || 0))
      .slice(0, 5)
      .map((f: any) => {
        const p = f.pValue ? ` (${f.pValue})` : '';
        const cits = Array.isArray(f.citations) && f.citations.length > 0 ? ` ${f.citations.map((c: string) => `[${c}]`).join(' ')}` : '';
        return `${f.indication}: ${f.foldChange}x tumor vs normal${p}${cits}`;
      });

    const skin = gtex.find((t: any) => String(t.name).toLowerCase().includes('skin'));
    const colon = gtex.find((t: any) => String(t.name).toLowerCase().includes('colon'));

    return (
      <AnalystWalkthrough
        title="Expression Biology Walkthrough"
        agent="clinical"
        intro={`Expression biology answers a practical question: can we hit the tumor hard enough while sparing normal tissues? For targets like ${currentTarget}, the tumor-vs-normal differential and normal tissue distribution are the backbone of therapeutic window, toxicity expectations, and patient selection.`}
        questions={[
          `Is ${currentTarget} sufficiently tumor-selective (tumor vs normal) to support a workable therapeutic window?`,
          `Which normal tissues express ${currentTarget} and what toxicity liabilities should we anticipate/monitor?`,
          'Which tumor contexts show the strongest upregulation, guiding starting indications and biomarker strategy?',
        ]}
        keyTakeaways={[
          ...(topFold.length > 0 ? ['Use the tumor-vs-normal ratios to prioritize starting indications and set realistic safety expectations.'] : []),
          ...(skin ? [`Normal tissue expression is highest in skin—treat dermatologic toxicity as a foreseeable on-target liability.`] : []),
          ...(colon ? [`GI baseline expression implies mucositis/diarrhea risk should be expected and proactively managed.`] : []),
        ].filter(Boolean)}
        whatWeLearn={[
          {
            label: 'Normal baseline (GTEx)',
            value: (
              <ul className="space-y-2">
                {topNormal.length > 0 ? topNormal.map((l: string, idx: number) => (
                  <li key={idx} className="text-sm text-textSecondary">• {l}</li>
                )) : <li className="text-sm text-textSecondary">No GTEx table parsed from the clinical agent export.</li>}
              </ul>
            ),
          },
          {
            label: 'Tumor selectivity (TCGA)',
            value: (
              <ul className="space-y-2">
                {topFold.length > 0 ? topFold.map((l: string, idx: number) => (
                  <li key={idx} className="text-sm text-textSecondary">• {l}</li>
                )) : <li className="text-sm text-textSecondary">No tumor vs normal bullets parsed from the clinical agent export.</li>}
              </ul>
            ),
          },
          {
            label: 'Why we care',
            value: (
              <div className="space-y-2">
                <p className="text-sm text-textSecondary">
                  Tumor-vs-normal differential predicts whether dose can be pushed to efficacy before dose-limiting toxicity. Normal tissue expression tells us which organs are “on-target at risk”.
                </p>
                <p className="text-sm text-textSecondary">
                  For ADCs, internalization and surface density matter—but if skin/GI baseline is high, we should expect epithelial toxicities and bake monitoring + mitigation into the development plan.
                </p>
              </div>
            ),
          },
        ]}
        flags={[
          skin
            ? {
                title: 'Skin expression → predictable epithelial toxicity risk',
                severity: 'high',
                rationale: `Skin shows the highest normal expression in this export (${formatTPM(skin.tpm)} TPM). Treat rash/skin AEs as an expected on-target liability and validate with IHC + clinical AE precedents.`,
                citations: (skin.citations || []).length > 0 ? skin.citations : undefined,
              }
            : {
                title: 'Normal tissue expression may drive toxicity',
                severity: 'medium',
                rationale: 'If key normal tissues express the target, toxicity can be on-target and dose-limiting. Confirm distribution with IHC/GTEx and align with observed class AEs.',
              },
        ]}
        nextSteps={[
          'Validate normal vs tumor expression with IHC (H-score), not just transcript TPM; define a practical cutoff for patient selection.',
          'Align expected toxicity organs (skin/GI) to monitoring plan and mitigation (supportive care, dose rules, payload/linker choices).',
          'Stress-test whether observed selectivity is enough to support differentiation vs incumbents; identify a concrete differentiation hypothesis (safety, schedule, biomarker, or modality).',
        ]}
        sourceMarkdown={clinicalSource || undefined}
      />
    );
  }, [effectiveExpressionData, getAgentSourceMarkdown, currentTarget]);

  const execSummaryExtendedIntelligence = useMemo(() => {
    const synthSource = getAgentSourceMarkdown('synthesis');
    const strengths = effectiveExecutiveSummary.keyStrengths?.slice(0, 6) || [];
    const risks = effectiveExecutiveSummary.keyRisks?.slice(0, 6) || [];
    return (
      <AnalystWalkthrough
        title="Executive Summary Walkthrough"
        agent="sonny"
        intro="This is the synthesis layer: what matters most, what is uncertain, and what evidence would change the view."
        questions={[
          'What is the strongest evidence-backed case for biological/clinical translation?',
          'What are the most decision-relevant risks and uncertainties?',
          'What are the highest-risk unknowns that could change the view?',
        ]}
        keyTakeaways={[
          `Confidence: ${(effectiveExecutiveSummary.confidenceLevel * 100).toFixed(0)}%`,
        ]}
        whatWeLearn={[
          { label: 'Strengths', value: <ul className="space-y-2">{strengths.map((s: string, i: number) => <li key={i} className="text-sm text-textSecondary">• {s}</li>)}</ul> },
          { label: 'Risks', value: <ul className="space-y-2">{risks.map((r: string, i: number) => <li key={i} className="text-sm text-textSecondary">• {r}</li>)}</ul> },
        ]}
        nextSteps={[
          'Prioritize 2–3 uncertainties that would change the view and design the smallest experiments/analyses to resolve them.',
          'Define explicit decision triggers (what result would increase confidence vs require a pivot).',
        ]}
        sourceMarkdown={synthSource || undefined}
      />
    );
  }, [effectiveExecutiveSummary, getAgentSourceMarkdown]);

  const clinicalExtendedIntelligence = useMemo(() => (
    <AnalystWalkthrough
      title="Clinical Precedent Walkthrough"
      agent="clinical"
      intro="Clinical precedent tells us whether the target class is already validated, what efficacy is realistically achievable, and what safety liabilities are likely to be class/on-target."
      questions={[
        `Is there clinical proof-of-concept for targeting ${currentTarget}?`,
        'What efficacy endpoints are achievable and in which settings?',
        'What safety signals are common and how manageable are they?',
      ]}
      keyTakeaways={[
        `Programs: total ${effectiveClinicalPrecedent.programsSummary?.total ?? '—'} | active ${effectiveClinicalPrecedent.programsSummary?.active ?? '—'} | approved ${effectiveClinicalPrecedent.programsSummary?.approved ?? '—'}`,
      ]}
      whatWeLearn={[
        { label: 'Key finding', value: <p className="text-sm text-textSecondary">{effectiveClinicalPrecedent.keyFindings}</p> },
        { label: 'Representative trials', value: <ul className="space-y-2">{(effectiveClinicalPrecedent.clinicalTrials || []).slice(0, 3).map((t: any, i: number) => <li key={i} className="text-sm text-textSecondary">• {t.title} ({t.phase}) — ORR {t.results?.orr || '—'}, PFS {t.results?.pfs || '—'}</li>)}</ul> },
      ]}
      flags={[
        { title: 'Competitive bar is defined by strong incumbents', severity: 'high', rationale: 'Differentiation needs to be explicit (safety, efficacy in a niche, biomarker, schedule, modality). Otherwise you risk a “me-too” profile.' },
      ]}
      nextSteps={[
        'Define a differentiation hypothesis (and what data would prove it).',
        'Validate target expression / biomarker strategy aligns with trials where benefit is highest.',
      ]}
      sourceMarkdown={getAgentSourceMarkdown('clinical') || undefined}
    />
  ), [effectiveClinicalPrecedent, getAgentSourceMarkdown, currentTarget]);

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
    <div className="p-6 w-full relative">
      {/* Show initializing overlay if orchestration is starting, but keep baseline tiles visible */}
      {isInitializing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <InitializingState
            target={currentTarget}
            progress={orchestrationProgress || 0}
          />
        </div>
      )}
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`${gridClasses} w-full`}
      >
        {/* User-Created Tiles (pinned first) */}
        {sortedTiles
          .filter(tile => tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}

        {/* Baseline Tiles - Animated appearance based on orchestration progress */}
        {/* Order: Expression → Mechanistic → Clinical → Safety → Genetic → Experiments → Druggability → Executive Summary (LAST) */}
        {showBaselineTiles && (
          <AnimatePresence mode="popLayout">
            {/* Expression Biology - appears first */}
            {isTileVisible('expression') && (
              <motion.div
                key="expression"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <ExpressionBiologyTile
                  data={effectiveExpressionData as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={expressionExtendedIntelligence as any}
                />
              </motion.div>
            )}

            {/* Mechanistic Rationale */}
            {isTileVisible('mechanistic') && (
              <motion.div
                key="mechanistic"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <MechanisticTile
                  data={baseline.mechanistic as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Mechanistic Rationale Walkthrough"
                      agent="target_biology"
                      intro="Mechanistic rationale explains why perturbing this target should change disease biology, and whether the mechanism aligns with the chosen modality."
                      questions={[
                        `What is the biological role of ${currentTarget} in disease biology and why is it relevant?`,
                        'Is the mechanism compatible with the intended modality (surface access, internalization, payload delivery, or kinase inhibition)?',
                        'What are the key evidence gaps that could undermine the mechanism?',
                      ]}
                      keyTakeaways={[
                        baseline.mechanistic.pathwayContext,
                        baseline.mechanistic.preclinicalEvidence,
                      ].filter(Boolean).slice(0, 3)}
                      flags={[
                        { title: 'Mechanism vs modality must be coherent', severity: 'medium', rationale: 'Confirm the therapeutic hypothesis matches modality mechanics (target access, internalization/engagement, and class liabilities).' },
                      ]}
                      nextSteps={[
                        'Validate internalization kinetics and antigen density in relevant patient samples.',
                        'Assess resistance mechanisms and whether combination strategies are warranted.',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('target_biology') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* Clinical Precedent */}
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
                <ClinicalPrecedentTile
                  data={effectiveClinicalPrecedent}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={clinicalExtendedIntelligence}
                />
              </motion.div>
            )}

            {/* Safety Assessment */}
            {isTileVisible('safety') && (
              <motion.div
                key="safety"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <SafetyAssessmentTile
                  data={baseline.safety as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Safety Assessment Walkthrough"
                      agent="clinical"
                      intro="Safety is driven by normal tissue expression + payload/linker class effects. This view explains what we expect to see clinically, what to monitor, and what would be unacceptable."
                      questions={[
                        'Which organs are at risk from on-target biology (normal expression)?',
                        'Which risks are payload-class vs target-driven?',
                        'What monitoring and mitigation is mandatory to de-risk the program?',
                      ]}
                      keyTakeaways={[
                        ...(baseline.safety.mechanismBasedRisks || []).slice(0, 3),
                        `Therapeutic index estimate: ${baseline.safety.therapeuticIndex?.estimate || '—'}`,
                      ].filter(Boolean)}
                      flags={[
                        { title: 'Normal tissue biology drives predictable liabilities', severity: 'high', rationale: 'On-target organs and payload class effects should be assumed until disproven; define monitoring and dose-modification rules early.' },
                        { title: 'Treat ILD/pneumonitis as a label-risk item (when applicable)', severity: 'medium', rationale: 'Certain ADC payload classes have known ILD signals; operational readiness matters for investor demo credibility.' },
                      ]}
                      nextSteps={[
                        'Define DLT expectations and mitigation playbook early (supportive care, dose rules).',
                        'Validate target distribution in human tissues with IHC across organs of concern.',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('clinical') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* Genetic Validation */}
            {isTileVisible('genetic') && (
              <motion.div
                key="genetic"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <GeneticValidationTile
                  data={baseline.geneticValidation as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Genetic Validation Walkthrough"
                      agent="target_biology"
                      intro="Genetic evidence increases confidence that modulating the target will matter clinically, and can also flag safety liabilities. For many surface targets, genetics can be indirect—so we look for any converging signals."
                      questions={[
                        `Is there human genetics or somatic driver evidence linking ${currentTarget} to disease biology or safety?`,
                        'Do constraint metrics suggest tolerance to inhibition?',
                        'Are there specific phenotypes that inform monitoring requirements?',
                      ]}
                      keyTakeaways={[
                        baseline.geneticValidation.validationSummary,
                        `Constraint: pLI ${baseline.geneticValidation.constraintMetrics.pLI}, LOEUF ${baseline.geneticValidation.constraintMetrics.LOEUF}`,
                      ].slice(0, 3)}
                      flags={[
                        { title: 'Limited direct GWAS signal for oncology', severity: 'medium', rationale: 'Treat genetics as supportive but not decisive; lean more heavily on expression + clinical precedent for decision-making.' },
                      ]}
                      nextSteps={[
                        'Validate whether any genetic/biobank signals align with the intended indication.',
                        'Use known LoF phenotypes to drive monitoring (e.g., ophthalmic signals).',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('target_biology') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* Key Experiments */}
            {isTileVisible('experiments') && (
              <motion.div
                key="experiments"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <KeyExperimentsTile
                  data={baseline.keyExperiments as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Key Experiments Walkthrough"
                      agent="sonny"
                      intro="This is the de-risking plan: what uncertainties matter most and what experiments/analyses would change the decision."
                      questions={[
                        'What are the most decision-relevant evidence gaps?',
                        'What would constitute "advance" vs "stop" in the next 3–6 months?',
                        'What experiments are highest leverage per dollar/time?',
                      ]}
                      keyTakeaways={[
                        ...(baseline.keyExperiments.evidenceGaps || []).slice(0, 3).map((g: any) => `${g.gap} (${g.priority})`),
                      ]}
                      nextSteps={[
                        'Run the top 2–3 experiments that gate differentiation and safety.',
                        'Convert qualitative gaps into measurable criteria.',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('synthesis') || undefined}
                    />
                  }
                />
              </motion.div>
            )}

            {/* Druggability */}
            {isTileVisible('druggability') && (
              <motion.div
                key="druggability"
                variants={tileVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 h-full max-h-full flex flex-col min-h-0' : 'w-full'}
              >
                <DruggabilityTile
                  data={baseline.druggability as any}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={
                    <AnalystWalkthrough
                      title="Druggability Walkthrough"
                      agent="target_biology"
                      intro="Druggability asks: can we build a modality that reliably reaches and engages the target with an acceptable window?"
                      questions={[
                        'Is the target accessible and tractable for the chosen modality?',
                        'What precedent compounds/programs exist and what do they teach us?',
                        'Where can we differentiate (payload/linker, schedule, biomarker, indication)?',
                      ]}
                      keyTakeaways={[
                        baseline.druggability.tractabilityAssessment,
                        `Existing precedent: ${baseline.druggability.existingCompounds?.[0]?.name || '—'}`,
                      ].filter(Boolean).slice(0, 3)}
                      flags={[
                        { title: 'Crowded ADC space raises differentiation bar', severity: 'high', rationale: "If you cannot articulate what's uniquely better (and why), it's hard to justify a new program." },
                      ]}
                      nextSteps={[
                        'Pick a differentiation axis and define how you will measure it (tox, efficacy, biomarker).',
                        'Run head-to-head preclinical comparisons vs benchmark programs when feasible.',
                      ]}
                      sourceMarkdown={getAgentSourceMarkdown('target_biology') || undefined}
                    />
                  }
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
                <ExecutiveSummaryTile
                  data={effectiveExecutiveSummary}
                  loading={loading}
                  onAgentClick={handleAgentClick}
                  extendedIntelligence={execSummaryExtendedIntelligence}
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
      </motion.div>
    </div>
  );
});

ScientistDashboard.displayName = 'ScientistDashboard';

export default ScientistDashboard;
