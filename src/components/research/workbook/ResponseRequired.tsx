import { useState } from 'react';
import { Check, ChevronDown, PencilLine } from 'lucide-react';
import type { Clarification } from '../../../lib/workbook/types';

interface ResponseRequiredProps {
  clarifications: Clarification[];
  accepted: boolean;
  onAccept: () => void;
}

export function ResponseRequired({ clarifications, accepted, onAccept }: ResponseRequiredProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(
    clarifications.map((clarification) => [clarification.id, clarification.default]),
  ));
  const [customFor, setCustomFor] = useState<string | null>(null);

  if (accepted) {
    return (
      <section className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/[0.045] px-4 py-3" aria-label="Response accepted">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-textPrimary">Accepted</p>
            <p className="text-[11px] text-textTertiary">Default analysis choices included.</p>
          </div>
        </div>
        <span className="font-mono text-[9px] tracking-[0.08em] text-primary">RESPONSE RECEIVED</span>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200 bg-surface shadow-card" aria-labelledby="response-required-title">
      <header className="border-b border-amber-100 bg-amber-50/60 px-5 py-4">
        <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-amber-700">RESPONSE REQUIRED</p>
        <h2 id="response-required-title" className="mt-1 font-display text-[23px] font-semibold tracking-tight text-textPrimary">
          Sonny needs your input
        </h2>
      </header>

      <div className="divide-y divide-borderSoft px-5">
        {clarifications.map((clarification) => (
          <div key={clarification.id} className="py-5">
            <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-textTertiary">SINGLE CHOICE</p>
            <label htmlFor={`clarification-${clarification.id}`} className="mt-2 block text-[14px] font-semibold leading-snug text-textPrimary">
              {clarification.question}
            </label>
            <p className="mt-1.5 max-w-[82ch] text-[12px] leading-relaxed text-textSecondary">{clarification.context}</p>

            <div className="relative mt-3 max-w-2xl">
              <select
                id={`clarification-${clarification.id}`}
                value={answers[clarification.id] ?? clarification.default}
                onChange={(event) => setAnswers((current) => ({ ...current, [clarification.id]: event.target.value }))}
                className="w-full appearance-none rounded-xl border border-border bg-white px-3.5 py-3 pr-10 text-[12.5px] text-textPrimary outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              >
                {clarification.options.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-textTertiary" strokeWidth={1.75} aria-hidden="true" />
            </div>

            {customFor === clarification.id ? (
              <div className="mt-3 max-w-2xl">
                <label htmlFor={`custom-${clarification.id}`} className="font-mono text-[9px] tracking-[0.08em] text-textTertiary">CUSTOM ANSWER</label>
                <input
                  id={`custom-${clarification.id}`}
                  value={answers[clarification.id] ?? ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [clarification.id]: event.target.value }))}
                  placeholder="Describe the analysis you want Sonny to use"
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-3 text-[12.5px] text-textPrimary outline-none placeholder:text-textTertiary focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
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
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-textTertiary transition-colors hover:text-primary active:translate-y-px"
              >
                <PencilLine className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                Write a custom answer
              </button>
            )}
          </div>
        ))}
      </div>

      <footer className="flex flex-col gap-3 border-t border-border bg-subtle/45 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-textTertiary">Defaults are included when you accept.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomFor(clarifications[0]?.id ?? null)}
            className="rounded-lg border border-border bg-white px-3.5 py-2 text-[12px] font-semibold text-textSecondary transition-colors hover:border-slate-300 hover:text-textPrimary active:translate-y-px"
          >
            Something else
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-primary px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-primary/90 active:translate-y-px"
          >
            Accept
          </button>
        </div>
      </footer>
    </section>
  );
}
