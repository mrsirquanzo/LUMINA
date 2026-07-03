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

function VerdictPill({ verdict }: { verdict: string | undefined }) {
  const normalized = normalizeVerdict(verdict);

  if (normalized === 'GO') {
    return (
      <span
        className="inline-flex items-center flex-none font-bold text-xs tracking-wide text-white rounded-full px-3 py-1"
        style={{
          background: 'linear-gradient(135deg, #1FB257, #12833F)',
          boxShadow: '0 2px 8px rgba(22,163,74,.26)',
        }}
      >
        GO
      </span>
    );
  }

  if (normalized === 'WATCH') {
    return (
      <span
        className="inline-flex items-center flex-none font-bold text-xs tracking-wide text-white rounded-full px-3 py-1"
        style={{
          background: 'linear-gradient(135deg, #E8920B, #C2740A)',
          boxShadow: '0 2px 8px rgba(217,119,6,.26)',
        }}
      >
        WATCH
      </span>
    );
  }

  if (normalized === 'NO-GO') {
    return (
      <span
        className="inline-flex items-center flex-none font-bold text-xs tracking-wide text-white rounded-full px-3 py-1"
        style={{
          background: 'linear-gradient(135deg, #E23B3B, #B91C1C)',
          boxShadow: '0 2px 8px rgba(220,38,38,.26)',
        }}
      >
        NO-GO
      </span>
    );
  }

  // UNKNOWN verdict - neutral pill
  return (
    <span
      className="inline-flex items-center flex-none font-bold text-xs tracking-wide rounded-full px-3 py-1"
      style={{ background: '#F1F5F9', color: '#475569' }}
    >
      -
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
      className="flex items-center gap-4 px-5 py-4 cursor-pointer"
      style={{
        animationDelay: `${animationDelay}ms`,
        background: '#fff',
        border: '1px solid #E6EBF2',
        borderRadius: 14,
        boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)',
        transition:
          'box-shadow 0.2s cubic-bezier(.33,0,.2,1), transform 0.2s cubic-bezier(.33,0,.2,1), border-color 0.2s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow =
          '0 10px 30px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.05)';
        el.style.borderColor = '#C3D4F2';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = '';
        el.style.boxShadow =
          '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)';
        el.style.borderColor = '#E6EBF2';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
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
        <div className="font-display text-[17px] font-semibold text-textPrimary truncate">
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
