# KRAS G12C & HER2 Structured Data Planning Document

**Date:** 2025-01-27  
**Purpose:** Plan extraction and structuring of demo scenario data into TROP2-style baseline tile constants  
**Status:** Planning Phase - No Implementation Yet

---

## 🎯 Objective

Transform the existing demo scenario markdown responses for **KRAS G12C** and **HER2** into structured TypeScript constants matching the TROP2 baseline tile data structure. This will enable rich, interactive tiles with charts, filters, and specialized visualizations.

---

## 📊 Current State Analysis

### Data Sources

**KRAS G12C:**
- **Location:** `src/lib/demoMultiAgentScenarios.ts` (line ~3550+)
- **Agents:** Target Biology, Clinical, Patent, Financial, Regulatory, Market Research
- **Format:** Markdown strings in agent responses
- **Length:** ~2,000+ lines of markdown content

**HER2:**
- **Location:** `src/lib/demoMultiAgentScenarios.ts` (line ~6326+)
- **Agents:** Target Biology, Clinical, Patent, Financial, Regulatory, Market Research
- **Format:** Markdown strings in agent responses
- **Length:** ~2,000+ lines of markdown content

### TROP2 Template Structure

**Target:** `src/constants/index.ts`

**Scientist Dashboard (7 tiles):**
1. `SCIENTIST_EXECUTIVE_SUMMARY` - Overall assessment
2. `EXPRESSION_DATA` - Expression biology with charts
3. `GENETIC_VALIDATION_DATA` - Genetic evidence
4. `DRUGGABILITY_DATA` - Druggability assessment
5. `MECHANISTIC_DATA` - Mechanism of action
6. `CLINICAL_PRECEDENT_DATA` - Clinical trials
7. `SAFETY_DATA` - Safety assessment
8. `KEY_EXPERIMENTS_DATA` - Recommended experiments

**Scout/BD Dashboard (7 tiles):**
1. `BD_EXECUTIVE_SUMMARY` - BD opportunity summary
2. `COMPETITIVE_LANDSCAPE_DATA` - Competitive analysis
3. `IP_FTO_DATA` - IP and freedom-to-operate
4. `MARKET_OPPORTUNITY_DATA` - Market sizing
5. `DEAL_LANDSCAPE_DATA` - Comparable deals
6. `STRATEGIC_RECOMMENDATION_DATA` - BD recommendations
7. `CLINICAL_PRECEDENT_DATA` - (Reused for Scientific Validation)

---

## 🔍 Data Extraction Mapping

### KRAS G12C - Data Available in Demo Scenario

#### 1. Target Biology Specialist Response

**Available Data:**
- ✅ Target overview (gene, protein, MOA, UniProt ID)
- ✅ Genetic validation (driver mutation evidence, COSMIC, TCGA)
- ✅ Direction of effect (inhibition hypothesis)
- ✅ Pathway position (MAPK, PI3K)
- ✅ Mechanism of action (covalent inhibition)
- ✅ Expression analysis (tissue profile, TPM values)
- ✅ Druggability (structural data, PDB structures)
- ✅ Safety assessment (constraint metrics, phenotypes)
- ✅ Translational confidence (biomarkers, models)
- ✅ Competitive landscape (approved drugs)
- ✅ Key risks (5 program-killing risks)
- ✅ Citations (20+ with PMID, DOI)

**Mapping to TROP2 Structure:**
- → `SCIENTIST_EXECUTIVE_SUMMARY` (overall score, recommendation, strengths, risks)
- → `GENETIC_VALIDATION_DATA` (validation score, GWAS, constraint metrics)
- → `EXPRESSION_DATA` (tissue expression, tumor expression, fold-change)
- → `DRUGGABILITY_DATA` (druggability score, structural data, existing compounds)
- → `MECHANISTIC_DATA` (pathway context, mechanism, publications)
- → `SAFETY_DATA` (safety score, genetic signals, expression concerns)
- → `KEY_EXPERIMENTS_DATA` (evidence gaps, recommended experiments)

**Gaps to Fill:**
- ⚠️ Expression data needs to be structured into arrays (GTEx tissues, TCGA tumors)
- ⚠️ Fold-change calculations need to be extracted/calculated
- ⚠️ Genomic alterations data (amplification, mutations) needs to be structured
- ⚠️ Publication trend data (yearly counts) needs to be extracted

#### 2. Clinical Analyst Response

**Available Data:**
- ✅ Clinical activity score ("Validated")
- ✅ Approved drugs (Lumakras, Krazati with dates)
- ✅ Clinical trials (NCT IDs, phases, results)
- ✅ Key findings (ORR, PFS, OS data)
- ✅ Failed approaches (historical context)
- ✅ Translational insights
- ✅ Citations (10+ with PMID)

**Mapping to TROP2 Structure:**
- → `CLINICAL_PRECEDENT_DATA` (clinical activity score, programs summary, clinical trials array)

**Gaps to Fill:**
- ⚠️ Programs summary (total, active, approved, failed counts) needs calculation
- ⚠️ Clinical trials need to be structured into array format
- ⚠️ Results data (ORR, PFS, OS) needs to be extracted into structured format

#### 3. Patent Expert Response

**Available Data:**
- ✅ Patent summary
- ✅ Key patents (patent numbers, owners, filing dates, expiry dates)
- ✅ FTO assessment
- ✅ IP risks
- ✅ IP opportunities
- ✅ Litigation history
- ✅ Citations (patent numbers, USPTO links)

**Mapping to TROP2 Structure:**
- → `IP_FTO_DATA` (IP position, patent summary, key patents array, FTO assessment)

**Gaps to Fill:**
- ⚠️ Patent claims need to be extracted into array format
- ⚠️ Patent types (composition, method) need to be categorized

#### 4. Financial Analyst Response

**Available Data:**
- ✅ Current market performance (sales data, growth rates)
- ✅ Market sizing (TAM, SAM, SOM)
- ✅ Revenue forecasts (yearly projections)
- ✅ Pricing considerations
- ✅ Comparable deals (deal values, dates, companies)
- ✅ Citations (SEC filings, company reports)

**Mapping to TROP2 Structure:**
- → `MARKET_OPPORTUNITY_DATA` (TAM, segments, competitive dynamics, pricing)
- → `DEAL_LANDSCAPE_DATA` (deal activity, comparable deals array, valuation context)

**Gaps to Fill:**
- ⚠️ Market segments need to be structured into array format
- ⚠️ Comparable deals need to be structured into array format
- ⚠️ Deal structure considerations need to be extracted

#### 5. Regulatory Specialist Response

**Available Data:**
- ✅ Regulatory pathway (accelerated approval)
- ✅ Endpoint architecture (ORR, PFS, OS)
- ✅ Trial design expectations
- ✅ Companion diagnostic requirements
- ✅ Regulatory exclusivity (NCE, PTE)
- ✅ Label expansion opportunities
- ✅ Regulatory risks
- ✅ Global regulatory considerations (EMA, PMDA, NMPA)
- ✅ Citations (FDA approval letters, ClinicalTrials.gov)

**Mapping to TROP2 Structure:**
- → `CLINICAL_PRECEDENT_DATA` (regulatory pathway info can be added)
- → `SAFETY_DATA` (regulatory safety considerations)

**Gaps to Fill:**
- ⚠️ Regulatory data is mostly text-based, needs to be structured

#### 6. Market Research Analyst Response

**Available Data:**
- ✅ Competitive landscape (competitors, differentiation)
- ✅ Market share forecasts
- ✅ Payer dynamics
- ✅ Physician adoption
- ✅ KOL insights
- ✅ Citations (market research reports)

**Mapping to TROP2 Structure:**
- → `COMPETITIVE_LANDSCAPE_DATA` (competitive intensity, competitors array, differentiation)
- → `MARKET_OPPORTUNITY_DATA` (market dynamics, penetration assumptions)

**Gaps to Fill:**
- ⚠️ Competitors need to be structured into array format
- ⚠️ Market share data needs to be extracted

---

### HER2 - Data Available in Demo Scenario

**Note:** HER2 demo scenario structure similar to KRAS G12C. Need to review specific content to extract HER2-specific data.

**Expected Data Categories:**
- Target biology (HER2 overexpression, amplification)
- Clinical precedent (Enhertu, Herceptin, Kadcyla)
- Patent landscape (HER2-targeting patents)
- Financial analysis (Enhertu sales, market opportunity)
- Regulatory pathway (HER2 approvals)
- Market research (HER2+ vs HER2-low, adoption patterns)

**Mapping:** Same structure as KRAS G12C, but HER2-specific values.

---

## 📋 Data Extraction Plan

### Phase 1: Data Inventory

**For Each Target (KRAS G12C, HER2):**

1. **Read demo scenario file**
   - Identify all agent responses
   - Extract markdown content
   - Note citations and references

2. **Categorize data by tile type**
   - Map each agent response to corresponding TROP2 tile structure
   - Identify what data is available
   - Note what data is missing

3. **Create data extraction checklist**
   - List all fields needed for each tile
   - Mark which fields are available in demo data
   - Mark which fields need to be calculated/derived
   - Mark which fields need external research

### Phase 2: Data Extraction

**For Each Tile Type:**

1. **Extract quantitative data**
   - Numbers (scores, percentages, counts)
   - Arrays (tissues, tumors, trials, patents, deals)
   - Dates (approval dates, filing dates, expiry dates)

2. **Extract structured data**
   - Objects (clinical trials, patents, deals)
   - Arrays with consistent structure
   - Nested data (trial results, patent claims)

3. **Extract citations**
   - PMID, DOI, NCT IDs
   - Authors, journals, years
   - URLs and links

4. **Extract text summaries**
   - Paragraph summaries
   - Key findings
   - Rationale and assessments

### Phase 3: Data Structuring

**For Each Constant:**

1. **Create TypeScript interface**
   - Match TROP2 interface structure
   - Ensure type safety
   - Add target-specific fields if needed

2. **Populate data object**
   - Fill in all available fields
   - Use placeholder/calculated values for missing data
   - Ensure data types match interface

3. **Validate data structure**
   - Check all required fields present
   - Verify array structures match tile component expectations
   - Ensure citation format is consistent

### Phase 4: Data Enrichment

**For Missing Data:**

1. **Calculate derived values**
   - Fold-changes from expression data
   - Percentages from counts
   - Scores from multiple metrics

2. **Research external data** (if needed)
   - GTEx expression data (if not in demo)
   - TCGA tumor expression (if not in demo)
   - Additional clinical trials (if demo incomplete)
   - Patent details (if demo incomplete)

3. **Create reasonable estimates**
   - Use TROP2 patterns as guide
   - Ensure estimates are realistic
   - Document assumptions

---

## 📐 Detailed Mapping: KRAS G12C

### Tile 1: SCIENTIST_EXECUTIVE_SUMMARY

**Available in Demo:**
- ✅ Overall assessment ("STRONG validation", "Grade: A")
- ✅ Recommendation ("ADVANCE")
- ✅ Confidence level (implied: "HIGH")
- ✅ Summary text (paragraph from Target Biology)
- ✅ Key strengths (5 items listed)
- ✅ Key concerns (4 items listed)
- ✅ Quick metrics (implied from various sections)

**Extraction Plan:**
```typescript
export const KRAS_G12C_SCIENTIST_EXECUTIVE_SUMMARY = {
  overallScore: 88, // Convert "STRONG" to numeric (TROP2 = 82)
  recommendation: 'Advance' as Recommendation,
  confidenceLevel: 0.90, // "HIGH" confidence
  dataFreshness: '2024-01-15',
  summaryText: "KRAS G12C represents a validated oncogenic target...", // Extract from demo
  quickMetrics: {
    geneticValidation: 'Gold Standard' as ValidationScore, // Extract
    therapeuticWindow: 'Favorable' as TherapeuticWindow, // Extract/derive
    druggability: 'High' as DruggabilityScore, // Extract
    safetyProfile: 'Manageable' as SafetyScore, // Extract
  },
  keyStrengths: [
    'Strong genetic validation - Gold standard driver mutation evidence', // Extract
    'Proven druggability - Two FDA-approved drugs validate approach', // Extract
    // ... 3 more from demo
  ],
  keyRisks: [
    'Modest single-agent efficacy - ORR ~35-45%, PFS ~6-7 months', // Extract
    'Resistance development - Secondary mutations emerge in 40-60%', // Extract
    // ... 2 more from demo
  ],
  weightedScoring: {
    genetic: { score: 95, weight: 0.2 }, // Calculate from demo data
    expression: { score: 75, weight: 0.25 }, // Calculate
    druggability: { score: 90, weight: 0.2 }, // Extract
    safety: { score: 72, weight: 0.2 }, // Extract
    clinical: { score: 85, weight: 0.15 }, // Extract
  },
};
```

**Gaps:**
- ⚠️ Need to convert qualitative assessments to numeric scores
- ⚠️ Need to calculate weighted scoring from individual metrics
- ⚠️ Need to extract/derive therapeutic window assessment

### Tile 2: EXPRESSION_DATA

**Available in Demo:**
- ✅ Tissue profile table (Lung, Colon, Pancreas, Heart, Liver with TPM)
- ✅ Cell-type specificity (ubiquitous expression)
- ✅ Disease vs. normal (mutation frequency, not expression level)
- ✅ Therapeutic window (mutant-specific targeting)

**Extraction Plan:**
```typescript
export const KRAS_G12C_EXPRESSION_DATA = {
  therapeuticWindowScore: 'Favorable' as TherapeuticWindow, // Extract
  bestIndication: { 
    name: 'NSCLC', 
    foldChange: 0, // Not applicable (mutation, not expression)
    rank: 1 
  },
  adcSuitability: {
    score: 'N/A', // Not ADC target
    // ... other fields N/A
  },
  gtexNormalTissues: [
    { name: 'Lung', tpm: 45.2, isSafetyOrgan: true, category: 'lung' as const },
    { name: 'Colon', tpm: 38.7, isSafetyOrgan: true, category: 'gi' as const },
    { name: 'Pancreas', tpm: 52.1, isSafetyOrgan: true, category: 'other' as const },
    { name: 'Heart', tpm: 12.3, isSafetyOrgan: true, category: 'heart' as const },
    { name: 'Liver', tpm: 28.9, isSafetyOrgan: true, category: 'liver' as const },
    // ... expand to 15+ tissues using GTEx data
  ] as ExpressionTissue[],
  tcgaTumorExpression: [
    {
      tumorType: 'NSCLC (Adeno)',
      tcgaCode: 'LUAD',
      medianTPM: 45.2, // Use normal tissue TPM (mutation, not overexpression)
      percentileRank: 50, // Estimate
      sampleCount: 515,
    },
    {
      tumorType: 'Colorectal',
      tcgaCode: 'COAD',
      medianTPM: 38.7,
      percentileRank: 50,
      sampleCount: 457,
    },
    // ... add more tumor types
  ] as TumorExpression[],
  foldChangeData: [
    // Not applicable for KRAS (mutation, not expression differential)
    // Could use mutation frequency instead
  ],
  genomicAlterations: {
    amplificationFrequency: { LUAD: 0, COAD: 0 }, // KRAS rarely amplified
    mutationFrequency: { LUAD: 13, COAD: 3.5 }, // Extract from demo
    hotspotMutations: ['G12C', 'G12D', 'G12V'], // Extract
    fusionEvents: ['None reported'], // Extract
    copyNumberGain: { LUAD: 0, COAD: 0 }, // Extract
  },
};
```

**Gaps:**
- ⚠️ Need to expand tissue list to 15+ (use GTEx data)
- ⚠️ Need to add more tumor types (use TCGA data)
- ⚠️ Fold-change not applicable (mutation-based, not expression-based)
- ⚠️ ADC suitability not applicable (small molecule target)

### Tile 3: GENETIC_VALIDATION_DATA

**Available in Demo:**
- ✅ Validation score ("GOLD STANDARD")
- ✅ Validation summary (paragraph)
- ✅ Driver vs passenger assessment (detailed)
- ✅ Direction of effect (inhibition hypothesis)
- ✅ Constraint metrics (pLI, LOEUF, mis_z)
- ✅ Human phenotype data (Noonan syndrome)
- ✅ Citations (COSMIC, TCGA, gnomAD)

**Extraction Plan:**
```typescript
export const KRAS_G12C_GENETIC_VALIDATION_DATA = {
  validationScore: 'Gold Standard' as ValidationScore, // Extract
  validationSummary: "KRAS G12C shows strong genetic validation...", // Extract paragraph
  gwasAssociations: [
    {
      disease: 'NSCLC',
      score: 0.95, // Driver mutation evidence
      evidenceType: 'Driver Mutation' as const,
      keyVariants: ['G12C'],
      effectSize: undefined, // Not applicable
      pValue: undefined, // Not applicable
    },
    // ... add more if available
  ] as GWASAssociation[],
  constraintMetrics: {
    pLI: 1.00, // Extract from demo
    LOEUF: 0.05, // Extract
    lofObserved: undefined, // Not applicable (oncogene)
    lofExpected: undefined, // Not applicable
    homozygousCarriers: undefined, // Not applicable
  } as ConstraintMetrics,
  mendelianDiseases: ['Noonan syndrome'], // Extract
  directionOfEffect: 'Inhibition reduces oncogenic signaling', // Extract
  biobankEvidence: [
    {
      source: 'COSMIC',
      finding: 'G12C is recurrent hotspot mutation in NSCLC (13%)',
    },
    {
      source: 'TCGA',
      finding: 'G12C clustered in P-loop domain, functional validation',
    },
    // ... add more
  ],
  lofCarrierPhenotypes: "Not applicable - oncogene, not tumor suppressor", // Extract
};
```

**Gaps:**
- ⚠️ GWAS associations need to be structured (currently text)
- ⚠️ Constraint metrics are available but need formatting
- ⚠️ Biobank evidence needs to be extracted from text

### Tile 4: DRUGGABILITY_DATA

**Available in Demo:**
- ✅ Druggability score ("HIGH")
- ✅ Target class ("Small GTPase")
- ✅ Localization ("Intracellular")
- ✅ Structural data (PDB structures: 6OIM, 6VJJ)
- ✅ Existing compounds (Lumakras, Krazati - approved)
- ✅ Modality recommendation ("Small Molecule - Covalent Inhibitor")
- ✅ Citations (PDB structures, publications)

**Extraction Plan:**
```typescript
export const KRAS_G12C_DRUGGABILITY_DATA = {
  druggabilityScore: 'High' as DruggabilityScore, // Extract
  targetClass: 'Small GTPase',
  localization: 'Intracellular (cytosol)',
  structuralData: {
    pdbCount: 2, // Extract (6OIM, 6VJJ)
    alphafoldConfidence: 95, // Estimate
    ligandBoundStructures: 2, // Extract
    bindingPockets: ['Switch II pocket (G12C-specific)'], // Extract
    uniprotId: 'P01116', // Extract
    proteinLength: 189, // Look up
    transmembraneDomains: 0, // Extract
  },
  existingCompounds: [
    {
      name: 'Sotorasib (Lumakras)',
      phase: 'Approved',
      mechanism: 'Covalent inhibitor (G12C-specific)',
      activity: 'ORR 37.1%, PFS 6.8mo in NSCLC',
      dar: undefined, // Not applicable
      linker: undefined, // Not applicable
    },
    {
      name: 'Adagrasib (Krazati)',
      phase: 'Approved',
      mechanism: 'Covalent inhibitor (G12C-specific)',
      activity: 'ORR 43.0%, PFS 6.5mo in NSCLC',
      dar: undefined,
      linker: undefined,
    },
    // ... add more if available
  ],
  tractabilityAssessment: "Highly tractable for covalent small molecules...", // Extract
  modalityRecommendations: [
    {
      modality: 'Small Molecule (Covalent)',
      feasibility: 'High',
      rationale: 'Proven with approved drugs, Switch II pocket accessible',
    },
    // ... add more
  ],
  selectivityConsiderations: "Mutant-specific targeting required (>1000-fold selectivity)...", // Extract
  historicalAttrition: "KRAS was considered 'undruggable' until covalent approach...", // Extract
};
```

**Gaps:**
- ⚠️ Need to look up protein length (UniProt)
- ⚠️ Need to estimate AlphaFold confidence
- ⚠️ Need to structure modality recommendations array

### Tile 5: MECHANISTIC_DATA

**Available in Demo:**
- ✅ Pathway context (MAPK, PI3K pathways)
- ✅ Mechanism summary (covalent inhibition)
- ✅ Key publications (5+ with PMID, DOI)
- ✅ Preclinical evidence (cell lines, PDX, mouse models)
- ✅ Key researchers (names mentioned)
- ✅ Evidence gaps (listed)
- ✅ Citations (20+ publications)

**Extraction Plan:**
```typescript
export const KRAS_G12C_MECHANISTIC_DATA = {
  pathwayContext: "KRAS is a proximal oncogenic driver in MAPK and PI3K pathways...", // Extract
  mechanismSummary: "Covalent inhibition of KRAS G12C traps protein in inactive GDP-bound state...", // Extract
  keyPublications: [
    {
      id: 1,
      title: 'K-Ras(G12C) inhibitors allosterically control GTP affinity',
      authors: 'Ostrem JM, et al.',
      journal: 'Nature',
      year: 2013,
      doi: '10.1038/nature12796',
      pmid: '24256730',
      keyFinding: 'Covalent binding to Cys12 enables mutant-specific targeting',
    },
    // ... extract 4+ more from demo
  ] as Citation[],
  preclinicalEvidence: "Xenograft studies show tumor regression...", // Extract
  keyResearchers: [
    'David M. Sabatini (Whitehead Institute)',
    'Kevan Shokat (UCSF)',
    // ... extract from demo
  ],
  evidenceGaps: [
    'Optimal combination strategies unclear',
    'Resistance mechanisms poorly characterized',
    // ... extract from demo
  ],
  publicationTrend: [
    { year: 2013, count: 5 }, // Extract/estimate
    { year: 2014, count: 12 },
    // ... 10 years of data
  ],
};
```

**Gaps:**
- ⚠️ Need to extract all publications into structured array
- ⚠️ Need to create publication trend data (yearly counts)
- ⚠️ Need to extract key researchers from citations

### Tile 6: CLINICAL_PRECEDENT_DATA

**Available in Demo:**
- ✅ Clinical activity score ("Validated")
- ✅ Approved drugs (Lumakras, Krazati)
- ✅ Clinical trials (NCT IDs, phases, results)
- ✅ Key findings (ORR, PFS, OS)
- ✅ Failed approaches (historical context)
- ✅ Citations (FDA approvals, ClinicalTrials.gov)

**Extraction Plan:**
```typescript
export const KRAS_G12C_CLINICAL_PRECEDENT_DATA = {
  clinicalActivityScore: 'Validated' as ClinicalActivity, // Extract
  programsSummary: { 
    total: 15, // Count from demo
    active: 8, // Count
    approved: 2, // Extract (Lumakras, Krazati)
    failed: 0, // Extract
    terminated: 5, // Count
  },
  clinicalTrials: [
    {
      nctId: 'NCT03600883',
      title: 'CodeBreak 100',
      phase: 'Phase 1/2',
      status: 'Completed' as const,
      sponsor: 'Amgen',
      indication: 'NSCLC KRAS G12C',
      startDate: '2018-08-01',
      expectedReadout: undefined,
      results: {
        orr: '37.1%',
        pfs: '6.8 mo',
        os: '12.5 mo',
        safetyNotes: 'Manageable toxicity, Grade 3+ AEs 20%',
      },
    },
    // ... extract more trials from demo
  ] as ClinicalTrial[],
  keyFindings: "Two FDA-approved drugs validate KRAS G12C targeting...", // Extract
  failedApproaches: [
    {
      approach: 'Non-covalent small molecules',
      reason: 'Insufficient affinity, KRAS considered undruggable',
    },
    // ... extract from demo
  ],
  translationalInsights: "Companion diagnostic (FoundationOne CDx) required...", // Extract
};
```

**Gaps:**
- ⚠️ Need to count programs (total, active, approved, failed)
- ⚠️ Need to structure clinical trials into array format
- ⚠️ Need to extract trial results into structured format

### Tile 7: SAFETY_DATA

**Available in Demo:**
- ✅ Safety score ("Manageable")
- ✅ Genetic constraint (pLI, LOEUF - essential gene)
- ✅ Expression concerns (ubiquitous expression)
- ✅ Mechanism-based risks (wild-type inhibition risk)
- ✅ Class safety history (Lumakras, Krazati safety profiles)
- ✅ Citations (FDA labels, publications)

**Extraction Plan:**
```typescript
export const KRAS_G12C_SAFETY_DATA = {
  safetyScore: 'Manageable' as SafetyScore, // Extract
  geneticSafetySignals: [
    {
      signal: 'KRAS is essential gene (pLI 1.00)',
      severity: 'High',
      implication: 'Wild-type KRAS inhibition would be toxic - mutant-specific targeting required',
    },
    // ... extract more
  ],
  expressionConcerns: [
    {
      organ: 'All tissues',
      expression: 'Ubiquitous',
      concern: 'Wild-type KRAS inhibition risk',
      severity: 'High (if non-selective)',
      clinicalManifestation: 'Mitigated by >1000-fold selectivity for G12C',
    },
    // ... extract more
  ],
  knockoutPhenotypes: {
    mouse: 'Lethal (embryonic)',
    human: 'No-Fonan syndrome (germline mutations cause developmental disorders)',
  },
  mechanismBasedRisks: [
    'Wild-type KRAS inhibition (if non-selective)',
    'GI toxicity (class effect)',
    'Hepatotoxicity (observed in trials)',
    // ... extract more
  ],
  classSafetyHistory: [
    {
      drug: 'Lumakras (sotorasib)',
      safetyProfile: 'Grade 3+ AEs 20%, diarrhea 31%, nausea 19%',
      mitigation: 'Dose modification, supportive care',
      mtf: '960 mg QD',
    },
    {
      drug: 'Krazati (adagrasib)',
      safetyProfile: 'Grade 3+ AEs 25%, diarrhea 33%, nausea 20%',
      mitigation: 'Dose modification, supportive care',
      mtf: '600 mg BID',
    },
  ],
  therapeuticIndex: {
    estimate: '>1000x',
    basis: 'Mutant-specific selectivity (>1000-fold for G12C vs wild-type)',
  },
  monitoringRequirements: [
    'NGS testing for G12C mutation (companion diagnostic)',
    'LFTs (hepatotoxicity monitoring)',
    'GI symptom monitoring',
    // ... extract more
  ],
};
```

**Gaps:**
- ⚠️ Need to extract safety profiles from FDA labels
- ⚠️ Need to structure monitoring requirements array

### Tile 8: KEY_EXPERIMENTS_DATA

**Available in Demo:**
- ✅ Evidence gaps (5 program-killing risks listed)
- ✅ Recommended experiments (implied from gaps)
- ✅ Go/no-go criteria (implied from risks)

**Extraction Plan:**
```typescript
export const KRAS_G12C_KEY_EXPERIMENTS_DATA = {
  evidenceGaps: [
    {
      gap: 'Resistance mechanism understanding',
      priority: 'High',
      type: 'Biology',
      description: 'Secondary KRAS mutations (G12D, G13D) emerge in 40-60% of patients',
    },
    // ... extract 4+ more from demo
  ],
  recommendedExperiments: [
    {
      experiment: 'Resistance mutation profiling',
      priority: 'High',
      timeline: '6 months',
      rationale: 'Characterize secondary mutations to inform next-gen inhibitors',
      resourceEstimate: '2 FTE, $200K',
      deliverables: ['Resistance mutation catalog', 'Prevalence estimates'],
    },
    // ... extract/derive more
  ],
  goNoGoCriteria: {
    advanceIf: [
      'Combination strategies show >50% ORR improvement',
      'Resistance mechanisms characterized',
      // ... extract from demo
    ],
    stopIf: [
      'Efficacy <30% ORR in combination trials',
      'Unexpected severe toxicity',
      // ... extract from demo
    ],
  },
  resourceEstimate: 'Total: 8 FTE-months, ~$500K',
  timelineToDecision: '6 months to go/no-go on combination strategies',
};
```

**Gaps:**
- ⚠️ Need to derive recommended experiments from evidence gaps
- ⚠️ Need to extract/derive go/no-go criteria

---

## 📐 Detailed Mapping: Scout/BD Tiles

### BD_EXECUTIVE_SUMMARY

**Available in Demo:**
- ✅ Opportunity rating (from Financial Analyst)
- ✅ Summary text (from Financial Analyst)
- ✅ Key value drivers (from Market Research)
- ✅ Key risks (from Financial Analyst)
- ✅ Valuation range (from Financial Analyst)

**Extraction Plan:**
```typescript
export const KRAS_G12C_BD_EXECUTIVE_SUMMARY = {
  opportunityRating: 'Moderate' as OpportunityRating, // Extract
  strategicFit: 'Strong Fit' as StrategicFit, // Estimate
  summaryText: "KRAS G12C inhibitors represent moderate commercial opportunity...", // Extract
  quickMetrics: {
    developmentStage: 'Approved',
    patentLife: '2038-2041',
    marketOpportunity: '$1.5-2.0B (2030 TAM)',
    competitivePosition: 'Two-player market',
    totalDealValue: '$500M-$2B estimated',
  },
  keyValueDrivers: [
    'Proven druggability with two approved drugs',
    'Significant unmet need in NSCLC and CRC',
    // ... extract more
  ],
  keyRisks: [
    'Modest single-agent efficacy limits adoption',
    'Resistance development in 40-60% of patients',
    // ... extract more
  ],
  recommendedAction: 'Consider partnership for combination development',
  valuationRange: '$500M-$2B total deal value',
};
```

### COMPETITIVE_LANDSCAPE_DATA

**Available in Demo:**
- ✅ Competitors (Lumakras, Krazati, next-gen programs)
- ✅ Differentiation analysis (from Market Research)
- ✅ Competitive risks (from Market Research)

**Extraction Plan:**
```typescript
export const KRAS_G12C_COMPETITIVE_LANDSCAPE_DATA = {
  competitiveIntensity: 'Moderate' as CompetitiveIntensity, // Extract
  competitors: [
    {
      company: 'Amgen',
      asset: 'Lumakras (sotorasib)',
      modality: 'Small Molecule (Covalent)',
      stage: 'Approved',
      indication: 'NSCLC KRAS G12C',
      differentiation: 'First-mover, broad label',
      expectedMilestone: 'CRC approval, combination data',
      milestoneDate: '2025-2026',
    },
    {
      company: 'Bristol Myers Squibb',
      asset: 'Krazati (adagrasib)',
      modality: 'Small Molecule (Covalent)',
      stage: 'Approved',
      indication: 'NSCLC KRAS G12C',
      differentiation: 'Slightly higher ORR, BID dosing',
      expectedMilestone: 'CRC approval, combination data',
      milestoneDate: '2025-2026',
    },
    // ... extract more
  ] as Competitor[],
  differentiationAnalysis: "Market is two-player with limited differentiation...", // Extract
  competitiveRisks: [
    'Next-gen pan-KRAS inhibitors may supersede G12C-specific drugs',
    // ... extract more
  ],
  whiteSpaceOpportunities: [
    {
      opportunity: 'Combination with PD-1 inhibitors',
      rationale: 'Synergy potential, Phase 3 trials ongoing',
    },
    // ... extract more
  ],
};
```

### IP_FTO_DATA, MARKET_OPPORTUNITY_DATA, DEAL_LANDSCAPE_DATA, STRATEGIC_RECOMMENDATION_DATA

**Similar extraction approach as above - map demo data to TROP2 structure.**

---

## 🔄 HER2 Mapping

**HER2 will follow the same structure as KRAS G12C, but with HER2-specific data:**

- Target biology: HER2 overexpression, amplification
- Clinical: Enhertu, Herceptin, Kadcyla
- Patents: HER2-targeting patents
- Financial: Enhertu sales ($3.5B+), market opportunity
- Regulatory: HER2 approvals, HER2-low expansion
- Market: HER2+ vs HER2-low, adoption patterns

**Same extraction methodology applies.**

---

## ⚠️ Key Challenges & Solutions

### Challenge 1: Expression Data for KRAS

**Problem:** KRAS is mutation-based, not expression-based. TROP2 tiles expect expression differentials.

**Solution:**
- Use mutation frequency instead of fold-change
- Focus on tissue expression for safety (ubiquitous = safety concern)
- Adapt ExpressionBiologyTile to show mutation frequency charts
- OR create KRAS-specific tile variant

### Challenge 2: Missing Quantitative Arrays

**Problem:** Demo data has text descriptions, not structured arrays.

**Solution:**
- Extract numbers from text
- Create arrays from lists in markdown
- Use GTEx/TCGA databases to fill gaps
- Make reasonable estimates based on TROP2 patterns

### Challenge 3: Citations Format

**Problem:** Citations in demo are embedded in text, not structured.

**Solution:**
- Extract PMID, DOI, authors from text
- Parse citation format
- Look up missing metadata (journal, year)
- Create structured Citation[] arrays

### Challenge 4: Chart Data

**Problem:** Tiles expect chart-ready arrays (tissues, tumors, trials).

**Solution:**
- Extract data from tables in markdown
- Expand lists to full arrays (15+ tissues, 10+ tumors)
- Use external databases (GTEx, TCGA) for completeness
- Create sample data that matches demo narrative

---

## 📅 Implementation Timeline (Planning Only)

### Week 1: Data Extraction
- Day 1-2: Read and catalog all demo scenario data
- Day 3-4: Extract KRAS G12C data into structured format
- Day 5: Extract HER2 data into structured format

### Week 2: Data Structuring
- Day 1-2: Create TypeScript interfaces
- Day 3-4: Populate KRAS G12C constants
- Day 5: Populate HER2 constants

### Week 3: Data Enrichment
- Day 1-2: Fill gaps with external data (GTEx, TCGA)
- Day 3: Validate data structure
- Day 4-5: Review and refine

### Week 4: Integration
- Day 1-2: Update dashboard components
- Day 3: Testing
- Day 4-5: Polish and documentation

---

## ✅ Success Criteria

1. **Data Completeness:**
   - All 14 constants populated for KRAS G12C
   - All 14 constants populated for HER2
   - Data richness matches TROP2 (15+ tissues, 10+ tumors, 5+ trials)

2. **Data Quality:**
   - All citations have PMID/DOI
   - All numbers are realistic
   - All arrays are properly structured
   - TypeScript types are correct

3. **Visual Compatibility:**
   - Tiles render correctly
   - Charts display properly
   - Filters work
   - Exports function

4. **Accuracy:**
   - Data matches demo scenario narrative
   - Citations are verifiable
   - Metrics are consistent

---

## 📝 Next Steps

1. **Review this planning document**
2. **Approve extraction approach**
3. **Assign data extraction tasks**
4. **Begin Phase 1: Data Inventory**
5. **Iterate on data structure as needed**

---

**End of Planning Document**

