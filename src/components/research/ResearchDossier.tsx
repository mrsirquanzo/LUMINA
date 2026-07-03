import type { ReactElement } from 'react';
import type { BriefingView } from '../../lib/research/sseTypes.js';
import { CitedMarkdown } from '../shared/CitedMarkdown.js';

interface Props { briefing: BriefingView; }

function verdictColor(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v === 'GO') return 'text-go';
  if (v === 'NO-GO') return 'text-nogo-text';
  if (v === 'WATCH') return 'text-watch-text';
  return 'text-textPrimary';
}

function ragChipClass(rag?: 'red' | 'amber' | 'green'): string {
  if (rag === 'green') return 'bg-go-tint text-go-text border border-teal-500/30';
  if (rag === 'amber') return 'bg-watch-tint text-watch-text border border-amber-500/30';
  if (rag === 'red') return 'bg-nogo-tint text-nogo-text border border-red-500/30';
  return 'bg-subtle text-textSecondary border border-border';
}

export default function ResearchDossier({ briefing }: Props): ReactElement {
  const rec = briefing.recommendation;

  return (
    <div className="space-y-6 text-sm">

      {/* Verdict - largest text, conclusion-first */}
      {rec?.verdict && (
        <div className="text-center">
          <span className={`text-4xl font-bold tracking-tight ${verdictColor(rec.verdict)}`}>
            {rec.verdict.toUpperCase()}
          </span>
        </div>
      )}

      {/* Thesis */}
      {rec?.thesis && (
        <p className="text-base font-semibold text-textPrimary leading-snug">{rec.thesis}</p>
      )}

      {/* Executive read */}
      {briefing.executiveRead && (
        <CitedMarkdown content={briefing.executiveRead} />
      )}

      {/* Sections */}
      {(briefing.sections ?? []).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase">Analysis Sections</p>
          {briefing.sections!.map((section, i) => (
            <div
              key={section.id ?? i}
              className="bg-subtle border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                {section.rag && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ragChipClass(section.rag)}`}>
                    {section.rag}
                  </span>
                )}
                {section.title && (
                  <span className="text-sm font-semibold text-textPrimary">{section.title}</span>
                )}
              </div>
              {section.takeaway && (
                <p className="text-textSecondary mb-2">{section.takeaway}</p>
              )}
              {(section.claims ?? []).length > 0 && (
                <ul className="space-y-1">
                  {section.claims!.map((c, ci) => (
                    <li key={ci} className="text-textSecondary flex gap-1">
                      <span className="shrink-0 text-textTertiary">-</span>
                      <span>
                        {c.text ?? ''}
                        {(c.citations ?? []).length > 0 && (
                          <span className="ml-1 text-xs text-textTertiary opacity-60">
                            [{(c.citations ?? []).join(', ')}]
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bull / Bear */}
      {((rec?.bull ?? []).length > 0 || (rec?.bear ?? []).length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(rec?.bull ?? []).length > 0 && (
            <div className="bg-go-tint border border-teal-500/20 rounded-xl p-4">
              <p className="text-xs text-go-text font-semibold uppercase tracking-wider mb-2">Bull Case</p>
              <ul className="space-y-2">
                {(rec?.bull ?? []).map((b, i) => (
                  <li key={i} className="text-textSecondary flex gap-1">
                    <span className="shrink-0 text-go-text/60">+</span>
                    <span>
                      {b.point ?? ''}
                      {(b.citations ?? []).length > 0 && (
                        <span className="ml-1 text-xs text-textTertiary opacity-60">
                          [{(b.citations ?? []).join(', ')}]
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(rec?.bear ?? []).length > 0 && (
            <div className="bg-nogo-tint border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-nogo-text font-semibold uppercase tracking-wider mb-2">Bear Case</p>
              <ul className="space-y-2">
                {(rec?.bear ?? []).map((b, i) => (
                  <li key={i} className="text-textSecondary flex gap-1">
                    <span className="shrink-0 text-nogo-text/60">-</span>
                    <span>
                      {b.point ?? ''}
                      {(b.citations ?? []).length > 0 && (
                        <span className="ml-1 text-xs text-textTertiary opacity-60">
                          [{(b.citations ?? []).join(', ')}]
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Conditions */}
      {(rec?.conditions ?? []).length > 0 && (
        <div className="bg-watch-tint border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-watch-text font-semibold uppercase tracking-wider mb-2">Conditions</p>
          <ul className="space-y-1">
            {(rec?.conditions ?? []).map((cond, i) => (
              <li key={i} className="text-textSecondary flex gap-1">
                <span className="shrink-0 text-watch-text/60">*</span>
                <span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KOL terrain */}
      {(briefing.kolCluster?.labs ?? []).length > 0 && (
        <div>
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase mb-2">KOL & Institutional Terrain</p>
          <ul className="space-y-1">
            {(briefing.kolCluster?.labs ?? []).map((lab, i) => (
              <li key={i} className="text-textSecondary">
                {lab.investigator ?? ''}
                {lab.institution ? ` - ${lab.institution}` : ''}
                {lab.paperCount !== undefined ? ` (${lab.paperCount} papers)` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* References */}
      {(briefing.references ?? []).length > 0 && (
        <div>
          <p className="text-xs text-textSecondary font-medium tracking-wider uppercase mb-2">References</p>
          <ul className="space-y-1">
            {(briefing.references ?? []).map((r, i) => (
              <li key={r.id ?? i} className="flex gap-2 items-baseline">
                {r.id && (
                  <span className="font-mono text-xs text-textSecondary shrink-0">[{r.id}]</span>
                )}
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline decoration-primary/40 text-xs break-all"
                  >
                    {r.title ?? r.url}
                  </a>
                ) : (
                  <span className="text-textSecondary text-xs">{r.title ?? ''}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
