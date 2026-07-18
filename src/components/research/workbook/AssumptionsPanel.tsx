import type { WorkbookRun } from '../../../lib/workbook/types';

interface AssumptionsPanelProps {
  assumptions: WorkbookRun['assumptions'];
}

function impactClass(impact: 'high' | 'medium' | 'low') {
  if (impact === 'high') return 'border-primary/20 bg-primary/[0.045] text-primary';
  return 'border-border bg-subtle text-textTertiary';
}

export function AssumptionsPanel({ assumptions }: AssumptionsPanelProps) {
  return (
    <section className="surface-card overflow-hidden" aria-labelledby="assumptions-title">
      <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="t-eyebrow text-textTertiary">Run setup</p>
          <h2 id="assumptions-title" className="t-h3 mt-1 text-textPrimary">
            Assumptions
          </h2>
        </div>
        <div className="t-meta flex flex-wrap items-center gap-2 font-mono tabular-nums">
          <span className="rounded-full border border-border bg-subtle px-2.5 py-1 text-textSecondary">{assumptions.checked} checked</span>
          <span className="rounded-full border border-border bg-subtle px-2.5 py-1 text-textSecondary">{assumptions.inferred} inferred</span>
          <span className="rounded-full border border-primary/20 bg-primary/[0.045] px-2.5 py-1 text-primary">{assumptions.needsInput} needs input</span>
        </div>
      </header>

      <div className="divide-y divide-borderSoft">
        {assumptions.items.map((item) => (
          <article key={item.label} className="px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
              <div className="min-w-0 flex-1">
                <h3 className="t-body-sm font-semibold text-textPrimary">{item.label}</h3>
                <p className="t-body-sm mt-1 max-w-[88ch] text-textSecondary">{item.chosen}</p>
                {item.alternatives.length > 0 && (
                  <p className="t-meta mt-2 text-textTertiary">
                    <span className="font-medium text-textSecondary">Alternatives:</span> {item.alternatives.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-none flex-wrap gap-1.5 sm:max-w-[220px] sm:justify-end">
                <span className={`t-eyebrow rounded-full border px-2 py-0.5 ${impactClass(item.impact)}`}>
                  {item.impact} impact
                </span>
                <span className="t-eyebrow rounded-full border border-border bg-white px-2 py-0.5 text-textTertiary">
                  {item.source}
                </span>
                {item.status === 'needs-input' && (
                  <span className="t-eyebrow rounded-full border border-primary/20 bg-primary/[0.045] px-2 py-0.5 text-primary">
                    needs input
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
