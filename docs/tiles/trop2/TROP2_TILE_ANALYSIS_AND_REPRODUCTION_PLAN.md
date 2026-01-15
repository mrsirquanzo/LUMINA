# TROP2 Tile Generation Analysis & Reproduction Plan

**Date:** 2025-01-27  
**Purpose:** Understand TROP2 baseline tile generation and create systematic plan to reproduce for KRAS G12C and HER2

---

## 📊 Executive Summary

**TROP2 tiles are superior** because they use **pre-defined, comprehensive baseline data** stored in `src/constants/index.ts`, while KRAS G12C and HER2 rely on **dynamic agent-generated tiles** from demo scenarios in `src/lib/demoMultiAgentScenarios.ts`. The baseline tiles have richer, more structured data with better visualizations.

---

## 🔍 Current Architecture

### TROP2 Implementation (Baseline Tiles)

**Location:** `src/constants/index.ts`

**How it works:**
1. **Static data constants** are defined for TROP2 in `src/constants/index.ts`
2. **Dashboard components** (`ScientistDashboard.tsx` and `ScoutDashboard.tsx`) check if active workspace target is "TROP2"
3. If TROP2, they render **baseline tiles** using pre-defined data
4. Tiles are **always visible** when TROP2 workspace is active (not dependent on orchestration)

**Key Files:**
- `src/constants/index.ts` - Contains all TROP2 data constants
- `src/components/ScientistDashboard.tsx` - Renders Scientist baseline tiles
- `src/components/ScoutDashboard.tsx` - Renders Scout/BD baseline tiles

**Scientist Dashboard Tiles (7 tiles):**
1. `SCIENTIST_EXECUTIVE_SUMMARY` - Executive Summary (full-width)
2. `EXPRESSION_DATA` - Expression Biology (full-width)
3. `MECHANISTIC_DATA` - Mechanistic Rationale (half-width)
4. `CLINICAL_PRECEDENT_DATA` - Clinical Precedent (half-width)
5. `GENETIC_VALIDATION_DATA` - Genetic Validation (half-width)
6. `DRUGGABILITY_DATA` - Druggability (half-width)
7. `SAFETY_DATA` - Safety Assessment (half-width)
8. `KEY_EXPERIMENTS_DATA` - Key Experiments (half-width)

**Scout/BD Dashboard Tiles (7 tiles):**
1. `BD_EXECUTIVE_SUMMARY` - Executive Summary (full-width)
2. `CLINICAL_PRECEDENT_DATA` - Scientific Validation (half-width)
3. `COMPETITIVE_LANDSCAPE_DATA` - Competitive Landscape (half-width)
4. `CLINICAL_PRECEDENT_DATA` - Clinical Positioning (half-width)
5. `IP_FTO_DATA` - IP & FTO (half-width)
6. `MARKET_OPPORTUNITY_DATA` - Market Opportunity (half-width)
7. `DEAL_LANDSCAPE_DATA` - Deal Landscape (half-width)
8. `STRATEGIC_RECOMMENDATION_DATA` - Strategic Recommendation (full-width)

### KRAS G12C & HER2 Implementation (Dynamic Tiles)

**Location:** `src/lib/demoMultiAgentScenarios.ts`

**How it works:**
1. **Demo scenarios** contain agent responses as markdown strings
2. When user searches for "KRAS G12C" or "HER2", the orchestration engine matches to demo scenario
3. **Agent responses** are streamed via SSE and converted to tiles by `useOrchestrationTiles` hook
4. Tiles are created **dynamically** from agent markdown responses
5. Data quality depends on markdown formatting and agent response structure

**Key Files:**
- `src/lib/demoMultiAgentScenarios.ts` - Contains DEMO_KRAS_G12C and DEMO_HER2_ANALYSIS scenarios
- `src/hooks/useOrchestrationTiles.ts` - Converts agent responses to tiles
- `src/lib/tiles/templates/index.ts` - Tile templates that render markdown data

---

## 📈 Why TROP2 Tiles Are Better

### 1. **Data Structure & Richness**

**TROP2 (Baseline):**
- ✅ **Structured TypeScript objects** with typed interfaces
- ✅ **Rich nested data** (arrays, objects, metadata)
- ✅ **Quantitative metrics** (scores, percentages, fold-changes)
- ✅ **Tabular data** (clinical trials, patents, deals)
- ✅ **Chart-ready data** (expression arrays, fold-change data)
- ✅ **Citations with metadata** (PMID, DOI, authors, journals)

**KRAS/HER2 (Dynamic):**
- ⚠️ **Markdown strings** parsed on-the-fly
- ⚠️ **Limited structure** - mostly text with some lists
- ⚠️ **No quantitative arrays** for charts
- ⚠️ **Citations embedded in text** (harder to extract)
- ⚠️ **Inconsistent formatting** across agents

### 2. **Visual Components**

**TROP2:**
- ✅ **Specialized tile components** (`ExpressionBiologyTile`, `ClinicalPrecedentTile`, etc.)
- ✅ **Interactive charts** (Recharts integration)
- ✅ **Tabbed interfaces** (Summary, Normal, Tumor, Comparison, Genomic)
- ✅ **Filterable tables** (tissue search, category filters)
- ✅ **Export functionality** (CSV downloads)
- ✅ **Rich visualizations** (bar charts, scatter plots, heatmaps)

**KRAS/HER2:**
- ⚠️ **Generic markdown renderer** (`DynamicTile` with templates)
- ⚠️ **Limited interactivity** (mostly static markdown)
- ⚠️ **No specialized charts** (unless agent includes markdown tables)
- ⚠️ **No filtering/search** capabilities

### 3. **Data Completeness**

**TROP2 Example - Expression Biology:**
```typescript
export const EXPRESSION_DATA = {
  therapeuticWindowScore: 'Favorable',
  bestIndication: { name: 'Triple-Negative Breast Cancer', foldChange: 8.2, rank: 1 },
  adcSuitability: {
    score: 'High',
    antigenDensity: '150,000 copies/cell (median in TNBC)',
    internalizationRate: 't1/2 ~15 min (fast)',
    // ... more structured data
  },
  gtexNormalTissues: [
    { name: 'Skin', tpm: 245, isSafetyOrgan: true, category: 'skin' },
    { name: 'Esophagus Mucosa', tpm: 198, isSafetyOrgan: true, category: 'gi' },
    // ... 15+ tissues with structured data
  ],
  tcgaTumorExpression: [
    { tumorType: 'TNBC', tcgaCode: 'BRCA', medianTPM: 892, percentileRank: 95, sampleCount: 187 },
    // ... 10+ tumor types
  ],
  foldChangeData: [
    { indication: 'TNBC', tumorTPM: 892, normalTPM: 42, foldChange: 21.2 },
    // ... multiple indications
  ],
  genomicAlterations: {
    amplificationFrequency: { BRCA: 8, LUAD: 5, BLCA: 12 },
    // ... structured genomic data
  },
};
```

**KRAS/HER2 Example - Agent Response:**
```markdown
## Expression Analysis

TROP2 shows high expression in:
- TNBC: 8.2x fold-change
- NSCLC: 12.9x fold-change

Safety concerns:
- Skin: High expression (245 TPM)
- GI mucosa: High expression (198 TPM)
```

**Difference:** TROP2 has **structured arrays** ready for charts, while KRAS/HER2 has **unstructured text** that requires parsing.

### 4. **Consistency & Maintainability**

**TROP2:**
- ✅ **Single source of truth** (`constants/index.ts`)
- ✅ **Type-safe** (TypeScript interfaces)
- ✅ **Easy to update** (edit constants file)
- ✅ **Version controlled** (Git tracks changes)
- ✅ **Reusable** (same data for Scientist and Scout views)

**KRAS/HER2:**
- ⚠️ **Scattered in demo scenarios** (hard to find)
- ⚠️ **String-based** (no type safety)
- ⚠️ **Inconsistent formatting** (depends on agent)
- ⚠️ **Hard to maintain** (markdown strings in large file)

---

## 📁 File Structure Analysis

### TROP2 Baseline Tiles

```
src/
├── constants/
│   └── index.ts                    # ALL TROP2 DATA (1,210 lines)
│       ├── SCIENTIST_EXECUTIVE_SUMMARY
│       ├── GENETIC_VALIDATION_DATA
│       ├── DRUGGABILITY_DATA
│       ├── EXPRESSION_DATA          # Rich structured data
│       ├── MECHANISTIC_DATA
│       ├── CLINICAL_PRECEDENT_DATA
│       ├── SAFETY_DATA
│       ├── KEY_EXPERIMENTS_DATA
│       ├── BD_EXECUTIVE_SUMMARY
│       ├── COMPETITIVE_LANDSCAPE_DATA
│       ├── IP_FTO_DATA
│       ├── MARKET_OPPORTUNITY_DATA
│       ├── DEAL_LANDSCAPE_DATA
│       └── STRATEGIC_RECOMMENDATION_DATA
│
├── components/
│   ├── ScientistDashboard.tsx      # Renders baseline tiles for TROP2
│   ├── ScoutDashboard.tsx          # Renders baseline tiles for TROP2
│   └── tiles/
│       ├── ExecutiveSummaryTile.tsx
│       ├── ExpressionBiologyTile.tsx    # Specialized component with charts
│       ├── GeneticValidationTile.tsx
│       ├── DruggabilityTile.tsx
│       ├── MechanisticTile.tsx
│       ├── ClinicalPrecedentTile.tsx
│       ├── SafetyAssessmentTile.tsx
│       ├── KeyExperimentsTile.tsx
│       ├── BDExecutiveSummaryTile.tsx
│       ├── ScientificValidationTile.tsx
│       ├── CompetitiveLandscapeTile.tsx
│       ├── ClinicalPositioningTile.tsx
│       ├── IPFreedomToOperateTile.tsx
│       ├── MarketOpportunityTile.tsx
│       ├── DealLandscapeTile.tsx
│       └── StrategicRecommendationTile.tsx
```

### KRAS/HER2 Dynamic Tiles

```
src/
├── lib/
│   ├── demoMultiAgentScenarios.ts  # Demo scenarios (9,621 lines)
│   │   ├── DEMO_KRAS_G12C          # Agent responses as markdown
│   │   └── DEMO_HER2_ANALYSIS      # Agent responses as markdown
│   │
│   └── tiles/
│       ├── templates/
│       │   └── index.ts            # Generic markdown renderers
│       └── types.ts
│
├── hooks/
│   └── useOrchestrationTiles.ts    # Converts agent responses → tiles
│
└── components/
    └── DynamicTile.tsx              # Generic tile renderer
```

---

## 🎯 Systematic Reproduction Plan

### Phase 1: Data Collection & Structure Design

**Goal:** Create structured data constants for KRAS G12C and HER2 matching TROP2 quality

**Steps:**

1. **Extract existing data from demo scenarios**
   - Review `DEMO_KRAS_G12C` and `DEMO_HER2_ANALYSIS` in `demoMultiAgentScenarios.ts`
   - Extract key metrics, citations, clinical data
   - Identify gaps vs TROP2 data structure

2. **Design data structures**
   - Create TypeScript interfaces matching TROP2 patterns
   - Define constants for:
     - `KRAS_G12C_SCIENTIST_EXECUTIVE_SUMMARY`
     - `KRAS_G12C_EXPRESSION_DATA`
     - `KRAS_G12C_CLINICAL_PRECEDENT_DATA`
     - `KRAS_G12C_GENETIC_VALIDATION_DATA`
     - `KRAS_G12C_DRUGGABILITY_DATA`
     - `KRAS_G12C_SAFETY_DATA`
     - `KRAS_G12C_KEY_EXPERIMENTS_DATA`
     - `KRAS_G12C_BD_EXECUTIVE_SUMMARY`
     - `KRAS_G12C_COMPETITIVE_LANDSCAPE_DATA`
     - `KRAS_G12C_IP_FTO_DATA`
     - `KRAS_G12C_MARKET_OPPORTUNITY_DATA`
     - `KRAS_G12C_DEAL_LANDSCAPE_DATA`
     - `KRAS_G12C_STRATEGIC_RECOMMENDATION_DATA`
   - Repeat for HER2

3. **Research & data enrichment**
   - Fill in quantitative metrics (expression data, fold-changes)
   - Add structured clinical trial data (NCT IDs, phases, results)
   - Include patent data (patent numbers, owners, expiry dates)
   - Add deal landscape (comparable transactions)
   - Source citations (PMID, DOI, authors)

### Phase 2: Data Population

**Goal:** Populate constants with rich, structured data

**Approach:**

1. **Use TROP2 as template**
   - Copy TROP2 data structure
   - Replace TROP2-specific values with KRAS/HER2 data
   - Maintain same depth and richness

2. **Data sources:**
   - **Clinical:** ClinicalTrials.gov, published papers
   - **Expression:** GTEx, TCGA databases
   - **Patents:** USPTO, Google Patents
   - **Deals:** Public M&A/partnership announcements
   - **Market:** Analyst reports, market research

3. **Quality standards:**
   - Match TROP2 data richness (15+ tissues, 10+ tumor types)
   - Include quantitative metrics (scores, percentages)
   - Structured arrays for charts
   - Complete citations with metadata

### Phase 3: Dashboard Integration

**Goal:** Update dashboards to show baseline tiles for KRAS G12C and HER2

**Steps:**

1. **Update `ScientistDashboard.tsx`**
   ```typescript
   const showBaselineTiles = useMemo(() => {
     if (!activeWorkspace) return false;
     const activeWorkspaceData = allWorkspaces.find((ws) => String(ws.id) === String(activeWorkspace));
     const target = activeWorkspaceData?.target?.toUpperCase();
     return target === 'TROP2' || target === 'KRAS G12C' || target === 'HER2';
   }, [activeWorkspace, allWorkspaces]);
   ```

2. **Add conditional data selection**
   ```typescript
   const getBaselineData = () => {
     const target = activeWorkspaceData?.target?.toUpperCase();
     if (target === 'TROP2') {
       return {
         executiveSummary: SCIENTIST_EXECUTIVE_SUMMARY,
         expression: EXPRESSION_DATA,
         // ... TROP2 data
       };
     } else if (target === 'KRAS G12C') {
       return {
         executiveSummary: KRAS_G12C_SCIENTIST_EXECUTIVE_SUMMARY,
         expression: KRAS_G12C_EXPRESSION_DATA,
         // ... KRAS data
       };
     } else if (target === 'HER2') {
       return {
         executiveSummary: HER2_SCIENTIST_EXECUTIVE_SUMMARY,
         expression: HER2_EXPRESSION_DATA,
         // ... HER2 data
       };
     }
   };
   ```

3. **Update `ScoutDashboard.tsx`** similarly

4. **Reuse existing tile components**
   - All tile components are **target-agnostic**
   - They accept data props and render accordingly
   - No new components needed!

### Phase 4: Testing & Validation

**Goal:** Ensure tiles render correctly and data is accurate

**Steps:**

1. **Visual testing**
   - Verify all tiles render for KRAS G12C
   - Verify all tiles render for HER2
   - Check charts display correctly
   - Verify responsive layout

2. **Data validation**
   - Cross-reference with demo scenario data
   - Verify citations are accurate
   - Check quantitative metrics are reasonable
   - Ensure consistency across tiles

3. **Edge cases**
   - Test with no active workspace (should show empty state)
   - Test switching between targets
   - Test with dynamic tiles + baseline tiles

---

## 📋 Detailed Implementation Checklist

### For Each Target (KRAS G12C, HER2):

#### Scientist Dashboard Tiles

- [ ] `SCIENTIST_EXECUTIVE_SUMMARY`
  - [ ] Overall score (0-100)
  - [ ] Recommendation (Advance/Pass/Consider)
  - [ ] Confidence level (0-1)
  - [ ] Summary text (2-3 sentences)
  - [ ] Quick metrics (4 metrics)
  - [ ] Key strengths (5+ items)
  - [ ] Key risks (5+ items)
  - [ ] Weighted scoring (5 categories)

- [ ] `EXPRESSION_DATA`
  - [ ] Therapeutic window score
  - [ ] Best indication (name, fold-change, rank)
  - [ ] ADC suitability (score, antigen density, internalization rate)
  - [ ] GTEx normal tissues (15+ tissues with TPM, safety flags)
  - [ ] TCGA tumor expression (10+ tumor types with TPM, percentile)
  - [ ] Fold-change data (6+ indications)
  - [ ] Genomic alterations (amplification, mutation, copy number)

- [ ] `GENETIC_VALIDATION_DATA`
  - [ ] Validation score
  - [ ] Validation summary (paragraph)
  - [ ] GWAS associations (3+ with scores, p-values)
  - [ ] Constraint metrics (pLI, LOEUF, observed/expected)
  - [ ] Mendelian diseases
  - [ ] Direction of effect
  - [ ] Biobank evidence (3+ sources)
  - [ ] LoF carrier phenotypes

- [ ] `DRUGGABILITY_DATA`
  - [ ] Druggability score
  - [ ] Target class
  - [ ] Localization
  - [ ] Structural data (PDB count, AlphaFold confidence, binding pockets)
  - [ ] Existing compounds (4+ with phase, mechanism, activity)
  - [ ] Tractability assessment
  - [ ] Modality recommendations (5+ modalities)
  - [ ] Selectivity considerations
  - [ ] Historical attrition

- [ ] `MECHANISTIC_DATA`
  - [ ] Pathway context (paragraph)
  - [ ] Mechanism summary (paragraph)
  - [ ] Key publications (5+ with PMID, DOI, key findings)
  - [ ] Preclinical evidence
  - [ ] Key researchers (5+ names)
  - [ ] Evidence gaps (5+ items)
  - [ ] Publication trend (10 years of data)

- [ ] `CLINICAL_PRECEDENT_DATA`
  - [ ] Clinical activity score
  - [ ] Programs summary (total, active, approved, failed)
  - [ ] Clinical trials (5+ with NCT ID, phase, results)
  - [ ] Key findings (paragraph)
  - [ ] Failed approaches (3+ with reasons)
  - [ ] Translational insights

- [ ] `SAFETY_DATA`
  - [ ] Safety score
  - [ ] Genetic safety signals (3+ with severity, implications)
  - [ ] Expression concerns (4+ organs with expression, concerns, severity)
  - [ ] Knockout phenotypes (mouse, human)
  - [ ] Mechanism-based risks (4+ items)
  - [ ] Class safety history (3+ drugs with profiles, mitigation)
  - [ ] Therapeutic index (estimate, basis)
  - [ ] Monitoring requirements (5+ items)

- [ ] `KEY_EXPERIMENTS_DATA`
  - [ ] Evidence gaps (5+ with priority, type, description)
  - [ ] Recommended experiments (4+ with priority, timeline, rationale, resources)
  - [ ] Go/no-go criteria (advance if, stop if)
  - [ ] Resource estimate
  - [ ] Timeline to decision

#### Scout/BD Dashboard Tiles

- [ ] `BD_EXECUTIVE_SUMMARY`
  - [ ] Opportunity rating
  - [ ] Strategic fit
  - [ ] Summary text
  - [ ] Quick metrics (5 metrics)
  - [ ] Key value drivers (5+ items)
  - [ ] Key risks (5+ items)
  - [ ] Recommended action
  - [ ] Valuation range

- [ ] `COMPETITIVE_LANDSCAPE_DATA`
  - [ ] Competitive intensity
  - [ ] Competitors (4+ with company, asset, stage, differentiation)
  - [ ] Differentiation analysis
  - [ ] Competitive risks (5+ items)
  - [ ] White space opportunities (4+ with rationale)

- [ ] `IP_FTO_DATA`
  - [ ] IP position
  - [ ] Patent summary
  - [ ] Key patents (4+ with numbers, owners, expiry, claims)
  - [ ] FTO assessment
  - [ ] IP risks (5+ items)
  - [ ] IP opportunities (5+ items)
  - [ ] Litigation history
  - [ ] FTO opinion status

- [ ] `MARKET_OPPORTUNITY_DATA`
  - [ ] TAM (value, unit, year, CAGR)
  - [ ] Segments (4+ with size, share, patients)
  - [ ] Competitive dynamics
  - [ ] Pricing considerations
  - [ ] Market risks (5+ items)
  - [ ] Upside scenarios (5+ items)
  - [ ] Penetration assumptions (conservative, base, optimistic)

- [ ] `DEAL_LANDSCAPE_DATA`
  - [ ] Deal activity
  - [ ] Comparable deals (4+ with asset, acquirer, seller, value, notes)
  - [ ] Valuation context
  - [ ] Potential partners (4+ types)
  - [ ] Deal structure considerations (6+ items)
  - [ ] Recent trends (5+ items)

- [ ] `STRATEGIC_RECOMMENDATION_DATA`
  - [ ] Recommendation
  - [ ] Strategic rationale
  - [ ] Key diligence questions (8+ questions)
  - [ ] Proposed next steps (6+ with action, owner, timeline, priority)
  - [ ] Deal considerations (6+ items)
  - [ ] Risk mitigation (6+ items)
  - [ ] Walk-away criteria (6+ items)
  - [ ] Internal alignment (5+ departments)

---

## 🔄 Migration Strategy

### Option 1: Parallel Implementation (Recommended)

**Approach:** Keep demo scenarios for orchestration, add baseline tiles for display

**Pros:**
- ✅ No breaking changes
- ✅ Can test incrementally
- ✅ Users can still trigger orchestration
- ✅ Baseline tiles show immediately (better UX)

**Implementation:**
1. Add baseline data constants to `constants/index.ts`
2. Update dashboards to show baseline tiles when target matches
3. Keep demo scenarios for orchestration flow
4. Baseline tiles take precedence (show immediately)

### Option 2: Replace Demo Scenarios

**Approach:** Remove demo scenarios, use only baseline tiles

**Pros:**
- ✅ Single source of truth
- ✅ Cleaner codebase
- ✅ No duplicate data

**Cons:**
- ❌ Loses orchestration demo flow
- ❌ Breaking change for existing users
- ❌ Less interactive

**Recommendation:** Use Option 1 (parallel) to maintain orchestration demo while providing better baseline tiles.

---

## 📊 Data Quality Comparison

### TROP2 (Current - Baseline)

| Metric | Quality | Notes |
|--------|---------|-------|
| **Data Structure** | ⭐⭐⭐⭐⭐ | Structured TypeScript objects |
| **Quantitative Metrics** | ⭐⭐⭐⭐⭐ | Scores, percentages, fold-changes |
| **Chart-Ready Data** | ⭐⭐⭐⭐⭐ | Arrays for Recharts |
| **Citations** | ⭐⭐⭐⭐⭐ | Complete metadata (PMID, DOI) |
| **Visual Components** | ⭐⭐⭐⭐⭐ | Specialized tiles with charts |
| **Interactivity** | ⭐⭐⭐⭐⭐ | Filters, tabs, exports |
| **Completeness** | ⭐⭐⭐⭐⭐ | 7 Scientist + 7 Scout tiles |

### KRAS/HER2 (Current - Dynamic)

| Metric | Quality | Notes |
|--------|---------|-------|
| **Data Structure** | ⭐⭐ | Markdown strings |
| **Quantitative Metrics** | ⭐⭐⭐ | Embedded in text |
| **Chart-Ready Data** | ⭐ | Limited, requires parsing |
| **Citations** | ⭐⭐⭐ | Embedded in text |
| **Visual Components** | ⭐⭐⭐ | Generic markdown renderer |
| **Interactivity** | ⭐⭐ | Limited |
| **Completeness** | ⭐⭐⭐ | Varies by agent response |

### KRAS/HER2 (Target - Baseline)

| Metric | Quality | Notes |
|--------|---------|-------|
| **Data Structure** | ⭐⭐⭐⭐⭐ | Match TROP2 structure |
| **Quantitative Metrics** | ⭐⭐⭐⭐⭐ | Match TROP2 depth |
| **Chart-Ready Data** | ⭐⭐⭐⭐⭐ | Arrays for Recharts |
| **Citations** | ⭐⭐⭐⭐⭐ | Complete metadata |
| **Visual Components** | ⭐⭐⭐⭐⭐ | Reuse TROP2 components |
| **Interactivity** | ⭐⭐⭐⭐⭐ | Full feature parity |
| **Completeness** | ⭐⭐⭐⭐⭐ | 7 Scientist + 7 Scout tiles |

---

## 🎯 Success Criteria

### Phase 1: Data Collection ✅
- [ ] All data structures defined
- [ ] TypeScript interfaces created
- [ ] Data sources identified

### Phase 2: Data Population ✅
- [ ] KRAS G12C constants populated
- [ ] HER2 constants populated
- [ ] Data quality matches TROP2
- [ ] Citations verified

### Phase 3: Dashboard Integration ✅
- [ ] Scientist dashboard shows KRAS tiles
- [ ] Scientist dashboard shows HER2 tiles
- [ ] Scout dashboard shows KRAS tiles
- [ ] Scout dashboard shows HER2 tiles
- [ ] Tiles render correctly
- [ ] Charts display properly

### Phase 4: Testing ✅
- [ ] Visual testing complete
- [ ] Data validation complete
- [ ] Edge cases handled
- [ ] No regressions

---

## 📝 Next Steps

1. **Review this document** with team
2. **Prioritize targets** (KRAS G12C first? HER2 first? Both?)
3. **Assign data collection** (who will research and populate?)
4. **Set timeline** (how long for each phase?)
5. **Begin Phase 1** (data structure design)

---

## 🔗 Key Files Reference

### TROP2 Baseline Tiles
- **Data:** `src/constants/index.ts` (lines 29-1061)
- **Scientist Dashboard:** `src/components/ScientistDashboard.tsx` (lines 177-213)
- **Scout Dashboard:** `src/components/ScoutDashboard.tsx` (lines 151-189)
- **Tile Components:** `src/components/tiles/*.tsx`

### KRAS/HER2 Dynamic Tiles
- **Demo Scenarios:** `src/lib/demoMultiAgentScenarios.ts`
  - KRAS: Line 3550+
  - HER2: Line 5000+ (approximate)
- **Tile Generation:** `src/hooks/useOrchestrationTiles.ts`
- **Tile Rendering:** `src/components/DynamicTile.tsx`

---

**End of Analysis Document**

