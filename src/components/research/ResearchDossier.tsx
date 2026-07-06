import type { ReactElement } from 'react';
import type { BriefingView } from '../../lib/research/sseTypes.js';
import { CitedMarkdown } from '../shared/CitedMarkdown.js';

interface Props { briefing: BriefingView; }

// Verdict fill pill - GO green / WATCH amber / NO-GO red fill, white text.
function verdictPillClass(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v === 'GO') return 'bg-go text-white';
  if (v === 'NO-GO') return 'bg-nogo text-white';
  if (v === 'WATCH') return 'bg-watch text-white';
  return 'bg-subtle text-textSecondary';
}

// RAG section pill - border + tint, dot alongside.
function ragPillClass(rag?: 'red' | 'amber' | 'green'): string {
  if (rag === 'green') return 'border border-go/30 text-go-text';
  if (rag === 'amber') return 'border border-watch/30 text-watch-text';
  if (rag === 'red') return 'border border-nogo/30 text-nogo-text';
  return 'border border-border text-textSecondary';
}

function ragDotClass(rag?: 'red' | 'amber' | 'green'): string {
  if (rag === 'green') return 'bg-go';
  if (rag === 'amber') return 'bg-watch';
  if (rag === 'red') return 'bg-nogo';
  return 'bg-textTertiary';
}

export default function ResearchDossier({ briefing }: Props): ReactElement {
  const rec = briefing.recommendation;

  return (
    <div className="text-sm">

      {/* 1. Verdict pill - conclusion-first, largest signal */}
      {rec?.verdict && (
        <div className="flex items-center gap-3 pb-5 border-b border-border">
          <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-[0.03em] ${verdictPillClass(rec.verdict)}`}
            style={{ boxShadow: rec.verdict.toUpperCase() === 'WATCH' ? '0 2px 8px rgba(217,119,6,.28)' : rec.verdict.toUpperCase() === 'GO' ? '0 2px 8px rgba(22,163,74,.25)' : rec.verdict.toUpperCase() === 'NO-GO' ? '0 2px 8px rgba(220,38,38,.25)' : 'none' }}
          >
            {rec.verdict.toUpperCase()}
          </span>
          {briefing.target && (
            <span className="font-display text-[18px] font-semibold text-textPrimary tracking-tight">
              {briefing.target}
            </span>
          )}
          {(briefing.references ?? []).length > 0 && (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-textTertiary flex-none">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Grounded · {briefing.references!.length} refs
            </span>
          )}
        </div>
      )}

      {/* 2. Thesis */}
      {rec?.thesis && (
        <p className="mt-4 text-[14px] font-semibold text-textPrimary leading-snug">
          {rec.thesis}
        </p>
      )}

      {/* 3. Executive read - Newsreader, ~70ch */}
      {briefing.executiveRead && (
        <div className="mt-4 font-display text-[15px] leading-relaxed text-textSecondary max-w-[70ch]">
          <CitedMarkdown content={briefing.executiveRead} />
        </div>
      )}

      {/* 4. RAG sections */}
      {(briefing.sections ?? []).length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-3">
            Sections
          </p>
          <div className="flex flex-col divide-y divide-border">
            {briefing.sections!.map((section, i) => (
              <div key={section.id ?? i} className="py-4 first:pt-0 last:pb-0">
                {/* Section header: pill + colored dot + title */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {section.rag && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 ${ragPillClass(section.rag)}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-none ${ragDotClass(section.rag)}`}
                        aria-hidden="true"
                      />
                      {section.rag.toUpperCase()}
                    </span>
                  )}
                  {section.title && (
                    <span className="text-[13px] font-semibold text-textPrimary">
                      {section.title}
                    </span>
                  )}
                </div>

                {/* Takeaway */}
                {section.takeaway && (
                  <p className="mt-2 text-[13px] text-textSecondary leading-relaxed">
                    {section.takeaway}
                  </p>
                )}

                {/* Claims with citation superscripts */}
                {(section.claims ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {section.claims!.map((c, ci) => (
                      <li key={ci} className="flex gap-2 text-[13px] text-textSecondary leading-relaxed">
                        <span className="flex-none mt-[7px] w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
                        <span>
                          {c.text ?? ''}
                          {(c.citations ?? []).length > 0 &&
                            (c.citations ?? []).map((cit) => (
                              <sup
                                key={cit}
                                className="font-mono text-[10px] text-primary bg-primary/10 rounded px-1 py-px ml-0.5 cursor-pointer align-super"
                              >
                                {cit}
                              </sup>
                            ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Bull / Bear */}
      {((rec?.bull ?? []).length > 0 || (rec?.bear ?? []).length > 0) && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(rec?.bull ?? []).length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-go-text mb-2">
                Bull case
              </p>
              <ul className="space-y-2">
                {(rec?.bull ?? []).map((b, i) => (
                  <li key={i} className="text-[12.5px] text-textSecondary leading-relaxed flex gap-1.5">
                    <span className="flex-none text-go/60 font-bold">+</span>
                    <span>
                      {b.point ?? ''}
                      {(b.citations ?? []).length > 0 && (
                        <span className="ml-1 font-mono text-[10px] text-textTertiary">
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
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-nogo-text mb-2">
                Bear case
              </p>
              <ul className="space-y-2">
                {(rec?.bear ?? []).map((b, i) => (
                  <li key={i} className="text-[12.5px] text-textSecondary leading-relaxed flex gap-1.5">
                    <span className="flex-none text-nogo/60 font-bold">-</span>
                    <span>
                      {b.point ?? ''}
                      {(b.citations ?? []).length > 0 && (
                        <span className="ml-1 font-mono text-[10px] text-textTertiary">
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

      {/* 6. Conditions */}
      {(rec?.conditions ?? []).length > 0 && (
        <div className="mt-3 bg-surface border border-border rounded-xl p-4">
          <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-watch-text mb-2">
            Conditions to move to GO
          </p>
          <ol className="space-y-1.5">
            {(rec?.conditions ?? []).map((cond, i) => (
              <li key={i} className="text-[12.5px] text-textSecondary leading-relaxed flex gap-2.5">
                <span className="flex-none font-bold text-primary">{i + 1}</span>
                <span>{cond}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 7. KOL terrain - bg-subtle panel */}
      {(briefing.kolCluster?.labs ?? []).length > 0 && (
        <div className="mt-5 bg-subtle border border-border/60 rounded-xl p-4">
          <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-3">
            KOL &amp; Institutional Terrain
          </p>
          <div className="flex flex-col gap-2">
            {(briefing.kolCluster?.labs ?? []).map((lab, i) => (
              <div key={i} className="flex items-baseline gap-2.5">
                <span className="text-[13px] font-semibold text-textPrimary flex-none">
                  {lab.investigator ?? ''}
                </span>
                {lab.institution && (
                  <span className="text-[12px] text-textSecondary flex-1 min-w-0 truncate">
                    {lab.institution}
                  </span>
                )}
                {lab.paperCount !== undefined && (
                  <span className="font-mono text-[11px] text-textTertiary flex-none ml-auto">
                    w {lab.paperCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. References - Geist Mono ids, linked */}
      {(briefing.references ?? []).length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-[0.05em] uppercase text-textTertiary mb-2">
            References ({briefing.references!.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {briefing.references!.map((r, i) => (
              <div key={r.id ?? i} className="flex gap-2.5 text-[12.5px] items-baseline">
                {r.id && (
                  <span className="font-mono text-primary flex-none text-[11.5px]">
                    {r.id}
                  </span>
                )}
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-textSecondary hover:text-primary underline decoration-border hover:decoration-primary transition-colors truncate"
                  >
                    {r.title ?? r.url}
                  </a>
                ) : (
                  <span className="text-textSecondary truncate">{r.title ?? ''}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Actions - right-aligned */}
      <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-[11.5px] text-textTertiary mr-auto">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Every claim grounded to a cited source
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-white border border-border text-textTertiary cursor-not-allowed opacity-60"
        >
          Export
        </button>
      </div>

    </div>
  );
}
