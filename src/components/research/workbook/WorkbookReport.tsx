import { Fragment, useRef, useState } from 'react';
import { ChevronDown, Expand, FileQuestion, FlaskConical, Search, X } from 'lucide-react';
import type { WorkbookRun } from '../../../lib/workbook/types';

interface WorkbookReportProps {
  report: WorkbookRun['report'];
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

export function WorkbookReport({ report }: WorkbookReportProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeFigure, setActiveFigure] = useState<WorkbookRun['report']['figures'][number] | null>(null);

  const openFigure = (figure: WorkbookRun['report']['figures'][number]) => {
    setActiveFigure(figure);
    window.requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  const closeFigure = () => {
    dialogRef.current?.close();
    setActiveFigure(null);
  };

  return (
    <section className="space-y-5 motion-safe:animate-[slideUp_.4s_cubic-bezier(.16,1,.3,1)]" aria-labelledby="workbook-report-title">
      <div className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-card sm:px-6">
        <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-primary">ANALYSIS COMPLETE</p>
        <h2 id="workbook-report-title" className="mt-1 font-display text-[28px] font-semibold tracking-tight text-textPrimary">Flow cytometry report</h2>
        <ul className="mt-5 space-y-3.5">
          {report.summary.map((summary) => (
            <li key={summary} className="flex gap-3 text-[13.5px] leading-relaxed text-textSecondary">
              <span className="mt-[8px] h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden="true" />
              <span>{renderBoldMarkdown(summary)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-textTertiary">FIGURES</p>
            <h3 className="mt-1 text-[15px] font-semibold text-textPrimary">Analysis outputs</h3>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-textTertiary">{report.figures.length} figures</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {report.figures.map((figure, index) => (
            <figure key={figure.src} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
              <div className="group relative aspect-[16/10] overflow-hidden border-b border-border bg-subtle">
                <img src={figure.src} alt={`Flow cytometry figure ${index + 1}`} className="h-full w-full object-contain p-2" loading="eager" />
                <button
                  type="button"
                  onClick={() => openFigure(figure)}
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white/95 text-textSecondary shadow-card transition-colors hover:text-primary active:scale-[.98]"
                  aria-label={`Expand figure ${index + 1}`}
                >
                  <Expand className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
              <figcaption className="px-4 py-3 text-[11px] leading-relaxed text-textSecondary">{figure.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {ACCORDIONS.map(({ key, title, icon: Icon }) => (
          <details key={key} className="group border-border open:bg-subtle/35 [&:not(:last-child)]:border-b">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden">
              <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <span className="flex-1 text-[13px] font-semibold text-textPrimary">{title}</span>
              <ChevronDown className="h-4 w-4 text-textTertiary transition-transform group-open:rotate-180" strokeWidth={1.75} aria-hidden="true" />
            </summary>
            <div className="px-5 pb-5 pl-12 text-[12.5px] leading-relaxed text-textSecondary">
              {report.sections[key]}
            </div>
          </details>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeFigure();
        }}
        onClick={(event) => { if (event.target === event.currentTarget) closeFigure(); }}
        className="m-auto w-[min(94vw,1100px)] rounded-2xl border border-border bg-white p-0 text-textPrimary shadow-2xl backdrop:bg-slate-950/60"
        aria-label="Expanded analysis figure"
      >
        {activeFigure && (
          <div>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-mono text-[10px] tracking-[0.08em] text-textTertiary">FULL FIGURE</p>
              <button type="button" onClick={closeFigure} className="flex h-8 w-8 items-center justify-center rounded-lg text-textSecondary hover:bg-subtle hover:text-textPrimary" aria-label="Close expanded figure">
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[72dvh] overflow-auto bg-subtle p-3 sm:p-5">
              <img src={activeFigure.src} alt="Expanded flow cytometry figure" className="mx-auto max-h-[66dvh] w-auto max-w-full rounded-lg border border-border bg-white object-contain" />
            </div>
            <p className="px-5 py-4 text-[12px] leading-relaxed text-textSecondary">{activeFigure.caption}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}
