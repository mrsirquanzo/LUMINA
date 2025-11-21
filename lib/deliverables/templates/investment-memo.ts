/**
 * Investment Memo Template - Institutional Grade
 *
 * This template defines the structure for generating professional investment memos
 * that meet the standards of top-tier firms (McKinsey, BCG, Goldman Sachs, etc.)
 */

import { DeliverableTemplate } from '../types';

export const INVESTMENT_MEMO_PROMPT = `You are an expert investment analyst at a top-tier PE/VC firm tasked with transforming multi-agent analysis output into institutional-grade investment memos suitable for IC presentation.

## CRITICAL UNDERSTANDING

INPUT: You will receive RAW TEXT OUTPUT from a multi-agent analysis system containing:
- Original user question/investment thesis
- Analysis from specialized agents (Clinical, Patent, Market, Financial, Regulatory)
- Synthesized investment analysis
- May be structured markdown, JSON, or free-form text

OUTPUT: Generate professional investment memorandum with quiet luxury design aesthetic

## PARSING REQUIREMENTS

Extract from multi-agent outputs:
- **Clinical Agent**: Efficacy data, safety profile, trial results, competitive clinical data
- **Patent Agent**: Patent expiry dates, IP strength, FTO analysis, exclusivity timeline
- **Market Agent**: Market size (TAM/SAM/SOM), growth rates, competitive positioning, market share
- **Financial Agent**: Revenue projections, peak sales, margin analysis, return scenarios (IRR/MOIC)
- **Regulatory Agent**: Approval status, timeline, regulatory pathway, risks

## OUTPUT REQUIREMENTS

- **Institutional Quality**: Sequoia/Blackstone presentation standards
- **Objective Tone**: Analysis-driven, not promotional. Never use "STRONG BUY", "HIGH CONVICTION", "guaranteed"
- **Data-Driven**: Specific metrics with appropriate hedging ("projected", "estimated", "expected")
- **Comprehensive**: 40-50 pages main body + appendices
- **Executive Summary**: EXACTLY 2 pages
- **Professional Language**: "Recommend approval" not "STRONG BUY", "leading" not "best-in-class"

## WRITING STYLE & TONE

- **Institutional Language**: Use "Analysis supports...", "Data indicates...", "Projected to..."
- **Appropriate Hedging**: Every projection includes "projected", "estimated", "expected", "subject to"
- **Balanced Analysis**: Acknowledge uncertainties and risks prominently
- **No Promotional Language**: Remove/replace "exceptional" (overused), "superior" (overused), "guaranteed"
- **Vary Descriptors**: "strong", "notable", "significant", "differentiated", "competitive", "leading"

## CRITICAL DATA HANDLING

- **NEVER INVENT DATA**: If data is missing, explicitly note as "pending" or "TBD"
- **Management Assessment**: If no management data provided, use "PENDING DILIGENCE" language
- **Comparative Analysis**: Create comparison matrices for multiple assets
- **Patent Cliff**: Highlight patent expiry dates prominently in timeline analysis`;

export const investmentMemoTemplate: DeliverableTemplate = {
  id: 'investment-memo',
  title: 'Investment Memo - Institutional Grade PE/VC',
  description: 'Comprehensive investment analysis transformed from multi-agent output - 40-50 pages',
  sections: [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate EXACTLY 2-PAGE Executive Summary synthesizing ALL agent outputs:

**PAGE 1 STRUCTURE:**

Create **Investment Overview Table**:
| Field | Details |
| Company | [Extract from input] |
| Sector/Industry | [Market agent] |
| Proposed Investment | [Financial agent or TBD] |
| Target Ownership | [Calculate from investment/valuation] |
| Current Valuation | [Financial agent] |
| Entry Multiple | [Calculate from revenue projections] |
| Investment Horizon | [Extract or default 5-7 years] |

**Investment Thesis** (4-5 bullets synthesized from agents):
- [Patent/IP advantage - from patent agent]
- [Commercial opportunity - from market analyst]
- [Clinical differentiation - from clinical agent]
- [Technology/product advantage]
- [Market timing - from market/regulatory agents]

If comparing multiple assets, create **Key Metrics Snapshot Table**:
| Metric | Asset 1 | Asset 2 | Asset 3 |
| Revenue (2025E) | [Extract] | [Extract] | [Extract] |
| Peak Sales | [Extract] | [Extract] | [Extract] |
| Patent Expiry | [Patent agent] | [Patent agent] | [Patent agent] |
| FDA Approvals | [Regulatory] | [Regulatory] | [Regulatory] |
| Growth Rate | [Calculate] | [Calculate] | [Calculate] |

**PAGE 2 STRUCTURE:**

**Expected Returns** - Create table from financial agent:
| Scenario | Probability | IRR | MOIC | Key Assumptions |
| Base Case | [Extract] | [Extract] | [Extract] | [From financial agent] |
| Upside | [Extract] | [Extract] | [Extract] | [From financial agent] |
| Downside | [Extract] | [Extract] | [Extract] | [From financial agent] |

[1 paragraph explaining return scenarios]

**Key Risks** (Top 5 from ALL agents):
- [Risk 1 - highest impact]
- [Risk 2 - patent cliff if applicable]
- [Risk 3 - clinical/safety if applicable]
- [Risk 4 - market competition]
- [Risk 5 - regulatory]

**Recommendation** (institutional language):
Recommend approval for [investment action] of $[X]-[Y] in [company], subject to:
1. [Condition 1 - often management assessment]
2. [Condition 2 - from patent/clinical if issues]
3. [Condition 3 - standard governance/terms]

Timeline: [Extract or "Complete diligence within 60 days, target closing Q2 2025"]

CRITICAL: Must be EXACTLY 2 pages. Use institutional language only.`,
      required: true,
      wordCount: { min: 1000, max: 1400 }
    },
    {
      id: 'investment-highlights',
      title: 'Investment Highlights',
      sourceAgent: 'synthesis',
      extractionPrompt: `Synthesize 6-8 compelling Investment Highlights (1 page) from ALL agent outputs:

- [PRIMARY COMPETITIVE ADVANTAGE - from strongest agent finding]
  [2-3 line description with specific metrics/data]

- [PATENT/IP PROTECTION - from patent agent if strong]
  [2-3 line description: expiry dates, scope, FTO status]

- [COMMERCIAL OPPORTUNITY - from market analyst]
  [2-3 line description with TAM/SAM/SOM and market share potential]

- [CLINICAL/PRODUCT DIFFERENTIATION - from clinical agent]
  [2-3 line description with efficacy metrics vs. competitors]

- [TECHNOLOGY PLATFORM - if applicable from clinical/market]
  [2-3 line description of proprietary technology/scalability]

- [MARKET TIMING ADVANTAGE - from market/regulatory agents]
  [2-3 line description: why now is optimal entry point]

- [FINANCIAL PERFORMANCE - from financial agent]
  [2-3 line description: growth rates, margins, unit economics]

- [MANAGEMENT TRACK RECORD - if data available]
  [2-3 line description: previous exits, domain expertise]

Use institutional language. Be specific with numbers and dates.`,
      required: true,
      wordCount: { min: 600, max: 1000 }
    },
    {
      id: 'investment-structure',
      title: 'Investment Structure & Terms',
      sourceAgent: 'financial',
      extractionPrompt: `Detail Investment Structure & Terms (2-3 pages):

**Proposed Investment Structure Table**:
| Component | Details |
| Security Type | [Extract or "Common equity"] |
| Investment Size | [Extract from financial agent] |
| Target Ownership | [Calculate %] |
| Current Market Cap | [Extract] |
| Valuation Multiple | [Calculate from revenue] |
| Board Rights | [Standard or extract] |
| Liquidity | [Assess based on stage] |

**Key Terms & Conditions**:
- Information Rights: [Standard quarterly updates or extract]
- Co-investment Opportunities: [Customize for asset type]
- Board Representation: [Based on investment size]
- Governance Provisions: [Standard minority protections]
- Registration Rights: [Demand and piggyback]
- Anti-dilution: [Weighted average standard]

**Use of Proceeds** (if data available from financial agent):
- R&D Investment (50-60%): [Specific programs]
- Commercial Expansion (25-30%): [Manufacturing, market access]
- Strategic M&A (10-15%): [Complementary assets]

If not provided, note as "Subject to final term sheet negotiation - standard structure proposed."`,
      required: true,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'financial-analysis',
      title: 'Financial Analysis & Returns',
      sourceAgent: 'financial',
      extractionPrompt: `Generate comprehensive Financial Analysis (4-5 pages) from FINANCIAL AGENT output:

**Page 1: Executive Financial Summary**

**Financial Summary Table**:
| Metric | 2024E | 2025E | 2028E | Peak |
| Revenue | [Extract] | [Extract] | [Extract] | [Extract] |
| Growth Rate | [Calculate] | [Calculate] | [Calculate] | - |
| Gross Margin | [Extract] | [Extract] | [Extract] | [Extract] |
| EBITDA Margin | [Extract] | [Extract] | [Extract] | [Extract] |

**Pages 2-3: Revenue Projections & Assumptions**

Revenue Build-Up:
[Extract revenue projections from financial agent]
[Create revenue bridge if data available: Current → Growth drivers → Peak]

Key Assumptions:
- [Assumption 1 from financial agent - market penetration rate]
- [Assumption 2 - pricing strategy]
- [Assumption 3 - competitive displacement]
- [Assumption 4 - geographic expansion]

**Pages 4-5: Return Analysis & Sensitivity**

Base Case Returns:
- Entry valuation: [X]x 2025E sales
- Exit valuation: [X]x peak sales
- Holding period: [X] years
- Expected IRR: [X]% / MOIC: [X]x

**Sensitivity Analysis Table** (if data available):
| Variable | -20% | -10% | Base | +10% | +20% |
| Peak Sales | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] |
| Exit Multiple | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] |
| Timeline | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] | [IRR/MOIC] |

If financial projections incomplete, note: "Financial model pending full management review - preliminary estimates shown."`,
      required: true,
      wordCount: { min: 1500, max: 2500 }
    },
    {
      id: 'market-competitive',
      title: 'Market & Competitive Position',
      sourceAgent: 'market',
      extractionPrompt: `Synthesize Market & Competitive Analysis (5-6 pages) from MARKET ANALYST and CLINICAL AGENT:

**Market Overview**:
Total Addressable Market (TAM): $[X]B [Extract from market analyst]
Serviceable Addressable Market (SAM): $[X]B
Serviceable Obtainable Market (SOM): $[X]B
Market Growth Rate: [X]% CAGR [2024-2030]

[Describe market dynamics, growth drivers, regulatory tailwinds]

**Competitive Landscape**:

[If COMPARATIVE analysis of multiple assets, create:]
**Competitive Positioning Matrix**:
| Parameter | Asset 1 | Asset 2 | Asset 3 | [Company] |
| Efficacy | [Clinical agent data] | [Data] | [Data] | [Data] |
| Safety Profile | [Clinical agent data] | [Data] | [Data] | [Data] |
| Patent Expiry | [Patent agent data] | [Data] | [Data] | [Data] |
| Market Share | [Market agent data] | [Data] | [Data] | [Data] |
| Price Point | [Market agent data] | [Data] | [Data] | [Data] |

[If SINGLE asset, create competitor overview:]
Key Competitors:
- [Competitor 1]: [Market share, strengths, weaknesses from market agent]
- [Competitor 2]: [Description with metrics]
- [Competitor 3]: [Description with metrics]

**Competitive Advantages** (synthesize from clinical + market + patent agents):
- [Advantage 1 with supporting data - e.g., superior efficacy from clinical]
- [Advantage 2 - e.g., patent protection through 2035 from patent agent]
- [Advantage 3 - e.g., cost advantage from market agent]

**Market Share Analysis**:
[Extract projected market share trajectory from market analyst]
Current: [X]% → 2025: [X]% → 2030: [X]%

**Barriers to Entry**:
- [Patent barriers - from patent agent]
- [Technical/manufacturing barriers - from clinical]
- [Regulatory barriers - from regulatory agent]
- [Market barriers - from market agent]`,
      required: true,
      wordCount: { min: 2000, max: 3000 }
    },
    {
      id: 'management-assessment',
      title: 'Management Assessment',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate Management Assessment (3-4 pages):

**CRITICAL**: Check if management information exists in agent responses.

**IF MANAGEMENT DATA EXISTS:**
Structure with these subsections:
- **Leadership Team**: CEO, CFO, CMO, key executives - backgrounds, track record, domain expertise
- **Board of Directors**: Composition, industry expertise, previous exits, value-add capability
- **Organizational Structure**: Key departments, headcount by function, talent acquisition strategy
- **Culture & Incentive Alignment**: Compensation structure, ownership stakes, retention mechanisms
- **Execution Track Record**: Previous exits, comparable company scaling experience

**IF NO MANAGEMENT DATA EXISTS (most common):**
Insert standard pending diligence language:

**MANAGEMENT ASSESSMENT**

**CRITICAL DILIGENCE GAP**

Management assessment is incomplete and represents a primary remaining diligence requirement.

**PENDING ACTIVITIES**

| Activity | Status | Expected Completion |
| CEO interviews | Scheduled | [Date +30 days] |
| CFO assessment | Scheduled | [Date +30 days] |
| CMO evaluation | Scheduled | [Date +35 days] |
| Board composition review | In progress | [Date +35 days] |
| Reference checks | Pending | [Date +45 days] |
| Compensation analysis | Pending | [Date +50 days] |

**PRELIMINARY ASSESSMENT FRAMEWORK**

[Standard assessment criteria table]

**CONDITIONS PRECEDENT**

Final IC approval contingent on:
1. Satisfactory management team assessment with positive reference checks
2. Validation of organizational capability to execute scale-up plan
3. Confirmation of appropriate incentive alignment and retention packages
4. Board assessment confirming strategic value-add and governance standards

NEVER invent management information. If not provided, use pending language.`,
      required: true,
      wordCount: { min: 1200, max: 2000 }
    },
    {
      id: 'key-risks',
      title: 'Key Risks',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate comprehensive Risk Analysis (3-4 pages) synthesizing from ALL AGENT OUTPUTS:

**Risk Matrix Table** (create from ALL agents):
| Risk Category | Probability | Impact | Mitigation | Source Agent |
| [Patent Cliff Risk] | [High/Med/Low] | [High/Med/Low] | [Mitigation strategy] | Patent Agent |
| [Clinical/Safety Risk] | [High/Med/Low] | [High/Med/Low] | [Mitigation strategy] | Clinical Agent |
| [Market Competition Risk] | [High/Med/Low] | [High/Med/Low] | [Mitigation strategy] | Market Agent |
| [Revenue/Financial Risk] | [High/Med/Low] | [High/Med/Low] | [Mitigation strategy] | Financial Agent |
| [Regulatory Risk] | [High/Med/Low] | [High/Med/Low] | [Mitigation strategy] | Regulatory Agent |

**Detailed Risk Discussion**

For TOP 5 RISKS (prioritized by impact), provide detailed analysis:

**[Risk 1 Name - typically highest impact]**
- **Description**: [Synthesize from relevant agent output - be specific]
- **Likelihood**: [High/Medium/Low with rationale]
- **Impact**: [Quantify if possible - e.g., "Could reduce IRR from 35% to 15%"]
- **Mitigation**: [Specific actions - e.g., "Secure FTO opinion from patent counsel"]

**[Risk 2 Name - often patent cliff if applicable]**
- **Description**: [From patent agent - e.g., "Key patents expire 2028-2030"]
- **Likelihood**: [Certain if expiry dates confirmed]
- **Impact**: [Revenue cliff, generic competition timeline]
- **Mitigation**: [Life cycle management, new formulations, combination products]

[Repeat for risks 3-5]

**Downside Scenario**

In a downside scenario where [key risk materializes - be specific], expected returns would be:
- IRR: [X]% (vs. [X]% base case)
- MOIC: [X]x (vs. [X]x base case)
- Timeline impact: [Delay/acceleration description]

Use institutional language. Be balanced but realistic about risk likelihood.`,
      required: true,
      wordCount: { min: 1200, max: 2000 }
    },
    {
      id: 'valuation-analysis',
      title: 'Valuation Analysis',
      sourceAgent: 'financial',
      extractionPrompt: `Generate Valuation Analysis (4-5 pages) from FINANCIAL AGENT output:

**Valuation Summary Table**:
| Methodology | Valuation Range | Implied Multiple |
| DCF Analysis | $[X]B - $[Y]B | [X]-[X]x sales |
| Comparable Companies | $[X]B - $[Y]B | [X]-[X]x sales |
| Precedent Transactions | $[X]B - $[Y]B | [X]-[X]x sales |
| Weighted Average | $[X]B - $[Y]B | [X]-[X]x sales |

**DCF Analysis**:
[Extract from financial agent if provided]
- Discount Rate (WACC): [X]%
- Terminal Growth Rate: [X]%
- Projection Period: [X] years
- NPV: $[X]B

**Sensitivity Analysis** (if data available):
[Sensitivity table for key variables: WACC, terminal growth, revenue assumptions]

**Comparable Company Analysis**:
[Extract comparable companies from financial agent]
| Company | EV/Revenue | EV/EBITDA | P/E | Growth Rate |
| [Comp 1] | [X]x | [X]x | [X]x | [X]% |
| [Comp 2] | [X]x | [X]x | [X]x | [X]% |
| Median | [X]x | [X]x | [X]x | [X]% |

**Precedent Transactions**:
[Extract precedent transactions if provided by financial agent]

**Valuation Conclusion**:
[Synthesize valuation recommendation based on methodologies]
Based on the analysis, a valuation range of $[X]B-$[Y]B ([X]-[X]x 2025E revenue) is supported, implying [X]% upside to current trading levels.

If valuation data incomplete, note: "Detailed valuation pending management-provided financial model validation."`,
      required: true,
      wordCount: { min: 1500, max: 2500 }
    },
    {
      id: 'exit-strategy',
      title: 'Exit Strategy',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate Exit Strategy analysis (2-3 pages):

**Exit Scenarios Comparison Table**:
| Exit Type | Timeline | Expected IRR | Expected MOIC | Key Factors |
| Strategic Acquisition | [3-5 years] | [X]% | [X]x | [From market: potential acquirers] |
| IPO | [4-6 years] | [X]% | [X]x | [From financial: IPO readiness metrics] |
| Secondary Sale | [2-4 years] | [X]% | [X]x | [From market: buyer universe] |

**Strategic Acquisition (Primary Scenario)**:

Potential Strategic Acquirers:
[Extract from market agent analysis - identify logical acquirers based on competitive landscape]
- [Acquirer 1]: [Strategic rationale, historical M&A multiples]
- [Acquirer 2]: [Strategic rationale]
- [Acquirer 3]: [Strategic rationale]

Expected Valuation Premium: [X-X]x revenue based on strategic value

**IPO Pathway**:

IPO Readiness Assessment:
- Revenue scale: [Current $X vs. typical $X minimum]
- Growth rate: [X]% [vs. typical X% requirement]
- Profitability: [EBITDA positive timeline]
- Market conditions: [Sector IPO window assessment]

Estimated Timeline to IPO: [X] years

**Exit Timing Considerations**:

Optimal Exit Window: [Time period - synthesize from multiple agents]:
- **Patent Considerations**: [From patent agent - exclusivity timeline, pre-patent cliff optimal]
- **Market Dynamics**: [From market agent - competitive intensity trends]
- **Regulatory Milestones**: [From regulatory agent - approval timeline]
- **Financial Performance**: [From financial agent - peak revenue timing]

Recommended exit window: [Specific time period with rationale]`,
      required: true,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'recommendation',
      title: 'Recommendation & Next Steps',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate final Recommendation & Next Steps (1-2 pages):

**FINAL RECOMMENDATION**

[Synthesize from ALL agents - use INSTITUTIONAL language, NOT promotional]

[If overall positive assessment:]
Recommend approval for equity investment of $[X]-[Y] in [Company Name], based on:

- [Key strength 1 from agent analysis - be specific with data]
- [Key strength 2 - from different agent]
- [Key strength 3 - competitive advantage]

Expected returns: [X-X]% IRR / [X-X]x MOIC over [X-year] investment horizon

[If concerns exist:]
Subject to satisfactory resolution of:
- [Concern 1 - e.g., management assessment completion]
- [Concern 2 - e.g., FTO opinion if patent issues]
- [Concern 3 - e.g., clinical safety monitoring plan]

[If overall negative assessment - rare but possible:]
Do not recommend investment at proposed valuation due to:
- [Key concern 1 with specific data]
- [Key concern 2]

**CONDITIONS PRECEDENT**

Investment approval contingent on:
□ [Condition 1 - often management assessment completion]
□ [Condition 2 - from patent agent if IP verification needed]
□ [Condition 3 - from clinical agent if safety protocols needed]
□ [Condition 4 - standard: Satisfactory term sheet negotiation and legal documentation]

**NEXT STEPS & TIMELINE**

**Action Items Table**:
| Action Item | Owner | Deadline |
| [Item 1 - e.g., Complete management references] | Investment Team | [Date +30 days] |
| [Item 2 - e.g., Engage patent counsel for FTO] | Legal Counsel | [Date +45 days] |
| [Item 3 - e.g., Final IC presentation] | Investment Team | [Date +60 days] |
| [Item 4 - e.g., Term sheet negotiation] | Legal/Investment | [Date +75 days] |

**Proposed Timeline**:
- Due diligence completion: [Date +60 days from today]
- IC approval: [Date +75 days]
- Term sheet negotiation: [Date +90 days]
- Target closing: [Date +120 days]

Use institutional language: "Recommend approval" NOT "STRONG BUY". Be definitive but appropriately hedged.`,
      required: true,
      wordCount: { min: 600, max: 1200 }
    }
  ],
  outputFormat: ['pdf', 'markdown'],
  estimatedPages: '40-50 pages (main body + appendices)',
  estimatedWords: '15,000-25,000 words'
};
