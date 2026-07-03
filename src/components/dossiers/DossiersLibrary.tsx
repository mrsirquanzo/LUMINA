import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useBriefingStore } from '../../lib/research/briefingStore';
import { DossierCard, normalizeVerdict, type DossierItem } from './DossierCard';

type FilterTab = 'all' | 'GO' | 'WATCH' | 'NO-GO';

interface DossiersLibraryProps {
  onOpenSonny?: () => void;
}

export function DossiersLibrary({ onOpenSonny }: DossiersLibraryProps) {
  const briefings = useBriefingStore((s) => s.briefings);
  const savedAt = useBriefingStore((s) => s.savedAt);

  const [filter, setFilter] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Derive sorted item list from the store - grounded, no fabricated data
  const allItems: DossierItem[] = Object.entries(briefings)
    .map(([runId, b]) => ({
      runId,
      target: b.target,
      verdict: b.recommendation?.verdict,
      snippet: b.executiveRead?.split('\n')[0] ?? '',
      savedAt: savedAt[runId] ?? 0,
    }))
    .sort((a, b) => b.savedAt - a.savedAt);

  // Per-verdict counts (real, normalized)
  const counts = {
    GO: allItems.filter((i) => normalizeVerdict(i.verdict) === 'GO').length,
    WATCH: allItems.filter((i) => normalizeVerdict(i.verdict) === 'WATCH').length,
    'NO-GO': allItems.filter((i) => normalizeVerdict(i.verdict) === 'NO-GO').length,
  };

  // Apply filter + search
  const visibleItems = allItems.filter((item) => {
    const matchesFilter =
      filter === 'all' || normalizeVerdict(item.verdict) === filter;
    const matchesQuery =
      !query ||
      (item.target ?? '').toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const isStoreEmpty = allItems.length === 0;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All - ${allItems.length}` },
    { key: 'GO', label: counts.GO > 0 ? `GO - ${counts.GO}` : 'GO' },
    { key: 'WATCH', label: counts.WATCH > 0 ? `WATCH - ${counts.WATCH}` : 'WATCH' },
    {
      key: 'NO-GO',
      label: counts['NO-GO'] > 0 ? `NO-GO - ${counts['NO-GO']}` : 'NO-GO',
    },
  ];

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
            background: '#F1F5F9',
            border: '1px solid #E6EBF2',
          }}
        >
          <BookOpen size={32} style={{ color: '#94A3B8' }} />
        </span>

        <h2 className="font-display text-[22px] font-semibold text-textPrimary mb-2 text-center">
          No dossiers yet
        </h2>
        <p className="text-[14px] text-textSecondary text-center max-w-xs mb-8 leading-relaxed">
          Every completed Sonny research run lands here, grounded and re-openable
          with its full evidence.
        </p>

        {onOpenSonny && (
          <button
            onClick={onOpenSonny}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white rounded-lg px-4 py-2.5"
            style={{
              background: '#1D4ED8',
              boxShadow: '0 1px 3px rgba(29,78,216,.25)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.18s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1E40AF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1D4ED8';
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
        className="font-display text-[27px] font-semibold text-textPrimary"
        style={{ letterSpacing: '-0.01em' }}
      >
        Saved dossiers
      </h1>
      <p className="text-[14px] text-textSecondary mt-1.5">
        Every completed research run, grounded and re-openable with its evidence.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mt-5 flex-wrap">
        {tabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="text-[12px] font-semibold rounded-full px-3 py-1.5 cursor-pointer"
              style={{
                background: isActive ? '#EFF6FF' : '#fff',
                border: `1px solid ${isActive ? 'transparent' : '#E6EBF2'}`,
                color: isActive ? '#1D4ED8' : '#475569',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Target search input */}
      <div className="mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by target..."
          aria-label="Search dossiers by target"
          className="text-[14px] text-textPrimary placeholder:text-textTertiary rounded-lg px-3.5 py-2.5"
          style={{
            background: '#fff',
            border: '1px solid #E6EBF2',
            outline: 'none',
            width: '100%',
            maxWidth: 360,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#1D4ED8';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E6EBF2';
            e.currentTarget.style.boxShadow = '';
          }}
        />
      </div>

      {/* Card list */}
      <div className="flex flex-col gap-3 mt-5">
        {visibleItems.length === 0 ? (
          // Filtered-to-empty - lighter inline message, distinct from the true-empty composition
          <div className="py-12 text-center">
            <p className="text-[14px] text-textSecondary">
              {query
                ? `No dossiers match "${query}"`
                : filter !== 'all'
                  ? `No ${filter} dossiers`
                  : 'No dossiers found'}
            </p>
          </div>
        ) : (
          visibleItems.map((item, i) => (
            <DossierCard
              key={item.runId}
              item={item}
              animationDelay={180 + i * 50}
              onClick={() => setSelectedRunId(item.runId)}
            />
          ))
        )}
      </div>

      {/* selectedRunId is held in state for Task 4's DossierDrawer */}
      {selectedRunId !== null && (
        <span
          aria-hidden="true"
          style={{ display: 'none' }}
          data-selected-run-id={selectedRunId}
        />
      )}
    </div>
  );
}

export default DossiersLibrary;
