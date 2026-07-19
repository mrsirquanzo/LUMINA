import { useState } from 'react';
import { Check, ChevronDown, PencilLine } from 'lucide-react';
import type { Clarification } from '../../../lib/workbook/types';

interface ResponseRequiredProps {
  clarifications: Clarification[];
  accepted: boolean;
  onAccept: (answers: Record<string, string>) => void;
}

export function ResponseRequired({ clarifications, accepted, onAccept }: ResponseRequiredProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(
    clarifications.map((clarification) => [clarification.id, clarification.default]),
  ));
  const [customFor, setCustomFor] = useState<string | null>(null);

  if (accepted) {
    return (
      <section className="surface-card flex items-center justify-between gap-4 border-primary/20 bg-primary/[0.035] px-5 py-4" aria-label="Response accepted">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="t-body-sm font-semibold text-textPrimary">Accepted</p>
            <p className="t-meta text-textTertiary">Your analysis choices are reflected in the report.</p>
          </div>
        </div>
        <span className="t-eyebrow text-primary">Response received</span>
      </section>
    );
  }

  return (
    <section className="surface-card overflow-hidden border-primary/20" aria-labelledby="response-required-title">
      <header className="border-b border-primary/10 bg-primary/[0.035] px-5 py-5">
        <p className="t-eyebrow text-primary">Response required</p>
        <h2 id="response-required-title" className="t-h3 mt-1 text-textPrimary">
          Sonny needs your input
        </h2>
      </header>

      <div className="divide-y divide-borderSoft px-5">
        {clarifications.map((clarification) => (
          <div key={clarification.id} className="py-5">
            <p className="t-eyebrow text-textTertiary">Single choice</p>
            <label htmlFor={`clarification-${clarification.id}`} className="t-body mt-2 block font-semibold text-textPrimary">
              {clarification.question}
            </label>
            <p className="t-meta mt-1.5 max-w-[82ch] text-textSecondary">{clarification.context}</p>

            <div className="relative mt-3 max-w-2xl">
              <select
                id={`clarification-${clarification.id}`}
                value={answers[clarification.id] ?? clarification.default}
                onChange={(event) => setAnswers((current) => ({ ...current, [clarification.id]: event.target.value }))}
                className="quiet-action t-body-sm w-full appearance-none rounded-[10px] border border-border bg-white px-3.5 py-3 pr-10 text-textPrimary outline-none hover:border-primary/25 focus:border-primary/50"
              >
                {clarification.options.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-textTertiary" strokeWidth={1.75} aria-hidden="true" />
            </div>

            {customFor === clarification.id ? (
              <div className="mt-3 max-w-2xl">
                <label htmlFor={`custom-${clarification.id}`} className="t-eyebrow text-textTertiary">Custom answer</label>
                <input
                  id={`custom-${clarification.id}`}
                  value={answers[clarification.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [clarification.id]: event.target.value }))}
                  placeholder="Describe the analysis you want Sonny to use"
                  className="quiet-action t-body-sm mt-1.5 w-full rounded-[10px] border border-border bg-white px-3.5 py-3 text-textPrimary outline-none placeholder:text-textTertiary hover:border-primary/25 focus:border-primary/50"
                  autoFocus
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCustomFor(clarification.id);
                  setAnswers((current) => ({ ...current, [clarification.id]: '' }));
                }}
                className="quiet-action t-meta mt-2.5 inline-flex items-center gap-1.5 rounded-md font-medium text-textTertiary hover:text-primary"
              >
                <PencilLine className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                Write a custom answer
              </button>
            )}
          </div>
        ))}
      </div>

      <footer className="flex flex-col gap-3 border-t border-border bg-subtle/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-meta text-textTertiary">Defaults are included when you accept.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomFor(clarifications[0]?.id ?? null)}
            className="quiet-action t-meta rounded-[10px] border border-border bg-white px-3.5 py-2 font-semibold text-textSecondary hover:border-primary/25 hover:text-primary"
          >
            Something else
          </button>
          <button
            type="button"
            onClick={() => onAccept(answers)}
            className="quiet-action t-meta rounded-[10px] bg-primary px-4 py-2 font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </footer>
    </section>
  );
}
