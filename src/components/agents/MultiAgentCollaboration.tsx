'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ProcessedDocument, ExecutionMode, SSEEvent, AgentType } from '@/lib/multiAgentTypes';
import { FiZap, FiClock, FiDollarSign, FiCheck, FiAlertCircle, FiMessageSquare, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { saveAnalysisToHistory } from '@/lib/analysisHistory';
import ExportButton from '@/components/shared/ExportButton';
import type { ChatMessage } from '@/lib/pdfExport';
import { CitedMarkdown } from '@/components/shared/CitedMarkdown';
import { GenerateInvestmentMemoButton } from '@/components/deliverables/GenerateInvestmentMemoButton';
import { useOrchestrationTiles } from '@/hooks/useOrchestrationTiles';
import { getAgentTheme, getAgentThemeFromLabel } from '@/lib/agents/theme';

interface MultiAgentCollaborationProps {
  query: string;
  documents: ProcessedDocument[];
  mode: ExecutionMode;
  isDemo?: boolean;
  demoScenarioId?: string;
  customAgents?: AgentType[];
  mcpEnabled?: boolean;
  onComplete?: (synthesis: string, cost: number) => void;
}

interface AgentActivity {
  agent: string;
  status: 'thinking' | 'speaking' | 'complete';
  currentThought?: string;
  response?: string;
  chatMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  isProcessingChat?: boolean;
  isExpanded?: boolean;
  chatInput?: string;
  lastUpdate?: number;
}

interface AgentQuestion {
  from: string;
  to: string;
  question: string;
  timestamp: number;
}

function MultiAgentCollaboration({
  query,
  documents,
  mode,
  isDemo = false,
  demoScenarioId,
  customAgents,
  mcpEnabled = false,
  onComplete,
}: MultiAgentCollaborationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [plan, setPlan] = useState<string>('');
  const [agentActivities, setAgentActivities] = useState<Map<string, AgentActivity>>(new Map());
  const [agentQuestions, setAgentQuestions] = useState<AgentQuestion[]>([]);
  const [synthesisStep, setSynthesisStep] = useState<string>('');
  const [synthesis, setSynthesis] = useState<string>('');
  const [cost, setCost] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  // Copy/download actions removed (keep a single Export button)
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [timeoutWarning, setTimeoutWarning] = useState<boolean>(false);
  const [synthesisExpanded, setSynthesisExpanded] = useState<boolean>(true);
  const [sseEvents, setSseEvents] = useState<SSEEvent[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Use orchestration tiles hook to automatically create tiles
  useOrchestrationTiles(sseEvents, {
    enabled: isDemo || true, // Enable for both demo and live mode
    query,
    onTileCreated: (tileId, agent) => {
      console.log(`[MultiAgentCollaboration] Tile created: ${tileId} for ${agent}`);
    },
  });

  // Monitor for timeout/freezing
  useEffect(() => {
    if (isRunning && !synthesis) {
      timeoutCheckInterval.current = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastActivityTime;

        // Show warning after 45 seconds of no activity
        if (timeSinceLastUpdate > 45000 && !timeoutWarning) {
          setTimeoutWarning(true);
        }

        // Auto-cancel after 3 minutes of no activity
        if (timeSinceLastUpdate > 180000) {
          setError('Analysis timed out. The request took too long to complete. Please try again.');
          setIsRunning(false);
          if (timeoutCheckInterval.current) {
            clearInterval(timeoutCheckInterval.current);
          }
        }
      }, 5000); // Check every 5 seconds

      return () => {
        if (timeoutCheckInterval.current) {
          clearInterval(timeoutCheckInterval.current);
        }
      };
    }
  }, [isRunning, synthesis, lastActivityTime, timeoutWarning]);

  // Save analysis to history when complete
  useEffect(() => {
    if (synthesis && synthesis.length > 0) {
      const agents = Array.from(agentActivities.keys());
      saveAnalysisToHistory({
        query,
        mode,
        agents,
        synthesis,
        cost,
        isDemo: isDemo || false,
      });
    }
  }, [synthesis, agentActivities, query, mode, cost, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start analysis when component mounts
  useEffect(() => {
    startOrchestration();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startOrchestration = async () => {
    setIsRunning(true);
    setError('');
    setPlan('');
    setAgentActivities(new Map());
    setAgentQuestions([]);
    setSynthesisStep('');
    setSynthesis('');
    setCost(0);
    setSseEvents([]); // Reset events for new analysis
    setLastActivityTime(Date.now());
    setTimeoutWarning(false);
    
    // Emit orchestration start event
    window.dispatchEvent(new CustomEvent('orchestration-start'));

    const requestPayload = {
      query,
      documents,
      mode,
      isDemo,
      demoScenarioId,
      customAgents,
      mcpEnabled,
    };

    console.log('[MultiAgentCollaboration] Sending request to orchestrator:', {
      ...requestPayload,
      isDemo: requestPayload.isDemo,
      isDemoType: typeof requestPayload.isDemo,
    });

    try {
      // Create SSE connection
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestPayload),
      });

      console.log('[MultiAgentCollaboration] Response status:', response.status, response.statusText);
      console.log('[MultiAgentCollaboration] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to parse error response, but handle empty/invalid JSON gracefully
        let errorMessage = 'Failed to start orchestration';
        let errorDetails = '';
        
        try {
          const text = await response.text();
          console.log('[MultiAgentCollaboration] Error response text:', text);
          
          if (text) {
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
              errorDetails = errorData.details || '';
            } catch (parseError) {
              // If not JSON, use the text as error message
              errorMessage = text || errorMessage;
            }
          } else {
            // Empty response - use status-based message
            if (response.status === 401) {
              errorMessage = 'Authentication required. Please log in to use live analysis mode, or ensure demo mode is enabled.';
            } else if (response.status === 400) {
              errorMessage = 'Invalid request. Please check your query and try again.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again or use demo mode.';
            } else {
              errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
            }
          }
        } catch (e: any) {
          console.error('[MultiAgentCollaboration] Error reading response:', e);
          // If response is empty or can't be read, use status-based message
          if (response.status === 401) {
            errorMessage = 'Authentication required. Please log in to use live analysis mode, or ensure demo mode is enabled.';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again or use demo mode.';
          } else {
            errorMessage = `Request failed with status ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage;
        console.error('[MultiAgentCollaboration] Orchestration failed:', fullErrorMessage);
        throw new Error(fullErrorMessage);
      }

      // Set up SSE event source
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = line.substring(6);
            try {
              const event: SSEEvent = JSON.parse(eventData);
              handleSSEEvent(event);
              // Track events for tile creation
              setSseEvents(prev => [...prev, event]);
              setLastActivityTime(Date.now());
              setTimeoutWarning(false);
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Orchestration error:', err);
      setError(err.message || 'An error occurred during orchestration');
      // Emit orchestration end event on error
      window.dispatchEvent(new CustomEvent('orchestration-end'));
    } finally {
      setIsRunning(false);
      if (timeoutCheckInterval.current) {
        clearInterval(timeoutCheckInterval.current);
      }
    }
  };

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case 'plan_created':
        setPlan(event.data.plan);
        setEstimatedCost(event.data.estimatedCost);
        break;

      case 'agent_start':
        setAgentActivities(prev => {
          const updated = new Map(prev);
          updated.set(event.data.agent, {
            agent: event.data.agent,
            status: 'thinking',
            currentThought: event.data.task || 'Starting analysis...',
            chatMessages: [],
            isExpanded: true,
            chatInput: '',
            lastUpdate: Date.now(),
          });
          return updated;
        });
        break;

      case 'agent_thinking':
        setAgentActivities(prev => {
          const updated = new Map(prev);
          const activity = updated.get(event.data.agent);
          if (activity) {
            activity.currentThought = event.data.thought;
            activity.lastUpdate = Date.now();
          }
          return updated;
        });
        break;

      case 'agent_response':
        setAgentActivities(prev => {
          const updated = new Map(prev);
          const activity = updated.get(event.data.agent);
          if (activity) {
            activity.status = 'complete';
            activity.response = event.data.response;
            activity.currentThought = undefined;
            activity.lastUpdate = Date.now();
          }
          // Calculate and emit progress
          const completedAgents = Array.from(updated.values()).filter(a => a.status === 'complete').length;
          const totalAgents = updated.size || 6; // Default to 6 agents
          const progress = Math.min(Math.round((completedAgents / totalAgents) * 100), 100);
          window.dispatchEvent(new CustomEvent('orchestration-progress', { detail: progress }));
          return updated;
        });
        break;

      case 'agent_question':
        setAgentQuestions(prev => [
          ...prev,
          {
            from: event.data.from,
            to: event.data.to,
            question: event.data.question,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'synthesis_start':
        setSynthesisStep('Starting synthesis...');
        break;

      case 'synthesis_progress':
        setSynthesisStep(event.data.step);
        break;

      case 'complete':
        setSynthesis(event.data.synthesis);
        setCost(event.data.cost);
        setSynthesisStep('');
        setIsRunning(false);
        // Emit orchestration end event
        window.dispatchEvent(new CustomEvent('orchestration-end'));
        window.dispatchEvent(new CustomEvent('orchestration-progress', { detail: 100 }));
        if (onComplete) {
          onComplete(event.data.synthesis, event.data.cost);
        }
        break;

      case 'error':
        setError(event.data.message);
        break;
    }
  };

  const toggleAgentExpansion = (agentName: string) => {
    setAgentActivities(prev => {
      const updated = new Map(prev);
      const activity = updated.get(agentName);
      if (activity) {
        // Create a new object to ensure React detects the change
        updated.set(agentName, {
          ...activity,
          isExpanded: !activity.isExpanded,
        });
      }
      return updated;
    });
  };

  const handleAgentChatInput = (agentName: string, value: string) => {
    setAgentActivities(prev => {
      const updated = new Map(prev);
      const activity = updated.get(agentName);
      if (activity) {
        activity.chatInput = value;
      }
      return updated;
    });
  };

  const sendChatToAgent = async (agentName: string) => {
    const activity = agentActivities.get(agentName);
    if (!activity || !activity.chatInput?.trim() || activity.isProcessingChat) return;

    const userMessage = activity.chatInput.trim();

    // Add user message to chat
    setAgentActivities(prev => {
      const updated = new Map(prev);
      const act = updated.get(agentName);
      if (act) {
        act.chatMessages = [...(act.chatMessages || []), { role: 'user', content: userMessage }];
        act.chatInput = '';
        act.isProcessingChat = true;
      }
      return updated;
    });

    try {
      // Determine which API endpoint to call based on agent name
      let endpoint = '/api/agents/data-analyst';
      if (agentName.includes('Patent')) endpoint = '/api/agents/patent-expert';
      if (agentName.includes('Financial')) endpoint = '/api/agents/financial-analyst';
      if (agentName.includes('Regulatory')) endpoint = '/api/agents/regulatory-expert';
      if (agentName.includes('Market')) endpoint = '/api/agents/market-research';

      // Build context from original response
      const context = activity.response || '';
      const fullQuery = `Context from earlier analysis:\n${context.substring(0, 500)}...\n\nFollow-up question: ${userMessage}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: fullQuery }],
          documents: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await response.json();

      // Add assistant response to chat
      setAgentActivities(prev => {
        const updated = new Map(prev);
        const act = updated.get(agentName);
        if (act) {
          act.chatMessages = [...(act.chatMessages || []), { role: 'assistant', content: data.message }];
          act.isProcessingChat = false;
        }
        return updated;
      });

    } catch (err: any) {
      console.error('Chat error:', err);
      setAgentActivities(prev => {
        const updated = new Map(prev);
        const act = updated.get(agentName);
        if (act) {
          act.chatMessages = [...(act.chatMessages || []), {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your question. Please try again.'
          }];
          act.isProcessingChat = false;
        }
        return updated;
      });
    }
  };

  const getAgentIcon = (agent: string) => {
    if (!agent) return '🤖';
    // Target Biology (e.g., "Target Biology Specialist")
    if (agent.includes('Target') || agent.includes('Biology')) return '🧬';
    if (agent.includes('Clinical')) return '👩‍⚕️';
    if (agent.includes('Data')) return '🔬';
    if (agent.includes('Patent')) return '⚖️';
    if (agent.includes('Financial')) return '💰';
    if (agent.includes('Regulatory')) return '📋';
    if (agent.includes('Market')) return '📊';
    return '🤖';
  };

  const sonnyTheme = getAgentTheme('sonny');

  const getProgressPercentage = () => {
    if (synthesis) return 100;
    if (synthesisStep) return 90;
    if (agentActivities.size === 0) return 0;

    // Default is 5 agents: Clinical, Patent, Financial, Market, Regulatory
    const totalAgents = customAgents?.length || 5;
    const completedAgents = Array.from(agentActivities.values()).filter(a => a.status === 'complete').length;
    const progressPercent = (completedAgents / totalAgents) * 80;

    // Cap at 80% during agent phase (synthesis adds final 10-20%)
    return Math.min(progressPercent, 80);
  };

  const generateExportContent = () => {
    const timestamp = new Date().toLocaleString();
    const agentList = Array.from(agentActivities.keys()).join(', ');

    return `# Sonny Analysis Report

**Generated:** ${timestamp}
**Query:** ${query}
**Mode:** ${mode}
**Agents:** ${agentList}
${cost > 0 ? `**Cost:** $${cost.toFixed(2)}` : ''}

---

${synthesis}

---

*Generated by Sonny Multi-Agent AI Analysis System*
`;
  };

  const getTimeSinceLastUpdate = (activity: AgentActivity) => {
    if (!activity.lastUpdate) return '';
    const seconds = Math.floor((Date.now() - activity.lastUpdate) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-white/10 bg-surfaceElevated/60 p-4 shadow-sm backdrop-blur-md">
        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${sonnyTheme.gradient}`} />
        <div className="relative flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-2">
              <span className={sonnyTheme.accentText}>🤖</span> Sonny Analysis
            </h3>
            <p className="text-sm text-textSecondary">
              <span className="font-medium text-textPrimary">{query}</span>
            </p>
            {documents.length > 0 && (
              <p className="text-sm text-textSecondary mt-1">
                Documents: {documents.map(d => d.fileName).join(', ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-textSecondary">
                {mode === 'fast' ? <FiZap className="w-4 h-4" /> : <FiClock className="w-4 h-4" />}
                <span className="font-medium uppercase text-textPrimary">{mode} Mode</span>
              </div>
              {estimatedCost && (
                <div className="flex items-center gap-1 text-xs text-textTertiary mt-1">
                  <FiDollarSign className="w-3 h-3" />
                  <span>Est. {estimatedCost}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && !synthesis && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-textSecondary mb-2">
              <span className="font-medium">Analysis Progress</span>
              <span className="font-semibold text-textPrimary">{Math.min(Math.round(getProgressPercentage()), 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${sonnyTheme.accentGradient} h-2.5 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%`, maxWidth: '100%' }}
              />
            </div>

            {/* Timeout Warning */}
            {timeoutWarning && (
              <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-md flex items-start gap-2">
                <FiClock className="w-4 h-4 text-warning mt-0.5" />
                <div className="text-sm text-textPrimary">
                  <p className="font-medium">Analysis is taking longer than expected...</p>
                  <p className="text-xs mt-1 text-textSecondary">Still processing. This may take a few more minutes.</p>
                </div>
              </div>
            )}

            {/* Agent Status Indicators */}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {Array.from(agentActivities.values()).map((activity) => (
                <div key={activity.agent} className="flex items-center gap-2">
                  {activity.status === 'complete' ? (
                    <FiCheck className="w-4 h-4 text-green-600" />
                  ) : activity.status === 'thinking' ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-white/20 rounded-full" />
                  )}
                  <span className={activity.status === 'complete' ? 'text-textPrimary font-medium' : 'text-textSecondary'}>
                    {activity.agent.split(' ')[0]}
                  </span>
                  {activity.lastUpdate && activity.status === 'thinking' && (
                    <span className="text-xs text-textTertiary">
                      {getTimeSinceLastUpdate(activity)}
                    </span>
                  )}
                </div>
              ))}
              {synthesisStep && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                  <span className="text-textPrimary font-medium">Synthesis</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Plan */}
        {plan && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-md relative overflow-hidden">
            <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${sonnyTheme.gradient} opacity-50`} />
            <div className="relative">
              <p className="text-sm font-medium text-textPrimary">Execution Plan:</p>
              <p className="text-sm text-textSecondary mt-1">{plan}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2">
            <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-textPrimary">Error</p>
              <p className="text-sm text-textSecondary mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Activities */}
      {agentActivities.size > 0 && (
        <div className="space-y-4 mb-6 min-w-0">
          {Array.from(agentActivities.values()).map((activity) => {
            const theme = getAgentThemeFromLabel(activity.agent);
            return (
            <div
              key={activity.agent}
              className={`relative rounded-xl border border-white/10 bg-surfaceElevated/50 shadow-sm backdrop-blur-md transition-all duration-300 min-w-0 overflow-hidden`}
            >
              <div aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
              {/* Agent Header */}
              <div className="p-4 relative">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  {/* Left: icon + name + status */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="text-3xl flex-shrink-0">{getAgentIcon(activity.agent)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`font-bold text-lg ${theme.accentText} truncate`}>
                          {activity.agent}
                        </h4>
                        {activity.status === 'complete' && (
                          <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {activity.status === 'thinking' && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium animate-pulse ${theme.badgeBg} ${theme.badgeText} flex-shrink-0 whitespace-nowrap`}>
                            Analyzing…
                          </span>
                        )}
                      </div>

                      {activity.currentThought && activity.status === 'thinking' && (
                        <p className="text-sm text-textSecondary italic mt-2 bg-surface border border-white/10 p-2 rounded">
                          💭 {activity.currentThought}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: actions (Export + expand/collapse) */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activity.status === 'complete' && activity.response && (
                      <ExportButton
                        messages={[
                          { role: 'user', content: query, timestamp: new Date() },
                          { role: 'assistant', content: activity.response, timestamp: new Date() },
                        ] as ChatMessage[]}
                        agentName={activity.agent}
                        className="scale-90"
                      />
                    )}

                    {activity.response && (
                      <button
                        onClick={() => toggleAgentExpansion(activity.agent)}
                        className="p-2 hover:bg-surface/60 rounded-md transition-colors bg-surface border border-white/10 flex-shrink-0"
                        aria-label={activity.isExpanded ? 'Collapse response' : 'Expand response'}
                        title={activity.isExpanded ? 'Collapse response' : 'Expand response'}
                      >
                        {activity.isExpanded ? (
                          <FiChevronUp className="w-5 h-5 text-textSecondary" />
                        ) : (
                          <FiChevronDown className="w-5 h-5 text-textSecondary" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Response - Separate container outside header to avoid double padding */}
              {activity.response && (
                <div className={`px-4 pb-4 ${activity.isExpanded ? '' : 'max-h-32 overflow-hidden relative'}`}>
                  <CitedMarkdown
                    content={activity.response}
                    isDemo={isDemo}
                    tone={{ gradient: theme.gradient, border: theme.border }}
                    className="break-words"
                  />
                  {!activity.isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surfaceElevated to-transparent" />
                  )}
                </div>
              )}

              {/* Interactive Chat Section */}
              {activity.status === 'complete' && activity.isExpanded && (
                <div className="px-4 pb-4">
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <FiMessageSquare className="w-4 h-4 text-textSecondary flex-shrink-0" />
                      <h5 className="text-sm font-semibold text-textPrimary">Ask Follow-up Questions</h5>
                    </div>

                    {/* Chat Messages */}
                    {activity.chatMessages && activity.chatMessages.length > 0 && (
                      <div className="mb-3 space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
                        {activity.chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg shadow-sm min-w-0 ${
                              msg.role === 'user'
                                ? 'bg-primary/10 border-l-4 border-primary ml-8'
                                : 'bg-surface/40 border border-white/10 mr-8'
                            }`}
                          >
                            <div className={`text-xs mb-1 ${msg.role === 'user' ? 'text-primary font-medium' : 'text-textSecondary font-medium'}`}>
                              {msg.role === 'user' ? 'You' : activity.agent}
                            </div>
                            <div className="min-w-0 overflow-x-hidden">
                              <CitedMarkdown content={msg.content} className="break-words" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activity.chatInput || ''}
                        onChange={(e) => handleAgentChatInput(activity.agent, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatToAgent(activity.agent);
                          }
                        }}
                        placeholder="Ask a follow-up question..."
                        disabled={activity.isProcessingChat}
                        className="flex-1 px-3 py-2 text-sm border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-surfaceElevated text-textPrimary placeholder:text-textTertiary"
                      />
                      <button
                        onClick={() => sendChatToAgent(activity.agent)}
                        disabled={activity.isProcessingChat || !activity.chatInput?.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {activity.isProcessingChat ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiSend className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Agent Questions */}
      {agentQuestions.length > 0 && (
        <div className="mb-6 space-y-2">
          {agentQuestions.map((question, idx) => (
            <div
              key={idx}
              className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-amber-900 mb-1">
                <span>{getAgentIcon(question.from)} {question.from}</span>
                <span className="text-amber-600">→</span>
                <span>{getAgentIcon(question.to)} {question.to}</span>
              </div>
              <p className="text-sm text-amber-800 italic">"{question.question}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Synthesis Progress */}
      {synthesisStep && (
        <div className="mb-6 relative overflow-hidden rounded-xl border border-white/10 bg-surfaceElevated/60 p-4 shadow-sm backdrop-blur-md">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${getAgentTheme('sonny').gradient}`}
          />
          <div className="flex items-center gap-3">
            <div className="relative animate-spin rounded-full h-6 w-6 border-b-2 border-white/70"></div>
            <div className="relative">
              <p className="text-sm font-semibold text-textPrimary">🤖 Sonny Synthesizing Results</p>
              <p className="text-sm text-textSecondary mt-1">{synthesisStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Final Synthesis */}
      {synthesis && (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-white/10 bg-surfaceElevated/50 p-4 shadow-md backdrop-blur-md">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${getAgentTheme('sonny').gradient}`}
          />
          <div className="flex items-center gap-2 mb-4">
            <FiCheck className="w-6 h-6 text-success relative" />
            <h3 className="text-xl font-bold text-textPrimary relative">Analysis Complete</h3>
            <div className="ml-auto flex items-center gap-2">
              {cost > 0 && (
                <span className="text-sm font-medium text-textSecondary bg-surfaceElevated/60 border border-white/10 px-3 py-1 rounded-full relative">
                  Cost: ${cost.toFixed(4)}
                </span>
              )}
              <button
                onClick={() => setSynthesisExpanded(!synthesisExpanded)}
                className="p-2 hover:bg-surface/60 rounded-md transition-colors bg-surface/60 border border-white/10 relative"
                aria-label={synthesisExpanded ? 'Collapse analysis' : 'Expand analysis'}
                title={synthesisExpanded ? 'Collapse analysis' : 'Expand analysis'}
              >
                {synthesisExpanded ? (
                  <FiChevronUp className="w-5 h-5 text-textSecondary" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-textSecondary" />
                )}
              </button>
            </div>
          </div>

          {/* Export Actions */}
          <div className="mb-4 space-y-3">
            {/* Investment Memo Generator - Primary Action */}
            {!isDemo && synthesisExpanded && (
              <GenerateInvestmentMemoButton
                agentResponses={{
                  clinical: agentActivities.get('Clinical Data Analyst')?.response,
                  patent: agentActivities.get('Patent Expert')?.response,
                  financial: agentActivities.get('Financial Analyst')?.response,
                  market: agentActivities.get('Market Research Analyst')?.response,
                  regulatory: agentActivities.get('Regulatory Expert')?.response,
                  synthesis: synthesis
                }}
                companyName={query.split(/\b(?:analyze|about|for)\b/i)[1]?.trim().split(/\s+/).slice(0, 3).join(' ')}
                analysisId={`analysis-${Date.now()}`}
              />
            )}

            {/* Standard Export Options */}
            {synthesisExpanded && (
              <div className="flex items-center gap-2 flex-wrap">
                <ExportButton
                  messages={[
                    { role: 'user', content: query, timestamp: new Date() },
                    { role: 'assistant', content: synthesis, timestamp: new Date(), cost }
                  ] as ChatMessage[]}
                  agentName="Sonny Analysis"
                />
              </div>
            )}
          </div>

          <div className={`${synthesisExpanded ? '' : 'max-h-32 overflow-hidden relative'}`}>
            <div className="relative">
              <CitedMarkdown
                content={synthesis}
                isDemo={isDemo}
                tone={{ gradient: getAgentTheme('sonny').gradient, border: getAgentTheme('sonny').border }}
                className="rounded-xl shadow-md min-w-0 overflow-x-hidden"
              />
            </div>
            {!synthesisExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surfaceElevated to-transparent" />
            )}
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MultiAgentCollaboration;
