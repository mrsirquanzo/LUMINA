import { DemoScenario } from './multiAgentTypes';

/**
 * Demo Scenario 1: M&A Due Diligence
 */
export const DEMO_MA_DUE_DILIGENCE: DemoScenario = {
  id: 'ma-due-diligence',
  title: 'Biotech M&A Due Diligence',
  description: 'Comprehensive analysis of a bispecific antibody acquisition across all 5 dimensions: clinical, patent, financial, regulatory, and market',
  query: 'Should we acquire BioSpectra for $2.2B? Analyze their Phase 2 bispecific T-cell engager data, patent portfolio, and financials.',
  documents: [
    'BioSpectra_Phase2_Results.pdf (2.8 MB)',
    'BioSpectra_Patent_Portfolio.pdf (2.1 MB)',
    'BioSpectra_10K_2024.pdf (4.3 MB)',
  ],
  estimatedDuration: 24000, // 24 seconds - all 5 agents
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Sequential analysis: Clinical Data → Patent IP → Financials → Cross-reference → Synthesis',
        mode: 'thorough',
        estimatedCost: '$0.45',
      },
    },
    {
      type: 'agent_start',
      timestamp: 800,
      data: {
        agent: 'Clinical Analyst',
        task: 'Analyzing Phase 2 bispecific T-cell engager trial results and safety data',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1500,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Extracting efficacy endpoints from trial data...',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 2200,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Analyzing safety profile and adverse events...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 3500,
      data: {
        agent: 'Clinical Analyst',
        response: `## Phase 2 Bispecific T-Cell Engager Trial Analysis

**Efficacy Results:**
- Primary endpoint (ORR): 63% (95% CI: 54-71%) vs 28% standard of care
- Complete response: 42% (unprecedented for relapsed/refractory)
- Median PFS: 12.4 months vs 5.1 months SoC (HR=0.48, p<0.001)
- Duration of response: 18.2 months (highly durable)

**Safety Profile:**
- Grade 3+ adverse events: 48% (in line with class)
- CRS (Cytokine Release Syndrome): Grade 1-2 in 52%, Grade 3 in 8%
- No Grade 4-5 CRS - improved vs earlier TCEs
- Neurotoxicity: 12% (all Grade 1-2, minimal CNS involvement)
- ICANS (Immune Cell-Associated Neurotoxicity): 3% (best in class)

**Competitive Context (2024-2025):**
- Tecvayli (J&J): 63% ORR but higher neurotoxicity (15%)
- Talvey (Pfizer/J&J): 73% ORR but complex dosing
- BioSpectra shows best safety/efficacy balance
- Off-the-shelf advantage vs CAR-T (no manufacturing delay)

**Assessment:**
✓ Superior efficacy - 63% ORR competitive with leading TCEs
✓ Best-in-class safety profile for CRS and neurotoxicity
✓ Novel epitope targeting reduces target escape risk
⚠ Need to verify IP protection for proprietary linker technology

**Question for Patent Expert:** Are there blocking patents for the proprietary Fc-silenced linker technology? What's the FTO status for this novel epitope?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 4000,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'Are there blocking patents for the proprietary Fc-silenced linker technology? What\'s the FTO status for this novel epitope?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 4500,
      data: {
        agent: 'Patent Expert',
        task: 'Analyzing patent portfolio and freedom-to-operate',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 5200,
      data: {
        agent: 'Patent Expert',
        progress: 'Reviewing patent claims and prosecution history...',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 6000,
      data: {
        agent: 'Patent Expert',
        progress: 'Conducting competitive patent landscape search...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 7800,
      data: {
        agent: 'Patent Expert',
        response: `## Patent Portfolio & IP Analysis

**BioSpectra Patent Portfolio:**
- **US11,234,567**: "Bispecific T-Cell Engager with Fc-Silenced Linker"
  - Granted: August 2023
  - Claim 1: Broad coverage of Fc-silenced bispecific antibodies targeting novel epitope
  - Expires: 2043 (20 years from filing)
- **US11,456,789**: "Methods for Reducing Cytokine Release Syndrome in Bispecific Therapies"
  - Granted: January 2024
  - Method claims for dosing regimens and CRS management
  - Expires: 2044
- **EP3,789,123**: European counterpart (granted 2024)
- **CN109,876,543**: Chinese patent (granted 2024)
- 12 continuation applications filed (2023-2024) covering linker variants and combination therapies

**Patent Strength Assessment:**
✓ Strong novelty vs prior art (novel epitope not disclosed in prior TCEs)
✓ Fc-silenced linker technology proprietary (composition of matter protection)
✓ No patent oppositions filed
✓ Clean prosecution history with minimal amendments

**Competitive Landscape:**
- **Tecvayli (J&J):** Different epitope targeting, earlier expiry (2038)
- **Talvey (Pfizer/J&J):** Complex dosing patent but overlapping bispecific claims
- **Amgen TCEs:** Broad bispecific platform patents but FTO clear for our novel epitope
- **Regeneron:** Half-life extension patents (orthogonal to our technology)

**Freedom-to-Operate:**
✓ **FTO STATUS: CLEAR** - No blocking patents identified for novel epitope
✓ Can commercialize without licensing
✓ Proprietary Fc-silenced linker provides differentiated IP position
✓ Strong defensive position vs next-gen TCE developers

**Patent Portfolio Valuation:**
- Estimated standalone value: $350-450M
- 18-20 years remaining exclusivity
- Covers key markets (US, EU5, China, Japan = 90% global market)
- Platform applicability to multiple solid tumor indications

**Question for Financial Analyst:** Given strong IP position with clear FTO, 18-year exclusivity, and platform potential, is the $2.2B valuation justified based on their financial position and runway?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 8300,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given strong IP position with clear FTO, 18-year exclusivity, and platform potential, is the $2.2B valuation justified?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 8800,
      data: {
        agent: 'Financial Analyst',
        task: 'Analyzing 10-K financials and performing valuation',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 9500,
      data: {
        agent: 'Financial Analyst',
        progress: 'Extracting key financial metrics from 10-K...',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 10500,
      data: {
        agent: 'Financial Analyst',
        progress: 'Building DCF valuation model...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 12500,
      data: {
        agent: 'Financial Analyst',
        response: `## Financial Analysis & Valuation

**Current Financial Position (FY2024 10-K):**
- Cash & equivalents: $185M
- Quarterly cash burn: $28M
- **Estimated runway: 6.6 quarters (~18 months)**
- Revenue: $0 (pre-commercial)
- Total assets: $215M
- Long-term debt: $0

**Burn Rate Analysis:**
- Q1 2024: $22M
- Q2 2024: $25M
- Q3 2024: $28M
- Q4 2024: $32M (Phase 3 startup costs + manufacturing)
- **Trend:** Accelerating as Phase 3 and CMC scale-up

**Capital Requirements:**
- Phase 3 trial cost estimate: $150-180M (global, 400+ patients)
- Manufacturing scale-up: $60-80M (needed for commercial launch)
- Regulatory/commercial prep: $40-50M
- **Total capital needed before approval: $250-310M**
- ⚠ Will need $150M+ financing by Q3 2025

**Valuation Analysis:**

*DCF Model (12% discount rate):*
- Approval scenario (2028): 70% probability
- Peak sales estimate: $2.8B (2033) - larger TAM for bispecifics
- Operating margin: 78% (off-the-shelf, no CAR-T manufacturing)
- **DCF Value: $1.95B**

*Comparable Company Analysis:*
- Similar Phase 2 bispecific/TCE companies: $1.8-2.6B range
- Sanofi/Inhibrx (2024): $2.2B for Phase 2 bispecific
- J&J/Ambrx (2024): $2.0B for ADC platform
- BioSpectra at 0.78x peak sales → **Comp Value: $2.18B**

*Precedent Transactions:*
- Recent TCE/bispecific acquisitions (Phase 2): $1.6B-$2.6B
- Sanofi/Inhibrx: $2.2B (May 2024)
- Average: $2.13B
- Median: $2.1B

**Valuation Conclusion:**
- DCF: $1.95B
- Comps: $2.18B
- Precedent: $2.1B
- **Fair Value Range: $1.95-2.18B**

**Assessment of $2.2B Ask:**
✓ **FAIRLY VALUED** given:
- At median of recent transactions
- Strong Phase 2 data de-risks Phase 3
- $150M+ financing need offset by milestone structure
- TCE market growing 45% annually (2024-2030)

**Recommended Deal Structure:**
See synthesis for recommended approach.

**Question for Regulatory Expert:** What regulatory pathway and timeline should we expect for Phase 3 and approval?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 13000,
      data: {
        from: 'Financial Analyst',
        to: 'Regulatory Expert',
        question: 'What regulatory pathway and timeline should we expect for Phase 3 and approval?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 13500,
      data: {
        agent: 'Regulatory Expert',
        task: 'Assessing regulatory pathway and approval timeline',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 14200,
      data: {
        agent: 'Regulatory Expert',
        progress: 'Reviewing FDA guidance for bispecific antibodies...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 15800,
      data: {
        agent: 'Regulatory Expert',
        response: `## Regulatory Pathway & Approval Strategy

**Recommended Regulatory Strategy:**

**FDA Breakthrough Therapy Designation (BTD):**
✓ **Eligible** - Substantial improvement over Tecvayli (3% vs 15% ICANS)
✓ Apply at end of Phase 2 (should receive within 60 days)
✓ **Benefits:** Rolling review, more frequent FDA meetings, priority review

**Phase 3 Trial Design (2025-2027):**
- **Design:** Randomized, controlled, open-label
- **Comparator:** Tecvayli (current SOC for relapsed/refractory MM)
- **Primary endpoint:** Progression-free survival (PFS)
- **Secondary endpoints:** Overall survival (OS), ORR, safety (ICANS/CRS rates)
- **Sample size:** ~450 patients (adequately powered for PFS superiority)
- **Duration:** 18-24 months to primary endpoint
- **Enrollment:** 12-15 months (competitive R/R multiple myeloma space)

**FDA Filing Strategy:**
✓ **BLA submission:** Q3 2027 (assuming positive Phase 3 data)
✓ **Priority Review:** 6-month review (vs standard 10 months)
✓ **Accelerated Approval path NOT recommended** - Phase 2 data strong but not curative

**Approval Timeline:**
- Phase 3 initiation: Q1 2025
- Primary data readout: Q3 2026 (18 months)
- BLA submission: Q3 2027
- **FDA approval: Q1 2028** (priority review, 6 months)

**EMA Parallel Filing:**
✓ Conditional approval possible based on same Phase 3 data
✓ EMA approval: Q2 2028 (2-3 months after FDA)

**Manufacturing & CMC:**
✓ **No novel manufacturing concerns** - bispecific TCE platform established
✓ Process validation required for commercial scale (already underway)
✓ Post-approval commitments: Pediatric study (deferred to 2030)

**Risk Mitigation Strategy (REMS):**
✓ **REMS likely required** for CRS/ICANS management
✓ Similar to Tecvayli/Talvey REMS programs
✓ Requirements: Certified treatment centers, mandatory training, patient monitoring

**Regulatory Risk Assessment:**
- **Approvability:** 75% probability (strong Phase 2 + head-to-head superiority expected)
- **Timeline risk:** Low (~10% chance of delay beyond Q1 2028)
- **Key risk factors:**
  - Manufacturing inspection delays (FDA capacity constraints 2026-2027)
  - OS data maturity requirements (may need 24-month follow-up)

**Question for Market Research:** Given Q1 2028 FDA approval target, what is the market landscape and peak sales potential?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 16200,
      data: {
        from: 'Regulatory Expert',
        to: 'Market Research Analyst',
        question: 'Given Q1 2028 FDA approval target, what is the market landscape and peak sales potential?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 16700,
      data: {
        agent: 'Market Research Analyst',
        task: 'Analyzing market size, competitive landscape, and peak sales forecast',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 17400,
      data: {
        agent: 'Market Research Analyst',
        progress: 'Sizing addressable patient population and pricing dynamics...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 19200,
      data: {
        agent: 'Market Research Analyst',
        response: `## Market Opportunity & Commercial Forecast (2028-2035)

**Addressable Market (Multiple Myeloma Bispecific TCE):**

**Total Market Size (2028):**
- R/R multiple myeloma patients (3L+): ~35,000 (US) + ~28,000 (EU5)
- Bispecific TCE-eligible: ~22,000 patients/year (US+EU5)
- **Total addressable market: $8.2B by 2030** (growing 18% CAGR)

**Competitive Landscape (2028 launch scenario):**

**Market Leaders:**
1. **Tecvayli (J&J)** - $2.8B (2027), market leader but safety concerns
2. **Talvey (Pfizer)** - $1.6B (2027), strong efficacy but complex dosing
3. **Elrexfio (Pfizer)** - $980M (2027), BCMA-targeting (different MOA)

**BioSpectra Competitive Position:**
✓ **Best-in-class safety profile** (3% ICANS vs 12-15% competition)
✓ **Efficacy non-inferior to superior** (63% ORR competitive)
✓ **Late-to-market headwind** (Tecvayli launched 2022, 6-year head start)
✓ **Differentiation:** Safety enables outpatient treatment expansion

**Pricing Strategy:**
- **WAC:** $285,000 per treatment course (competitive with Tecvayli $295K)
- **Net price:** $228,000 (20% discount for payer access)
- **Justification:** Safety profile = fewer hospitalizations = lower total cost of care

**Market Share Projections:**

**Year 1 (2028):**
- Penetration: 8% of eligible patients (~1,760 patients)
- Revenue: **$400M**
- Rationale: Safety messaging drives early adopter physicians

**Year 3 (2030):**
- Penetration: 22% of eligible patients (~4,840 patients)
- Revenue: **$1.1B**
- Rationale: Real-world safety data + KOL advocacy

**Peak Sales (2033-2035):**
- Penetration: 35-38% of eligible patients (~8,400 patients)
- **Peak revenue: $1.9-2.1B**
- Rationale: Steady-state share based on safety differentiation

**Market Share Allocation (2033 peak):**
| Product | Market Share | Peak Sales |
|---------|--------------|------------|
| Tecvayli | 32% | $2.6B |
| BioSpectra | 35% | **$2.1B** |
| Talvey | 18% | $1.5B |
| Elrexfio | 15% | $1.2B |

**Key Value Drivers:**
1. **Safety differentiation** → Enables outpatient administration → 40% cost savings vs inpatient
2. **Medicare/payer preference** → Safety profile reduces hospitalization risk
3. **Community oncology adoption** → Simpler REMS compliance vs Tecvayli

**Commercial Risks:**
⚠ **Late-market entry** (2028 vs Tecvayli 2022) → 6-year head start = entrenched market share
⚠ **Next-gen CAR-T** (allogeneic) may disrupt TCE category by 2030-2032
⚠ **Price compression** if 4+ bispecific TCEs approved (payer pushback)

**Geographic Expansion:**
- **US (60% of sales):** Launch 2028 (Q1)
- **EU5 (28% of sales):** Launch 2028 (Q3) - conditional EMA approval
- **Japan (8% of sales):** Launch 2029 (local trial requirement)
- **China (4% of sales):** Launch 2030+ (NMPA path uncertain)

**NPV Analysis (2028-2042):**
- Peak sales: $2.1B (2033-2036)
- Duration: 9 years at peak (patent expiry 2043)
- Discount rate: 10%
- **Commercial NPV: $12.4B**

**Recommended Acquisition Value:**
- Commercial NPV: $12.4B
- Risk-adjusted (75% approval probability): $9.3B
- Risk-adjusted (development costs -$310M): **$9.0B**
- Acquisition at $2.2B = **24% of risk-adjusted NPV** ✓✓ Attractive

**Go-to-Market Strategy:**
1. **Pre-launch (6 months):** KOL engagement, REMS site certification
2. **Launch (2028):** Safety-first messaging, target high-volume academic centers
3. **Expansion (2029-2030):** Community oncology rollout, real-world evidence studies
4. **Lifecycle (2031+):** Line expansion (frontline MM trials), combination strategies`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 19700,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 20200,
      data: {
        step: 'Integrating clinical, patent, financial, regulatory, and market analyses...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 21200,
      data: {
        step: 'Cross-referencing risk factors and market opportunities...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 22200,
      data: {
        step: 'Generating acquisition recommendation and deal structure...',
      },
    },
    {
      type: 'complete',
      timestamp: 23500,
      data: {
        synthesis: `# M&A Recommendation: PROCEED WITH ACQUISITION

## Executive Summary

BioSpectra represents an **exceptional acquisition target** with best-in-class Phase 2 bispecific T-cell engager data (63% ORR, 3% ICANS), robust IP protection (clear FTO, 18-year exclusivity), and strong strategic fit. The **$2.2B asking price is at fair value** (median of 2024 transactions). Recommend proceeding with milestone-heavy structure to align incentives and manage $150M+ capital need.

---

## Integrated Analysis

### Clinical Assessment: BEST-IN-CLASS ✓✓
- **Efficacy:** 63% ORR vs 28% SoC (p<0.001), 42% CR rate unprecedented
- **PFS:** 12.4 vs 5.1 months (HR=0.48) - superior to current TCEs
- **Safety:** 3% ICANS (best-in-class vs Tecvayli 15%, Talvey 12%)
- **Competitive:** Best safety/efficacy balance among 2024-2025 TCEs
- **Risk:** ~25% Phase 3 failure rate for bispecific class (lower than CAR-T)

### Patent Assessment: STRONG ✓
- **IP Protection:** 5 key patents covering bispecific binding mechanism
- **FTO Status:** CLEAR - no blocking patents identified
- **Competitive Moat:** Novel linker technology, strong novelty
- **Exclusivity:** 18 years remaining (expires 2042)
- **Value:** Patent portfolio alone worth $350-450M
- **Risk:** Low (~10% likelihood of patent challenge)

### Financial Assessment: FAIRLY VALUED ✓
- **Fair Value:** $1.95-2.18B (DCF + Comps + Precedents)
- **Asking Price:** $2.2B (**at median of 2024 transactions**)
- **Capital Need:** $250-310M required before approval
- **Runway:** Only 18 months - financing pressure by Q3 2025
- **Risk:** Phase 3 capital + scaling risk offset by milestone structure

---

## Risk-Adjusted Valuation

| Scenario | Probability | Value | Weighted Value |
|----------|-------------|-------|----------------|
| Phase 3 Success → Approval | 75% | $2,800M | $2,100M |
| Phase 3 Failure | 25% | $400M* | $100M |
| **Expected Value** | | | **$2,200M** |

*Residual value from IP and platform technology

---

## Recommended Deal Structure

### Option A: All Cash ❌
- **Total:** $2.2B cash at close
- **Pros:** Simple, immediate ownership
- **Cons:** No downside protection, full capital risk

### Option B: Milestone-Based Structure ✅ **RECOMMENDED**

**Upfront Payment:** $1.2B
- Provides immediate capital for Phase 3 + manufacturing scale-up
- Addresses 18-month runway concern
- Covers $250-310M capital needs with buffer

**Phase 3 Milestones:** $600M
- First patient dosed: $200M (de-risks trial start)
- 50% enrollment: $200M (demonstrates recruitment feasibility)
- Positive data readout: $200M (key value inflection)

**Regulatory Milestones:** $400M
- FDA approval: $400M (final payment upon commercial success)

**Total Potential Value:** $2.2B
- **Meets seller's ask price if successful**
- Aligns incentives with clinical execution
- Protects buyer from Phase 3 failure (~25% risk)
- Addresses capital gap without dilutive financing round

---

## Key Deal Terms

**Structure:** Cash + Milestones (no equity)

**Closing Conditions:**
- Standard reps & warranties
- Key employee retention (at least 24 months)
- No material adverse changes to IP or clinical data

**Integration Plan:**
- Maintain autonomous operations through Phase 3
- Integrate manufacturing post-approval
- Retain key clinical and R&D leadership

**Financing:**
- Buyer provides operational capital (in addition to milestones)
- Total commitment: $1.2B upfront + $310M Phase 3 costs + $1.0B milestones = **$2.51B all-in**

---

## Risk Mitigation

✓ **Clinical Risk:** Milestone structure limits exposure if Phase 3 fails (75% → 55% probability)
✓ **Capital Risk:** Upfront $1.2B addresses 18-month runway + manufacturing scale-up
✓ **Valuation Risk:** Total $2.2B at fair value (median of 2024 transactions)
✓ **IP Risk:** Strong FTO and 18-year exclusivity de-risk commercialization

---

## Final Recommendation

### ✅ PROCEED WITH ACQUISITION

**Proposed Terms:**
- $1.2B upfront
- $1.0B milestone payments (Phase 3 + approval)
- Total: $2.2B upon successful FDA approval

**Rationale:**
1. Best-in-class clinical data (63% ORR, 3% ICANS) de-risks Phase 3
2. Clear IP position protects $2.8B+ peak sales potential
3. Milestone structure aligns incentives and protects downside
4. Strategic fit with existing oncology portfolio
5. Fills critical gap in bispecific TCE market (fastest-growing oncology segment)

**Next Steps:**
1. LOI with proposed milestone structure
2. Confirmatory due diligence (45-60 days)
3. Negotiate definitive agreement
4. Obtain board and regulatory approvals

---

**Analysis completed at $0.45 estimated cost**`,
        cost: 0.45,
      },
    },
  ],
};

/**
 * Demo Scenario 2: Competitive Analysis
 */
export const DEMO_COMPETITIVE_ANALYSIS: DemoScenario = {
  id: 'competitive-analysis',
  title: 'ADC Competitive Landscape Analysis',
  description: 'Compare Enhertu, Trodelvy, and Padcev across clinical efficacy, IP protection, and market positioning',
  query: 'Compare the competitive positioning of Enhertu, Trodelvy, and Padcev. Which antibody-drug conjugate has the strongest patent protection and commercial potential in 2024-2025?',
  documents: [
    'ADC_Clinical_Data_2024.pdf (2.3 MB)',
    'ADC_Patent_Landscape.pdf (1.8 MB)',
    'ADC_Market_Analysis_2025.pdf (3.5 MB)',
  ],
  estimatedDuration: 16000,
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Comparative analysis: Clinical Performance → IP Landscape → Market Position → Synthesis',
        mode: 'thorough',
        estimatedCost: '$0.38',
      },
    },
    {
      type: 'agent_start',
      timestamp: 700,
      data: {
        agent: 'Clinical Analyst',
        task: 'Comparing efficacy and safety profiles across three leading ADCs',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1300,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Analyzing response rates and survival data across indications...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 3000,
      data: {
        agent: 'Clinical Analyst',
        response: `## ADC Comparative Clinical Analysis (2024-2025)

**Enhertu (Daiichi Sankyo/AstraZeneca - trastuzumab deruxtecan):**
- Primary indication: HER2+ breast cancer
- ORR: 79.7% in HER2+ mBC (DESTINY-Breast03)
- Median PFS: 28.8 months vs 6.8 months (T-DM1)
- OS benefit: 23.4 months (hazard ratio 0.55)
- Payload: Topoisomerase I inhibitor (DXd)
- Key differentiator: Works in HER2-low tumors (expanding TAM)
- Safety: ILD (interstitial lung disease) 15%, Grade 3+ in 3%

**Trodelvy (Gilead - sacituzumab govitecan):**
- Primary indication: Triple-negative breast cancer (TNBC)
- ORR: 35% in pre-treated TNBC
- Median PFS: 5.6 months vs 1.7 months (chemo)
- OS benefit: 12.1 months vs 6.7 months
- Payload: SN-38 (topoisomerase I inhibitor)
- Target: Trop-2 (broadly expressed)
- Safety: Neutropenia 51% (Grade 3+), diarrhea 10%

**Padcev (Astellas/Seagen - enfortumab vedotin):**
- Primary indication: Urothelial carcinoma
- ORR: 51% in platinum-refractory patients
- Median PFS: 12.9 months (EV-302 combo trial)
- OS benefit: 31.5 months (combination, unprecedented)
- Payload: MMAE (microtubule inhibitor)
- Target: Nectin-4
- Safety: Skin reactions 68% (mostly Grade 1-2), peripheral neuropathy 56%

**Clinical Winner: Enhertu** - Unprecedented PFS (28.8 mo), expanding to HER2-low, multiple indications approved in 2024

Question for Patent Expert: Does Enhertu's superior clinical data translate to stronger IP protection for the DXd payload technology?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3400,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'Does Enhertu\'s superior clinical data translate to stronger IP protection for the DXd payload technology?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 3900,
      data: {
        agent: 'Patent Expert',
        task: 'Analyzing patent landscapes and competitive IP positioning',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 4600,
      data: {
        agent: 'Patent Expert',
        progress: 'Reviewing patent families and claim coverage...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 6500,
      data: {
        agent: 'Patent Expert',
        response: `## ADC Patent Landscape Analysis (2024-2025)

**Enhertu (Daiichi Sankyo/AstraZeneca):**
- Core patents: US10,808,039 (DXd linker-payload), US11,052,148 (HER2 ADC compositions)
- Expiry: 2038-2040 (DXd payload composition of matter)
- Breadth: Very broad - covers entire DXd payload class + multiple linkers
- Strength: Exceptionally strong - 400+ patent family members globally
- FTO: Dominant position in topoisomerase I ADC space
- Platform value: DXd applicable to multiple targets (HER2, HER3, TROP2, B7-H3)
- Additional: 85 continuations filed (2024-2041 protection)

**Trodelvy (Gilead - acquired from Immunomedics $21B, 2020):**
- Core patent: US9,556,244 (SN-38 ADC)
- Expiry: 2033-2035
- Breadth: Moderate - Trop-2 specific, some payload claims
- Strength: Solid but facing biosimilar threats post-2033
- FTO: Good position but CPI-613 linker not novel
- Competition: Multiple Trop-2 ADCs in development (Dato-DXd)

**Padcev (Astellas/Seagen - part of $43B Pfizer acquisition):**
- Core patent: US9,931,414 (Nectin-4 ADC with MMAE)
- Expiry: 2034-2036
- Breadth: Narrow - highly target-specific (Nectin-4)
- Strength: Strong in urothelial space but limited to single indication
- FTO: Clean but MMAE payload widely used (not proprietary)
- Platform: Part of Seagen's broader ADC platform (now Pfizer)

**Patent Winner: Enhertu** - Broadest IP estate (400+ patents), longest exclusivity (2041), platform technology applicable across multiple targets

Question for Financial Analyst: Given Enhertu's clinical dominance AND strongest IP position, what's the peak sales potential and market share outlook?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 7000,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given Enhertu\'s clinical dominance AND strongest IP position, what\'s the peak sales potential and market share outlook?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 7500,
      data: {
        agent: 'Financial Analyst',
        task: 'Analyzing market dynamics and commercial performance',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 8200,
      data: {
        agent: 'Financial Analyst',
        progress: 'Extracting sales data and market trends...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 10500,
      data: {
        agent: 'Financial Analyst',
        response: `## ADC Commercial & Market Analysis (2024-2025)

**Current Sales Performance (2024):**
- Enhertu: $3.2B (47% market share) - Clear leader
- Trodelvy: $1.1B (16% market share)
- Padcev: $1.4B (21% market share)
- Other ADCs: $1.1B (16% - Kadcyla, Adcetris, etc.)

**Growth Trajectories (2024 vs 2023):**
- Enhertu: +88% YoY (explosive growth!)
- Trodelvy: +35% YoY (steady expansion)
- Padcev: +125% YoY (rapid uptake in combo setting)

**Pricing:**
- Enhertu: ~$165K per treatment course (breast cancer)
- Trodelvy: ~$180K per treatment course
- Padcev: ~$200K per treatment course (higher due to combo use)

**Peak Sales Forecasts (2030):**
Based on approved indications + pipeline:
- Enhertu: **$15-18B** - Multiple indications (breast, lung, gastric, expanding to HER2-low)
- Trodelvy: $4-5B - TNBC, HR+ breast, bladder
- Padcev: $6-7B - Bladder combo dominance

**Total ADC Market:** $45-50B by 2030 (CAGR 22%)

**Commercial Winner: Enhertu** - Dominant position with 3x larger peak sales potential than competitors

**Key Driver:** DXd payload platform enables expansion across 10+ tumor types vs single-target competitors`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 11000,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 12000,
      data: {
        step: 'Integrating clinical, patent, and market data...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 13000,
      data: {
        step: 'Generating competitive positioning matrix...',
      },
    },
    {
      type: 'complete',
      timestamp: 15000,
      data: {
        synthesis: `# ADC Competitive Analysis: Enhertu Dominates on All Fronts

## Executive Summary

**Enhertu (Daiichi Sankyo/AstraZeneca) has established dominant market leadership** with superior clinical efficacy (79.7% ORR, 28.8 mo PFS), the strongest IP position (400+ patents, expires 2041), and explosive commercial growth (+88% YoY). Platform potential across 10+ targets positions Enhertu for $15-18B peak sales—3x larger than nearest competitor.

---

## Comparative Scorecard

| Dimension | Enhertu | Trodelvy | Padcev |
|-----------|---------|----------|--------|
| **ORR** | 79.7% ✓ | 35% | 51% |
| **Median PFS** | 28.8 mo ✓ | 5.6 mo | 12.9 mo |
| **OS Benefit** | 23.4 mo ✓ | 12.1 mo | 31.5 mo ✓ |
| **Patent Expiry** | 2041 ✓ | 2035 | 2036 |
| **Patent Family Size** | 400+ ✓ | 45 | 120 |
| **Platform Breadth** | 10+ targets ✓ | Trop-2 focused | Nectin-4 only |
| **2024 Sales** | $3.2B ✓ | $1.1B | $1.4B |
| **Growth Rate YoY** | +88% ✓ | +35% | +125% |
| **Peak Sales (2030)** | $15-18B ✓ | $4-5B | $6-7B |

**Overall Winner: ENHERTU** (8/9 categories)

---

## Detailed Analysis

### Clinical Performance

**Winner: Enhertu (by wide margin)**
- Highest ORR: 79.7% in HER2+ breast cancer
- Best PFS: 28.8 months (4.2x better than prior standard)
- Expanding indications: HER2-low breast (2024), lung, gastric approved
- Platform flexibility: DXd payload works across multiple targets
- Safety: Manageable ILD (3% Grade 3+), lower than expected

**Key Insight:** Enhertu is redefining treatment standards across oncology. HER2-low expansion alone added 60% more patients to addressable market.

**Padcev Note:** Remarkable OS (31.5 mo) in combination setting, but limited to bladder cancer only.

### Patent Protection

**Winner: Enhertu (overwhelmingly)**
- Latest expiry: 2041 (5+ years beyond competitors)
- Patent family size: 400+ patents globally (10x larger than Trodelvy)
- DXd payload coverage: Composition of matter on entire linker-payload class
- Platform protection: Blocks competitors from using topoisomerase I ADCs with similar linkers
- Continuations: 85 filed through 2024, extending protection
- FTO: Dominant—competitors must use inferior payloads or license DXd

**Risk for Trodelvy:** Daiichi developing Dato-DXd (Trop-2 + DXd payload) which could cannibalize Trodelvy's core indication with superior payload.

### Commercial Positioning

**Current Leader: Enhertu** ($3.2B, 47% ADC market share)
**Future Dominance: Enhertu** (projected $15-18B peak sales)

**Market Dynamics:**
- Total ADC market: $45-50B by 2030 (22% CAGR)
- Enhertu capturing 33-36% of total market at peak
- Platform approach: DXd payload being tested in 15 different ADCs
- Partnership model: AstraZeneca co-development accelerating global reach
- Indication expansion: 8 ongoing Phase 3 trials (HER3, B7-H3, TROP2)

**Trodelvy Headwinds:**
- Dato-DXd threat in core TNBC indication (better payload)
- Limited to topoisomerase I ADCs (overlaps with Enhertu mechanism)
- Biosimilar risk post-2033

**Padcev Strengths:**
- EV-302 combo data unprecedented in bladder cancer
- Now Pfizer asset (acquired Seagen for $43B)—strong commercial support
- Limited competition in Nectin-4 space

---

## Strategic Implications

### For Investors:

**STRONG BUY: Enhertu (Daiichi Sankyo/AstraZeneca)**
- Best-in-class clinical + IP + commercial trajectory
- Platform value: DXd payload applicable to 10+ targets
- $15-18B peak sales (blockbuster x3)
- Patent protection through 2041
- Risk: Already priced at premium multiples

**BUY: Padcev (Pfizer)**
- Dominant in bladder cancer niche
- Combination data outstanding (31.5 mo OS)
- Pfizer commercial muscle post-Seagen acquisition
- Upside from expanded indications
- Risk: Single indication concentration

**HOLD: Trodelvy (Gilead)**
- Solid TNBC position but facing headwinds
- Dato-DXd competitive threat in core market
- Limited platform potential vs Enhertu
- Patent expiry 2033-2035 creates biosimilar risk
- Risk: Market share erosion to superior DXd-based ADCs

### For Strategic Acquirers:

**Target: DXd payload platform assets**
- Any Daiichi Sankyo partnership opportunities
- Novel linker technologies compatible with DXd
- Manufacturing capabilities for next-gen payloads

**Avoid: Trop-2 ADCs (crowded, inferior to Enhertu)**

### For Competitors:

**Design Strategy:**
- Cannot compete with DXd in topoisomerase I space (patent blocking)
- Focus on differentiated payloads: MMAE, MMAF, PBD dimers
- Target novel antigens: Nectin-4, B7-H4, PTK7
- Pursue tumor-activated prodrug ADCs to improve therapeutic index
- Consider licensing DXd from Daiichi if developing promising antibody

---

## Key Takeaways

1. **Platform >> Single Product** - Enhertu's DXd payload creates durable competitive moat across multiple indications
2. **Patent breadth matters more than single patents** - 400 patents > narrow claims
3. **Clinical excellence drives adoption** - 28.8 mo PFS changing treatment paradigms
4. **ADC market consolidation** - Expect Enhertu + 2-3 niche players (Padcev in bladder, others in specific indications)
5. **2024-2025 trend: Payload quality > Target selection** - DXd payload superiority outweighing target differences

---

**Analysis completed at $0.38 estimated cost**`,
        cost: 0.38,
      },
    },
  ],
};

/**
 * Demo Scenario 3: Technology Licensing Deal
 */
export const DEMO_LICENSING_DEAL: DemoScenario = {
  id: 'licensing-deal',
  title: 'CRISPR Base Editing Platform License',
  description: 'Comprehensive evaluation of BaseGenomics\' adenine base editor platform across technology validation, IP landscape, deal economics, and market potential.',
  query: 'Should we license BaseGenomics\' adenine base editing platform for $125M upfront + double-digit royalties? Analyze the technology validation, IP landscape, and deal economics.',
  documents: [
    'BaseGenomics_Technology_Package.pdf (2.1 MB)',
    'Base_Editing_Patent_Analysis.pdf (3.2 MB)',
    'License_Term_Sheet.pdf (0.8 MB)',
  ],
  estimatedDuration: 19500,
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Technology evaluation: Clinical Validation → IP Assessment → Deal Economics → Market Analysis → Decision',
        mode: 'thorough',
        estimatedCost: '$0.42',
      },
    },
    {
      type: 'agent_start',
      timestamp: 650,
      data: {
        agent: 'Clinical Analyst',
        task: 'Evaluating adenine base editing technology and clinical validation',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1200,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Reviewing editing mechanism, efficiency, and off-target data...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 2800,
      data: {
        agent: 'Clinical Analyst',
        response: `## Adenine Base Editing Technology Assessment (2024-2025)

**Mechanism:**
- Evolved TadA deaminase fused to Cas9 nickase (ABE9.1 variant)
- Converts A•T → G•C base pairs without double-strand breaks
- PAM requirement: NGG (broad targeting range)
- Editing window: 4-8 nucleotides

**Technical Performance:**
- On-target editing: 75-92% efficiency (ex vivo HSCs)
- Off-target deamination: <0.5% (RNA-seq validated)
- Bystander editing: Minimal (<2% unwanted A-to-G edits in window)
- Delivery: Lipid nanoparticle (LNP) mRNA format

**Preclinical Validation:**
✓ Mouse models: Corrected hemophilia B, sickle cell (>60% editing in vivo)
✓ NHP studies: Liver PCSK9 editing 45% (durable >6 months), no toxicity
✓ Human HSCs ex vivo: 82% editing (BCL11A enhancer for sickle cell)

**Clinical Progress (2024-2025):**
✓ Phase 1/2: Sickle cell disease (n=12 patients, 8-month follow-up)
  - Mean HbF: 42% (functional cure threshold >20%)
  - Zero VOC (vaso-occlusive crises) events in 9/12 patients
  - Safety: No CRISPR-related AEs, transient cytopenias only
✓ Phase 1: Familial hypercholesterolemia (liver PCSK9) - enrolling

**Competitive Context:**
- Beam Therapeutics: Adenine BE (BEAM-101 sickle cell Phase 1/2)
- Verve Therapeutics: In vivo liver editing (PCSK9) - approved New Zealand 2024
- Prime Medicine: Prime editing (broader, but less efficient ~30-40%)

**Assessment:** Technology validated in humans with strong efficacy + safety data. Clinical-stage de-risks platform vs preclinical competitors.`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3200,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'What\'s the IP coverage on this base editing platform? Do we have freedom-to-operate given Broad/Harvard foundational CRISPR patents?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 3700,
      data: {
        agent: 'Patent Expert',
        task: 'Analyzing patent portfolio and freedom-to-operate',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 4400,
      data: {
        agent: 'Patent Expert',
        progress: 'Reviewing patent claims and competitive landscape...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 6300,
      data: {
        agent: 'Patent Expert',
        response: `## Base Editing IP & Patent Analysis (2024-2025)

**BaseGenomics Patent Portfolio:**
- **US11,891,634**: "Evolved Adenine Deaminases for Base Editing" (ABE9.1)
  - Filed: 2022, Granted: 2024
  - Claims: Evolved TadA variants with improved specificity
  - Composition of matter on ABE9.1 protein sequence
  - Expires: 2042
- **US11,756,432**: "Methods for In Vivo Adenine Base Editing"
  - Filed: 2021, Granted: 2023
  - Method claims: LNP delivery + dosing regimens
  - Expires: 2041
- **WO2023/234567**: PCT application (35 countries including EU, China, Japan)
- 14 continuations filed 2023-2024 (editing window optimization, disease-specific guides)

**Patent Strength:**
✓ Strong novelty - ABE9.1 is evolved variant (not obvious from ABE8e)
✓ Clean prosecution - granted without significant rejections
✓ Composition of matter on protein = strong protection
✓ Multiple independent claims provide layered coverage

**Foundational IP Dependencies:**
✓ **Broad Institute sublicense secured** - Cas9 base editor use (cost included in deal)
✓ Harvard sublicense - TadA deaminase IP (already negotiated)
⚠ **No Editas/Caribou blocking patents identified** - FTO clear

**Competitive IP Landscape:**
- **Beam Therapeutics**: ABE8e variant (slightly different, expires 2037)
- **Prime Medicine**: Prime editing IP (orthogonal mechanism, not competitive)
- **Verve Therapeutics**: Licensed Beam's ABE8e for cardiovascular (different field)

**Freedom-to-Operate:**
✓ **CLEAR FTO** - foundational licenses secured
✓ No blocking third-party patents in adenine BE space
✓ Broad/Harvard sublicense costs: ~$15M upfront (already paid by BaseGenomics)
✓ Geographic coverage: US, EU, China, Japan (80% global market)

**IP Risk Assessment:**
- **LOW risk** of infringement (FTO validated by independent counsel)
- Foundational licenses secured and transferable
- Legal due diligence completed: $0 additional clearance costs
- Strong defensive position vs Beam (different evolved variants)

**IP Value Drivers:**
- 18 years remaining exclusivity (2042 composition of matter)
- Multiple disease indications covered under single license
- Platform applicable to >4,000 genetic diseases caused by A•T mutations
- Sublicense rights included (can sublicense to regional partners)

**Question for Financial:** Given strong IP position, low legal risk, and broad platform applicability, is $125M upfront justified by revenue potential?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 6700,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given strong IP position, low legal risk, and broad platform applicability, is $125M upfront justified by revenue potential?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 7200,
      data: {
        agent: 'Financial Analyst',
        task: 'Analyzing licensing economics and deal structure',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 7900,
      data: {
        agent: 'Financial Analyst',
        progress: 'Evaluating term sheet and financial projections...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 9800,
      data: {
        agent: 'Financial Analyst',
        response: `## Base Editing License Deal Economics (2024-2025)

**Proposed Terms:**
- Upfront: $125M
- Development milestones: $275M (IND, Phase 2, Phase 3 start)
- Regulatory milestones: $300M (approval per indication, up to 3)
- Royalties: 12% net sales (double-digit, tiered 10-15% by volume)
- Sublicense rights: 50% profit share on regional sublicenses
- Field: Genetic diseases (exclusive, all indications)
- Territory: Worldwide

**Cost-Benefit Analysis:**

*Total Investment (Lead Program - Sickle Cell):*
- Upfront: $125M
- Development costs Phase 2-3: $350M (ex vivo HSC editing)
- Milestone payments: $275M (paid as we progress)
- **Total at-risk before approval: $750M**

*Revenue Potential (Base Case - Sickle Cell Only):*
- Addressable patients (US+EU): ~35,000 diagnosed
- Treatment price: $2.8M per patient (similar to Casgevy)
- Market penetration: 15% at peak (2032) = 5,250 patients/year
- Peak sales: **$14.7B annually**
- 12% royalty = **$1.76B/year** at peak
- NPV of royalties (10% discount, 2032-2042): **$10.8B**
- **ROI: 1,340%** ✓✓✓

*Platform Upside (Multiple Indications):*
- Sickle cell disease: $14.7B peak sales
- Hemophilia A/B: $8-10B combined
- Familial hypercholesterolemia (PCSK9): $6-8B
- Ornithine transcarbamylase deficiency: $2-3B
- **Total addressable platform: $30-35B** across 5+ indications

*Scenario Analysis:*

**Scenario A: Lead program success only (Sickle Cell)**
- Peak royalties: $1.76B/year
- NPV (10 years): $10.8B
- ROI: **1,340%** ✓✓✓

**Scenario B: Lead + 1 additional indication**
- Combined peak royalties: $2.96B/year
- NPV: $18.2B
- ROI: **2,330%** ✓✓✓

**Scenario C: Platform failure (all indications fail Phase 3)**
- Total loss: $750M
- Probability: ~15% (low given Phase 1/2 clinical data)
- Expected loss: -$112M

**Risk-Adjusted Expected Value:**
- Success (85% probability): $10.8B × 0.85 = $9.18B
- Failure (15% probability): -$750M × 0.15 = -$112M
- **Expected NPV: $9.07B**
- **Risk-adjusted ROI: 1,109%** ✓✓✓

**Comparable Licensing Deals (2023-2024):**
- Beam Therapeutics + Pfizer: $300M upfront (base editing, cardiovascular)
- Verve + Lilly: $60M upfront + $1.8B milestones (in vivo base editing)
- Prime Medicine + BMS: $85M upfront + $1.7B milestones (prime editing)
- **Median upfront: $85-125M** → Our deal at market
- **This deal: COMPETITIVE** on upfront, favorable on royalty %

**Deal Assessment:**
✓ **HIGHLY ATTRACTIVE** - Strong technology with Phase 1/2 validation
✓ $125M upfront reasonable given clinical-stage de-risking
✓ 12% royalty generous (vs typical 5-8% for platform tech)
✓ Clear FTO eliminates sublicense risk
✓ Platform optionality provides significant upside

**Recommendation:** **PROCEED** - This is a compelling risk/reward profile with 1,100%+ expected ROI.

**Question for Market Research:** What's the total addressable market for base editing therapies across genetic diseases, and how does this platform position against Beam and Verve?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 10100,
      data: {
        from: 'Financial Analyst',
        to: 'Market Research Analyst',
        question: 'What\'s the total addressable market for base editing therapies across genetic diseases, and how does this platform position against Beam and Verve?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 10600,
      data: {
        agent: 'Market Research Analyst',
        task: 'Analyzing gene therapy market, base editing competitive landscape, and commercial potential',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 11300,
      data: {
        agent: 'Market Research Analyst',
        progress: 'Sizing genetic disease markets and mapping competitive positioning...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 13100,
      data: {
        agent: 'Market Research Analyst',
        response: `## Gene Therapy & Base Editing Market Analysis (2025-2040)

**Total Gene Therapy Market:**

**Current Market (2024-2025):**
- Total gene therapy market: $8.5B (2024)
- Growth rate: 28% CAGR (2024-2030)
- **Projected 2030 market: $35-40B**
- **Projected 2040 market: $85-100B**

**Market Segments:**
- Ex vivo cell therapies: 42% ($3.6B) - CAR-T, HSC gene therapy
- In vivo gene therapies: 38% ($3.2B) - AAV, LNP delivery
- **Base editing therapies: 8% ($680M)** - Emerging segment
- Other (RNA, etc.): 12%

**Base Editing Competitive Landscape:**

**Market Leaders (2024-2025):**

1. **Beam Therapeutics (Public, $2.8B market cap):**
   - Platform: ABE8e + CBE4max (adenine & cytosine base editors)
   - Lead programs:
     - BEAM-101: Sickle cell disease (Phase 1/2)
     - BEAM-302: Glycogen storage disease (Phase 1/2)
     - BEAM-201: T-ALL (preclinical)
   - Partnerships: Pfizer ($300M), Verve ($600M)
   - **Market position:** Broadest base editing pipeline

2. **Verve Therapeutics (Public, $1.1B market cap):**
   - Platform: In vivo liver base editing (licensed from Beam)
   - Lead programs:
     - VERVE-101: PCSK9 (heart disease) - **APPROVED New Zealand 2024!**
     - VERVE-102: ANGPTL3 (heart disease, Phase 1)
   - **Market position:** First approved base editing therapy

3. **Prime Medicine (Private, $1.6B valuation):**
   - Platform: Prime editing (broader than base editing but less efficient)
   - Lead: Chronic granulomatous disease (Phase 1/2)
   - Backed by: F-Prime, Arch Ventures
   - **Market position:** Next-gen editing, but 30-40% efficiency vs 75-92% base editors

**BaseGenomics Competitive Positioning:**

**vs Beam Therapeutics:**
✓ **Differentiation:** ABE9.1 evolved variant (not ABE8e) with better specificity
✓ **Advantage:** 75-92% efficiency vs Beam's 60-75%
✓ **Advantage:** Proprietary absorption enhancer (reduced off-target)
⚠ **Disadvantage:** Beam has 3-year head start, established partnerships
✓ **Opportunity:** Different evolved variant = non-competitive, complementary

**vs Verve Therapeutics:**
✓ **Differentiation:** Ex vivo HSC editing vs Verve's in vivo liver editing
✓ **Advantage:** Broader applicability (blood disorders, not just liver)
⚠ **Disadvantage:** Verve has first approval (VERVE-101 in New Zealand)
✓ **Opportunity:** Different delivery (ex vivo vs in vivo) = non-overlapping indications

**vs Prime Medicine:**
✓ **Advantage:** Higher editing efficiency (75-92% vs 30-40%)
✓ **Advantage:** Clinical-stage vs Prime's earlier development
✓ **Advantage:** Proven safety profile (Phase 1/2 complete)
✓ **Opportunity:** Base editing simpler than prime editing = faster path to approval

**Total Addressable Market by Indication:**

**Lead Indications (BaseGenomics Platform):**

1. **Sickle Cell Disease:**
   - Addressable patients: 100,000 (US) + 50,000 (EU)
   - Treatment price: $2.8M (Casgevy precedent)
   - Market penetration: 20-25% at peak
   - **Market size: $14.7-21B** (annual at peak)
   - Peak: 2032-2036

2. **Hemophilia A & B:**
   - Addressable patients: 40,000 (US+EU)
   - Treatment price: $3.2M (one-time cure)
   - Market penetration: 30% (gene therapy accepted)
   - **Market size: $8-10B**
   - Peak: 2033-2037

3. **Familial Hypercholesterolemia (PCSK9):**
   - Addressable patients: 1.3M (homozygous + severe heterozygous)
   - Treatment price: $500K (in vivo, one-time)
   - Market penetration: 8-12% (conservative, in vivo risk)
   - **Market size: $6-8B**
   - Peak: 2034-2038

4. **Ornithine Transcarbamylase Deficiency:**
   - Addressable patients: 15,000 (US+EU)
   - Treatment price: $2.5M
   - Market penetration: 40% (severe unmet need)
   - **Market size: $2-3B**
   - Peak: 2035-2038

5. **Beta-Thalassemia:**
   - Addressable patients: 60,000 (US+EU)
   - Treatment price: $2.8M
   - Market penetration: 18-22%
   - **Market size: $4-5B**
   - Peak: 2033-2037

**Total Platform TAM: $35-47B** (across 5 indications)

**Market Share Projections:**

**Scenario A: Lead Position (30% probability)**
- Capture 25-30% of base editing market
- Peak revenue across platform: $10-14B
- License value: $15-20B (1.5x peak sales)

**Scenario B: Strong #2 Position (50% probability) ← BASE CASE**
- Capture 18-22% of base editing market
- Peak revenue across platform: $7-10B
- License value: $10-15B

**Scenario C: Niche Player (15% probability)**
- Capture 10-15% of base editing market
- Peak revenue: $4-7B
- License value: $5-8B

**Scenario D: Failure (5% probability)**
- Platform fails clinically or Beam/Verve dominate
- Minimal commercial traction
- Write-off scenario

**Expected Commercial Value:**
- Scenario A (30%): $17.5B × 0.30 = $5.25B
- Scenario B (50%): $12.5B × 0.50 = $6.25B
- Scenario C (15%): $6B × 0.15 = $0.9B
- Scenario D (5%): $0 × 0.05 = $0
- **Expected value: $12.4B**

**Risk-Adjusted for Development:**
- Phase 2 success: 85%
- Phase 3 success (conditional): 75%
- Approval probability: 64%
- **Risk-adjusted value: $7.9B**

**Licensing ROI Calculation:**
- Investment: $125M upfront + $750M development = $875M total
- Expected value: $7.9B (risk-adjusted)
- **Expected ROI: 803%** ✓✓✓

**Competitive Dynamics:**

**Key Market Trends (2024-2025):**
✓ **Regulatory acceptance:** Casgevy approval (2023) validated CRISPR gene therapy
✓ **Payer coverage:** 75% commercial plans now cover one-time curative therapies
✓ **Manufacturing scale:** CDMOs investing in LNP + ex vivo capabilities
✓ **Pricing precedent:** $2-3M per patient accepted for curative therapies

**Barriers to Entry:**
⚠ **High development costs:** $500-800M per indication to approval
⚠ **Manufacturing complexity:** Ex vivo HSC editing requires specialized facilities
⚠ **Regulatory uncertainty:** FDA still defining base editing guidelines
⚠ **Beam partnerships:** Beam has locked up Pfizer, Verve (limits competition)

**Commercial Opportunities:**
✓ **Multiple shots on goal:** Platform applicable to 4,000+ genetic diseases
✓ **First-mover in ABE9.1:** Evolved variant differentiation vs Beam
✓ **Partnership potential:** Pharma seeking base editing platforms (Roche, Novo, GSK)
✓ **Regional sublicensing:** China/Japan markets underserved ($8-12B additional TAM)

**Market Timing:**
✓ **Window open:** Base editing still early (only 1 approval globally)
✓ **Validation increasing:** Beam Phase 2 data expected 2025-2026 (de-risks category)
✓ **M&A active:** Pharma acquiring gene therapy platforms ($1-5B deals)

**Market Recommendation:**

✅ **ATTRACTIVE MARKET OPPORTUNITY**
- $35-47B total platform TAM across 5+ indications
- Base editing market growing 45% CAGR (2024-2035)
- Competitive positioning strong (ABE9.1 differentiation)
- Multiple exit scenarios all profitable
- **Expected ROI: 803%** supports $125M upfront investment

**Key Success Factors:**
1. Lead program (sickle cell) approval by 2028-2029
2. Expand to 2-3 additional indications by 2032
3. Maintain 18-22% market share vs Beam/Verve
4. Execute regional sublicenses (China/Japan)
5. Consider pharma acquisition exit at Phase 3 data (2027-2028)`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 13600,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 14500,
      data: {
        step: 'Integrating technology, IP, financial, and market analyses...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 15600,
      data: {
        step: 'Generating deal structure alternatives...',
      },
    },
    {
      type: 'complete',
      timestamp: 18000,
      data: {
        synthesis: `# Licensing Recommendation: PROCEED WITH DEAL

## Executive Summary

BaseGenomics' adenine base editing platform represents an **exceptional licensing opportunity** with Phase 1/2 validated technology (42% HbF in sickle cell), clean IP (clear FTO, Broad/Harvard licenses secured), and extraordinary economics (1,100%+ risk-adjusted ROI). **Strongly recommend PROCEEDING** with $125M upfront deal—this is a transformative platform technology at fair market terms.

---

## Integrated Risk Assessment

### Technology Risk: LOW ✓

**Strengths:**
✓ **Human clinical validation:** 42% HbF in Phase 1/2 sickle cell (n=12 patients)
✓ **Best-in-class editing:** 75-92% on-target efficiency, <0.5% off-target
✓ **Proven delivery:** LNP mRNA format validated in humans
✓ **Multiple indications:** Sickle cell + hemophilia + FH in clinic
✓ **Safety demonstrated:** Zero CRISPR-related AEs in 12 patients

**Minimal Weaknesses:**
- Manufacturing scale-up required (standard for clinical-stage biotech)
- Long development timeline to approval (typical 5-7 years)

**Assessment:** Technology substantially de-risked by Phase 1/2 success

### IP Risk: LOW ✓

**Exceptional IP Position:**
✓ **Compostion of matter:** ABE9.1 protein patent (strongest protection)
✓ **FTO clean:** Broad/Harvard licenses secured and transferable
✓ **No hidden costs:** All foundational sublicenses included in deal
✓ **18-year exclusivity:** 2042 expiry provides long commercial runway
✓ **Defensive:** Strong position vs Beam Therapeutics (different variants)

**IP Validation:**
✓ Independent FTO opinion obtained (clean)
✓ No blocking third-party patents identified
✓ Global coverage (US, EU, China, Japan = 80% market)

**Assessment:** Clean, broad, durable IP with minimal infringement risk

### Financial Risk: LOW ✓

**Strong Deal Economics:**
✓ **$125M upfront at market rate** (vs Beam+Pfizer $300M, Verve+Lilly $60M)
✓ **1,100%+ risk-adjusted ROI** (exceptional for biotech)
✓ **12% royalty** (generous vs typical 5-8%)
✓ **Platform optionality:** $30-35B addressable across 5+ indications
✓ **Milestone structure:** Only pay $575M more if successful

**Conservative Assumptions:**
- 15% market penetration (sickle cell) → $14.7B peak sales
- 85% success probability (Phase 1/2 de-risks)
- $750M total at-risk → $9.07B expected NPV

**Assessment:** Compelling risk/reward with platform upside

---

## Value Creation Analysis

### Base Case (Sickle Cell Only)
- Development cost: $750M
- Peak sales: $14.7B
- Royalty (12%): $1.76B/year
- NPV (10 years): **$10.8B**
- **ROI: 1,340%** ✓✓✓

### Platform Upside (5 Indications)
- Combined peak sales: $30-35B
- Royalty stream: $3.6-4.2B/year
- NPV: **$22-26B**
- **ROI: 2,800-3,350%** ✓✓✓

### Risk-Adjusted Expected Value
- Expected NPV: **$9.07B** (85% probability of success)
- Risk-adjusted ROI: **1,109%**
- IRR: ~45% (extraordinary for platform tech)

---

## Deal Structure Assessment

**Proposed Terms Analysis:**

✓ **Upfront ($125M):** Fair market value for Phase 1/2 asset
✓ **Milestones ($575M):** Performance-based, protects downside
✓ **Royalties (12%):** Above-market, reflects platform value
✓ **Field (genetic diseases):** Broad enough for platform expansion
✓ **Territory (worldwide):** Full commercial rights
✓ **Sublicense rights:** 50% profit share (standard)

**Comparable Deal Benchmarking:**
- Beam + Pfizer: $300M upfront (but cardiovascular only, narrower)
- Verve + Lilly: $60M + $1.8B milestones (in vivo, single indication)
- Prime + BMS: $85M + $1.7B milestones (prime editing, earlier stage)

**This Deal:** COMPETITIVE to FAVORABLE across all dimensions

---

## Strategic Rationale

### Why This Deal Makes Sense:

1. **Clinical de-risking:** Phase 1/2 data substantially reduces failure risk
2. **Platform technology:** Applicable to >4,000 genetic diseases
3. **Market timing:** First-mover advantage in adenine base editing
4. **IP position:** Clean FTO eliminates hidden costs
5. **Financial returns:** 1,100%+ ROI at conservative assumptions
6. **Competitive advantage:** Blocks competitors from best ABE platform

### Key Success Factors:

✓ Lead program (sickle cell) has functional cure data
✓ $2.8M pricing validated by Casgevy approval (2023)
✓ No competing ABEs in late-stage development
✓ Platform expandable to 5+ blockbuster indications
✓ Sublicense opportunity to regional partners

---

## Recommended Next Steps

### ✅ PROCEED WITH LICENSE

**Immediate Actions:**
1. **Execute term sheet** - Lock in deal before competing bids
2. **Form integration team** - Clinical, CMC, regulatory
3. **Advance lead program** - Initiate Phase 2/3 sickle cell (registrational)
4. **Secure manufacturing** - Partner with CDMO for commercial scale
5. **IND expansion** - File INDs for hemophilia + FH within 18 months

**Deal Terms to Finalize:**
- Confirm Broad/Harvard sublicense transferability
- Define sublicense profit share mechanics
- Establish joint steering committee
- Negotiate regional sublicense rights (China/Japan)

**Investment Approval:**
- **Upfront: $125M** (upon execution)
- **Year 1 development: $80-100M** (Phase 2/3 startup)
- **Total 5-year commitment: ~$450M** (before approval milestones)

---

## Final Recommendation

### ✅ STRONGLY RECOMMEND PROCEEDING

**Bottom Line:**
This is an **exceptional opportunity** to acquire a validated, best-in-class adenine base editing platform at fair market terms. The combination of strong Phase 1/2 clinical data, clean IP, and extraordinary financial returns (1,100%+ ROI) makes this a compelling strategic investment.

**Key Decision Factors:**
1. ✓ Technology validated in humans (42% HbF, zero AEs)
2. ✓ Clean IP with clear FTO (no hidden costs)
3. ✓ Platform potential: $30-35B addressable market
4. ✓ Competitive terms: $125M at median of 2023-2024 deals
5. ✓ Risk-adjusted ROI: 1,109% (far above hurdle rate)

**Timing is Critical:**
- Beam Therapeutics advancing competing ABE platform
- Multiple pharma companies evaluating base editing licenses
- **Act now to secure exclusive rights before bidding war**

---

**Analysis completed at $0.42 estimated cost**`,
        cost: 0.42,
      },
    },
  ],
};

/**
 * Demo Scenario 4: Series B Investment Decision
 */
export const DEMO_INVESTMENT_DECISION: DemoScenario = {
  id: 'investment-decision',
  title: 'Oral GLP-1 Series B Investment',
  description: 'Should we invest $40M in ObesityRx\'s Series B? Comprehensive analysis across clinical data, IP landscape, financial terms, and market dynamics.',
  query: 'Should we invest $40M in ObesityRx\'s $150M Series B? Evaluate their oral GLP-1 Phase 2a data, IP portfolio relative to Novo/Lilly, and financial runway to Phase 3.',
  documents: [
    'ObesityRx_Phase2a_Results.pdf (2.2 MB)',
    'Oral_GLP1_Competitive_Landscape.pdf (3.1 MB)',
    'Series_B_Term_Sheet.pdf (0.6 MB)',
  ],
  estimatedDuration: 19000,
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Investment evaluation: Phase 2a Analysis → IP Review → Financial Model → Market Dynamics → Investment Decision',
        mode: 'thorough',
        estimatedCost: '$0.38',
      },
    },
    {
      type: 'agent_start',
      timestamp: 600,
      data: {
        agent: 'Clinical Analyst',
        task: 'Analyzing Phase 2a oral GLP-1 efficacy and safety vs injectable competitors',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1100,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Reviewing weight loss efficacy and GI tolerability data...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 2600,
      data: {
        agent: 'Clinical Analyst',
        response: `## Phase 2a Oral GLP-1 Analysis (2024-2025)

**Trial Design:**
- N=182 adults with obesity (BMI 30-45)
- Randomized, placebo-controlled, 4 arms
- Doses: 5mg, 10mg, 20mg QD vs placebo
- Duration: 16 weeks
- Primary: % weight loss from baseline
- Secondary: Glycemic control, GI tolerability

**Efficacy Results (16 weeks):**
✓ **5mg:** -5.2% weight loss (vs -1.8% placebo)
✓ **10mg:** -8.7% weight loss (p<0.001)
✓ **20mg:** -12.3% weight loss (exceptional for oral!)
✓ Dose-dependent response (strong signal for higher doses)
✓ HbA1c reduction: -1.1% at 20mg dose (glycemic benefit)

**Safety & Tolerability:**
✓ **Nausea:** 32% at 20mg (vs 58% for oral semaglutide) - BETTER tolerability!
✓ **Vomiting:** 8% at 20mg (vs 24% semaglutide)
✓ **Discontinuations due to AEs:** 6% (vs 12% semaglutide)
✓ No pancreatitis, no medullary thyroid events
✓ **Key differentiator:** Proprietary absorption enhancer reduces GI side effects

**Competitive Benchmarking (2024-2025):**

*Injectable GLP-1s (market leaders):*
- Wegovy (semaglutide): -15% weight loss at 68 weeks (gold standard)
- Zepbound (tirzepatide): -21% at 72 weeks (dual GLP-1/GIP)
- Mounjaro: -22% at 72 weeks (diabetes)

*Oral Competitors:*
- Rybelsus (oral semaglutide): -5% weight loss (limited obesity data)
- Novo's oral amycretin: Phase 2, no public data yet
- Lilly's orforglipron: -15% at 36 weeks (but 47% nausea rate!)

**ObesityRx Positioning:**
✓ **Best-in-class tolerability** for oral GLP-1 (32% vs 47% nausea)
✓ **Strong efficacy** (-12.3% at 16 weeks projects to -18-20% at 52 weeks)
✓ **Oral convenience** (daily pill vs weekly injection)
✓ **Price advantage potential** (oral manufacturing cheaper)

**Development Path:**
- Phase 2b: 400 patients, 52 weeks, higher doses (30mg, 40mg) - starting Q1 2025
- Expected peak efficacy: -18 to -22% at 52 weeks (competitive with Wegovy)
- Phase 3 timeline: 2026-2028
- Approval: 2029-2030 (5-6 years to market)

**Key Risks:**
⚠ Novo/Lilly already dominating market ($50B+ by 2030)
⚠ Phase 2b may not replicate strong tolerability signal
⚠ Oral semaglutide already approved (first-mover in oral GLP-1)

**Competitive Advantages:**
✓ Superior tolerability enables higher dosing → better weight loss
✓ Oral convenience for needle-phobic patients (~30% of addressable market)
✓ Patent runway: 2042 expiry vs Wegovy 2032

**Question for Patent Expert:** How differentiated is our molecule vs Novo's oral semaglutide and Lilly's orforglipron?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3000,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'How differentiated is our oral GLP-1 molecule vs Novo\'s oral semaglutide and Lilly\'s orforglipron? What\'s our FTO position?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 3500,
      data: {
        agent: 'Patent Expert',
        task: 'Reviewing patent portfolio and competitive IP landscape',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 4100,
      data: {
        agent: 'Patent Expert',
        progress: 'Analyzing composition and method claims...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 5800,
      data: {
        agent: 'Patent Expert',
        response: `## Oral GLP-1 IP Portfolio Assessment (2024-2025)

**Core Patents:**
- **US11,892,456**: "Non-Peptide GLP-1 Receptor Agonists"
  - Filed: 2021, Granted: 2024
  - Composition claims: Novel small molecule GLP-1R agonist (differentiated from semaglutide)
  - 22 compound claims including lead ORX-104
  - Expires: 2042

- **US11,734,201**: "Oral Absorption Enhancer Formulations"
  - Filed: 2022, Granted: 2024
  - Method claims: Proprietary permeation enhancer (NOT SNAC like Rybelsus)
  - Reduces GI side effects vs standard formulations
  - Expires: 2043

**Additional IP:**
- Dosing regimen patent (QD with food): Expires 2041
- Crystal form patent (enhanced stability): Expires 2042
- 8 continuations filed 2023-2024

**Competitive IP Landscape:**

*Novo Nordisk (Oral Semaglutide/Rybelsus):*
- Molecule: Modified GLP-1 peptide (not novel small molecule)
- Formulation: SNAC absorption enhancer (expired in 2039)
- **Differentiation:** ORX-104 is non-peptide small molecule with different structure

*Lilly (Orforglipron):*
- Molecule: Small molecule GLP-1R agonist (similar class to ours)
- IP: US11,234,890 (expires 2041)
- **Concern:** Structural similarity possible - FTO analysis required

*Pfizer (Danuglipron - discontinued 2024):*
- Molecule: Small molecule GLP-1R agonist
- Program terminated due to nausea (71% incidence)
- IP available for licensing/acquisition

**Freedom-to-Operate Analysis:**

✓ **vs Novo (Rybelsus):** CLEAR - completely different molecular structure
⚠ **vs Lilly (Orforglipron):** MODERATE RISK - both non-peptide small molecules
  - Independent FTO counsel opinion: 65% confidence no infringement
  - Key differentiator: Our absorption enhancer (not SNAC)
  - Structural claims differ in core scaffold

**FTO Risk Mitigation:**
- Design-around options available if Lilly asserts (2 backup compounds)
- Cross-license opportunity possible (both need manufacturing scale)
- Prior art exists for small molecule GLP-1R agonists (academic publications 2018-2020)

**Patent Strength:**
✓ Composition of matter on ORX-104 (strongest protection)
✓ Novel absorption enhancer (NOT SNAC) = key differentiator
✓ Clean prosecution - minimal amendments
✓ Global coverage: US, EU5, China, Japan (90% market)
✓ 19 years remaining exclusivity (2042-2043)

**Competitive Advantages:**
✓ **Absorption enhancer IP:** Enables better tolerability → key commercial differentiator
✓ **Later expiry than Wegovy:** 2042 vs Wegovy 2032 (10-year advantage)
✓ **First non-peptide oral with clinical data:** Strong novelty

**IP Valuation (assuming Phase 3 success):**
- Patent estate value: $800M-$1.2B
- vs Lilly orforglipron (discontinued): $0
- vs Wegovy (injectable, earlier expiry): Lower long-term value

**Key Risk:**
⚠ Lilly could file continuation claims to block our molecule (35% probability)
⚠ Litigation costs: $15-25M if Lilly asserts
⚠ Settlement/license: Possible 5-8% royalty to Lilly in worst case

**Question for Financial:** Given 35% IP risk from Lilly and strong Phase 2a data, what's the Series B valuation and our expected return?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 6200,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given 35% IP risk from Lilly and strong Phase 2a data, what\'s the Series B valuation and our expected return?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 6700,
      data: {
        agent: 'Financial Analyst',
        task: 'Analyzing financials, burn rate, and Series B terms',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 7300,
      data: {
        agent: 'Financial Analyst',
        progress: 'Building cash flow projections and runway analysis...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 9200,
      data: {
        agent: 'Financial Analyst',
        response: `## Financial Analysis & Series B Investment Terms (2024-2025)

**Current Financial Position (Q4 2024):**
- Cash: $22M
- Monthly burn: $4.2M (ramping Phase 2b)
- **Runway: 5.2 months** (urgent need for capital!)
- Headcount: 58 employees (clinical + CMC heavy)
- Previous funding: Seed $8M (2021), Series A $35M (2023)

**Series B Terms:**
- Round size: **$150M total**
- Pre-money valuation: **$450M**
- Our allocation: **$40M for 6.67% ownership**
- Post-money: **$600M**
- Syndicate: Our firm (lead), Novo Holdings (strategic), RA Capital, Versant

**Use of Proceeds (18-month plan):**
- Phase 2b trial (400 pts, 52 weeks): $85M
  - Patient recruitment + site costs: $52M
  - Drug manufacturing (GMP): $22M
  - CRO + data management: $11M
- Phase 3 planning + regulatory: $18M
- Operations + G&A: $32M
- IP defense fund (Lilly risk mitigation): $15M

**Runway Post-Series B:**
- **21 months** (through Phase 2b 52-week readout + 3-month analysis)
- Sufficient for Series C/IPO at Phase 2b data (Q3 2026)
- Phase 3-ready if data supports registration path

**Valuation Analysis:**

*Comparable Obesity Series B Deals (2023-2024):*
- Structure Therapeutics (oral GLP-1): $690M Series C at Phase 2
- Altimmune (GLP-1/Glucagon): $105M Series B at Phase 1
- Carmot Therapeutics (acquired by Roche $2.7B at Phase 1!)
- **Median pre-money Phase 2a:** $400-500M
- ObesityRx at $450M: **FAIR MARKET** ✓

*Risk-Adjusted NPV Analysis:*

**Success Case (Phase 3 → Approval, 45% probability):**
- Peak sales: $8B (15% share of $50B oral GLP-1 market by 2032)
- Exit valuation (2029): $12-15B (1.5-2x peak sales, typical for obesity)
- Our 4.8% stake (post-Series C dilution): **$576M-$720M**
- **ROI: 14-18x** ✓✓

**Partnership Case (Phase 2b → Pharma deal, 30% probability):**
- Comparable: Carmot/Roche $2.7B at Phase 1
- Expected deal value at Phase 2b: $3.5-4.5B
- Our 5.5% stake: **$192M-$247M**
- **ROI: 4.8-6.2x** ✓

**Failure Case (Phase 2b fails, 25% probability):**
- IP + platform value: $80-120M
- Liquidation proceeds: $20-40M
- Our recovery: **$1.3-$2.7M**
- **Loss: -93% to -97%** ❌

**Expected Value Calculation:**
- Success (45%): $648M × 0.45 = $291M
- Partnership (30%): $220M × 0.30 = $66M
- Failure (25%): $2M × 0.25 = $0.5M
- **Expected value: $357.5M**
- **Investment: $40M**
- **Risk-adjusted ROI: 794%** ✓✓✓

**Market Opportunity (2024-2025):**
- Total obesity market: $100B+ by 2030
- Oral GLP-1 addressable: $50-60B (30% needle-phobic prefer oral)
- ObesityRx target share: 15-20% of oral segment
- Peak sales potential: **$8-12B**

**Competitive Timeline:**
- Wegovy/Ozempic: Already $20B+ run-rate
- Lilly orforglipron: Discontinued (nausea)
- Novo oral amycretin: Phase 2, data 2026 (head-to-head risk)
- Structure Therapeutics: Phase 2, similar timeline
- **Window: 2-3 years before oral market consolidates**

**Investment Thesis:**
✓ **Market timing:** Oral GLP-1 wave just starting, $50B+ TAM
✓ **Clinical validation:** -12.3% at 16 weeks projects to Wegovy-competitive efficacy
✓ **Tolerability advantage:** 32% nausea vs 47-58% competitors = commercial differentiation
✓ **Valuation:** $450M pre-money fair vs $2.7B Carmot (earlier stage)
✓ **Exit path:** Pharma acquisitions (Novo/Lilly/Roche active buyers)
✓ **Syndicate quality:** Novo Holdings (strategic validation)

**Key Risks:**
⚠ **Lilly IP risk** (35% probability, $15-25M litigation)
⚠ **Phase 2b efficacy risk** (may not hit -18% target)
⚠ **Novo oral amycretin** (could dominate if superior)
⚠ **Market saturation** (Wegovy already $20B+ established)
⚠ **Pricing pressure** (payers may cap reimbursement)

**Financial Recommendation:** **INVEST $40M** - Compelling risk/reward (794% expected ROI) in massive, validated market. Novo Holdings co-investment de-risks.

**Question for Market Research:** What's the realistic market penetration and competitive positioning for an oral GLP-1 entering in 2029-2030?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 9700,
      data: {
        from: 'Financial Analyst',
        to: 'Market Research Analyst',
        question: 'What\'s the realistic market penetration and competitive positioning for an oral GLP-1 entering in 2029-2030?',
      },
    },
    {
      type: 'agent_start',
      timestamp: 10200,
      data: {
        agent: 'Market Research Analyst',
        task: 'Analyzing obesity market dynamics, competitive timeline, and market share projections',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 10900,
      data: {
        agent: 'Market Research Analyst',
        progress: 'Mapping competitive landscape and patient preferences...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 12700,
      data: {
        agent: 'Market Research Analyst',
        response: `## Obesity Market Dynamics & Competitive Analysis (2025-2035)

**Total Obesity Drug Market:**

**Current State (2024-2025):**
- Total market size: $24B (2024)
- Growth rate: 35% CAGR (2024-2030)
- **Projected 2030 market: $100-130B**
- US represents 60% of global sales

**Market Drivers:**
✓ 42% US adults have obesity (BMI >30)
✓ 70%+ commercial payers now covering GLP-1s for obesity
✓ Medicare coverage expansion (2024 CMS proposal)
✓ Chronic lifetime therapy = recurring revenue
✓ DTC advertising effective ($2B+ spent by Novo/Lilly)

**Injectable GLP-1 Market Leaders (2024-2025):**

**Wegovy (Novo Nordisk - semaglutide):**
- 2024 sales: $13.5B
- Market share: 56% of GLP-1 obesity market
- Peak sales forecast: $28-32B (2028-2030)
- Advantages: First-mover, proven efficacy (-15%), strong brand
- Weaknesses: Weekly injection, supply constraints (2024), patent expiry 2032

**Zepbound (Eli Lilly - tirzepatide):**
- 2024 sales: $7.2B (launched late 2023)
- Market share: 30%
- Peak sales forecast: $22-25B (2028-2030)
- Advantages: Superior efficacy (-21%), dual mechanism (GLP-1/GIP)
- Weaknesses: Weekly injection, manufacturing scale-up, later patent (2042)

**Market Share Evolution (Injectable):**
| Year | Wegovy | Zepbound | Other |
|------|--------|----------|-------|
| 2024 | 56% | 30% | 14% |
| 2027 | 45% | 42% | 13% |
| 2030 | 38% | 48% | 14% |

**Oral GLP-1 Competitive Landscape:**

**Current Oral Options:**
1. **Rybelsus (Novo - oral semaglutide):**
   - Approved for diabetes only (no obesity indication)
   - Weight loss: -5% (modest)
   - Limitations: Fasting requirement, SNAC enhancer (GI issues)
   - Not competitive in obesity space

**Emerging Oral Competitors (2025-2030):**

2. **Novo Nordisk - Oral Amycretin (dual GLP-1/amylin):**
   - Status: Phase 2 ongoing (data expected Q2 2026)
   - Advantage: Novo brand + dual mechanism
   - Timeline: Launch 2029-2030 (head-to-head with ObesityRx)
   - **KEY COMPETITIVE THREAT**

3. **Eli Lilly - Orforglipron:**
   - Status: **DISCONTINUED Q3 2024** due to 47% nausea rate
   - Leaves Lilly without oral GLP-1 program
   - **ACQUISITION OPPORTUNITY**

4. **Structure Therapeutics - GSBR-1290:**
   - Status: Phase 2 (52-week data Q1 2026)
   - Advantage: Clean Phase 1 data, experienced team
   - Timeline: Launch 2029-2030
   - **DIRECT COMPETITOR**

5. **Pfizer - Danuglipron:**
   - Status: **DISCONTINUED 2024** due to 71% nausea rate
   - Pfizer exited oral GLP-1 space
   - **MARKET CONSOLIDATION**

**Oral GLP-1 Addressable Market:**

**Patient Segmentation:**
- **Total obesity patients (US):** 100M adults
- **Injectable-eligible:** 70M (70%)
- **Oral-preferring (needle-phobic):** 30M (30%)
- **Addressable oral market: $50-60B** at peak (2032-2035)

**Patient Preference Data (2024 surveys):**
✓ 68% patients prefer oral over injection (if efficacy equal)
✓ 42% would switch from Wegovy to oral if weight loss similar
✓ 30% refuse injectable treatment (needle phobia/stigma)
✓ Oral compliance higher: 78% vs 64% for weekly injection

**ObesityRx Competitive Positioning (2029-2030 Launch):**

**Market Entry Scenario:**
- Launch year: 2029-2030
- Competitors at launch:
  - Wegovy (injectable): Mature, losing share to Zepbound
  - Zepbound (injectable): Market leader
  - Novo oral amycretin: Launching simultaneously (major risk)
  - Structure GSBR-1290: Launching 2029-2030
  - Rybelsus: Not competitive in obesity

**ObesityRx Differentiation:**
✓ **Best-in-class tolerability** (32% nausea vs 47-58% other orals)
✓ **Projected efficacy** (-18-22% at 52 weeks, competitive with Wegovy)
✓ **Daily dosing with food** (better compliance than fasting)
✓ **Proprietary absorption enhancer** (NOT SNAC)
✓ **Price potential:** $8-10K/year vs $13-16K for injectables

**Market Share Projections:**

**Year 1 (2029-2030):**
- Total oral GLP-1 market: $12-15B
- ObesityRx penetration: 6-8% of oral segment
- Revenue: **$720M-$1.2B**
- Rationale: Tolerability messaging, early KOL adoption

**Year 3 (2032):**
- Total oral GLP-1 market: $35-40B
- ObesityRx penetration: 12-15% of oral segment
- Revenue: **$4.2-6.0B**
- Rationale: Real-world evidence, payer coverage secured

**Peak Sales (2034-2036):**
- Total oral GLP-1 market: $50-60B
- ObesityRx penetration: 15-18% of oral segment
- **Peak revenue: $7.5-10.8B**
- Rationale: Steady-state based on tolerability advantage

**Market Share Allocation (Oral Segment, 2034):**
| Product | Market Share | Peak Sales |
|---------|--------------|------------|
| Novo Amycretin | 35-40% | $17.5-24B |
| ObesityRx | 15-18% | **$7.5-11B** |
| Structure GSBR-1290 | 12-15% | $6-9B |
| Rybelsus | 8-10% | $4-6B |
| Others | 20% | $10-12B |

**Competitive Risks:**

⚠ **Novo Amycretin (HIGHEST RISK):**
- Launching same timeframe (2029-2030)
- Novo brand dominance + dual mechanism advantage
- Could capture 35-40% oral market
- **Mitigation:** ObesityRx tolerability differentiation

⚠ **Injectable Price Wars:**
- Wegovy patent expiry 2032 → biosimilars
- Price compression could cascade to orals
- **Mitigation:** Oral convenience premium defensible

⚠ **Next-Gen Therapies (2030+):**
- Monthly injectables (Novo Phase 2)
- GLP-1/GIP/Glucagon triple agonists
- Oral peptides (new delivery tech)
- **Mitigation:** 5-7 year exclusivity window before disruption

**Commercial Opportunity Assessment:**

**Scenario A: Lead Oral Position (20% probability)**
- Beat Novo amycretin on tolerability + efficacy
- Capture 25-30% oral market share
- Peak sales: $12-18B
- Acquisition value: $18-25B (1.5x peak sales)

**Scenario B: Strong #2 Position (50% probability) ← BASE CASE**
- Novo amycretin leads, but ObesityRx strong #2
- Capture 15-18% oral market share
- Peak sales: $7.5-11B
- Acquisition value: $10-15B

**Scenario C: Crowded Market (25% probability)**
- Multiple oral GLP-1s dilute share
- Capture 8-12% oral market share
- Peak sales: $4-6B
- Acquisition value: $5-8B

**Scenario D: Failure (5% probability)**
- Phase 2b data disappoints or Novo dominates
- Minimal commercial traction
- Exit: Platform sale or wind down

**Investment Implications:**

**Expected Commercial Value:**
- Scenario A (20%): $21.5B × 0.20 = $4.3B
- Scenario B (50%): $12.5B × 0.50 = $6.25B
- Scenario C (25%): $6.5B × 0.25 = $1.625B
- Scenario D (5%): $0 × 0.05 = $0
- **Expected exit value: $12.175B**

**Risk-Adjusted for Development:**
- Phase 2b success: 85%
- Phase 3 success (conditional): 70%
- Approval probability: 60%
- **Risk-adjusted value: $7.3B**

**Series B Investment Return:**
- Our stake: 6.67% → 4.8% diluted
- Expected value at exit: $7.3B × 4.8% = **$350M**
- Investment: $40M
- **Expected ROI: 775%** ✓✓✓

**Market Recommendation:**

✅ **ATTRACTIVE MARKET OPPORTUNITY**
- $50-60B oral GLP-1 TAM is real and validated
- ObesityRx differentiation (tolerability) is defensible
- Novo amycretin risk is manageable (not fatal)
- Multiple exit scenarios all profitable (except failure)
- **Expected ROI: 775%** justifies $40M investment`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 13200,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 14100,
      data: {
        step: 'Integrating clinical, IP, financial, and market analyses...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 15200,
      data: {
        step: 'Building investment decision framework...',
      },
    },
    {
      type: 'complete',
      timestamp: 17500,
      data: {
        synthesis: `# Investment Recommendation: INVEST $40M in ObesityRx Series B

## Executive Summary

**STRONGLY RECOMMEND INVESTING** $40M in ObesityRx's $150M Series B at $600M post-money valuation. Exceptional Phase 2a oral GLP-1 data (-12.3% weight loss, 32% nausea vs 47-58% competitors), massive validated market ($50B+ oral segment), fair valuation vs comps, and Novo Holdings strategic co-investment. **Expected ROI: 794%** (risk-adjusted) with multiple exit paths.

---

## Investment Scorecard

| Factor | Assessment | Score |
|--------|------------|-------|
| **Clinical Data** | -12.3% wt loss, best tolerability (32% nausea) | 10/10 ✓✓ |
| **Market Size** | $50B+ oral GLP-1 TAM | 10/10 ✓✓ |
| **Competitive Position** | Superior tolerability vs all oral competitors | 9/10 ✓ |
| **IP Protection** | Moderate risk (35% Lilly overlap) | 6/10 ⚠ |
| **Valuation** | $450M pre (fair vs $2.7B Carmot) | 8/10 ✓ |
| **Syndicate** | Novo Holdings strategic + RA Capital | 10/10 ✓✓ |
| **Exit Path** | Multiple pharma acquirers, $3.5-15B range | 9/10 ✓ |
| **Runway** | 21 months to Phase 2b data | 8/10 ✓ |

**Overall Score: 8.8/10** - Exceptional Investment

---

## Key Investment Drivers

### 1. Massive Validated Market ✓✓

**Obesity Market (2024-2025):**
- Total market: $100B+ by 2030
- Injectable GLP-1s: $50B (Wegovy/Zepbound)
- **Oral GLP-1 addressable: $50-60B** (30% needle-phobic patients)
- ObesityRx target share: 15-20% oral segment
- Peak sales potential: **$8-12B**

**Market Validation:**
✓ Wegovy: $20B+ run-rate (proven demand)
✓ Payers covering obesity drugs (70%+ commercial plans)
✓ Direct-to-consumer advertising effective ($1B+ spent by Novo/Lilly)
✓ Chronic use (lifetime therapy) = recurring revenue

### 2. Best-in-Class Clinical Profile ✓✓

**Phase 2a Data Highlights:**
- **Weight loss:** -12.3% at 16 weeks (projects to -18-20% at 52 weeks)
- **Tolerability:** 32% nausea vs 47-58% all oral competitors
- **Discontinuations:** 6% vs 12% oral semaglutide
- **Dose-dependent:** Clear signal for higher doses in Phase 2b

**Competitive Differentiation:**
✓ **Superior tolerability** = higher dosing = better weight loss
✓ **Oral convenience** vs weekly injections (30% prefer oral)
✓ **Proprietary absorption enhancer** (NOT SNAC)
✓ **Daily dosing with food** (better compliance)

**Clinical De-Risking:**
- Phase 2b starting Q1 2025 (400 patients, 52 weeks)
- Higher doses (30mg, 40mg) likely hit -18-22% weight loss
- 85% probability hit primary endpoint (based on Phase 2a)

### 3. Strategic Validation (Novo Holdings) ✓✓

**Syndicate Quality:**
- **Novo Holdings** (Novo Nordisk's investment arm) = strategic validation
- RA Capital (top biotech investor)
- Versant Ventures (early Beam, Verve)

**Novo Holdings Significance:**
✓ Signals non-competitive with oral amycretin (different mechanism/timeline)
✓ Potential acquisition path at Phase 2b/3
✓ Manufacturing/regulatory support possible
✓ **De-risks investment** (Novo knows oral GLP-1 better than anyone)

### 4. Compelling Valuation ✓

**Valuation Analysis:**
- Pre-money: $450M
- Post-money: $600M
- **Our stake: 6.67% for $40M**

**Comparable Transactions (2023-2024):**
- Structure Therapeutics: $690M Series C (Phase 2 oral GLP-1)
- Carmot Therapeutics: **$2.7B acquisition by Roche** (Phase 1 dual agonist!)
- Altimmune: $105M Series B (Phase 1 GLP-1/Glucagon)
- Median Phase 2 oral GLP-1: $400-600M pre-money

**Verdict: FAIR TO ATTRACTIVE**
- At low end of Phase 2 oral GLP-1 valuations
- 4.5x cheaper than Carmot (earlier stage!)
- Room for 10-30x upside if data replicates

**ROI Scenarios:**

| Scenario | Prob | Exit Value | Our Diluted % | Our Value | ROI |
|----------|------|------------|---------------|-----------|-----|
| Phase 3 → Approval | 45% | $12-15B | 4.8% | $576-720M | 14-18x ✓✓ |
| Phase 2b → Acquisition | 30% | $3.5-4.5B | 5.5% | $192-247M | 4.8-6.2x ✓ |
| Phase 2b Failure | 25% | $80-120M | 6.0% | $5-7M | 0.1-0.2x ❌ |
| **Expected Value** | | | | **$357.5M** | **794%** ✓✓✓ |

### 5. Multiple Exit Paths ✓

**Acquisition Targets (High Probability):**
- **Novo Nordisk:** Dominant in obesity, needs oral portfolio diversification
- **Eli Lilly:** Orforglipron discontinued, need oral replacement
- **Roche:** Acquired Carmot $2.7B, active in obesity
- **AstraZeneca:** Needs obesity franchise
- **Pfizer:** Danuglipron failed, need new oral program

**Exit Timeline:**
- Phase 2b interim (26 weeks): Q3 2026
- Phase 2b complete (52 weeks): Q1 2027
- **Exit window: Q4 2026 - Q2 2027**

**Precedent Transactions:**
- Carmot/Roche: $2.7B at Phase 1 (2024)
- Rhythm/Sumitomo: $3.0B at Phase 2 (2023)
- Prevail/Lilly: $1.0B at Phase 2 (2024)
- **Expected ObesityRx: $3.5-4.5B at Phase 2b**

---

## Risk Assessment

### Clinical Risk: MODERATE

**Phase 2b Execution Risks:**
⚠ Efficacy may not replicate (-12.3% → -18% target uncertain)
⚠ Tolerability advantage may narrow at higher doses
⚠ 52-week data may show weight regain (plateau)
✓ Strong Phase 2a signal de-risks (85% success probability)

**Competitive Risks:**
⚠ **Novo oral amycretin:** Phase 2 data 2026 (head-to-head timing risk)
⚠ Structure Therapeutics advancing parallel oral GLP-1
⚠ Wegovy price cuts could compress oral pricing
✓ Tolerability differentiation defensible

### IP Risk: MODERATE ⚠

**Lilly Overlap (35% probability):**
- Both non-peptide small molecule GLP-1R agonists
- Structural similarity possible
- Litigation: $15-25M cost + 2-year delay
- Settlement: 5-8% royalty to Lilly (worst case)

**Mitigation:**
✓ 2 backup compounds (design-around options)
✓ Absorption enhancer IP separate (strong defense)
✓ FTO counsel 65% confident no infringement

### Market Risk: LOW-MODERATE

**Market Saturation:**
⚠ Wegovy/Zepbound already $50B+ by 2027 (market mature)
⚠ Payer pushback possible (cost containment)
✓ Oral segment underpenetrated (large headroom)
✓ Lifetime therapy = recurring revenue

### Financing Risk: LOW

- $150M raise fully committed (Novo Holdings lead)
- 21-month runway to Phase 2b data
- Series C/IPO path clear at data readout
- Strategic investor (Novo) reduces financing risk

---

## Investment Structure

**Terms:**
- Investment: **$40M**
- Ownership: **6.67% post-money** (dilutes to ~4.8% at exit)
- Post-money valuation: $600M
- Board seat: Observer rights
- Pro rata rights: Full participation in Series C
- Liquidation preference: 1x non-participating

**Protective Provisions:**
✓ Approval required for M&A, asset sales
✓ Veto on down rounds > 20% dilution
✓ Information rights (quarterly financials)
✓ Right of first refusal on equity sales
✓ Anti-dilution: Weighted average

**Key Milestones & Decision Points:**

| Milestone | Timing | Action |
|-----------|--------|--------|
| Phase 2b 50% enrollment | Month 9 (Q3 2025) | Confirm on track |
| Phase 2b interim (26-week) | Month 15 (Q3 2026) | GO/NO-GO decision |
| Phase 2b complete (52-week) | Month 21 (Q1 2027) | Exit process or Series C |
| Acquisition offer | Q4 2026 - Q2 2027 | Board approval |

---

## Final Recommendation

### ✅ STRONGLY RECOMMEND: INVEST $40M

**Investment Thesis (5 Key Points):**

1. **Massive Validated Market** ($50B+ oral GLP-1 TAM)
   - Wegovy $20B+ validates obesity drug demand
   - 30% patients prefer oral (needle-phobic)
   - Chronic lifetime therapy = recurring revenue

2. **Best-in-Class Clinical Profile**
   - -12.3% weight loss (projects to -18-20% at 52 weeks)
   - 32% nausea (vs 47-58% competitors) = key differentiator
   - Tolerability enables higher dosing → superior efficacy

3. **Strategic De-Risking (Novo Holdings)**
   - Novo investment arm co-leading = validation
   - Signals non-competitive with internal programs
   - Potential acquisition path at Phase 2b

4. **Compelling Valuation**
   - $450M pre-money (fair vs $2.7B Carmot at Phase 1)
   - 794% expected ROI (risk-adjusted)
   - Multiple 10-30x upside scenarios

5. **Clear Exit Path (18-24 months)**
   - Novo, Lilly, Roche active acquirers
   - $3.5-4.5B expected deal value at Phase 2b
   - 4.8-18x ROI across scenarios

**Expected Outcomes:**

- **Base case (partnership, 30%):** 4.8-6.2x return ($192-247M)
- **Upside case (approval, 45%):** 14-18x return ($576-720M)
- **Downside case (failure, 25%):** -93% loss ($5-7M recovery)
- **Risk-adjusted expected return:** 794% (8.9x)

**Key Success Factors:**
✓ Phase 2a data substantially de-risks Phase 2b
✓ Market timing perfect (oral wave just starting)
✓ Tolera bility advantage = sustainable competitive moat
✓ Novo Holdings strategic validation
✓ Multiple exit paths (pharma M&A active)

**Investment Committee Recommendation:**

**APPROVE $40M INVESTMENT**

- Allocation: Primary fund ($35M) + Opportunity fund ($5M)
- Ownership target: 6.67% post-Series B
- Follow-on reserve: $20M for Series C pro rata
- Board representation: Observer seat minimum

**Next Steps (60-day close):**
1. Execute term sheet (Week 1)
2. Confirmatory due diligence (Weeks 2-4):
   - Independent FTO analysis (Lilly IP risk)
   - Phase 2b protocol review
   - Reference calls (investigators, KOLs)
3. Investment committee approval (Week 5)
4. Legal documentation (Weeks 6-8)
5. Wire funds + board observer appointment (Week 9)

---

**Analysis completed at $0.38 estimated cost**`,
        cost: 0.38,
      },
    },
  ],
};

/**
 * All available demo scenarios
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  DEMO_MA_DUE_DILIGENCE,
  DEMO_COMPETITIVE_ANALYSIS,
  DEMO_LICENSING_DEAL,
  DEMO_INVESTMENT_DECISION,
];

/**
 * Get demo scenario by ID
 */
export function getDemoScenario(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find(scenario => scenario.id === id);
}

/**
 * Play demo scenario with event streaming
 */
export function playDemoScenario(
  scenario: DemoScenario,
  onEvent: (event: any) => void,
  speedMultiplier: number = 1
): Promise<void> {
  return new Promise((resolve) => {
    const timeouts: NodeJS.Timeout[] = [];
    let maxDelay = 0;

    console.log('[playDemoScenario] Starting playback of', scenario.events.length, 'events');

    scenario.events.forEach(event => {
      const adjustedDelay = event.timestamp! / speedMultiplier;
      maxDelay = Math.max(maxDelay, adjustedDelay);

      const timeout = setTimeout(() => {
        console.log('[playDemoScenario] Firing event:', event.type, 'at', adjustedDelay, 'ms');
        onEvent(event);
      }, adjustedDelay);
      timeouts.push(timeout);
    });

    console.log('[playDemoScenario] Max delay:', maxDelay, 'ms');

    // Resolve after all events have fired
    setTimeout(() => {
      console.log('[playDemoScenario] All events fired, resolving');
      resolve();
    }, maxDelay + 100); // Add small buffer
  });
}
