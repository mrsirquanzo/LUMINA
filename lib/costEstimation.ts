import { ProcessedDocument, CostEstimate, ExecutionMode, AgentType } from './multiAgentTypes';

// Claude Sonnet 4 pricing (per 1M tokens)
const CLAUDE_PRICING = {
  input: 3.00,   // $3 per million input tokens
  output: 15.00, // $15 per million output tokens
};

const CHARS_PER_TOKEN = 4; // Approximate

/**
 * Estimate tokens from text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Calculate cost from token counts
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * CLAUDE_PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * CLAUDE_PRICING.output;
  return inputCost + outputCost;
}

/**
 * Estimate total document tokens
 */
function estimateDocumentTokens(documents: ProcessedDocument[]): number {
  return documents.reduce((sum, doc) => {
    // Images count as ~1000 tokens
    const imageTokens = doc.isImage ? 1000 : 0;
    return sum + estimateTokens(doc.text ?? '') + imageTokens;
  }, 0);
}

/**
 * Estimate cost for multi-agent analysis
 */
export function estimateMultiAgentCost(
  query: string,
  documents: ProcessedDocument[],
  mode: ExecutionMode
): CostEstimate {
  const docTokens = estimateDocumentTokens(documents);
  const queryTokens = estimateTokens(query);
  const baseInputTokens = docTokens + queryTokens;

  if (mode === 'fast') {
    // Fast mode: All agents run in parallel
    // Each agent gets full context
    // Expected output: ~2000 tokens per agent
    // Plus synthesis: ~1500 tokens

    const agents: AgentType[] = ['clinical', 'patent', 'financial', 'regulatory', 'market_research'];
    const breakdown = agents.map(agent => ({
      agent,
      inputTokens: baseInputTokens,
      outputTokens: 2000,
      cost: calculateCost(baseInputTokens, 2000),
    }));

    // Add synthesis step
    const synthesisInputTokens = baseInputTokens + (2000 * agents.length); // Include all agent responses
    const synthesisOutputTokens = 1500;
    breakdown.push({
      agent: 'clinical', // Placeholder, synthesis is separate
      inputTokens: synthesisInputTokens,
      outputTokens: synthesisOutputTokens,
      cost: calculateCost(synthesisInputTokens, synthesisOutputTokens),
    });

    const totalCost = breakdown.reduce((sum, b) => sum + b.cost, 0);

    return {
      minCost: totalCost * 0.8,  // 20% buffer
      maxCost: totalCost * 1.3,  // 30% buffer
      estimatedIterations: 1,
      agents,
      breakdown,
    };
  } else {
    // Thorough mode: Sequential with communication
    // More iterations, agents can ask each other questions
    // Expected: 5-7 API calls

    const agents: AgentType[] = ['clinical', 'patent', 'financial', 'regulatory', 'market_research'];

    // Estimate iterative calls
    const iterations = 2; // Average 2 rounds of questions
    const callsPerAgent = 1 + iterations;

    // Build breakdown
    const breakdown: CostEstimate['breakdown'] = [];

    agents.forEach(agent => {
      for (let i = 0; i < callsPerAgent; i++) {
        // Context grows with each iteration
        const contextGrowth = i * 2000;
        const inputTokens = baseInputTokens + contextGrowth;
        const outputTokens = 2500;

        breakdown.push({
          agent,
          inputTokens,
          outputTokens,
          cost: calculateCost(inputTokens, outputTokens),
        });
      }
    });

    // Final synthesis
    const synthesisInputTokens = baseInputTokens + (2500 * agents.length * callsPerAgent);
    const synthesisOutputTokens = 2000;
    breakdown.push({
      agent: 'clinical', // Placeholder
      inputTokens: synthesisInputTokens,
      outputTokens: synthesisOutputTokens,
      cost: calculateCost(synthesisInputTokens, synthesisOutputTokens),
    });

    const totalCost = breakdown.reduce((sum, b) => sum + b.cost, 0);

    return {
      minCost: totalCost * 0.7,
      maxCost: totalCost * 1.5,
      estimatedIterations: 3,
      agents,
      breakdown,
    };
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Get cost range string
 */
export function getCostRangeString(estimate: CostEstimate): string {
  return `${formatCost(estimate.minCost)} - ${formatCost(estimate.maxCost)}`;
}
