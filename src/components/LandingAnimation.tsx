import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AGENT_INFO } from '../lib/customAgentTeams';
import type { AgentType } from '../lib/multiAgentTypes';

interface LandingAnimationProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Agent colors mapping (matching SonnySidePanel.tsx)
const AGENT_COLORS: Record<AgentType, string> = {
  clinical: '#3b82f6', // blue-500
  patent: '#a78bfa', // purple-400
  financial: '#10b981', // green-500
  regulatory: '#f59e0b', // orange-500
  market_research: '#14b8a6', // teal-500
  target_biology: '#10b981', // emerald-500
};

// Agent order for orbit animation
const AGENT_ORDER: AgentType[] = [
  'target_biology',
  'clinical',
  'patent',
  'regulatory',
  'market_research',
  'financial',
];

const PARTICLE_COUNT = 50;
const ORBIT_RADIUS = 120;
const LOGO_GRADIENT_START = '#BF5AF2'; // Purple
const LOGO_GRADIENT_END = '#FF9F0A'; // Orange

export const LandingAnimation: React.FC<LandingAnimationProps> = ({
  onComplete,
  onSkip,
}) => {
  const [phase, setPhase] = useState<'particles' | 'logo' | 'agents' | 'tagline' | 'fadeout'>('particles');
  const [particles, setParticles] = useState<Array<{ id: number; initialX: number; initialY: number; opacity: number }>>([]);
  const [showSkip, setShowSkip] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Get window dimensions
  useEffect(() => {
    const updateSize = () => {
      // Prefer the layout viewport (excludes scrollbars) for true visual centering.
      const width = document.documentElement?.clientWidth || window.innerWidth;
      const height = document.documentElement?.clientHeight || window.innerHeight;
      setWindowSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize particles
  useEffect(() => {
    if (windowSize.width === 0 || windowSize.height === 0) return;
    
    const initialParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      initialX: Math.random() * windowSize.width,
      initialY: Math.random() * windowSize.height,
      opacity: Math.random() * 0.5 + 0.3,
    }));
    setParticles(initialParticles);
  }, [windowSize]);

  // Animation timeline - Slower, more deliberate timing
  useEffect(() => {
    if (windowSize.width === 0 || windowSize.height === 0) return;

    const timers: NodeJS.Timeout[] = [];

    // 0-1s: Particles converging (slower)
    timers.push(setTimeout(() => {
      setPhase('particles');
    }, 0));

    // 1-2.8s: Logo forming (longer duration)
    timers.push(setTimeout(() => {
      setPhase('logo');
    }, 1000));

    // 2.8-5.2s: Agent icons appear (give enough time for stagger)
    timers.push(setTimeout(() => {
      setPhase('agents');
    }, 2800));

    // 5.2-6.2s: Tagline fades in
    timers.push(setTimeout(() => {
      setPhase('tagline');
    }, 5200));

    // 8.5-10.5s: Fade out (linger, then fade)
    timers.push(setTimeout(() => {
      setPhase('fadeout');
    }, 8500));

    // 10.5s: Complete
    timers.push(setTimeout(() => {
      onComplete();
    }, 10500));

    // Show skip button after 2 seconds
    timers.push(setTimeout(() => {
      setShowSkip(true);
    }, 2000));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [onComplete, windowSize]);

  // Debug: Log phase changes
  useEffect(() => {
    console.log('[LandingAnimation] Phase changed to:', phase);
  }, [phase]);

  // Single source of truth for the landing “stage” center.
  // Using a centered wrapper keeps the logo and orbit perfectly aligned.
  const stageCenterX = windowSize.width / 2;
  const stageCenterY = windowSize.height / 2; // Center logo in the viewport

  // Responsive orbit radius so icons actually surround the wordmark (not crowd it).
  const orbitRadius = Math.min(
    190,
    Math.max(130, Math.round(Math.min(windowSize.width, windowSize.height) * 0.18))
  );
  // Size of the centered stage wrapper (needs real dimensions so 50% positioning works).
  // Includes padding for icon size + floating.
  const stageSize = orbitRadius * 2 + 220;

  // Calculate agent offsets in orbit (relative to stage center)
  const getAgentOffset = (index: number) => {
    const angle = (index * (2 * Math.PI)) / AGENT_ORDER.length - Math.PI / 2;
    return {
      dx: Math.cos(angle) * orbitRadius,
      dy: Math.sin(angle) * orbitRadius,
    };
  };

  if (windowSize.width === 0 || windowSize.height === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Particles */}
        {(phase === 'particles' || phase === 'logo') && (
          <div className="absolute inset-0">
            {particles.map((particle) => {
              const targetX = stageCenterX;
              const targetY = stageCenterY;
              const deltaX = targetX - particle.initialX;
              const deltaY = targetY - particle.initialY;
              
              return (
                <motion.div
                  key={particle.id}
                  className="absolute w-1 h-1 rounded-full bg-white"
                  style={{
                    left: particle.initialX,
                    top: particle.initialY,
                  }}
                  animate={{
                    x: phase === 'logo' ? deltaX : 0,
                    y: phase === 'logo' ? deltaY : 0,
                    opacity: phase === 'logo' ? [particle.opacity, 1, 0] : particle.opacity,
                    scale: phase === 'logo' ? [1, 1.5, 0] : 1,
                  }}
                  transition={{
                    duration: 1,
                    ease: 'easeInOut',
                    delay: phase === 'particles' ? 0 : 0,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Centered stage wrapper (logo + orbit) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            className="relative"
            style={{ width: `${stageSize}px`, height: `${stageSize}px` }}
          >
            {/* Logo */}
            {/* IMPORTANT: Do not use Tailwind translate classes on `motion.*` elements.
                Framer Motion writes `transform` when animating `scale`/`y`, which would override centering transforms. */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity: phase === 'fadeout' ? 0 : (phase === 'logo' || phase === 'agents' || phase === 'tagline' ? 1 : 0),
                  scale: phase === 'fadeout' ? 0.95 : (phase === 'logo' || phase === 'agents' || phase === 'tagline' ? 1 : 0.3),
                  display: phase === 'particles' ? 'none' : 'block',
                }}
                transition={{
                  duration: phase === 'fadeout' ? 2 : 1,
                  ease: 'easeOut',
                }}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 blur-3xl -z-10"
                  style={{
                    background: `radial-gradient(circle, ${LOGO_GRADIENT_START}40, ${LOGO_GRADIENT_END}20, transparent 70%)`,
                    width: '400px',
                    height: '400px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    scale: phase === 'logo' || phase === 'agents' || phase === 'tagline' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Logo text */}
                <motion.h1
                  className="text-7xl font-bold tracking-tight select-none"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${LOGO_GRADIENT_START}, ${LOGO_GRADIENT_END})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                    display: 'inline-block',
                  }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: phase === 'fadeout' ? 0 : (phase === 'logo' || phase === 'agents' || phase === 'tagline' ? 1 : 0),
                    scale: phase === 'fadeout' ? 0.95 : (phase === 'logo' || phase === 'agents' || phase === 'tagline' ? 1 : 0.3),
                  }}
                  transition={{
                    duration: phase === 'fadeout' ? 2 : 1,
                    ease: 'easeOut',
                  }}
                >
                  LUMINA
                </motion.h1>
              </motion.div>
            </div>

            {/* Agent Icons Orbiting (relative to centered stage) */}
            {/* NOTE: Do NOT position orbit via `transform` on a `motion.div` because Framer Motion writes its own transform.
                Instead, use a plain wrapper to center, and animate with x/y which composes safely. */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              {AGENT_ORDER.map((agentType, index) => {
                const { dx, dy } = getAgentOffset(index);
                const agentInfo = AGENT_INFO[agentType];
                const agentColor = AGENT_COLORS[agentType];
                const shouldShow = phase === 'agents' || phase === 'tagline';

                const baseX = dx;
                const baseY = dy;

                return (
                  <div
                    key={agentType}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <motion.div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm border-2 shadow-lg"
                      style={{
                        backgroundColor: `${agentColor}30`,
                        borderColor: `${agentColor}60`,
                      }}
                      initial={{ opacity: 0, scale: 0, x: baseX, y: baseY }}
                      animate={{
                        opacity: phase === 'fadeout' ? 0 : (shouldShow ? 1 : 0),
                        // Slight “pop” on entry; then hold.
                        scale: phase === 'fadeout' ? 0 : (phase === 'agents' ? [1, 1.12, 1] : shouldShow ? 1 : 0),
                        // Keep orbit position stable; float is handled by inner motion to avoid rushing visibility.
                        x: baseX,
                        y: baseY,
                        boxShadow: phase === 'fadeout'
                          ? 'none'
                          : (shouldShow
                            ? `0 0 30px ${agentColor}60, 0 0 15px ${agentColor}40`
                            : 'none'),
                      }}
                      transition={{
                        // Slower stagger so each icon is actually noticed.
                        duration: phase === 'fadeout' ? 2 : 0.9,
                        delay: index * 0.28,
                        ease: 'easeOut',
                      }}
                    >
                      {/* No per-icon motion: keep icons perfectly stable inside bubbles */}
                      <div className="flex items-center justify-center">
                        {agentInfo.icon}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap">
          <motion.p
            className="text-xl text-gray-300 font-light tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase === 'fadeout' ? 0 : (phase === 'tagline' ? 1 : 0),
              y: phase === 'fadeout' ? 10 : (phase === 'tagline' ? 0 : 20),
            }}
            transition={{
              duration: phase === 'fadeout' ? 2 : 0.8,
              delay: 0, // phase timing controls appearance
              ease: 'easeOut',
            }}
          >
            Biotech Intelligence, Accelerated
          </motion.p>
        </div>

        {/* Skip Button */}
        <AnimatePresence>
          {showSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onSkip}
              className="absolute bottom-8 right-8 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors z-30 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Skip
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default LandingAnimation;
