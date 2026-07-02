import { useState } from 'react';
import { Search, Zap, Clock } from 'lucide-react';

interface RecentRun {
  runId: string;
  target: string;
}

interface ResearchComposerProps {
  onStart: (target: string, mode: 'fast' | 'thorough') => void;
  recentRuns?: RecentRun[];
  onOpenRun?: (runId: string) => void;
}

const EXAMPLE_CHIPS = ['CDCP1', 'TROP2', 'KRAS G12C'];

export function ResearchComposer({ onStart, recentRuns, onOpenRun }: ResearchComposerProps) {
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<'fast' | 'thorough'>('thorough');

  const handleStart = () => {
    const trimmed = target.trim();
    if (!trimmed) return;
    onStart(trimmed, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Heading */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-textPrimary mb-2">Sonny Research</h2>
        <p className="text-textSecondary text-base">Ask Sonny to assess a target.</p>
      </div>

      {/* Composer card */}
      <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 shadow-sm">
        {/* Input */}
        <div className="flex items-center gap-3 bg-subtle border border-border rounded-xl px-4 py-3 mb-4 focus-within:border-primary/50 transition-colors">
          <Search className="w-5 h-5 text-textSecondary flex-shrink-0" />
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a target, gene, or drug name..."
            className="flex-1 bg-transparent text-textPrimary placeholder:text-textTertiary text-base outline-none"
            autoFocus
          />
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm text-textSecondary">Mode:</span>
          <div className="flex gap-1 bg-subtle border border-border rounded-lg p-0.5">
            <button
              onClick={() => setMode('fast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'fast'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Fast
            </button>
            <button
              onClick={() => setMode('thorough')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'thorough'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Thorough
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!target.trim()}
          className="w-full py-3 rounded-xl bg-primary/80 hover:bg-primary text-white font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
        >
          Start deep research
        </button>

        {/* Example chips */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs text-textSecondary">Try:</span>
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setTarget(chip)}
              className="px-2.5 py-1 rounded-lg bg-subtle border border-border text-xs text-textSecondary hover:text-textPrimary hover:border-primary/30 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      {recentRuns && recentRuns.length > 0 && (
        <div className="w-full max-w-2xl mt-6">
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase mb-2 px-1">Recent</p>
          <div className="space-y-1">
            {recentRuns.map((run) => (
              <button
                key={run.runId}
                onClick={() => onOpenRun?.(run.runId)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-subtle border border-border text-textSecondary hover:text-textPrimary hover:border-primary/30 transition-colors text-left"
              >
                <Clock className="w-4 h-4 flex-shrink-0 text-textSecondary" />
                <span className="text-sm">{run.target}</span>
                <span className="ml-auto text-xs text-textSecondary font-mono truncate max-w-[120px]">{run.runId}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearchComposer;
