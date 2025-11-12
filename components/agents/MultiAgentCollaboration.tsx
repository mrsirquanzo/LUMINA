'use client';

import { useState, useEffect, useRef } from 'react';
import { ProcessedDocument, ExecutionMode, SSEEvent } from '@/lib/multiAgentTypes';
import { FiPlay, FiZap, FiClock, FiDollarSign, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface MultiAgentCollaborationProps {
  query: string;
  documents: ProcessedDocument[];
  mode: ExecutionMode;
  isDemo?: boolean;
  demoScenarioId?: string;
  onComplete?: (synthesis: string, cost: number) => void;
}

interface AgentActivity {
  agent: string;
  status: 'thinking' | 'speaking' | 'complete';
  currentThought?: string;
  response?: string;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agentActivities, agentQuestions, synthesisStep, synthesis]);

  const startOrchestration = async () => {
    setIsRunning(true);
    setError('');
    setPlan('');
    setAgentActivities(new Map());
    setAgentQuestions([]);
    setSynthesisStep('');
    setSynthesis('');
    setCost(0);

    const requestPayload = {
      query,
      documents,
      mode,
      isDemo,
      demoScenarioId,
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
          const next = new Map(prev);
          next.set(event.data.agent, {
            agent: event.data.agent,
            status: 'thinking',
            currentThought: event.data.task,
          });
          return next;
        });
        break;

      case 'agent_thinking':
        setAgentActivities(prev => {
          const next = new Map(prev);
          const existing = next.get(event.data.agent) || {
            agent: event.data.agent,
            status: 'thinking' as const,
          };
          next.set(event.data.agent, {
            ...existing,
            currentThought: event.data.progress,
          });
          return next;
        });
        break;

      case 'agent_response':
        setAgentActivities(prev => {
          const next = new Map(prev);
          next.set(event.data.agent, {
            agent: event.data.agent,
            status: 'complete',
            response: event.data.response,
          });
          return next;
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

  const getAgentIcon = (agent: string) => {
    if (agent.includes('Clinical')) return '🔬';
    if (agent.includes('Patent')) return '⚖️';
    if (agent.includes('Financial')) return '💰';
    return '🤖';
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Clinical')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (agent.includes('Patent')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (agent.includes('Financial')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Agent Analysis</h3>
            <p className="text-sm text-gray-600">
              Query: <span className="font-medium">{query}</span>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiPlay className="w-4 h-4" />
                Start Analysis
              </button>
            )}
          </div>
        </div>

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
              className={`p-6 bg-white rounded-lg border shadow-sm ${getAgentColor(activity.agent)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getAgentIcon(activity.agent)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{activity.agent}</h4>
                    {activity.status === 'thinking' && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                        Thinking...
                      </span>
                    )}
                    {activity.status === 'complete' && (
                      <FiCheck className="w-5 h-5 text-green-600" />
                    )}
                  </div>

                  {activity.currentThought && activity.status === 'thinking' && (
                    <p className="text-sm text-gray-600 italic mb-2">
                      {activity.currentThought}
                    </p>
                  )}

                  {activity.response && (
                    <div className="mt-3 prose prose-sm max-w-none">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap">
                        {activity.response}
                      </div>
                    </div>
                  )}
                </div>
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
              className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
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
        <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <div>
              <p className="text-sm font-medium text-indigo-900">Synthesis in Progress</p>
              <p className="text-sm text-indigo-700 mt-1">{synthesisStep}</p>
            </div>
          </div>
        </div>
      )}

      {/* Final Synthesis */}
      {synthesis && (
        <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <FiCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analysis Complete</h3>
            {cost > 0 && (
              <span className="ml-auto text-sm text-gray-600">
                Cost: ${cost.toFixed(2)}
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {synthesis}
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
