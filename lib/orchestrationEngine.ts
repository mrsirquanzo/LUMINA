import Anthropic from '@anthropic-ai/sdk';
import {
  ProcessedDocument,
  ExecutionMode,
  SSEEvent,
  AgentType,
  AgentMessage,
  ConversationState,
  ExecutionPlan,
} from './multiAgentTypes';
import { getDemoScenario, playDemoScenario } from './demoMultiAgentScenarios';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Agent system prompts (imported from existing agents)
const AGENT_PROMPTS = {
  clinical: `You are an expert biotech and pharmaceutical data analyst. Analyze clinical trial data, efficacy, and safety with scientific rigor. When documents are provided, cite them inline using [Source: filename] format. If you need information from other experts, use [ASK_PATENT: "question"] or [ASK_FINANCIAL: "question"] or [ASK_REGULATORY: "question"] or [ASK_MARKET: "question"].`,

  patent: `You are an expert patent analyst specializing in biotechnology IP. Analyze patents, FTO, and competitive landscapes. When documents are provided, cite them inline using [Source: filename] format. If you need information from other experts, use [ASK_CLINICAL: "question"] or [ASK_FINANCIAL: "question"] or [ASK_REGULATORY: "question"] or [ASK_MARKET: "question"].`,

  financial: `You are an expert biotech financial analyst. Analyze financials, valuations, and deal structures. When documents are provided, cite them inline using [Source: filename] format. If you need information from other experts, use [ASK_CLINICAL: "question"] or [ASK_PATENT: "question"] or [ASK_REGULATORY: "question"] or [ASK_MARKET: "question"].`,

  regulatory: `You are an expert regulatory affairs specialist for biotech and pharmaceutical products. Analyze regulatory pathways, compliance requirements, FDA/EMA guidance, and approval timelines. Assess regulatory risk, CMC requirements, and post-market obligations. When documents are provided, cite them inline using [Source: filename] format. If you need information from other experts, use [ASK_CLINICAL: "question"] or [ASK_PATENT: "question"] or [ASK_FINANCIAL: "question"] or [ASK_MARKET: "question"].`,

  market_research: `You are an expert market research analyst specializing in biotech and pharmaceutical markets. Analyze market size, competitive landscape, pricing dynamics, payer dynamics, and commercial potential. Assess market access, reimbursement, and revenue forecasts. When documents are provided, cite them inline using [Source: filename] format. If you need information from other experts, use [ASK_CLINICAL: "question"] or [ASK_PATENT: "question"] or [ASK_FINANCIAL: "question"] or [ASK_REGULATORY: "question"].`,
};

/**
 * Main orchestration function
 */
export async function runOrchestration(
  query: string,
  documents: ProcessedDocument[],
  mode: ExecutionMode,
  sendEvent: (event: SSEEvent) => void,
  isDemo?: boolean,
  demoScenarioId?: string
): Promise<void> {
  // If demo mode, play pre-recorded scenario
  if (isDemo && demoScenarioId) {
    console.log('[Orchestration] Demo mode detected, loading scenario:', demoScenarioId);
    const scenario = getDemoScenario(demoScenarioId);
    if (scenario) {
      console.log('[Orchestration] Playing demo scenario with', scenario.events.length, 'events');
      await playDemoScenario(scenario, sendEvent, 1.0); // Real-time playback
      console.log('[Orchestration] Demo scenario playback complete');
      return;
    } else {
      console.error('[Orchestration] Demo scenario not found:', demoScenarioId);
    }
  }

  // Initialize conversation state
  const state: ConversationState = {
    query,
    documents,
    mode,
    plan: createInitialPlan(mode),
    messages: [],
    currentStep: 0,
    iteration: 0,
    complete: false,
    totalCost: 0,
  };

  // Send plan created event
  sendEvent({
    type: 'plan_created',
    data: {
      plan: getPlanDescription(state.plan),
      mode,
      estimatedCost: mode === 'fast' ? '$0.10-0.30' : '$0.30-0.80',
    },
  });

  // Execute plan
  if (mode === 'fast') {
    await executeFastMode(state, sendEvent);
  } else {
    await executeThoroughMode(state, sendEvent);
  }

  // Send completion event
  sendEvent({
    type: 'complete',
    data: {
      synthesis: state.synthesis,
      cost: state.totalCost,
    },
  });
}

/**
 * Create initial execution plan
 */
function createInitialPlan(mode: ExecutionMode): ExecutionPlan {
  const agents: AgentType[] = ['clinical', 'patent', 'financial'];

  if (mode === 'fast') {
    // Parallel execution
    return {
      steps: agents.map((agent, index) => ({
        id: `step-${index}`,
        agent,
        question: 'Analyze the provided documents and query',
        dependencies: [],
        allowsCommunication: false,
        status: 'pending',
      })),
      maxIterations: 1,
      mode,
    };
  } else {
    // Sequential with communication
    return {
      steps: agents.map((agent, index) => ({
        id: `step-${index}`,
        agent,
        question: 'Analyze the provided documents and query',
        dependencies: index > 0 ? [`step-${index - 1}`] : [],
        allowsCommunication: true,
        status: 'pending',
      })),
      maxIterations: 3,
      mode,
    };
  }
}

/**
 * Get human-readable plan description
 */
function getPlanDescription(plan: ExecutionPlan): string {
  const agents = plan.steps.map(s => s.agent).join(' → ');
  return plan.mode === 'fast'
    ? `Parallel analysis: All agents run simultaneously`
    : `Sequential analysis: ${agents} → Synthesis`;
}

/**
 * Execute fast mode (parallel)
 */
async function executeFastMode(
  state: ConversationState,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  // Run all agents in parallel
  const agentPromises = state.plan.steps.map(async step => {
    sendEvent({
      type: 'agent_start',
      data: {
        agent: getAgentName(step.agent),
        task: `Analyzing ${step.agent} aspects of the query`,
      },
    });

    const response = await callAgent(
      step.agent,
      state.query,
      state.documents,
      []
    );

    sendEvent({
      type: 'agent_response',
      data: {
        agent: getAgentName(step.agent),
        response,
      },
    });

    return { agent: step.agent, response };
  });

  const results = await Promise.all(agentPromises);

  // Synthesize results
  sendEvent({
    type: 'synthesis_start',
    data: {},
  });

  const synthesis = await synthesizeResults(state.query, results);
  state.synthesis = synthesis;
}

/**
 * Execute thorough mode (sequential with communication)
 */
async function executeThoroughMode(
  state: ConversationState,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  const agentResponses: Map<AgentType, string> = new Map();

  // Execute agents sequentially
  for (const step of state.plan.steps) {
    sendEvent({
      type: 'agent_start',
      data: {
        agent: getAgentName(step.agent),
        task: `Analyzing ${step.agent} aspects with context from previous agents`,
      },
    });

    // Build context from previous agents
    const context: string[] = [];
    for (const [agent, response] of agentResponses.entries()) {
      context.push(`\n--- ${getAgentName(agent)} Analysis ---\n${response}`);
    }

    const response = await callAgent(
      step.agent,
      state.query,
      state.documents,
      [],
      context.join('\n\n')
    );

    agentResponses.set(step.agent, response);

    sendEvent({
      type: 'agent_response',
      data: {
        agent: getAgentName(step.agent),
        response,
      },
    });

    // Check for inter-agent questions (Phase 2 feature)
    // For now, just continue to next agent
  }

  // Synthesize results
  sendEvent({
    type: 'synthesis_start',
    data: {},
  });

  sendEvent({
    type: 'synthesis_progress',
    data: {
      step: 'Integrating findings across all agents...',
    },
  });

  const results = Array.from(agentResponses.entries()).map(([agent, response]) => ({
    agent,
    response,
  }));

  const synthesis = await synthesizeResults(state.query, results);
  state.synthesis = synthesis;
}

/**
 * Call a specific agent
 */
async function callAgent(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Build messages for Claude
  const userMessage = `${query}

${additionalContext || ''}

${documents.length > 0 ? `\nDocuments provided:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Please provide your expert analysis.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: AGENT_PROMPTS[agent],
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const message = response.content[0];
  if (message.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return message.text;
}

/**
 * Synthesize results from all agents
 */
async function synthesizeResults(
  query: string,
  results: Array<{ agent: AgentType; response: string }>
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const combinedAnalysis = results
    .map(r => `\n# ${getAgentName(r.agent)} Analysis\n\n${r.response}`)
    .join('\n\n---\n');

  const synthesisPrompt = `You are a senior biotech strategist synthesizing input from multiple expert analysts.

Original Query: ${query}

Expert Analyses:
${combinedAnalysis}

Your task:
1. Integrate findings across clinical, patent, and financial domains
2. Identify key insights and cross-domain connections
3. Highlight agreements and contradictions
4. Provide a clear, actionable recommendation
5. Structure as an executive summary suitable for decision-makers

IMPORTANT: Format your response EXACTLY as follows:

## Executive Summary
[2-3 paragraph overview of the key recommendation and rationale]

## Key Findings

### Clinical Analysis
• [Key finding 1]
• [Key finding 2]
• [Key finding 3]

### Patent/IP Analysis
• [Key finding 1]
• [Key finding 2]
• [Key finding 3]

### Financial Analysis
• [Key finding 1]
• [Key finding 2]
• [Key finding 3]

## Cross-Domain Insights
[2-3 paragraphs discussing how findings connect across domains]

## Risk Assessment

### High Priority Risks
• [Risk 1 with mitigation]
• [Risk 2 with mitigation]

### Medium Priority Risks
• [Risk 1 with mitigation]
• [Risk 2 with mitigation]

## Final Recommendation
[Clear GO/NO-GO or specific action recommendation with supporting rationale]

Be specific, quantitative, and actionable. Use actual numbers, dates, and technical details from the expert analyses.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: 'You are a senior biotech strategist and executive advisor.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: synthesisPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  });

  const message = response.content[0];
  if (message.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return message.text;
}

/**
 * Get human-readable agent name
 */
function getAgentName(agent: AgentType): string {
  const names = {
    clinical: 'Clinical Analyst',
    patent: 'Patent Expert',
    financial: 'Financial Analyst',
    regulatory: 'Regulatory Expert',
    market_research: 'Market Research Analyst',
  };
  return names[agent];
}
