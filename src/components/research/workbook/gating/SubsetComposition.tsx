import { useGating } from './gatingStore';

const SUBSETS = [
  { key: 'naive', label: 'Naive', color: '#1d4ed8' },
  { key: 'switched', label: 'Switched memory', color: '#2f9e8f' },
  { key: 'doubleNegative', label: 'Double-negative', color: '#64748b' },
  { key: 'unswitched', label: 'Unswitched memory', color: '#d97706' },
] as const;

export function SubsetComposition() {
  const gating = useGating();

  if (!gating) {
    return <div className="surface-inset t-meta min-h-44 animate-pulse p-4 text-textTertiary">Loading real event data...</div>;
  }

  const { metrics } = gating;

  return (
    <section className="surface-inset overflow-hidden bg-white" aria-label="Live B-cell subset composition">
      <div className="grid grid-cols-2 gap-px bg-borderSoft">
        <div className="col-span-2 bg-white px-4 py-3 sm:col-span-1 sm:row-span-2">
          <p className="t-eyebrow text-textTertiary">B-cell count</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight tabular-nums text-textPrimary">
            {metrics.bCellCount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="t-eyebrow text-textTertiary">Of live singlets</p>
          <p className="t-body mt-1 font-mono font-semibold tabular-nums text-textPrimary">{metrics.bCellLivePct.toFixed(1)}%</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="t-eyebrow text-textTertiary">Viability</p>
          <p className="t-body mt-1 font-mono font-semibold tabular-nums text-textPrimary">{metrics.viabilityPct.toFixed(1)}%</p>
        </div>
      </div>

      <div className="border-t border-borderSoft px-3.5 py-3 sm:px-4">
        <div className="flex h-8 w-full overflow-hidden rounded-lg bg-subtle" aria-label="B-cell subset percentage stacked bar">
          {SUBSETS.map(({ key, label, color }) => {
            const value = metrics.subsets[key];
            return (
              <div
                key={key}
                className="flex min-w-0 items-center justify-center overflow-hidden border-r border-white/70 last:border-r-0"
                style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
                title={`${label}: ${value.toFixed(1)}%`}
              >
                {value >= 9 && (
                  <span className="t-meta truncate px-1 font-mono font-semibold tabular-nums text-white">{value.toFixed(1)}%</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {SUBSETS.map(({ key, label, color }) => (
            <div key={key} className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 flex-none rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
              <span className="t-meta min-w-0 flex-1 truncate text-textSecondary">{label}</span>
              <span className="t-meta flex-none font-mono font-semibold tabular-nums text-textPrimary">
                {metrics.subsets[key].toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="t-meta border-t border-borderSoft bg-subtle/45 px-3.5 py-2 text-textTertiary" aria-live="polite">
        IgD/CD27 subsets - current B-cell population
      </p>
    </section>
  );
}
