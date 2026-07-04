export type ViewState = 'dashboard' | 'feed' | 'workspaces' | 'history' | 'research' | 'dossiers';

// Scoring types
export type ValidationScore = 'Strong' | 'Moderate' | 'Limited' | 'Insufficient';
export type DruggabilityScore = 'High' | 'Medium' | 'Low' | 'Challenging';
export type SafetyScore = 'Favorable' | 'Manageable' | 'Concerning' | 'High Risk';
export type TherapeuticWindow = 'Favorable' | 'Moderate' | 'Narrow' | 'Unfavorable';
export type Recommendation = 'Advance' | 'Conditional' | 'Deprioritize' | 'No-Go';

// Scout scoring types
export type OpportunityRating = 'Highly Attractive' | 'Attractive' | 'Conditional' | 'Pass';
export type StrategicFit = 'Strong Fit' | 'Moderate Fit' | 'Limited Fit';
export type CompetitiveIntensity = 'Crowded' | 'Active' | 'Emerging' | 'White Space';
export type IPPosition = 'Strong' | 'Moderate' | 'Weak' | 'Contested';
export type DealActivity = 'Hot' | 'Active' | 'Moderate' | 'Limited';
export type ClinicalActivity = 'Validated' | 'Emerging' | 'Unproven' | 'Failed';

// Data interfaces
export interface GWASAssociation {
  disease: string;
  score: number;
  evidenceType: 'GWAS' | 'Mendelian' | 'Somatic';
  keyVariants: string[];
  effectSize?: number;
  pValue?: string;
}

export interface ConstraintMetrics {
  pLI: number;
  LOEUF: number;
  lofObserved?: number;
  lofExpected?: number;
  homozygousCarriers?: number;
}

export interface ExpressionTissue {
  name: string;
  tpm: number;
  isSafetyOrgan: boolean;
  category: 'brain' | 'heart' | 'liver' | 'kidney' | 'lung' | 'skin' | 'gi' | 'other';
  /**
   * Optional: when sourced from an agent response, store short interpretation text.
   * This is used for richer tile rendering (and can include inline citation markers like [7]).
   */
  implications?: string;
  /**
   * Optional: store citation markers found on the line (e.g. ["7"]).
   * Note: the tile UI may render these as plain markers unless a dedicated citation renderer is used.
   */
  citations?: string[];
}

export interface TumorExpression {
  tumorType: string;
  tcgaCode: string;
  medianTPM: number;
  percentileRank: number;
  sampleCount: number;
}

export interface ClinicalTrial {
  nctId: string;
  title: string;
  phase: string;
  status: 'Recruiting' | 'Active' | 'Completed' | 'Terminated' | 'Withdrawn';
  sponsor: string;
  indication: string;
  startDate: string;
  expectedReadout?: string;
  results?: {
    orr?: string;
    pfs?: string;
    os?: string;
    safetyNotes?: string;
  };
}

export interface Patent {
  patentNumber: string;
  title: string;
  owner: string;
  type: 'Composition' | 'Method' | 'Formulation' | 'Manufacturing';
  filingDate: string;
  expiryDate: string;
  relevance: 'High' | 'Medium' | 'Low';
  claims: string[];
}

export interface ComparableDeal {
  asset: string;
  acquirer: string;
  seller: string;
  date: string;
  stage: string;
  upfront: string;
  milestones: string;
  totalValue: string;
  royalties?: string;
  notes?: string;
}

export interface Competitor {
  company: string;
  asset: string;
  modality: string;
  stage: string;
  indication: string;
  differentiation: string;
  expectedMilestone?: string;
  milestoneDate?: string;
}

export interface Citation {
  id: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  keyFinding: string;
}
