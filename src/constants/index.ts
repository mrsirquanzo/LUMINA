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

export * from './her2Baseline';

// ============================================
// SCIENTIST PERSONA DATA
// ============================================

export const SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 82,
  recommendation: 'Advance' as Recommendation,
  confidenceLevel: 0.85,
  dataFreshness: '2024-01-15',
  summaryText:
    'TROP2 (TACSTD2) is a clinically validated oncology antigen with strong precedent in ADC development. Sacituzumab govitecan (Trodelvy) establishes proof-of-concept in metastatic TNBC (ASCENT). However, GTEx v10 indicates high TACSTD2 expression in normal epithelia (notably GI mucosa and skin), which can constrain therapeutic window and drive on-target epithelial toxicity; differentiation depends heavily on linker/payload engineering and dosing. TCGA PanCancer Atlas (cBioPortal) shows high TACSTD2 expression across multiple tumor types (notably bladder/urothelial), supporting broad applicability with careful safety management.',
  quickMetrics: {
    geneticValidation: 'Limited' as ValidationScore,
    therapeuticWindow: 'Moderate' as TherapeuticWindow,
    druggability: 'High' as DruggabilityScore,
    safetyProfile: 'Manageable' as SafetyScore,
  },
  keyStrengths: [
    'FDA-approved ADC (Trodelvy) validates mechanism',
    'High TACSTD2 expression across multiple TCGA tumor cohorts (cBioPortal)',
    'Multiple modalities feasible (ADC, bispecific, CAR-T)',
    'Strong clinical activity signal in mTNBC (ASCENT)',
    'High antigen density and rapid internalization ideal for ADCs',
  ],
  keyRisks: [
    'On-target epithelial toxicity risk (high normal expression in skin/mucosa on GTEx)',
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
  // Agent attribution
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized comprehensive analysis from Target Biology, Clinical, Patent, Financial, Regulatory, and Market Research agents',
  },
};

export const GENETIC_VALIDATION_DATA = {
  // Human genetics is limited for oncology targets like TACSTD2: clinical validation is strong,
  // but inherited risk associations are not a major driver of the decision.
  validationScore: 'Limited' as ValidationScore,
  validationSummary:
    'TROP2 (TACSTD2) has limited inherited genetics support for cancer risk (no robust GWAS signal is typically used clinically). The strongest human genetic relevance is Mendelian: biallelic loss-of-function in TACSTD2 causes gelatinous drop-like corneal dystrophy (GDLD), indicating on-target epithelial/ocular biology. Population constraint metrics from gnomAD show TACSTD2 is LoF-tolerant (very low pLI; LOEUF upper bound >1), with no homozygous LoF carriers observed in the gnomAD dataset query used for this baseline; this supports feasibility but underscores the need for epithelial toxicity monitoring (skin/mucosa, ocular).',
  gwasAssociations: [
    {
      disease: 'Corneal Dystrophy (GDLD)',
      score: 0.95,
      evidenceType: 'Mendelian' as const,
      // Keep variants generic here unless we explicitly cite a curated clinical source.
      keyVariants: [],
      effectSize: undefined,
      pValue: undefined,
    },
  ] as GWASAssociation[],
  constraintMetrics: {
    // gnomAD (GRCh38; constraint block):
    // pLI: 0.0000036, oe_lof_upper (used as LOEUF upper bound): 1.868, exp_lof: 9.93, obs_lof: 13.
    // No homozygous LoF carriers were observed in the gnomAD variants query used here.
    pLI: 0.0000036277161274097553,
    LOEUF: 1.868,
    lofObserved: 13,
    lofExpected: 9.926824060590436,
    homozygousCarriers: 0,
  } as ConstraintMetrics,
  mendelianDiseases: ['Gelatinous Drop-like Corneal Dystrophy (GDLD)'],
  directionOfEffect: 'Inhibition/degradation reduces tumor cell survival',
  biobankEvidence: [
    {
      source: 'Open Targets / biobanks',
      finding: 'No strong, decision-driving inherited risk associations are used clinically for TACSTD2 (focus is tumor expression as a biomarker).',
    },
  ],
  lofCarrierPhenotypes:
    'Biallelic loss-of-function causes GDLD (ocular surface/corneal phenotype). In gnomAD constraint/variant queries used for this baseline, no homozygous LoF carriers were observed; safety assessment should therefore rely primarily on normal-tissue expression + clinical ADC safety (and include ocular monitoring).',
  // Agent attribution
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided genetic validation data including GWAS associations, constraint metrics, biobank evidence, and LoF carrier phenotypes',
  },
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
      activity: 'Clinically validated TROP2 ADC with meaningful activity in mTNBC (see ASCENT publication and current label for indication-specific details)',
      dar: 7.6,
      linker: 'CL2A (pH-sensitive)',
    },
    {
      name: 'Datopotamab deruxtecan (Dato-DXd)',
      phase: 'Phase 3',
      mechanism: 'ADC (DXd, Topo-1 inhibitor)',
      activity:
        'Late-stage investigational TROP2 ADC with Phase 3 program (TROPION trials). Early clinical datasets report an ILD/pneumonitis signal that requires monitoring (see PMID: 36972134).',
      dar: 4,
      linker: 'Tetrapeptide-based (protease-cleavable)',
    },
    {
      name: 'SKB264 (MK-2870)',
      phase: 'Phase 3',
      mechanism: 'ADC (belotecan, Topo-1 inhibitor)',
      activity:
        'Late-stage investigational TROP2 ADC in Phase 3 development; treat efficacy/safety point estimates as unverified unless sourced to a primary disclosure or peer-reviewed publication.',
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
    'Highly tractable for antibody-based approaches. Extracellular domain is well-characterized with multiple epitopes validated. Internalization is reported as fast in multiple programs (supporting ADC payload delivery), but exact kinetics depend on assay/model. Crystal structures available for rational design. No small molecule approaches viable due to lack of enzymatic activity.',
  modalityRecommendations: [
    {
      modality: 'ADC',
      feasibility: 'High',
      rationale: 'Proven with Trodelvy; internalization is reported as fast across multiple TROP2 antibody programs; multiple validated payloads',
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
  // Agent attribution
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided druggability assessment including structural data, existing compounds, modality recommendations, and tractability analysis',
  },
};

export const EXPRESSION_DATA = {
  // Note: TROP2 (TACSTD2) shows very high expression in several normal epithelial tissues (GTEx),
  // which can narrow the therapeutic window for modalities with bystander/payload toxicity.
  therapeuticWindowScore: 'Moderate' as TherapeuticWindow,
  bestIndication: { name: 'Urothelial carcinoma', foldChange: 188.57, rank: 1 },
  adcSuitability: {
    score: 'High',
    antigenDensity: 'High (tumor antigen; ADC-validated clinically)',
    internalizationRate: 'Fast internalization reported for TROP2-directed antibodies (supports ADC payload delivery)',
    recyclingVsDegradation: 'Primarily degraded (favorable for ADC payload release)',
    membraneHalfLife: 'Reported as hours-scale (varies by model and assay)',
  },
  gtexNormalTissues: [
    // GTEx v10 median gene expression for TACSTD2 (ENSG00000184292.7), unit TPM.
    { name: 'Esophagus (Mucosa)', tpm: 1828.16, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Skin (Not sun-exposed)', tpm: 930.88, isSafetyOrgan: true, category: 'skin' as const },
    { name: 'Vagina', tpm: 882.516, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Cervix (Ectocervix)', tpm: 501.437, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Prostate', tpm: 205.841, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Lung', tpm: 158.821, isSafetyOrgan: true, category: 'lung' as const },
    { name: 'Breast (Mammary)', tpm: 132.72, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Bladder', tpm: 102.134, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Kidney (Cortex)', tpm: 74.3375, isSafetyOrgan: true, category: 'kidney' as const },
    { name: 'Pancreas', tpm: 60.9366, isSafetyOrgan: true, category: 'other' as const },
    { name: 'Stomach', tpm: 12.9775, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Cervix (Endocervix)', tpm: 7.43764, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Liver', tpm: 1.84563, isSafetyOrgan: true, category: 'liver' as const },
    { name: 'Colon (Transverse)', tpm: 1.69345, isSafetyOrgan: false, category: 'gi' as const },
    { name: 'Skeletal Muscle', tpm: 0.613901, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Brain (Cortex)', tpm: 0.42267, isSafetyOrgan: true, category: 'brain' as const },
    // Keep heart/brain as low-expression safety organs; heart is particularly low for TACSTD2 in GTEx.
    { name: 'Heart (Left Ventricle)', tpm: 0.283305, isSafetyOrgan: true, category: 'heart' as const },
  ] as ExpressionTissue[],
  tcgaTumorExpression: [
    {
      tumorType: 'Breast invasive carcinoma (TCGA BRCA)',
      tcgaCode: 'BRCA',
      // cBioPortal (TCGA PanCancer Atlas): mRNA Expression, RSEM (RNA Seq V2)
      medianTPM: 5924.585,
      percentileRank: 33,
      sampleCount: 1082,
    },
    {
      tumorType: 'NSCLC (Adeno)',
      tcgaCode: 'LUAD',
      medianTPM: 6336.005,
      percentileRank: 44,
      sampleCount: 510,
    },
    {
      tumorType: 'NSCLC (Squamous)',
      tcgaCode: 'LUSC',
      medianTPM: 8830.385,
      percentileRank: 67,
      sampleCount: 484,
    },
    {
      tumorType: 'Urothelial',
      tcgaCode: 'BLCA',
      medianTPM: 19262.5,
      percentileRank: 100,
      sampleCount: 407,
    },
    {
      tumorType: 'Pancreatic Adenocarcinoma',
      tcgaCode: 'PAAD',
      medianTPM: 7557.05,
      percentileRank: 56,
      sampleCount: 177,
    },
    {
      tumorType: 'Ovarian Serous',
      tcgaCode: 'OV',
      medianTPM: 5304.0943,
      percentileRank: 22,
      sampleCount: 300,
    },
    {
      tumorType: 'Gastric Adenocarcinoma',
      tcgaCode: 'STAD',
      medianTPM: 2780.22455,
      percentileRank: 11,
      sampleCount: 412,
    },
    {
      tumorType: 'Colorectal Adenocarcinoma (TCGA COADREAD)',
      tcgaCode: 'COADREAD',
      medianTPM: 240.1437,
      percentileRank: 0,
      sampleCount: 592,
    },
    {
      tumorType: 'Head and Neck SCC',
      tcgaCode: 'HNSC',
      medianTPM: 14552.2,
      percentileRank: 89,
      sampleCount: 515,
    },
    {
      tumorType: 'Prostate Adenocarcinoma',
      tcgaCode: 'PRAD',
      medianTPM: 10677.6,
      percentileRank: 78,
      sampleCount: 493,
    },
  ] as TumorExpression[],
  foldChangeData: [
    // IMPORTANT: TCGA values above are RNA-Seq V2 RSEM medians; GTEx values are TPM medians.
    // These ratios are therefore an approximation intended only for visualization.
    { indication: 'Breast (BRCA)', tumorTPM: 5924.585, normalTPM: 132.72, foldChange: 44.63, citations: ['GTEx v10', 'TCGA PanCancer Atlas (cBioPortal)'] },
    { indication: 'NSCLC (LUAD)', tumorTPM: 6336.005, normalTPM: 158.821, foldChange: 39.88, citations: ['GTEx v10', 'TCGA PanCancer Atlas (cBioPortal)'] },
    { indication: 'Urothelial (BLCA)', tumorTPM: 19262.5, normalTPM: 102.134, foldChange: 188.57, citations: ['GTEx v10', 'TCGA PanCancer Atlas (cBioPortal)'] },
    { indication: 'Pancreatic (PAAD)', tumorTPM: 7557.05, normalTPM: 60.9366, foldChange: 124.01, citations: ['GTEx v10', 'TCGA PanCancer Atlas (cBioPortal)'] },
    { indication: 'Head & Neck (HNSC)', tumorTPM: 14552.2, normalTPM: 1828.16, foldChange: 7.96, citations: ['GTEx v10', 'TCGA PanCancer Atlas (cBioPortal)'] },
  ],
  genomicAlterations: {
    amplificationFrequency: { BRCA: 1.5, LUAD: 1.37, LUSC: 0.41, BLCA: 1.47, OV: 2.45, PAAD: 0, STAD: 0.23, COADREAD: 0, HNSC: 0.39, PRAD: 0.2 },
    mutationFrequency: { BRCA: 0, LUAD: 0.18, LUSC: 0.21, BLCA: 0.49, OV: 0, PAAD: 0, STAD: 0.23, COADREAD: 0.67, HNSC: 0.38, PRAD: 0.2 },
    hotspotMutations: ['None significant'],
    fusionEvents: ['None reported'],
    copyNumberGain: {
      BRCA: 13.36,
      LUAD: 23.29,
      LUSC: 15.2,
      BLCA: 18.87,
      OV: 33.22,
      PAAD: 4.92,
      STAD: 8.68,
      COADREAD: 3.38,
      HNSC: 12.38,
      PRAD: 0.82,
    },
  },
  // Agent attribution
  agents: ['target_biology', 'clinical'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided GTEx/TCGA expression data, fold-change analysis, and genomic alterations',
    clinical: 'Provided clinical context for expression patterns and therapeutic window assessment',
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
  // Agent attribution
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided pathway context, mechanism of action, key publications, and preclinical evidence',
  },
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
          safetyNotes: 'ASCENT (label): neutropenia 64% any grade (49% grade 3-4), diarrhea 59% any grade (11% grade 3-4), febrile neutropenia 6%',
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
      nctId: 'NCT03547973',
      title: 'TROPHY-U-01 (sacituzumab govitecan in metastatic urothelial carcinoma)',
      phase: 'Phase 2',
      status: 'Completed' as const,
      sponsor: 'Gilead',
      indication: 'mUC',
      startDate: '2019-11-01',
      expectedReadout: undefined,
      results: {
        orr: '27% (reported in TROPHY-U-01 cohort 1)',
        pfs: undefined,
        os: undefined,
        safetyNotes: 'Accelerated approval in urothelial cancer was later withdrawn; use as precedent only, not current label',
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
    'Trodelvy (sacituzumab govitecan) validates TROP2 as an ADC target with clinically meaningful activity in mTNBC (ASCENT). Trodelvy previously had accelerated approval in metastatic urothelial carcinoma that was later withdrawn, so urothelial data should be treated as precedent rather than current label. Datopotamab deruxtecan (Dato-DXd) is a late-stage investigational TROP2 ADC; available clinical datasets include an ILD/pneumonitis signal that requires monitoring (see PMID: 36972134).',
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
    'IHC-based patient selection is commonly used for TROP2 programs and may enrich for responders depending on assay and cutoff. Topo-1 inhibitor payloads dominate the current clinical landscape. Linker stability is a key determinant of systemic tolerability vs tumor delivery; both pH-sensitive and protease-cleavable linkers are used in practice.',
  // Agent attribution
  agents: ['clinical'] as const,
  primaryAgent: 'clinical' as const,
  agentContributions: {
    clinical: 'Provided clinical trial data, efficacy results, key findings, and translational insights',
  },
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
      expression: 'High (GTEx v10 median ~931 TPM; skin not sun-exposed)',
      concern: 'Rash, alopecia observed with ADCs',
      severity: 'High',
      clinicalManifestation:
        'Dermatologic adverse events (e.g., rash, alopecia) are observed across multiple epithelial targets and ADC payload classes; incidence is indication- and regimen-dependent',
    },
    {
      organ: 'GI Mucosa (Esophagus)',
      expression: 'Very high (GTEx v10 median ~1828 TPM; esophagus mucosa)',
      concern: 'Stomatitis, diarrhea common',
      severity: 'High',
      clinicalManifestation:
        'Mucositis/stomatitis and diarrhea are common epithelial toxicities with several ADCs; rates vary by asset, schedule, and patient population',
    },
    {
      organ: 'Lung',
      expression: 'Moderate (GTEx v10 median ~159 TPM)',
      concern: 'ILD signal with some ADCs (Dato-DXd)',
      severity: 'Medium',
      clinicalManifestation:
        'ILD/pneumonitis has been reported with some Topo-1 payload ADCs; operational monitoring and management are required and incidence varies by dataset',
    },
    {
      organ: 'Bladder',
      expression: 'Moderate (GTEx v10 median ~102 TPM)',
      concern: 'Bladder irritation possible',
      severity: 'Low',
      clinicalManifestation:
        'Lower urinary tract symptoms/hematuria are not expected class-defining AEs; monitor if signal emerges in target indication datasets',
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
        'Pivotal ASCENT/label experience: neutropenia and diarrhea are common and can be dose-limiting without proactive supportive care (see pivotal publication and current label for exact rates by indication)',
      mitigation: 'G-CSF prophylaxis, anti-emetics, dose delays/reductions',
      mtf: 'Per label / trial protocol (verify by indication)',
    },
    {
      drug: 'Dato-DXd (datopotamab deruxtecan)',
      safetyProfile:
        'Early clinical datasets report stomatitis/mucositis and an ILD/pneumonitis signal that requires monitoring (see PMID: 36972134); exact rates are indication- and dataset-dependent',
      mitigation: 'Dose modification, ILD monitoring (CT scans), oral care',
      mtf: 'Per trial protocol (verify by study/indication)',
    },
    {
      drug: 'SKB264',
      safetyProfile: 'Similar to Trodelvy profile; detailed data pending from Phase 3',
      mitigation: 'Standard supportive care',
      mtf: 'Per trial protocol (verify by study/indication)',
    },
  ],
  therapeuticIndex: {
    estimate: 'Not quantified (requires head-to-head preclinical + clinical exposure/toxicity data)',
    basis: 'Therapeutic index should be derived from integrated tumor-vs-normal expression, exposure-response, and observed DLTs; avoid hard multipliers without a primary dataset',
  },
  monitoringRequirements: [
    'Ophthalmic exams (corneal) - baseline and q6mo',
    'CBCs (neutropenia) - q cycle',
    'Chest imaging (ILD) - baseline and q6-8 weeks',
    'Skin assessments (rash) - q cycle',
    'GI symptom monitoring (diarrhea, stomatitis) - continuous',
  ],
  // Agent attribution
  agents: ['clinical'] as const,
  primaryAgent: 'clinical' as const,
  agentContributions: {
    clinical: 'Provided safety data including genetic safety signals, expression concerns, class safety history, and monitoring requirements',
  },
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
  // Agent attribution
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized evidence gaps and recommended experiments from Target Biology and Clinical agents to provide strategic recommendations',
  },
};

// ============================================
// SCOUT/BD PERSONA DATA
// ============================================

export const BD_EXECUTIVE_SUMMARY = {
  opportunityRating: 'Attractive' as OpportunityRating,
  strategicFit: 'Strong Fit' as StrategicFit,
  summaryText:
    "TROP2-directed ADCs are a validated commercial category (Trodelvy; multiple next-generation programs). Near-term BD value is driven by differentiation (safety, dosing convenience, efficacy in defined biomarker/setting) and by access to scalable ADC manufacturing. This tile intentionally avoids asset-specific valuation claims unless supported by a sourced diligence package.",
  quickMetrics: {
    developmentStage: 'Approved + late-stage pipeline',
    patentLife: 'Varies by asset (requires IP diligence)',
    marketOpportunity: 'Multi-billion TAM (source required)',
    competitivePosition: 'Best-in-class potential',
    totalDealValue: 'Depends on asset + data package',
  },
  keyValueDrivers: [
    'Category validated by approved agents and late-stage programs',
    'Differentiation levers: safety/ILD profile, GI toxicity, dosing convenience, efficacy in defined settings',
    'Broad indication potential across epithelial tumors with high TACSTD2 expression',
    'Manufacturing/scalability and CMC readiness are key BD drivers',
  ],
  keyRisks: [
    'Crowded competitive landscape (Trodelvy, Dato-DXd/Datroway, multiple ADC entrants)',
    'Regulatory/label success depends on clear differentiation and manageable safety',
    'On-target epithelial toxicity can constrain dosing and limit combinations',
    'Manufacturing scalability and supply chain execution risk',
  ],
  recommendedAction: 'Pursue CDA and request data room access',
  valuationRange: 'Requires asset-specific data room + comps',
  // Agent attribution
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized BD opportunity analysis from Financial, Market Research, Patent, and Clinical agents',
  },
};

export const COMPETITIVE_LANDSCAPE_DATA = {
  competitiveIntensity: 'Crowded' as CompetitiveIntensity,
  competitors: [
    {
      company: 'Gilead/Immunomedics',
      asset: 'Trodelvy (sacituzumab govitecan)',
      modality: 'ADC (SN-38)',
      stage: 'Approved',
      indication: 'mTNBC, HR+/HER2- breast cancer (see current label; prior mUC accelerated approval was withdrawn)',
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
      differentiation: 'DXd platform; ILD/pneumonitis signal has been reported in available datasets (monitoring required)',
      expectedMilestone: 'Phase 3 readouts and regulatory updates (verify by program)',
      milestoneDate: '2025+',
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
  // Agent attribution
  agents: ['market_research'] as const,
  primaryAgent: 'market_research' as const,
  agentContributions: {
    market_research: 'Provided competitive landscape analysis including competitors, differentiation analysis, competitive risks, and white space opportunities',
  },
};

export const IP_FTO_DATA = {
  ipPosition: 'Moderate' as IPPosition,
  patentSummary:
    'TROP2 ADC IP is complex and asset-specific (antibody epitope, linker chemistry, payload, conjugation, and method-of-use). This baseline does not provide a formal patent landscape or FTO opinion; numbers and specific patent identifiers should only be shown when sourced from a counsel-reviewed landscape.',
  // IMPORTANT: remove placeholder patent numbers; keep this empty until populated from a sourced landscape.
  keyPatents: [] as Patent[],
  ftoAssessment:
    'Requires counsel-reviewed analysis. In practice, FTO hinges on construct-level differentiation (antibody sequences/epitopes, linker/payload, conjugation chemistry) and jurisdiction-specific method-of-use claims.',
  ipRisks: [
    'Crowded TROP2 ADC space: overlapping claims may create design-around or licensing needs depending on construct',
    'Method-of-use claims can be indication- and regimen-specific',
    'Platform IP (payload/linker/conjugation) can constrain manufacturing choices',
    'Patent challenges/oppositions could shorten effective exclusivity',
  ],
  ipOpportunities: [
    'Novel linker technology patentable in additional jurisdictions',
    'Combination patents with IO agents available (white space)',
    'New dosing regimens may be patentable',
    'Patient selection methods could be patented',
    'Manufacturing process improvements patentable',
  ],
  litigationHistory:
    'Not assessed in this baseline. Requires up-to-date litigation and opposition search.',
  ftoOpinionStatus: 'Not available in this baseline (counsel review required).',
  // Agent attribution
  agents: ['patent'] as const,
  primaryAgent: 'patent' as const,
  agentContributions: {
    patent: 'Provided IP and FTO analysis including patent portfolio, key patents, FTO assessment, IP risks and opportunities',
  },
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
  // Agent attribution
  agents: ['financial', 'market_research'] as const,
  primaryAgent: 'financial' as const,
  agentContributions: {
    financial: 'Provided market sizing including TAM, segments, and competitive dynamics',
    market_research: 'Provided market dynamics, pricing considerations, and penetration assumptions',
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
    'Comparable deal values vary widely based on stage, differentiation, and data quality. Use this tile as a framework for diligence rather than a quoted valuation; attach sourced comps before presenting numbers in an investor setting.',
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
  // Agent attribution
  agents: ['financial'] as const,
  primaryAgent: 'financial' as const,
  agentContributions: {
    financial: 'Provided deal landscape analysis including comparable deals, valuation context, potential partners, and deal structure considerations',
  },
};

export const STRATEGIC_RECOMMENDATION_DATA = {
  recommendation: 'Pursue CDA',
  strategicRationale:
    'TROP2 is a validated ADC target with multiple active programs. Strategic attractiveness depends on whether an asset demonstrates differentiated safety and/or efficacy in a well-defined setting, with a credible CMC and regulatory path. Avoid quoting TAM/valuation unless backed by a sourced, current market model.',
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
  // Agent attribution
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized strategic recommendation from all agents including Financial, Market Research, Patent, Clinical, and Regulatory insights',
  },
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
    source: 'Source required',
    summary: 'Early data suggests differentiated safety profile (add primary citation before treating as factual)',
    relevance: 'high',
    link: '',
  },
  {
    id: 2,
    date: '2024-01-10',
    type: 'deal',
    title: 'Merck expands SKB264 partnership',
    source: 'Press release (source required)',
    summary: 'Partnership expansion reported (add primary citation; avoid quoting deal terms without a source)',
    relevance: 'high',
    link: 'https://clinicaltrials.gov/study/NCT05215340',
  },
  {
    id: 3,
    date: '2024-01-05',
    type: 'regulatory',
    title: 'Regulatory designation reported for Dato-DXd',
    source: 'Source required',
    summary: 'Regulatory update reported for NSCLC program (add primary citation before treating as factual)',
    relevance: 'medium',
    link: '',
  },
  {
    id: 4,
    date: '2023-12-20',
    type: 'publication',
    title: 'TROP2 expression correlates with IO resistance',
    source: 'Source required',
    summary: 'Biomarker data may support combination approaches (add primary citation before treating as factual)',
    relevance: 'medium',
    link: '',
  },
  {
    id: 5,
    date: '2023-12-15',
    type: 'clinical',
    title: 'TROPION-Breast01 enrollment complete',
    source: 'ClinicalTrials.gov',
    summary: 'Phase 3 trial fully enrolled ahead of schedule',
    relevance: 'high',
    link: 'https://clinicaltrials.gov/study/NCT04656652',
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
