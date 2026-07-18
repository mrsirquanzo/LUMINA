export type AssumptionSource = 'user-specified' | 'agent-inferred';

export type AssumptionStatus = 'checked' | 'inferred' | 'needs-input';

export interface Assumption {
  label: string;
  chosen: string;
  impact: 'high' | 'medium' | 'low';
  source: AssumptionSource;
  status: AssumptionStatus;
  alternatives: string[];
}

export interface Clarification {
  id: string;
  type: 'single-choice';
  required: boolean;
  question: string;
  context: string;
  default: string;
  options: string[];
}

export interface PlanStep {
  id: string;
  title: string;
  figures: string[];
}

export interface WorkbookHypothesis {
  rank: number;
  combination: string;
  rationale: string;
  experiment: string;
}

export interface WorkbookRun {
  id: string;
  title: string;
  capability: string;
  file: {
    name: string;
    sizeMB: number;
    instrument: string;
    panel: string;
  };
  reasoning: string[];
  assumptions: {
    checked: number;
    inferred: number;
    needsInput: number;
    items: Assumption[];
  };
  clarifications: Clarification[];
  plan: {
    total: number;
    steps: PlanStep[];
  };
  report: {
    summary: string[];
    figures: Array<{
      src: string;
      caption: string;
    }>;
    hypotheses?: WorkbookHypothesis[];
    sections: {
      detailedAnswer: string;
      methods: string;
      assumptionsNote: string;
    };
  };
}
