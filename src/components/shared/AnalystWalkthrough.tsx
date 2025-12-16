import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, ListChecks, Quote } from 'lucide-react';
import { CitedMarkdown } from './CitedMarkdown';
import type { AgentType } from '../../lib/multiAgentTypes';

type FlagSeverity = 'high' | 'medium' | 'low';

interface WalkthroughFlag {
  title: string;
  severity: FlagSeverity;
  rationale: string;
  citations?: string[];
}

interface AnalystWalkthroughProps {
  title?: string;
  agent?: AgentType | 'sonny';
  intro?: string;
  questions?: string[];
  keyTakeaways?: string[];
  whatWeLearn?: Array<{ label: string; value: React.ReactNode }>;
  flags?: WalkthroughFlag[];
  nextSteps?: string[];
  /**
   * Optional: keep the original agent output available for auditability.
   * When provided, it will render in a collapsible "Source" section.
   */
  sourceMarkdown?: string;
}

function severityClasses(severity: FlagSeverity): { badge: string; icon: string } {
  if (severity === 'high') return { badge: 'bg-danger/20 text-danger border-danger/40', icon: 'text-danger' };
  if (severity === 'medium') return { badge: 'bg-warning/20 text-warning border-warning/40', icon: 'text-warning' };
  return { badge: 'bg-surface/60 text-textSecondary border-white/10', icon: 'text-textSecondary' };
}

export function AnalystWalkthrough({
  title = 'Analyst Walkthrough',
  agent,
  intro,
  questions = [],
  keyTakeaways = [],
  whatWeLearn = [],
  flags = [],
  nextSteps = [],
  sourceMarkdown,
}: AnalystWalkthroughProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-bold text-textPrimary">{title}</p>
          {agent && <p className="text-sm text-textSecondary mt-1">Perspective: {agent}</p>}
          {intro && <p className="text-base text-textSecondary mt-3 leading-relaxed">{intro}</p>}
        </div>
      </div>

      {questions.length > 0 && (
        <div className="bg-surfaceElevated rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-textPrimary">Questions this tile is trying to answer</p>
          </div>
          <ol className="space-y-2">
            {questions.map((q, idx) => (
              <li key={idx} className="text-base text-textSecondary flex items-baseline gap-3">
                <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                <span className="flex-1">{q}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {keyTakeaways.length > 0 && (
        <div className="bg-success/10 rounded-xl border border-success/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-base font-bold text-textPrimary">Key takeaways</p>
          </div>
          <ul className="space-y-2">
            {keyTakeaways.map((t, idx) => (
              <li key={idx} className="text-base text-textSecondary flex items-baseline gap-3">
                <span className="text-success font-bold flex-shrink-0">•</span>
                <span className="flex-1">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {whatWeLearn.length > 0 && (
        <div className="bg-surfaceElevated rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-textPrimary">What this data tells us</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whatWeLearn.map((row, idx) => (
              <div key={idx} className="bg-surface/50 rounded-lg border border-white/10 p-4">
                <p className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-2">
                  {row.label}
                </p>
                <div className="text-base text-textPrimary leading-relaxed">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {flags.length > 0 && (
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <p className="text-base font-bold text-textPrimary">Flags to revisit</p>
          </div>
          <div className="space-y-3">
            {flags.map((f, idx) => {
              const cls = severityClasses(f.severity);
              return (
                <div key={idx} className="bg-surface/40 rounded-lg border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-textPrimary">{f.title}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${cls.badge}`}>
                      {f.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary mt-2 leading-relaxed">{f.rationale}</p>
                  {f.citations && f.citations.length > 0 && (
                    <p className="text-xs text-textTertiary mt-2">
                      Evidence: {f.citations.map((c) => `[${c}]`).join(' ')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="bg-surfaceElevated rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-primary" />
            <p className="text-base font-bold text-textPrimary">What we’d do next</p>
          </div>
          <ul className="space-y-2">
            {nextSteps.map((s, idx) => (
              <li key={idx} className="text-base text-textSecondary flex items-baseline gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sourceMarkdown && sourceMarkdown.trim() && (
        <details className="bg-surfaceElevated rounded-xl border border-white/10 p-5">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-textSecondary" />
              <p className="text-base font-bold text-textPrimary">Agent’s Full Response</p>
              <span className="text-sm text-textSecondary ml-2">click to expand</span>
            </div>
          </summary>
          <div className="mt-4">
            <CitedMarkdown content={sourceMarkdown} />
          </div>
        </details>
      )}
    </div>
  );
}

