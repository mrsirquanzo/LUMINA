import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useWatchlistStore } from '../lib/watchlist/store';
import { getStoredAgentMode, onAgentModeUpdated } from '../lib/agentMode';
import { resolveDemoFeedPack } from '../lib/intelligence/demoFeedPacks';

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
  const url = new URL('/api/intelligence/feed', window.location.origin);
  if (target) url.searchParams.set('target', target);
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`feed request failed (${res.status})`);
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
}

// When the watchlist is empty, seed the home block with a relevant oncology
// target so it shows live, on-topic intelligence instead of an untargeted feed.
const SEED_TARGET = 'TROP2';

export function useLatestSignals(
  limit = 3,
): { items: LatestSignal[]; isLoading: boolean; isError: boolean; target: string; seeded: boolean } {
  const watchTarget = useWatchlistStore((s) => s.targets[0]);
  const seeded = !watchTarget;
  const target = watchTarget ?? SEED_TARGET;
  const [agentMode, setAgentMode] = useState(() => getStoredAgentMode());
  useEffect(() => onAgentModeUpdated(setAgentMode), []);
  const q = useQuery({
    queryKey: ['latest-signals', target, limit],
    queryFn: () => fetchLatest(target, limit),
    staleTime: 60_000,
    retry: false,
    enabled: agentMode === 'live',
  });
  const demoItems = useMemo<LatestSignal[]>(() => {
    if (agentMode !== 'demo') return [];
    const pack = resolveDemoFeedPack(target);
    return (pack?.snapshots[0]?.items ?? []).slice(0, limit).map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      target: pack?.target ?? target,
      date: item.publishedAt,
      url: item.url,
    }));
  }, [agentMode, limit, target]);

  return {
    items: agentMode === 'demo' ? demoItems : q.data ?? [],
    isLoading: agentMode === 'live' && q.isLoading,
    isError: agentMode === 'live' && q.isError,
    target,
    seeded,
  };
}
