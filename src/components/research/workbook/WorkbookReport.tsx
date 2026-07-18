import { Fragment, useRef, useState } from 'react';
import { Beaker, ChevronDown, Expand, FileQuestion, FlaskConical, Search, X } from 'lucide-react';
import type { WorkbookRun } from '../../../lib/workbook/types';

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
          {report.summary.map((summary) => (
            <li key={summary} className="surface-inset t-body flex gap-3 border-l-2 border-l-primary/35 px-4 py-3 text-textSecondary">
              <span className="mt-[8px] h-1.5 w-1.5 flex-none rounded-sm bg-primary" aria-hidden="true" />
              <span>{renderBoldMarkdown(summary)}</span>
            </li>
          ))}
        </ul>
      </div>

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

      {report.figures.length > 0 && (
        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow text-textTertiary">Figures</p>
              <h3 className="t-h3 mt-1 text-textPrimary">Analysis outputs</h3>
            </div>
            <span className="t-meta font-mono tabular-nums text-textTertiary">{report.figures.length} figures</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.figures.map((figure, index) => (
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
          content: report.sections[key],
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
