import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface HeroSkillCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  onClick: () => void;
  isLoading?: boolean;
  badge?: string; // e.g., "AI-Powered", "Real-time"
}

export const HeroSkillCard: React.FC<HeroSkillCardProps> = ({
  title,
  description,
  icon: Icon,
  themeColor,
  onClick,
  isLoading = false,
  badge,
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  };

  const badgeColorClasses = {
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
    green: 'bg-green-500/20 text-green-300',
    cyan: 'bg-cyan-500/20 text-cyan-300',
    orange: 'bg-orange-500/20 text-orange-300',
    emerald: 'bg-emerald-500/20 text-emerald-300',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative w-full p-5 rounded-xl border-2
        bg-gradient-to-br ${colorClasses[themeColor]}
        backdrop-blur-sm transition-all duration-300
        text-left group cursor-pointer
        disabled:opacity-50 disabled:cursor-wait
      `}
    >
      {/* Badge */}
      {badge && (
        <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full
          ${badgeColorClasses[themeColor]} font-medium`}>
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-lg mb-4 flex items-center justify-center
        bg-gradient-to-br from-white/10 to-white/5
        ${iconColorClasses[themeColor]}
      `}>
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90">
        {title}
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed">
        {description}
      </p>

      {/* Hover Arrow */}
      <motion.div
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ x: -5 }}
        whileHover={{ x: 0 }}
      >
        <svg className={`w-5 h-5 ${iconColorClasses[themeColor]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </motion.div>
    </motion.button>
  );
};

