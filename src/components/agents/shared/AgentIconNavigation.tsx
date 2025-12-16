import React from 'react';
import { motion } from 'framer-motion';
import { AGENT_INFO } from '../../../lib/customAgentTeams';
import type { AgentType } from '../../../lib/multiAgentTypes';

const SONNY_INFO = {
  name: 'Sonny',
  icon: '🤖',
  description: 'Chief Orchestrator',
};

interface AgentIconNavigationProps {
  currentAgent: AgentType | 'sonny';
  onAgentSelect: (agent: AgentType | 'sonny') => void;
  className?: string;
}

const AGENT_COLORS: Record<AgentType | 'sonny', string> = {
  sonny: 'primary',
  clinical: 'blue',
  patent: 'purple',
  financial: 'green',
  market_research: 'teal',
  regulatory: 'orange',
  target_biology: 'emerald',
};

// Get theme color classes helper
const getThemeClasses = (color: string) => {
  const colorMap: Record<string, {
    bg: string;
    border: string;
    text: string;
    hover: string;
  }> = {
    primary: {
      bg: 'bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-500/30',
      border: 'border-purple-500/50',
      text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400',
      hover: 'hover:from-purple-600/40 hover:via-blue-600/40 hover:to-cyan-500/40',
    },
    blue: {
      bg: 'bg-blue-600/30',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      hover: 'hover:bg-blue-600/40',
    },
    purple: {
      bg: 'bg-purple-600/30',
      border: 'border-purple-500/50',
      text: 'text-purple-400',
      hover: 'hover:bg-purple-600/40',
    },
    green: {
      bg: 'bg-green-600/30',
      border: 'border-green-500/50',
      text: 'text-green-400',
      hover: 'hover:bg-green-600/40',
    },
    teal: {
      bg: 'bg-teal-600/30',
      border: 'border-teal-500/50',
      text: 'text-teal-400',
      hover: 'hover:bg-teal-600/40',
    },
    orange: {
      bg: 'bg-orange-600/30',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      hover: 'hover:bg-orange-600/40',
    },
    emerald: {
      bg: 'bg-emerald-600/30',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      hover: 'hover:bg-emerald-600/40',
    },
  };
  return colorMap[color] || colorMap.blue;
};

export const AgentIconNavigation: React.FC<AgentIconNavigationProps> = ({
  currentAgent,
  onAgentSelect,
  className = '',
}) => {
  const agents: Array<{ id: AgentType | 'sonny'; info: { name: string; icon: string; description: string } }> = [
    { id: 'sonny', info: SONNY_INFO },
    ...(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => ({
      id: agent,
      info: AGENT_INFO[agent],
    })),
  ];

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {agents.map((agent) => {
        const isActive = currentAgent === agent.id;
        const agentColor = AGENT_COLORS[agent.id];
        const themeClasses = getThemeClasses(agentColor);
        const isBottomTooltipAgent = agent.id === 'regulatory' || agent.id === 'market_research';

        return (
          <motion.button
            key={agent.id}
            onClick={() => onAgentSelect(agent.id)}
            className={`
              relative flex items-center justify-center
              w-12 h-12 rounded-xl
              border-2 transition-all duration-200
              ${isActive 
                ? `${themeClasses.bg} ${themeClasses.border} shadow-lg` 
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              }
              group cursor-pointer
              z-0 hover:z-50 focus-visible:z-50
            `}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            title={agent.info.name}
          >
            {/* Icon */}
            <span className={`text-2xl leading-none ${isActive ? themeClasses.text : 'text-gray-400 group-hover:text-gray-300'}`}>
              {agent.info.icon}
            </span>

            {/* Active indicator - bottom dot */}
            {isActive && (
              <motion.div
                layoutId="activeAgentIndicator"
                className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${themeClasses.bg.replace('/30', '').replace('bg-gradient-to-br', 'bg-gradient-to-r')}`}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Hover tooltip */}
            <div
              className={[
                'absolute left-1/2 -translate-x-1/2 px-2.5 py-1.5',
                'bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg',
                'text-xs font-medium text-white whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl',
                isBottomTooltipAgent ? 'top-full mt-2' : 'bottom-full mb-2',
              ].join(' ')}
            >
              {agent.info.name}
              <div
                className={[
                  'absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/95 rotate-45',
                  isBottomTooltipAgent ? '-top-1 border-l border-t' : '-bottom-1 border-r border-b',
                  'border-white/20',
                ].join(' ')}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

