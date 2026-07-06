import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Microscope,
  Scale,
  Radar,
  BookOpen,
  Activity,
  Target,
  type LucideIcon,
} from 'lucide-react';

interface LandingAnimationProps {
  /** Called once when a non-looping run finishes fading out. */
  onComplete?: () => void;
  /** Called when the user hits Skip (only rendered when provided and not looping). */
  onSkip?: () => void;
  /** When true, the sequence restarts forever instead of completing. Portfolio/hero use. */
  loop?: boolean;
}

// The orbiting nodes are Sonny's skills + the live data sources it grounds on -
// NOT the retired multi-agent roster. Skills = what Sonny can do; sources = where
// its evidence comes from (the tools engineDeps actually wires).
type NodeKind = 'skill' | 'source';
interface OrbitNode {
  key: string;
  label: string;
  kind: NodeKind;
  Icon: LucideIcon;
}

// Alternating skill/source around the ring for visual rhythm.
const NODES: OrbitNode[] = [
  { key: 'deep-research', label: 'Deep research', kind: 'skill', Icon: Microscope },
  { key: 'europe-pmc', label: 'Europe PMC', kind: 'source', Icon: BookOpen },
  { key: 'patent', label: 'Patent & IP', kind: 'skill', Icon: Scale },
  { key: 'trials', label: 'ClinicalTrials', kind: 'source', Icon: Activity },
  { key: 'feed', label: 'Live feed', kind: 'skill', Icon: Radar },
  { key: 'open-targets', label: 'Open Targets', kind: 'source', Icon: Target },
];

const PARTICLE_COUNT = 44;

// Locked design system: trust-blue accent + slate, on a light slate page.
const SKILL_COLOR = '#1D4ED8'; // trust blue
const SOURCE_COLOR = '#475569'; // slate-600
const INK = '#0F172A';

type Phase = 'particles' | 'logo' | 'agents' | 'tagline' | 'fadeout';

export const LandingAnimation: React.FC<LandingAnimationProps> = ({
  onComplete,
  onSkip,
  loop = false,
}) => {
  const [phase, setPhase] = useState<Phase>('particles');
  const [cycle, setCycle] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ id: number; initialX: number; initialY: number; opacity: number }>
  >([]);
  const [showSkip, setShowSkip] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Track the layout viewport (excludes scrollbars) for true visual centering.
  useEffect(() => {
    const updateSize = () => {
      const width = document.documentElement?.clientWidth || window.innerWidth;
      const height = document.documentElement?.clientHeight || window.innerHeight;
      setWindowSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Seed particles whenever the viewport (or cycle) changes.
  useEffect(() => {
    if (windowSize.width === 0 || windowSize.height === 0) return;
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        initialX: Math.random() * windowSize.width,
        initialY: Math.random() * windowSize.height,
        opacity: Math.random() * 0.4 + 0.2,
      }))
    );
  }, [windowSize, cycle]);

  // Reduced-motion: skip straight to the composed frame, no timeline, no loop churn.
  useEffect(() => {
    if (!prefersReducedMotion) return;
    if (windowSize.width === 0 || windowSize.height === 0) return;
    setPhase('tagline');
  }, [prefersReducedMotion, windowSize]);

  // Animation timeline. Re-runs each cycle (loop) via the `cycle` dependency.
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (windowSize.width === 0 || windowSize.height === 0) return;

    setPhase('particles');
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('logo'), 1000));
    timers.push(setTimeout(() => setPhase('agents'), 2800));
    timers.push(setTimeout(() => setPhase('tagline'), 5200));
    timers.push(setTimeout(() => setPhase('fadeout'), 8500));
    timers.push(
      setTimeout(() => {
        if (loop) {
          setCycle((c) => c + 1);
        } else {
          onComplete?.();
        }
      }, 10500)
    );

    if (!loop && onSkip) {
      timers.push(setTimeout(() => setShowSkip(true), 2000));
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete, onSkip, loop, windowSize, cycle, prefersReducedMotion]);

  const stageCenterX = windowSize.width / 2;
  const stageCenterY = windowSize.height / 2;

  // Responsive orbit radius so nodes surround the wordmark without crowding it.
  const orbitRadius = Math.min(
    210,
    Math.max(140, Math.round(Math.min(windowSize.width, windowSize.height) * 0.19))
  );
  const stageSize = orbitRadius * 2 + 240;

  const getNodeOffset = (index: number) => {
    const angle = (index * (2 * Math.PI)) / NODES.length - Math.PI / 2;
    return {
      dx: Math.cos(angle) * orbitRadius,
      dy: Math.sin(angle) * orbitRadius,
    };
  };

  if (windowSize.width === 0 || windowSize.height === 0) {
    return null;
  }

  const logoVisible =
    phase === 'logo' || phase === 'agents' || phase === 'tagline';
  const nodesVisible = phase === 'agents' || phase === 'tagline';

  return (
    <AnimatePresence>
      <motion.div
        key={cycle}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(29,78,216,0.07), rgba(246,248,251,0) 58%), #F6F8FB',
        }}
      >
        {/* Whisper grain + fine atmosphere - fixed layer, no scroll repaint cost. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            opacity: 0.5,
          }}
          aria-hidden="true"
        />

        {/* Converging signal particles (blue on light) */}
        {(phase === 'particles' || phase === 'logo') && (
          <div className="absolute inset-0">
            {particles.map((particle) => {
              const deltaX = stageCenterX - particle.initialX;
              const deltaY = stageCenterY - particle.initialY;
              return (
                <motion.div
                  key={particle.id}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    left: particle.initialX,
                    top: particle.initialY,
                    backgroundColor: SKILL_COLOR,
                  }}
                  animate={{
                    x: phase === 'logo' ? deltaX : 0,
                    y: phase === 'logo' ? deltaY : 0,
                    opacity:
                      phase === 'logo'
                        ? [particle.opacity, 0.9, 0]
                        : particle.opacity,
                    scale: phase === 'logo' ? [1, 1.4, 0] : 1,
                  }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              );
            })}
          </div>
        )}

        {/* Centered stage (wordmark + orbit) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative" style={{ width: `${stageSize}px`, height: `${stageSize}px` }}>
            {/* Wordmark. Do NOT use Tailwind translate classes on motion.* elements -
                Framer writes `transform` when animating scale/opacity and would clobber centering. */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: phase === 'fadeout' ? 0 : logoVisible ? 1 : 0,
                  scale: phase === 'fadeout' ? 0.98 : logoVisible ? 1 : 0.6,
                  display: phase === 'particles' ? 'none' : 'block',
                }}
                transition={{ duration: phase === 'fadeout' ? 1.6 : 0.9, ease: 'easeOut' }}
              >
                {/* Soft blue underglow */}
                <motion.div
                  className="absolute inset-0 blur-3xl -z-10"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(29,78,216,0.18), rgba(29,78,216,0.05), transparent 70%)',
                    width: '420px',
                    height: '420px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{ scale: logoVisible ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Newsreader wordmark, ink - the "published finding" voice */}
                <h1
                  className="font-display text-7xl font-semibold tracking-tight select-none"
                  style={{ color: INK, letterSpacing: '-0.02em' }}
                >
                  LUMINA
                </h1>
              </motion.div>
            </div>

            {/* Orbiting skill / source nodes */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              {NODES.map((node, index) => {
                const { dx, dy } = getNodeOffset(index);
                const color = node.kind === 'skill' ? SKILL_COLOR : SOURCE_COLOR;
                const { Icon } = node;
                return (
                  <div
                    key={node.key}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0, scale: 0, x: dx, y: dy }}
                      animate={{
                        opacity: phase === 'fadeout' ? 0 : nodesVisible ? 1 : 0,
                        scale:
                          phase === 'fadeout'
                            ? 0
                            : phase === 'agents'
                              ? [1, 1.1, 1]
                              : nodesVisible
                                ? 1
                                : 0,
                        x: dx,
                        y: dy,
                      }}
                      transition={{
                        duration: phase === 'fadeout' ? 1.4 : 0.8,
                        delay: phase === 'fadeout' ? 0 : index * 0.24,
                        ease: 'easeOut',
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white"
                        style={{
                          border: `1.5px solid ${color}33`,
                          boxShadow: `0 6px 20px ${color}1F, 0 1px 2px rgba(15,23,42,0.05)`,
                        }}
                      >
                        <Icon size={22} strokeWidth={1.75} style={{ color }} />
                      </div>
                      <span
                        className="text-[11px] font-medium whitespace-nowrap"
                        style={{ color: node.kind === 'skill' ? SKILL_COLOR : '#64748B' }}
                      >
                        {node.label}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tagline - Newsreader italic, editorial voice */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 whitespace-nowrap">
          <motion.p
            className="font-display italic text-xl tracking-wide"
            style={{ color: '#475569' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: phase === 'fadeout' ? 0 : phase === 'tagline' ? 1 : 0,
              y: phase === 'fadeout' ? 8 : phase === 'tagline' ? 0 : 16,
            }}
            transition={{ duration: phase === 'fadeout' ? 1.4 : 0.8, ease: 'easeOut' }}
          >
            Grounded biotech intelligence
          </motion.p>
        </div>

        {/* Skip - only for a gated (non-looping) intro */}
        <AnimatePresence>
          {showSkip && onSkip && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onSkip}
              className="absolute bottom-8 right-8 px-4 py-2 rounded-lg bg-white border border-border text-textSecondary hover:text-textPrimary text-sm font-medium transition-colors z-30 flex items-center gap-2 tactile"
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
