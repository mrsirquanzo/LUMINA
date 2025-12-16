/**
 * Agent Badge Component
 * 
 * Displays a compact agent badge with icon and optional name.
 * Clickable to open agent panel with tile context.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AgentType } from '../../lib/multiAgentTypes';
import { AGENT_INFO } from '../../lib/customAgentTeams';

interface AgentBadgeProps {
  agent: AgentType | 'sonny';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  onClick?: () => void;
  className?: string;
}

// Sonny info (orchestrator)
const SONNY_INFO = {
  name: 'Sonny',
  icon: '🤖',
  color: 'primary',
};

const AgentBadge = memo(function AgentBadge({
  agent,
  size = 'sm',
  showName = false,
  onClick,
  className = '',
}: AgentBadgeProps) {
  const agentInfo = agent === 'sonny' 
    ? SONNY_INFO 
    : (AGENT_INFO[agent] || { name: 'Unknown Agent', icon: '🤖', color: 'blue' });

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-100/30',
    blue: 'bg-blue-100/20 border-blue-500/30 text-blue-400 hover:bg-blue-100/30',
    purple: 'bg-purple-100/20 border-purple-500/30 text-purple-400 hover:bg-purple-100/30',
    green: 'bg-green-100/20 border-green-500/30 text-green-400 hover:bg-green-100/30',
    orange: 'bg-orange-100/20 border-orange-500/30 text-orange-400 hover:bg-orange-100/30',
    teal: 'bg-teal-100/20 border-teal-500/30 text-teal-400 hover:bg-teal-100/30',
    primary: 'bg-primary/20 border-primary/30 text-primary hover:bg-primary/30',
  };

  const badgeColor = agent === 'sonny' 
    ? colorClasses.primary 
    : (agentInfo?.color ? colorClasses[agentInfo.color] : colorClasses.blue) || colorClasses.blue;

  return (
    <motion.button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${badgeColor}
        rounded-full border flex items-center justify-center
        transition-all cursor-pointer
        ${onClick ? 'hover:scale-110' : ''}
        ${className}
      `}
      whileHover={onClick ? { scale: 1.1 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      title={agentInfo.name}
    >
      <span className="leading-none">{agentInfo.icon}</span>
      {showName && (
        <span className="ml-1.5 text-[10px] font-medium truncate max-w-[60px]">
          {agent === 'sonny' ? 'Sonny' : agentInfo.name.split(' ')[0]}
        </span>
      )}
    </motion.button>
  );
});

AgentBadge.displayName = 'AgentBadge';

export default AgentBadge;

