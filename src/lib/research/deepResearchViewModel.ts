import type { RuntimePlanStep } from '../workbook/replayDriver';
import type { BriefingView, ResearchTraceEvent, TraceAggregate, TraceLogEntry } from './sseTypes';

export function buildDemoReplayEvents(briefing: BriefingView, fallbackTarget: string): ResearchTraceEvent[] {
  const target = briefing.target ?? fallbackTarget;
  const sections = briefing.sections ?? [];
  return [
    { type: 'tool_call', tool: 'open_targets_target', args: { symbol: target } },
    { type: 'tool_result', tool: 'open_targets_target', count: 1 },
    { type: 'tool_call', tool: 'clinical_trials_search', args: { query: target } },
    { type: 'tool_result', tool: 'clinical_trials_search', count: 8 },
    { type: 'lead_decompose', specialists: sections.map((section) => section.id).filter(Boolean) },
    ...sections.flatMap((section, index) => [
      {
        type: 'research_read',
        specialist: section.title ?? `Specialist ${index + 1}`,
        sourceId: section.claims?.[0]?.citations?.[0] ?? 'cached evidence',
      },
      { type: 'section_complete', id: section.id ?? `section-${index + 1}`, rag: section.rag ?? 'amber' },
    ]),
    { type: 'developability_assessment' },
    { type: 'kol_cluster', cluster: briefing.kolCluster ?? { labs: [] } },
    { type: 'recommendation', verdict: briefing.recommendation?.verdict ?? 'watch' },
  ];
}

function formatTraceLine(entry: TraceLogEntry): string {
  const detail = entry.detail ? `: ${entry.detail}` : '';
  switch (entry.role) {
    case 'tool': return `Querying ${entry.label}${detail}`;
    case 'tool_result': return `${entry.label} returned${detail}`;
    case 'read': return `${entry.label}${detail}`;
    case 'evidence': return `Registered ${entry.label}${detail}`;
    case 'section': return `Completed ${entry.detail ?? 'research section'}`;
    case 'audit': return `Method review${detail}`;
    case 'degraded': return `Continuing with degraded coverage${detail}`;
    case 'verdict': return 'Synthesized grounded assessment';
    default: return `${entry.label}${detail}`;
  }
}

export function reasoningLines(aggregate: TraceAggregate): string[] {
  return aggregate.log
    .filter((entry) => entry.role !== 'event' || entry.type === 'lead_decompose')
    .map(formatTraceLine)
    .slice(-12);
}

function stepStatus(
  done: boolean,
  running: boolean,
): RuntimePlanStep['status'] {
  if (done) return 'done';
  return running ? 'running' : 'pending';
}

export function analysisPlan(
  aggregate: TraceAggregate,
  status: 'idle' | 'hydrating' | 'running' | 'done' | 'error',
  expectedSections: number,
): { steps: RuntimePlanStep[]; current: number; total: number } {
  const count = (type: string) => aggregate.counts[type] ?? 0;
  const final = status === 'done';
  const seedsDone = count('tool_result') + count('source_unavailable') >= 2 || count('lead_decompose') > 0;
  const specialistsStarted = count('lead_decompose') > 0;
  const sectionsDone = count('section_complete');
  const specialistsDone = final || count('developability_assessment') > 0 || (expectedSections > 0 && sectionsDone >= expectedSections);
  const developabilityDone = final || count('kol_cluster') > 0 || count('recommendation') > 0;
  const kolDone = final || count('recommendation') > 0;

  const steps: RuntimePlanStep[] = [
    { id: 'sources', title: 'Initialize evidence sources', figures: [], status: stepStatus(seedsDone, !seedsDone && status === 'running') },
    { id: 'specialists', title: 'Run research specialists', figures: [], status: stepStatus(specialistsDone, specialistsStarted && !specialistsDone) },
    { id: 'developability', title: 'Developability assessment', figures: [], status: stepStatus(developabilityDone, specialistsDone && !developabilityDone) },
    { id: 'kol', title: 'Map KOL terrain', figures: [], status: stepStatus(kolDone, developabilityDone && !kolDone) },
    { id: 'synthesis', title: 'Synthesize recommendation', figures: [], status: stepStatus(final, kolDone && !final) },
  ];

  return { steps, current: steps.filter((step) => step.status === 'done').length, total: steps.length };
}

export function briefingReport(briefing: BriefingView) {
  const recommendation = briefing.recommendation;
  // executiveRead already carries the framing + bottom line, so we do NOT also
  // emit recommendation.thesis (it repeats the opening paragraph verbatim).
  const summary = [
    briefing.executiveRead,
    recommendation?.bull?.[0]?.point ? `Bull case: ${recommendation.bull[0].point}` : undefined,
    recommendation?.bear?.[0]?.point ? `Key risk: ${recommendation.bear[0].point}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return {
    report: {
      summary,
      figures: [],
      sections: {
        detailedAnswer: '',
        methods: '',
        assumptionsNote: '',
      },
    },
    contentSections: (briefing.sections ?? []).map((section, index) => ({
      id: section.id ?? `section-${index + 1}`,
      title: section.title ?? `Research section ${index + 1}`,
      content: [
        section.takeaway,
        ...(section.claims ?? []).slice(0, 4).map((claim) => claim.text),
      ].filter(Boolean).join(' '),
    })),
  };
}
