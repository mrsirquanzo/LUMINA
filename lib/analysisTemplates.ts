import { AgentType } from './multiAgentTypes';

export interface AnalysisTemplate {
  id: string;
  title: string;
  description: string;
  agents: AgentType[];
  promptTemplate: string;
  icon: string;
  category: 'due-diligence' | 'strategy' | 'regulatory' | 'commercial';
  estimatedTime: string;
  recommendedMode: 'fast' | 'thorough';
}

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'ma-due-diligence',
    title: 'M&A Due Diligence',
    description: 'Comprehensive analysis for biotech acquisitions covering clinical, IP, financial, regulatory, and market aspects',
    agents: ['clinical', 'patent', 'financial', 'regulatory', 'market_research'],
    promptTemplate: `Analyze the acquisition target {{company_name}} for a potential {{deal_value}} acquisition.

Key areas to assess:
- Clinical data and pipeline strength
- Patent portfolio and IP protection
- Financial health and valuation
- Regulatory pathway and approval timeline
- Market opportunity and competitive positioning

Provide a clear GO/NO-GO recommendation with supporting rationale.`,
    icon: '🤝',
    category: 'due-diligence',
    estimatedTime: '3-5 minutes',
    recommendedMode: 'thorough',
  },
  {
    id: 'ipo-readiness',
    title: 'IPO Readiness Assessment',
    description: 'Evaluate company readiness for public markets including pipeline strength, IP position, and financial metrics',
    agents: ['clinical', 'patent', 'financial', 'market_research'],
    promptTemplate: `Assess {{company_name}}'s readiness for an IPO targeting {{target_raise}}.

Evaluation criteria:
- Clinical pipeline and data quality
- IP portfolio strength and FTO
- Financial metrics and burn rate
- Market positioning and competitive landscape
- Investor story and value proposition

Rate readiness on a scale of 1-10 and provide key recommendations.`,
    icon: '📈',
    category: 'strategy',
    estimatedTime: '2-4 minutes',
    recommendedMode: 'thorough',
  },
  {
    id: 'asset-acquisition',
    title: 'Asset Acquisition',
    description: 'Evaluate acquisition of a specific drug or technology asset',
    agents: ['clinical', 'patent', 'financial', 'regulatory'],
    promptTemplate: `Analyze the potential acquisition of {{asset_name}} from {{company_name}} for {{deal_terms}}.

Assessment areas:
- Clinical proof-of-concept and data quality
- Patent protection and exclusivity timeline
- Deal structure and valuation
- Regulatory pathway to approval
- Development costs and timeline

Provide valuation range and deal recommendation.`,
    icon: '💊',
    category: 'due-diligence',
    estimatedTime: '2-3 minutes',
    recommendedMode: 'thorough',
  },
  {
    id: 'partnership-evaluation',
    title: 'Partnership Evaluation',
    description: 'Assess strategic partnership or licensing opportunity',
    agents: ['clinical', 'patent', 'financial', 'market_research'],
    promptTemplate: `Evaluate partnership opportunity with {{partner_name}} for {{technology}}.

Key considerations:
- Technology validation and proof-of-concept
- IP ownership and licensing terms
- Financial terms and economics
- Market potential and competitive dynamics
- Strategic fit and synergies

Recommend deal structure and key negotiation points.`,
    icon: '🤝',
    category: 'strategy',
    estimatedTime: '2-3 minutes',
    recommendedMode: 'fast',
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Landscape Analysis',
    description: 'Compare multiple products or companies across clinical, IP, and commercial dimensions',
    agents: ['clinical', 'patent', 'market_research'],
    promptTemplate: `Compare {{competitors}} in the {{indication}} space.

Comparison dimensions:
- Clinical differentiation and data quality
- Patent strength and exclusivity
- Market positioning and commercial potential
- Pricing and reimbursement dynamics

Rank competitors and identify market leader.`,
    icon: '📊',
    category: 'commercial',
    estimatedTime: '2-3 minutes',
    recommendedMode: 'fast',
  },
  {
    id: 'regulatory-strategy',
    title: 'Regulatory Strategy',
    description: 'Design optimal regulatory pathway for drug development',
    agents: ['clinical', 'regulatory'],
    promptTemplate: `Design regulatory strategy for {{product_name}} targeting {{indication}}.

Strategy elements:
- Regulatory pathway (accelerated approval, breakthrough, etc.)
- Clinical trial design and endpoints
- FDA/EMA requirements and guidance
- CMC and manufacturing considerations
- Timeline and key milestones

Provide recommended regulatory approach and timeline.`,
    icon: '📋',
    category: 'regulatory',
    estimatedTime: '2-3 minutes',
    recommendedMode: 'thorough',
  },
  {
    id: 'market-opportunity',
    title: 'Market Opportunity Assessment',
    description: 'Size market opportunity and forecast revenue potential',
    agents: ['clinical', 'market_research', 'financial'],
    promptTemplate: `Assess market opportunity for {{product_name}} in {{indication}}.

Market analysis:
- Patient population and epidemiology
- Current treatment landscape and unmet need
- Pricing and reimbursement dynamics
- Competitive positioning
- Revenue forecast and peak sales

Provide 5-year revenue forecast with assumptions.`,
    icon: '💹',
    category: 'commercial',
    estimatedTime: '2-3 minutes',
    recommendedMode: 'fast',
  },
  {
    id: 'investment-decision',
    title: 'Investment Decision (Venture/Series)',
    description: 'Due diligence for early-stage investment in biotech company',
    agents: ['clinical', 'patent', 'financial', 'market_research'],
    promptTemplate: `Evaluate {{funding_round}} investment in {{company_name}} for {{investment_amount}}.

Investment criteria:
- Technology validation and proof-of-concept
- IP protection and FTO
- Team and execution capability
- Market opportunity and timing
- Valuation and deal terms
- Risk factors and mitigation

Provide investment recommendation and key risks.`,
    icon: '💼',
    category: 'due-diligence',
    estimatedTime: '3-4 minutes',
    recommendedMode: 'thorough',
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): AnalysisTemplate | undefined {
  return ANALYSIS_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter(t => t.category === category);
}

/**
 * Fill template with variables
 */
export function fillTemplate(template: AnalysisTemplate, variables: Record<string, string>): string {
  let prompt = template.promptTemplate;
  Object.entries(variables).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return prompt;
}
