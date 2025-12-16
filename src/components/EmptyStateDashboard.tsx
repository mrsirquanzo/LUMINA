/**
 * Empty State Dashboard Component
 * 
 * Shown when no analysis has been run and no tiles exist.
 * Provides clear CTA and quick start options.
 */

import { motion } from 'framer-motion';
import { Sparkles, Target } from 'lucide-react';

interface EmptyStateDashboardProps {
  onQuickStart: (target: string) => void;
}

const QUICK_START_TARGETS = [
  { id: 'trop2', name: 'TROP2', description: 'ADC target' },
  { id: 'her2', name: 'HER2', description: 'Oncogene' },
];

export default function EmptyStateDashboard({
  onQuickStart,
}: EmptyStateDashboardProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
      },
    },
  };

  const subtitle = 'Search above or pick a quick start.';

  return (
    <motion.div
      className="relative flex items-center justify-center min-h-[60vh] w-full px-6 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(191,90,242,0.12),transparent_55%),radial-gradient(circle_at_bottom,rgba(34,211,238,0.10),transparent_55%)]" />
        <motion.div
          aria-hidden="true"
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ x: [0, -28, 0], y: [0, -16, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* subtle grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px]"
        />
      </div>

      <div className="max-w-2xl w-full text-center">
        {/* Main Card */}
        <motion.div
          variants={cardVariants}
          className="bg-surfaceElevated/60 border border-white/10 rounded-2xl p-12 mb-8 relative overflow-hidden backdrop-blur-md"
        >
          {/* Background gradient */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-cyan-500/10 pointer-events-none"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* subtle top highlight */}
          <motion.div
            aria-hidden="true"
            className="absolute -top-16 left-1/2 h-32 w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
            animate={{ opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          <div className="relative z-10">
            {/* Icon */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-6"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-primary/30 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_40px_rgba(191,90,242,0.18)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h2
              variants={itemVariants}
              className="text-3xl font-bold text-textPrimary mb-3"
            >
              LUMINA Intelligence Platform
            </motion.h2>

            {/* Message */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-textSecondary mb-8"
            >
              {subtitle}
            </motion.p>

            {/* Quick Start Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-sm text-gray-400 mb-2">Quick Start Examples:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {QUICK_START_TARGETS.map((target) => (
                  <motion.button
                    key={target.id}
                    onClick={() => onQuickStart(target.name)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-8 py-7 text-left transition-colors hover:bg-white/7"
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-1 text-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xl font-semibold tracking-tight text-textPrimary">
                        {target.name}
                      </span>
                      <span className="text-sm text-textSecondary">
                        {target.description}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

