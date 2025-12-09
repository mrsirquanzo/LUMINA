/**
 * Collapsible Section Component
 * Reusable component for collapsible/expandable sections
 */

import { useState, type ReactNode, type ComponentType } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
  badge?: {
    text: string;
    color: string;
  };
  className?: string;
}

export default function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  count,
  badge,
  className = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-white/10 last:border-b-0 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-primary" />}
          <span className="text-sm font-semibold text-textPrimary">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
              {count}
            </span>
          )}
          {badge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-textSecondary" />
        ) : (
          <ChevronRight size={16} className="text-textSecondary" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
