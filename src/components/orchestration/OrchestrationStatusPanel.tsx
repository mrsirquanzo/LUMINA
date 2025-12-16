/**
 * OrchestrationStatusPanel Component
 * 
 * Displays real-time status of multi-agent orchestration.
 * Shows which agents are working, queued, or complete.
 * This is the "magic moment" visualization.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Clock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import type { AgentType } from '../../lib/multiAgentTypes';
import { AGENT_INFO } from '../../lib/customAgentTeams';
import type { AgentStatus } from '@/lib/orchestration/demoOrchestrationEngine';

export type { AgentStatus };

interface OrchestrationStatusPanelProps {
  target: string;
  agents: AgentStatus[];
  overallProgress: number; // 0-100
  onAgentComplete?: (agent: AgentType, result: any) => void;
  className?: string;
}

// Agent color mapping
const AGENT_COLORS: Record<AgentType, string> = {
  clinical: 'blue',
  patent: 'purple',
  financial: 'green',
  regulatory: 'orange',
  market_research: 'teal',
  target_biology: 'emerald',
};

// Agent to tile mapping (which tile each agent generates)
const AGENT_TILE_MAP: Record<AgentType, string> = {
  target_biology: 'Genetic Validation',
  clinical: 'Clinical Precedent',
  patent: 'IP & FTO',
  financial: 'Deal Landscape',
  market_research: 'Market Opportunity',
  regulatory: 'Regulatory Pathway',
};

export default function OrchestrationStatusPanel({
  target,
  agents,
  overallProgress,
  onAgentComplete,
  className = '',
}: OrchestrationStatusPanelProps) {
  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'running':
        return <Loader2 size={16} className="text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'queued':
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: AgentStatus['status'], agentColor: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      green: 'text-green-400',
      orange: 'text-orange-400',
      teal: 'text-teal-400',
      emerald: 'text-emerald-400',
    };
    
    switch (status) {
      case 'complete':
        return 'text-emerald-400';
      case 'running':
        return colorMap[agentColor] || 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'queued':
      default:
        return 'text-gray-500';
    }
  };

  const getAgentTheme = (agent: AgentType) => {
    const color = AGENT_COLORS[agent];
    const themeMap: Record<string, { bg: string; border: string; text: string; progress: string }> = {
      blue: {
        bg: 'bg-blue-600/20',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        progress: 'bg-blue-500',
      },
      purple: {
        bg: 'bg-purple-600/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        progress: 'bg-purple-500',
      },
      green: {
        bg: 'bg-green-600/20',
        border: 'border-green-500/30',
        text: 'text-green-400',
        progress: 'bg-green-500',
      },
      orange: {
        bg: 'bg-orange-600/20',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        progress: 'bg-orange-500',
      },
      teal: {
        bg: 'bg-teal-600/20',
        border: 'border-teal-500/30',
        text: 'text-teal-400',
        progress: 'bg-teal-500',
      },
      emerald: {
        bg: 'bg-emerald-600/20',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        progress: 'bg-emerald-500',
      },
    };
    return themeMap[color] || themeMap.blue;
  };

  return (
    <div className={`flex flex-col space-y-4 w-full max-w-full box-border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Analyzing: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">{target}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Six specialized agents working in parallel
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{Math.round(overallProgress)}%</div>
          <div className="text-xs text-gray-400">Complete</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="w-full h-2 bg-surfaceElevated rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Agent Status List */}
      <div className="space-y-3">
        <AnimatePresence>
          {agents.map((agentStatus) => {
            const agentInfo = AGENT_INFO[agentStatus.agent];
            const theme = getAgentTheme(agentStatus.agent);
            const tileName = AGENT_TILE_MAP[agentStatus.agent];

            return (
              <motion.div
                key={agentStatus.agent}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-lg border w-full max-w-full box-border ${
                  agentStatus.status === 'complete'
                    ? `${theme.bg} ${theme.border}`
                    : 'bg-surfaceElevated border-white/10'
                } transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{agentInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {agentInfo.name}
                        </h4>
                        {getStatusIcon(agentStatus.status)}
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {agentStatus.status === 'complete'
                          ? `✓ ${tileName} tile generated`
                          : agentStatus.status === 'running'
                          ? agentStatus.message || `Analyzing ${target}...`
                          : agentStatus.status === 'error'
                          ? 'Error occurred'
                          : 'Waiting to start...'}
                      </p>
                    </div>
                  </div>
                  {agentStatus.status === 'running' && (
                    <div className="text-xs text-gray-300 flex-shrink-0 ml-2">
                      {Math.round(agentStatus.progress)}%
                    </div>
                  )}
                </div>

                {/* Individual Agent Progress Bar */}
                {agentStatus.status === 'running' && (
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mt-2">
                    <motion.div
                      className={`h-full ${theme.progress}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${agentStatus.progress}%` }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  </div>
                )}

                {/* Completion Animation with Visual Connection Indicator */}
                {agentStatus.status === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">
                          {tileName} tile appearing on dashboard
                        </span>
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-emerald-400"
                      >
                        <ArrowRight size={12} />
                      </motion.div>
                    </div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-emerald-400"
                    >
                      <Sparkles size={12} />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Message */}
      {overallProgress < 100 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            {overallProgress === 0
              ? 'Initializing agents...'
              : overallProgress < 50
              ? 'Agents are analyzing in parallel...'
              : overallProgress < 90
              ? 'Synthesizing insights...'
              : 'Finalizing analysis...'}
          </p>
        </div>
      )}

      {overallProgress === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2"
        >
          <p className="text-sm font-semibold text-emerald-400">
            ✓ Analysis Complete
          </p>
          <p className="text-xs text-gray-300 mt-1">
            All tiles have been generated on your dashboard
          </p>
        </motion.div>
      )}
    </div>
  );
}

