import type {
  ValidationScore,
  DruggabilityScore,
  SafetyScore,
  TherapeuticWindow,
  Recommendation,
  OpportunityRating,
  StrategicFit,
  CompetitiveIntensity,
  IPPosition,
  DealActivity,
  ClinicalActivity,
  GWASAssociation,
  ConstraintMetrics,
  ExpressionTissue,
  TumorExpression,
  ClinicalTrial,
  Patent,
  ComparableDeal,
  Competitor,
  Citation,
  Persona,
} from '../types';

// ============================================
// SCIENTIST PERSONA DATA
// ============================================

export const SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 82,
  recommendation: 'Advance' as Recommendation,
  confidenceLevel: 0.85,
  dataFreshness: '2024-01-15',
  summaryText:
    "TROP2 (TACSTD2) represents a well-validated oncology target with strong clinical precedent. FDA-approved ADC (Trodelvy) demonstrates proof-of-concept with 35% ORR in metastatic TNBC. High differential expression (8.2x fold-change in TNBC) and favorable therapeutic window support multiple modalities. Key risks include on-target toxicity in skin/mucosa and competitive landscape with Trodelvy and Dato-DXd advancing.",
  quickMetrics: {
    geneticValidation: 'Moderate' as ValidationScore,
    therapeuticWindow: 'Favorable' as TherapeuticWindow,
    druggability: 'High' as DruggabilityScore,
    safetyProfile: 'Manageable' as SafetyScore,
  },
  keyStrengths: [
    'FDA-approved ADC (Trodelvy) validates mechanism',
    'High differential expression in TNBC (8.2x fold-change)',
    'Multiple modalities feasible (ADC, bispecific, CAR-T)',
    'Strong clinical activity signal (ORR 31-35%)',
    'High antigen density and rapid internalization ideal for ADCs',
  ],
  keyRisks: [
    'On-target toxicity in skin/mucosa (high normal expression)',
    'Crowded competitive landscape with Trodelvy, Dato-DXd',
    'TACSTD2 LoF linked to corneal dystrophy - requires monitoring',
    'Limited genetic validation (no strong GWAS associations)',
    'ILD signal observed with some ADC payloads',
  ],
  weightedScoring: {
    genetic: { score: 65, weight: 0.2 },
    expression: { score: 88, weight: 0.25 },
    druggability: { score: 90, weight: 0.2 },
    safety: { score: 72, weight: 0.2 },
    clinical: { score: 95, weight: 0.15 },
  },
};

export const GENETIC_VALIDATION_DATA = {
  validationScore: 'Moderate' as ValidationScore,
  validationSummary:
    "TROP2 shows moderate genetic validation. While no strong GWAS associations link TROP2 directly to cancer risk, loss-of-function variants cause gelatinous drop-like corneal dystrophy (GDLD), confirming biological relevance. Constraint metrics (pLI 0.12, LOEUF 0.89) indicate moderate tolerance to loss-of-function. Homozygous LoF carriers develop corneal dystrophy but show no increased cancer risk, suggesting systemic inhibition may be tolerable with appropriate monitoring.",
  gwasAssociations: [
    {
      disease: 'Breast Cancer',
      score: 0.3,
      evidenceType: 'GWAS' as const,
      keyVariants: ['rs1234567'],
      effectSize: 1.08,
      pValue: '1.2e-4',
    },
    {
      disease: 'NSCLC',
      score: 0.25,
      evidenceType: 'GWAS' as const,
      keyVariants: ['rs7654321'],
      effectSize: 1.05,
      pValue: '3.8e-3',
    },
    {
      disease: 'Corneal Dystrophy (GDLD)',
      score: 0.95,
      evidenceType: 'Mendelian' as const,
      keyVariants: ['Q118X', 'c.551delT', 'R158Q'],
      effectSize: undefined,
      pValue: undefined,
    },
  ] as GWASAssociation[],
  constraintMetrics: {
    pLI: 0.12,
    LOEUF: 0.89,
    lofObserved: 45,
    lofExpected: 52,
    homozygousCarriers: 3,
  } as ConstraintMetrics,
  mendelianDiseases: ['Gelatinous Drop-like Corneal Dystrophy (GDLD)'],
  directionOfEffect: 'Inhibition/degradation reduces tumor cell survival',
  biobankEvidence: [
    {
      source: 'UK Biobank',
      finding: 'No significant associations with cancer incidence',
    },
    {
      source: 'FinnGen',
      finding: 'Weak association with epithelial cancers (OR 1.03, 95% CI 0.98-1.08)',
    },
    {
      source: 'BioBank Japan',
      finding: 'No significant associations in Japanese population',
    },
  ],
  lofCarrierPhenotypes:
    "Homozygous LoF carriers develop GDLD (corneal opacity) but show no increased cancer risk, suggesting inhibition may be tolerable with ophthalmic monitoring. Heterozygous carriers are asymptomatic.",
};

export const DRUGGABILITY_DATA = {
  druggabilityScore: 'High' as DruggabilityScore,
  targetClass: 'Cell Surface Glycoprotein',
  localization: 'Membrane (extracellular domain accessible)',
  structuralData: {
    pdbCount: 4,
    alphafoldConfidence: 92,
    ligandBoundStructures: 2,
    bindingPockets: ['EGF-like domain', 'Thyroglobulin type-1 domain'],
    uniprotId: 'P09758',
    proteinLength: 323,
    transmembraneDomains: 1,
  },
  existingCompounds: [
    {
      name: 'Sacituzumab govitecan (Trodelvy)',
      phase: 'Approved',
      mechanism: 'ADC (SN-38, Topo-1 inhibitor)',
      activity: 'ORR 31-35% in mTNBC',
      dar: 7.6,
      linker: 'CL2A (pH-sensitive)',
    },
    {
      name: 'Datopotamab deruxtecan (Dato-DXd)',
      phase: 'Phase 3',
      mechanism: 'ADC (DXd, Topo-1 inhibitor)',
      activity: 'ORR 26% in mTNBC, 26% in NSCLC',
      dar: 4,
      linker: 'Tetrapeptide-based (protease-cleavable)',
    },
    {
      name: 'SKB264 (MK-2870)',
      phase: 'Phase 3',
      mechanism: 'ADC (belotecan, Topo-1 inhibitor)',
      activity: 'ORR 39% in mTNBC',
      dar: 6,
      linker: 'Proprietary',
    },
    {
      name: 'TROP2-CAR-T (multiple)',
      phase: 'Preclinical/Phase 1',
      mechanism: 'CAR-T cell therapy',
      activity: 'Early data pending',
      dar: undefined,
      linker: undefined,
    },
  ],
  tractabilityAssessment:
    'Highly tractable for antibody-based approaches. Extracellular domain is well-characterized with multiple epitopes validated. High internalization rate (t1/2 ~15min) makes it ideal for ADC payloads. Crystal structures available for rational design. No small molecule approaches viable due to lack of enzymatic activity.',
  modalityRecommendations: [
    {
      modality: 'ADC',
      feasibility: 'High',
      rationale: 'Proven with Trodelvy; high internalization rate (~15min t1/2); multiple validated payloads',
    },
    {
      modality: 'Bispecific',
      feasibility: 'Medium',
      rationale: 'T-cell engagement possible but efficacy unproven; normal tissue expression is concern',
    },
    {
      modality: 'CAR-T',
      feasibility: 'Medium',
      rationale: 'Normal tissue expression is concern; may need safety switches or regional delivery',
    },
    {
      modality: 'Small Molecule',
      feasibility: 'Low',
      rationale: 'No enzymatic activity; no druggable pocket; extracellular domain not amenable to small molecules',
    },
    {
      modality: 'Antibody-Drug Conjugate (Next-gen)',
      feasibility: 'High',
      rationale: 'Optimize linker-payload combination for improved safety/efficacy',
    },
  ],
  selectivityConsiderations:
    'TROP2 is unique in the TACSTD family. TROP1 (EPCAM) is distinct with different tissue distribution. Limited off-target concerns from selectivity standpoint. Cross-reactivity assessment shows minimal binding to related proteins.',
  historicalAttrition:
    'No historical small molecule failures (not attempted). ADC programs have succeeded when payload optimized. Naked antibody approaches (DS-1062a precursor) showed insufficient efficacy, validating ADC approach.',
};

export const EXPRESSION_DATA = {
  therapeuticWindowScore: 'Favorable' as TherapeuticWindow,
  bestIndication: { name: 'Triple-Negative Breast Cancer', foldChange: 8.2, rank: 1 },
  adcSuitability: {
    score: 'High',
    antigenDensity: '150,000 copies/cell (median in TNBC)',
    internalizationRate: 't1/2 ~15 min (fast)',
    recyclingVsDegradation: 'Primarily degraded (favorable for ADC payload release)',
    membraneHalfLife: '~2 hours',
  },
  gtexNormalTissues: [
    { name: 'Skin', tpm: 245, isSafetyOrgan: true, category: 'skin' as const },
    { name: 'Esophagus Mucosa', tpm: 198, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Bladder', tpm: 156, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Cervix Uteri', tpm: 134, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Vagina', tpm: 127, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Colon Transverse', tpm: 89, isSafetyOrgan: false, category: 'gi' as const },
    { name: 'Breast', tpm: 42, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Lung', tpm: 38, isSafetyOrgan: true, category: 'lung' as const },
    { name: 'Prostate', tpm: 35, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Kidney Cortex', tpm: 28, isSafetyOrgan: true, category: 'kidney' as const },
    { name: 'Stomach', tpm: 24, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Pancreas', tpm: 18, isSafetyOrgan: true, category: 'other' as const },
    { name: 'Liver', tpm: 12, isSafetyOrgan: true, category: 'liver' as const },
    { name: 'Heart Left Ventricle', tpm: 3, isSafetyOrgan: true, category: 'heart' as const },
    { name: 'Brain Cortex', tpm: 1, isSafetyOrgan: true, category: 'brain' as const },
    { name: 'Skeletal Muscle', tpm: 2, isSafetyOrgan: false, category: 'other' as const },
  ] as ExpressionTissue[],
  tcgaTumorExpression: [
    {
      tumorType: 'TNBC',
      tcgaCode: 'BRCA',
      medianTPM: 892,
      percentileRank: 95,
      sampleCount: 187,
    },
    {
      tumorType: 'NSCLC (Adeno)',
      tcgaCode: 'LUAD',
      medianTPM: 456,
      percentileRank: 82,
      sampleCount: 515,
    },
    {
      tumorType: 'NSCLC (Squamous)',
      tcgaCode: 'LUSC',
      medianTPM: 523,
      percentileRank: 88,
      sampleCount: 501,
    },
    {
      tumorType: 'Urothelial',
      tcgaCode: 'BLCA',
      medianTPM: 634,
      percentileRank: 91,
      sampleCount: 408,
    },
    {
      tumorType: 'Pancreatic Adenocarcinoma',
      tcgaCode: 'PAAD',
      medianTPM: 267,
      percentileRank: 68,
      sampleCount: 178,
    },
    {
      tumorType: 'Ovarian Serous',
      tcgaCode: 'OV',
      medianTPM: 389,
      percentileRank: 75,
      sampleCount: 379,
    },
    {
      tumorType: 'Gastric Adenocarcinoma',
      tcgaCode: 'STAD',
      medianTPM: 312,
      percentileRank: 72,
      sampleCount: 415,
    },
    {
      tumorType: 'Colorectal Adenocarcinoma',
      tcgaCode: 'COAD',
      medianTPM: 298,
      percentileRank: 70,
      sampleCount: 457,
    },
    {
      tumorType: 'Head and Neck SCC',
      tcgaCode: 'HNSC',
      medianTPM: 445,
      percentileRank: 80,
      sampleCount: 520,
    },
    {
      tumorType: 'Prostate Adenocarcinoma',
      tcgaCode: 'PRAD',
      medianTPM: 234,
      percentileRank: 65,
      sampleCount: 497,
    },
  ] as TumorExpression[],
  foldChangeData: [
    { indication: 'TNBC', tumorTPM: 892, normalTPM: 42, foldChange: 21.2 },
    { indication: 'NSCLC', tumorTPM: 489, normalTPM: 38, foldChange: 12.9 },
    { indication: 'Urothelial', tumorTPM: 634, normalTPM: 156, foldChange: 4.1 },
    { indication: 'Ovarian', tumorTPM: 389, normalTPM: 67, foldChange: 5.8 },
    { indication: 'Pancreatic', tumorTPM: 267, normalTPM: 18, foldChange: 14.8 },
    { indication: 'Gastric', tumorTPM: 312, normalTPM: 24, foldChange: 13.0 },
  ],
  genomicAlterations: {
    amplificationFrequency: { BRCA: 8, LUAD: 5, BLCA: 12, OV: 6, PAAD: 4 },
    mutationFrequency: { BRCA: 2, LUAD: 3, BLCA: 4, OV: 1, PAAD: 2 },
    hotspotMutations: ['None significant'],
    fusionEvents: ['None reported'],
    copyNumberGain: {
      BRCA: 12,
      LUAD: 8,
      BLCA: 15,
      OV: 9,
      PAAD: 6,
    },
  },
};

export const MECHANISTIC_DATA = {
  pathwayContext:
    'TROP2 is a transmembrane glycoprotein that transduces intracellular calcium signals via PIP2 cleavage. It activates ERK/MAPK and PI3K/AKT pathways, promoting cell proliferation, migration, and survival. Overexpression correlates with EMT and metastatic potential. TROP2 clustering triggers ADAM17-mediated ectodomain shedding, releasing soluble TROP2 that may have paracrine signaling effects.',
  mechanismSummary:
    'Upon ligand binding or clustering, TROP2 activates ADAM17-mediated ectodomain shedding, releasing the intracellular domain that translocates to the nucleus and modulates gene expression. Extracellular domain shedding releases soluble TROP2 that may act as a decoy or signaling molecule. The truncated intracellular domain activates calcium signaling and downstream pathways including ERK/MAPK, PI3K/AKT, and NF-κB, promoting pro-survival and pro-migratory programs.',
  keyPublications: [
    {
      id: 1,
      title: 'TROP2 as a therapeutic target in solid tumors',
      authors: 'Goldenberg DM, Sharkey RM',
      journal: 'Nature Reviews Drug Discovery',
      year: 2022,
      doi: '10.1038/s41573-022-00453-1',
      pmid: '35217756',
      keyFinding:
        'Comprehensive review establishing TROP2 as validated ADC target with summary of clinical development landscape',
    },
    {
      id: 2,
      title: 'Sacituzumab govitecan in metastatic triple-negative breast cancer',
      authors: 'Bardia A, Hurvitz SA, Tolaney SM, et al.',
      journal: 'NEJM',
      year: 2021,
      pmid: '33882206',
      keyFinding:
        'Phase 3 ASCENT trial: ORR 35%, mPFS 5.6mo vs 1.7mo (HR 0.41), mOS 12.1mo vs 6.7mo (HR 0.48)',
    },
    {
      id: 3,
      title: 'TROP2 structure and function: implications for therapeutic targeting',
      authors: 'Cubas R, Li M, Chen C, Yao Q',
      journal: 'Molecular Cancer',
      year: 2020,
      pmid: '32811599',
      keyFinding: 'Crystal structure revealing antibody binding epitopes and mechanism of signal transduction',
    },
    {
      id: 4,
      title: 'TROP2 promotes proliferation, migration, and invasion of gastric cancer',
      authors: 'Zeng P, Li J, Chen Y, et al.',
      journal: 'Journal of Experimental & Clinical Cancer Research',
      year: 2019,
      pmid: '31842940',
      keyFinding: 'Mechanistic studies showing TROP2 activates PI3K/AKT pathway and promotes EMT',
    },
    {
      id: 5,
      title: 'TROP2 overexpression correlates with poor prognosis in NSCLC',
      authors: 'Inamura K, Yokouchi Y, Kobayashi M, et al.',
      journal: 'Lung Cancer',
      year: 2017,
      pmid: '28838383',
      keyFinding: 'IHC analysis of 342 NSCLC samples showing TROP2 expression correlates with stage and survival',
    },
  ] as Citation[],
  preclinicalEvidence:
    'Xenograft studies consistently show tumor growth inhibition with anti-TROP2 ADCs. Efficacy correlates with TROP2 expression levels (IHC H-score >100 associated with better responses). Combination with checkpoint inhibitors shows synergy in syngeneic models. Patient-derived xenograft (PDX) studies confirm activity across multiple tumor types including TNBC, NSCLC, and urothelial cancer.',
  keyResearchers: [
    'David Goldenberg (Immunomedics/Gilead)',
    'Aditya Bardia (MGH/Harvard)',
    'Koichi Nagata (Daiichi Sankyo)',
    'Hans-Peter Gerber (Immunomedics)',
    'Antoine Yver (AstraZeneca)',
  ],
  evidenceGaps: [
    'Optimal payload for safety/efficacy balance unclear (Topo-1 vs others)',
    'Biomarkers for patient selection beyond IHC not established',
    'Resistance mechanisms poorly characterized',
    'Role of soluble TROP2 in disease progression unknown',
    'Optimal DAR and linker chemistry still being optimized',
  ],
  publicationTrend: [
    { year: 2015, count: 45 },
    { year: 2016, count: 52 },
    { year: 2017, count: 68 },
    { year: 2018, count: 89 },
    { year: 2019, count: 124 },
    { year: 2020, count: 187 },
    { year: 2021, count: 256 },
    { year: 2022, count: 312 },
    { year: 2023, count: 378 },
    { year: 2024, count: 145 }, // Partial year
  ],
};

export const CLINICAL_PRECEDENT_DATA = {
  clinicalActivityScore: 'Validated' as ClinicalActivity,
  programsSummary: { total: 28, active: 15, approved: 1, failed: 4, terminated: 8 },
  clinicalTrials: [
    {
      nctId: 'NCT02574455',
      title: 'ASCENT Trial',
      phase: 'Phase 3',
      status: 'Completed' as const,
      sponsor: 'Immunomedics/Gilead',
      indication: 'mTNBC',
      startDate: '2015-10-01',
      expectedReadout: undefined,
      results: {
        orr: '35%',
        pfs: '5.6 mo (vs 1.7 mo control)',
        os: '12.1 mo (vs 6.7 mo control)',
        safetyNotes: 'Neutropenia 51%, diarrhea 59%, nausea 66% (all grades)',
      },
    },
    {
      nctId: 'NCT04656652',
      title: 'TROPION-Breast01',
      phase: 'Phase 3',
      status: 'Active' as const,
      sponsor: 'Daiichi Sankyo/AstraZeneca',
      indication: 'HR+/HER2- BC',
      startDate: '2020-12-01',
      expectedReadout: 'Q2 2024',
      results: undefined,
    },
    {
      nctId: 'NCT04656626',
      title: 'TROPION-Lung01',
      phase: 'Phase 3',
      status: 'Active' as const,
      sponsor: 'Daiichi Sankyo/AstraZeneca',
      indication: 'NSCLC',
      startDate: '2021-01-15',
      expectedReadout: 'Q3 2024',
      results: undefined,
    },
    {
      nctId: 'NCT04152499',
      title: 'Trodelvy in Urothelial Cancer',
      phase: 'Phase 2',
      status: 'Active' as const,
      sponsor: 'Gilead',
      indication: 'mUC',
      startDate: '2019-11-01',
      expectedReadout: 'Q4 2024',
      results: {
        orr: '27%',
        pfs: '5.4 mo',
        os: '10.9 mo',
        safetyNotes: 'Similar safety profile to TNBC indication',
      },
    },
    {
      nctId: 'NCT05215340',
      title: 'SKB264 Phase 3 Trial',
      phase: 'Phase 3',
      status: 'Recruiting' as const,
      sponsor: 'Kelun-Biotech/Merck',
      indication: 'mTNBC',
      startDate: '2022-03-01',
      expectedReadout: 'Q1 2025',
      results: undefined,
    },
  ] as ClinicalTrial[],
  keyFindings:
    "Trodelvy (sacituzumab govitecan) approval validates TROP2 as ADC target. ORR ~35% in heavily pretreated mTNBC with manageable neutropenia and diarrhea. Dato-DXd showing differentiated safety profile with lower GI toxicity but ILD signal (3% incidence). Phase 1/2 data suggests dose-response relationship with higher DAR correlating with efficacy but also toxicity.",
  failedApproaches: [
    {
      approach: 'Naked antibody (DS-1062a precursor)',
      reason: 'Insufficient efficacy without payload; development discontinued in favor of ADC',
    },
    {
      approach: 'Low DAR ADC (<4)',
      reason: 'Suboptimal efficacy; higher DAR preferred for adequate payload delivery',
    },
    {
      approach: 'Non-cleavable linker with stable payloads',
      reason: 'Insufficient payload release in tumor microenvironment; cleavable linkers superior',
    },
  ],
  translationalInsights:
    'Patient selection by IHC (H-score >100) enriches responders. Topo-1 inhibitor payloads most effective based on current data. Linker stability critical for safety profile - pH-sensitive and protease-cleavable linkers both viable. High antigen density (>50,000 copies/cell) associated with better responses.',
};

export const SAFETY_DATA = {
  safetyScore: 'Manageable' as SafetyScore,
  geneticSafetySignals: [
    {
      signal: 'TACSTD2 LoF causes gelatinous drop-like corneal dystrophy (GDLD)',
      severity: 'Medium',
      implication: 'Requires ophthalmic monitoring in trials; corneal exams recommended',
    },
    {
      signal: 'Homozygous LoF carriers otherwise healthy (no systemic issues)',
      severity: 'Low',
      implication: 'Systemic TROP2 inhibition may be tolerable with monitoring',
    },
    {
      signal: 'No increased cancer risk in LoF carriers',
      severity: 'Low',
      implication: 'Targeting TROP2 unlikely to increase cancer risk',
    },
  ],
  expressionConcerns: [
    {
      organ: 'Skin',
      expression: 'High (245 TPM)',
      concern: 'Rash, alopecia observed with ADCs',
      severity: 'High',
      clinicalManifestation: 'Maculopapular rash (Grade 1-2 in 40-50%), alopecia (20-30%)',
    },
    {
      organ: 'GI Mucosa (Esophagus)',
      expression: 'High (198 TPM)',
      concern: 'Stomatitis, diarrhea common',
      severity: 'High',
      clinicalManifestation: 'Stomatitis (Grade 1-2 in 50-60%), diarrhea (Grade 1-2 in 55-65%)',
    },
    {
      organ: 'Lung',
      expression: 'Moderate (38 TPM)',
      concern: 'ILD signal with some ADCs (Dato-DXd)',
      severity: 'Medium',
      clinicalManifestation: 'Interstitial lung disease (3-5% with Dato-DXd, <1% with Trodelvy)',
    },
    {
      organ: 'Bladder',
      expression: 'Moderate-High (156 TPM)',
      concern: 'Bladder irritation possible',
      severity: 'Low',
      clinicalManifestation: 'Hematuria rare (<5%)',
    },
  ],
  knockoutPhenotypes: {
    mouse: 'Viable, fertile. Mild skin barrier defects. No tumors or systemic pathology. Life expectancy normal.',
    human: 'Homozygous LoF: corneal dystrophy only (GDLD). No systemic issues. Heterozygous carriers asymptomatic.',
  },
  mechanismBasedRisks: [
    'On-target toxicity in TROP2-expressing normal epithelia (skin, GI mucosa)',
    'Payload-related toxicity (neutropenia with Topo-1 inhibitors)',
    'Potential for cumulative toxicity with chronic dosing',
    'Corneal changes requiring ophthalmic monitoring',
  ],
  classSafetyHistory: [
    {
      drug: 'Trodelvy (sacituzumab govitecan)',
      safetyProfile:
        'Neutropenia (51% all grades, 11% G3-4), diarrhea (59% all grades, 10% G3-4), nausea (66%), fatigue (50%)',
      mitigation: 'G-CSF prophylaxis, anti-emetics, dose delays/reductions',
      mtf: '10 mg/kg q2w',
    },
    {
      drug: 'Dato-DXd (datopotamab deruxtecan)',
      safetyProfile:
        'Stomatitis (56% all grades, 6% G3), ILD (3% all grades, 1% G3-4), nausea (45%), fatigue (42%)',
      mitigation: 'Dose modification, ILD monitoring (CT scans), oral care',
      mtf: '6 mg/kg q3w',
    },
    {
      drug: 'SKB264',
      safetyProfile: 'Similar to Trodelvy profile; detailed data pending from Phase 3',
      mitigation: 'Standard supportive care',
      mtf: '5 mg/kg q2w',
    },
  ],
  therapeuticIndex: {
    estimate: '3-5x',
    basis: 'Based on tumor vs. skin expression differential (21x in TNBC) and clinical MTD data. Actual window depends on payload properties.',
  },
  monitoringRequirements: [
    'Ophthalmic exams (corneal) - baseline and q6mo',
    'CBCs (neutropenia) - q cycle',
    'Chest imaging (ILD) - baseline and q6-8 weeks',
    'Skin assessments (rash) - q cycle',
    'GI symptom monitoring (diarrhea, stomatitis) - continuous',
  ],
};

export const KEY_EXPERIMENTS_DATA = {
  evidenceGaps: [
    {
      gap: 'Optimal linker chemistry for safety profile',
      priority: 'High',
      type: 'Technical',
      description: 'Compare cleavable vs non-cleavable, pH-sensitive vs protease-cleavable',
    },
    {
      gap: 'Biomarker for patient selection beyond IHC',
      priority: 'High',
      type: 'Translational',
      description: 'Identify genomic or proteomic markers that predict response',
    },
    {
      gap: 'Resistance mechanism understanding',
      priority: 'Medium',
      type: 'Biology',
      description: 'Characterize how tumors develop resistance to TROP2 ADCs',
    },
    {
      gap: 'Combination rationale with IO',
      priority: 'Medium',
      type: 'Clinical',
      description: 'Validate synergy and define optimal sequencing/combinations',
    },
    {
      gap: 'Optimal DAR for safety/efficacy',
      priority: 'Medium',
      type: 'Technical',
      description: 'Define sweet spot between payload delivery and toxicity',
    },
  ],
  recommendedExperiments: [
    {
      experiment: 'Comparative linker stability assay',
      priority: 'High',
      timeline: '3 months',
      rationale:
        'Define optimal linker for safety profile - assess plasma stability, tumor microenvironment cleavage, and off-target release',
      resourceEstimate: '2 FTE, $150K',
      deliverables: ['Linker stability data', 'Recommended linker chemistry', 'Safety predictions'],
    },
    {
      experiment: 'IHC validation across indications',
      priority: 'High',
      timeline: '2 months',
      rationale:
        'Confirm expression differential for patient selection - establish H-score cutoffs for each indication',
      resourceEstimate: '1 FTE, $75K',
      deliverables: ['IHC data across 500+ samples', 'H-score cutoffs', 'Prevalence estimates'],
    },
    {
      experiment: 'Syngeneic combo study with anti-PD1',
      priority: 'Medium',
      timeline: '4 months',
      rationale:
        'Support combination development strategy - demonstrate synergy in immune-competent models',
      resourceEstimate: '3 FTE, $200K',
      deliverables: ['Combo efficacy data', 'Immune profiling', 'Rationale for clinical combo'],
    },
    {
      experiment: 'PDX panel across tumor types',
      priority: 'High',
      timeline: '6 months',
      rationale:
        'Predictive models for patient selection - correlate expression with response across diverse models',
      resourceEstimate: '4 FTE, $300K',
      deliverables: ['PDX response data', 'Biomarker correlations', 'Go/no-go recommendations'],
    },
  ],
  goNoGoCriteria: {
    advanceIf: [
      'Linker shows <10% premature release in plasma stability assay (24h)',
      'IHC confirms >5x fold-change in target indication vs normal tissue',
      'In vivo TGI >60% at tolerated dose in PDX models',
      'No mechanism-based toxicity in safety organs at efficacious dose',
      'H-score >100 enriches for responders (preliminary data)',
    ],
    stopIf: [
      'Linker instability causes >Grade 3 off-target toxicity in NHP studies',
      'No correlation between expression and response in PDX panel',
      'Mechanism-based toxicity in safety organs at efficacious dose',
      'Efficacy <50% of Trodelvy at similar doses',
      'IP/FTO issues cannot be resolved',
    ],
  },
  resourceEstimate: 'Total: 10 FTE-months, ~$725K for full de-risking package',
  timelineToDecision: '6 months to go/no-go on lead candidate',
};

// ============================================
// SCOUT/BD PERSONA DATA
// ============================================

export const BD_EXECUTIVE_SUMMARY = {
  opportunityRating: 'Attractive' as OpportunityRating,
  strategicFit: 'Strong Fit' as StrategicFit,
  summaryText:
    "TargetCo's TROP2 ADC represents a compelling BD opportunity with differentiated safety profile versus market leader Trodelvy. Phase 1 data suggests improved therapeutic index via novel linker technology. Strong strategic fit with our oncology portfolio, filling gap in ADC capabilities. Market opportunity ~$5.2B by 2030 with multiple expansion opportunities.",
  quickMetrics: {
    developmentStage: 'Phase 1/2',
    patentLife: '2038',
    marketOpportunity: '$5.2B (2030 TAM)',
    competitivePosition: 'Best-in-class potential',
    totalDealValue: '$1.5-2.5B estimated',
  },
  keyValueDrivers: [
    'Differentiated safety profile (lower GI toxicity vs Trodelvy)',
    'Novel cleavable linker (proprietary IP through 2038)',
    'Broad indication potential (TNBC, NSCLC, UC)',
    'Phase 1 data shows comparable efficacy with better tolerability',
    'Experienced team with ADC development track record',
  ],
  keyRisks: [
    'Phase 1 data limited (n=42, single-arm)',
    'Crowded competitive landscape (Trodelvy, Dato-DXd, SKB264)',
    'Execution risk vs. Daiichi Sankyo resources',
    'Regulatory pathway depends on differentiation story',
    'Manufacturing scalability unproven at commercial scale',
  ],
  recommendedAction: 'Pursue CDA and request data room access',
  valuationRange: '$1.5-2.5B total deal value',
};

export const COMPETITIVE_LANDSCAPE_DATA = {
  competitiveIntensity: 'Crowded' as CompetitiveIntensity,
  competitors: [
    {
      company: 'Gilead/Immunomedics',
      asset: 'Trodelvy (sacituzumab govitecan)',
      modality: 'ADC (SN-38)',
      stage: 'Approved',
      indication: 'mTNBC, mUC',
      differentiation: 'Market leader, broad label, first-mover advantage',
      expectedMilestone: 'Additional indications (NSCLC, HR+ BC)',
      milestoneDate: '2024-2025',
    },
    {
      company: 'Daiichi Sankyo/AstraZeneca',
      asset: 'Dato-DXd (datopotamab deruxtecan)',
      modality: 'ADC (DXd)',
      stage: 'Phase 3',
      indication: 'TNBC, NSCLC, HR+ BC',
      differentiation: 'DXd platform, differentiated safety (lower GI, but ILD signal)',
      expectedMilestone: 'TROPION-Breast01 and -Lung01 readouts',
      milestoneDate: 'Q2-Q3 2024',
    },
    {
      company: 'Kelun-Biotech/Merck',
      asset: 'SKB264 (MK-2870)',
      modality: 'ADC (belotecan)',
      stage: 'Phase 3',
      indication: 'TNBC',
      differentiation: 'Fast follower, China market focus, Merck partnership',
      expectedMilestone: 'Phase 3 readout, global partnership expansion',
      milestoneDate: '2024-2025',
    },
    {
      company: 'Multiple (preclinical)',
      asset: 'Various TROP2-CAR-T',
      modality: 'CAR-T',
      stage: 'Preclinical/Phase 1',
      indication: 'Multiple',
      differentiation: 'Different modality, normal tissue expression concern',
      expectedMilestone: 'Early clinical data',
      milestoneDate: '2025-2026',
    },
  ] as Competitor[],
  differentiationAnalysis:
    "Market is coalescing around Topo-1 inhibitor payloads. Differentiation opportunity lies in linker technology (stability, cleavability) and safety profile optimization. Dato-DXd ILD signal creates opening for safer alternative. TargetCo's novel linker shows promise for improved GI tolerability while maintaining efficacy.",
  competitiveRisks: [
    'Trodelvy label expansion could capture additional market share',
    'Dato-DXd Phase 3 success would raise efficacy bar',
    'Chinese competitors may commoditize market with lower pricing',
    'Combination studies with IO could change competitive dynamics',
    'Next-generation ADCs with improved payloads could emerge',
  ],
  whiteSpaceOpportunities: [
    {
      opportunity: 'IO-resistant TNBC patients',
      rationale: 'Underserved segment post checkpoint inhibitor failure; no approved TROP2 in this setting',
    },
    {
      opportunity: 'Maintenance therapy',
      rationale: 'No approved TROP2 agent in maintenance setting; could expand patient pool significantly',
    },
    {
      opportunity: 'First-line TNBC',
      rationale: 'Trodelvy currently approved in later lines; first-line represents larger market',
    },
    {
      opportunity: 'Combination with PARP inhibitors',
      rationale: 'Preclinical synergy data suggests combination opportunities',
    },
  ],
};

export const IP_FTO_DATA = {
  ipPosition: 'Moderate' as IPPosition,
  patentSummary:
    "TargetCo holds composition-of-matter patents on their specific ADC construct through 2038. Linker technology is proprietary with patent protection in major markets. Some FTO concerns around method-of-treatment patents held by Gilead, but preliminary analysis suggests design-around possible.",
  keyPatents: [
    {
      patentNumber: 'US11,234,567',
      title: 'TROP2-targeting ADC with novel linker-payload combination',
      owner: 'TargetCo',
      type: 'Composition' as const,
      filingDate: '2018-03-15',
      expiryDate: '2038-03-15',
      relevance: 'High' as const,
      claims: [
        'Specific antibody sequence (CDR sequences)',
        'Linker-payload combination (novel cleavable linker + Topo-1 inhibitor)',
        'DAR range (4-8)',
      ],
    },
    {
      patentNumber: 'US10,987,654',
      title: 'Methods of treating TNBC with TROP2 ADC',
      owner: 'Gilead Sciences',
      type: 'Method' as const,
      filingDate: '2016-08-22',
      expiryDate: '2036-08-22',
      relevance: 'Medium' as const,
      claims: [
        'Method of treating mTNBC with sacituzumab govitecan',
        'Dosing regimen (10 mg/kg q2w)',
        'Patient selection criteria (IHC H-score)',
      ],
    },
    {
      patentNumber: 'US11,456,789',
      title: 'Novel cleavable linker for antibody-drug conjugates',
      owner: 'TargetCo',
      type: 'Composition' as const,
      filingDate: '2019-06-10',
      expiryDate: '2039-06-10',
      relevance: 'High' as const,
      claims: [
        'Linker structure and chemistry',
        'Application to TROP2-targeting ADCs',
        'Manufacturing methods',
      ],
    },
    {
      patentNumber: 'WO2020123456',
      title: 'DXd platform for ADC payloads',
      owner: 'Daiichi Sankyo',
      type: 'Composition' as const,
      filingDate: '2019-12-01',
      expiryDate: '2039-12-01',
      relevance: 'Low' as const,
      claims: ['DXd payload structure', 'Application to multiple targets'],
    },
  ] as Patent[],
  ftoAssessment:
    'Preliminary FTO analysis suggests freedom to operate with specific construct. Method-of-treatment claims from Gilead are narrow (specific to sacituzumab govitecan) and may be designed around with different dosing regimen or combination approach. Composition patents are strong and provide exclusivity through 2038. Ongoing monitoring recommended as patent landscape evolves.',
  ipRisks: [
    'Gilead method patents could require licensing for certain indications (low probability)',
    'Daiichi Sankyo DXd platform patents could limit payload options (not applicable to TargetCo payload)',
    'Patent term may not extend beyond 2038 without PTE (patent term extension)',
    'Third-party patents in linker chemistry could emerge',
    'Patent challenges from competitors could shorten exclusivity period',
  ],
  ipOpportunities: [
    'Novel linker technology patentable in additional jurisdictions',
    'Combination patents with IO agents available (white space)',
    'New dosing regimens may be patentable',
    'Patient selection methods could be patented',
    'Manufacturing process improvements patentable',
  ],
  litigationHistory:
    'No active litigation. Gilead v. Daiichi Sankyo settlement (2021) suggests licensing appetite rather than aggressive litigation. TargetCo has no patent disputes to date.',
  ftoOpinionStatus: 'Preliminary opinion complete (internal counsel). Formal FTO opinion recommended before deal close.',
};

export const MARKET_OPPORTUNITY_DATA = {
  tam: { value: 5.2, unit: 'B', year: 2030, cagr: 12.5, currency: 'USD' },
  segments: [
    { name: 'TNBC', size: 2.1, share: 40, color: '#FF453A', patients: '45,000 annual' },
    { name: 'NSCLC', size: 1.8, share: 35, color: '#0A84FF', patients: '180,000 annual' },
    { name: 'Urothelial', size: 0.8, share: 15, color: '#30D158', patients: '85,000 annual' },
    { name: 'Other Solid Tumors', size: 0.5, share: 10, color: '#FF9F0A', patients: 'various' },
  ],
  competitiveDynamics:
    "Trodelvy holds first-mover advantage but safety profile creates opportunity for differentiation. Market likely to support 2-3 differentiated agents based on historical oncology market patterns. Pricing pressure expected but differentiation can support premium.",
  pricingConsiderations:
    "Reference pricing from Trodelvy (~$180K/year). Novel linker/safety story could support premium pricing (10-15%) or payer preference if safety benefit demonstrated. Cost-effectiveness analysis needed for payer negotiations.",
  marketRisks: [
    'Trodelvy label expansion captures additional share before TargetCo launch',
    'Biosimilar competition post-2036 patent expiry (long-term risk)',
    'Payer pushback on second TROP2 ADC without clear differentiation',
    'Competitive pricing pressure from Chinese competitors',
    'Combination approaches could change treatment paradigm',
  ],
  upsideScenarios: [
    'First-line approval in TNBC (larger patient population, longer duration)',
    'Adjuvant setting approval (curative intent, longer treatment duration)',
    'Combination with IO approval (broader use, higher pricing)',
    'Expansion to additional indications (ovarian, pancreatic)',
    'Best-in-class positioning with safety differentiation',
  ],
  penetrationAssumptions: {
    conservative: '15% market share by 2030',
    base: '25% market share by 2030',
    optimistic: '35% market share by 2030',
  },
};

export const DEAL_LANDSCAPE_DATA = {
  dealActivity: 'Active' as DealActivity,
  comparableDeals: [
    {
      asset: 'Trodelvy (TROP2 ADC)',
      acquirer: 'Gilead Sciences',
      seller: 'Immunomedics',
      date: '2020-09-13',
      stage: 'Approved',
      upfront: '$21B',
      milestones: '-',
      totalValue: '$21B (all-cash M&A)',
      royalties: undefined,
      notes: 'All-cash acquisition. Trodelvy had FDA approval at time of deal.',
    },
    {
      asset: 'Dato-DXd (TROP2 ADC)',
      acquirer: 'AstraZeneca',
      seller: 'Daiichi Sankyo',
      date: '2020-07-27',
      stage: 'Phase 1',
      upfront: '$1B',
      milestones: '$5B',
      totalValue: '$6B',
      royalties: 'Tiered mid-teens to low-20s',
      notes: 'Global co-development and co-commercialization agreement. Daiichi retains Japan rights.',
    },
    {
      asset: 'SKB264 (TROP2 ADC)',
      acquirer: 'Merck',
      seller: 'Kelun-Biotech',
      date: '2022-12-22',
      stage: 'Phase 2',
      upfront: '$175M',
      milestones: '$2.1B',
      totalValue: '$2.3B',
      royalties: 'Mid-teens',
      notes: 'Ex-China rights. Merck receives exclusive license for development and commercialization outside China.',
    },
    {
      asset: 'Enhertu (HER2 ADC)',
      acquirer: 'AstraZeneca',
      seller: 'Daiichi Sankyo',
      date: '2019-03-28',
      stage: 'Phase 2',
      upfront: '$1.35B',
      milestones: '$5.55B',
      totalValue: '$6.9B',
      royalties: 'Mid-teens to low-20s',
      notes: 'Reference transaction for DXd platform. Global co-development.',
    },
  ] as ComparableDeal[],
  valuationContext:
    "Phase 1/2 TROP2 ADC assets have traded at $500M-$2B total value depending on differentiation data. TargetCo's safety differentiation could support premium. Recent deals suggest $1.5-2.5B total value range for differentiated Phase 1/2 assets. Market leader (Trodelvy) acquired at $21B post-approval, suggesting significant upside potential.",
  potentialPartners: [
    'Large oncology pharma (Roche, Merck, BMS, Pfizer)',
    'ADC-focused companies seeking pipeline (Seagen, ADC Therapeutics)',
    'Asia-Pacific partners for regional rights (Takeda, Astellas)',
    'Emerging biotechs with capital (BioNTech, Moderna)',
  ],
  dealStructureConsiderations: [
    'Upfront vs. milestone mix (risk sharing - consider 30/70 or 40/60 split)',
    'Geographic splits (ex-US, ex-China, Japan-only options)',
    'Co-development vs. out-license (co-dev provides more control)',
    'Option structure for additional indications (maintenance, first-line)',
    'Buyback rights for TargetCo (if out-license structure)',
    'Joint steering committee governance',
  ],
  recentTrends: [
    'Increasing focus on differentiated assets over me-too programs',
    'Safety differentiation valued highly by large pharma',
    'Regional deals (ex-US, ex-China) becoming more common',
    'Option structures for early-stage assets gaining popularity',
    'Valuations holding despite market conditions (oncology remains attractive)',
  ],
};

export const STRATEGIC_RECOMMENDATION_DATA = {
  recommendation: 'Pursue CDA',
  strategicRationale:
    "TargetCo's TROP2 ADC addresses a key limitation of the market leader (GI toxicity) with proprietary linker technology. Phase 1 data, while early, suggests differentiated safety profile that could support best-in-class positioning. Strategic fit with our oncology portfolio is strong, filling gap in antibody-drug conjugate capabilities. Market opportunity is substantial ($5.2B TAM) with multiple expansion opportunities. Competitive landscape is manageable with clear differentiation path.",
  keyDiligenceQuestions: [
    '1. What is the mechanism of improved GI tolerability (linker stability data, payload release kinetics)?',
    '2. How does efficacy compare to Trodelvy at equivalent doses (cross-trial comparison limitations acknowledged)?',
    '3. What is the manufacturing readiness and CDMO capacity (can they scale to commercial volumes)?',
    '4. What are the key patent claims and FTO opinion status (formal legal opinion needed)?',
    '5. What is the path to pivotal trial and expected timeline (regulatory strategy)?',
    '6. What is the Phase 2 design and endpoints (powering, patient selection)?',
    '7. What is the CMC package status (impurity profiles, stability data)?',
    '8. What are the key person dependencies (retention strategy)?',
  ],
  proposedNextSteps: [
    { action: 'Execute CDA', owner: 'Legal', timeline: '1 week', priority: 'High' },
    {
      action: 'Request data room access',
      owner: 'BD',
      timeline: '2 weeks',
      priority: 'High',
    },
    {
      action: 'Conduct scientific due diligence',
      owner: 'R&D',
      timeline: '4 weeks',
      priority: 'High',
    },
    {
      action: 'Financial modeling and valuation',
      owner: 'Finance',
      timeline: '3 weeks',
      priority: 'High',
    },
    {
      action: 'IP/FTO formal opinion',
      owner: 'Legal/IP',
      timeline: '3 weeks',
      priority: 'Medium',
    },
    {
      action: 'Term sheet development',
      owner: 'BD/Legal',
      timeline: '6 weeks',
      priority: 'High',
    },
  ],
  dealConsiderations: [
    'Structure as option-to-acquire after Phase 2 data (mitigates risk)',
    'Include milestone triggers at regulatory and commercial events',
    'Retain co-promote rights for US market (strategic preference)',
    'Negotiate first negotiation rights for follow-on assets',
    'Include data sharing provisions for combination opportunities',
    'Define governance structure for co-development (if applicable)',
  ],
  riskMitigation: [
    'Stage-gated payments to limit downside exposure (milestone-based)',
    'Walk-away rights if efficacy data disappoints (defined thresholds)',
    'IP indemnification from seller (standard protection)',
    'Key person provisions for scientific leadership (retention agreements)',
    'Manufacturing commitments with penalties for delays',
    'Regulatory milestone definitions clearly specified',
  ],
  walkAwayCriteria: [
    'Efficacy <80% of Trodelvy ORR at similar doses (cross-trial comparison)',
    'IP FTO concerns cannot be resolved (formal opinion required)',
    'Valuation exceeds 3x comparable transactions (market discipline)',
    'Manufacturing issues that delay pivotal study >12 months (execution risk)',
    'Safety signals emerge that eliminate differentiation (key value driver)',
    'Competitive landscape shifts unfavorably (e.g., Dato-DXd approval with strong data)',
  ],
  internalAlignment: [
    'R&D: Strong interest in ADC capabilities',
    'Commercial: Enthusiasm for differentiated asset',
    'Finance: Valuation discipline required',
    'Legal: IP diligence critical path item',
    'Executive: Strategic fit confirmed',
  ],
};

// ============================================
// SHARED DATA
// ============================================

export const CITATIONS: Citation[] = [
  {
    id: 1,
    title: 'TROP2 as a therapeutic target in solid tumors',
    authors: 'Goldenberg DM, Sharkey RM',
    journal: 'Nature Reviews Drug Discovery',
    year: 2022,
    doi: '10.1038/s41573-022-00453-1',
    pmid: '35217756',
    keyFinding:
      'Comprehensive review establishing TROP2 as validated ADC target with summary of clinical development landscape',
  },
  {
    id: 2,
    title: 'Sacituzumab govitecan in metastatic triple-negative breast cancer',
    authors: 'Bardia A, Hurvitz SA, Tolaney SM, et al.',
    journal: 'NEJM',
    year: 2021,
    pmid: '33882206',
    keyFinding:
      'Phase 3 ASCENT trial: ORR 35%, mPFS 5.6mo vs 1.7mo (HR 0.41), mOS 12.1mo vs 6.7mo (HR 0.48)',
  },
  {
    id: 3,
    title: 'TROP2 structure and function: implications for therapeutic targeting',
    authors: 'Cubas R, Li M, Chen C, Yao Q',
    journal: 'Molecular Cancer',
    year: 2020,
    pmid: '32811599',
    keyFinding: 'Crystal structure revealing antibody binding epitopes and mechanism of signal transduction',
  },
  {
    id: 4,
    title: 'Datopotamab deruxtecan in advanced NSCLC',
    authors: 'Goto Y, Goto K, Goto Y, et al.',
    journal: 'Journal of Clinical Oncology',
    year: 2023,
    pmid: '36972134',
    keyFinding: 'Phase 1 data: ORR 26%, manageable safety with ILD signal (3%) requiring monitoring',
  },
  {
    id: 5,
    title: 'TROP2 promotes proliferation, migration, and invasion of gastric cancer',
    authors: 'Zeng P, Li J, Chen Y, et al.',
    journal: 'Journal of Experimental & Clinical Cancer Research',
    year: 2019,
    pmid: '31842940',
    keyFinding: 'Mechanistic studies showing TROP2 activates PI3K/AKT pathway and promotes EMT',
  },
  {
    id: 6,
    title: 'Loss-of-function variants in TACSTD2 cause corneal dystrophy',
    authors: 'Takaoka M, Nakamura T, Ban Y, et al.',
    journal: 'American Journal of Human Genetics',
    year: 2014,
    pmid: '24791904',
    keyFinding: 'Identification of TACSTD2 LoF as cause of gelatinous drop-like corneal dystrophy',
  },
];

export const INTELLIGENCE_FEED = [
  {
    id: 1,
    date: '2024-01-15',
    type: 'publication',
    title: 'New TROP2 ADC shows promise in Phase 1',
    source: 'Nature Cancer',
    summary: 'Early data suggests differentiated safety profile',
    relevance: 'high',
    link: 'https://example.com/pub1',
  },
  {
    id: 2,
    date: '2024-01-10',
    type: 'deal',
    title: 'Merck expands SKB264 partnership',
    source: 'Press Release',
    summary: 'Additional $500M investment in TROP2 ADC program',
    relevance: 'high',
    link: 'https://example.com/deal1',
  },
  {
    id: 3,
    date: '2024-01-05',
    type: 'regulatory',
    title: 'FDA grants breakthrough designation to Dato-DXd',
    source: 'FDA',
    summary: 'Accelerated review pathway for NSCLC indication',
    relevance: 'medium',
    link: 'https://example.com/fda1',
  },
  {
    id: 4,
    date: '2023-12-20',
    type: 'publication',
    title: 'TROP2 expression correlates with IO resistance',
    source: 'Cancer Cell',
    summary: 'New biomarker data supports combination approaches',
    relevance: 'medium',
    link: 'https://example.com/pub2',
  },
  {
    id: 5,
    date: '2023-12-15',
    type: 'clinical',
    title: 'TROPION-Breast01 enrollment complete',
    source: 'ClinicalTrials.gov',
    summary: 'Phase 3 trial fully enrolled ahead of schedule',
    relevance: 'high',
    link: 'https://example.com/ct1',
  },
];

export const WORKSPACES: Array<{
  id: string | number;
  name: string;
  target: string;
  persona: Persona;
  createdDate: string;
  lastModified: string;
  status: 'active' | 'completed' | 'archived';
  collaborators?: string[];
}> = [
  {
    id: 1,
    name: 'TROP2 ADC Due Diligence',
    target: 'TROP2',
    persona: 'scientist' as const,
    createdDate: '2024-01-01',
    lastModified: '2024-01-15',
    status: 'active' as const,
    collaborators: ['user1', 'user2'],
  },
  {
    id: 2,
    name: 'TROP2 BD Assessment',
    target: 'TROP2',
    persona: 'bd' as const,
    createdDate: '2024-01-05',
    lastModified: '2024-01-14',
    status: 'active' as const,
    collaborators: ['user3', 'user4'],
  },
];
