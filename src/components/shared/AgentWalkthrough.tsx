import React, { useMemo } from 'react';
import type { AgentType } from '../../lib/multiAgentTypes';
import type { TileData } from '../../lib/tiles/types';
import { AnalystWalkthrough } from './AnalystWalkthrough';

function getDefaultQuestions(agent: AgentType | 'sonny'): string[] {
  switch (agent) {
    case 'target_biology':
      return [
        'Is the target causally linked to disease biology (genetic or mechanistic validation)?',
        'Is the target tractable (modality fit, structural accessibility, internalization)?',
        'What safety liabilities are plausible from normal tissue biology?',
      ];
    case 'clinical':
      return [
        'Is there clinical proof-of-concept and where does efficacy land vs standard of care?',
        'What are the key safety signals and how monitorable/mitigable are they?',
        'Where could a new program differentiate clinically?',
      ];
    case 'patent':
      return [
        'Is freedom-to-operate clear for a differentiated approach?',
        'What is the remaining patent life and where are blocking claims likely?',
        'What white-space exists for new filings (epitopes, linkers/payloads, combinations, biomarkers)?',
      ];
    case 'financial':
      return [
        'What is the value range under reasonable assumptions?',
        'What are the key value drivers and what breaks the model?',
        'What deal terms would be rational given risks and competitive timing?',
      ];
    case 'market_research':
      return [
        'How large is the addressable market and which segments matter most?',
        'How intense is competition and what differentiation would be valued?',
        'What pricing/access dynamics could constrain upside?',
      ];
    case 'regulatory':
      return [
        'What is the likely regulatory pathway and timeline?',
        'What precedents exist (endpoints, label constraints, safety monitoring)?',
        'What are the key regulatory risks and mitigations?',
      ];
    case 'sonny':
    default:
      return [
        'What is the decision to make here (advance / conditional / deprioritize) and why?',
        'What are the highest-leverage uncertainties to resolve next?',
        'What would constitute a “go” vs “no-go” in the next 60–90 days?',
      ];
  }
}

export function AgentWalkthrough({
  agent,
  data,
  title,
}: {
  agent: AgentType | 'sonny';
  data: TileData;
  title?: string;
}) {
  const summary = (data.summary || {}) as any;
  const detailed = (data.detailed || {}) as any;

  const source = typeof detailed.fullResponse === 'string'
    ? detailed.fullResponse
    : typeof detailed.fullSynthesis === 'string'
      ? detailed.fullSynthesis
      : '';

  const keyTakeaways = useMemo(() => {
    const fromVerified = Array.isArray(summary.verifiedHighlights) ? summary.verifiedHighlights : [];
    const fromPhrases = Array.isArray(summary.keyPhrases) ? summary.keyPhrases : [];
    const merged = [...fromVerified, ...fromPhrases].filter(Boolean);
    return merged.slice(0, 6);
  }, [summary.keyPhrases, summary.verifiedHighlights]);

  const flags = useMemo(() => {
    const flags: Array<{ title: string; severity: 'high' | 'medium' | 'low'; rationale: string }> = [];

    if (agent === 'clinical') {
      if (summary.orr && typeof summary.orr === 'string' && !/\[\d+\]/.test(summary.orr)) {
        flags.push({
          title: 'Efficacy metrics need verification',
          severity: 'medium',
          rationale: 'Some endpoint metrics were extracted but may not be directly cited in the visible summary; verify in the source section and primary publications.',
        });
      }
    }

    if (agent === 'patent') {
      if (summary.ftoStatus && String(summary.ftoStatus).toUpperCase().includes('HIGH')) {
        flags.push({
          title: 'Potential blocking IP / FTO risk',
          severity: 'high',
          rationale: 'FTO risk flagged by the IP analysis—treat as gating until claim charts and counsel review are completed.',
        });
      }
    }

    return flags;
  }, [agent, summary.ftoStatus, summary.orr]);

  return (
    <AnalystWalkthrough
      title={title || 'Analyst Walkthrough'}
      agent={agent}
      intro="This expanded view explains what we’re trying to learn from the agent’s analysis, how to interpret the evidence, and what we would flag for follow-up so the dashboard supports real decisions—not just summaries."
      questions={getDefaultQuestions(agent)}
      keyTakeaways={keyTakeaways}
      flags={flags}
      nextSteps={[
        'Verify the most decision-critical claims in the source and primary references.',
        'Translate findings into explicit go/no-go criteria (efficacy, safety, differentiation, IP).',
        'Prioritize 2–3 follow-up analyses that would change the recommendation.',
      ]}
      sourceMarkdown={source}
    />
  );
}

