import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  X,
  Ban,
  RefreshCw,
  FileText,
  Newspaper,
  Handshake,
  Shield,
} from 'lucide-react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useTarget } from '../../contexts/TargetContext';
import { formatTargetDisplayName } from '../../lib/targetNaming';
import { usePersona } from '../../contexts/PersonaContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStoredAgentMode, onAgentModeUpdated } from '../../lib/agentMode';
import { buildDemoFeedResponse, DEMO_FEED_PACKS } from '../../lib/intelligence/demoFeedPacks';

type FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical';
type RelevanceFilter = 'Target-specific' | 'Market' | 'Competitive' | 'All';

const BLACKLIST_PREFIX = 'lumina:intelligence:blacklist:';

function extractPmidFromUrl(rawUrl: string): string | null {
  const m = rawUrl.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\b/i);
  return m ? m[1] : null;
}

function extractNctFromUrl(rawUrl: string): string | null {
  const m = rawUrl.match(/clinicaltrials\.gov\/study\/(NCT\d{8})\b/i);
  return m ? m[1].toUpperCase() : null;
}

function hashToBase36(input: string): string {
  // deterministic, fast, good enough for IDs
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return (h >>> 0).toString(36).slice(0, 8);
}

function buildDigestSourceId(it: { url: string; kind: FeedItemType; source: string }): string {
  const pmid = extractPmidFromUrl(it.url);
  if (it.kind === 'publication' && pmid) return `PMID:${pmid}`;
  const nct = extractNctFromUrl(it.url);
  if (it.kind === 'clinical' && nct) return `NCT:${nct}`;
  try {
    const host = new URL(it.url).hostname.replace(/^www\./, '');
    return `URL:${host}:${hashToBase36(it.url)}`;
  } catch {
    return `URL:unknown:${hashToBase36(it.url || it.source)}`;
  }
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueTerms(terms: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of terms) {
    const s = (t || '').trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  // longest first helps prevent partial matches eating longer ones
  return out.sort((a, b) => b.length - a.length);
}

function highlightText(text: string, terms: string[]) {
  const t = text || '';
  const needles = uniqueTerms(terms);
  if (!t || needles.length === 0) return t;

  const re = new RegExp(`(${needles.map(escapeRegExp).join('|')})`, 'ig');
  const parts = t.split(re);
  if (parts.length === 1) return t;

  return parts.map((part, idx) => {
    const isMatch = needles.some((n) => n.toLowerCase() === part.toLowerCase());
    if (!isMatch) return <span key={idx}>{part}</span>;
    return (
      <mark key={idx} className="bg-primary/20 text-primary rounded px-1 py-0.5">
        {part}
      </mark>
    );
  });
}

interface FeedItem {
  id: string;
  date: string;
  type: FeedItemType;
  title: string;
  source: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  link: string;
  tags?: string[];
  score?: number;
  matchedTerms?: string[];
  matchedFields?: Array<'title' | 'summary'>;
}

interface IntelligenceFeedResponse {
  query: string;
  queryPack: {
    target?: string;
    asset?: string;
    company?: string;
    indication?: string;
    synonyms: string[];
    pubmedQuery: string;
    newsQuery: string;
    trialsQuery: string;
    terms: string[];
  };
  sources: string[];
  items: Array<{
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    summary: string;
    kind: FeedItemType;
    relevance: 'high' | 'medium' | 'low';
    tags: string[];
    score: number;
    matchedTerms: string[];
    matchedFields: Array<'title' | 'summary'>;
  }>;
  fetchedAt: string;
  cached: boolean;
  partial: boolean;
  errors: Array<{ sourceId: string; source: string; message: string }>;
}

type IntelligenceFeedParams = {
  limit: number;
  fresh?: boolean;
  // Backwards compatible free-text topic
  q?: string;
  // Structured target-aware params (preferred)
  target?: string;
  asset?: string;
  company?: string;
  indication?: string;
  synonyms?: string[];
};

async function fetchIntelligenceFeed(params: IntelligenceFeedParams) {
  const url = new URL('/api/intelligence/feed', window.location.origin);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.target) url.searchParams.set('target', params.target);
  if (params.asset) url.searchParams.set('asset', params.asset);
  if (params.company) url.searchParams.set('company', params.company);
  if (params.indication) url.searchParams.set('indication', params.indication);
  if (params.synonyms?.length) url.searchParams.set('synonyms', params.synonyms.join(','));
  url.searchParams.set('limit', String(params.limit));
  if (params.fresh) url.searchParams.set('fresh', 'true');

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      const msg = parsed.message || parsed.error || `Feed request failed (${res.status})`;
      throw new Error(msg);
    } catch {
      throw new Error(text || `Feed request failed (${res.status})`);
    }
  }
  return (await res.json()) as IntelligenceFeedResponse;
}

async function markIntelligenceSeen(params: Omit<IntelligenceFeedParams, 'limit' | 'fresh'>) {
  const url = new URL('/api/intelligence/mark-seen', window.location.origin);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      target: params.target,
      asset: params.asset,
      company: params.company,
      indication: params.indication,
    }),
  });
  if (!res.ok) return;
}

async function fetchExistingDigest(params: {
  target?: string;
  asset?: string;
  company?: string;
  indication?: string;
}) {
  const url = new URL('/api/intelligence/digest', window.location.origin);
  if (params.target) url.searchParams.set('target', params.target);
  if (params.asset) url.searchParams.set('asset', params.asset);
  if (params.company) url.searchParams.set('company', params.company);
  if (params.indication) url.searchParams.set('indication', params.indication);
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) return null;
  const data = (await res.json()) as { digest?: { markdown: string; generatedAt: string; persona: string } | null };
  return data.digest ?? null;
}

async function generateDigest(payload: {
  generatedAt: string;
  persona: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  targetContext: { target?: string | null; asset?: string | null; company?: string | null; indication?: string | null };
  items: Array<{
    sourceId: string;
    type: string;
    name: string;
    url: string;
    publicationDate?: string | null;
    capturedAt: string;
    title: string;
    snippet?: string | null;
    abstract?: string | null;
    targetContext: { target?: string | null; asset?: string | null; company?: string | null; indication?: string | null };
    evidenceIds?: string[];
  }>;
  isDemo?: boolean;
}) {
  const url = new URL('/api/intelligence/digest', window.location.origin);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      throw new Error(parsed.message || parsed.error || 'Failed to generate digest');
    } catch {
      throw new Error(text || 'Failed to generate digest');
    }
  }
  return JSON.parse(text) as { digestMarkdown: string };
}

async function startDigestJob(payload: {
  generatedAt: string;
  persona: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  targetContext: { target?: string | null; asset?: string | null; company?: string | null; indication?: string | null };
  items: Array<{
    sourceId: string;
    type: string;
    name: string;
    url: string;
    publicationDate?: string | null;
    capturedAt: string;
    title: string;
    snippet?: string | null;
    abstract?: string | null;
    targetContext: { target?: string | null; asset?: string | null; company?: string | null; indication?: string | null };
    evidenceIds?: string[];
  }>;
  isDemo?: boolean;
}) {
  const url = new URL('/api/intelligence/digest-jobs/start', window.location.origin);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Failed to start digest job');
  return JSON.parse(text) as { jobId: string; entryKey: string; status: string };
}

async function fetchJob(jobId: string) {
  const url = new URL(`/api/intelligence/digest-jobs/${encodeURIComponent(jobId)}`, window.location.origin);
  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error('Job not found');
  return (await res.json()) as { status: string; progress?: number; message?: string; error?: string; entryKey: string };
}

export default function IntelligenceFeed() {
  const { currentTarget } = useTarget();
  const { activePersona } = usePersona();
  const [agentMode, setAgentMode] = useState(() => getStoredAgentMode());
  const isDemoMode = agentMode === 'demo';

  const [typeFilter, setTypeFilter] = useState<FeedItemType | 'All'>('All');
  const [relevanceFilter, setRelevanceFilter] = useState<RelevanceFilter>('All');
  // Primary search: fetch a new target/topic for the feed
  const [feedSearchInput, setFeedSearchInput] = useState('');
  // Secondary: filter within the currently loaded feed items
  const [feedFilterInput, setFeedFilterInput] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [hasCustomTopic, setHasCustomTopic] = useState(false);
  const [assetQuery, setAssetQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [targetOverride, setTargetOverride] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [forceFresh, setForceFresh] = useState(false);
  const [digestMarkdown, setDigestMarkdown] = useState<string>('');
  const [digestMeta, setDigestMeta] = useState<{ generatedAt: string; persona: string } | null>(null);
  const [digestError, setDigestError] = useState<string>('');
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestJobId, setDigestJobId] = useState<string>('');
  const [digestJobStatus, setDigestJobStatus] = useState<{ status: string; progress?: number; message?: string } | null>(null);

  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  const digestMarkdownLinked = useMemo(() => {
    if (!digestMarkdown) return '';

    // Parse Sources table for id -> url mapping
    const map = new Map<string, string>();
    const lines = digestMarkdown.split('\n');
    let inSourcesTable = false;
    for (const line of lines) {
      if (line.trim() === '### Sources') {
        inSourcesTable = true;
        continue;
      }
      if (!inSourcesTable) continue;
      if (!line.trim().startsWith('|')) continue;
      // Example: | news-001 | STAT News | NEWS | Tier 3 | [statnews.com](https://statnews.com/...) |
      const m = line.match(/^\|\s*([^|]+?)\s*\|[\s\S]*?\((https?:\/\/[^)]+)\)\s*\|/);
      if (m) map.set(m[1].trim(), m[2].trim());
      const m2 = line.match(/^\|\s*([^|]+?)\s*\|[\s\S]*?\|\s*(https?:\/\/[^\s|]+)\s*\|/);
      if (m2) map.set(m2[1].trim(), m2[2].trim());
    }

    return digestMarkdown.replace(/\[source:([^\]]+)\]/g, (full, id) => {
      const url = map.get(String(id).trim());
      if (!url) return full;
      return `[source:${id}](${url})`;
    });
  }, [digestMarkdown]);

  const defaultTopic = useMemo(() => {
    const target = currentTarget?.name?.trim();
    if (!target) return 'biotech';
    const indication = currentTarget?.indication?.trim();
    return indication ? `${target} ${indication}` : target;
  }, [currentTarget?.indication, currentTarget?.name]);

  useEffect(() => {
    if (hasCustomTopic) return;
    setTopicQuery(defaultTopic);
  }, [defaultTopic, hasCustomTopic]);

  const effectiveTopic = topicQuery.trim() || defaultTopic;

  function normalizeTargetInput(raw: string): string {
    const v = raw.trim();
    if (!v) return '';
    const compact = v.replace(/\s+/g, '');
    if (/^cmet$/i.test(compact)) return 'MET';
    return compact.toUpperCase();
  }

  function submitFeedSearch() {
    const raw = feedSearchInput.trim();
    if (!raw) return;
    const isSingleToken = !/\s/.test(raw) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(raw);
    if (isSingleToken) {
      setTargetOverride(normalizeTargetInput(raw));
      setHasCustomTopic(false);
      setTopicQuery(defaultTopic);
      triggerRefresh(true);
      return;
    }
    setTargetOverride('');
    setHasCustomTopic(true);
    setTopicQuery(raw);
    triggerRefresh(true);
  }

  const requestParams = useMemo<IntelligenceFeedParams>(() => {
    const limit = 36;
    if (hasCustomTopic) {
      return { q: effectiveTopic, limit, fresh: forceFresh };
    }

    const target = targetOverride.trim() || currentTarget?.name?.trim();
    if (target) {
      return {
        target,
        indication: currentTarget?.indication?.trim() || undefined,
        asset: assetQuery.trim() || undefined,
        company: companyQuery.trim() || undefined,
        limit,
        fresh: forceFresh,
      };
    }

    return { q: effectiveTopic, limit, fresh: forceFresh };
  }, [assetQuery, companyQuery, currentTarget?.indication, currentTarget?.name, effectiveTopic, forceFresh, hasCustomTopic]);

  const blacklistKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || 'global';
    return `${BLACKLIST_PREFIX}${ctx.toLowerCase()}`;
  }, [requestParams.q, requestParams.target]);

  const [blacklistedHosts, setBlacklistedHosts] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(blacklistKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const next = Array.isArray(parsed) ? parsed.map((s) => String(s)).filter(Boolean) : [];
      setBlacklistedHosts(next);
    } catch {
      setBlacklistedHosts([]);
    }
  }, [blacklistKey]);

  const blacklistedHostSet = useMemo(() => new Set(blacklistedHosts.map((h) => h.toLowerCase())), [blacklistedHosts]);

  const hideSourceForContext = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (!host) return;
      if (blacklistedHostSet.has(host)) return;
      const next = [...blacklistedHosts, host];
      setBlacklistedHosts(next);
      localStorage.setItem(blacklistKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearHiddenSources = () => {
    setBlacklistedHosts([]);
    localStorage.removeItem(blacklistKey);
  };

  // Persist jobId per target context so leaving the page doesn't reset progress.
  const jobStorageKey = useMemo(() => {
    const t = requestParams.target || '';
    const a = requestParams.asset || '';
    const c = requestParams.company || '';
    const i = requestParams.indication || '';
    return `lumina:intelligence:digestJob:${t}|${a}|${c}|${i}`;
  }, [requestParams.asset, requestParams.company, requestParams.indication, requestParams.target]);

  useEffect(() => {
    if (isDemoMode) return;
    const saved = localStorage.getItem(jobStorageKey);
    if (saved && !digestJobId) setDigestJobId(saved);
  }, [isDemoMode, jobStorageKey, digestJobId]);

  useEffect(() => {
    if (isDemoMode) return;
    if (!digestJobId) return;
    localStorage.setItem(jobStorageKey, digestJobId);
  }, [isDemoMode, digestJobId, jobStorageKey]);

  // Poll job status while running; if user leaves and comes back, polling resumes.
  const { data: jobData } = useQuery({
    queryKey: ['intelligence-digest-job', digestJobId],
    queryFn: () => fetchJob(digestJobId),
    enabled: Boolean(digestJobId) && !isDemoMode,
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      if (s === 'completed' || s === 'failed') return false;
      return 2000;
    },
  });

  useEffect(() => {
    if (!jobData) return;
    setDigestJobStatus({ status: jobData.status, progress: jobData.progress, message: jobData.message });
    if (jobData.status === 'failed') {
      setDigestError(jobData.error || 'Digest job failed');
      setIsDigestLoading(false);
      localStorage.removeItem(jobStorageKey);
      setDigestJobId('');
    }
    if (jobData.status === 'completed') {
      setIsDigestLoading(false);
      localStorage.removeItem(jobStorageKey);
      setDigestJobId('');
      // Pull the stored digest for this context
      void (async () => {
        const existing = await fetchExistingDigest({
          target: requestParams.target,
          asset: requestParams.asset,
          company: requestParams.company,
          indication: requestParams.indication,
        });
        if (existing) {
          setDigestMarkdown(existing.markdown);
          setDigestMeta({ generatedAt: existing.generatedAt, persona: existing.persona });
        }
      })();
    }
  }, [jobData, jobStorageKey, requestParams.asset, requestParams.company, requestParams.indication, requestParams.target]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<IntelligenceFeedResponse, Error>({
    queryKey: ['intelligence-feed', requestParams, refreshToken, agentMode],
    queryFn: async () => {
      if (!isDemoMode) return await fetchIntelligenceFeed(requestParams);

      const demo = buildDemoFeedResponse({
        target: requestParams.target,
        q: requestParams.q,
        limit: requestParams.limit,
        refreshToken,
        mode: 'demo',
      });

      if (!demo) {
        const available = DEMO_FEED_PACKS.map((p) => p.target).join(', ');
        throw new Error(`Demo feed is available for: ${available}.`);
      }

      return demo as unknown as IntelligenceFeedResponse;
    },
    enabled: Boolean(effectiveTopic),
    refetchInterval: isDemoMode ? false : 5 * 60 * 1000, // keep it "live" without hammering sources
  });

  const exportDigest = () => {
    if (!digestMarkdown) return;
    const target = requestParams.target || data?.queryPack?.target || 'intelligence';
    const date = (digestMeta?.generatedAt || new Date().toISOString()).slice(0, 10);
    const filename = `${String(target).replace(/\s+/g, '-').toLowerCase()}-sonny-digest-${date}.md`;

    const blob = new Blob([digestMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // TanStack Query v5 removed per-query lifecycle callbacks (onSettled/onSuccess/onError).
  // Reset the "force fresh" flag once the in-flight fetch completes.
  useEffect(() => {
    if (!isFetching) setForceFresh(false);
  }, [isFetching]);

  // Load last stored digest for this target context (Phase 3)
  useEffect(() => {
    if (isDemoMode) return;
    const target = requestParams.target;
    if (!target) return;
    void (async () => {
      const existing = await fetchExistingDigest({
        target,
        asset: requestParams.asset,
        company: requestParams.company,
        indication: requestParams.indication,
      });
      if (!existing) return;
      setDigestMarkdown(existing.markdown);
      setDigestMeta({ generatedAt: existing.generatedAt, persona: existing.persona });
    })();
  }, [requestParams.asset, requestParams.company, requestParams.indication, requestParams.target]);

  // Phase 2: mark this feed context as "seen" when the view is loaded.
  useEffect(() => {
    if (isDemoMode) return;
    if (!data || isFetching || isError) return;
    if (requestParams.q) return; // only track structured contexts for now
    void markIntelligenceSeen({
      target: requestParams.target,
      asset: requestParams.asset,
      company: requestParams.company,
      indication: requestParams.indication,
      synonyms: requestParams.synonyms,
      q: requestParams.q,
    });
  }, [data, isError, isFetching, requestParams]);

  const feedItems: FeedItem[] = useMemo(() => {
    const items = data?.items ?? [];
    return items.map((it) => ({
      id: it.id,
      date: it.publishedAt,
      type: it.kind,
      title: it.title,
      source: it.source,
      summary: it.summary,
      relevance: it.relevance,
      link: it.url,
      tags: it.tags,
      score: it.score,
      matchedTerms: it.matchedTerms,
      matchedFields: it.matchedFields,
    }));
  }, [data?.items]);

  const filteredItems = useMemo(() => {
    let filtered = [...feedItems];

    // Hide user-marked irrelevant sources for this context
    if (blacklistedHostSet.size > 0) {
      filtered = filtered.filter((item) => {
        try {
          const u = new URL(item.link);
          const host = u.hostname.replace(/^www\./, '').toLowerCase();
          return !blacklistedHostSet.has(host);
        } catch {
          return true;
        }
      });
    }

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Relevance filter
    if (relevanceFilter !== 'All') {
      if (relevanceFilter === 'Target-specific')
        filtered = filtered.filter((item) => (item.matchedTerms?.length ?? 0) > 0 || item.relevance === 'high');
      else if (relevanceFilter === 'Market')
        filtered = filtered.filter((item) => item.type === 'news' || item.type === 'deal');
      else if (relevanceFilter === 'Competitive')
        filtered = filtered.filter((item) => item.type === 'deal' || item.title.toLowerCase().includes('competi'));
    }

    // Search filter
    if (feedFilterInput) {
      const query = feedFilterInput.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query)
      );
    }

    return filtered.sort(
      (a, b) =>
        (b.score ?? 0) - (a.score ?? 0) || new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [feedItems, typeFilter, relevanceFilter, feedFilterInput, blacklistedHostSet]);

  const hiddenCount = useMemo(() => {
    if (blacklistedHostSet.size === 0) return 0;
    return feedItems.filter((item) => {
      try {
        const u = new URL(item.link);
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        return blacklistedHostSet.has(host);
      } catch {
        return false;
      }
    }).length;
  }, [feedItems, blacklistedHostSet]);

  const getTypeTone = (type: FeedItemType) => {
    switch (type) {
      case 'publication':
        return 'text-info';
      case 'news':
        return 'text-warning';
      case 'deal':
        return 'text-success';
      case 'regulatory':
        return 'text-primary';
      case 'clinical':
        return 'text-info';
      default:
        return 'text-textTertiary';
    }
  };

  const formatRelativeTime = (iso: string) => {
    const dt = parseISO(iso);
    if (Number.isNaN(dt.getTime())) return '—';
    try {
      return formatDistanceToNowStrict(dt, { addSuffix: true });
    } catch {
      return format(dt, 'MMM d');
    }
  };

  const getTypeIcon = (type: FeedItemType) => {
    switch (type) {
      case 'publication':
        return FileText;
      case 'news':
        return Newspaper;
      case 'deal':
        return Handshake;
      case 'regulatory':
        return Shield;
      case 'clinical':
        return FileText;
      default:
        return FileText;
    }
  };

  const triggerRefresh = (fresh: boolean) => {
    setForceFresh(fresh);
    setRefreshToken((t) => t + 1);
  };

  const typeFilters = useMemo(() => {
    const counts = {
      publication: feedItems.filter((i) => i.type === 'publication').length,
      news: feedItems.filter((i) => i.type === 'news').length,
      deal: feedItems.filter((i) => i.type === 'deal').length,
      regulatory: feedItems.filter((i) => i.type === 'regulatory').length,
      clinical: feedItems.filter((i) => i.type === 'clinical').length,
    };
    return [
      // NOTE: "All" needs an icon because the dropdown renders `f.icon` for every option.
      { id: 'All' as const, label: 'All', icon: Filter, count: feedItems.length },
      { id: 'publication' as const, label: 'Papers', icon: FileText, count: counts.publication },
      { id: 'news' as const, label: 'News', icon: Newspaper, count: counts.news },
      { id: 'clinical' as const, label: 'Trials', icon: FileText, count: counts.clinical },
      { id: 'deal' as const, label: 'Deals', icon: Handshake, count: counts.deal },
      { id: 'regulatory' as const, label: 'Regulatory', icon: Shield, count: counts.regulatory },
    ];
  }, [feedItems]);

  const buildDemoDigestMarkdown = useMemo(() => {
    return (resp: IntelligenceFeedResponse, persona: string) => {
      const now = new Date().toISOString();
      const titleTarget = resp.queryPack.target || resp.query || 'Target';
      const top = (resp.items || []).slice(0, 10);

      const sourcesRows = top.map((it) => {
        const sourceId = buildDigestSourceId({ url: it.url, kind: it.kind, source: it.source });
        return { sourceId, name: it.source, kind: it.kind, url: it.url, title: it.title, date: it.publishedAt, snippet: it.summary };
      });

      const bullets = sourcesRows
        .slice(0, 6)
        .map((s) => `- **${s.kind.toUpperCase()}**: [${s.title}](${s.url}) — ${s.snippet} [source:${s.sourceId}]`)
        .join('\n');

      const sourcesTable = [
        '### Sources',
        '',
        '| id | source | type | url |',
        '|---|---|---|---|',
        ...sourcesRows.map((s) => `| ${s.sourceId} | ${s.name} | ${s.kind.toUpperCase()} | ${s.url} |`),
        '',
      ].join('\n');

      return [
        `# Sonny Digest — ${titleTarget}`,
        '',
        `Generated: ${now}`,
        `Persona: ${persona} (demo)`,
        '',
        '## Key updates',
        bullets || '- No items available in this demo pack.',
        '',
        sourcesTable,
      ].join('\n');
    };
  }, []);

  const relevanceOptions = useMemo(
    () =>
      [
        { id: 'All' as const, label: 'All relevance' },
        { id: 'Target-specific' as const, label: 'Target-specific' },
        { id: 'Market' as const, label: 'Market' },
        { id: 'Competitive' as const, label: 'Competitive' },
      ] satisfies Array<{ id: RelevanceFilter; label: string }>,
    []
  );

  const activeTypeFilter = useMemo(
    () => typeFilters.find((f) => f.id === typeFilter) ?? typeFilters[0],
    [typeFilter, typeFilters]
  );

  const startSonnyDigest = async () => {
    if (!data) return;
    setDigestError('');
    setIsDigestLoading(true);
    // Replace prior digest only when rerunning
    setDigestMarkdown('');
    try {
      const now = new Date().toISOString();
      const persona = activePersona === 'scientist' ? 'SCIENTIST' : activePersona === 'bd' ? 'SCOUT' : 'GENERAL';

      // Demo mode: generate digest locally from curated feed items (no API calls).
      if (isDemoMode) {
        const markdown = buildDemoDigestMarkdown(data, persona);
        setDigestMarkdown(markdown);
        setDigestMeta({ generatedAt: now, persona: `${persona} (demo)` });
        setIsDigestLoading(false);
        setDigestJobStatus(null);
        setDigestJobId('');
        return;
      }

      const targetContext = {
        target: data.queryPack.target ?? null,
        asset: data.queryPack.asset ?? null,
        company: data.queryPack.company ?? null,
        indication: data.queryPack.indication ?? null,
      };

      const capturedAt = now;
      const items = (data.items ?? []).slice(0, 10).map((it) => {
        const sourceId = buildDigestSourceId({ url: it.url, kind: it.kind, source: it.source });
        return {
          sourceId,
          type: it.kind === 'publication' ? 'PUB' : it.kind === 'clinical' ? 'CTR' : 'NEWS',
          name: it.source,
          url: it.url,
          publicationDate: it.publishedAt,
          capturedAt,
          title: it.title,
          snippet: it.summary,
          abstract: null,
          targetContext,
          evidenceIds: [sourceId],
        };
      });

      const basePayload = { generatedAt: now, persona, targetContext, items } as const;

      // Live mode: generate digest synchronously (serverless) to avoid relying on background job endpoints.
      // If API keys are missing, fall back to a demo digest on the backend if supported.
      let isDemo = false;
      try {
        const generated = await generateDigest(basePayload);
        setDigestMarkdown(generated.digestMarkdown);
        setDigestMeta({ generatedAt: now, persona });
        setIsDigestLoading(false);
        setDigestJobStatus(null);
        setDigestJobId('');
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('Missing API key') || msg.includes('Missing API key(s)')) {
          isDemo = true;
          const generated = await generateDigest({ ...basePayload, isDemo: true });
          setDigestMarkdown(generated.digestMarkdown);
          setDigestMeta({ generatedAt: now, persona: `${persona} (demo)` });
          setIsDigestLoading(false);
          setDigestJobStatus(null);
          setDigestJobId('');
          return;
        }
        throw e;
      } finally {
        setDigestMeta({ generatedAt: now, persona: isDemo ? `${persona} (demo)` : persona });
      }
    } catch (e) {
      setDigestError(e instanceof Error ? e.message : 'Failed to generate digest');
      setIsDigestLoading(false);
    } finally {
      // Keep loading state; background job will clear it when done.
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-0">
      {/* Minimal sticky header (matches provided redesign) */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-medium tracking-tight text-textPrimary">Intelligence Feed</h1>
            <span className="text-xs text-textTertiary font-mono truncate">
              {data?.queryPack?.target || currentTarget?.name || '—'}
            </span>
          </div>

          {/* icon-only actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={startSonnyDigest}
              disabled={!data || isDigestLoading}
              className="p-2 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-surface/30 transition-colors disabled:opacity-50"
              title="Generate Sonny Digest"
              aria-label="Generate Sonny Digest"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => triggerRefresh(true)}
              disabled={isFetching}
              className="p-2 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-surface/30 transition-colors disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="py-6">
        {/* Unified search + filter dropdown */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textTertiary" />
              <input
                type="text"
                value={feedSearchInput}
                onChange={(e) => setFeedSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitFeedSearch();
                  }
                }}
                placeholder="Search targets or topics (e.g., EGFR, cMET)…"
                className="w-full pl-10 pr-9 py-2.5 bg-surfaceElevated/50 border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              {feedSearchInput ? (
                <button
                  type="button"
                  onClick={() => setFeedSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-textTertiary hover:text-textPrimary hover:bg-surface/40"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-textTertiary">
              <span className="truncate">
                Showing feed for{' '}
                <span className="font-mono">
                  {requestParams.target || requestParams.q || data?.queryPack?.target || currentTarget?.name || '—'}
                </span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => submitFeedSearch()}
                  disabled={!feedSearchInput.trim()}
                  className="px-2 py-1 rounded-md bg-surfaceElevated/60 border border-white/10 text-textSecondary hover:text-textPrimary hover:border-white/20 disabled:opacity-50"
                >
                  Fetch
                </button>
                {(targetOverride || hasCustomTopic) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetOverride('');
                      setHasCustomTopic(false);
                      setTopicQuery(defaultTopic);
                      triggerRefresh(true);
                    }}
                    className="px-2 py-1 rounded-md bg-surfaceElevated/60 border border-white/10 text-textSecondary hover:text-textPrimary hover:border-white/20"
                    title="Reset to dashboard target"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                  showFilters || typeFilter !== 'All' || relevanceFilter !== 'All'
                    ? 'bg-surface border-white/15 text-textPrimary'
                    : 'bg-surfaceElevated/50 border-white/10 text-textSecondary hover:text-textPrimary hover:border-white/15'
                }`}
                aria-label="Filters"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{activeTypeFilter.label}</span>
                <span className="text-xs text-textTertiary">{activeTypeFilter.count}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2">
                    <div className="text-[11px] font-semibold text-textTertiary uppercase tracking-wider px-2 py-1.5">Type</div>
                    {typeFilters.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setTypeFilter(f.id);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${
                          typeFilter === f.id ? 'bg-surfaceElevated text-textPrimary' : 'text-textSecondary hover:text-textPrimary hover:bg-surface/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <f.icon className="w-4 h-4" />
                          <span>{f.label}</span>
                        </div>
                        <span className="text-xs text-textTertiary">{f.count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-white/10 p-2">
                    <div className="text-[11px] font-semibold text-textTertiary uppercase tracking-wider px-2 py-1.5">Relevance</div>
                    {relevanceOptions.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setRelevanceFilter(o.id)}
                        className={`w-full flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${
                          relevanceFilter === o.id ? 'bg-surfaceElevated text-textPrimary' : 'text-textSecondary hover:text-textPrimary hover:bg-surface/40'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-white/10 p-2">
                    <button
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm text-textSecondary hover:text-textPrimary hover:bg-surface/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Advanced</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {showAdvanced && (
                      <div className="mt-2 space-y-2 px-2 pb-2">
                        <input
                          type="text"
                          value={feedFilterInput}
                          onChange={(e) => setFeedFilterInput(e.target.value)}
                          placeholder="Filter within current results (optional)"
                          className="w-full px-3 py-2 bg-surfaceElevated/60 border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                        />
                        <input
                          type="text"
                          value={hasCustomTopic ? topicQuery : ''}
                          onChange={(e) => {
                            setHasCustomTopic(true);
                            setTopicQuery(e.target.value);
                          }}
                          placeholder="Topic override (optional)"
                          className="w-full px-3 py-2 bg-surfaceElevated/60 border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                        />
                        <input
                          type="text"
                          value={assetQuery}
                          onChange={(e) => setAssetQuery(e.target.value)}
                          placeholder="Asset (e.g., sacituzumab govitecan)"
                          className="w-full px-3 py-2 bg-surfaceElevated/60 border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                        />
                        <input
                          type="text"
                          value={companyQuery}
                          onChange={(e) => setCompanyQuery(e.target.value)}
                          placeholder="Company (e.g., Gilead)"
                          className="w-full px-3 py-2 bg-surfaceElevated/60 border border-white/10 rounded-lg text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              setHasCustomTopic(false);
                              setTopicQuery(defaultTopic);
                              setAssetQuery('');
                              setCompanyQuery('');
                              triggerRefresh(true);
                              setShowFilters(false);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-surfaceElevated/50 hover:bg-surface transition-colors text-sm text-textSecondary hover:text-textPrimary"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => {
                              triggerRefresh(true);
                              setShowFilters(false);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-primary/40 bg-primary/15 hover:bg-primary/20 transition-colors text-sm text-primary font-medium disabled:opacity-50"
                            disabled={isFetching}
                          >
                            Apply
                          </button>
                        </div>
                        <p className="text-[11px] text-textTertiary">
                          Tip: changes apply on “Apply” (does a fresh fetch).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Active filters chips */}
          {(typeFilter !== 'All' || relevanceFilter !== 'All') && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surfaceElevated/60 border border-white/10 rounded-full text-xs text-textSecondary">
                  {activeTypeFilter.label}
                  <button onClick={() => setTypeFilter('All')} className="text-textTertiary hover:text-textPrimary">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {relevanceFilter !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surfaceElevated/60 border border-white/10 rounded-full text-xs text-textSecondary">
                  {relevanceOptions.find((r) => r.id === relevanceFilter)?.label}
                  <button onClick={() => setRelevanceFilter('All')} className="text-textTertiary hover:text-textPrimary">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setTypeFilter('All');
                  setRelevanceFilter('All');
                }}
                className="text-xs text-textTertiary hover:text-textPrimary"
              >
                Clear all
              </button>
              {data?.fetchedAt && (
                <span className="text-xs text-textTertiary ml-auto">
                  Updated {(() => {
                    const dt = parseISO(data.fetchedAt);
                    return Number.isNaN(dt.getTime()) ? '—' : format(dt, 'MMM d • h:mm a');
                  })()}
                  {data.cached ? ' (cached)' : ''}
                </span>
              )}
            </div>
          )}

          {/* Subtle source warnings */}
          {data?.errors?.length ? (
            <div className="mt-3 text-xs text-warning">
              Some sources failed to load ({data.errors.length}). Results shown are partial.
            </div>
          ) : null}

          {hiddenCount > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-textTertiary">
              <span className="truncate">{hiddenCount} items hidden (marked not relevant for this target/topic).</span>
              <button
                type="button"
                onClick={clearHiddenSources}
                className="shrink-0 px-2 py-1 rounded-md bg-surfaceElevated/60 border border-white/10 text-textSecondary hover:text-textPrimary hover:border-white/20"
              >
                Clear hidden
              </button>
            </div>
          ) : null}
        </div>

        {/* Digest (progressive disclosure) */}
        {(digestMarkdown || digestError || digestJobStatus) && (
          <details
            className="mb-6 bg-surface border border-white/10 rounded-xl p-4"
            open={Boolean(digestError) || Boolean(digestMarkdown)}
          >
            <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-textPrimary font-semibold">Sonny Digest</p>
                <p className="text-xs text-textTertiary mt-1">
                  {digestJobStatus
                    ? `Status: ${digestJobStatus.status}${typeof digestJobStatus.progress === 'number' ? ` • ${(digestJobStatus.progress * 100).toFixed(0)}%` : ''}${digestJobStatus.message ? ` • ${digestJobStatus.message}` : ''}`
                    : digestMeta
                      ? `Generated ${format(parseISO(digestMeta.generatedAt), 'MMM d, yyyy • h:mm a')} • ${digestMeta.persona}`
                      : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  exportDigest();
                }}
                disabled={!digestMarkdown}
                className="px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary text-sm disabled:opacity-50"
              >
                Export
              </button>
            </summary>

            {digestError ? (
              <p className="text-sm text-danger mt-3">{digestError}</p>
            ) : (
              <div className="mt-4 prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{digestMarkdownLinked}</ReactMarkdown>
              </div>
            )}
          </details>
        )}

        {/* Feed list */}
        {isError ? (
          <div className="bg-surface border border-white/10 rounded-xl p-5">
            <p className="text-textPrimary font-medium mb-1">Couldn’t load live feed</p>
            <p className="text-sm text-textSecondary">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <div className="mt-4">
              <button
                onClick={() => triggerRefresh(true)}
                className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.map((item, index) => {
              const Icon = getTypeIcon(item.type);
              const tone = getTypeTone(item.type);
              return (
                <article
                  key={item.id}
                  className="group p-4 bg-surfaceElevated/30 hover:bg-surfaceElevated/60 border border-white/10 hover:border-white/15 rounded-xl transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.open(item.link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 rounded-md bg-surfaceElevated/60 ${tone}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-textPrimary leading-snug line-clamp-2 group-hover:text-white transition-colors">
                        {highlightText(item.title, item.matchedTerms || [])}
                      </h3>
                      {(item.matchedTerms?.length || 0) > 0 ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surfaceElevated/60 border border-white/10 text-[11px] text-textSecondary">
                            Matched {item.matchedFields?.includes('title') ? 'title' : 'summary'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surfaceElevated/60 border border-white/10 text-[11px] text-textSecondary max-w-full truncate">
                            {uniqueTerms(item.matchedTerms || []).slice(0, 3).join(', ')}
                            {(item.matchedTerms?.length || 0) > 3 ? '…' : ''}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 mt-2 text-xs text-textTertiary">
                        <span className="truncate max-w-[22ch]">{item.source}</span>
                        <span className="text-white/10">·</span>
                        <span>{formatRelativeTime(item.date)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        hideSourceForContext(item.link);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-surface/40"
                      title="Not relevant (hide this source for this target/topic)"
                      aria-label="Not relevant"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-textTertiary mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-textSecondary mb-2">{isLoading ? 'Loading…' : 'No results'}</p>
            <p className="text-sm text-textTertiary">
              {isLoading ? 'Fetching the latest items…' : 'Try adjusting your filters or search.'}
            </p>
          </div>
        )}
      </main>

      {/* Click outside to close filter dropdown */}
      {showFilters && <div className="fixed inset-0 z-30" onClick={() => setShowFilters(false)} />}
    </div>
  );
}
