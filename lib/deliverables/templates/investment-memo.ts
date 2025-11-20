/**
 * Investment Memo Template - Institutional Grade
 *
 * This template defines the structure for generating professional investment memos
 * that meet the standards of top-tier firms (McKinsey, BCG, Goldman Sachs, etc.)
 */

import { DeliverableTemplate } from '../types';

export const INVESTMENT_MEMO_PROMPT = `You are an expert investment analyst tasked with creating institutional-grade investment memos that meet the standards of top-tier firms including McKinsey, BCG, JP Morgan, Goldman Sachs, Barclays, and leading VC/PE firms.

## OUTPUT REQUIREMENTS

Generate a comprehensive, professional investment memo that is:
- **Institutional Quality**: Suitable for presentation to investment committees, LPs, or C-suite executives
- **Data-Driven**: All claims backed by specific metrics, financials, or market data
- **Actionable**: Clear investment recommendation with supporting rationale
- **Comprehensive**: 15-25 pages worth of content (6,000-10,000 words)
- **Professional Formatting**: Proper structure with executive summary, body, and appendices

## WRITING STYLE & TONE

- **Professional & Objective**: Balanced analysis, acknowledging both positives and concerns
- **Data-Driven**: Specific numbers, percentages, dates - avoid vague statements
- **Concise Yet Comprehensive**: Dense with information but readable
- **Executive-Appropriate**: Suitable for senior decision-makers
- **Action-Oriented**: Clear implications and recommendations
- **Properly Sourced**: Cite data sources (company data, market research, public filings, etc.)

## RED FLAGS TO HIGHLIGHT

Always call out significant concerns:
- Revenue quality issues (non-recurring, related party transactions)
- Margin pressure or deteriorating unit economics
- Management team gaps or turnover
- Customer concentration risk
- Competitive threats
- Regulatory or legal issues
- Cash constraints or near-term funding needs
- Inconsistencies in company narrative vs. data`;

export const investmentMemoTemplate: DeliverableTemplate = {
  id: 'investment-memo',
  title: 'Investment Memo - Institutional Grade',
  description: 'Comprehensive investment analysis suitable for IC presentation',
  sections: [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      sourceAgent: 'synthesis',
      extractionPrompt: `Generate a 1-2 page Executive Summary with:
- **Investment Recommendation**: Clear BUY/HOLD/PASS with conviction level (High/Medium/Low)
- **Investment Thesis**: 3-5 bullet points capturing core thesis
- **Key Metrics Snapshot**: Revenue, growth rate, margins, valuation multiples
- **Risk/Reward Profile**: Upside case, base case, downside case (with % returns)
- **Key Catalysts**: 3-5 near-term value drivers
- **Deal Terms**: Proposed valuation, investment size, ownership stake, key terms

Format as executive summary table with key metrics where appropriate.`,
      required: true,
      wordCount: { min: 500, max: 1000 }
    },
    {
      id: 'company-overview',
      title: 'Company Overview',
      sourceAgent: 'financial',
      extractionPrompt: `Provide 2-3 page Company Overview with:
- **Company Description**: Business model, products/services, founding story
- **Market Position**: Market share, competitive positioning, brand strength
- **Corporate Structure**: Ownership, board composition, key shareholders
- **Geographic Footprint**: Revenue by geography, operational locations
- **Key Milestones**: Company timeline with major achievements

Include specific data points and dates.`,
      required: true,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      sourceAgent: 'market',
      extractionPrompt: `Deliver 3-4 page Market Analysis covering:
- **Market Size & Growth**: TAM/SAM/SOM with sources and methodology
- **Market Dynamics**: Growth drivers, headwinds, regulatory environment
- **Competitive Landscape**:
  - Competitor analysis with market share data
  - Competitive positioning matrix
  - Barriers to entry and competitive moats
- **Industry Trends**: Macro trends, technological shifts, regulatory changes
- **Customer Analysis**: Customer segments, concentration, acquisition costs

Provide specific market size numbers and competitor comparisons.`,
      required: true,
      wordCount: { min: 1200, max: 2000 }
    },
    {
      id: 'business-model',
      title: 'Business Model & Operations',
      sourceAgent: 'market',
      extractionPrompt: `Analyze Business Model & Operations (2-3 pages):
- **Revenue Model**: Revenue streams with % breakdown and unit economics
- **Go-to-Market Strategy**: Sales channels, distribution, marketing
- **Operational Excellence**: Key operational metrics, efficiency drivers
- **Technology & IP**: Proprietary technology, patents, R&D capabilities
- **Supply Chain**: Key suppliers, manufacturing, logistics

Include unit economics and operational metrics.`,
      required: true,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'clinical-scientific',
      title: 'Clinical & Scientific Assessment',
      sourceAgent: 'clinical',
      extractionPrompt: `Provide comprehensive Clinical & Scientific Assessment (3-4 pages):
- **Technology Assessment**: MOA, scientific rationale, preclinical data quality
- **Clinical Development Plan**: Trial design, endpoints, timeline, probability of success
- **Clinical Data Review**: Efficacy results, safety profile, competitive benchmarking
- **Scientific Validation**: Publications, KOL endorsements, SAB quality
- **Manufacturing & CMC**: Process, scale-up feasibility, CMO partners

For biotech/pharma: Include pipeline analysis, regulatory pathway, and risk-adjusted NPV by asset.`,
      required: false,
      wordCount: { min: 1200, max: 2000 }
    },
    {
      id: 'financial-analysis',
      title: 'Financial Analysis',
      sourceAgent: 'financial',
      extractionPrompt: `Generate comprehensive Financial Analysis (4-5 pages):

**Historical Performance** (3-5 years):
- Income statement: Revenue, gross profit, EBITDA, net income with growth rates
- Margin analysis: Gross, operating, net margins with trends
- Cash flow: Operating, investing, financing cash flows

**Financial Projections** (3-5 years):
- Revenue build-up with clear assumptions
- Margin expansion/contraction drivers
- Working capital requirements
- CapEx needs and timing

**Unit Economics**:
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LTV/CAC ratio and payback period
- Cohort analysis if applicable

**Key Metrics**:
- Revenue growth rate and CAGR
- Gross margin and contribution margin
- EBITDA margin
- Rule of 40 (for SaaS) or industry metrics
- Cash burn rate and runway
- Break-even analysis

Provide tables with specific numbers.`,
      required: true,
      wordCount: { min: 1500, max: 2500 }
    },
    {
      id: 'valuation',
      title: 'Valuation Analysis',
      sourceAgent: 'financial',
      extractionPrompt: `Deliver rigorous Valuation Analysis (3-4 pages):

**Valuation Methodologies**:
- **DCF Analysis**: Detailed assumptions on WACC, terminal growth, key drivers
- **Comparable Company Analysis**: Trading multiples (EV/Revenue, EV/EBITDA, P/E) with 5-10 comps
- **Precedent Transactions**: M&A multiples from recent sector deals
- **Venture Capital Method** (if early-stage): Exit valuation, expected return, required ownership

**Valuation Summary Table**:
| Methodology | Low | Base | High |
|------------|-----|------|------|
| DCF | $XXM | $XXM | $XXM |
| Comps | $XXM | $XXM | $XXM |
| Precedents | $XXM | $XXM | $XXM |

**Sensitivity Analysis**: Key driver sensitivity tables
**Bridge to Offer Price**: Justification for proposed valuation

Include football field chart description if possible.`,
      required: true,
      wordCount: { min: 1200, max: 2000 }
    },
    {
      id: 'ip-analysis',
      title: 'Intellectual Property Assessment',
      sourceAgent: 'patent',
      extractionPrompt: `Provide IP Assessment (2-3 pages):
- **Patent Portfolio Strength**: Claim scope, priority dates, geographic coverage
- **Freedom to Operate**: Blocking patents, workaround strategies, infringement risk
- **Competitive IP**: Patent landscape, citation network, white space
- **Patent Expiry Timeline**: Cliff analysis and exclusivity timeline
- **Trade Secrets**: Know-how and proprietary processes

Include patent claim strength scoring and FTO risk matrix.`,
      required: false,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'regulatory',
      title: 'Regulatory Strategy & Timeline',
      sourceAgent: 'regulatory',
      extractionPrompt: `Analyze Regulatory Strategy (2 pages):
- **Regulatory Pathway**: FDA/EMA pathway, designation status (Breakthrough, Fast Track, etc.)
- **FDA Interaction History**: Meeting minutes, clinical holds, feedback quality
- **Approval Timeline**: Key milestones with dates
- **Approval Probability**: Phase-by-phase success rates
- **Label Positioning**: Expected indication, patient population, differentiation

Include regulatory timeline Gantt chart description.`,
      required: false,
      wordCount: { min: 600, max: 1200 }
    },
    {
      id: 'management',
      title: 'Management & Team Assessment',
      sourceAgent: 'synthesis',
      extractionPrompt: `Assess Management Team (2 pages):
- **Leadership Team**: CEO, CFO, key executives with backgrounds and track record
- **Board of Directors**: Composition, expertise, value-add
- **Organizational Structure**: Key departments, headcount, talent strategy
- **Culture & Values**: Company culture assessment
- **Incentive Alignment**: Compensation structure, ownership stakes

Highlight previous exits, domain expertise, and execution track record.`,
      required: true,
      wordCount: { min: 600, max: 1200 }
    },
    {
      id: 'investment-highlights',
      title: 'Investment Highlights',
      sourceAgent: 'synthesis',
      extractionPrompt: `List compelling Investment Highlights (1-2 pages) as structured bullet points:
- **Strong Market Position**: Specific evidence
- **Sustainable Competitive Advantages**: What makes this defensible
- **Robust Financial Performance**: Key metrics
- **Scalable Business Model**: Evidence of scalability
- **Experienced Management**: Track record
- **Attractive Valuation**: Relative to peers and growth
- **Clear Path to Exit**: M&A candidates, IPO readiness

Each point should be specific and data-backed.`,
      required: true,
      wordCount: { min: 400, max: 800 }
    },
    {
      id: 'risks',
      title: 'Risk Analysis',
      sourceAgent: 'synthesis',
      extractionPrompt: `Provide comprehensive Risk Analysis (2-3 pages).

For each risk category, identify specific risks with:
- Description
- Likelihood (High/Medium/Low)
- Impact (High/Medium/Low)
- Mitigation strategies

**Risk Categories**:
- **Market Risks**: Market downturn, demand decline, competitive intensity, pricing pressure
- **Execution Risks**: Product development delays, go-to-market challenges, scaling issues
- **Financial Risks**: Revenue concentration, cash burn, margin compression
- **Regulatory Risks**: Compliance, regulatory changes
- **Technology Risks**: Technical feasibility, IP protection
- **Key Person Risk**: Founder/key employee dependency
- **Exit Risks**: Limited exit options, market conditions

Create risk matrix showing likelihood vs. impact.`,
      required: true,
      wordCount: { min: 800, max: 1500 }
    },
    {
      id: 'diligence-findings',
      title: 'Diligence Findings',
      sourceAgent: 'synthesis',
      extractionPrompt: `Summarize Diligence Findings (1-2 pages):
- **Commercial Diligence**: Customer references, market validation findings
- **Financial Diligence**: Quality of financial reporting, working capital assessment
- **Legal Diligence**: Cap table review, material contracts, litigation
- **Technical Diligence**: Technology assessment, IP verification
- **Outstanding Items**: Red flags or items requiring further investigation

Be specific about what was reviewed and any concerns discovered.`,
      required: true,
      wordCount: { min: 600, max: 1200 }
    },
    {
      id: 'investment-terms',
      title: 'Investment Terms & Structure',
      sourceAgent: 'financial',
      extractionPrompt: `Detail Investment Terms & Structure (1 page):
- **Proposed Investment**: Amount, valuation, ownership %
- **Security Type**: Common, preferred, convertible note, SAFE
- **Key Terms**: Liquidation preference, anti-dilution, board seats, information rights
- **Use of Proceeds**: Capital deployment plan
- **Milestone-Based Funding**: If applicable
- **Co-investors**: Syndicate structure if relevant

Provide term sheet summary table.`,
      required: true,
      wordCount: { min: 400, max: 800 }
    },
    {
      id: 'exit-strategy',
      title: 'Exit Strategy',
      sourceAgent: 'synthesis',
      extractionPrompt: `Outline Exit Strategy (1 page):
- **Exit Scenarios**: Strategic acquisition (identify potential acquirers), IPO, secondary sale, recap
- **Expected Timeline**: 3-5 years, 5-7 years, etc.
- **Expected Returns**: IRR and MOIC under different scenarios
- **Exit Readiness**: Current state vs. exit requirements

Provide exit scenario comparison table with returns.`,
      required: true,
      wordCount: { min: 400, max: 800 }
    },
    {
      id: 'recommendation',
      title: 'Recommendation & Next Steps',
      sourceAgent: 'synthesis',
      extractionPrompt: `Provide final Recommendation & Next Steps (1 page):
- **Final Recommendation**: Clear BUY/HOLD/PASS with conviction level (High/Medium/Low)
- **Investment Rationale Summary**: Top 3-5 reasons supporting recommendation
- **Proposed Action**: Investment committee approval, term sheet, further diligence
- **Timeline**: Key dates and milestones
- **Conditions Precedent**: What must be satisfied before closing
- **Next Steps**: Immediate action items with owners and deadlines

Be definitive and action-oriented.`,
      required: true,
      wordCount: { min: 400, max: 800 }
    }
  ],
  outputFormat: ['pdf', 'docx', 'markdown'],
  estimatedPages: '15-25 pages',
  estimatedWords: '6,000-10,000 words'
};
