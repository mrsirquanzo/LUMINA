import type {
  ProcessedDocument,
  ExecutionMode,
  SSEEvent,
  AgentType,
  AgentMessage,
  ConversationState,
  ExecutionPlan,
} from './multiAgentTypes';
import { getDemoScenario, playDemoScenario, matchQueryToScenario } from './demoMultiAgentScenarios';
import { createLLMClient } from './llm/clientFactory';
import { AGENT_MODEL_CONFIG, SYNTHESIS_MODEL_CONFIG, getAgentName as getAgentDisplayName } from './llm/agentConfig';
import { AGENT_PROMPTS } from './agentPrompts';
import { getMCPClient } from './mcp';
import { SONNY_SYNTHESIS_PROMPT } from './sonnyPrompts';

/**
 * Main orchestration function
 */
export async function runOrchestration(
  query: string,
  documents: ProcessedDocument[],
  mode: ExecutionMode,
  sendEvent: (event: SSEEvent) => void,
  isDemo?: boolean,
  demoScenarioId?: string,
  customAgents?: AgentType[],
  mcpEnabled?: boolean
): Promise<void> {
  // If demo mode, prevent API calls - use demo scenario or match query to scenario
  if (isDemo) {
    // Use provided scenario ID, or match query to appropriate scenario
    const scenarioId = demoScenarioId || matchQueryToScenario(query);
    if (scenarioId) {
      const scenario = getDemoScenario(scenarioId);
      if (scenario) {
        await playDemoScenario(scenario, sendEvent, 1.0); // Real-time playback
        return;
      }
    }
    // In demo mode without a matching scenario, return an error instead of making API calls
    sendEvent({
      type: 'error',
      data: {
        message: 'Demo mode requires a pre-recorded scenario. Please use a demo scenario from the demo interface or switch to Live mode for custom queries.',
      },
    });
    return;
  }

  // Validate API keys before starting (for live mode)
  if (!isDemo) {
    const missingKeys: string[] = [];

    if (!process.env.ANTHROPIC_API_KEY) {
      missingKeys.push('ANTHROPIC_API_KEY');
    }
    if (!process.env.GOOGLE_API_KEY) {
      missingKeys.push('GOOGLE_API_KEY');
    }
    if (!process.env.PERPLEXITY_API_KEY) {
      missingKeys.push('PERPLEXITY_API_KEY');
    }

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required API keys: ${missingKeys.join(', ')}. ` +
        `Please configure these environment variables in your Vercel project settings.`
      );
    }
  }

  // Initialize conversation state
  const state: ConversationState = {
    query,
    documents,
    mode,
    plan: createInitialPlan(mode, customAgents),
    messages: [],
    currentStep: 0,
    iteration: 0,
    complete: false,
    totalCost: 0,
    mcpEnabled: mcpEnabled || false,
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
function createInitialPlan(mode: ExecutionMode, customAgents?: AgentType[]): ExecutionPlan {
  const validAgents: AgentType[] = ['clinical', 'patent', 'financial', 'market_research', 'regulatory', 'target_biology'];

  // Validate custom agents if provided
  if (customAgents) {
    const invalidAgents = customAgents.filter(a => !validAgents.includes(a));
    if (invalidAgents.length > 0) {
      throw new Error(`Invalid agent types in customAgents: ${invalidAgents.join(', ')}. Valid types: ${validAgents.join(', ')}`);
    }
  }

  const agents: AgentType[] = customAgents || validAgents;

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
    ? `Fast analysis: Staged execution (rate-limit safe)`
    : `Sequential analysis: ${agents} → Synthesis`;
}

/**
 * Map with limited concurrency (simple in-file helper; avoids extra deps).
 */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Number.isFinite(concurrency) && concurrency > 0 ? Math.floor(concurrency) : 1;
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runOne(): Promise<void> {
    const current = nextIndex;
    nextIndex += 1;
    if (current >= items.length) return;
    results[current] = await worker(items[current], current);
    await runOne();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runOne());
  await Promise.all(runners);
  return results;
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

  // Pattern: [ASK_CLINICAL: "question"], [ASK_PATENT: "question"], etc.
  const patterns = [
    { pattern: /\[ASK_CLINICAL:\s*"([^"]+)"\]/g, target: 'clinical' as AgentType },
    { pattern: /\[ASK_PATENT:\s*"([^"]+)"\]/g, target: 'patent' as AgentType },
    { pattern: /\[ASK_FINANCIAL:\s*"([^"]+)"\]/g, target: 'financial' as AgentType },
    { pattern: /\[ASK_MARKET:\s*"([^"]+)"\]/g, target: 'market_research' as AgentType },
    { pattern: /\[ASK_REGULATORY:\s*"([^"]+)"\]/g, target: 'regulatory' as AgentType },
    { pattern: /\[ASK_TARGET_BIOLOGY:\s*"([^"]+)"\]/g, target: 'target_biology' as AgentType },
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
  documents: ProcessedDocument[],
  mcpEnabled?: boolean
): Promise<string> {
  // Validate agent types
  if (!AGENT_MODEL_CONFIG[targetAgent]) {
    throw new Error(`Invalid target agent type: "${targetAgent}". Valid types: clinical, patent, financial, regulatory, market_research`);
  }
  if (!AGENT_PROMPTS[targetAgent]) {
    throw new Error(`Missing prompt for agent: "${targetAgent}"`);
  }

  // Get MCP client and context
  const mcpClient = getMCPClient(mcpEnabled);
  const mcpContext = await mcpClient.getContextForAgent(targetAgent);

  const userMessage = `You are being consulted by the ${getAgentName(fromAgent)} with a specific question.

Original Analysis Query: ${query}

${getAgentName(fromAgent)}'s Context:
${context}

Their Question to You:
${question}

${documents.length > 0 ? `\nDocuments available:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Provide a focused, expert answer to their specific question. Be concise but thorough.`;

  // Inject MCP context into system prompt if MCP is enabled
  const systemPrompt = mcpClient.isEnabled()
    ? AGENT_PROMPTS[targetAgent] + mcpContext
    : AGENT_PROMPTS[targetAgent];

  // Create client for the target agent
  const client = createLLMClient(AGENT_MODEL_CONFIG[targetAgent]);

  const response = await client.sendMessage(
    systemPrompt,
    userMessage,
    { maxTokens: 2048 }
  );

  return response.content;
}

/**
 * Execute fast mode (parallel)
 */
async function executeFastMode(
  state: ConversationState,
  sendEvent: (event: SSEEvent) => void
): Promise<void> {
  // Live fast mode previously ran all agents simultaneously (high TPM → 429 rate limits).
  // We stage execution with a small concurrency cap to be demo-safe.
  const maxConcurrency = Math.max(1, Number(process.env.LUMINA_LIVE_MAX_CONCURRENCY || 2));

  const results = await mapWithConcurrency(state.plan.steps, maxConcurrency, async (step, index) => {
    sendEvent({
      type: 'agent_start',
      data: {
        agent: getAgentName(step.agent),
        task: `Analyzing ${step.agent} aspects of the query`,
      },
    });

    // Small stagger to reduce bursty TPM even within concurrency window
    if (index > 0) await new Promise((r) => setTimeout(r, 250));

    const { response } = await callAgent(
      step.agent,
      state.query,
      state.documents,
      [],
      undefined,
      state.mcpEnabled
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

    const { response } = await callAgent(
      step.agent,
      state.query,
      state.documents,
      [],
      context.join('\n\n'),
      state.mcpEnabled
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
          state.documents,
          state.mcpEnabled
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
 * Call a specific agent using its configured LLM
 */
async function callAgent(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string,
  mcpEnabled?: boolean
): Promise<{ response: string; usage?: { inputTokens: number; outputTokens: number } }> {
  // Validate agent type
  if (!AGENT_MODEL_CONFIG[agent]) {
    throw new Error(`Invalid agent type: "${agent}". Valid types: clinical, patent, financial, regulatory, market_research, target_biology`);
  }
  if (!AGENT_PROMPTS[agent]) {
    throw new Error(`Missing prompt for agent: "${agent}"`);
  }

  // Special handling for target_biology (uses API clients, not just LLM)
  if (agent === 'target_biology') {
    try {
      // Extract target symbol from query
      const targetSymbol = extractTargetSymbol(query);
      if (!targetSymbol) {
        throw new Error('Could not extract target symbol from query. Please specify the gene symbol (e.g., "EGFR", "TROP2").');
      }

      const llmConfig = AGENT_MODEL_CONFIG.target_biology;
      const { TargetBiologyAgent } = await import('./agents/targetBiologyAgent');
      const biologyAgent = new TargetBiologyAgent(llmConfig);
      
      // Extract indication if mentioned
      const indication = extractIndication(query);
      
      // Run assessment
      const report = await biologyAgent.assessTarget(targetSymbol, {
        indication,
        depth: 'standard',
      });
      
      // Format report based on context (scientist vs BD)
      const formatted = additionalContext?.toLowerCase().includes('bd') || 
                       additionalContext?.toLowerCase().includes('business')
        ? biologyAgent.formatBDOutput(report)
        : biologyAgent.formatScientistOutput(report);
      
      // Estimate token usage (rough estimate)
      const estimatedTokens = Math.ceil(formatted.length / 4); // ~4 chars per token
      
      return {
        response: formatted,
        usage: {
          inputTokens: estimatedTokens * 0.3, // Rough estimate
          outputTokens: estimatedTokens * 0.7,
        },
      };
    } catch (error: any) {
      console.error('[Orchestration] Target biology agent error:', error);
      // Fallback to LLM-only response
      return callAgentWithLLM(agent, query, documents, messages, additionalContext, mcpEnabled);
    }
  }

  // Get MCP client and context
  const mcpClient = getMCPClient(mcpEnabled);
  const mcpContext = await mcpClient.getContextForAgent(agent);

  // Build user message with MCP context
  const userMessage = `${query}

${additionalContext || ''}

${documents.length > 0 ? `\nDocuments provided:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Please provide your expert analysis.`;

  // Inject MCP context into system prompt if MCP is enabled
  const systemPrompt = mcpClient.isEnabled()
    ? AGENT_PROMPTS[agent] + mcpContext
    : AGENT_PROMPTS[agent];

  // Create client for this agent using its configured model
  const client = createLLMClient(AGENT_MODEL_CONFIG[agent]);

  // Send message using the appropriate LLM
  const llmResponse = await client.sendMessage(
    systemPrompt,
    userMessage,
    { maxTokens: 4096 }
  );

  return {
    response: llmResponse.content,
    usage: llmResponse.usage,
  };
}

/**
 * Helper to extract target symbol from query
 */
function extractTargetSymbol(query: string): string | null {
  // Try to find gene symbols (uppercase, 2-10 chars, common patterns)
  const genePattern = /\b([A-Z]{2,10})\b/g;
  const matches = query.match(genePattern);
  
  if (matches && matches.length > 0) {
    // Common gene symbols to prioritize
    const commonGenes = ['EGFR', 'KRAS', 'BRAF', 'TP53', 'CD19', 'TROP2', 'HER2', 'PD1', 'PDL1', 'TIGIT'];
    const found = matches.find(m => commonGenes.includes(m));
    if (found) return found;
    
    // Return first match if it looks like a gene symbol
    return matches[0];
  }
  
  // Try explicit patterns like "target: X" or "gene: X"
  const explicitPattern = /(?:target|gene|symbol)[:\s]+([A-Z]{2,10})/i;
  const explicitMatch = query.match(explicitPattern);
  if (explicitMatch) return explicitMatch[1].toUpperCase();
  
  return null;
}

/**
 * Helper to extract indication from query
 */
function extractIndication(query: string): string | undefined {
  const indicationPattern = /(?:indication|disease|for)[:\s]+([^,\.]+)/i;
  const match = query.match(indicationPattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Fallback: call agent with LLM only (if API clients fail)
 */
async function callAgentWithLLM(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string,
  mcpEnabled?: boolean
): Promise<{ response: string; usage?: { inputTokens: number; outputTokens: number } }> {
  // Get MCP client and context
  const mcpClient = getMCPClient(mcpEnabled);
  const mcpContext = await mcpClient.getContextForAgent(agent);

  // Build user message
  const userMessage = `${query}

${additionalContext || ''}

${documents.length > 0 ? `\nDocuments provided:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Please provide your expert analysis.`;

  // Inject MCP context into system prompt if MCP is enabled
  const systemPrompt = mcpClient.isEnabled()
    ? AGENT_PROMPTS[agent] + mcpContext
    : AGENT_PROMPTS[agent];

  // Create client for this agent using its configured model
  const client = createLLMClient(AGENT_MODEL_CONFIG[agent]);

  // Send message using the appropriate LLM
  const llmResponse = await client.sendMessage(
    systemPrompt,
    userMessage,
    { maxTokens: 4096 }
  );

  return {
    response: llmResponse.content,
    usage: llmResponse.usage,
  };
}

/**
 * Synthesize results from all agents using Sonny
 */
async function synthesizeResults(
  query: string,
  results: Array<{ agent: AgentType; response: string }>
): Promise<string> {
  const combinedAnalysis = results
    .map(r => `\n# ${getAgentName(r.agent)} Analysis\n\n${r.response}`)
    .join('\n\n---\n');

  const userMessage = `Original Query: ${query}

Expert Analyses:
${combinedAnalysis}`;

  // Use synthesis model configuration (Claude Sonnet 4) with Sonny identity
  const client = createLLMClient(SYNTHESIS_MODEL_CONFIG);

  // Override the synthesis prompt to identify as Sonny
  const sonnyPrompt = SONNY_SYNTHESIS_PROMPT;

  const response = await client.sendMessage(
    sonnyPrompt,
    userMessage,
    { maxTokens: 4096 }
  );

  return response.content;
}

/**
 * Get human-readable agent name (re-export from agentConfig)
 */
function getAgentName(agent: AgentType): string {
  return getAgentDisplayName(agent);
}
