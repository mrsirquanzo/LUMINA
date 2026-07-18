import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Pin,
  FileText,
  Newspaper,
  Target,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useTarget } from '../../contexts/TargetContext';
import { formatTargetDisplayName } from '../../lib/targetNaming';
import { getStoredAgentMode, onAgentModeUpdated } from '../../lib/agentMode';
import { useWatchlistStore } from '../../lib/watchlist/store';
import { buildDemoFeedResponse, DEMO_FEED_PACKS, resolveDemoFeedPack } from '../../lib/intelligence/demoFeedPacks';

type FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical';
type SourceFilter = 'All' | 'Papers' | 'Preprints' | 'News' | 'Trials';

const BLACKLIST_PREFIX = 'lumina:intelligence:blacklist:';
const HIDDEN_ITEMS_PREFIX = 'lumina:intelligence:hiddenItems:';
const PINNED_PREFIX = 'lumina:intelligence:pinned:';
const CURATED_ONLY_PREFIX = 'lumina:intelligence:curatedOnly:';

const CURATED_SOURCES = new Set([
  'PubMed',
  'ClinicalTrials.gov',
  'STAT News',
  'Endpoints News',
  'Fierce Biotech',
  'Fierce Pharma',
  'FDA Press Announcements',
  'EMA News',
]);

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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toPct(score: unknown): number | null {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  if (score <= 1) return clamp(Math.round(score * 100), 0, 100);
  return clamp(Math.round(score), 0, 100);
}

function computeItemConfidencePct(item: Pick<FeedItem, 'score' | 'relevance'>): number {
  const pct = toPct(item.score);
  if (typeof pct === 'number') return pct;
  if (item.relevance === 'high') return 88;
  if (item.relevance === 'medium') return 72;
  return 60;
}

function ConfidenceMeter({ value }: { value: number }) {
  const v = clamp(Math.round(value), 0, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-subtle rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
      </div>
      <span className="text-[10px] font-mono text-textTertiary">{v}%</span>
    </div>
  );
}

function isPreprintSource(source: string): boolean {
  return /biorxiv|medrxiv|arxiv|preprint/i.test(source);
}

function isTopicSubscription(value: string): boolean {
  const pack = resolveDemoFeedPack(value);
  const label = (pack?.target || value).toLowerCase();
  return /\b(landscape|market|space|class|trend|topic)\b/.test(label);
}

function extractSection(markdown: string, headingStartsWith: string): string {
  const md = markdown || '';
  if (!md) return '';
  const esc = escapeRegExp(headingStartsWith);
  // Capture until next "##" or "###" heading at same/higher level.
  const re = new RegExp(`^###\\s+${esc}[^\\n]*\\n+([\\s\\S]*?)(?=\\n##\\s+|\\n###\\s+|$)`, 'm');
  const m = md.match(re);
  return m?.[1]?.trim() || '';
}

function stripInlineCitations(text: string): string {
  return (text || '').replace(/\[source:[^\]]+\](?:\([^)]+\))?/g, '').replace(/\s+/g, ' ').trim();
}

function buildContextSentence(kind: FeedItemType): string {
  if (kind === 'regulatory')
    return 'Regulatory/label-grade signal. Treat as constraints on defensible claims and monitoring burden.';
  if (kind === 'clinical')
    return 'Trial-design/endpoint signal. Interpret through patient selection, comparators, and what would be decision-grade.';
  if (kind === 'publication')
    return 'Peer-reviewed scientific anchor. Use to ground biology assumptions and avoid over-weighting narrative.';
  if (kind === 'deal')
    return 'Capital/BD signal. Less about "truth" and more about what sophisticated counterparties will underwrite right now.';
  return 'Market narrative signal. Treat as contextual until corroborated by primary data and label-grade sources.';
}

function buildImplicationSentence(kind: FeedItemType): string {
  if (kind === 'regulatory') return 'This sets the "rules of the road" (definitions, monitoring, claims) and can create a durable strategy advantage.';
  if (kind === 'clinical') return 'This reframes what counts as meaningful evidence: sustained dosing, comparators, durability, and sequencing relevance.';
  if (kind === 'deal') return 'This signals partnering appetite and what risk profile is being underwritten.';
  return 'Translate this into a decision-grade watchpoint that would change a plan (not just confirm priors).';
}

function buildQuestionSentence(kind: FeedItemType): string {
  if (kind === 'regulatory')
    return 'Which specific label language (definition + monitoring expectations) is the precedent - and how does it constrain trial design?';
  if (kind === 'clinical')
    return 'What single missing datum would convert this from "interesting" to "decision-changing" (endpoint, subgroup, durability, tolerability)?';
  if (kind === 'publication')
    return 'Which translation assumption is most likely wrong (assay, heterogeneity, exposure-response, resistance), and how would we test it quickly?';
  if (kind === 'deal') return "What proof point shifts leverage materially in the next negotiation window - and what's the shortest path to it?";
  return 'What primary data would validate (or falsify) the implied narrative before it hardens into consensus?';
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

interface ArticleAnalysis {
  sourceId: string;
  url: string;
  title: string;
  persona: 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';
  confidencePct: number;
  keyThemes: Array<{
    theme: string;
    direction: 'positive' | 'neutral' | 'watch';
    rationale: string;
    evidenceIds: string[];
  }>;
  sections: {
    theNews: { text: string; evidenceIds: string[] };
    theContext: { text: string; evidenceIds: string[] };
    theImplication: { text: string; evidenceIds: string[] };
    theQuestion: { text: string; evidenceIds: string[] };
  };
  actions: Array<{ action: string; why: string; priority: 'high' | 'medium' | 'low' }>;
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

interface IntelligenceFeedProps {
  initialTarget?: string;
}

export default function IntelligenceFeed({ initialTarget }: IntelligenceFeedProps = {}) {
  const { currentTarget } = useTarget();
  const [agentMode, setAgentMode] = useState(() => getStoredAgentMode());
  const isDemoMode = agentMode === 'demo';

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  // Primary search: fetch a new target/topic for the feed
  const [feedSearchInput, setFeedSearchInput] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [hasCustomTopic, setHasCustomTopic] = useState(false);
  const [assetQuery] = useState('');
  const [companyQuery] = useState('');
  const [targetOverride, setTargetOverride] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const trackedTargets = useWatchlistStore((s) => s.targets);
  const [refreshToken, setRefreshToken] = useState(0);
  const [forceFresh, setForceFresh] = useState(false);
  const [digestMarkdown, setDigestMarkdown] = useState<string>('');
  const [digestMeta, setDigestMeta] = useState<{ generatedAt: string; persona: string } | null>(null);
  const [digestError, setDigestError] = useState<string>('');
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestJobId, setDigestJobId] = useState<string>('');
  const [, setDigestJobStatus] = useState<{ status: string; progress?: number; message?: string } | null>(null);
  const [lastAutoDigestKey, setLastAutoDigestKey] = useState('');
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [articleAnalysisById, setArticleAnalysisById] = useState<Record<string, ArticleAnalysis>>({});
  const [articleAnalysisStatus, setArticleAnalysisStatus] = useState<Record<string, { status: 'idle' | 'loading' | 'error'; error?: string }>>({});

  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

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

  const defaultTrackedTargets = useMemo(() => {
    const fromCurrent = currentTarget?.name?.trim() ? [formatTargetDisplayName(currentTarget.name)] : [];
    const fromDemo = DEMO_FEED_PACKS.map((p) => formatTargetDisplayName(p.target)).filter(Boolean);
    const merged = [...fromCurrent, ...fromDemo].filter(Boolean);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const t of merged) {
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out.slice(0, 8);
  }, [currentTarget?.name]);

  // If nothing is stored yet, seed tracked targets from workspaces + demo packs.
  useEffect(() => {
    useWatchlistStore.getState().seedIfEmpty(defaultTrackedTargets);
  }, [defaultTrackedTargets]);

  function normalizeTargetInput(raw: string): string {
    const v = raw.trim();
    if (!v) return '';
    const compact = v.replace(/\s+/g, '');
    if (/^cmet$/i.test(compact)) return 'MET';
    return compact.toUpperCase();
  }

  function selectSubscription(raw: string) {
    const pack = resolveDemoFeedPack(raw);
    const canonical = pack?.target || formatTargetDisplayName(raw);
    if (!canonical) return;

    if (isTopicSubscription(canonical)) {
      setTargetOverride('');
      setHasCustomTopic(true);
      setTopicQuery(canonical);
    } else {
      setTargetOverride(normalizeTargetInput(canonical));
      setHasCustomTopic(false);
      setTopicQuery(defaultTopic);
    }
    setFeedSearchInput('');
    setSourceFilter('All');
    triggerRefresh(true);
  }

  useEffect(() => {
    const t = (initialTarget ?? '').trim();
    if (!t) {
      setTargetOverride('');
      setHasCustomTopic(false);
      setTopicQuery(defaultTopic);
      setFeedSearchInput('');
      return;
    }
    selectSubscription(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTarget]);

  useEffect(() => {
    if (!isDemoMode || initialTarget?.trim() || currentTarget?.name?.trim() || targetOverride || hasCustomTopic) return;
    setTargetOverride('TROP2');
  }, [currentTarget?.name, hasCustomTopic, initialTarget, isDemoMode, targetOverride]);

  function submitFeedSearch() {
    const raw = feedSearchInput.trim();
    if (!raw) return;
    const pack = resolveDemoFeedPack(raw);
    const canonical = pack?.target || formatTargetDisplayName(raw);
    if (canonical) useWatchlistStore.getState().add(canonical);
    selectSubscription(canonical || raw);
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
  }, [assetQuery, companyQuery, currentTarget?.indication, currentTarget?.name, effectiveTopic, forceFresh, hasCustomTopic, targetOverride]);

  const analysisCacheKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || currentTarget?.name || 'global';
    return `lumina:intelligence:articleAnalysis:v1:${String(ctx).toLowerCase()}`;
  }, [currentTarget?.name, requestParams.q, requestParams.target]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(analysisCacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return;
      setArticleAnalysisById(parsed as Record<string, ArticleAnalysis>);
      setArticleAnalysisStatus({});
    } catch {
      // ignore
    }
  }, [analysisCacheKey]);

  useEffect(() => {
    try {
      const entries = Object.entries(articleAnalysisById);
      if (entries.length === 0) return;
      // avoid unbounded growth
      const limited = Object.fromEntries(entries.slice(0, 80));
      localStorage.setItem(analysisCacheKey, JSON.stringify(limited));
    } catch {
      // ignore
    }
  }, [analysisCacheKey, articleAnalysisById]);

  const trackedTargetsForHeader = useMemo(() => {
    const demoSeeds = isDemoMode ? DEMO_FEED_PACKS.map((pack) => pack.target) : [];
    const seen = new Set<string>();
    return [...demoSeeds, ...trackedTargets]
      .map((value) => resolveDemoFeedPack(value)?.target || formatTargetDisplayName(value))
      .filter((value) => {
        const key = value.toLowerCase();
        if (!value || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [isDemoMode, trackedTargets]);
  const trackedTargetSubscriptions = useMemo(
    () => trackedTargetsForHeader.filter((value) => !isTopicSubscription(value)),
    [trackedTargetsForHeader]
  );
  const trackedTopicSubscriptions = useMemo(
    () => trackedTargetsForHeader.filter((value) => isTopicSubscription(value)),
    [trackedTargetsForHeader]
  );
  const unreadQueries = useQueries({
    queries: trackedTargetsForHeader.map((t) => ({
      queryKey: ['intelligence-unread', t],
      queryFn: async () => {
        const url = new URL('/api/intelligence/unread', window.location.origin);
        url.searchParams.set('target', t);
        const res = await fetch(url.toString(), { method: 'GET' });
        if (!res.ok) return { unreadCount: 0 };
        return (await res.json()) as { unreadCount: number };
      },
      enabled: Boolean(t) && !isDemoMode,
      staleTime: 30_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    })),
  });

  const unreadByTarget = useMemo(() => {
    const map = new Map<string, number>();
    trackedTargetsForHeader.forEach((t, idx) => {
      const q = unreadQueries[idx];
      map.set(t, (q.data as any)?.unreadCount ?? 0);
    });
    return map;
  }, [trackedTargetsForHeader, unreadQueries]);

  const blacklistKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || 'global';
    return `${BLACKLIST_PREFIX}${ctx.toLowerCase()}`;
  }, [requestParams.q, requestParams.target]);

  const pinnedKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || 'global';
    return `${PINNED_PREFIX}${ctx.toLowerCase()}`;
  }, [requestParams.q, requestParams.target]);

  const hiddenItemsKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || 'global';
    return `${HIDDEN_ITEMS_PREFIX}${ctx.toLowerCase()}`;
  }, [requestParams.q, requestParams.target]);

  const curatedOnlyKey = useMemo(() => {
    const ctx = requestParams.target || requestParams.q || 'global';
    return `${CURATED_ONLY_PREFIX}${ctx.toLowerCase()}`;
  }, [requestParams.q, requestParams.target]);

  const [blacklistedHosts, setBlacklistedHosts] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isCuratedOnly, setIsCuratedOnly] = useState(false);
  const [hiddenItemUrls, setHiddenItemUrls] = useState<string[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string>('');

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(hiddenItemsKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const next = Array.isArray(parsed) ? parsed.map((s) => String(s)).filter(Boolean) : [];
      setHiddenItemUrls(next);
    } catch {
      setHiddenItemUrls([]);
    }
  }, [hiddenItemsKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(pinnedKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const next = Array.isArray(parsed) ? parsed.map((s) => String(s)).filter(Boolean) : [];
      setPinnedIds(next);
    } catch {
      setPinnedIds([]);
    }
  }, [pinnedKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(curatedOnlyKey);
      setIsCuratedOnly(raw === 'true');
    } catch {
      setIsCuratedOnly(false);
    }
  }, [curatedOnlyKey]);

  const blacklistedHostSet = useMemo(() => new Set(blacklistedHosts.map((h) => h.toLowerCase())), [blacklistedHosts]);
  const pinnedIdSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const hiddenUrlSet = useMemo(() => new Set(hiddenItemUrls.map((u) => u.toLowerCase())), [hiddenItemUrls]);

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

  const hideItemUrlForContext = (rawUrl: string) => {
    const u = (rawUrl || '').trim();
    if (!u) return;
    const key = u.toLowerCase();
    if (hiddenUrlSet.has(key)) return;
    const next = [u, ...hiddenItemUrls].slice(0, 200);
    setHiddenItemUrls(next);
    localStorage.setItem(hiddenItemsKey, JSON.stringify(next));
  };

  const clearHiddenItems = () => {
    setHiddenItemUrls([]);
    localStorage.removeItem(hiddenItemsKey);
  };

  const togglePinned = (id: string) => {
    const exists = pinnedIdSet.has(id);
    const next = exists ? pinnedIds.filter((x) => x !== id) : [id, ...pinnedIds].slice(0, 8);
    setPinnedIds(next);
    localStorage.setItem(pinnedKey, JSON.stringify(next));
  };

  const setCuratedOnly = (next: boolean) => {
    setIsCuratedOnly(next);
    localStorage.setItem(curatedOnlyKey, next ? 'true' : 'false');
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

  const exportFeedCsv = () => {
    const rows = filteredItems.map((it) => ({
      date: it.date,
      type: it.type,
      relevance: it.relevance,
      source: it.source,
      title: it.title,
      url: it.link,
      score: typeof it.score === 'number' ? it.score : '',
      matchedTerms: (it.matchedTerms || []).join(', '),
    }));
    const header = Object.keys(rows[0] || { date: '', type: '', relevance: '', source: '', title: '', url: '' });
    const csv = [
      header.join(','),
      ...rows.map((r) =>
        header
          .map((k) => {
            const v = String((r as any)[k] ?? '');
            const escaped = v.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const target = requestParams.target || data?.queryPack?.target || 'intelligence';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${String(target).replace(/\s+/g, '-').toLowerCase()}-intelligence-feed-${date}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const mapKindToSourceType = (kind: FeedItemType): string => {
    if (kind === 'publication') return 'PUB';
    if (kind === 'clinical') return 'CTR';
    if (kind === 'regulatory') return 'REG';
    if (kind === 'deal') return 'PR';
    return 'NEWS';
  };

  const ensureArticleAnalysis = async (item: FeedItem) => {
    if (articleAnalysisById[item.id]) return;
    const status = articleAnalysisStatus[item.id]?.status;
    if (status === 'loading') return;

    setArticleAnalysisStatus((prev) => ({ ...prev, [item.id]: { status: 'loading' } }));

    try {
      const now = new Date().toISOString();
      const targetContext = {
        target: (data?.queryPack?.target ?? requestParams.target ?? null) as string | null,
        asset: (data?.queryPack?.asset ?? requestParams.asset ?? null) as string | null,
        company: (data?.queryPack?.company ?? requestParams.company ?? null) as string | null,
        indication: (data?.queryPack?.indication ?? requestParams.indication ?? null) as string | null,
      };

      const rawItem = {
        sourceId: buildDigestSourceId({ url: item.link, kind: item.type, source: item.source }),
        type: mapKindToSourceType(item.type),
        name: item.source,
        url: item.link,
        publicationDate: item.date || null,
        capturedAt: now,
        title: item.title,
        snippet: item.summary || null,
        abstract: null,
        targetContext,
      };

      const res = await fetch('/api/intelligence/article-analysis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ persona: 'GENERAL', targetContext, item: rawItem }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `Analysis request failed (${res.status})`);

      const parsed = JSON.parse(text) as { analysis: ArticleAnalysis };
      if (!parsed?.analysis?.sections?.theNews?.text) throw new Error('Invalid analysis response');

      setArticleAnalysisById((prev) => ({ ...prev, [item.id]: parsed.analysis }));
      setArticleAnalysisStatus((prev) => ({ ...prev, [item.id]: { status: 'idle' } }));
    } catch (e) {
      setArticleAnalysisStatus((prev) => ({
        ...prev,
        [item.id]: { status: 'error', error: e instanceof Error ? e.message : 'Failed to generate analysis' },
      }));
    }
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
  }, [isDemoMode, requestParams.asset, requestParams.company, requestParams.indication, requestParams.target]);

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
  }, [data, isDemoMode, isError, isFetching, requestParams]);

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

  const digestSummary = useMemo(() => {
    const read = extractSection(digestMarkdown, "Sonny's Read");
    return stripInlineCitations(read.split('\n\n')[0] || read);
  }, [digestMarkdown]);

  const selectedDemoPack = useMemo(
    () => isDemoMode ? resolveDemoFeedPack(data?.queryPack?.target || requestParams.target || requestParams.q) : null,
    [data?.queryPack?.target, isDemoMode, requestParams.q, requestParams.target]
  );
  const selectedSubscriptionLabel =
    selectedDemoPack?.target || data?.queryPack?.target || requestParams.target || requestParams.q || currentTarget?.name || 'Intelligence';
  const automaticSonnyRead =
    selectedDemoPack?.digestBlueprint?.sonnyRead.GENERAL ||
    digestSummary ||
    (isDigestLoading ? 'Sonny is reading the latest sources for this selection.' : 'No cross-source read is available yet. The monitor will add one when grounded sources arrive.');

  const filteredItems = useMemo(() => {
    let filtered = [...feedItems];

    // Demo packs are already curated and should always remain complete.
    if (isCuratedOnly && !isDemoMode) filtered = filtered.filter((item) => CURATED_SOURCES.has(item.source));

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

    // Hide specific items (URL-level) for this context
    if (hiddenUrlSet.size > 0) {
      filtered = filtered.filter((item) => !hiddenUrlSet.has(item.link.toLowerCase()));
    }

    if (sourceFilter === 'Papers') {
      filtered = filtered.filter((item) => item.type === 'publication' && !isPreprintSource(item.source));
    } else if (sourceFilter === 'Preprints') {
      filtered = filtered.filter((item) => item.type === 'publication' && isPreprintSource(item.source));
    } else if (sourceFilter === 'News') {
      filtered = filtered.filter((item) => ['news', 'deal', 'regulatory'].includes(item.type));
    } else if (sourceFilter === 'Trials') {
      filtered = filtered.filter((item) => item.type === 'clinical');
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [feedItems, sourceFilter, blacklistedHostSet, hiddenUrlSet, isCuratedOnly, isDemoMode]);

  const pinnedItems = useMemo(() => {
    if (!pinnedIds.length) return [];
    const byId = new Map(feedItems.map((it) => [it.id, it]));
    return pinnedIds.map((id) => byId.get(id)).filter(Boolean) as FeedItem[];
  }, [feedItems, pinnedIds]);

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

  const hiddenItemCount = useMemo(() => {
    if (hiddenUrlSet.size === 0) return 0;
    return feedItems.filter((it) => hiddenUrlSet.has(it.link.toLowerCase())).length;
  }, [feedItems, hiddenUrlSet]);

  const formatRelativeTime = (iso: string) => {
    const dt = parseISO(iso);
    if (Number.isNaN(dt.getTime())) return '-';
    try {
      return formatDistanceToNowStrict(dt, { addSuffix: true });
    } catch {
      return format(dt, 'MMM d');
    }
  };

  const triggerRefresh = (fresh: boolean) => {
    setForceFresh(fresh);
    setRefreshToken((t) => t + 1);
  };

  const sourceFilterOptions = useMemo(
    () => ['Papers', 'Preprints', 'News', 'Trials', 'All'] as SourceFilter[],
    []
  );

  const buildDemoDigestMarkdown = useMemo(() => {
    return (resp: IntelligenceFeedResponse, persona: string) => {
      const now = new Date().toISOString();
      const titleTarget = resp.queryPack.target || resp.query || 'Target';
      const top = (resp.items || []).slice(0, 10);

      const sourcesRows = top.map((it) => {
        const sourceId = buildDigestSourceId({ url: it.url, kind: it.kind, source: it.source });
        return { sourceId, name: it.source, kind: it.kind, url: it.url, title: it.title, date: it.publishedAt, snippet: it.summary };
      });

      const byKind = sourcesRows.reduce<Record<string, typeof sourcesRows>>((acc, s) => {
        (acc[s.kind] ||= []).push(s);
        return acc;
      }, {});

      const topDevelopments = [...sourcesRows]
        .slice(0, 6)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const pack = DEMO_FEED_PACKS.find((p) => p.target.toLowerCase() === String(resp.queryPack.target || '').toLowerCase());
      const blueprint = pack?.digestBlueprint;
      const p = (persona || 'GENERAL').toUpperCase();
      const blueprintTakeaways =
        (blueprint?.executiveTakeaways as any)?.[p] || (blueprint?.executiveTakeaways as any)?.GENERAL || [];
      const blueprintRead = (blueprint?.sonnyRead as any)?.[p] || (blueprint?.sonnyRead as any)?.GENERAL || '';
      const watchlist = blueprint?.watchlist || [];

      const cite = (s?: { sourceId: string }) => (s ? `[source:${s.sourceId}]` : '');
      const citeFromKinds = (kinds: Array<keyof typeof byKind>) => {
        const first = kinds.map((k) => byKind[k]?.[0]).find(Boolean);
        return first ? cite(first) : cite(topDevelopments[0]);
      };

      const executiveTakeaways = [
        ...blueprintTakeaways.map((t: string, idx: number) => {
          const citation =
            idx === 0
              ? citeFromKinds(['publication', 'clinical'])
              : idx === 1
                ? citeFromKinds(['regulatory', 'news'])
                : citeFromKinds(['news', 'deal', 'publication']);
          return `- ${t} ${citation}`.trim();
        }),
      ]
        .slice(0, 5)
        .join('\n');

      const makeGapSlug = (raw: string) => raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'demo-gap';

      const buildContextSentence = (kind: FeedItemType) => {
        if (kind === 'regulatory')
          return 'This is a regulatory/label-grade signal that constrains what claims are defensible and what monitoring burden becomes "standard of care".';
        if (kind === 'clinical')
          return 'This is a trial-design/endpoint signal; interpret through patient selection, comparator, and what would constitute a true value-inflection versus noise.';
        if (kind === 'publication')
          return 'This is a peer-reviewed scientific anchor; use it to ground biomarker/biology assumptions and avoid over-reading trade-press narratives.';
        if (kind === 'deal')
          return "This is a capital/BD signal; it's less about \"truth\" than about what sophisticated counterparties are willing to underwrite right now.";
        return 'This is a market narrative signal; treat it as contextual until corroborated by primary data and label-grade sources.';
      };

      const buildImplicationSentence = (kind: FeedItemType) => {
        if (kind === 'regulatory') return "Strategically, this sets constraints on claims and may create a 'rules-of-the-road' advantage for teams that anticipate monitoring and biomarker expectations.";
        if (kind === 'clinical') return 'Strategically, this reframes what constitutes a meaningful readout: not just efficacy headlines, but sustained dosing, comparators, and sequencing relevance.';
        if (kind === 'deal') return 'Strategically, this signals where partnering appetite exists and what risk profile is being underwritten.';
        return "Strategically, this should be converted into a concrete watchpoint that would change a decision-maker's model, not just confirm priors.";
      };

      const buildQuestionSentence = (kind: FeedItemType) => {
        if (kind === 'regulatory') return 'What exact label language (biomarker definition + monitoring expectations) will become the precedent - and how does it constrain the next trial design?';
        if (kind === 'clinical') return 'What is the single missing piece of data that would convert this from "interesting" to "decision-changing" (endpoint, subgroup, durability, or tolerability)?';
        if (kind === 'publication') return 'Which assumption is most likely wrong when translating this into the clinic (assay, heterogeneity, exposure-response, resistance), and how would we test it quickly?';
        if (kind === 'deal') return "What specific proof point would shift leverage materially in the next negotiation window - and what's the shortest path to that proof?";
        return 'What primary data or label-grade confirmation would validate (or invalidate) the implied narrative before it hardens into consensus?';
      };

      const devBlocks = topDevelopments.slice(0, 3).map((s, i) => {
        const gapSlug = makeGapSlug(`${titleTarget}-${s.kind}-${s.sourceId}`);
        return [
          `**${i + 1}. ${s.title}**`,
          '',
          `**The news:** ${s.snippet} ${cite(s)}`.trim(),
          '',
          `**The context:** ${buildContextSentence(s.kind)} ${cite(s)}`.trim(),
          '',
          `**The implication:** ${buildImplicationSentence(s.kind)} ${cite(s)}`.trim(),
          '',
          `**The question:** ${buildQuestionSentence(s.kind)} [gap:${gapSlug}]`,
        ].join('\n');
      });

      const theme = (label: string, kindKey: keyof typeof byKind) => {
        const items = byKind[kindKey] || [];
        if (!items.length) return '';
        const bullets = items
          .slice(0, 4)
          .map((s) => `- ${s.title} ${cite(s)}`.trim())
          .join('\n');

        const synthesis =
          kindKey === 'publication'
            ? `Synthesis: Use the scientific anchors above to sanity-check biomarker and mechanism assumptions before over-weighting market narrative. ${cite(items[0])}`.trim()
            : kindKey === 'clinical'
              ? `Synthesis: Treat the trial items as a roadmap for what the field considers "decision-grade" evidence - endpoint choices and patient selection will determine whether a readout changes practice. ${cite(items[0])}`.trim()
              : kindKey === 'regulatory'
                ? `Synthesis: Regulatory items set the constraint set: label language, definitions, and monitoring expectations that shape both development strategy and adoption. ${cite(items[0])}`.trim()
                : kindKey === 'deal'
                  ? `Synthesis: Deal items should be interpreted as underwriting signals - what is being funded/partnered, and what execution risks remain. ${cite(items[0])}`.trim()
                  : `Synthesis: News items are best used to track the narrative and competitive framing; validate with primary data where possible. ${cite(items[0])}`.trim();

        return [`#### ${label}`, bullets, '', synthesis, ''].join('\n');
      };

      const sourcesTable = [
        '### Sources',
        '',
        '| ID | Source | Type | Reliability | Link |',
        '|----|--------|------|-------------|------|',
        ...sourcesRows.map((s) => {
          const type = s.kind === 'publication' ? 'PUB' : s.kind === 'clinical' ? 'CTR' : s.kind === 'regulatory' ? 'REG' : s.kind === 'deal' ? 'PR' : 'NEWS';
          const tier = s.kind === 'publication' || s.kind === 'clinical' || s.kind === 'regulatory' ? 'Tier 1' : s.kind === 'deal' ? 'Tier 2' : 'Tier 3';
          let domain = '';
          try {
            domain = new URL(s.url).hostname.replace(/^www\./, '');
          } catch {
            domain = 'source';
          }
          return `| ${s.sourceId} | ${s.name} | ${type} | ${tier} | [${domain}](${s.url}) |`;
        }),
        '',
      ].join('\n');

      const needsVerification = watchlist.length
        ? watchlist
            .slice(0, 4)
            .map((w) => {
              const slug = makeGapSlug(`${titleTarget}-${w}`);
              return `- **Gap:** ${w} **Why it matters:** This is a high-leverage uncertainty that would change the strategic interpretation if resolved. **How to resolve:** Identify the specific data/readout/label detail needed and the fastest path to it. [gap:${slug}]`;
            })
            .join('\n')
        : 'None flagged in demo pack.';

      const seedRead = blueprintRead
        ? `${blueprintRead}`.trim()
        : `The items above should be converted into a concrete thesis: what changed, why it matters, and what would change your view next.`.trim();

      const seedSentenceCount = seedRead.split(/[.!?]\s+/).map((s) => s.trim()).filter(Boolean).length;
      const readPad =
        seedSentenceCount >= 6
          ? ''
          : [
              `The decision-relevant question is not "what happened," but which single uncertainty would most change a board-level call on timing, sequencing, or capital allocation. [gap:${makeGapSlug(`${titleTarget}-highest-leverage-uncertainty`)}]`,
              `If the next data point does not resolve that uncertainty, treat subsequent updates as noise and avoid narrative drift. ${cite(topDevelopments[0])}`.trim(),
              `I would change my view if the strongest "wedge" implied by these sources is invalidated by either label constraints or a competitor readout that closes the gap. ${cite(topDevelopments[0])}`.trim(),
            ].slice(0, Math.max(0, 6 - seedSentenceCount)).join(' ');

      const sonnyRead = `${seedRead} ${readPad} ${cite(topDevelopments[0])}`.trim();

      return [
        `## Intelligence Digest - ${titleTarget}`,
        '',
        `**Generated:** ${now} | **Items analyzed:** ${sourcesRows.length} | **Voice:** ${persona} (demo)`,
        '',
        '---',
        '',
        '### Executive Takeaways',
        executiveTakeaways || '- No items available in this demo pack.',
        '',
        '---',
        '',
        "### What's New (Top Developments)",
        devBlocks.join('\n\n') || 'None.',
        '',
        '---',
        '',
        '### Thematic Breakdown',
        '',
        theme('Clinical / Trials', 'clinical'),
        theme('Regulatory', 'regulatory'),
        theme('Scientific / Mechanism', 'publication'),
        theme('Competitive / Market', 'news'),
        theme('Financial / Deal', 'deal'),
        '---',
        '',
        '### Conflicts / Ambiguities',
        'None detected in provided sources.',
        '',
        '---',
        '',
        '### Needs Verification ⚠️',
        needsVerification,
        '',
        '---',
        '',
        "### Sonny's Read 🎯",
        sonnyRead,
        '',
        '---',
        '',
        sourcesTable,
      ].join('\n');
    };
  }, []);

  const startSonnyDigest = async () => {
    if (!data) return;
    setDigestError('');
    setIsDigestLoading(true);
    // Replace prior digest only when rerunning
    setDigestMarkdown('');
    try {
      const now = new Date().toISOString();
      const persona = 'GENERAL' as const;

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

  const autoDigestKey = data
    ? `${data.queryPack?.target || data.query || requestParams.target || requestParams.q || 'feed'}:${data.fetchedAt || ''}`
    : '';

  useEffect(() => {
    if (!data || !autoDigestKey || autoDigestKey === lastAutoDigestKey) return;
    setLastAutoDigestKey(autoDigestKey);
    void startSonnyDigest();
    // The digest is keyed to the loaded selection; the function intentionally runs once per key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDigestKey, data, lastAutoDigestKey]);

  return (
    <section className="relative max-w-6xl mx-auto">
      {/* Outer rounded container (matches dashboard section styling) */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-black/10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(29,78,216,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(29,78,216,0.05),transparent_40%)]" />
        <div className="relative">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-textPrimary flex items-center gap-2">
                  Intelligence feed
                  {isDemoMode && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold tracking-wide bg-primary/10 border border-primary/20 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                      DEMO DATA
                    </span>
                  )}
                </h1>
                <p className="text-xs text-textSecondary mt-0.5">
                  A live monitor for the targets and topics you follow, read for what changes.
                </p>
              </div>
            </div>

            <div className="relative shrink-0">
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="p-2.5 rounded-xl border border-border text-textSecondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  title="Feed options"
                  aria-label="Feed options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showExportMenu && (
                  <div className="absolute z-50 right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-xl overflow-hidden border border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        exportFeedCsv();
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-textPrimary hover:bg-subtle"
                    >
                      Export feed (.csv)
                    </button>
                    <button
                      type="button"
                      disabled={!digestMarkdown}
                      onClick={() => {
                        setShowExportMenu(false);
                        exportDigest();
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-textPrimary hover:bg-subtle disabled:opacity-50"
                    >
                      Export Sonny digest (.md)
                    </button>
                    <div className="border-t border-border" />
                    <button
                      type="button"
                      onClick={() => setCuratedOnly(!isCuratedOnly)}
                      className="w-full px-3 py-2.5 text-left text-sm text-textSecondary hover:bg-subtle"
                    >
                      {isCuratedOnly ? 'Use all live sources' : 'Use curated live sources'}
                    </button>
                    {hiddenCount > 0 || hiddenItemCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          clearHiddenSources();
                          clearHiddenItems();
                          setShowExportMenu(false);
                        }}
                        className="w-full px-3 py-2.5 text-left text-sm text-textSecondary hover:bg-subtle"
                      >
                        Restore hidden items
                      </button>
                    ) : null}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Target selector + search */}
        <div className="px-6 py-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end">
            <nav aria-label="Intelligence subscriptions" className="space-y-3 min-w-0">
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-textTertiary">Targets</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {trackedTargetSubscriptions.map((subscription) => {
                    const active = selectedSubscriptionLabel.toLowerCase() === subscription.toLowerCase();
                    const unread = unreadByTarget.get(subscription) ?? 0;
                    return (
                      <button
                        key={subscription}
                        type="button"
                        onClick={() => selectSubscription(subscription)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          active
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface border-border text-textSecondary hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {subscription}
                        {unread > 0 ? <span className="ml-1.5 font-mono text-[10px] opacity-70">{unread}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-textTertiary">Topics</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {trackedTopicSubscriptions.map((subscription) => {
                    const active = selectedSubscriptionLabel.toLowerCase() === subscription.toLowerCase();
                    return (
                      <button
                        key={subscription}
                        type="button"
                        onClick={() => selectSubscription(subscription)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          active
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface border-border text-textSecondary hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {subscription}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            <div className="w-full">
              <div className="relative w-full">
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
                  placeholder="Add a target or topic"
                  className="w-full pl-10 pr-20 py-2.5 bg-subtle border border-border rounded-xl text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
                {feedSearchInput ? (
                  <button
                    type="button"
                    onClick={() => setFeedSearchInput('')}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-subtle"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => submitFeedSearch()}
                  disabled={!feedSearchInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-subtle hover:bg-subtle text-textPrimary text-xs font-semibold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit items-center gap-1 p-1 rounded-xl bg-subtle" aria-label="Source filter">
              {sourceFilterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSourceFilter(option)}
                  aria-pressed={sourceFilter === option}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    sourceFilter === option ? 'bg-surface text-primary shadow-sm' : 'text-textTertiary hover:text-textPrimary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-textTertiary">
              {isFetching ? 'Updating automatically' : `Monitoring ${feedItems.length} grounded sources`}
            </p>
          </div>
          {data?.errors?.length ? (
            <p className="mt-3 text-xs text-textSecondary">
              {data.errors.length} source connection{data.errors.length === 1 ? '' : 's'} did not respond. Available results are shown.
            </p>
          ) : null}
        </div>
      </header>

      {/* lightweight toasts */}
      {toast ? (
        <div className="fixed top-20 right-6 z-50 animate-slide-up">
          <div
            className={`glass-elevated rounded-xl px-4 py-3 text-sm font-medium border ${
              toast.tone === 'success'
                ? 'border-emerald-500/30 text-go-text'
                : toast.tone === 'error'
                  ? 'border-red-500/30 text-nogo-text'
                  : 'border-border text-textPrimary'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <main className="px-6 py-8 space-y-6">
        <section aria-labelledby="sonny-read-heading" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.035] p-5">
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" aria-hidden="true" />
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Automatic digest</p>
                  <h2 id="sonny-read-heading" className="font-display text-xl font-semibold text-textPrimary">Sonny's read</h2>
                </div>
                <span className="font-mono text-[10px] text-textTertiary">{selectedSubscriptionLabel} / {feedItems.length} sources</span>
              </div>
              <p className="mt-3 max-w-[82ch] font-display text-[15px] leading-7 text-textSecondary line-clamp-5">
                {automaticSonnyRead}
              </p>
              {digestError && !selectedDemoPack ? (
                <p className="mt-2 text-xs text-textTertiary">The live digest is waiting for a grounded response. Feed items remain available below.</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl font-semibold text-textPrimary">Latest updates</h2>
              <span className="text-xs px-2 py-1 bg-subtle text-textSecondary rounded-lg border border-border">
                {filteredItems.length} items
              </span>
              {pinnedItems.length > 0 ? (
                <span className="text-xs px-2 py-1 bg-primary/5 text-primary rounded-lg border border-primary/20">
                  {pinnedItems.length} pinned
                </span>
              ) : null}
            </div>
            <div className="text-xs text-textTertiary">
              Showing{' '}
              <span className="font-mono">
                {selectedSubscriptionLabel || '-'}
              </span>
            </div>
          </div>

          {isError ? (
            <div className="rounded-2xl border border-border bg-subtle p-6">
              <p className="font-display text-lg text-textPrimary mb-1">No monitored sources are available for this selection yet.</p>
              <p className="text-sm text-textSecondary">
                {error instanceof Error ? error.message : 'The monitor will update automatically when a grounded source is available.'}
              </p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const confidence = computeItemConfidencePct(item);
                const pinned = pinnedIdSet.has(item.id);
                const analysis = articleAnalysisById[item.id];
                const analysisState = articleAnalysisStatus[item.id]?.status ?? 'idle';
                const analysisError = articleAnalysisStatus[item.id]?.error;
                const expanded = expandedItemId === item.id;
                const effectiveConfidence = analysis?.confidencePct ?? confidence;

                // Derive per-item display values
                const itemPmid = item.type === 'publication' ? extractPmidFromUrl(item.link) : null;
                const itemNct = item.type === 'clinical' ? extractNctFromUrl(item.link) : null;
                const isPatent = (() => {
                  const u = (item.link || '').toLowerCase();
                  return (
                    u.includes('espacenet.com') ||
                    u.includes('lens.org') ||
                    u.includes('google.com/patents') ||
                    u.includes('patentscope.wipo.int') ||
                    /\/wo\d{4}/i.test(item.link)
                  );
                })();
                const itemId = itemPmid
                  ? `PMID:${itemPmid}`
                  : itemNct
                    ? itemNct
                    : isPatent
                      ? (() => {
                          const m = item.link.match(/WO\d{4}[\w/]+/i);
                          return m ? m[0].toUpperCase() : null;
                        })()
                      : null;

                const typeLabel = (() => {
                  if (item.type === 'publication') return 'Publication';
                  if (item.type === 'clinical') return 'Clinical trial';
                  if (item.type === 'regulatory') return 'Regulatory';
                  if (item.type === 'deal') return 'Deal';
                  return 'News';
                })();

                const openLabel = (() => {
                  if (item.type === 'clinical') return 'Open trial';
                  if (item.type === 'deal') return 'Open release';
                  if (item.type === 'regulatory') return 'Open filing';
                  if (isPatent) return 'Open patent';
                  return 'Open paper';
                })();

                const sonnyContext = analysis?.sections?.theContext?.text || buildContextSentence(item.type);
                const sonnyImplication = analysis?.sections?.theImplication?.text || buildImplicationSentence(item.type);
                const sonnyQuestion = analysis?.sections?.theQuestion?.text || buildQuestionSentence(item.type);
                const sonnysRead = analysis?.sections?.theImplication?.text || `${item.summary} ${sonnyImplication}`;

                return (
                  <article
                    key={item.id}
                    className={[
                      'group border rounded-2xl overflow-hidden',
                      'shadow-[0_1px_2px_rgba(15,23,42,.04),0_2px_8px_rgba(15,23,42,.035)]',
                      'transition-all duration-200',
                      'hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,.10),0_2px_8px_rgba(15,23,42,.05)]',
                      'active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:transition-none',
                      pinned
                        ? 'border-primary/30 ring-1 ring-primary/10 bg-white hover:border-primary/40'
                        : 'border-border bg-white hover:border-primary/30',
                    ].join(' ')}
                  >
                    <div className="p-[17px_19px]">

                      {/* Source, kind, and date */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {pinned ? (
                          <div className="flex items-center gap-1 text-primary mr-1">
                            <Pin className="w-3 h-3" />
                            <span className="font-mono text-[10px] uppercase tracking-wider">Pinned</span>
                          </div>
                        ) : null}
                        <span className="inline-flex items-center px-2 py-1 rounded-md border border-primary/20 bg-primary/5 font-mono text-[10px] uppercase tracking-wide text-primary">
                          {typeLabel}
                        </span>
                        <span className="text-[11px] font-medium text-textSecondary">{item.source}</span>
                        <span className="flex-1" />
                        <time dateTime={item.date} className="font-mono text-[10px] text-textTertiary">{formatRelativeTime(item.date)}</time>
                      </div>

                      <h3 className="mt-3 text-[15px] font-semibold text-textPrimary leading-[1.4] text-balance">
                        {highlightText(item.title, item.matchedTerms || [])}
                      </h3>

                      {/* 3. Sonny's read - inline implication */}
                      <div className="mt-[10px] flex gap-[9px] items-start">
                        <Sparkles className="w-[15px] h-[15px] text-primary flex-none mt-[3px]" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[.05em] text-textTertiary block mb-0.5">
                            {"Sonny's read"}
                          </span>
                          <p className="font-display text-[14.5px] leading-[1.6] text-textSecondary m-0 max-w-[76ch] line-clamp-2">
                            {sonnysRead}
                          </p>
                        </div>
                      </div>

                      {/* One primary action; source and management controls live inside the expansion. */}
                      <div className="flex items-center gap-3 mt-[14px] flex-wrap">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-textTertiary">{item.relevance} relevance</span>
                        {itemId ? (
                          <span className="font-mono text-[11px] text-textTertiary">{itemId}</span>
                        ) : null}
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={() => {
                            const next = expanded ? '' : item.id;
                            setExpandedItemId(next);
                            if (next && !isDemoMode) void ensureArticleAnalysis(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-[12px] font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          {expanded ? (
                            <>Close read <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>
                              Read Sonny's take
                              {analysisState === 'loading' ? (
                                <span className="text-[10px] opacity-70">...</span>
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Full grounded read and source actions */}
                    <div
                      className={`border-t border-border overflow-hidden transition-all duration-300 ${
                        expanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-5 bg-subtle space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-textPrimary">Sonny's full read</span>
                            {analysisState === 'loading' ? (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-subtle border border-border text-textTertiary animate-pulse">
                                generating...
                              </span>
                            ) : null}
                          </div>
                          <ConfidenceMeter value={effectiveConfidence} />
                        </div>

                        {analysisError && !isDemoMode ? (
                          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                            <p className="text-sm text-textPrimary">The live analysis is not available yet.</p>
                            <p className="text-xs text-nogo-text/70 mt-1 line-clamp-2">{analysisError}</p>
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => void ensureArticleAnalysis(item)}
                                className="px-3 py-2 rounded-xl bg-subtle hover:bg-subtle border border-border text-textPrimary text-sm font-semibold"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Newspaper className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wide block mb-1">The source</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {analysis?.sections?.theNews?.text || item.summary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-subtle border border-border flex items-center justify-center shrink-0 mt-0.5">
                              <Target className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wide block mb-1">The context</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {sonnyContext}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Lightbulb className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wide block mb-1">The implication</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {sonnyImplication}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <HelpCircle className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wide block mb-1">The question</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {sonnyQuestion}
                              </p>
                            </div>
                          </div>
                        </div>

                        {analysis?.keyThemes?.length ? (
                          <div className="pt-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-textTertiary mb-2">Key themes</p>
                            <div className="flex flex-wrap gap-2">
                              {analysis.keyThemes.slice(0, 4).map((t, idx) => (
                                <span
                                  key={`${t.theme}-${idx}`}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold border bg-primary/5 border-primary/20 text-primary"
                                  title={t.rationale}
                                >
                                  {t.theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {analysis?.actions?.length ? (
                          <div className="pt-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-textTertiary mb-2">Actions</p>
                            <ul className="space-y-2">
                              {analysis.actions.slice(0, 3).map((a, idx) => (
                                <li key={`${a.action}-${idx}`} className="text-sm text-textSecondary leading-relaxed">
                                  <span className="font-semibold text-textPrimary">{a.action}</span>
                                  <span className="text-textSecondary"> - {a.why}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-border">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:text-primary/90 font-medium transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {openLabel}
                          </a>
                          <button type="button" onClick={() => togglePinned(item.id)} className="text-xs text-textTertiary hover:text-primary">
                            {pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button type="button" onClick={() => hideItemUrlForContext(item.link)} className="text-xs text-textTertiary hover:text-primary">
                            Hide item
                          </button>
                          <button type="button" onClick={() => hideSourceForContext(item.link)} className="text-xs text-textTertiary hover:text-primary">
                            Hide source
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-textTertiary mx-auto mb-4 opacity-50" />
              <p className="font-display text-lg text-textSecondary mb-2">{isLoading ? 'Reading monitored sources...' : 'No items match this source view.'}</p>
              <p className="text-sm text-textSecondary">{isLoading ? 'The feed will appear as soon as the monitor responds.' : 'Choose another source type or add a different subscription.'}</p>
            </div>
          )}
        </section>
      </main>

      {/* click-outside overlays */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowExportMenu(false)}
        />
      )}
        </div>
      </div>
    </section>
  );
}
