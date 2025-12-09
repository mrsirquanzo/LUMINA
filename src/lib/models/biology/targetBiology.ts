import { z } from 'zod';

// Enums
export const EvidenceStrength = z.enum(['strong', 'moderate', 'limited', 'insufficient']);
export type EvidenceStrength = z.infer<typeof EvidenceStrength>;

// Genetic Evidence Models
export const GeneticAssociationSchema = z.object({
  disease: z.string(),
  diseaseId: z.string(), // EFO ID
  score: z.number(),
  evidenceTypes: z.array(z.string()), // ["gwas", "gene_burden", "somatic"]
  keyVariants: z.array(z.string()),
  publications: z.array(z.string()), // PMIDs
});

export type GeneticAssociation = z.infer<typeof GeneticAssociationSchema>;

export const ConstraintMetricsSchema = z.object({
  pli: z.number().nullable(), // Probability of LoF intolerance
  loeuf: z.number().nullable(), // LoF observed/expected upper bound
  misZ: z.number().nullable(), // Missense Z-score
  lofVariantsObserved: z.number().default(0),
  lofHomozygotes: z.number().default(0),
  interpretation: z.string().default(''),
});

export type ConstraintMetrics = z.infer<typeof ConstraintMetricsSchema>;

export const GeneticEvidenceSchema = z.object({
  targetSymbol: z.string(),
  associations: z.array(GeneticAssociationSchema).default([]),
  constraint: ConstraintMetricsSchema.nullable(),
  mendelianDiseases: z.array(z.string()).default([]),
  overallValidationScore: z.number().default(0), // 0-1 normalized
  validationStrength: EvidenceStrength.default('insufficient'),
  summary: z.string().default(''),
});

export type GeneticEvidence = z.infer<typeof GeneticEvidenceSchema>;

// Druggability Models
export const ChemicalMatterSchema = z.object({
  chemblId: z.string(),
  compoundName: z.string().nullable(),
  maxPhase: z.number().min(0).max(4).default(0),
  activityType: z.string().default(''), // IC50, Ki, etc.
  activityValue: z.number().nullable(),
  activityUnit: z.string().default(''),
  mechanism: z.string().nullable(),
});

export type ChemicalMatter = z.infer<typeof ChemicalMatterSchema>;

export const DruggabilityAssessmentSchema = z.object({
  targetSymbol: z.string(),
  uniprotId: z.string().default(''),
  proteinClass: z.string().default(''), // kinase, GPCR, ion channel, etc.
  subcellularLocation: z.array(z.string()).default([]),
  hasStructure: z.boolean().default(false),
  pdbIds: z.array(z.string()).default([]),
  alphafoldConfidence: z.number().nullable(),
  existingCompounds: z.array(ChemicalMatterSchema).default([]),
  tractabilityBucket: z.string().default(''),
  recommendedModalities: z.array(z.string()).default([]),
  druggabilitySummary: z.string().default(''),
});

export type DruggabilityAssessment = z.infer<typeof DruggabilityAssessmentSchema>;

// Literature Models
export const PublicationSchema = z.object({
  pmid: z.string(),
  title: z.string(),
  authors: z.string(),
  journal: z.string(),
  year: z.number(),
  abstract: z.string().default(''),
  relevanceScore: z.number().default(0),
  keyFindings: z.string().default(''), // LLM-extracted
});

export type Publication = z.infer<typeof PublicationSchema>;

export const LiteratureSynthesisSchema = z.object({
  targetSymbol: z.string(),
  indication: z.string().nullable(),
  totalPublications: z.number().default(0),
  publicationTrend: z.string().default(''), // increasing, stable, declining
  keyPublications: z.array(PublicationSchema).default([]),
  mechanisticSummary: z.string().default(''), // LLM-synthesized
  preclinicalEvidence: z.string().default(''), // LLM-synthesized
  keyResearchers: z.array(z.string()).default([]),
  evidenceGaps: z.array(z.string()).default([]),
});

export type LiteratureSynthesis = z.infer<typeof LiteratureSynthesisSchema>;

// Safety Models
export const SafetyAssessmentSchema = z.object({
  targetSymbol: z.string(),
  geneticSafetySignals: z.array(z.string()).default([]),
  broadExpressionConcern: z.boolean().default(false),
  expressionTissues: z.array(z.string()).default([]),
  mechanismBasedRisks: z.array(z.string()).default([]),
  safetySummary: z.string().default(''),
});

export type SafetyAssessment = z.infer<typeof SafetyAssessmentSchema>;

// Main Report Model
export const TargetAssessmentReportSchema = z.object({
  targetSymbol: z.string(),
  indication: z.string().nullable(),
  assessmentDate: z.string(),
  geneticEvidence: GeneticEvidenceSchema.nullable(),
  druggability: DruggabilityAssessmentSchema.nullable(),
  literature: LiteratureSynthesisSchema.nullable(),
  safety: SafetyAssessmentSchema.nullable(),
  overallRecommendation: z.string().default(''),
  keyRisks: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  executiveSummary: z.string().default(''), // LLM-generated 2-3 paragraph summary
});

export type TargetAssessmentReport = z.infer<typeof TargetAssessmentReportSchema>;

// Depth options for assessments
export const AssessmentDepth = z.enum(['quick', 'standard', 'comprehensive']);
export type AssessmentDepth = z.infer<typeof AssessmentDepth>;
