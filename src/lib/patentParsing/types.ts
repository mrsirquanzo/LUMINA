/**
 * TypeScript interfaces for patent document parsing
 */

export type DocumentFormat = 'pdf' | 'xml' | 'html' | 'docx' | 'txt' | 'st25' | 'st26';

export type ClaimType = 
  | 'composition_of_matter' 
  | 'method_of_treatment' 
  | 'pharmaceutical_composition' 
  | 'manufacturing_process' 
  | 'diagnostic' 
  | 'kit' 
  | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'requires_review';

export type Modality = 
  | 'small_molecule' 
  | 'monoclonal_antibody' 
  | 'bispecific_antibody' 
  | 'antibody_drug_conjugate' 
  | 'gene_therapy' 
  | 'cell_therapy' 
  | 'rna_therapeutic' 
  | 'protein' 
  | 'peptide' 
  | 'other';

export type NumberingSystem = 'kabat' | 'chothia' | 'imgt' | 'aho' | 'unknown';

export interface DocumentInfo {
  patent_number?: string;
  application_number?: string;
  publication_date?: string;
  priority_date?: string;
  priority_dates?: string[]; // Multiple priorities
  assignee?: string;
  inventors?: string[];
  title?: string;
  classification?: {
    ipc?: string[];
    cpc?: string[];
  };
  extraction_timestamp: string;
  extraction_confidence: number;
  document_format: DocumentFormat;
  language?: string;
}

export interface ClaimElement {
  element_number: number;
  type: 'method_step' | 'subject' | 'administration' | 'dosage' | 'compound' | 'formulation' | 'target' | 'indication' | 'other';
  content: string;
  is_limiting: boolean;
  confidence: number;
}

export interface Claim {
  claim_number: number;
  is_independent: boolean;
  depends_on?: number[]; // Array of claim numbers this depends on
  claim_text: string;
  claim_type: ClaimType;
  elements: ClaimElement[];
  key_limitations: string[];
  confidence: number;
}

export interface ClaimStructure {
  total_claims: number;
  independent_claims: number;
  claims: Claim[];
  dependency_tree: Map<number, number[]>; // claim number -> dependent claims
  claim_type_distribution: Record<ClaimType, number[]>;
}

export interface MarkushVariable {
  variable_name: string;
  position: string;
  options: string[];
  preferred?: string;
  confidence: number;
}

export interface MarkushStructure {
  formula_id: string; // "Formula I", "Formula (A)", etc.
  core_structure?: string; // SMILES or description
  variables: Record<string, MarkushVariable>;
  genus_scope: 'broad' | 'moderate' | 'narrow';
  confidence: number;
}

export interface SmallMolecule {
  compound_id: string;
  name?: string;
  smiles?: string;
  inchi?: string;
  molecular_weight?: number;
  structure_source: 'text' | 'figure' | 'example' | 'claim';
  key_activity?: string;
  claim_coverage?: number[];
  confidence: number;
}

export interface CDRSequence {
  sequence: string;
  seq_id_no?: number;
  numbering_system: NumberingSystem;
  confidence: number;
}

export interface AntibodySequence {
  name: string;
  heavy_chain: {
    hcdr1?: CDRSequence;
    hcdr2?: CDRSequence;
    hcdr3?: CDRSequence;
    vh_full?: CDRSequence;
    framework_regions?: {
      fr1?: string;
      fr2?: string;
      fr3?: string;
      fr4?: string;
    };
  };
  light_chain: {
    lcdr1?: CDRSequence;
    lcdr2?: CDRSequence;
    lcdr3?: CDRSequence;
    vl_full?: CDRSequence;
    framework_regions?: {
      fr1?: string;
      fr2?: string;
      fr3?: string;
      fr4?: string;
    };
  };
  format?: string; // "IgG1", "IgG4", "bispecific", etc.
  fc_modifications?: string[];
  claim_coverage?: number[];
  confidence: number;
}

export interface NucleicAcidSequence {
  seq_id_no: number;
  type: 'dna' | 'rna' | 'mrna' | 'sirna' | 'grna' | 'vector';
  sequence: string;
  length: number;
  description?: string;
  application?: string;
  confidence: number;
}

export interface MolecularData {
  modality: Modality;
  target?: string;
  sequences: {
    antibodies: AntibodySequence[];
    small_molecules: SmallMolecule[];
    nucleic_acids: NucleicAcidSequence[];
  };
  markush_structures?: MarkushStructure[];
}

export interface BiologicalDataPoint {
  compound_id: string;
  assay_type?: string; // Optional for in vivo/clinical data
  target?: string;
  value?: number;
  units?: string;
  cell_line?: string;
  conditions?: string;
  model?: string;
  species?: string;
  dose?: string;
  route?: string;
  endpoint?: string;
  result?: string;
  significance?: string;
  phase?: string;
  indication?: string;
  n?: number;
  confidence: number;
}

export interface BiologicalData {
  in_vitro: BiologicalDataPoint[];
  in_vivo: BiologicalDataPoint[];
  clinical: BiologicalDataPoint[];
}

export interface ValidationFlag {
  level: 'error' | 'warning' | 'info';
  message: string;
  section?: string;
  requires_manual_review: boolean;
}

export interface FTORelevantData {
  genus_scope: 'broad' | 'moderate' | 'narrow';
  design_around_potential?: string;
  key_limitations_for_fto: string[];
  structural_requirements: string[];
}

export interface PatentExtractionResult {
  document_info: DocumentInfo;
  claims_analysis: ClaimStructure;
  molecular_data: MolecularData;
  biological_data: BiologicalData;
  fto_relevant_data?: FTORelevantData;
  validation_flags: ValidationFlag[];
  overall_confidence: number;
}

export interface ExtractionOptions {
  extract_structures?: boolean;
  extract_sequences?: boolean;
  extract_biological_data?: boolean;
  resolve_cross_references?: boolean;
  validate_data?: boolean;
  include_prosecution_history?: boolean;
  include_family_members?: boolean;
}

export interface CrossReference {
  reference_type: 'claim' | 'example' | 'figure' | 'section' | 'sequence';
  source_claim?: number;
  target: string; // "claim 1", "Example 1", "Figure 2", etc.
  resolved?: boolean;
  resolved_content?: any;
  confidence: number;
}

export interface FigureMetadata {
  figure_number: string;
  caption?: string;
  figure_type: 'structure' | 'scheme' | 'graph' | 'table' | 'sequence' | 'other';
  extracted_structures?: string[]; // SMILES from figure
  labels?: Record<string, string>; // Label -> description
  confidence: number;
}
