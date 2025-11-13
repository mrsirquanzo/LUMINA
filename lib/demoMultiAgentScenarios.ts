import { DemoScenario } from './multiAgentTypes';

/**
 * Demo Scenario 1: M&A Due Diligence
 */
export const DEMO_MA_DUE_DILIGENCE: DemoScenario = {
  id: 'ma-due-diligence',
  title: 'Biotech M&A Due Diligence',
  description: 'Comprehensive analysis of a gene therapy acquisition target across clinical, patent, and financial dimensions',
  query: 'Should we acquire GeneTech for $800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials.',
  documents: [
    'GeneTech_Phase2_Results.pdf (2.3 MB)',
    'GeneTech_Patent_Portfolio.pdf (1.8 MB)',
    'GeneTech_10K_2024.pdf (4.1 MB)',
  ],
  estimatedDuration: 18000, // 18 seconds
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
        task: 'Analyzing Phase 2 CAR-T trial results and safety data',
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
        response: `## Phase 2 CAR-T Trial Analysis

**Efficacy Results:**
- Primary endpoint (ORR): 35% (95% CI: 28-42%) vs 18% control
- Statistical significance: p=0.002 (highly significant)
- PFS: 8.2 months vs 5.1 months (HR=0.64, p=0.008)
- Duration of response: Median 11.3 months

**Safety Profile:**
- Grade 3+ adverse events: 42% (manageable)
- CRS (Cytokine Release Syndrome): Grade 1-2 in 68%, Grade 3 in 12%
- No Grade 4-5 CRS events
- Neurotoxicity: 15% (all Grade 1-2)

**Assessment:**
✓ Strong efficacy signal - competitive with approved CAR-T therapies
✓ Safety profile appears manageable and in line with class effects
⚠ Need to verify IP protection for IL-15 costimulation mechanism

**Question for Patent Expert:** Are there blocking patents for IL-15 costimulation in CAR-T therapies? What's the FTO status?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 4000,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'Are there blocking patents for IL-15 costimulation in CAR-T therapies? What\'s the FTO status?',
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

**GeneTech Patent Portfolio:**
- **US10,123,456**: "IL-15 Fusion Proteins for CAR-T Therapy"
  - Granted: March 2022
  - Claim 1: Broad coverage of IL-15 linked CAR-T constructs
  - Expires: 2042 (20 years from filing)
- **EP3,456,789**: European counterpart (granted 2023)
- **CN108,765,432**: Chinese patent (granted 2023)

**Patent Strength Assessment:**
✓ Strong novelty vs prior art (no similar IL-15 costim CAR-T disclosures)
✓ No patent oppositions filed
✓ Clean prosecution history

**Competitive Landscape:**
- Juno Therapeutics: Broad CAR-T claims but NOT specific to IL-15
- Kite Pharma: CD28/4-1BB costim (different mechanism)
- Novartis: IL-21 costim patents (different cytokine)

**Freedom-to-Operate:**
✓ **FTO STATUS: CLEAR** - No blocking patents identified
✓ Can commercialize without licensing
✓ Strong defensive position against competitors

**Patent Portfolio Valuation:**
- Estimated standalone value: $150-200M
- 20 years remaining exclusivity
- Covers key markets (US, EU, CN)

**Question for Financial Analyst:** Given strong IP position with clear FTO and 20-year exclusivity, is the $800M valuation justified based on their financial position and runway?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 8300,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given strong IP position with clear FTO and 20-year exclusivity, is the $800M valuation justified?',
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
- Cash & equivalents: $120M
- Quarterly cash burn: $18M
- **Estimated runway: 6.7 quarters (~18 months)**
- Revenue: $0 (pre-commercial)
- Total assets: $145M
- Long-term debt: $0

**Burn Rate Analysis:**
- Q1 2024: $16M
- Q2 2024: $17M
- Q3 2024: $18M
- Q4 2024: $21M (Phase 3 startup costs)
- **Trend:** Increasing as Phase 3 ramps up

**Capital Requirements:**
- Phase 3 trial cost estimate: $80-100M
- Regulatory/commercial prep: $30-40M
- **Total capital needed before approval: $110-140M**
- ⚠ Will need additional financing by Q2 2026

**Valuation Analysis:**

*DCF Model (12% discount rate):*
- Approval scenario (2027): 65% probability
- Peak sales estimate: $550M (2032)
- Operating margin: 75% (post-launch)
- **DCF Value: $680M**

*Comparable Company Analysis:*
- Similar Phase 2 CAR-T companies: $600-900M range
- Trading at 1.2-1.5x estimated peak sales
- GeneTech at 1.45x peak sales → **Comp Value: $750M**

*Precedent Transactions:*
- Recent CAR-T acquisitions (Phase 2): $650M-$1.1B
- Average: $825M
- Median: $750M

**Valuation Conclusion:**
- DCF: $680M
- Comps: $750M
- Precedent: $750M
- **Fair Value Range: $680-750M**

**Assessment of $800M Ask:**
⚠ **OVERVALUED by 7-15%** given:
- Need for $110-140M additional capital
- Phase 3 execution risk (~35% failure rate)
- 18-month runway creates financing pressure

**Recommended Deal Structure:**
See synthesis for recommended approach.`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 13000,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 13500,
      data: {
        step: 'Integrating clinical, patent, and financial findings...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 14500,
      data: {
        step: 'Cross-referencing risk factors and opportunities...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 15500,
      data: {
        step: 'Generating deal structure recommendations...',
      },
    },
    {
      type: 'complete',
      timestamp: 17000,
      data: {
        synthesis: `# M&A Recommendation: PROCEED WITH MODIFIED TERMS

## Executive Summary

GeneTech represents a **compelling acquisition target** with strong Phase 2 clinical data (35% ORR, p=0.002) and robust IP protection (clear FTO, 20-year exclusivity). However, the **$800M asking price is 7-15% above fair value** given capital needs and clinical risk. Recommend proceeding with milestone-based structure to align risk/reward.

---

## Integrated Analysis

### Clinical Assessment: STRONG ✓
- **Efficacy:** 35% ORR significantly better than 18% control (p=0.002)
- **PFS:** 8.2 vs 5.1 months - clinically meaningful improvement
- **Safety:** Manageable profile, consistent with CAR-T class effects
- **Competitive:** Efficacy comparable to approved therapies (Yescarta: 52%, Kymriah: 40-50%)
- **Risk:** ~35% Phase 3 failure rate for CAR-T therapies

### Patent Assessment: STRONG ✓
- **IP Protection:** 3 key patents covering IL-15 costim mechanism
- **FTO Status:** CLEAR - no blocking patents identified
- **Competitive Moat:** Strong novelty, no similar approaches patented
- **Exclusivity:** 20 years remaining (expires 2042)
- **Value:** Patent portfolio alone worth $150-200M
- **Risk:** Low (~15% likelihood of patent challenge)

### Financial Assessment: OVERVALUED ⚠
- **Fair Value:** $680-750M (DCF + Comps + Precedents)
- **Asking Price:** $800M (**7-15% premium**)
- **Capital Need:** $110-140M required before approval
- **Runway:** Only 18 months - financing pressure by Q2 2026
- **Risk:** Phase 3 capital + clinical execution risk

---

## Risk-Adjusted Valuation

| Scenario | Probability | Value | Weighted Value |
|----------|-------------|-------|----------------|
| Phase 3 Success → Approval | 65% | $1,050M | $683M |
| Phase 3 Failure | 35% | $150M* | $53M |
| **Expected Value** | | | **$736M** |

*Residual value from IP and platform technology

---

## Recommended Deal Structure

### Option A: Straight Discount ❌
- **Total:** $700M cash at close
- **Pros:** Simple, immediate ownership
- **Cons:** Seller may resist 12% discount

### Option B: Milestone-Based Structure ✅ **RECOMMENDED**

**Upfront Payment:** $500M
- Provides immediate capital for Phase 3
- Addresses 18-month runway concern
- 38% discount to ask (acceptable given capital need)

**Phase 3 Milestones:** $150M
- First patient dosed: $50M (de-risks trial start)
- 50% enrollment: $50M (demonstrates recruitment feasibility)
- Data readout: $50M (assumes positive trend)

**Regulatory Milestones:** $150M
- FDA approval: $150M (final payment upon commercial success)

**Total Potential Value:** $800M
- **Meets seller's ask price if successful**
- Aligns incentives with clinical execution
- Protects buyer from Phase 3 failure
- Addresses capital gap without additional financing round

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
- Total commitment: $500M upfront + $140M Phase 3 costs + $300M milestones = **$940M all-in**

---

## Risk Mitigation

✓ **Clinical Risk:** Milestone structure limits exposure if Phase 3 fails
✓ **Capital Risk:** Upfront $500M addresses 18-month runway
✓ **Valuation Risk:** Total $800M only paid upon success
✓ **IP Risk:** Strong FTO and 20-year exclusivity de-risk commercialization

---

## Final Recommendation

### ✅ PROCEED WITH ACQUISITION

**Proposed Terms:**
- $500M upfront
- $300M milestone payments (Phase 3 + approval)
- Total: $800M upon successful FDA approval

**Rationale:**
1. Strong clinical data de-risks Phase 3 execution
2. Clear IP position protects $500M+ peak sales potential
3. Milestone structure aligns incentives and protects downside
4. Strategic fit with existing oncology portfolio
5. Fills gap in CAR-T competitive positioning

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
  title: 'CAR-T Competitive Landscape',
  description: 'Compare Kymriah, Yescarta, and Breyanzi across clinical, IP, and commercial dimensions',
  query: 'Compare the competitive positioning of Kymriah, Yescarta, and Breyanzi. Which has the strongest patent protection and commercial potential?',
  documents: [
    'Kymriah_Clinical_Summary.pdf (1.5 MB)',
    'Yescarta_Patent_Analysis.pdf (2.1 MB)',
    'CAR-T_Market_Report_2024.pdf (3.2 MB)',
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
        task: 'Comparing efficacy and safety profiles across three CAR-T therapies',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1300,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Analyzing ORR and durability data...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 3000,
      data: {
        agent: 'Clinical Analyst',
        response: `## CAR-T Comparative Clinical Analysis

**Kymriah (Novartis - tisagenlecleucel):**
- ORR: 40-52% in DLBCL, 81-90% in ALL
- Median PFS: 2.9 months (DLBCL), NR (ALL)
- Safety: Grade 3+ CRS 13%, neurotoxicity 12%
- Target: CD19
- Costimulation: 4-1BB

**Yescarta (Gilead/Kite - axicabtagene ciloleucel):**
- ORR: 52-54% in DLBCL, 82% in MCL
- Median PFS: 5.9 months (better than Kymriah)
- Safety: Grade 3+ CRS 11%, neurotoxicity 28% (higher)
- Target: CD19
- Costimulation: CD28

**Breyanzi (BMS - lisocabtagene maraleucel):**
- ORR: 73% in DLBCL (highest)
- Median PFS: 6.8 months (best in class)
- Safety: Grade 3+ CRS 2% (lowest), neurotoxicity 10%
- Target: CD19
- Costimulation: 4-1BB (controlled ratio)

**Clinical Winner: Breyanzi** - Superior efficacy + best safety profile

Question for Patent Expert: Does Breyanzi's superior clinical profile translate to stronger IP protection?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3400,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'Does Breyanzi\'s superior clinical profile translate to stronger IP protection?',
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
        response: `## Patent Landscape Analysis

**Kymriah (Novartis):**
- Core patent: US9,855,298 (4-1BB CAR constructs)
- Expiry: 2030
- Breadth: Moderate - 4-1BB specific
- Strength: Strong foundation but narrower claims
- FTO: Some workarounds possible

**Yescarta (Gilead/Kite):**
- Core patent: US9,102,760 (CD28 CAR-T)
- Expiry: 2027 (earliest expiration!)
- Breadth: Broad CD19 claims
- Strength: First-mover advantage but vulnerable
- FTO: Clean but limited remaining exclusivity

**Breyanzi (BMS):**
- Core patent: US10,501,516 (Controlled CD4:CD8 ratio)
- Expiry: 2037 (latest!)
- Breadth: Unique claims on defined cell composition
- Strength: Novel approach, hard to design around
- FTO: Very strong position
- Additional: 12 continuations filed (2024-2037)

**Patent Winner: Breyanzi** - 10 years longer exclusivity + unique composition claims

Question for Financial Analyst: Given Breyanzi's superior clinical AND IP position, what's the market share outlook?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 7000,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given Breyanzi\'s superior clinical AND IP position, what\'s the market share outlook?',
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
        response: `## Commercial & Market Analysis

**Current Market Share (2024):**
- Kymriah: $584M (26% share)
- Yescarta: $985M (44% share) - Market leader
- Breyanzi: $672M (30% share) - Fastest growing

**Growth Trajectories:**
- Kymriah: +5% YoY (plateauing)
- Yescarta: +12% YoY (steady)
- Breyanzi: +48% YoY (rapid growth!)

**Pricing:**
- Kymriah: $475K
- Yescarta: $373K (lowest)
- Breyanzi: $410K

**Market Share Forecast (2027):**
Based on clinical superiority + IP longevity:
- Breyanzi: 45% ($1.8B) - **Future leader**
- Yescarta: 35% ($1.4B) - Declining due to 2027 patent cliff
- Kymriah: 20% ($800M) - Niche position

**Commercial Winner: Breyanzi** - Best long-term positioning`,
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
        synthesis: `# Competitive Analysis: Breyanzi Emerges as Clear Leader

## Executive Summary

**Breyanzi (BMS) has the strongest overall competitive position** combining superior clinical performance (73% ORR, lowest CRS), longest patent protection (expires 2037 vs 2027-2030), and fastest commercial growth (+48% YoY). Projected to become market leader by 2027 with 45% market share.

---

## Comparative Scorecard

| Dimension | Kymriah | Yescarta | Breyanzi |
|-----------|---------|----------|----------|
| **ORR (DLBCL)** | 40-52% | 52-54% | 73% ✓ |
| **PFS** | 2.9 mo | 5.9 mo | 6.8 mo ✓ |
| **Grade 3+ CRS** | 13% | 11% | 2% ✓ |
| **Neurotoxicity** | 12% | 28% | 10% ✓ |
| **Patent Expiry** | 2030 | 2027 | 2037 ✓ |
| **IP Strength** | Moderate | Moderate | Strong ✓ |
| **2024 Sales** | $584M | $985M ✓ | $672M |
| **Growth Rate** | +5% | +12% | +48% ✓ |
| **Market Share** | 26% | 44% | 30% |

**Overall Winner: BREYANZI** (6/9 categories)

---

## Detailed Analysis

### Clinical Performance

**Winner: Breyanzi**
- Highest ORR: 73% (vs 52% Yescarta, 40-52% Kymriah)
- Best PFS: 6.8 months
- Lowest toxicity: 2% Grade 3+ CRS (vs 11-13% competitors)
- Unique advantage: Controlled CD4:CD8 ratio improves efficacy + safety

**Key Insight:** Breyanzi's clinical superiority is driving real-world adoption and physician preference.

### Patent Protection

**Winner: Breyanzi**
- Latest expiry: 2037 (10 years longer than Yescarta!)
- Unique claims: Defined cell composition hard to design around
- Patent family: 12+ continuations providing layered protection
- FTO: Very strong - competitors must license or significantly modify

**Key Risk for Yescarta:** 2027 patent expiry creates cliff risk in 3 years

### Commercial Positioning

**Current Leader: Yescarta** ($985M, 44% share)
**Future Leader: Breyanzi** (48% growth, best trajectory)

**Market Dynamics:**
- Total CAR-T market growing 18% annually → $6B by 2028
- Breyanzi gaining share due to superior safety profile
- Yescarta faces headwinds: patent expiry 2027 + higher neurotoxicity
- Kymriah limited to specialized centers (manufacturing challenges)

---

## Strategic Implications

### For Investors:

**BUY: Breyanzi (BMS)**
- Best risk/reward profile
- 10 years patent protection
- Clinical data supports market leadership
- Currently underpriced vs future potential

**HOLD: Yescarta (Gilead)**
- Strong current position but facing patent cliff
- Need to develop next-gen to maintain share

**AVOID: Kymriah (Novartis)**
- Weakest clinical profile
- Manufacturing challenges limit scale
- Losing share steadily

### For Strategic Acquirers:

**Target: Breyanzi-related assets**
- Next-gen controlled ratio technologies
- Earlier-line expansion opportunities
- Global manufacturing capabilities

### For Competitors:

**Design Around Required:**
- Cannot use simple CD4:CD8 ratio approach (Breyanzi patent)
- Must differentiate on target (beyond CD19) or costim domain
- Consider autologous manufacturing innovations

---

## Key Takeaways

1. **Clinical excellence matters** - Breyanzi's superior safety driving adoption
2. **Patent longevity critical** - 2037 vs 2027 expiry = massive competitive moat
3. **First-mover ≠ long-term winner** - Yescarta losing ground despite early lead
4. **Market consolidation ahead** - Expect Breyanzi 45%+ share by 2027

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
  title: 'mRNA Platform Licensing',
  description: 'Evaluate BioX\'s mRNA delivery platform for $50M upfront + royalties',
  query: 'Should we license BioX\'s mRNA delivery platform for $50M upfront + royalties? Analyze the technology, IP strength, and financial terms.',
  documents: [
    'BioX_Technology_Overview.pdf (1.2 MB)',
    'mRNA_Patent_Landscape.pdf (2.8 MB)',
    'Licensing_Term_Sheet.pdf (0.5 MB)',
  ],
  estimatedDuration: 15500,
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Technology evaluation: Clinical Validation → IP Assessment → Deal Economics → Decision',
        mode: 'thorough',
        estimatedCost: '$0.35',
      },
    },
    {
      type: 'agent_start',
      timestamp: 650,
      data: {
        agent: 'Clinical Analyst',
        task: 'Evaluating mRNA delivery technology and clinical validation',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1200,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Reviewing delivery mechanism and preclinical data...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 2800,
      data: {
        agent: 'Clinical Analyst',
        response: `## mRNA Platform Technology Assessment

**Delivery Mechanism:**
- Ionizable lipid nanoparticle (LNP) formulation
- pH-responsive cationic lipids for endosomal escape
- PEGylated lipids for stability + prolonged circulation

**Technical Advantages:**
- 3-5x higher transfection efficiency vs standard LNPs
- Reduced immunogenicity (70% less IL-6 in mouse models)
- Organ targeting capability (liver, lung, tumor)

**Preclinical Validation:**
✓ Mouse models: 85% protein expression in target cells
✓ NHP studies: Good safety profile, no inflammatory response
✓ Proof-of-concept in 3 therapeutic areas

**Clinical Readiness:**
⚠ No human data yet - Phase 1 starting Q3 2025
⚠ Manufacturing scale-up ongoing (only 1kg batches to date)

**Assessment:** Promising technology but early-stage. Need IP analysis to determine exclusivity.`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3200,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'What\'s the IP coverage on this delivery platform? Are we protected from competitors?',
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
        response: `## IP & Patent Analysis

**BioX Patent Portfolio:**
- **US11,234,567**: "pH-Responsive Ionizable Lipids for mRNA Delivery"
  - Filed: 2021, Granted: 2023
  - Claim 1: Broad coverage of pH-responsive delivery
  - Expires: 2041
- **WO2022/123456**: PCT application (24 countries pending)
- 6 additional continuations filed 2023-2024

**Patent Strength:**
✓ Novel chemical structure - good novelty
✓ Clean prosecution - no rejections
⚠ Moderna has broader LNP patent (US9,872,905) that may overlap
⚠ BioNTech/Pfizer have extensive LNP patent estate

**Freedom-to-Operate:**
⚠ **POTENTIAL OVERLAP** with Moderna's ionizable lipid claims
⚠ May need sublicense from Moderna (~$20-30M)
⚠ BioNTech patents cover similar pH-responsive mechanisms

**IP Risk Assessment:**
- Medium-High risk of infringement claim
- 40-50% probability need Moderna sublicense
- Legal costs: $5-10M for FTO clearance

**Question for Financial:** Given potential $20-30M sublicense need, is the $50M upfront still reasonable?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 6700,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'Given potential $20-30M sublicense need, is the $50M upfront still reasonable?',
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
        response: `## Deal Economics Analysis

**Proposed Terms:**
- Upfront: $50M
- Milestone payments: $120M (dev + regulatory)
- Royalties: 5% net sales
- Field: Oncology (exclusive)
- Territory: Worldwide

**Cost-Benefit Analysis:**

*Total Investment:*
- Upfront: $50M
- Potential Moderna sublicense: $25M (midpoint)
- Development costs: $200M (Phase 1-3)
- **Total at-risk: $275M**

*Revenue Potential:*
- Peak sales estimate: $800M (2032)
- 5% royalty = $40M/year at peak
- NPV of royalties (10% discount): $280M
- **ROI: Marginal** (~2% return)

**Alternative Scenarios:**

*Scenario A: No Moderna sublicense needed*
- Total investment: $250M
- NPV royalties: $280M
- **ROI: 12%** ✓

*Scenario B: Moderna sublicense + lower peak sales*
- Total investment: $275M
- Peak sales: $600M → Royalties $30M
- NPV: $210M
- **ROI: -24%** ❌ (Loss)

**Deal Assessment:**
⚠ **UNFAVORABLE RISK/REWARD** given IP uncertainty
⚠ $50M upfront too high for early-stage technology
⚠ 5% royalty insufficient to justify development costs

**Recommendation:** See synthesis for renegotiation strategy.`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 10300,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 11300,
      data: {
        step: 'Integrating technology, IP, and financial assessments...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 12300,
      data: {
        step: 'Generating deal structure alternatives...',
      },
    },
    {
      type: 'complete',
      timestamp: 14500,
      data: {
        synthesis: `# Licensing Recommendation: PASS or RENEGOTIATE

## Executive Summary

BioX's mRNA delivery platform shows **technical promise** but the current deal terms are **financially unfavorable** given significant IP risk (40-50% chance of $20-30M Moderna sublicense) and early development stage. **Recommend PASSING** on current terms or **RENEGOTIATING** with reduced upfront and increased royalties.

---

## Integrated Risk Assessment

### Technology Risk: MEDIUM

**Strengths:**
✓ 3-5x higher transfection efficiency
✓ Reduced immunogenicity validated in NHP
✓ Organ targeting capability

**Weaknesses:**
⚠ No human clinical data yet
⚠ Manufacturing only at 1kg scale
⚠ Phase 1 not starting until Q3 2025

### IP Risk: HIGH ⚠

**Critical Issues:**
- Overlap with Moderna's ionizable lipid patents
- 40-50% probability requires $20-30M sublicense
- BioNTech also has pH-responsive LNP patents
- FTO clearance costs: $5-10M

**IP Position:**
- Only 1 granted US patent (2041 expiry)
- PCT pending (not yet granted globally)
- Narrow claims vs broad competitor patents

### Financial Risk: HIGH ⚠

**Deal Structure Problems:**
- $50M upfront too high for Phase 0 technology
- $275M total at-risk (incl. sublicense + development)
- 5% royalty generates only $280M NPV
- **Marginal ROI: 2%** (unacceptable for risk)

**Comparable Deals:**
- mRNA platform licenses (no human data): $10-25M upfront
- BioX asking 2-5x market rate

---

## Risk-Adjusted Valuation

| Scenario | Probability | Outcome | Value |
|----------|-------------|---------|-------|
| Success + No sublicense | 30% | $280M NPV | $84M |
| Success + Sublicense | 20% | $210M NPV | $42M |
| Clinical failure | 50% | -$50M | -$25M |
| **Expected Value** | | | **$101M** |

**Current ask: $50M**
**Expected value: $101M**
**Risk-adjusted fair value: $70-80M total deal (not $170M)**

---

## Recommended Approach

### Option 1: PASS ✓ **PREFERRED**

**Rationale:**
- Too early-stage for $50M commitment
- IP uncertainty creates hidden costs
- Better opportunities exist in market
- Wait for Phase 1 data (18 months)

**Alternative Strategy:**
- Monitor BioX's Phase 1 results
- Revisit if data strong + IP cleared
- Entry point likely better post-clinical data

### Option 2: RENEGOTIATE

**Counter-Proposal:**

**Upfront: $15M** (70% reduction)
- More appropriate for pre-clinical technology
- Reduces at-risk capital

**Milestones: $80M**
- Phase 1 complete: $20M
- Phase 2 complete: $30M
- FDA approval: $30M

**Royalties: 8% net sales** (vs 5%)
- Increases upside participation
- Aligns with higher development risk

**IP Indemnification:**
- BioX covers Moderna sublicense costs
- Or reduce upfront by $25M if sublicense required

**Total Potential: $95M + 8% royalties**
- Better risk/reward balance
- Protects against IP surprise costs

---

## Deal Breakers

**Must-Haves for Any Deal:**
1. ✓ Phase 1 human data (safety + efficacy signal)
2. ✓ FTO opinion from independent counsel
3. ✓ Manufacturing scale-up to 100kg batches
4. ✓ IP indemnification for Moderna sublicense
5. ✓ Right of first refusal on adjacent fields

**If BioX Refuses:**
→ Walk away. Deal economics don't support current risk.

---

## Final Recommendation

### ❌ PASS ON CURRENT TERMS

**Reasons:**
1. $50M upfront = 5x market rate for pre-clinical tech
2. IP risk adds hidden $20-30M cost (not in term sheet)
3. ROI only 2% in best case - below hurdle rate
4. 50% clinical failure risk too high at this valuation

**Next Steps:**
1. Decline current offer
2. Monitor BioX Phase 1 progress
3. Revisit in 18-24 months with clinical data
4. If urgent strategic need, counter at $15M upfront + 8% royalties

**Alternative Strategy:**
- License competing platform from Translate Bio (Sanofi) or Arcturus
- Both have human clinical data + clearer IP
- Similar pricing, lower risk

---

**Analysis completed at $0.35 estimated cost**`,
        cost: 0.35,
      },
    },
  ],
};

/**
 * Demo Scenario 4: Series B Investment Decision
 */
export const DEMO_INVESTMENT_DECISION: DemoScenario = {
  id: 'investment-decision',
  title: 'Series B Due Diligence',
  description: 'Should we invest $25M in NeuroCure\'s Series B? Evaluate Phase 1 data, IP, and burn rate.',
  query: 'Should we invest $25M in NeuroCure\'s Series B? Evaluate their Alzheimer\'s Phase 1 data, patent portfolio, and burn rate.',
  documents: [
    'NeuroCure_Phase1_Data.pdf (1.9 MB)',
    'NeuroCure_IP_Portfolio.pdf (1.4 MB)',
    'NeuroCure_Financial_Model.xlsx (0.3 MB)',
  ],
  estimatedDuration: 15000,
  events: [
    {
      type: 'plan_created',
      timestamp: 0,
      data: {
        plan: 'Investment evaluation: Phase 1 Analysis → IP Review → Financial Model → Investment Decision',
        mode: 'thorough',
        estimatedCost: '$0.32',
      },
    },
    {
      type: 'agent_start',
      timestamp: 600,
      data: {
        agent: 'Clinical Analyst',
        task: 'Analyzing Phase 1 Alzheimer\'s data and development risk',
      },
    },
    {
      type: 'agent_thinking',
      timestamp: 1100,
      data: {
        agent: 'Clinical Analyst',
        progress: 'Reviewing safety and biomarker data...',
      },
    },
    {
      type: 'agent_response',
      timestamp: 2600,
      data: {
        agent: 'Clinical Analyst',
        response: `## Phase 1 Alzheimer's Drug Analysis

**Trial Design:**
- N=48 mild-moderate Alzheimer's patients
- Dose escalation: 10mg, 25mg, 50mg monthly
- 6-month treatment duration
- Primary: Safety
- Secondary: ADAS-Cog, plasma biomarkers

**Safety Results:**
✓ No serious adverse events
✓ No dose-limiting toxicities
✓ Discontinuation rate: 4% (very low)
✓ Well-tolerated across all doses

**Efficacy Signals (exploratory):**
- ADAS-Cog: -2.1 points at 50mg (vs +1.8 placebo) - Promising!
- Plasma p-tau217: -42% reduction (strong biomarker signal)
- Plasma Aβ42/40: Improved ratio (+18%)

**Competitive Context:**
- Lecanemab (approved): -1.4 ADAS-Cog at 6 months
- NeuroCure showing BETTER signal at same timepoint

**Development Risk:**
- Phase 2 success probability: 40% (Alzheimer's)
- Differentiation: Oral drug vs IV infusion (lecanemab)
- Timeline: Phase 2 complete by 2027

**Question:** Given strong biomarkers, what's the IP protection strategy?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 3000,
      data: {
        from: 'Clinical Analyst',
        to: 'Patent Expert',
        question: 'What\'s the IP protection strategy for this oral Alzheimer\'s drug?',
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
        response: `## IP Portfolio Assessment

**Core Patents:**
- **US11,456,789**: "Small Molecule Tau Aggregation Inhibitors"
  - Filed: 2020, Granted: 2023
  - Composition claims: 15 compounds including lead
  - Method claims: Treatment of tauopathies
  - Expires: 2040

**Additional IP:**
- Formulation patent (oral delivery): Expires 2038
- Biomarker use patent (p-tau217): Expires 2039
- 4 provisional applications filed in 2024

**Patent Strength:**
✓ Broad composition coverage (15 compounds)
✓ Strong novelty - no prior tau inhibitors with this mechanism
✓ Clean prosecution - granted on first action
✓ Global protection: US, EU, JP, CN

**Competitive Landscape:**
- Biogen/Eisai: Anti-amyloid antibodies (different MOA)
- Eli Lilly: Anti-tau antibody (IV, not oral)
- No direct small molecule oral tau inhibitors

**Freedom-to-Operate:**
✓ **CLEAR FTO** - no blocking patents
✓ First oral tau inhibitor with clinical data
✓ Strong defensive position

**IP Valuation:**
- 17 years remaining exclusivity
- First-in-class oral mechanism
- Estimated value: $200-300M if Phase 2 successful

**Question:** What's the financial runway and valuation in this Series B?`,
      },
    },
    {
      type: 'agent_question',
      timestamp: 6200,
      data: {
        from: 'Patent Expert',
        to: 'Financial Analyst',
        question: 'What\'s the financial runway and valuation in this Series B?',
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
        response: `## Financial Analysis & Investment Terms

**Current Financial Position:**
- Cash: $18M (as of Q1 2025)
- Monthly burn: $2.5M
- **Runway: 7 months** (urgent!)
- Headcount: 32 employees

**Series B Terms:**
- Round size: $45M total
- Pre-money valuation: $120M
- Our allocation: $25M for 14.2% ownership
- Post-money: $165M
- Lead: Our firm (+ 2 co-investors)

**Use of Proceeds:**
- Phase 2 trial: $28M (70% enrolled by end of raise)
- Operations: $12M (18 months runway)
- Manufacturing scale-up: $5M

**Runway Post-Series B:**
- 18 months (through Phase 2 interim data)
- Sufficient for Series C fundraise at Phase 2 readout

**Valuation Analysis:**

*Comparable Series B Deals (CNS Phase 1):*
- Avg pre-money: $100-140M
- Avg post-money: $150-180M
- NeuroCure at $165M = market rate ✓

*Risk-Adjusted Valuation:*
- Phase 2 success (40%): $800M value
- Phase 2 failure (60%): $20M (IP value)
- Expected value: $320M + $12M = $332M
- Current ask: $165M
- **Upside/downside: 2.0x** (acceptable)

**Deal Assessment:**
✓ Fair valuation vs comparables
✓ Sufficient runway to Phase 2 data
✓ Strong syndicate (tier 1 investors)
⚠ High burn rate ($2.5M/month)
✓ Clear path to exit (Phase 2 data → acquisition)

**Ownership Trajectory:**
- Current: 14.2% (post-Series B)
- Estimated Series C: 10.5% (dilution)
- At exit: 9-10% fully diluted

**Financial Recommendation:** See synthesis for final decision.`,
      },
    },
    {
      type: 'synthesis_start',
      timestamp: 9700,
      data: {},
    },
    {
      type: 'synthesis_progress',
      timestamp: 10600,
      data: {
        step: 'Integrating clinical, IP, and financial risk assessment...',
      },
    },
    {
      type: 'synthesis_progress',
      timestamp: 11500,
      data: {
        step: 'Building investment decision framework...',
      },
    },
    {
      type: 'complete',
      timestamp: 14000,
      data: {
        synthesis: `# Investment Recommendation: INVEST $25M in Series B

## Executive Summary

**RECOMMEND INVESTING** $25M in NeuroCure's Series B at $165M post-money valuation. Strong Phase 1 data (superior to approved drugs), clear IP position (17 years exclusivity), and fair valuation (14.2% ownership) justify investment despite typical Alzheimer's development risk.

---

## Investment Scorecard

| Factor | Assessment | Score |
|--------|------------|-------|
| **Clinical Data** | Superior to lecanemab at same timepoint | 9/10 ✓ |
| **IP Protection** | Clear FTO, 17 years exclusivity | 9/10 ✓ |
| **Valuation** | $165M post (market rate) | 8/10 ✓ |
| **Runway** | 18 months to Phase 2 data | 7/10 ✓ |
| **Team** | Strong CNS expertise | 8/10 ✓ |
| **Syndicate** | Tier 1 co-investors | 9/10 ✓ |
| **Exit Path** | Clear acquisition targets | 8/10 ✓ |

**Overall Score: 8.3/10** - Strong Investment

---

## Key Investment Drivers

### 1. Clinical Differentiation ✓

**Superior Phase 1 Data:**
- ADAS-Cog: -2.1 vs lecanemab -1.4 (at 6 months)
- Biomarkers: -42% p-tau217 reduction
- Safety: No serious AEs, 4% discontinuation

**Competitive Advantage:**
- **Oral drug** vs IV infusion (huge compliance advantage)
- First small molecule tau inhibitor in clinic
- Differentiated mechanism vs approved anti-amyloid drugs

**Market Opportunity:**
- Alzheimer's market: $6B (2024) → $14B (2030)
- Oral drugs command premium pricing + better adoption
- Peak sales potential: $2-3B if approved

### 2. Strong IP Position ✓

**Patent Protection:**
- Core patent expires 2040 (17 years!)
- Composition + method + formulation claims
- Clear FTO - no blocking patents
- Global coverage (US, EU, JP, CN)

**Competitive Moat:**
- First-in-class oral tau inhibitor
- No competitors with similar mechanism
- Strong defensive position

### 3. Fair Valuation ✓

**Valuation Analysis:**
- Pre-money: $120M
- Post-money: $165M
- Comparable CNS Series B deals: $150-180M
- **Verdict: Market rate** (not overpriced)

**Ownership Economics:**
- $25M for 14.2% post-money
- Risk-adjusted value: $332M
- **Upside: 2.0x** at $332M / $165M current
- Estimated exit value (if Phase 2 success): $800M-1.2B

**ROI Scenarios:**

| Scenario | Prob | Exit Value | Our Value | Return |
|----------|------|------------|-----------|--------|
| Phase 2 success → Acquisition | 40% | $900M | $90M | 3.6x |
| Phase 2 fail → wind down | 60% | $20M | $2M | 0.1x |
| **Expected Return** | | | **$37M** | **1.5x** |

### 4. Clear Path to Exit ✓

**Acquisition Targets:**
- Biogen (Alzheimer's franchise)
- Eli Lilly (needs oral complement to donanemab)
- Eisai (lecanemab partner)
- Big Pharma (Pfizer, Merck, Roche)

**Timing:**
- Phase 2 interim: Month 12 (Q1 2027)
- Phase 2 complete: Month 18 (Q3 2027)
- Exit window: Q1-Q3 2027

**Precedent Transactions:**
- Prothena (Phase 2 Alzheimer's): Acquired for $1.1B (2023)
- AC Immune (Phase 2): $500M upfront (2024)
- **Comparable: $800M-1.2B range**

---

## Risk Assessment

### Development Risk: MEDIUM-HIGH

**Alzheimer's Historical Success Rates:**
- Phase 1 → Phase 2: 40%
- Phase 2 → Phase 3: 35%
- Phase 3 → Approval: 60%
- **Overall: 8.4%** (very low!)

**Mitigating Factors:**
✓ Strong Phase 1 biomarker data (predictive)
✓ Differentiated mechanism (tau vs amyloid)
✓ Better safety profile than antibodies
⚠ Still high risk category

### Financing Risk: LOW

- $45M raise fully committed
- 18-month runway to Phase 2 data
- Tier 1 syndicate with deep pockets
- Clear path to Series C at data readout

### IP Risk: LOW

- Clear FTO opinion
- Strong patent prosecution
- No oppositions or challenges
- 17 years remaining exclusivity

### Market Risk: LOW

- Large unmet need ($14B market)
- Oral drugs highly preferred
- Limited competition in tau space
- Strong commercial precedent

---

## Investment Structure

**Terms:**
- Investment: $25M
- Ownership: 14.2% post-money
- Board seat: Yes (observer rights minimum)
- Pro rata rights: Yes (follow-on in Series C)
- Liquidation preference: 1x non-participating

**Protective Provisions:**
✓ Approval required for asset sales
✓ Veto on down rounds
✓ Information rights
✓ Right of first refusal

**Key Milestones:**
- Month 6: 25% Phase 2 enrollment (trigger Series C planning)
- Month 12: Interim data readout (decision point)
- Month 18: Full Phase 2 data → Exit process

---

## Final Recommendation

### ✅ INVEST $25M

**Rationale:**
1. **Superior clinical data** - best-in-class Phase 1 results
2. **Clear IP protection** - 17 years exclusivity, no FTO issues
3. **Fair valuation** - $165M post-money = market rate
4. **Strong syndicate** - tier 1 co-investors de-risk
5. **Clear exit path** - Multiple acquisition targets at Phase 2 data

**Expected Outcome:**
- Base case: 1.5x return ($37M value)
- Success case: 3.6x return ($90M value)
- Risk-adjusted: **Attractive vs portfolio hurdle**

**Next Steps:**
1. Execute term sheet (1 week)
2. Confirmatory due diligence (30 days)
3. Close round (45-60 days)
4. Appoint board observer
5. Establish milestone tracking

**Investment Committee Vote: APPROVE**

---

**Analysis completed at $0.32 estimated cost**`,
        cost: 0.32,
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
