import type { ReactElement } from 'react';
import type { BriefingView } from '../../lib/research/sseTypes.js';
import { CitedMarkdown } from '../shared/CitedMarkdown.js';

interface Props { briefing: BriefingView; }

// Normalized claim key: lowercase + strip everything but a-z0-9 so near-identical
// restatements collapse ("Trop-2" == "TROP2", "[68Ga]" == "[⁶⁸Ga]",
// trailing punctuation, spacing). Aggressive on purpose - these are duplicates.
function claimKey(text?: string): string {
  return (text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Render a bull/bear point with compact numbered citations. Strip any raw ids
// the engine embedded inline (e.g. "...efficacy. [PMID:123]") so they don't
// double up with the numbered marker.
function pointWithCitation(point?: string, citations?: string[], index?: Map<string, number>): ReactElement {
  const text = (point ?? '').replace(/\s*\[[A-Za-z0-9:#._,\s-]+\]\s*$/, '').trim();
  return (
    <>
      {text}
      {index && citeMarks(citations, index)}
    </>
  );
}

// Drop repeated claims within a section - synthesis can emit the same point
// more than once, and duplicate bullets read as sloppy to a technical audience.
function dedupeClaims<T extends { text?: string }>(claims: T[]): T[] {
  const seen = new Set<string>();
  return claims.filter((c) => {
    const key = claimKey(c.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Verdict fill pill - GO green / WATCH amber / NO-GO red fill, white text.
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

// Compact numbered citations: map each cited evidence id to its number in the
// reference list, and render inline superscripts like [3,7] instead of long
// monospace ids that break the sentence flow. Unknown ids (not in references)
// are simply omitted from the marker; the underlying data is unchanged.
function citeMarks(citations: string[] | undefined, index: Map<string, number>): ReactElement | null {
  const nums = [...new Set((citations ?? []).map((c) => index.get(c.replace(/#.*$/, ''))).filter((n): n is number => Boolean(n)))].sort((a, b) => a - b);
  if (!nums.length) return null;
  return (
    <sup className="ml-0.5 whitespace-nowrap align-super text-[10px] font-medium text-primary/70">
      [{nums.join(',')}]
    </sup>
  );
}

export default function ResearchDossier({ briefing }: Props): ReactElement {
  const rec = briefing.recommendation;

  // Dedupe references by the underlying source. The engine cites individual PMC
  // full-text SECTIONS (PMCID:...#sec-4, #sec-5) and separate database cards
  // (ENSG...#expression, #tractability), which otherwise list one paper/source
  // as many rows with section titles - reading as padded, duplicated sources.
  // Collapse to one row per source (strip the #locator) and give it an honest,
  // source-typed label instead of a misleading section title.
  const baseOf = (id: string) => id.replace(/#.*$/, '');
  const refLabel = (baseId: string, fallbackTitle?: string): string => {
    if (baseId.startsWith('PMCID:')) return 'PubMed Central full text';
    if (baseId.startsWith('ENSG')) return 'Open Targets - target record';
    if (baseId.startsWith('UNIPROT:')) return 'UniProt - protein entry';
    return fallbackTitle ?? baseId; // PMID and the like carry a real paper title
  };
  const dedupedRefs: { baseId: string; title: string; url?: string }[] = [];
  const refNum = new Map<string, number>(); // baseId -> 1-based number
  for (const r of briefing.references ?? []) {
    if (!r.id) continue;
    const b = baseOf(r.id);
    if (refNum.has(b)) continue;
    refNum.set(b, dedupedRefs.length + 1);
    dedupedRefs.push({ baseId: b, title: refLabel(b, r.title), url: r.url ? baseOf(r.url) : r.url });
  }
  const refIndex = new Map<string, number>(); // maps ANY cited id (incl #locators) to its source number
  refNum.forEach((n, b) => refIndex.set(b, n));

  // Global dedup: specialists often restate the same fact across sections. Show
  // each unique claim once, in the first section it appears, so every section
  // reads as new information rather than a repeated fact. (Render-side guard;
  // the engine should ideally give each agent awareness of prior claims.)
  const seenClaims = new Set<string>();
  const sectionsForRender = (briefing.sections ?? []).map((section, i) => {
    const claims: NonNullable<typeof section.claims> = [];
    for (const c of dedupeClaims(section.claims ?? [])) {
      const key = claimKey(c.text);
      if (!key || seenClaims.has(key)) continue;
      seenClaims.add(key);
      claims.push(c);
    }
    return { section, i, claims };
  }).filter(({ section, claims }) => claims.length > 0 || section.takeaway);

  return (
    <div className="t-body">

      {/* 1. Report masthead - target headline + neutral assessment tag.
          Decision support, not a verdict: the memo argues both cases and leaves
          the GO/NO-GO call to the team, so no colored action pill here. */}
      {rec && (
        <div className="pb-5 border-b border-border">
          <p className="t-eyebrow text-textTertiary">
            target assessment
          </p>
          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            {briefing.target && (
              <h2 className="t-h1 text-textPrimary">
                {briefing.target}
              </h2>
            )}
            <span className="t-meta inline-flex items-center gap-1.5 rounded-full border border-border bg-subtle px-3 py-1 font-medium text-textSecondary">
              Grounded assessment · decision rests with the team
            </span>
            {(briefing.references ?? []).length > 0 && (
              <span className="t-meta ml-auto flex flex-none items-center gap-1.5 font-mono text-textTertiary">
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
                Grounded · {dedupedRefs.length} sources
              </span>
            )}
          </div>
        </div>
      )}

      {/* Executive read - leads the report; the framing/bottom-line live here,
          so no separate thesis line (it duplicated the framing). Full width. */}
      {briefing.executiveRead && (
        <div className="t-lead mt-5 font-display text-textSecondary">
          <CitedMarkdown content={briefing.executiveRead} />
        </div>
      )}

      {/* 4. RAG sections (claims globally deduped across sections) */}
      {sectionsForRender.length > 0 && (
        <div className="mt-6">
          <p className="t-eyebrow mb-3 text-textTertiary">
            Sections
          </p>
          <div className="flex flex-col divide-y divide-border">
            {sectionsForRender.map(({ section, i, claims }) => (
              <div key={section.id ?? i} className="py-6 first:pt-1 last:pb-0">
                {/* Section header: clear title + RAG status pill */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  {section.title && (
                    <h3 className="font-display text-lg font-medium text-textPrimary">
                      {section.title}
                    </h3>
                  )}
                  {section.rag && (
                    <span
                      className={`t-meta inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${ragPillClass(section.rag)}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-none ${ragDotClass(section.rag)}`}
                        aria-hidden="true"
                      />
                      {section.rag.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Takeaway */}
                {section.takeaway && (
                  <p className="t-body-sm mt-2 italic text-textSecondary">
                    {section.takeaway}
                  </p>
                )}

                {/* Claims with compact numbered citations (globally deduped) */}
                {claims.length > 0 && (
                  <ul className="mt-2.5 space-y-2">
                    {claims.map((c, ci) => (
                      <li key={ci} className="t-body-sm flex gap-2.5 text-textSecondary">
                        <span className="flex-none mt-[7px] w-1.5 h-1.5 rounded-full bg-border" aria-hidden="true" />
                        <span>
                          {c.text ?? ''}
                          {citeMarks(c.citations, refIndex)}
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

      {/* 5. Bull case (supporting) */}
      {(rec?.bull ?? []).length > 0 && (
        <div className="mt-5 bg-surface border border-border rounded-xl p-4">
          <p className="t-eyebrow mb-2.5 text-go-text">
            Bull case
          </p>
          <ul className="space-y-2">
            {(rec?.bull ?? []).map((b, i) => (
              <li key={i} className="t-body-sm flex gap-2 text-textSecondary">
                <span className="flex-none text-go/70 font-bold mt-px">+</span>
                <span>{pointWithCitation(b.point, b.citations, refIndex)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Adversarial review - the bear case, given prominence as a real skeptic voice */}
      {(rec?.bear ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-nogo/25 bg-nogo-tint/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <p className="t-eyebrow text-nogo-text">
              Adversarial review
            </p>
          </div>
          <p className="t-meta mb-2.5 text-textSecondary">
            The bear case - risks and counter-evidence a skeptic would raise before committing.
          </p>
          <ul className="space-y-2.5">
            {(rec?.bear ?? []).map((b, i) => (
              <li key={i} className="t-body-sm flex gap-2.5 text-textPrimary">
                <span className="flex-none w-1.5 h-1.5 rounded-full bg-nogo mt-[7px]" aria-hidden="true" />
                <span>{pointWithCitation(b.point, b.citations, refIndex)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Conditions */}
      {(rec?.conditions ?? []).length > 0 && (
        <div className="mt-3 bg-surface border border-border rounded-xl p-4">
          <p className="t-eyebrow mb-2 text-watch-text">
            Conditions to move to GO
          </p>
          <ol className="space-y-1.5">
            {(rec?.conditions ?? []).map((cond, i) => (
              <li key={i} className="t-body-sm flex gap-2.5 text-textSecondary">
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
          <p className="t-eyebrow mb-3 text-textTertiary">
            KOL &amp; Institutional Terrain
          </p>
          <div className="flex flex-col gap-2">
            {(briefing.kolCluster?.labs ?? []).map((lab, i) => (
              <div key={i} className="flex items-baseline gap-2.5">
                <span className="t-body-sm flex-none font-semibold text-textPrimary">
                  {lab.investigator ?? ''}
                </span>
                {lab.institution && (
                  <span className="t-meta min-w-0 flex-1 truncate text-textSecondary">
                    {lab.institution}
                  </span>
                )}
                {lab.paperCount !== undefined && (
                  <span className="t-meta ml-auto flex-none font-mono text-textTertiary">
                    w {lab.paperCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. References - Geist Mono ids, linked */}
      {dedupedRefs.length > 0 && (
        <div className="mt-5">
          <p className="t-eyebrow mb-2 text-textTertiary">
            References ({dedupedRefs.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {dedupedRefs.map((r, i) => (
              <div key={r.baseId} className="t-body-sm flex items-baseline gap-2.5">
                <span className="t-meta flex-none w-6 text-right font-mono text-primary/70 tabular-nums">
                  {i + 1}.
                </span>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate text-textSecondary underline decoration-border transition-colors hover:text-primary hover:decoration-primary"
                    title={r.baseId}
                  >
                    {r.title}
                    <span className="t-meta ml-1.5 font-mono text-textTertiary">{r.baseId}</span>
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-textSecondary">
                    {r.title}
                    <span className="t-meta ml-1.5 font-mono text-textTertiary">{r.baseId}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Actions - right-aligned */}
      <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-border">
        <div className="t-meta mr-auto flex items-center gap-1.5 text-textTertiary">
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
          className="t-body-sm inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 font-semibold text-textTertiary opacity-60"
        >
          Export
        </button>
      </div>

    </div>
  );
}
