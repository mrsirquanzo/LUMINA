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
 * All available demo scenarios
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  DEMO_MA_DUE_DILIGENCE,
  // Additional scenarios will be added in Phase 3
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
): () => void {
  const timeouts: NodeJS.Timeout[] = [];

  scenario.events.forEach(event => {
    const adjustedDelay = event.timestamp! / speedMultiplier;
    const timeout = setTimeout(() => {
      onEvent(event);
    }, adjustedDelay);
    timeouts.push(timeout);
  });

  // Return cleanup function
  return () => {
    timeouts.forEach(timeout => clearTimeout(timeout));
  };
}
