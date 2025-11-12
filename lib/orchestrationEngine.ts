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

// Agent system prompts with enhanced collaboration
const AGENT_PROMPTS = {
  clinical: `You are an expert biotech and pharmaceutical data analyst specializing in clinical trial analysis.

Your expertise includes:
- Clinical trial design and endpoints
- Efficacy and safety analysis
- Competitive clinical benchmarking
- Regulatory pathways (FDA, EMA)
- Phase progression probabilities

When analyzing:
1. Cite documents inline using [Source: filename] format
2. Be specific with statistics, p-values, confidence intervals
3. Compare to relevant competitors and benchmarks
4. Assess clinical risk factors

If you need information from other experts to complete your analysis, ask targeted questions:
- For patent/IP questions: [ASK_PATENT: "specific question"]
- For financial questions: [ASK_FINANCIAL: "specific question"]

Examples of good questions:
- [ASK_PATENT: "Are there blocking patents for the IL-15 costimulation mechanism used in this trial?"]
- [ASK_FINANCIAL: "What is the estimated Phase 3 trial cost for a similar CAR-T program?"]

Only ask questions when the information is critical to your analysis and not already available.`,

  patent: `You are an expert patent analyst specializing in biotechnology intellectual property.

Your expertise includes:
- Patent claim analysis and prosecution
- Freedom-to-operate (FTO) assessments
- Competitive patent landscaping
- Patent valuation methodologies
- IP strategy and licensing

When analyzing:
1. Cite documents inline using [Source: filename] format
2. Identify key patent numbers, claims, and expiration dates
3. Assess FTO risks and blocking patents
4. Evaluate patent strength and enforceability

If you need information from other experts to complete your analysis, ask targeted questions:
- For clinical questions: [ASK_CLINICAL: "specific question"]
- For financial questions: [ASK_FINANCIAL: "specific question"]

Examples of good questions:
- [ASK_CLINICAL: "What is the specific mechanism of action for the therapy? I need to assess patent coverage."]
- [ASK_FINANCIAL: "What valuation premium should we apply for 20-year exclusivity in this indication?"]

Only ask questions when the information is critical to your analysis and not already available.`,

  financial: `You are an expert biotech financial analyst specializing in valuations and deal structures.

Your expertise includes:
- DCF and comparable company valuations
- Biotech financial modeling
- Deal structuring (M&A, licensing)
- Burn rate and runway analysis
- Risk-adjusted NPV calculations

When analyzing:
1. Cite documents inline using [Source: filename] format
2. Provide specific numbers: burn rate, runway, valuations
3. Show valuation methodologies (DCF, comps, precedents)
4. Recommend specific deal structures with rationale

If you need information from other experts to complete your analysis, ask targeted questions:
- For clinical questions: [ASK_CLINICAL: "specific question"]
- For patent questions: [ASK_PATENT: "specific question"]

Examples of good questions:
- [ASK_CLINICAL: "What is the probability of Phase 3 success based on the Phase 2 efficacy data?"]
- [ASK_PATENT: "What is the estimated standalone value of the patent portfolio?"]

Only ask questions when the information is critical to your analysis and not already available.`,
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
    const scenario = getDemoScenario(demoScenarioId);
    if (scenario) {
      playDemoScenario(scenario, sendEvent, 1.0); // Real-time playback
      return;
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
 * Parse agent questions from response text
 */
interface ParsedQuestion {
  targetAgent: AgentType;
  question: string;
  raw: string;
}

function parseAgentQuestions(response: string, fromAgent: AgentType): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // Pattern: [ASK_CLINICAL: "question"], [ASK_PATENT: "question"], [ASK_FINANCIAL: "question"]
  const patterns = [
    { pattern: /\[ASK_CLINICAL:\s*"([^"]+)"\]/g, target: 'clinical' as AgentType },
    { pattern: /\[ASK_PATENT:\s*"([^"]+)"\]/g, target: 'patent' as AgentType },
    { pattern: /\[ASK_FINANCIAL:\s*"([^"]+)"\]/g, target: 'financial' as AgentType },
  ];

  for (const { pattern, target } of patterns) {
    // Skip if asking self
    if (target === fromAgent) continue;

    let match;
    while ((match = pattern.exec(response)) !== null) {
      questions.push({
        targetAgent: target,
        question: match[1],
        raw: match[0],
      });
    }
  }

  return questions;
}

/**
 * Answer a question from another agent
 */
async function answerAgentQuestion(
  targetAgent: AgentType,
  question: string,
  fromAgent: AgentType,
  context: string,
  query: string,
  documents: ProcessedDocument[]
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const userMessage = `You are being consulted by the ${getAgentName(fromAgent)} with a specific question.

Original Analysis Query: ${query}

${getAgentName(fromAgent)}'s Context:
${context}

Their Question to You:
${question}

${documents.length > 0 ? `\nDocuments available:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Provide a focused, expert answer to their specific question. Be concise but thorough.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: AGENT_PROMPTS[targetAgent],
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
  const agentQAs: Map<AgentType, Array<{ question: string; answer: string; from: AgentType }>> = new Map();

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

    // Add any Q&As involving this agent
    const qas = agentQAs.get(step.agent) || [];
    if (qas.length > 0) {
      context.push('\n--- Questions You Answered ---');
      qas.forEach(qa => {
        context.push(`Q from ${getAgentName(qa.from)}: ${qa.question}`);
        context.push(`Your Answer: ${qa.answer}\n`);
      });
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

    // Parse for inter-agent questions
    const questions = parseAgentQuestions(response, step.agent);

    if (questions.length > 0) {
      // Process each question
      for (const { targetAgent, question, raw } of questions) {
        // Send question event
        sendEvent({
          type: 'agent_question',
          data: {
            from: getAgentName(step.agent),
            to: getAgentName(targetAgent),
            question,
          },
        });

        // Get answer from target agent
        sendEvent({
          type: 'agent_thinking',
          data: {
            agent: getAgentName(targetAgent),
            progress: `Answering question from ${getAgentName(step.agent)}...`,
          },
        });

        const answer = await answerAgentQuestion(
          targetAgent,
          question,
          step.agent,
          agentResponses.get(step.agent) || '',
          state.query,
          state.documents
        );

        // Store the Q&A for the target agent to see later
        if (!agentQAs.has(targetAgent)) {
          agentQAs.set(targetAgent, []);
        }
        agentQAs.get(targetAgent)!.push({
          question,
          answer,
          from: step.agent,
        });

        // Update the asking agent's response with the answer (replace placeholder)
        const updatedResponse = agentResponses.get(step.agent)!.replace(
          raw,
          `\n**Question to ${getAgentName(targetAgent)}:** ${question}\n\n**${getAgentName(targetAgent)}'s Answer:** ${answer}\n`
        );
        agentResponses.set(step.agent, updatedResponse);

        // Send updated response event
        sendEvent({
          type: 'agent_response',
          data: {
            agent: getAgentName(step.agent),
            response: updatedResponse,
          },
        });
      }
    }
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
    system: AGENT_PROMPTS[agent],
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

Format your synthesis as a comprehensive report with:
- Executive Summary
- Key Findings by Domain
- Cross-Domain Insights
- Risk Assessment
- Final Recommendation

Be specific, quantitative, and actionable.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: 'You are a senior biotech strategist and executive advisor.',
    messages: [
      {
        role: 'user',
        content: synthesisPrompt,
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
  };
  return names[agent];
}
