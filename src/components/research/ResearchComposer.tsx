import { useState, useRef, useEffect } from 'react';
import { Search, Zap, Clock, Upload } from 'lucide-react';

interface ResearchComposerProps {
  onStart: (target: string, mode: 'fast' | 'thorough') => void;
  initialQuery?: string;
}

const EXAMPLE_CHIPS = ['CDCP1', 'TROP2', 'KRAS G12C'];

export function ResearchComposer({ onStart, initialQuery }: ResearchComposerProps) {
  const [target, setTarget] = useState(initialQuery ?? '');
  const [mode, setMode] = useState<'fast' | 'thorough'>('fast');
  const [uploadTooltipVisible, setUploadTooltipVisible] = useState(false);
  const tooltipRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialQuery if parent passes one
  useEffect(() => {
    if (initialQuery) setTarget(initialQuery);
  }, [initialQuery]);

  const handleStart = () => {
    const trimmed = target.trim();
    if (!trimmed) return;
    onStart(trimmed, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleStart();
  };

  const showUploadTooltip = () => {
    if (tooltipRef.current) clearTimeout(tooltipRef.current);
    setUploadTooltipVisible(true);
    tooltipRef.current = setTimeout(() => setUploadTooltipVisible(false), 2000);
  };

  return (
    <div className="w-full">
      {/* Radial atmosphere behind composer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 760,
          height: 220,
          background: 'radial-gradient(ellipse at center, rgba(29,78,216,.07), transparent 68%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Composer shell - liquid-glass gradient border */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(120deg,rgba(29,78,216,.55),rgba(29,78,216,.12) 60%,rgba(29,78,216,.04))',
          padding: '1.5px',
          borderRadius: 17,
          boxShadow: '0 0 0 4px rgba(29,78,216,.10), 0 6px 22px rgba(15,23,42,.06)',
        }}
      >
        <div className="bg-surface rounded-[15.5px]">
          {/* Input row */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            {/* Disabled upload button */}
            <div className="relative flex-none">
              <button
                type="button"
                disabled
                onClick={showUploadTooltip}
                aria-label="Upload document (coming soon)"
                className="w-[42px] h-[42px] flex items-center justify-center rounded-[11px] bg-subtle border border-border text-textSecondary cursor-not-allowed opacity-60"
              >
                <Upload className="w-[19px] h-[19px]" />
              </button>
              {uploadTooltipVisible && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-ink text-white text-xs font-medium whitespace-nowrap z-50 pointer-events-none"
                  style={{ boxShadow: '0 4px 12px rgba(15,23,42,.22)' }}
                >
                  Coming soon
                  <span
                    aria-hidden="true"
                    className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink"
                  />
                </div>
              )}
            </div>

            {/* Text input */}
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What should Sonny research?"
              className="flex-1 bg-transparent text-textPrimary placeholder:text-textTertiary outline-none"
              style={{ font: '400 17px var(--font-sans, Geist, sans-serif)', padding: '13px 0' }}
              autoFocus
            />

            {/* Enter hint */}
            <span className="hidden sm:inline-flex items-center gap-1.5 text-textSecondary" style={{ fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
              <kbd className="border border-border rounded px-1.5 py-0.5 text-textSecondary bg-surface font-semibold" style={{ fontSize: 11 }}>
                &#8629;
              </kbd>
              to run
            </span>
          </div>

          {/* Mode toggle + run button row */}
          <div className="flex items-center gap-3 px-3 pb-3">
            {/* Mode toggle */}
            <div className="flex gap-0.5 bg-subtle border border-border rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setMode('fast')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'fast'
                    ? 'bg-white border border-border text-textPrimary shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Fast
              </button>
              <button
                type="button"
                onClick={() => setMode('thorough')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'thorough'
                    ? 'bg-white border border-border text-textPrimary shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Thorough
              </button>
            </div>

            {/* Run button - tactile */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!target.trim()}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'rgb(29 78 216)',
                boxShadow: '0 1px 2px rgba(29,78,216,.35)',
              }}
              onMouseEnter={(e) => {
                if (!target.trim()) return;
                (e.currentTarget as HTMLButtonElement).style.background = 'rgb(30 64 175)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgb(29 78 216)';
              }}
            >
              <Search className="w-4 h-4" />
              Research
            </button>
          </div>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex items-center gap-2 mt-3.5 flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
        <span className="text-textSecondary font-medium" style={{ fontSize: 11 }}>Quick target</span>
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setTarget(chip)}
            className="px-3 py-1.5 rounded-full bg-surface border border-border text-textSecondary hover:text-textPrimary hover:border-primary/30 transition-colors text-sm font-semibold"
            style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ResearchComposer;
