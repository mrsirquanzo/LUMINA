import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { DossierCard, type DossierItem } from './DossierCard';
import { DossierDrawer } from './DossierDrawer';

interface DossiersLibraryProps {
  onOpenSonny?: () => void;
}

export function DossiersLibrary({ onOpenSonny }: DossiersLibraryProps) {
  const briefings = useBriefingStore((s) => s.briefings);
  const savedAt = useBriefingStore((s) => s.savedAt);

  const [query, setQuery] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Derive sorted item list from the store - grounded, no fabricated data
  const allItems: DossierItem[] = Object.entries(briefings)
    .map(([runId, b]) => ({
      runId,
      target: b.target,
      snippet: b.executiveRead?.split('\n')[0] ?? '',
      savedAt: savedAt[runId] ?? 0,
      refs: b.references?.length ?? 0,
    }))
    .sort((a, b) => b.savedAt - a.savedAt);

  // Search only. Reports are decision support, not a verdict, so there is
  // nothing to filter a GO/WATCH/NO-GO tab by.
  const visibleItems = allItems.filter((item) =>
    !query || (item.target ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  const isStoreEmpty = allItems.length === 0;

  // ---- True-empty state (zero briefings in store) ----
  if (isStoreEmpty) {
    return (
      <div
        className="w-full min-h-full flex flex-col items-center justify-center py-24 px-6"
        style={{ maxWidth: 940, margin: '0 auto' }}
      >
        <span
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{
            width: 72,
            height: 72,
            background: '#efedeb',
            border: '1px solid #e6e6e6',
          }}
        >
          <BookOpen size={32} style={{ color: '#615d59' }} />
        </span>

        <h2 className="t-h3 mb-2 text-center text-textPrimary">
          No reports yet
        </h2>
        <p className="t-body mb-8 max-w-xs text-center text-textSecondary">
          Every completed Sonny research run lands here, grounded and re-openable
          with its full evidence.
        </p>

        {onOpenSonny && (
          <button
            type="button"
            onClick={onOpenSonny}
            className="t-body-sm inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-white"
            style={{
              background: '#0075de',
              boxShadow: '0 1px 3px rgba(0,117,222,.25)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.18s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#005bab';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#0075de';
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            Ask Sonny a question
          </button>
        )}
      </div>
    );
  }

  // ---- Populated state ----
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '40px 0 56px' }}>
      {/* Header */}
      <h1
        className="t-h2 text-textPrimary"
        style={{ letterSpacing: '-0.01em' }}
      >
        Saved reports
      </h1>
      <p className="t-body mt-1.5 text-textSecondary">
        Every completed research run, grounded and re-openable with its evidence.
      </p>

      {/* Target search input */}
      <div className="mt-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by target..."
          aria-label="Search reports by target"
          className="t-body rounded-sm px-3.5 py-2.5 text-textPrimary placeholder:text-textTertiary"
          style={{
            background: '#FFFFFF',
            border: '1px solid #e6e6e6',
            outline: 'none',
            width: '100%',
            maxWidth: 360,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#0075de';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,117,222,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e6e6e6';
            e.currentTarget.style.boxShadow = '';
          }}
        />
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-3 mt-5">
        {visibleItems.length === 0 ? (
          // Filtered-to-empty - lighter inline message, distinct from the true-empty composition
          <div className="py-12 text-center">
            <p className="t-body text-textSecondary">
              {query ? `No reports match "${query}"` : 'No reports found'}
            </p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <DossierCard
              key={item.runId}
              item={item}
              onClick={() => setSelectedRunId(item.runId)}
            />
          ))
        )}
      </div>

      {/* selectedRunId is held in state for Task 4's DossierDrawer */}
      <DossierDrawer runId={selectedRunId} onClose={() => setSelectedRunId(null)} />
    </div>
  );
}

export default DossiersLibrary;
