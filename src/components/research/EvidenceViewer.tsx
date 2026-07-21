import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import {
  resolveEvidence,
  safeExternalUrl,
  sourceLabelForCitation,
  structuredDataRows,
  type EvidenceReference,
} from '../../lib/research/evidenceResolver';

interface EvidenceViewerProps {
  citationId: string | null;
  references?: readonly EvidenceReference[];
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function EvidenceViewer({ citationId, references = [], onClose }: EvidenceViewerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const evidence = useMemo(
    () => citationId ? resolveEvidence(citationId, references) : undefined,
    [citationId, references],
  );
  const sourceLabel = citationId ? sourceLabelForCitation(citationId, evidence) : '';
  const sourceUrl = safeExternalUrl(evidence?.url);
  const snippet = evidence?.passage?.trim() || evidence?.snippet?.trim();
  const rawRows = structuredDataRows(evidence?.raw);

  useEffect(() => {
    if (!citationId) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [citationId, onClose]);

  if (!citationId || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-slate-950/45 backdrop-blur-[2px] animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-viewer-title"
        aria-describedby="evidence-viewer-description"
        tabIndex={-1}
        className="flex h-full w-full max-w-[560px] flex-col overflow-hidden border-l border-border bg-surface text-textPrimary motion-safe:animate-[slideInRight_.22s_cubic-bezier(.16,1,.3,1)] focus:outline-none"
      >
        <header className="flex flex-none items-start gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="t-eyebrow text-primary">Evidence provenance</p>
            <h2 id="evidence-viewer-title" className="t-h2 mt-1 text-textPrimary">
              {sourceLabel}
            </h2>
            <code className="t-meta mt-2 inline-flex max-w-full break-all rounded-md border border-border bg-subtle px-2 py-1 font-mono text-textSecondary">
              {citationId}
            </code>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="icon-action h-9 w-9 flex-none"
            aria-label="Close evidence viewer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p id="evidence-viewer-description" className="sr-only">
            Source provenance and captured evidence for citation {citationId}.
          </p>

          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="quiet-action t-body-sm inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-primary px-4 py-2 font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
            >
              Open source
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </a>
          ) : (
            <p className="t-body-sm rounded-[10px] border border-border bg-subtle px-4 py-3 text-textSecondary">
              A live source link was not included with this reference.
            </p>
          )}

          {evidence ? (
            <div className="mt-6 space-y-6">
              {evidence.title?.trim() && (
                <section aria-labelledby="evidence-title-heading">
                  <h3 id="evidence-title-heading" className="t-eyebrow text-textTertiary">Source title</h3>
                  <p className="t-body mt-2 max-w-[70ch] font-semibold text-textPrimary">{evidence.title}</p>
                </section>
              )}

              {snippet && (
                <section aria-labelledby="evidence-snippet-heading">
                  <h3 id="evidence-snippet-heading" className="t-eyebrow text-textTertiary">Cited text</h3>
                  <blockquote className="t-body-sm mt-2 rounded-[10px] bg-subtle px-4 py-3.5 text-textSecondary">
                    {snippet}
                  </blockquote>
                </section>
              )}

              {rawRows.length > 0 && (
                <section aria-labelledby="evidence-raw-heading">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 id="evidence-raw-heading" className="t-eyebrow text-textTertiary">Captured data</h3>
                    <span className="t-meta font-mono tabular-nums text-textTertiary">
                      {rawRows.length} {rawRows.length === 1 ? 'field' : 'fields'}
                    </span>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-[10px] border border-border">
                    <table className="w-full border-collapse text-left">
                      <tbody className="divide-y divide-borderSoft">
                        {rawRows.map((row, index) => (
                          <tr key={`${row.key}-${index}`} className="align-top">
                            <th scope="row" className="t-meta w-[34%] bg-subtle/60 px-3 py-2.5 font-mono font-semibold text-textSecondary">
                              <span className="break-all">{row.key}</span>
                            </th>
                            <td className="px-3 py-2.5">
                              <pre className="t-meta whitespace-pre-wrap break-words font-mono text-textPrimary">{row.value}</pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-[10px] border border-border bg-subtle px-4 py-4">
              <h3 className="t-body-sm font-semibold text-textPrimary">Reference details unavailable</h3>
              <p className="t-meta mt-1 text-textSecondary">
                This citation appears in the claim, but its reference metadata was not included with the report.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export default EvidenceViewer;
