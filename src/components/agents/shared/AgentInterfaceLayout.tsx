import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { X, ChevronLeft } from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';
import { AgentIconNavigation } from './AgentIconNavigation';
import type { AgentType } from '../../../lib/multiAgentTypes';

interface AgentInterfaceLayoutProps {
  agentName: string;
  agentIcon: LucideIcon;
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  targetName?: string;
  onClose?: () => void;
  onExport: (format: string) => void;
  children: React.ReactNode;
  chatSection?: React.ReactNode;
  // Agent selection props
  currentAgent?: AgentType | 'sonny';
  onAgentSelect?: (agent: AgentType | 'sonny') => void;
  showAgentSelector?: boolean;
  // Navigation props
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
}

export const AgentInterfaceLayout: React.FC<AgentInterfaceLayoutProps> = ({
  agentName,
  agentIcon: AgentIcon,
  themeColor,
  targetName,
  onClose,
  onExport,
  children,
  chatSection,
  currentAgent,
  onAgentSelect,
  showAgentSelector = false,
  showBackButton = false,
  onBack,
  backButtonLabel = 'Back',
}) => {
  const headerGradients = {
    blue: 'from-blue-500/20 via-blue-600/10 to-transparent',
    purple: 'from-purple-500/20 via-purple-600/10 to-transparent',
    green: 'from-green-500/20 via-green-600/10 to-transparent',
    cyan: 'from-cyan-500/20 via-cyan-600/10 to-transparent',
    orange: 'from-orange-500/20 via-orange-600/10 to-transparent',
    emerald: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
  };

  const iconColors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/20',
    purple: 'bg-purple-500/20',
    green: 'bg-green-500/20',
    cyan: 'bg-cyan-500/20',
    orange: 'bg-orange-500/20',
    emerald: 'bg-emerald-500/20',
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="h-full flex flex-col bg-gray-900/95 backdrop-blur-xl border-l border-white/10"
    >
      {/* Header */}
      <div className={`relative px-6 py-4 bg-gradient-to-b ${headerGradients[themeColor]}`}>
        {/* Back Button - Show at top if enabled */}
        {showBackButton && onBack && (
          <div className="mb-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated/50 border border-white/10 rounded-lg hover:border-white/20 hover:bg-surfaceElevated transition-colors text-sm text-gray-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
              {backButtonLabel}
            </button>
          </div>
        )}

        {/* Agent Icon Navigation - Show if enabled */}
        {showAgentSelector && currentAgent && onAgentSelect && (
          <div className="mb-4 pb-4 border-b border-white/10">
            <AgentIconNavigation
              currentAgent={currentAgent}
              onAgentSelect={onAgentSelect}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${iconBgClasses[themeColor]}`}>
              <AgentIcon className={`w-6 h-6 ${iconColors[themeColor]}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{agentName}</h2>
              {targetName && (
                <p className="text-sm text-gray-400">Analyzing: {targetName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {children}
        
        {/* Export Section - At bottom of content, after document upload */}
        <section className="pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Export Analysis
          </h3>
          <div className="w-full">
            <ExportDropdown themeColor={themeColor} onExport={onExport} />
          </div>
        </section>
      </div>

      {/* Chat Section */}
      {chatSection && (
        <div className="border-t border-white/10 p-4">
          {chatSection}
        </div>
      )}
    </motion.div>
  );
};

