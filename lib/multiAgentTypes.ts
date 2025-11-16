// Multi-Agent Collaboration Types

// Orchestrator Configuration
export const ORCHESTRATOR_NAME = 'Sonny';

export type AgentType = 'clinical' | 'patent' | 'financial';
export type ExecutionMode = 'fast' | 'thorough';
export type StepStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface ProcessedDocument {
  fileName: string;
  fileType: string;
  text?: string;
  isImage: boolean;
  base64?: string;
  mimeType?: string;
}

export interface PlanStep {
  id: string;
  agent: AgentType;
  question: string;
  dependencies: string[];
  allowsCommunication: boolean;
  status: StepStatus;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  maxIterations: number;
  mode: ExecutionMode;
}

export interface AgentMessage {
  id: string;
  from: 'orchestrator' | AgentType;
  to: 'orchestrator' | AgentType | 'user';
  type: 'task' | 'response' | 'question' | 'synthesis';
  content: string;
  timestamp: Date;
  context?: AgentMessage[];
}

export interface AgentQuestion {
  targetAgent: AgentType;
  question: string;
}

export interface AgentCitation {
  sourceAgent: AgentType;
  reference: string;
}

export interface ParsedResponse {
  text: string;
  questions: AgentQuestion[];
  citations: AgentCitation[];
  needsFollowUp: boolean;
}

export interface ConversationState {
  query: string;
  documents: ProcessedDocument[];
  mode: ExecutionMode;
  plan: ExecutionPlan;
  messages: AgentMessage[];
  currentStep: number;
  iteration: number;
  complete: boolean;
  synthesis?: string;
  totalCost: number;
}

export interface CostEstimate {
  minCost: number;
  maxCost: number;
  estimatedIterations: number;
  agents: AgentType[];
  breakdown: {
    agent: AgentType;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
}

// SSE Event Types
export type SSEEventType =
  | 'plan_created'
  | 'agent_start'
  | 'agent_thinking'
  | 'agent_response'
  | 'agent_question'
  | 'synthesis_start'
  | 'synthesis_progress'
  | 'complete'
  | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: any;
  timestamp?: number;
}

// Demo Scenario Types
export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  query: string;
  documents: string[];
  events: SSEEvent[];
  estimatedDuration: number; // milliseconds
}

export interface QueryClassification {
  agents: AgentType[];
  primary: AgentType;
  complexity: 'high' | 'medium' | 'low';
  reasoning: string;
}
