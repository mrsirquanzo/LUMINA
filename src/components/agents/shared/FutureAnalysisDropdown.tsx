import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AnalysisOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  onClick?: () => void;
}

interface FutureAnalysisDropdownProps {
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  options: AnalysisOption[];
  label?: string;
}

export const FutureAnalysisDropdown: React.FC<FutureAnalysisDropdownProps> = ({
  themeColor,
  options,
  label = "More Analysis Options",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const borderColorClasses = {
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    green: 'border-green-500/20 hover:border-green-500/40',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40',
    orange: 'border-orange-500/20 hover:border-orange-500/40',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
    cyan: 'bg-cyan-500/10',
    orange: 'bg-orange-500/10',
    emerald: 'bg-emerald-500/10',
  };

  return (
    <div className={`rounded-xl border ${borderColorClasses[themeColor]} overflow-hidden transition-colors`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sparkles className={`w-5 h-5 ${iconColorClasses[themeColor]}`} />
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-3 grid grid-cols-1 gap-2">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  disabled={option.comingSoon}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${option.comingSoon
                      ? 'opacity-50 cursor-not-allowed bg-white/5'
                      : 'hover:bg-white/5 cursor-pointer'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg ${iconBgClasses[themeColor]}`}>
                    <option.icon className={`w-4 h-4 ${iconColorClasses[themeColor]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{option.label}</p>
                      {option.comingSoon && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                          <Lock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

