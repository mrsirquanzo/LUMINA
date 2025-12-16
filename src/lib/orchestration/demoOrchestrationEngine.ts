/**
 * Demo Orchestration Engine
 * 
 * Simulates multi-agent orchestration for demo purposes.
 * Uses pre-computed data but shows realistic timing and progress.
 */

import type { AgentType } from '../multiAgentTypes';

export interface AgentStatus {
  agent: AgentType;
  status: 'queued' | 'running' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  result?: any;
  completedAt?: number;
}

export interface OrchestrationConfig {
  target: string;
  onAgentUpdate: (agent: AgentType, status: AgentStatus) => void;
  onProgressUpdate: (progress: number) => void;
  onComplete: (results: Record<AgentType, any>) => void;
  onError?: (error: Error) => void;
}

// Agent execution order and timing (in milliseconds)
// Staggered timing for visual impact - 3-6 seconds per agent
const AGENT_TIMING: Record<AgentType, { delay: number; duration: number; message: string }> = {
  target_biology: {
    delay: 0,        // Start immediately
    duration: 3000,  // 3 seconds for visual impact
    message: 'Analyzing genetic validation data...',
  },
  clinical: {
    delay: 500,      // Start 0.5s after target_biology
    duration: 4000,  // 4 seconds
    message: 'Searching ClinicalTrials.gov...',
  },
  patent: {
    delay: 1000,     // Start 1s after target_biology
    duration: 5000,  // 5 seconds
    message: 'Searching USPTO database...',
  },
  financial: {
    delay: 1500,     // Start 1.5s after target_biology
    duration: 6000,  // 6 seconds
    message: 'Pulling comparable deals...',
  },
  market_research: {
    delay: 2000,     // Start 2s after target_biology
    duration: 5000,  // 5 seconds
    message: 'Analyzing market opportunity...',
  },
  regulatory: {
    delay: 2500,     // Start 2.5s after target_biology
    duration: 4000,  // 4 seconds
    message: 'Assessing FDA pathway...',
  },
};

// All agents in execution order
const AGENT_ORDER: AgentType[] = [
  'target_biology',
  'clinical',
  'patent',
  'financial',
  'market_research',
  'regulatory',
];

export class DemoOrchestrationEngine {
  private config: OrchestrationConfig;
  private agentStatuses: Map<AgentType, AgentStatus> = new Map();
  private timers: Map<AgentType, NodeJS.Timeout> = new Map();
  private progressTimers: Map<AgentType, NodeJS.Timeout> = new Map(); // Store progress timers for cleanup
  private progressInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: OrchestrationConfig) {
    this.config = config;
  }

  /**
   * Start the orchestration simulation
   */
  start(): void {
    console.log('[DemoOrchestrationEngine] start() called');
    if (this.isRunning) {
      console.warn('[DemoOrchestrationEngine] Orchestration already running');
      return;
    }

    console.log('[DemoOrchestrationEngine] Starting orchestration for target:', this.config.target);
    this.isRunning = true;
    this.agentStatuses.clear();

    // Initialize all agents as queued
    AGENT_ORDER.forEach((agent) => {
      const status: AgentStatus = {
        agent,
        status: 'queued',
        progress: 0,
      };
      this.agentStatuses.set(agent, status);
      this.config.onAgentUpdate(agent, status);
    });

    // Start progress tracking
    this.startProgressTracking();

    // Start agents with staggered delays
    AGENT_ORDER.forEach((agent) => {
      const timing = AGENT_TIMING[agent];
      console.log(`[DemoOrchestrationEngine] Scheduling agent: ${agent} with delay: ${timing.delay}ms`);
      if (timing.delay === 0) {
        // Start immediately
        this.runAgent(agent);
      } else {
        // Start after delay
        const timer = setTimeout(() => {
          this.runAgent(agent);
          this.timers.delete(agent);
        }, timing.delay);
        this.timers.set(agent, timer);
      }
    });
  }

  /**
   * Run a single agent simulation
   */
  private runAgent(agent: AgentType): void {
    const timing = AGENT_TIMING[agent];
    const status = this.agentStatuses.get(agent);
    if (!status) return;

    // Update to running
    status.status = 'running';
    status.progress = 0;
    status.message = timing.message;
    this.agentStatuses.set(agent, status);
    this.config.onAgentUpdate(agent, status);

    // Simulate progress updates - faster for minimal delay
    const progressInterval = 50; // Update every 50ms for smoother animation
    const progressIncrement = (100 / timing.duration) * progressInterval;
    let currentProgress = 0;

    const progressTimer = setInterval(() => {
      currentProgress = Math.min(currentProgress + progressIncrement, 100);
      status.progress = currentProgress;
      this.agentStatuses.set(agent, status);
      this.config.onAgentUpdate(agent, status);

      if (currentProgress >= 100) {
        clearInterval(progressTimer);
        this.progressTimers.delete(agent); // Remove from map when done
        this.completeAgent(agent);
      }
    }, progressInterval);
    
    // Store progress timer for cleanup
    this.progressTimers.set(agent, progressTimer);
  }

  /**
   * Mark an agent as complete
   */
  private completeAgent(agent: AgentType): void {
    const status = this.agentStatuses.get(agent);
    if (!status) return;

    status.status = 'complete';
    status.progress = 100;
    status.completedAt = Date.now();
    status.message = `Analysis complete`;
    // In real implementation, status.result would contain the agent's analysis data
    this.agentStatuses.set(agent, status);
    this.config.onAgentUpdate(agent, status);

    // Check if all agents are complete
    const allComplete = Array.from(this.agentStatuses.values()).every(
      (s) => s.status === 'complete' || s.status === 'error'
    );

    if (allComplete) {
      this.finish();
    }
  }

  /**
   * Start progress tracking
   */
  private startProgressTracking(): void {
    this.progressInterval = setInterval(() => {
      const totalProgress = this.calculateOverallProgress();
      this.config.onProgressUpdate(totalProgress);
    }, 100);
  }

  /**
   * Calculate overall progress (0-100)
   */
  private calculateOverallProgress(): number {
    const agents = Array.from(this.agentStatuses.values());
    if (agents.length === 0) return 0;

    const totalProgress = agents.reduce((sum, status) => {
      if (status.status === 'complete') return sum + 100;
      if (status.status === 'running') return sum + status.progress;
      return sum;
    }, 0);

    return Math.round(totalProgress / agents.length);
  }

  /**
   * Finish orchestration and call onComplete
   */
  private finish(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Ensure progress is 100%
    this.config.onProgressUpdate(100);

    // Collect results
    const results: Record<AgentType, any> = {} as Record<AgentType, any>;
    this.agentStatuses.forEach((status, agent) => {
      if (status.status === 'complete') {
        results[agent] = status.result || { status: 'complete' };
      }
    });

    // Call onComplete immediately - no delay needed
    this.isRunning = false;
    this.config.onComplete(results);
  }

  /**
   * Stop the orchestration
   */
  stop(): void {
    this.isRunning = false;

    // Clear all start timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Clear all progress timers
    this.progressTimers.forEach((timer) => clearInterval(timer));
    this.progressTimers.clear();

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Get current agent statuses
   */
  getAgentStatuses(): AgentStatus[] {
    return Array.from(this.agentStatuses.values());
  }
}

