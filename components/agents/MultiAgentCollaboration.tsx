'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProcessedDocument, ExecutionMode, SSEEvent, AgentType } from '@/lib/multiAgentTypes';
import { FiPlay, FiZap, FiClock, FiDollarSign, FiCheck, FiAlertCircle, FiDownload, FiCopy, FiMessageSquare, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { saveAnalysisToHistory } from '@/lib/analysisHistory';
import ExportButton from '@/components/shared/ExportButton';

interface MultiAgentCollaborationProps {
  query: string;
  documents: ProcessedDocument[];
  mode: ExecutionMode;
  isDemo?: boolean;
  demoScenarioId?: string;
  customAgents?: AgentType[];
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

export default function MultiAgentCollaboration({
  query,
  documents,
  mode,
  isDemo = false,
  demoScenarioId,
  customAgents,
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
  const [copied, setCopied] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [timeoutWarning, setTimeoutWarning] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutCheckInterval = useRef<NodeJS.Timeout | null>(null);

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

  const startOrchestration = async () => {
    setIsRunning(true);
    setError('');
    setPlan('');
    setAgentActivities(new Map());
    setAgentQuestions([]);
    setSynthesisStep('');
    setSynthesis('');
    setCost(0);
    setLastActivityTime(Date.now());
    setTimeoutWarning(false);

    const requestPayload = {
      query,
      documents,
      mode,
      isDemo,
      demoScenarioId,
      customAgents,
    };

    console.log('[MultiAgentCollaboration] Sending request to orchestrator:', requestPayload);

    try {
      // Create SSE connection
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      console.log('[MultiAgentCollaboration] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start orchestration');
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
        activity.isExpanded = !activity.isExpanded;
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
    if (agent.includes('Clinical') || agent.includes('Data')) return '🔬';
    if (agent.includes('Patent')) return '⚖️';
    if (agent.includes('Financial')) return '💰';
    if (agent.includes('Regulatory')) return '📋';
    if (agent.includes('Market')) return '📊';
    return '🤖';
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Clinical') || agent.includes('Data')) return 'from-blue-50 to-blue-100 border-blue-300';
    if (agent.includes('Patent')) return 'from-purple-50 to-purple-100 border-purple-300';
    if (agent.includes('Financial')) return 'from-green-50 to-green-100 border-green-300';
    if (agent.includes('Regulatory')) return 'from-orange-50 to-orange-100 border-orange-300';
    if (agent.includes('Market')) return 'from-teal-50 to-teal-100 border-teal-300';
    return 'from-gray-50 to-gray-100 border-gray-300';
  };

  const getAgentTextColor = (agent: string) => {
    if (agent.includes('Clinical') || agent.includes('Data')) return 'text-blue-900';
    if (agent.includes('Patent')) return 'text-purple-900';
    if (agent.includes('Financial')) return 'text-green-900';
    if (agent.includes('Regulatory')) return 'text-orange-900';
    if (agent.includes('Market')) return 'text-teal-900';
    return 'text-gray-900';
  };

  const getProgressPercentage = () => {
    if (synthesis) return 100;
    if (synthesisStep) return 90;
    if (agentActivities.size === 0) return 0;

    const totalAgents = customAgents?.length || 3;
    const completedAgents = Array.from(agentActivities.values()).filter(a => a.status === 'complete').length;
    return (completedAgents / totalAgents) * 80;
  };

  const generateExportContent = () => {
    const timestamp = new Date().toLocaleString();
    const agentList = Array.from(agentActivities.keys()).join(', ');

    return `# Multi-Agent Analysis Report

**Generated:** ${timestamp}
**Query:** ${query}
**Mode:** ${mode}
**Agents:** ${agentList}
${cost > 0 ? `**Cost:** $${cost.toFixed(2)}` : ''}

---

${synthesis}

---

*Generated by Multi-Agent AI Analysis System*
`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateExportContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadMarkdown = () => {
    const content = generateExportContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Agent Analysis</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{query}</span>
            </p>
            {documents.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Documents: {documents.map(d => d.fileName).join(', ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {mode === 'fast' ? <FiZap className="w-4 h-4" /> : <FiClock className="w-4 h-4" />}
                <span className="font-medium capitalize">{mode} Mode</span>
              </div>
              {estimatedCost && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <FiDollarSign className="w-3 h-3" />
                  <span>Est. {estimatedCost}</span>
                </div>
              )}
            </div>
            {!isRunning && !synthesis && (
              <button
                onClick={startOrchestration}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
              >
                <FiPlay className="w-4 h-4" />
                Start Analysis
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && !synthesis && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Analysis Progress</span>
              <span className="font-semibold">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>

            {/* Timeout Warning */}
            {timeoutWarning && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                <FiClock className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Analysis is taking longer than expected...</p>
                  <p className="text-xs mt-1">Still processing. This may take a few more minutes.</p>
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
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={activity.status === 'complete' ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                    {activity.agent.split(' ')[0]}
                  </span>
                  {activity.lastUpdate && activity.status === 'thinking' && (
                    <span className="text-xs text-gray-400">
                      {getTimeSinceLastUpdate(activity)}
                    </span>
                  )}
                </div>
              ))}
              {synthesisStep && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-900 font-medium">Synthesis</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Plan */}
        {plan && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900">Execution Plan:</p>
            <p className="text-sm text-blue-700 mt-1">{plan}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Agent Activities */}
      {agentActivities.size > 0 && (
        <div className="space-y-4 mb-6">
          {Array.from(agentActivities.values()).map((activity) => (
            <div
              key={activity.agent}
              className={`bg-gradient-to-br ${getAgentColor(activity.agent)} rounded-lg border-2 shadow-sm transition-all duration-300`}
            >
              {/* Agent Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getAgentIcon(activity.agent)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className={`font-bold text-lg ${getAgentTextColor(activity.agent)}`}>
                          {activity.agent}
                        </h4>
                        {activity.status === 'thinking' && (
                          <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium animate-pulse">
                            Analyzing...
                          </span>
                        )}
                        {activity.status === 'complete' && (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {activity.currentThought && activity.status === 'thinking' && (
                        <p className="text-sm text-gray-700 italic mb-3 bg-white/50 p-2 rounded">
                          💭 {activity.currentThought}
                        </p>
                      )}

                      {activity.response && (
                        <div className={`mt-3 ${activity.isExpanded ? '' : 'max-h-32 overflow-hidden relative'}`}>
                          <div className="prose prose-sm max-w-none bg-white/60 p-4 rounded-lg">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {activity.response}
                            </ReactMarkdown>
                          </div>
                          {!activity.isExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {activity.response && (
                    <button
                      onClick={() => toggleAgentExpansion(activity.agent)}
                      className="ml-3 p-2 hover:bg-white/50 rounded-md transition-colors"
                    >
                      {activity.isExpanded ? (
                        <FiChevronUp className="w-5 h-5" />
                      ) : (
                        <FiChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Interactive Chat Section */}
                {activity.status === 'complete' && activity.isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex items-center gap-2 mb-3">
                      <FiMessageSquare className="w-4 h-4 text-gray-600" />
                      <h5 className="text-sm font-semibold text-gray-700">Ask Follow-up Questions</h5>
                    </div>

                    {/* Chat Messages */}
                    {activity.chatMessages && activity.chatMessages.length > 0 && (
                      <div className="mb-3 space-y-2 max-h-64 overflow-y-auto">
                        {activity.chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-white border-l-4 border-blue-500 ml-8'
                                : 'bg-gray-50 border border-gray-200 mr-8'
                            }`}
                          >
                            <div className={`text-xs mb-1 ${msg.role === 'user' ? 'text-blue-600 font-medium' : 'text-gray-600 font-medium'}`}>
                              {msg.role === 'user' ? 'You' : activity.agent}
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
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
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        onClick={() => sendChatToAgent(activity.agent)}
                        disabled={activity.isProcessingChat || !activity.chatInput?.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {activity.isProcessingChat ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiSend className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
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
        <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">Synthesis in Progress</p>
              <p className="text-sm text-indigo-700 mt-1">{synthesisStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Final Synthesis */}
      {synthesis && (
        <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FiCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Analysis Complete</h3>
            {cost > 0 && (
              <span className="ml-auto text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                Cost: ${cost.toFixed(4)}
              </span>
            )}
          </div>

          {/* Export Actions */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <ExportButton
              messages={[
                { role: 'user', content: query, timestamp: new Date() },
                { role: 'assistant', content: synthesis, timestamp: new Date(), cost }
              ]}
              agentName="Multi-Agent Analysis"
            />
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              {copied ? (
                <>
                  <FiCheck className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <FiDownload className="w-4 h-4" />
              <span>Download Markdown</span>
            </button>
          </div>

          <div className="prose prose-sm max-w-none bg-white p-5 rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {synthesis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
