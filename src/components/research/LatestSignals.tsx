/**
 * LatestSignals - home block showing the most recent feed items from the watchlist.
 * Grounded: renders only real rows from useLatestSignals, never fabricated content.
 */

import { useLatestSignals } from '../../hooks/useLatestSignals';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  return `${Math.floor(diffMo / 12)}y ago`;
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="py-2.5 space-y-1.5">
      <div
        className="h-[14px] rounded-md w-3/4 motion-safe:animate-[shimmer_1.4s_infinite_linear]"
        style={{
          background: 'linear-gradient(90deg, #E6EBF2 0%, #F1F5F9 50%, #E6EBF2 100%)',
          backgroundSize: '200% 100%',
        }}
      />
      <div
        className="h-[11px] rounded-md w-2/5 motion-safe:animate-[shimmer_1.4s_infinite_linear]"
        style={{
          background: 'linear-gradient(90deg, #E6EBF2 0%, #F1F5F9 50%, #E6EBF2 100%)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LatestSignals({ onOpenFeed }: { onOpenFeed: () => void }) {
  const { items, isLoading, isError, target, seeded } = useLatestSignals(3);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="t-h3 text-textPrimary">
            Latest signals
          </span>
          <span className="t-meta ml-1.5 text-textTertiary">
            {seeded ? (
              <>
                live from the feed &middot; <span className="font-mono">{target}</span>
              </>
            ) : (
              'from your watchlist'
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenFeed}
          className="t-meta tactile text-primary"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Open feed -&gt;
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="divide-y divide-border">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError ? (
        <p className="t-body-sm py-2 text-textTertiary">Couldn't load latest signals.</p>
      ) : items.length === 0 ? (
        <p className="t-body-sm py-2 text-textSecondary">
          No recent signals yet - add targets to your watchlist and Sonny will surface new papers,
          trials, and patents here.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const ago = timeAgo(item.date);
            const metaParts = [item.source, item.target, ago].filter(Boolean);
            const inner = (
              <div className="py-2.5 tactile">
                <p className="t-body-sm truncate text-textPrimary">
                  {item.title}
                </p>
                {metaParts.length > 0 && (
                  <p className="t-meta mt-0.5 truncate text-textTertiary">
                    {metaParts.map((part, i) => (
                      <span key={i}>
                        {i > 0 && (
                          <span className="mx-1" aria-hidden="true">
                            ·
                          </span>
                        )}
                        {part}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );

            if (item.url) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:bg-surfaceHighlight rounded-md transition-colors duration-150"
                  style={{ textDecoration: 'none' }}
                >
                  {inner}
                </a>
              );
            }
            return (
              <div key={item.id} className="hover:bg-surfaceHighlight rounded-md transition-colors duration-150">
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
