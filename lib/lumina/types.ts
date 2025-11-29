export type ViewMode = 'scientist' | 'scout' | 'vc';

export interface EvidenceItem {
  text: string;
  status: 'strong' | 'weak' | 'moderate';
  source: string;
}

export interface DiscoveryEvent {
  date: string;
  event: string;
}

export interface OrganRisk {
  organ: string;
  level: 'high' | 'medium' | 'low';
  notes: string;
}

export interface AdverseEvent {
  event: string;
  allGrade: number; // percentage
  grade3_4: number; // percentage
  related: 'Target' | 'Payload' | 'Both';
  comparator?: number; // percentage vs Padcev
}

export interface SafetyData {
  risks: OrganRisk[];
  aeTable: AdverseEvent[];
}

export interface ValidationMetric {
  category: string;
  score: number;
  maxScore: number;
  status: 'strong' | 'moderate' | 'weak';
  details: string[];
}

export interface SequenceData {
  proteinSequence: string;
  dnaSequence: string;
  mutations: string[];
  domains: string[];
}

export interface ExpressionLevel {
  tissue: string;
  level: number;
  status: 'high' | 'moderate' | 'low';
}

export interface PatientStratification {
  highExpressors: number;
  moderateExpressors: number;
  lowExpressors: number;
}

export interface BiomarkerData {
  expressionLevels: ExpressionLevel[];
  patientStratification: PatientStratification;
  predictiveMarkers: string[];
}

export interface Company {
  id: string;
  name: string;
  ticker?: string;
  assetName?: string; // e.g., "BT8009"
  isPrivate: boolean;
  mechanism: string;
  target?: string;
  stage: string;
  valuation?: number; // in billions
  marketCap?: number; // in billions
  totalRaised?: number; // in millions
  backers?: string[];
  leadInvestor?: string;
  nextMilestone?: string;
  validationScore?: number; // 0-100 for scientist view
  partnership?: string; // for scout view
  // Scientist view fields
  targetBiology?: string; // Summary text
  discoveryTimeline?: DiscoveryEvent[];
  structure?: {
    // ADC structure
    type?: string; // e.g., "Peptide"
    linker?: string; // e.g., "Val-Cit"
    payload?: string; // e.g., "MMAE"
    dar?: number; // Drug-to-Antibody Ratio
    // Radioligand structure
    ligand?: string; // e.g., "PSMA-617"
    chelator?: string; // e.g., "DOTA"
    isotope?: string; // e.g., "Lu-177"
    halflife?: string; // e.g., "6.7 days"
    // Gene Therapy structure
    vector?: string; // e.g., "AAV9"
    promoter?: string; // e.g., "CMV"
    transgene?: string; // e.g., "DMD-Micro"
    route?: string; // e.g., "IT"
  };
  geneticEvidence?: EvidenceItem[];
  clinicalPrecedent?: EvidenceItem[];
  biologicalRationale?: EvidenceItem[];
  // Safety data
  safetyData?: SafetyData;
  // Validation data
  validationMetrics?: ValidationMetric[];
  // Sequence data
  sequenceData?: SequenceData;
  // Biomarker data
  biomarkerData?: BiomarkerData;
}


