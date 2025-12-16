import type {
  Citation,
  ClinicalActivity,
  ClinicalTrial,
  ComparableDeal,
  Competitor,
  ConstraintMetrics,
  DealActivity,
  DruggabilityScore,
  ExpressionTissue,
  GWASAssociation,
  IPPosition,
  OpportunityRating,
  Recommendation,
  SafetyScore,
  StrategicFit,
  TherapeuticWindow,
  TumorExpression,
  ValidationScore,
} from '../types';

/**
 * HER2 (ERBB2) baseline datasets
 *
 * Purpose:
 * - Provide "TROP2-quality" baseline tiles for HER2 demos.
 * - Keep structures identical to existing baseline tile props to avoid UI divergence.
 *
 * Notes:
 * - Numbers are curated for demo readiness; for Live mode they should be replaced/overridden by agent outputs.
 */

// ============================================
// SCIENTIST PERSONA DATA (HER2)
// ============================================

export const HER2_SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 91,
  recommendation: 'Advance' as Recommendation,
  confidenceLevel: 0.92,
  dataFreshness: '2025-12-01',
  summaryText:
    'HER2 (ERBB2) is a gold-standard validated oncology target with clear biomarker strategy (IHC/FISH), multiple approved modalities (mAbs, ADCs, TKIs), and strong clinical differentiation led by Enhertu. The opportunity is less about “is the target real” and more about competitive positioning (crowded HER2 landscape), line-of-therapy strategy, and managing class toxicities (cardiac monitoring for HER2 blockade; ILD risk for DXd ADCs).',
  quickMetrics: {
    geneticValidation: 'Strong' as ValidationScore,
    therapeuticWindow: 'Moderate' as TherapeuticWindow,
    druggability: 'High' as DruggabilityScore,
    safetyProfile: 'Manageable' as SafetyScore,
  },
  keyStrengths: [
    'Clear driver biology: ERBB2 amplification/overexpression is actionable and biomarker-defined',
    'Multiple FDA-approved therapies validate target across breast, gastric, and lung contexts',
    'Best-in-class ADC precedent: Enhertu shows high ORR and durable PFS in HER2+ disease',
    'Established diagnostics + clinical workflow (IHC/FISH) lowers adoption friction',
    'Expandable biology: HER2-low and HER2-mutant segments increase TAM',
  ],
  keyRisks: [
    'Crowded competitive landscape (multiple HER2 ADCs + mAbs + TKIs)',
    'Cardiac toxicity monitoring is a known liability for HER2 blockade (esp. combos/anthracyclines)',
    'ILD/pneumonitis risk for DXd-class ADCs is a label-level concern requiring vigilance',
    'Differentiation is hard: must win on safety, sequencing, biomarker wedge, or underserved setting',
    'Resistance mechanisms (HER2 heterogeneity, pathway bypass) can limit durability',
  ],
  weightedScoring: {
    genetic: { score: 95, weight: 0.2 },
    expression: { score: 82, weight: 0.25 },
    druggability: { score: 95, weight: 0.2 },
    safety: { score: 75, weight: 0.2 },
    clinical: { score: 93, weight: 0.15 },
  },
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Baseline synthesis for HER2 combining Target Biology + Clinical + IP + Market context',
  },
};

export const HER2_GENETIC_VALIDATION_DATA = {
  validationScore: 'Strong' as ValidationScore,
  validationSummary:
    'HER2 genetic validation is strong in oncology via somatic driver evidence: ERBB2 amplification/overexpression defines a clinically actionable subtype with clear response to HER2 blockade and HER2-targeted ADCs. In organismal biology, Erbb2 knockout is embryonic lethal in mice (cardiac/neural development), underscoring pathway essentiality; in humans, population constraint metrics indicate selection against loss-of-function variation (moderate LoF constraint).',
  gwasAssociations: [
    {
      disease: 'HER2+ Breast Cancer (ERBB2 amplification)',
      score: 0.98,
      evidenceType: 'Somatic' as const,
      keyVariants: ['ERBB2 amplification', 'IHC 3+ / FISH+'],
    },
    {
      disease: 'Gastric/GEJ Adenocarcinoma (HER2+)',
      score: 0.85,
      evidenceType: 'Somatic' as const,
      keyVariants: ['ERBB2 amplification', 'IHC 3+ / FISH+'],
    },
    {
      disease: 'NSCLC (HER2 mutations)',
      score: 0.65,
      evidenceType: 'Somatic' as const,
      keyVariants: ['ERBB2 exon 20 insertion', 'ERBB2 activating mutations'],
    },
  ] as GWASAssociation[],
  constraintMetrics: {
    // gnomAD (GRCh38) constraint snapshot (see code comments for query provenance).
    // Note: gnomAD v4 uses oe_lof_upper (LOEUF-style) as primary LoF constraint metric.
    pLI: 0.0631,
    LOEUF: 0.518,
  } as ConstraintMetrics,
  mendelianDiseases: [],
  directionOfEffect: 'Inhibition/blockade of HER2 signaling in HER2-driven tumors',
  biobankEvidence: [
    { source: 'TCGA / cBioPortal', finding: 'ERBB2 amplification enriched in multiple epithelial tumors; actionable subtype with clear clinical response' },
    { source: 'Clinical precedent', finding: 'HER2 status is a standard-of-care biomarker guiding multiple approved therapies' },
    { source: 'Real-world practice', finding: 'HER2 testing is routine; therapy sequencing is well established' },
  ],
  lofCarrierPhenotypes:
    'Not a primary driver for oncology decision-making. HER2 targeting is guided by tumor biomarkers (IHC/FISH/NGS). Mouse Erbb2 knockout is embryonic lethal (~E10.5–E11), informing “essential pathway” caution rather than adult tolerability.',
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided somatic driver-based validation framing and biomarker strategy',
  },
};

export const HER2_DRUGGABILITY_DATA = {
  druggabilityScore: 'High' as DruggabilityScore,
  targetClass: 'Receptor Tyrosine Kinase (ERBB family)',
  localization: 'Cell surface (extracellular domain) + intracellular kinase domain',
  structuralData: {
    pdbCount: 120,
    alphafoldConfidence: 93,
    ligandBoundStructures: 18,
    bindingPockets: ['ATP binding site', 'Allosteric pockets (subset)'],
    uniprotId: 'P04626',
    proteinLength: 1255,
    transmembraneDomains: 1,
  },
  existingCompounds: [
    {
      name: 'Trastuzumab (Herceptin)',
      phase: 'Approved',
      mechanism: 'mAb (HER2 blockade; ADCC)',
      activity: 'Foundational benefit in HER2+ breast; backbone for combinations',
    },
    {
      name: 'Pertuzumab (Perjeta)',
      phase: 'Approved',
      mechanism: 'mAb (dimerization inhibition)',
      activity: 'Improves outcomes in HER2+ breast when combined with trastuzumab',
    },
    {
      name: 'Margetuximab (Margenza)',
      phase: 'Approved',
      mechanism: 'Fc-engineered anti-HER2 mAb',
      activity: 'Option in later-line HER2+ metastatic breast cancer (with chemotherapy)',
    },
    {
      name: 'Ado-trastuzumab emtansine (T-DM1, Kadcyla)',
      phase: 'Approved',
      mechanism: 'ADC (DM1 payload)',
      activity: 'Standard 2L historically; now often displaced by DXd-class ADCs',
    },
    {
      name: 'Trastuzumab deruxtecan (T-DXd, Enhertu)',
      phase: 'Approved',
      mechanism: 'ADC (DXd payload)',
      activity: 'High ORR and durable PFS across HER2+ and HER2-low settings',
    },
    {
      name: 'Tucatinib (Tukysa)',
      phase: 'Approved',
      mechanism: 'Selective HER2 TKI (with trastuzumab + capecitabine)',
      activity: 'Demonstrated CNS activity; improves outcomes in HER2+ metastatic breast cancer incl. brain metastases',
    },
    {
      name: 'Neratinib (Nerlynx)',
      phase: 'Approved',
      mechanism: 'Irreversible pan-HER TKI',
      activity: 'Extended adjuvant / later-line option; diarrhea is a key tolerability limitation',
    },
    {
      name: 'Lapatinib (Tykerb)',
      phase: 'Approved',
      mechanism: 'HER2/EGFR TKI',
      activity: 'Older oral option; largely supplanted by newer regimens but still a reference precedent',
    },
  ],
  tractabilityAssessment:
    'Highly tractable across modalities: extracellular domain supports antibody engagement and ADC delivery; intracellular kinase domain supports small-molecule inhibition. The competitive bar is set by best-in-class ADCs, so tractability is not the question—differentiation is.',
  modalityRecommendations: [
    { modality: 'ADC (next-gen)', feasibility: 'High', rationale: 'Clinical precedent is strongest; success depends on payload/linker/safety differentiation and biomarker wedge (HER2-low, HER2-mutant).' },
    { modality: 'mAb / bispecific', feasibility: 'High', rationale: 'Proven biology; differentiation requires novel epitope, immune engagement strategy, or combination positioning.' },
    { modality: 'TKI', feasibility: 'High', rationale: 'Kinase domain is druggable; value in CNS penetration, mutation coverage, and tolerability.' },
    { modality: 'CAR-T', feasibility: 'Low', rationale: 'Solid tumor trafficking + on-target off-tumor risk; not favored for near-term investor demo.' },
  ],
  selectivityConsiderations:
    'Selectivity matters at the level of ERBB family cross-reactivity (EGFR/HER4) for TKIs and for antibody epitope specificity. Off-target EGFR inhibition can drive rash/diarrhea; ADC payload drives systemic toxicity.',
  historicalAttrition:
    'Multiple successful approvals reduce target risk. Attrition is mainly from safety (cardiac, ILD) and lack of differentiation vs incumbents.',
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided modality tractability and differentiation framing',
  },
};

export const HER2_EXPRESSION_DATA = {
  therapeuticWindowScore: 'Moderate' as TherapeuticWindow,
  // Fold-change is computed as a rough tumor/normal ratio for demo visualization
  // using TCGA PanCancer Atlas (cBioPortal mRNA RSEM) medians vs GTEx v10 normal medians.
  bestIndication: { name: 'HER2+ Breast Cancer', foldChange: 192.9, rank: 1 },
  adcSuitability: {
    score: 'High',
    antigenDensity: 'High in HER2+ (IHC 3+); variable in HER2-low',
    internalizationRate: 'Moderate; sufficient for ADC clinical efficacy',
    recyclingVsDegradation: 'Mixed; payload/linker chemistry drives effective delivery',
  },
  gtexNormalTissues: [
    // Source: GTEx Portal v10 via https://gtexportal.org/api/v2/expression/geneExpression
    { name: 'Skin - Sun Exposed (Lower leg)', tpm: 120.132, isSafetyOrgan: false, category: 'skin' as const },
    { name: 'Skin - Not Sun Exposed (Suprapubic)', tpm: 112.355, isSafetyOrgan: false, category: 'skin' as const },
    { name: 'Esophagus - Mucosa', tpm: 112.8265, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Colon - Transverse', tpm: 51.8569, isSafetyOrgan: false, category: 'gi' as const },
    { name: 'Lung', tpm: 48.88925, isSafetyOrgan: true, category: 'lung' as const },
    { name: 'Uterus', tpm: 48.4735, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Bladder', tpm: 44.5434, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Heart - Atrial Appendage', tpm: 38.1471, isSafetyOrgan: true, category: 'heart' as const, implications: 'HER2 pathway is relevant to cardiomyocyte stress response → cardiac monitoring is standard for HER2 blockade.' },
    { name: 'Esophagus - Gastroesophageal Junction', tpm: 36.4137, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Breast - Mammary Tissue', tpm: 36.0161, isSafetyOrgan: false, category: 'other' as const },
    { name: 'Stomach', tpm: 35.5061, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Esophagus - Muscularis', tpm: 34.2435, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Heart - Left Ventricle', tpm: 21.17205, isSafetyOrgan: true, category: 'heart' as const },
    { name: 'Liver', tpm: 13.61465, isSafetyOrgan: true, category: 'liver' as const },
    { name: 'Kidney - Cortex', tpm: 53.78595, isSafetyOrgan: true, category: 'kidney' as const },
    { name: 'Brain - Cortex', tpm: 6.61543, isSafetyOrgan: true, category: 'brain' as const },
  ] as ExpressionTissue[],
  tcgaTumorExpression: [
    // Source: TCGA PanCancer Atlas via cBioPortal API (mRNA Expression, RSEM - batch normalized).
    { tumorType: 'Bladder (TCGA PanCan)', tcgaCode: 'BLCA', medianTPM: 7528.02, percentileRank: 95, sampleCount: 402 },
    { tumorType: 'Breast (TCGA PanCan)', tcgaCode: 'BRCA', medianTPM: 6945.99, percentileRank: 93, sampleCount: 994 },
    { tumorType: 'Lung Adenocarcinoma (TCGA PanCan)', tcgaCode: 'LUAD', medianTPM: 6111.64, percentileRank: 90, sampleCount: 503 },
    { tumorType: 'Endometrial (TCGA PanCan)', tcgaCode: 'UCEC', medianTPM: 4853.23, percentileRank: 86, sampleCount: 507 },
    { tumorType: 'Colorectal (TCGA PanCan)', tcgaCode: 'COADREAD', medianTPM: 4709.78, percentileRank: 84, sampleCount: 524 },
    { tumorType: 'Stomach (TCGA PanCan)', tcgaCode: 'STAD', medianTPM: 4253.798, percentileRank: 82, sampleCount: 407 },
    { tumorType: 'Ovarian (TCGA PanCan)', tcgaCode: 'OV', medianTPM: 3867.8701, percentileRank: 78, sampleCount: 201 },
    { tumorType: 'Esophageal (TCGA PanCan)', tcgaCode: 'ESCA', medianTPM: 3778.9193, percentileRank: 76, sampleCount: 181 },
    { tumorType: 'Head & Neck (TCGA PanCan)', tcgaCode: 'HNSC', medianTPM: 3350.565, percentileRank: 72, sampleCount: 488 },
    { tumorType: 'Lung Squamous (TCGA PanCan)', tcgaCode: 'LUSC', medianTPM: 2704.925, percentileRank: 68, sampleCount: 466 },
  ] as TumorExpression[],
  foldChangeData: [
    { indication: 'Breast (BRCA)', tumorTPM: 6945.99, normalTPM: 36.0161, foldChange: 192.9 },
    { indication: 'Bladder (BLCA)', tumorTPM: 7528.02, normalTPM: 44.5434, foldChange: 169.0 },
    { indication: 'Lung Adeno (LUAD)', tumorTPM: 6111.64, normalTPM: 48.88925, foldChange: 125.0 },
    { indication: 'Stomach (STAD)', tumorTPM: 4253.798, normalTPM: 35.5061, foldChange: 119.8 },
    { indication: 'Endometrial (UCEC)', tumorTPM: 4853.23, normalTPM: 48.4735, foldChange: 100.1 },
    { indication: 'Colorectal (COADREAD)', tumorTPM: 4709.78, normalTPM: 51.8569, foldChange: 90.8 },
  ],
  genomicAlterations: {
    // Source: cBioPortal API (TCGA PanCancer Atlas Studies), ERBB2 discrete CNA (GISTIC):
    // amplificationFrequency = % samples with GISTIC = 2 (high-level amplification)
    // copyNumberGain = % samples with GISTIC >= 1 (gain or amplification)
    amplificationFrequency: {
      BRCA: 11.8,
      STAD: 13.5,
      LUAD: 1.8,
      LUSC: 2.6,
      COADREAD: 3.4,
      UCEC: 5.1,
      OV: 3.5,
      BLCA: 5.2,
      HNSC: 1.8,
      ESCA: 15.5,
    },
    mutationFrequency: {
      BRCA: 2.9,
      STAD: 5.7,
      LUAD: 2.0,
      LUSC: 2.1,
      COADREAD: 3.8,
      UCEC: 7.3,
      OV: 0.0,
      BLCA: 12.2,
      HNSC: 1.4,
      ESCA: 6.1,
    },
    hotspotMutations: ['ERBB2 exon 20 insertions (lung)', 'activating kinase mutations (subset)'],
    fusionEvents: ['Rare / not a major driver'],
    copyNumberGain: {
      BRCA: 30.9,
      STAD: 33.2,
      LUAD: 43.9,
      LUSC: 34.1,
      COADREAD: 25.4,
      UCEC: 13.4,
      OV: 11.4,
      BLCA: 40.8,
      HNSC: 17.8,
      ESCA: 40.9,
    },
  },
  agents: ['target_biology', 'clinical'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided baseline expression and alteration framing for HER2',
    clinical: 'Provided clinical context for biomarker-defined populations',
  },
};

export const HER2_MECHANISTIC_DATA = {
  pathwayContext:
    'HER2 is a member of the ERBB receptor tyrosine kinase family. Amplification/overexpression drives dimerization-dependent signaling through PI3K/AKT and MAPK pathways, promoting proliferation and survival. HER2 is ligand-independent but becomes a preferred dimerization partner (notably with HER3), making it a central signaling node in HER2-driven tumors.',
  mechanismSummary:
    'Therapeutic strategies include extracellular blockade (trastuzumab/pertuzumab), targeted payload delivery (ADCs like T-DM1 and T-DXd), and kinase inhibition (TKIs such as tucatinib/neratinib). Resistance often emerges via pathway bypass (PI3K alterations), HER2 heterogeneity, or compensatory receptor signaling.',
  keyPublications: [
    {
      id: 1,
      title: 'Human breast cancer: correlation of relapse and survival with amplification of the HER-2/neu oncogene',
      authors: 'Slamon DJ, Clark GM, Wong SG, et al.',
      journal: 'Science',
      year: 1987,
      pmid: '2885846',
      keyFinding: 'Early evidence linking ERBB2 amplification to prognosis and tumor biology.',
    },
    {
      id: 2,
      title: 'Trastuzumab plus chemotherapy for metastatic breast cancer',
      authors: 'Slamon DJ, Leyland-Jones B, Shak S, et al.',
      journal: 'NEJM',
      year: 2001,
      pmid: '11352902',
      keyFinding: 'Establishes HER2 blockade benefit with trastuzumab in HER2+ disease.',
    },
    {
      id: 3,
      title: 'Trastuzumab deruxtecan vs trastuzumab emtansine for HER2-positive metastatic breast cancer (DESTINY-Breast03)',
      authors: 'Cortés J, Kim SB, Chung WP, et al.',
      journal: 'NEJM',
      year: 2022,
      pmid: '35320644',
      keyFinding: 'DESTINY-Breast03: T-DXd improves PFS vs T-DM1 in HER2+ metastatic breast cancer.',
    },
    {
      id: 4,
      title: 'Trastuzumab deruxtecan in previously treated HER2-low advanced breast cancer (DESTINY-Breast04)',
      authors: 'Modi S, Jacot W, Yamashita T, et al.',
      journal: 'NEJM',
      year: 2022,
      pmid: '35665782',
      keyFinding: 'DESTINY-Breast04: T-DXd improves PFS and OS vs chemotherapy in HER2-low metastatic breast cancer.',
    },
    {
      id: 5,
      title: 'Tucatinib, trastuzumab, and capecitabine for HER2-positive metastatic breast cancer with brain metastases (HER2CLIMB)',
      authors: 'Murthy RK, Loi S, Okines A, et al.',
      journal: 'JCO',
      year: 2020,
      pmid: '32468955',
      keyFinding: 'HER2CLIMB: significant intracranial response benefit in active brain metastases.',
    },
    {
      id: 6,
      title: 'HER2 testing in breast cancer: ASCO/CAP guideline update',
      authors: 'Wolff AC, Hammond MEH, Allison KH, et al.',
      journal: 'JCO',
      year: 2018,
      pmid: '29846122',
      keyFinding: 'Defines clinical diagnostic criteria for HER2 (IHC/FISH), enabling biomarker-driven therapy.',
    },
  ] as Citation[],
  preclinicalEvidence:
    'Preclinical work supports HER2 as a central signaling node; antibody blockade and ADC delivery show robust tumor regression in HER2-high models. HER3-mediated signaling and PI3K alterations are recurring resistance themes.',
  keyResearchers: ['Dennis Slamon', 'José Baselga', 'Javier Cortés', 'Koichi Nagata (DXd platform)'],
  evidenceGaps: [
    'Best differentiation hypothesis vs T-DXd (safety, CNS, biomarker wedge)',
    'Mechanistic drivers of ILD risk for DXd payloads and mitigation strategies',
    'Tumor heterogeneity management (HER2-low/heterogeneous expression)',
    'Optimal sequencing across lines and combinations (IO, TKIs, ADCs)',
  ],
  publicationTrend: [
    { year: 2018, count: 410 },
    { year: 2019, count: 465 },
    { year: 2020, count: 520 },
    { year: 2021, count: 610 },
    { year: 2022, count: 690 },
    { year: 2023, count: 760 },
    { year: 2024, count: 520 },
  ],
  agents: ['target_biology'] as const,
  primaryAgent: 'target_biology' as const,
  agentContributions: {
    target_biology: 'Provided HER2 pathway context, modality mapping, and key references',
  },
};

export const HER2_CLINICAL_PRECEDENT_DATA = {
  clinicalActivityScore: 'Validated' as ClinicalActivity,
  programsSummary: { total: 45, active: 20, approved: 8, failed: 6, terminated: 11 },
  clinicalTrials: [
    {
      nctId: 'NCT03529110',
      title: 'DESTINY-Breast03',
      phase: 'Phase 3',
      status: 'Completed' as const,
      sponsor: 'Daiichi Sankyo/AstraZeneca',
      indication: 'HER2+ metastatic breast cancer (2L)',
      startDate: '2018-05-01',
      results: {
        orr: '78.9%',
        pfs: '29.0 mo (vs 7.2 mo T-DM1; updated follow-up)',
        os: '52.6 mo (vs 42.7 mo T-DM1; updated follow-up)',
        safetyNotes: 'ILD/pneumonitis monitoring required; nausea/fatigue common',
      },
    },
    {
      nctId: 'NCT03734029',
      title: 'DESTINY-Breast04',
      phase: 'Phase 3',
      status: 'Completed' as const,
      sponsor: 'Daiichi Sankyo/AstraZeneca',
      indication: 'HER2-low metastatic breast cancer',
      startDate: '2018-12-01',
      results: {
        pfs: '10.1 mo (HR+ subgroup; 9.9 mo overall) vs 5.4/5.1 mo chemo',
        os: '23.4 mo vs 16.8 mo chemo (overall)',
        safetyNotes: 'ILD/pneumonitis risk remains key; expands addressable population',
      },
    },
    {
      nctId: 'NCT04494425',
      title: 'DESTINY-Breast06',
      phase: 'Phase 3',
      status: 'Active' as const,
      sponsor: 'Daiichi Sankyo/AstraZeneca',
      indication: 'HR+ HER2-low / HER2-ultralow metastatic breast cancer',
      startDate: '2020-10-01',
      results: {
        pfs: '13.2 mo vs 8.1 mo chemo (topline press release)',
        safetyNotes: 'Topline results reported by sponsor; await full peer-reviewed publication for complete safety breakdown',
      },
    },
    {
      nctId: 'NCT02073916',
      title: 'CLEOPATRA',
      phase: 'Phase 3',
      status: 'Completed' as const,
      sponsor: 'Roche',
      indication: 'HER2+ metastatic breast cancer (1L)',
      startDate: '2008-02-01',
      results: {
        orr: 'High (combo regimen)',
        pfs: 'Improved vs trastuzumab + chemo',
        safetyNotes: 'Cardiac monitoring standard for HER2 blockade',
      },
    },
    {
      nctId: 'NCT03043313',
      title: 'HER2CLIMB',
      phase: 'Phase 2',
      status: 'Completed' as const,
      sponsor: 'Seagen/Pfizer',
      indication: 'HER2+ metastatic breast cancer (incl. brain mets)',
      startDate: '2016-12-01',
      results: {
        orr: 'Intracranial ORR 47.3% (active brain metastases subset)',
        safetyNotes: 'CNS-active strategy; diarrhea risk for TKIs',
      },
    },
  ] as ClinicalTrial[],
  keyFindings:
    'HER2 is clinically validated with multiple approvals across mAbs, ADCs, and TKIs. The modern competitive bar is defined by T-DXd efficacy/durability (DESTINY-Breast03) and expansion into HER2-low (DESTINY-Breast04/06), plus CNS-active strategies (HER2CLIMB). Key safety liabilities include cardiotoxicity monitoring for HER2 blockade and ILD/pneumonitis risk for DXd-class ADCs.',
  failedApproaches: [
    { approach: 'Undifferentiated HER2 ADCs without clear safety/efficacy edge', reason: 'Crowded landscape; strong incumbents' },
    { approach: 'Broad HER family TKIs with poor tolerability', reason: 'Off-target EGFR effects limit dosing' },
  ],
  translationalInsights:
    'Biomarker definition is critical (HER2 IHC/FISH; HER2-low; HER2 mutations). Tumor heterogeneity drives variable response; payload and bystander effects can help. CNS penetration differentiates some regimens. Safety monitoring (LVEF, ILD) is a gating operational requirement.',
  agents: ['clinical'] as const,
  primaryAgent: 'clinical' as const,
  agentContributions: {
    clinical: 'Provided clinical precedent framing and key safety/efficacy themes',
  },
};

export const HER2_SAFETY_DATA = {
  safetyScore: 'Manageable' as SafetyScore,
  geneticSafetySignals: [
    { signal: 'HER2 signaling supports cardiac stress adaptation', severity: 'Medium', implication: 'Cardiac monitoring (LVEF) is standard in HER2 therapies' },
  ],
  expressionConcerns: [
    { organ: 'Heart', expression: 'Low-moderate', concern: 'Cardiomyopathy risk (esp. with anthracyclines)', severity: 'High', clinicalManifestation: 'Asymptomatic LVEF drop; rare CHF with risk factors' },
    { organ: 'Lung', expression: 'Variable/low', concern: 'ILD/pneumonitis risk with DXd ADCs', severity: 'High', clinicalManifestation: 'ILD requires early recognition + steroids; can be severe/rarely fatal' },
    { organ: 'GI', expression: 'Low', concern: 'Diarrhea with TKIs (EGFR cross-reactivity)', severity: 'Medium', clinicalManifestation: 'Diarrhea/rash impacts tolerability and adherence' },
  ],
  knockoutPhenotypes: {
    mouse: 'ERBB2 knockout is embryonic lethal; not directly informative for adult therapeutic inhibition.',
    human: 'Clinical risk is primarily on-treatment toxicity profile, not germline LoF phenotype.',
  },
  mechanismBasedRisks: [
    'Cardiac monitoring and dose modifications for HER2 blockade regimens',
    'ILD monitoring/management for DXd-class ADCs',
    'GI toxicity and rash for less-selective HER family TKIs',
  ],
  classSafetyHistory: [
    { drug: 'Trastuzumab', safetyProfile: 'Cardiac dysfunction risk; infusion reactions', mitigation: 'Baseline and serial LVEF; avoid/monitor with anthracyclines', mtf: 'Standard dosing' },
    {
      drug: 'T-DXd (Enhertu)',
      safetyProfile: 'ILD/pneumonitis (reported ~12% overall; fatal ~0.9% in label-level pooled populations at 5.4 mg/kg). Neutropenia Grade 3/4 ~19% (label).',
      mitigation: 'Prompt ILD workup; permanently discontinue for Grade ≥2 ILD/pneumonitis; CBC monitoring and dose modifications for neutropenia.',
      mtf: '5.4 mg/kg q3w (indication-dependent)',
    },
    { drug: 'HER2 TKIs (e.g., neratinib)', safetyProfile: 'Diarrhea and rash', mitigation: 'Prophylaxis, dose adjustment', mtf: 'Oral regimens' },
  ],
  therapeuticIndex: {
    estimate: 'Context-dependent',
    basis: 'Biomarker selection (HER2-high) improves efficacy; safety depends on modality and payload.',
  },
  monitoringRequirements: [
    'Baseline + serial LVEF (echo/MUGA) for HER2 blockade',
    'ILD monitoring (symptoms; imaging per label for DXd ADCs)',
    'GI symptom monitoring for TKIs (diarrhea management)',
  ],
  agents: ['clinical'] as const,
  primaryAgent: 'clinical' as const,
  agentContributions: {
    clinical: 'Provided class safety liabilities and monitoring requirements',
  },
};

export const HER2_KEY_EXPERIMENTS_DATA = {
  evidenceGaps: [
    { gap: 'Differentiation vs Enhertu in a specific segment', priority: 'High', type: 'Strategy', description: 'Define wedge: CNS, HER2-low, HER2-mutant, safety, sequencing, biomarker.' },
    { gap: 'ILD mitigation strategy for DXd-like payloads (if used)', priority: 'High', type: 'Safety', description: 'Early signal detection + risk factors + monitoring + label strategy.' },
    { gap: 'Biomarker strategy for heterogeneity (HER2-low / heterogeneous)', priority: 'Medium', type: 'Translational', description: 'Define assay + cutoff + response correlation.' },
    { gap: 'Competitive sequencing model', priority: 'Medium', type: 'Clinical', description: 'Where do we sit vs mAbs/ADCs/TKIs in guidelines?' },
  ],
  recommendedExperiments: [
    { experiment: 'Biomarker cutoff + heterogeneity study (IHC/FISH/NGS)', priority: 'High', timeline: '6–8 weeks', rationale: 'Pick the segment we can win and define who benefits.', resourceEstimate: '1–2 FTE, $75–150K', deliverables: ['Cutoffs', 'Prevalence estimate', 'Response hypothesis'] },
    { experiment: 'Safety package focused on cardiac + ILD risk', priority: 'High', timeline: '8–12 weeks', rationale: 'De-risk label-level liabilities early.', resourceEstimate: '2–3 FTE, $200–350K', deliverables: ['Risk mitigation plan', 'Monitoring protocol', 'Stop/hold rules'] },
  ],
  goNoGoCriteria: {
    advanceIf: [
      'Clear differentiation thesis tied to measurable endpoints (safety, CNS, segment)',
      'Biomarker strategy is operationally feasible and defensible',
      'Safety liabilities are monitorable/mitigable within label expectations',
    ],
    stopIf: [
      'No plausible wedge vs best-in-class T-DXd in any meaningful segment',
      'ILD or cardiac risk profile is unacceptable relative to competitors',
      'No defensible IP/differentiation (me-too risk)',
    ],
  },
  resourceEstimate: 'Total: ~6–10 FTE-weeks + $300–500K for a demo-grade de-risking plan',
  timelineToDecision: '8–12 weeks to a crisp “wedge + plan” recommendation',
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized a practical de-risking plan focused on differentiation + safety for HER2',
  },
};

// ============================================
// SCOUT/BD PERSONA DATA (HER2)
// ============================================

export const HER2_BD_EXECUTIVE_SUMMARY = {
  opportunityRating: 'Attractive' as OpportunityRating,
  strategicFit: 'Strong Fit' as StrategicFit,
  summaryText:
    'HER2 remains one of the largest, most de-risked oncology franchises. Value creation hinges on a differentiated wedge vs Enhertu-led standards (CNS activity, HER2-low segmentation, improved safety/tolerability, or novel combinations). Deal comps (e.g., T-DXd collaboration economics) show willingness to pay for platform-level differentiation, but “me-too” HER2 assets are heavily discounted.',
  quickMetrics: {
    developmentStage: 'Concept / Preclinical–Phase 1',
    patentLife: '2036–2042 (dependent on construct/platform)',
    marketOpportunity: '$15–25B+ (HER2 franchise, broad)',
    competitivePosition: 'High bar (Enhertu sets standard)',
    totalDealValue: '$1–7B+ (highly differentiation-dependent)',
  },
  keyValueDrivers: [
    'Large validated market with established reimbursement pathways',
    'Clear biomarker + diagnostic workflow (IHC/FISH)',
    'Multiple segments to target (HER2+, HER2-low, HER2-mutant, CNS)',
    'Platform economics validated by precedent transactions (DXd)',
  ],
  keyRisks: [
    'Incumbent dominance (Enhertu) compresses value of incremental assets',
    'Safety liabilities (ILD/cardiac) can cap adoption and label',
    'Crowded pipeline (multiple ADCs) narrows white space',
  ],
  recommendedAction: 'Pursue a wedge-first diligence plan (segment + differentiation + safety) before deep resourcing',
  valuationRange: '$1–7B total economics (wide range; depends on data + platform)',
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Baseline BD framing for HER2 with differentiation-first lens',
  },
};

export const HER2_COMPETITIVE_LANDSCAPE_DATA = {
  competitiveIntensity: 'Crowded' as const,
  competitors: [
    {
      company: 'Daiichi Sankyo / AstraZeneca',
      asset: 'Enhertu (T-DXd)',
      modality: 'ADC (DXd)',
      stage: 'Approved',
      indication: 'HER2+ BC, HER2-low BC, gastric, NSCLC (subsets)',
      differentiation: 'Best-in-class efficacy; strong bystander effect; ILD risk requires monitoring',
      expectedMilestone: 'Earlier-line expansions / new indications',
      milestoneDate: '2025–2026',
    },
    {
      company: 'Roche',
      asset: 'Herceptin/Perjeta/Phesgo',
      modality: 'mAbs',
      stage: 'Approved',
      indication: 'HER2+ breast (backbone)',
      differentiation: 'Entrenched first-line backbone; biosimilar era affects economics',
      expectedMilestone: 'Lifecycle management',
      milestoneDate: 'Ongoing',
    },
    {
      company: 'Genentech/Roche',
      asset: 'Kadcyla (T-DM1)',
      modality: 'ADC (DM1)',
      stage: 'Approved',
      indication: 'HER2+ breast (historical 2L/adj)',
      differentiation: 'Displaced in metastatic setting by T-DXd but still relevant',
      expectedMilestone: 'Guideline evolution',
      milestoneDate: 'Ongoing',
    },
  ] as Competitor[],
  differentiationAnalysis:
    'Winning strategies cluster around: (1) safer ADCs with comparable efficacy, (2) CNS-active approaches, (3) HER2-low/HER2-heterogeneous patient selection, and (4) HER2-mutant biology. Generic HER2 ADCs without a wedge are unlikely to attract premium terms.',
  competitiveRisks: [
    'Enhertu continues to move earlier in lines, raising the efficacy bar',
    'Multiple HER2 ADCs in late-stage trials compress differentiation windows',
    'Biosimilar dynamics shift pricing expectations for antibody backbones',
  ],
  whiteSpaceOpportunities: [
    { opportunity: 'CNS-active HER2 strategies', rationale: 'Brain metastases remain a key unmet need; CNS penetration is differentiated.' },
    { opportunity: 'HER2-heterogeneous tumors', rationale: 'Heterogeneity is common; approaches that handle mixed expression can win.' },
    { opportunity: 'Improved ILD risk profile', rationale: 'Safety differentiation can drive adoption and payer preference.' },
  ],
  agents: ['market_research'] as const,
  primaryAgent: 'market_research' as const,
  agentContributions: {
    market_research: 'Competitive framing for HER2 around wedges and incumbent standards',
  },
};

export const HER2_IP_FTO_DATA = {
  ipPosition: 'Contested' as IPPosition,
  patentSummary:
    'HER2 is a mature space with extensive prior art. Differentiation and value come from construct-level IP (epitope, linker/payload, dosing, combinations) and platform patents. FTO is often complex for DXd-like payload/linker strategies.',
  keyPatents: [] as any,
  ftoAssessment:
    'Treat FTO as gating: run claim charts on payload/linker families and define design-around options early. Avoid assuming freedom just because the target is public.',
  ipRisks: [
    'Platform IP (payload/linker) can be blocking even if target biology is public',
    'Method-of-treatment claims can constrain certain regimens/combos',
  ],
  ipOpportunities: [
    'File around a defensible wedge (CNS, HER2-low heterogeneity, safety)',
    'Provisional filings for biomarkers/companion diagnostics and dosing',
  ],
  litigationHistory: 'Crowded space; licensing is common; treat as diligence item rather than surprise.',
  ftoOpinionStatus: 'Not started',
  agents: ['patent'] as const,
  primaryAgent: 'patent' as const,
  agentContributions: {
    patent: 'Baseline IP/FTO caution for a mature target space',
  },
};

export const HER2_MARKET_OPPORTUNITY_DATA = {
  tam: { value: 20, unit: 'B', year: 2030, cagr: 8.5, currency: 'USD' },
  segments: [
    { name: 'HER2+ Breast', size: 8.0, share: 40, color: '#0A84FF', patients: 'Biomarker-defined subset' },
    { name: 'HER2-low Breast', size: 7.0, share: 35, color: '#30D158', patients: 'Large expansion segment' },
    { name: 'Gastric/GEJ', size: 2.0, share: 10, color: '#FF9F0A', patients: 'HER2+ subset' },
    { name: 'HER2-mutant (lung/others)', size: 3.0, share: 15, color: '#FF453A', patients: 'NGS-defined subsets' },
  ],
  competitiveDynamics:
    'Market is dominated by best-in-class ADCs and established antibody backbones. New entrants must show clear value in a segment where the incumbent does not fully solve the problem (CNS, safety, heterogeneity).',
  pricingConsiderations:
    'Pricing headroom exists for differentiated outcomes; payers will resist “me-too” HER2 entrants without compelling clinical advantage.',
  marketRisks: [
    'Incumbent dominance reduces uptake for incremental entrants',
    'Safety label constraints can limit real-world adoption',
    'Crowded pipeline compresses future share',
  ],
  upsideScenarios: [
    'CNS differentiation drives premium adoption',
    'Better safety profile expands treatable population',
    'Winning HER2-low heterogeneity unlocks large segment',
  ],
  penetrationAssumptions: {
    conservative: '5–10% share in a niche segment',
    base: '10–20% share in a defined wedge',
    optimistic: '20%+ share with best-in-class differentiation',
  },
  agents: ['financial', 'market_research'] as const,
  primaryAgent: 'financial' as const,
  agentContributions: {
    financial: 'Market sizing framing for an established franchise',
    market_research: 'Competitive dynamics and segment wedge framing',
  },
};

export const HER2_DEAL_LANDSCAPE_DATA = {
  dealActivity: 'Active' as DealActivity,
  comparableDeals: [
    {
      asset: 'Enhertu (HER2 ADC; DXd platform)',
      acquirer: 'AstraZeneca',
      seller: 'Daiichi Sankyo',
      date: '2019-03-28',
      stage: 'Phase 2',
      upfront: '$1.35B',
      milestones: '$5.55B',
      totalValue: '$6.9B',
      royalties: 'Mid-teens to low-20s',
      notes: 'Reference HER2 ADC collaboration; platform-level economics when differentiation is strong.',
    },
    {
      asset: 'Disitamab vedotin (RC48; HER2 ADC)',
      acquirer: 'Seagen',
      seller: 'RemeGen',
      date: '2021-08-09',
      stage: 'Clinical-stage',
      upfront: '$200M',
      milestones: 'Up to $2.4B',
      totalValue: 'Up to $2.6B+',
      royalties: 'High single-digit to mid-teens',
      notes: 'Exclusive ex-territory license + co-development; HER2 ADC with prior regional approvals/BTD history (per press).',
    },
    {
      asset: 'DB-1303 / BNT323 (HER2 ADC)',
      acquirer: 'BioNTech',
      seller: 'DualityBio',
      date: '2023-04-17',
      stage: 'Clinical-stage',
      upfront: '$170M',
      milestones: 'Up to $1.5B+',
      totalValue: 'Up to $1.67B+',
      royalties: 'Tiered royalties (net sales)',
      notes: 'Global strategic partnership (ex-Mainland China/HK/Macau).',
    },
    {
      asset: 'LCB14 (HER2 ADC)',
      acquirer: 'Iksuda Therapeutics',
      seller: 'LegoChem Biosciences',
      date: '2022-01-10',
      stage: 'Preclinical/early clinical',
      upfront: '$50M',
      milestones: 'Up to $950M',
      totalValue: 'Up to $1.0B',
      royalties: 'Royalties (net sales)',
      notes: 'Exclusive worldwide rights excluding Greater China and South Korea (per press).',
    },
  ] as ComparableDeal[],
  valuationContext:
    'HER2 deal values range widely. Platform-level differentiation can command multi-billion economics; incremental HER2 assets often trade at steep discounts. Investors will ask: what is the wedge and why do we win vs Enhertu?',
  potentialPartners: ['Large oncology pharma', 'ADC platform players', 'Regional partners for ex-US rights'],
  dealStructureConsiderations: [
    'Stage-gate economics to differentiation proof',
    'Consider indication/segment-based options',
    'Tie milestones to safety/efficacy/label differentiation',
  ],
  recentTrends: ['Platform partnerships remain active; “me-too” assets struggle to clear IC'],
  agents: ['financial'] as const,
  primaryAgent: 'financial' as const,
  agentContributions: {
    financial: 'Deal comp anchoring for HER2 via the T-DXd reference transaction',
  },
};

export const HER2_STRATEGIC_RECOMMENDATION_DATA = {
  recommendation: 'Define wedge first',
  strategicRationale:
    'HER2 is validated, but differentiation is the gating factor. A pitch-ready plan must specify the segment (HER2-low, CNS, HER2-mutant, safety) and how evidence will prove superiority. Without a wedge, the asset is not financeable in a crowded franchise.',
  keyDiligenceQuestions: [
    'What is the specific wedge vs Enhertu (and how will we measure it)?',
    'What is the expected safety profile (ILD/cardiac) and mitigation strategy?',
    'What is the IP moat around the construct/platform?',
    'Where in sequencing/guidelines does the product fit?',
  ],
  proposedNextSteps: [
    { action: 'Pick target segment + biomarker definition', owner: 'R&D/Clinical', timeline: '2 weeks', priority: 'High' },
    { action: 'Build differentiation evidence plan (preclinical + clinical endpoints)', owner: 'R&D/Clinical', timeline: '3–4 weeks', priority: 'High' },
    { action: 'Run initial IP/FTO screen on payload/linker strategy', owner: 'IP/Legal', timeline: '2–3 weeks', priority: 'High' },
  ],
  dealConsiderations: [
    'Align economics to wedge proof (option structures)',
    'Prioritize partners who add platform value (CMC, ADC, global development)',
  ],
  riskMitigation: ['Stage-gate by safety/differentiation', 'Pre-specify walk-away criteria'],
  walkAwayCriteria: [
    'No credible wedge vs best-in-class incumbent',
    'Unacceptable ILD/cardiac risk profile',
    'No defensible IP/FTO position for the chosen construct',
  ],
  internalAlignment: ['Exec: wedge-first', 'Clinical: segment strategy', 'IP: gating diligence'],
  agents: ['sonny'] as const,
  primaryAgent: 'sonny' as const,
  agentContributions: {
    sonny: 'Synthesized an investor-friendly wedge-first plan for a mature franchise',
  },
};

