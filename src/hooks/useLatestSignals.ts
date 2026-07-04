import { useQuery } from '@tanstack/react-query';
import { useWatchlistStore } from '../lib/watchlist/store';

export interface LatestSignal {
  id: string;
  title: string;
  source: string;
  target?: string;
  date: string; // ISO or empty
  url?: string;
}

/**
 * The feed route (/api/intelligence/feed) returns items already flattened from
 * ProcessedFeedItem into the IntelligenceFeedResponse shape. The relevant fields are:
 *
 *   id          - ProcessedFeedItem.id (pass-through)
 *   title       - ProcessedFeedItem.summary.headline (mapped by the route)
 *   source      - ProcessedFeedItem.source.name (mapped by the route)
 *   url         - ProcessedFeedItem.source.url (mapped by the route)
 *   publishedAt - ProcessedFeedItem.source.publicationDate ?? ProcessedFeedItem.capturedAt (mapped by the route)
 *
 * The target comes from the response envelope's queryPack.target (or falls back
 * to the watchlist target we queried with).
 */

interface FeedResponseItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface FeedResponse {
  queryPack?: { target?: string };
  items?: FeedResponseItem[];
}

async function fetchLatest(target: string | undefined, limit: number): Promise<LatestSignal[]> {
  try {
    const url = new URL('/api/intelligence/feed', window.location.origin);
    if (target) url.searchParams.set('target', target);
    url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as FeedResponse;
    const items = Array.isArray(data.items) ? data.items : [];
    const resolvedTarget = data.queryPack?.target ?? target;
    return items.slice(0, limit).map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      target: resolvedTarget,
      date: item.publishedAt ?? '',
      url: item.url || undefined,
    }));
  } catch {
    return [];
  }
}

export function useLatestSignals(limit = 3): { items: LatestSignal[]; isLoading: boolean; isError: boolean } {
  const target = useWatchlistStore((s) => s.targets[0]);
  const q = useQuery({
    queryKey: ['latest-signals', target, limit],
    queryFn: () => fetchLatest(target, limit),
    staleTime: 60_000,
    retry: false,
  });
  return { items: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}
