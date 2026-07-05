import { useQueries } from '@tanstack/react-query';

async function fetchUnread(target: string): Promise<number> {
  try {
    const url = new URL('/api/intelligence/unread', window.location.origin);
    url.searchParams.set('target', target);
    const res = await fetch(url.toString());
    if (!res.ok) return 0;
    const data = (await res.json()) as { unreadCount?: number };
    return Number(data.unreadCount ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function useUnreadCounts(targets: string[]): Record<string, number> {
  const queries = useQueries({
    queries: targets.map((t) => ({
      queryKey: ['unread', t],
      queryFn: () => fetchUnread(t),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const map: Record<string, number> = {};
  targets.forEach((t, i) => {
    map[t] = typeof queries[i]?.data === 'number' ? (queries[i].data as number) : 0;
  });
  return map;
}
