import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AGENT_INFO } from '../../../lib/customAgentTeams';
import type { AgentType } from '../../../lib/multiAgentTypes';

const SONNY_INFO = {
  name: 'Sonny',
  icon: '🤖',
  description: 'Coordinates all agents for comprehensive analysis',
};

interface AgentSelectorProps {
  currentAgent: AgentType | 'sonny';
  onAgentSelect: (agent: AgentType | 'sonny') => void;
  themeColor?: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  className?: string;
}

// Get theme color classes helper
const getThemeClasses = (color: string) => {
  const colorMap: Record<string, {
    bgLight: string;
    border: string;
  }> = {
    blue: {
      bgLight: 'bg-blue-600/20',
      border: 'border-blue-500',
    },
    purple: {
      bgLight: 'bg-purple-600/20',
      border: 'border-purple-500',
    },
    green: {
      bgLight: 'bg-green-600/20',
      border: 'border-green-500',
    },
    cyan: {
      bgLight: 'bg-cyan-600/20',
      border: 'border-cyan-500',
    },
    orange: {
      bgLight: 'bg-orange-600/20',
      border: 'border-orange-500',
    },
    emerald: {
      bgLight: 'bg-emerald-600/20',
      border: 'border-emerald-500',
    },
  };
  return colorMap[color] || colorMap.blue;
};

const AGENT_COLORS: Record<AgentType | 'sonny', string> = {
  sonny: 'primary',
  clinical: 'blue',
  patent: 'purple',
  financial: 'green',
  market_research: 'teal',
  regulatory: 'orange',
  target_biology: 'emerald',
};

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  currentAgent,
  onAgentSelect,
  themeColor = 'blue',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentAgentInfo = currentAgent === 'sonny' 
    ? SONNY_INFO 
    : { ...AGENT_INFO[currentAgent], icon: AGENT_INFO[currentAgent].icon };

  const themeClasses = getThemeClasses(themeColor);

  const handleAgentClick = (agent: AgentType | 'sonny') => {
    onAgentSelect(agent);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-surfaceElevated border border-border rounded-lg text-left flex items-center justify-between transition-colors ${
          isOpen ? themeClasses.border : ''
        } hover:border-border`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{currentAgentInfo.icon}</span>
          <span className="text-textPrimary font-medium">{currentAgentInfo.name}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-textSecondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-surfaceElevated border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Sonny Option */}
            <button
              onClick={() => handleAgentClick('sonny')}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors"
            >
              <span className="text-lg">{SONNY_INFO.icon}</span>
              <div className="flex-1">
                <div className="text-textPrimary font-medium">{SONNY_INFO.name}</div>
                <div className="text-xs text-textSecondary">{SONNY_INFO.description}</div>
              </div>
            </button>
            
            {/* Individual Agent Options */}
            {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
              const agentInfo = AGENT_INFO[agent];
              const agentColor = AGENT_COLORS[agent];
              const agentThemeClasses = getThemeClasses(agentColor);
              
              return (
                <button
                  key={agent}
                  onClick={() => handleAgentClick(agent)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-surface transition-colors ${
                    currentAgent === agent ? `${agentThemeClasses.bgLight} border-l-4 ${agentThemeClasses.border}` : ''
                  }`}
                >
                  <span className="text-lg">{agentInfo.icon}</span>
                  <div className="flex-1">
                    <div className="text-textPrimary font-medium">{agentInfo.name}</div>
                    <div className="text-xs text-textSecondary">{agentInfo.description}</div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

