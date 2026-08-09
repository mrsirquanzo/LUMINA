import { FileText } from 'lucide-react';

export interface DossierItem {
  runId: string;
  target?: string;
  snippet: string;
  savedAt: number;
  refs?: number;
}

export function formatRelativeDate(ts: number): string {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Reports are decision SUPPORT, not a verdict: Sonny assembles the evidence both
// ways and leaves the GO/NO-GO call to the team. So the card leads with a neutral
// "Assessment" tag rather than a GO/WATCH/NO-GO action pill.
function AssessmentTag() {
  return (
    <span className="t-meta inline-flex flex-none items-center gap-1.5 rounded-full border border-border bg-subtle px-3 py-1 font-medium text-textSecondary">
      <FileText size={12} className="text-textTertiary" />
      Assessment
    </span>
  );
}

interface DossierCardProps {
  item: DossierItem;
  onClick: () => void;
}

export function DossierCard({ item, onClick }: DossierCardProps) {
  const relDate = item.savedAt ? formatRelativeDate(item.savedAt) : '';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open report for ${item.target ?? 'unknown target'}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="tactile flex items-center gap-4 px-5 py-4 cursor-pointer transition-transform motion-safe:hover:-translate-y-0.5"
      style={{
        background: '#FFFFFF',
        border: '1px solid #e6e6e6',
        borderRadius: 12,
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid rgba(0,117,222,0.5)';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <AssessmentTag />

      <div className="flex-1 min-w-0">
        <div className="t-h3 truncate text-textPrimary">
          {item.target ?? (
            <span className="text-textSecondary italic">Untitled</span>
          )}
        </div>
        {item.snippet && (
          <div className="t-body-sm mt-0.5 truncate text-textSecondary">
            {item.snippet}
          </div>
        )}
      </div>

      <div className="flex-none text-right">
        {relDate && (
          <div className="t-meta font-medium text-textSecondary">{relDate}</div>
        )}
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <FileText size={11} className="text-textTertiary" />
          <span className="t-meta font-mono text-textTertiary">
            {item.refs && item.refs > 0 ? `${item.refs} refs` : 'report'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default DossierCard;
