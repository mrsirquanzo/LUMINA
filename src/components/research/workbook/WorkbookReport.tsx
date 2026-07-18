import { Fragment, useRef, useState } from 'react';
import { Beaker, ChevronDown, Expand, FileQuestion, FlaskConical, RotateCcw, Search, X } from 'lucide-react';
import type { WorkbookRun } from '../../../lib/workbook/types';
import { useGating } from './gating/gatingStore';

interface WorkbookReportProps {
  report: WorkbookRun['report'];
  title?: string;
  eyebrow?: string;
  contentSections?: Array<{ id: string; title: string; content: string }>;
  rankings?: WorkbookRun['rankings'];
  selectedSynergyModel?: string;
}

function renderBoldMarkdown(text: string) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, index) => (
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${part}-${index}`} className="font-semibold text-textPrimary">{part.slice(2, -2)}</strong>
      : <Fragment key={`${part}-${index}`}>{part}</Fragment>
  ));
}

const ACCORDIONS = [
  { key: 'detailedAnswer', title: 'Detailed Answer', icon: Search },
  { key: 'methods', title: 'Methods', icon: FlaskConical },
  { key: 'assumptionsNote', title: 'Assumptions Made', icon: FileQuestion },
] as const;

function formatScore(score: number) {
  return `${score >= 0 ? '+' : ''}${score.toFixed(1)}`;
}

export function WorkbookReport({
  report,
  title = 'Flow cytometry report',
  eyebrow = 'ANALYSIS COMPLETE',
  contentSections,
  rankings,
  selectedSynergyModel = 'Bliss independence',
}: WorkbookReportProps) {
  const gating = useGating();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeFigure, setActiveFigure] = useState<WorkbookRun['report']['figures'][number] | null>(null);
  const usesHsa = selectedSynergyModel === 'HSA (highest single agent)';
  const usesFallback = selectedSynergyModel === 'Loewe additivity' || selectedSynergyModel === 'ZIP';
  const rankingModel = usesHsa ? 'hsa' : 'bliss';
  const rankingLabel = usesHsa ? 'HSA' : 'Bliss';
  const displayedRankings = rankings?.[rankingModel] ?? [];
  const rankedHypotheses = (report.hypotheses ?? [])
    .map((hypothesis) => {
      const rankingIndex = displayedRankings.findIndex((item) => item.combination === hypothesis.combination);
      return {
        ...hypothesis,
        displayedRank: rankingIndex >= 0 ? rankingIndex + 1 : hypothesis.rank,
        score: rankingIndex >= 0 ? displayedRankings[rankingIndex].score : undefined,
        sortIndex: rankingIndex >= 0 ? rankingIndex : hypothesis.rank - 1,
      };
    })
    .sort((a, b) => a.sortIndex - b.sortIndex);
  const displayedSummary = gating ? report.summary.map((summary, index) => {
    if (index === 1) {
      return `**Sequential gating** (FSC/SSC -> singlets -> live -> CD3-CD19+) yielded **${gating.metrics.bCellCount.toLocaleString()} B cells (${gating.metrics.bCellTotalPct.toFixed(1)}% of total; ${gating.metrics.bCellLivePct.toFixed(1)}% of live singlets)**, with **${gating.metrics.viabilityPct.toFixed(1)}% viability**.`;
    }
    if (index === 2) {
      return `**B-cell subsets** (IgD/CD27): **${gating.metrics.subsets.naive.toFixed(1)}% naive**, ${gating.metrics.subsets.switched.toFixed(1)}% switched memory, ${gating.metrics.subsets.doubleNegative.toFixed(1)}% double-negative, ${gating.metrics.subsets.unswitched.toFixed(1)}% unswitched memory.`;
    }
    return summary;
  }) : report.summary;
  const displayedFigures = gating ? report.figures.map((figure, index) => {
    const captions = [
      `Figure 1. Default-gate reference image. The current user cell gate retains ${gating.metrics.cellPct.toFixed(1)}% of events.`,
      `Figure 2. Default-gate reference image. The current singlet ratio band retains ${gating.metrics.singletPct.toFixed(1)}% of gated cells.`,
      `Figure 3. Default-gate reference image. The current Zombie-NIR threshold retains ${gating.metrics.viabilityPct.toFixed(1)}% live cells.`,
      `Figure 4. Default-gate reference image. The current lineage crosshair yields ${gating.metrics.bCellCount.toLocaleString()} B cells (${gating.metrics.bCellLivePct.toFixed(1)}% of live singlets).`,
      `Figure 5. Default-gate reference image. Current subsets are ${gating.metrics.subsets.naive.toFixed(1)}% naive, ${gating.metrics.subsets.switched.toFixed(1)}% switched memory, ${gating.metrics.subsets.doubleNegative.toFixed(1)}% double-negative, and ${gating.metrics.subsets.unswitched.toFixed(1)}% unswitched memory.`,
    ];
    return index < captions.length ? { ...figure, caption: captions[index] } : figure;
  }) : report.figures;
  const displayedReportSections = gating ? {
    ...report.sections,
    detailedAnswer: `The current user-defined cascade recovers ${gating.metrics.bCellCount.toLocaleString()} CD3-CD19+ B cells (${gating.metrics.bCellLivePct.toFixed(1)}% of live singlets). The resulting subset structure is ${gating.metrics.subsets.naive.toFixed(1)}% naive, ${gating.metrics.subsets.switched.toFixed(1)}% switched memory, ${gating.metrics.subsets.doubleNegative.toFixed(1)}% double-negative, and ${gating.metrics.subsets.unswitched.toFixed(1)}% unswitched memory. Constitutive and activation marker observations use this current B-cell population.`,
    methods: `FCS fluorescence channels were arcsinh-transformed with cofactor 6000. The scientist set the FSC/SSC cell rectangle, FSC-A/FSC-H singlet ratio band, Zombie-NIR viability threshold, CD3/CD19 lineage crosshair, and IgD/CD27 subset crosshair. Each gate is applied sequentially in the browser to the real event sample, with results projected to ${gating.metrics.total.toLocaleString()} source events.`,
  } : report.sections;

  const openFigure = (figure: WorkbookRun['report']['figures'][number]) => {
    setActiveFigure(figure);
    window.requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  const closeFigure = () => {
    dialogRef.current?.close();
    setActiveFigure(null);
  };

  return (
    <section className="space-y-5 motion-safe:animate-[slideUp_.3s_cubic-bezier(.16,1,.3,1)]" aria-labelledby="workbook-report-title">
      <div className="surface-card overflow-hidden px-5 py-6 sm:px-6">
        <p className="t-eyebrow text-primary">{eyebrow}</p>
        <h2 id="workbook-report-title" className="t-h1 mt-1 text-textPrimary">{title}</h2>
        <ul className="mt-5 space-y-2.5">
          {displayedSummary.map((summary) => (
            <li key={summary} className="surface-inset t-body flex gap-3 border-l-2 border-l-primary/35 px-4 py-3 text-textSecondary">
              <span className="mt-[8px] h-1.5 w-1.5 flex-none rounded-sm bg-primary" aria-hidden="true" />
              <span>{renderBoldMarkdown(summary)}</span>
            </li>
          ))}
        </ul>
      </div>

      {gating && (
        <section className="surface-card overflow-hidden" data-flow-gate-report aria-label="Current flow gate results">
          <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="t-eyebrow text-[#2f9e8f]">CURRENT USER GATES</p>
              <h3 className="t-h3 mt-1 text-textPrimary">Live cascade readout</h3>
            </div>
            <button
              type="button"
              onClick={gating.resetGates}
              disabled={gating.isDefault}
              className="quiet-action t-meta inline-flex w-fit items-center gap-2 rounded-[10px] border border-border bg-white px-3 py-2 font-semibold text-textSecondary hover:border-[#2f9e8f]/40 hover:text-[#2f9e8f] disabled:cursor-default disabled:opacity-45"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Reset gates
            </button>
          </header>
          <div className="grid grid-cols-2 gap-px bg-borderSoft sm:grid-cols-4">
            {[
              ['Cell gate', `${gating.metrics.cellPct.toFixed(1)}%`],
              ['Viability', `${gating.metrics.viabilityPct.toFixed(1)}%`],
              ['B cells', gating.metrics.bCellCount.toLocaleString()],
              ['Naive', `${gating.metrics.subsets.naive.toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-4 sm:px-6">
                <p className="t-eyebrow text-textTertiary">{label}</p>
                <p className="t-h3 mt-1 font-mono tabular-nums text-textPrimary">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 border-t border-borderSoft bg-subtle/45 px-5 py-4 sm:grid-cols-4 sm:px-6">
            {[
              ['Naive', gating.metrics.subsets.naive],
              ['Switched', gating.metrics.subsets.switched],
              ['Double-negative', gating.metrics.subsets.doubleNegative],
              ['Unswitched', gating.metrics.subsets.unswitched],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="t-meta text-textSecondary">{label}</span>
                  <span className="t-meta font-mono font-semibold tabular-nums text-textPrimary">{Number(value).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#2f9e8f]" style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {displayedRankings.length > 0 && (
        <section className="surface-card overflow-hidden" aria-labelledby="combination-ranking-title">
          <header className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="t-eyebrow text-primary">SELECTED MODEL: {rankingLabel.toUpperCase()}</p>
              <h3 id="combination-ranking-title" className="t-h3 mt-1 text-textPrimary">
                Combination ranking
              </h3>
            </div>
            <p className="t-meta font-mono tabular-nums text-textTertiary">Mean excess, % inhibition</p>
          </header>

          {usesFallback && (
            <p className="t-meta border-b border-border bg-subtle/55 px-5 py-2.5 font-medium text-textSecondary sm:px-6">
              Loewe/ZIP not computed in this demo - showing Bliss.
            </p>
          )}

          <ol className="divide-y divide-borderSoft px-5 sm:px-6" data-ranking-model={rankingModel}>
            {displayedRankings.map((item, index) => (
              <li key={item.combination} className="flex min-h-12 items-center gap-3 py-2.5">
                <span className="t-eyebrow w-6 flex-none tabular-nums text-textTertiary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="t-body-sm min-w-0 flex-1 font-medium text-textPrimary">{item.combination}</span>
                <span className={`t-meta font-mono font-semibold tabular-nums ${item.score > 0 ? 'text-primary' : 'text-textSecondary'}`}>
                  {formatScore(item.score)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {rankedHypotheses.length > 0 && (
        <section
          className="surface-card border-primary/25 bg-primary/[0.03] px-5 py-6 sm:px-6"
          aria-labelledby="workbook-hypotheses-title"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Beaker className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <p className="t-eyebrow text-primary">Next experiments</p>
              <h3 id="workbook-hypotheses-title" className="t-h3 mt-1 text-textPrimary">
                Proposed hypotheses for wet-lab testing
              </h3>
              <p className="t-meta mt-1 text-textSecondary">
                Ranked candidates to validate at the bench, grounded in the observed dose-response data.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {rankedHypotheses.map((hypothesis) => (
              <article key={hypothesis.combination} className="surface-inset bg-white px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3.5">
                  <span className="t-eyebrow flex h-7 min-w-7 flex-none items-center justify-center rounded-lg bg-primary px-2 tabular-nums text-white">
                    #{hypothesis.displayedRank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="t-body font-semibold text-textPrimary">{hypothesis.combination}</h4>
                      {hypothesis.score !== undefined && (
                        <span className="t-meta font-mono font-semibold tabular-nums text-primary">
                          {rankingLabel} {formatScore(hypothesis.score)}
                        </span>
                      )}
                    </div>
                    <p className="t-body-sm mt-1.5 text-textSecondary">{hypothesis.rationale}</p>
                    <p className="t-meta mt-3 border-t border-borderSoft pt-3 text-textSecondary">
                      <span className="font-semibold text-textPrimary">Experiment:</span> {hypothesis.experiment}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {displayedFigures.length > 0 && (
        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow text-textTertiary">Figures</p>
              <h3 className="t-h3 mt-1 text-textPrimary">Analysis outputs</h3>
            </div>
            <span className="t-meta font-mono tabular-nums text-textTertiary">{displayedFigures.length} figures</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {displayedFigures.map((figure, index) => (
              <figure key={figure.src} className="surface-card surface-card-interactive overflow-hidden">
                <div className="group relative aspect-[16/10] overflow-hidden border-b border-border bg-subtle">
                  <img src={figure.src} alt={`Analysis figure ${index + 1}`} className="h-full w-full object-contain p-2" loading="eager" />
                  <button
                    type="button"
                    onClick={() => openFigure(figure)}
                    className="icon-action absolute right-2.5 top-2.5 h-8 w-8 bg-white/95 shadow-card"
                    aria-label={`Expand figure ${index + 1}`}
                  >
                    <Expand className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
                <figcaption className="t-meta px-4 py-3 text-textSecondary">{figure.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        {(contentSections ?? ACCORDIONS.map(({ key, title }) => ({
          id: key,
          title,
          content: displayedReportSections[key],
        }))).map((section, index) => {
          const Icon = contentSections ? Search : ACCORDIONS[index]?.icon ?? Search;
          return (
            <details
              key={section.id}
              open={Boolean(contentSections) && index === 0}
              className="group border-border open:bg-subtle/35 [&:not(:last-child)]:border-b"
            >
              <summary className="quiet-action flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden hover:bg-primary/[0.025]">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span className="t-body-sm flex-1 font-semibold text-textPrimary">{section.title}</span>
                <ChevronDown className="h-4 w-4 text-textTertiary transition-transform group-open:rotate-180" strokeWidth={1.75} aria-hidden="true" />
              </summary>
              <div className="t-body-sm px-5 pb-5 pl-12 text-textSecondary">
                {section.content}
              </div>
            </details>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeFigure();
        }}
        onClick={(event) => { if (event.target === event.currentTarget) closeFigure(); }}
        className="m-auto w-[min(94vw,1100px)] rounded-[14px] border border-border bg-white p-0 text-textPrimary shadow-card-hover backdrop:bg-slate-950/55"
        aria-label="Expanded analysis figure"
      >
        {activeFigure && (
          <div>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="t-eyebrow text-textTertiary">Full figure</p>
              <button type="button" onClick={closeFigure} className="icon-action h-8 w-8 border-transparent bg-transparent" aria-label="Close expanded figure">
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[72dvh] overflow-auto bg-subtle p-3 sm:p-5">
              <img src={activeFigure.src} alt="Expanded analysis figure" className="mx-auto max-h-[66dvh] w-auto max-w-full rounded-lg border border-border bg-white object-contain" />
            </div>
            <p className="t-meta px-5 py-4 text-textSecondary">{activeFigure.caption}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}
