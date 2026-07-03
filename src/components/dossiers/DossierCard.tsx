import { FileText } from 'lucide-react';

export interface DossierItem {
  runId: string;
  target?: string;
  verdict?: string;
  snippet: string;
  savedAt: number;
}

export function normalizeVerdict(verdict?: string): 'GO' | 'WATCH' | 'NO-GO' | 'UNKNOWN' {
  if (!verdict) return 'UNKNOWN';
  const v = verdict.trim().toUpperCase();
  if (v === 'GO') return 'GO';
  if (v === 'WATCH') return 'WATCH';
  if (v === 'NO-GO' || v === 'NOGO' || v === 'NO GO') return 'NO-GO';
  return 'UNKNOWN';
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

function verdictPillClass(normalized: 'GO' | 'WATCH' | 'NO-GO' | 'UNKNOWN'): string {
  if (normalized === 'GO') return 'bg-go text-white';
  if (normalized === 'WATCH') return 'bg-watch text-white';
  if (normalized === 'NO-GO') return 'bg-nogo text-white';
  return 'bg-subtle text-textSecondary';
}

function VerdictPill({ verdict }: { verdict: string | undefined }) {
  const normalized = normalizeVerdict(verdict);
  const label = normalized === 'UNKNOWN' ? '-' : normalized;

  return (
    <span
      className={`inline-flex items-center flex-none font-bold text-xs tracking-wide rounded-full px-3 py-1 ${verdictPillClass(normalized)}`}
    >
      {label}
    </span>
  );
}

interface DossierCardProps {
  item: DossierItem;
  onClick: () => void;
  animationDelay?: number;
}

export function DossierCard({ item, onClick, animationDelay = 0 }: DossierCardProps) {
  const relDate = item.savedAt ? formatRelativeDate(item.savedAt) : '';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open dossier for ${item.target ?? 'unknown target'}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="tactile flex items-center gap-4 px-5 py-4 cursor-pointer transition-transform motion-safe:hover:-translate-y-0.5"
      style={{
        animationDelay: `${animationDelay}ms`,
        background: '#fff',
        border: '1px solid #E6EBF2',
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid rgba(29,78,216,0.5)';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      <VerdictPill verdict={item.verdict} />

      <div className="flex-1 min-w-0">
        <div className="text-[17px] font-semibold text-textPrimary truncate">
          {item.target ?? (
            <span className="text-textSecondary italic">Untitled</span>
          )}
        </div>
        {item.snippet && (
          <div className="text-[12.5px] text-textSecondary truncate mt-0.5">
            {item.snippet}
          </div>
        )}
      </div>

      <div className="flex-none text-right">
        {relDate && (
          <div className="text-[12px] font-medium text-textSecondary">{relDate}</div>
        )}
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <FileText size={11} className="text-textTertiary" />
          <span className="font-mono text-[11px] text-textTertiary">dossier</span>
        </div>
      </div>
    </div>
  );
}

export default DossierCard;
