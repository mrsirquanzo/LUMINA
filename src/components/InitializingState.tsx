/**
 * Initializing State Component
 * 
 * Shown when analysis is starting (0-10% progress).
 * Provides feedback that orchestration is beginning.
 */

import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

interface InitializingStateProps {
  target: string;
  progress: number; // 0-100
}

export default function InitializingState({ target, progress }: InitializingStateProps) {
  const getMessage = () => {
    if (progress < 3) return 'Initializing analysis...';
    if (progress < 6) return 'Preparing agents...';
    if (progress < 10) return 'Starting orchestration...';
    return 'Analysis starting...';
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-[60vh] w-full px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-md w-full">
        <motion.div
          className="bg-surfaceElevated border border-white/10 rounded-2xl p-12 text-center relative overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-cyan-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            {/* Icon with animation */}
            <motion.div
              className="flex justify-center mb-6"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Analyzing: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">{target}</span>
            </h2>

            {/* Message */}
            <p className="text-base text-gray-300 mb-6">
              {getMessage()}
            </p>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 5)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing 6 specialized agents...</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

