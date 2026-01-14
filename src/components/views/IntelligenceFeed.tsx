import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  X,
  Ban,
  Pin,
  EyeOff,
  Info,
  RefreshCw,
  FileText,
  Newspaper,
  Handshake,
  Shield,
  Target,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  Download,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useTarget } from '../../contexts/TargetContext';
import { formatTargetDisplayName } from '../../lib/targetNaming';
import { usePersona } from '../../contexts/PersonaContext';
import { getStoredAgentMode, onAgentModeUpdated } from '../../lib/agentMode';
import { buildDemoFeedResponse, DEMO_FEED_PACKS } from '../../lib/intelligence/demoFeedPacks';
import { useWorkspaceStore } from '../../lib/workspaces/store';
import { CitedMarkdown } from '../shared/CitedMarkdown';

type FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical';
type RelevanceFilter = 'Target-specific' | 'Market' | 'Competitive' | 'All';

const BLACKLIST_PREFIX = 'lumina:intelligence:blacklist:';
const HIDDEN_ITEMS_PREFIX = 'lumina:intelligence:hiddenItems:';
const PINNED_PREFIX = 'lumina:intelligence:pinned:';
const CURATED_ONLY_PREFIX = 'lumina:intelligence:curatedOnly:';
const TRACKED_TARGETS_KEY = 'lumina:intelligence:trackedTargets:v1';

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

type FeedPriority = 'breaking' | 'high' | 'medium';
type SourceBadgeKind = 'primary' | 'trade' | 'other';

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

function computePriority(item: Pick<FeedItem, 'date' | 'relevance'>): FeedPriority {
  const dt = parseISO(item.date);
  const now = Date.now();
  const ms = Number.isNaN(dt.getTime()) ? Number.POSITIVE_INFINITY : now - dt.getTime();
  if (ms <= 24 * 60 * 60 * 1000) return 'breaking';
  if (item.relevance === 'high') return 'high';
  return 'medium';
}

function computeSourceBadgeKind(source: string, url: string): SourceBadgeKind {
  const s = (source || '').toLowerCase();
  const u = (url || '').toLowerCase();
  const isPrimary =
    s.includes('fda') ||
    s.includes('ema') ||
    s.includes('pubmed') ||
    s.includes('clinicaltrials') ||
    u.includes('fda.gov') ||
    u.includes('ema.europa.eu') ||
    u.includes('pubmed.ncbi.nlm.nih.gov') ||
    u.includes('clinicaltrials.gov');
  if (isPrimary) return 'primary';

  const isTrade =
    s.includes('endpoints') ||
    s.includes('stat') ||
    s.includes('fierce') ||
    s.includes('biopharmadive') ||
    s.includes('biopharma dive') ||
    s.includes('business wire') ||
    s.includes('pr newswire') ||
    u.includes('endpts.com') ||
    u.includes('statnews.com') ||
    u.includes('fierce') ||
    u.includes('biopharmadive.com') ||
    u.includes('businesswire.com') ||
    u.includes('prnewswire.com');
  if (isTrade) return 'trade';

  return 'other';
}

function getSourceBadgeConfig(kind: SourceBadgeKind) {
  if (kind === 'primary')
    return {
      label: 'Primary',
      icon: Shield,
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      iconText: 'text-emerald-400',
    };
  if (kind === 'trade')
    return {
      label: 'Trade',
      icon: Newspaper,
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      iconText: 'text-amber-400',
    };
  return {
    label: 'Other',
    icon: FileText,
    bg: 'bg-slate-500/10',
    border: 'border-white/10',
    text: 'text-textTertiary',
    iconText: 'text-textTertiary',
  };
}

function getPriorityConfig(priority: FeedPriority) {
  if (priority === 'breaking') return { dot: 'bg-red-500', label: 'Breaking', pulse: true, text: 'text-red-300' };
  if (priority === 'high') return { dot: 'bg-amber-500', label: 'High', pulse: false, text: 'text-amber-300' };
  return { dot: 'bg-slate-500', label: 'Medium', pulse: false, text: 'text-textTertiary' };
}

function ConfidenceMeter({ value }: { value: number }) {
  const v = clamp(Math.round(value), 0, 100);
  const bar = v >= 85 ? 'bg-emerald-500' : v >= 70 ? 'bg-amber-500' : 'bg-slate-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-[10px] font-mono text-textTertiary">{v}%</span>
    </div>
  );
}

function PriorityIndicator({ priority }: { priority: FeedPriority }) {
  const c = getPriorityConfig(priority);
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${c.text}`}>{c.label}</span>
    </div>
  );
}

function SourcePill({ source, url }: { source: string; url: string }) {
  const kind = computeSourceBadgeKind(source, url);
  const c = getSourceBadgeConfig(kind);
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${c.border} ${c.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${c.iconText}`} />
      <span className={`text-[11px] font-semibold ${c.text}`}>{source}</span>
    </span>
  );
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

function extractBulletLines(markdown: string): string[] {
  const lines = (markdown || '').split('\n');
  const bullets = lines
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => stripInlineCitations(l.replace(/^-+\s+/, '').trim()));
  return bullets.filter(Boolean);
}

type ThemeDirection = 'positive' | 'watch' | 'neutral';

function inferThemeDirection(text: string): ThemeDirection {
  const t = (text || '').toLowerCase();
  if (t.includes('risk') || t.includes('concern') || t.includes('monitor') || t.includes('watch')) return 'watch';
  if (t.includes('opportun') || t.includes('tailwind') || t.includes('positive')) return 'positive';
  return 'neutral';
}

type PersonaKey = 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';

function buildContextSentence(kind: FeedItemType): string {
  if (kind === 'regulatory')
    return 'Regulatory/label-grade signal. Treat as constraints on defensible claims and monitoring burden.';
  if (kind === 'clinical')
    return 'Trial-design/endpoint signal. Interpret through patient selection, comparators, and what would be decision-grade.';
  if (kind === 'publication')
    return 'Peer-reviewed scientific anchor. Use to ground biology assumptions and avoid over-weighting narrative.';
  if (kind === 'deal')
    return 'Capital/BD signal. Less about “truth” and more about what sophisticated counterparties will underwrite right now.';
  return 'Market narrative signal. Treat as contextual until corroborated by primary data and label-grade sources.';
}

function buildImplicationSentence(kind: FeedItemType, persona: PersonaKey): string {
  if (persona === 'SCIENTIST') {
    if (kind === 'publication') return 'Convert this into a falsifiable hypothesis for patient selection, durability, and AE phenotype.';
    if (kind === 'clinical') return 'Re-evaluate endpoints, biomarker rigor, and whether sustained dosing is feasible at active exposure.';
    if (kind === 'regulatory') return 'Assume label/monitoring expectations shape exposure and therefore durability—plan translational work accordingly.';
    return 'Treat as hypothesis-generating; define what data would confirm or falsify the implied mechanistic edge.';
  }
  if (persona === 'SCOUT') {
    if (kind === 'deal') return 'Translate this into a negotiation surface: what risk is being priced, and what proof point shifts leverage next?';
    if (kind === 'regulatory') return 'Map label language and monitoring expectations to a defensible sequencing/positioning wedge.';
    return 'Convert this into a crisp positioning statement: where do we force adoption, and what must be true for it to hold?';
  }
  if (persona === 'VC') {
    if (kind === 'deal') return 'Update underwriting: where is capital flowing, what execution risk remains, and what catalyst compresses time-to-proof?';
    if (kind === 'regulatory') return 'Adjust timelines and adoption risk assumptions based on regulatory framing and monitoring burden.';
    return 'Update probability-of-success and identify the next catalyst that would actually change the model.';
  }
  // GENERAL
  if (kind === 'regulatory') return 'This sets the “rules of the road” (definitions, monitoring, claims) and can create a durable strategy advantage.';
  if (kind === 'clinical') return 'This reframes what counts as meaningful evidence: sustained dosing, comparators, durability, and sequencing relevance.';
  if (kind === 'deal') return 'This signals partnering appetite and what risk profile is being underwritten.';
  return 'Translate this into a decision-grade watchpoint that would change a plan (not just confirm priors).';
}

function buildQuestionSentence(kind: FeedItemType): string {
  if (kind === 'regulatory')
    return 'Which specific label language (definition + monitoring expectations) is the precedent—and how does it constrain trial design?';
  if (kind === 'clinical')
    return 'What single missing datum would convert this from “interesting” to “decision-changing” (endpoint, subgroup, durability, tolerability)?';
  if (kind === 'publication')
    return 'Which translation assumption is most likely wrong (assay, heterogeneity, exposure-response, resistance), and how would we test it quickly?';
  if (kind === 'deal') return 'What proof point shifts leverage materially in the next negotiation window—and what’s the shortest path to it?';
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

export default function IntelligenceFeed() {
  const { currentTarget } = useTarget();
  const { activePersona } = usePersona();
  const [agentMode, setAgentMode] = useState(() => getStoredAgentMode());
  const isDemoMode = agentMode === 'demo';
  const personaKey: PersonaKey = activePersona === 'scientist' ? 'SCIENTIST' : activePersona === 'bd' ? 'SCOUT' : 'GENERAL';

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [trackedTargets, setTrackedTargets] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TRACKED_TARGETS_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const next = Array.isArray(parsed) ? parsed.map((s) => formatTargetDisplayName(String(s))).filter(Boolean) : [];
      return next.slice(0, 8);
    } catch {
      return [];
    }
  });
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [addTargetInput, setAddTargetInput] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [forceFresh, setForceFresh] = useState(false);
  const [digestMarkdown, setDigestMarkdown] = useState<string>('');
  const [digestMeta, setDigestMeta] = useState<{ generatedAt: string; persona: string } | null>(null);
  const [digestError, setDigestError] = useState<string>('');
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestJobId, setDigestJobId] = useState<string>('');
  const [digestJobStatus, setDigestJobStatus] = useState<{ status: string; progress?: number; message?: string } | null>(null);
  const [isSynthesisExpanded, setIsSynthesisExpanded] = useState(true);
  const [isFullDigestExpanded, setIsFullDigestExpanded] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [articleAnalysisById, setArticleAnalysisById] = useState<Record<string, ArticleAnalysis>>({});
  const [articleAnalysisStatus, setArticleAnalysisStatus] = useState<Record<string, { status: 'idle' | 'loading' | 'error'; error?: string }>>({});

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const getOrCreateWorkspace = useWorkspaceStore((s) => s.getOrCreateWorkspace);
  const addFlag = useWorkspaceStore((s) => s.addFlag);

  useEffect(() => onAgentModeUpdated(setAgentMode), []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

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

  const defaultTrackedTargets = useMemo(() => {
    const fromCurrent = currentTarget?.name?.trim() ? [formatTargetDisplayName(currentTarget.name)] : [];
    const fromWorkspaces = (workspaces || []).map((ws) => formatTargetDisplayName(ws.target)).filter(Boolean);
    const fromDemo = DEMO_FEED_PACKS.map((p) => formatTargetDisplayName(p.target)).filter(Boolean);
    const merged = [...fromCurrent, ...fromWorkspaces, ...fromDemo].filter(Boolean);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const t of merged) {
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out.slice(0, 8);
  }, [currentTarget?.name, workspaces]);

  // If nothing is stored yet, seed tracked targets from workspaces + demo packs.
  useEffect(() => {
    if (trackedTargets.length > 0) return;
    setTrackedTargets(defaultTrackedTargets);
  }, [defaultTrackedTargets, trackedTargets.length]);

  useEffect(() => {
    if (trackedTargets.length === 0) return;
    try {
      localStorage.setItem(TRACKED_TARGETS_KEY, JSON.stringify(trackedTargets));
    } catch {
      // ignore
    }
  }, [trackedTargets]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const trackedTargetsForHeader = useMemo(() => trackedTargets.slice(0, 6), [trackedTargets]);
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
      enabled: Boolean(t),
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
  const [whyOpenId, setWhyOpenId] = useState<string>('');
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

  const applyDemoPreset = () => {
    setCuratedOnly(true);
    setTypeFilter('All');
    setRelevanceFilter('Target-specific');
    setFeedFilterInput('');
    setShowFilters(false);
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

  const addToWorkspace = (item: FeedItem) => {
    try {
      const target = requestParams.target || data?.queryPack?.target || currentTarget?.name || 'Intelligence';
      const ws = getOrCreateWorkspace(target, requestParams.q || target);
      if (!activeWorkspaceId || String(activeWorkspaceId) !== String(ws.id)) setActiveWorkspace(String(ws.id));

      const priority = computePriority(item);
      const severity = priority === 'breaking' ? 'high' : priority === 'high' ? 'medium' : 'low';
      const ctx = requestParams.target || requestParams.q || data?.queryPack?.target || currentTarget?.name || 'global';
      addFlag(`intelligence:${String(ctx).toLowerCase()}:${item.id}`, {
        title: item.title,
        severity,
        note: `${item.link}\n\n${item.summary}`.trim(),
      });

      setToast({ tone: 'success', message: 'Added to workspace' });
    } catch {
      setToast({ tone: 'error', message: 'Could not add to workspace' });
    }
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
        body: JSON.stringify({ persona: personaKey, targetContext, item: rawItem }),
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

  const digestSynthesis = useMemo(() => {
    const itemsForConfidence = (feedItems || []).slice(0, 8);
    const overall =
      itemsForConfidence.length > 0
        ? Math.round(itemsForConfidence.reduce((acc, it) => acc + computeItemConfidencePct(it), 0) / itemsForConfidence.length)
        : 0;

    const takeaways = extractBulletLines(extractSection(digestMarkdown, 'Executive Takeaways')).slice(0, 3);
    const read = extractSection(digestMarkdown, "Sonny's Read");
    const summary = stripInlineCitations(read.split('\n\n')[0] || read);

    const keyThemes = takeaways.map((t) => ({
      theme: (t.split(';')[0] || t).replace(/^Signal:\s*/i, '').trim(),
      detail: t,
      direction: inferThemeDirection(t),
    }));

    return {
      confidence: overall || 0,
      summary,
      keyThemes,
      hasContent: Boolean(summary || keyThemes.length),
    };
  }, [digestMarkdown, feedItems]);

  const filteredItems = useMemo(() => {
    let filtered = [...feedItems];

    // Curated-only mode for investor demos
    if (isCuratedOnly) filtered = filtered.filter((item) => CURATED_SOURCES.has(item.source));

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

    const pr = { breaking: 3, high: 2, medium: 1 } satisfies Record<FeedPriority, number>;
    return filtered.sort((a, b) => {
      const aPinned = pinnedIdSet.has(a.id) ? 1 : 0;
      const bPinned = pinnedIdSet.has(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const aPr = pr[computePriority(a)];
      const bPr = pr[computePriority(b)];
      if (aPr !== bPr) return bPr - aPr;

      return (b.score ?? 0) - (a.score ?? 0) || new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [feedItems, typeFilter, relevanceFilter, feedFilterInput, blacklistedHostSet, hiddenUrlSet, isCuratedOnly, pinnedIdSet]);

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
          return 'This is a regulatory/label-grade signal that constrains what claims are defensible and what monitoring burden becomes “standard of care”.';
        if (kind === 'clinical')
          return 'This is a trial-design/endpoint signal; interpret through patient selection, comparator, and what would constitute a true value-inflection versus noise.';
        if (kind === 'publication')
          return 'This is a peer-reviewed scientific anchor; use it to ground biomarker/biology assumptions and avoid over-reading trade-press narratives.';
        if (kind === 'deal')
          return 'This is a capital/BD signal; it’s less about “truth” than about what sophisticated counterparties are willing to underwrite right now.';
        return 'This is a market narrative signal; treat it as contextual until corroborated by primary data and label-grade sources.';
      };

      const buildImplicationSentence = (kind: FeedItemType) => {
        if (p === 'SCIENTIST') {
          if (kind === 'publication') return 'Mechanistically, the highest leverage next step is to translate this into a testable hypothesis for patient selection, durability, and AE phenotype.';
          if (kind === 'clinical') return 'Scientifically, this should redirect focus to endpoint choice, biomarker rigor, and whether dosing continuity is feasible at effective exposure.';
          if (kind === 'regulatory') return 'Scientifically, assume label/monitoring expectations will shape exposure and therefore observed durability—plan translational work accordingly.';
          return 'Scientifically, treat this as hypothesis-generating: define what data would falsify (or confirm) the implied mechanistic edge.';
        }
        if (p === 'SCOUT') {
          if (kind === 'deal') return 'Commercially, this changes the negotiation surface: counterparties will price execution risk and demand a clear wedge + timing story.';
          if (kind === 'regulatory') return 'Commercially, label language and monitoring expectations can create (or erase) a wedge—design studies to “earn” the sequencing claim you want.';
          return 'Commercially, this should be translated into a sequencing/positioning statement: where do we force adoption, and what must be true for that to hold?';
        }
        if (p === 'VC') {
          if (kind === 'deal') return 'From a returns lens, this is a signal about where capital is flowing and how quickly the market expects value-inflection; align catalyst design to compress time-to-proof.';
          if (kind === 'regulatory') return 'From a returns lens, regulatory framing affects time-to-label and post-approval adoption risk; it should feed directly into thesis sizing and timelines.';
          return 'From a returns lens, this should update the thesis on probability-of-success and the next catalyst that truly changes underwriting.';
        }
        // GENERAL
        if (kind === 'regulatory') return 'Strategically, this sets constraints on claims and may create a “rules-of-the-road” advantage for teams that anticipate monitoring and biomarker expectations.';
        if (kind === 'clinical') return 'Strategically, this reframes what constitutes a meaningful readout: not just efficacy headlines, but sustained dosing, comparators, and sequencing relevance.';
        if (kind === 'deal') return 'Strategically, this signals where partnering appetite exists and what risk profile is being underwritten.';
        return 'Strategically, this should be converted into a concrete watchpoint that would change a decision-maker’s model, not just confirm priors.';
      };

      const buildQuestionSentence = (kind: FeedItemType) => {
        if (kind === 'regulatory') return 'What exact label language (biomarker definition + monitoring expectations) will become the precedent—and how does it constrain the next trial design?';
        if (kind === 'clinical') return 'What is the single missing piece of data that would convert this from “interesting” to “decision-changing” (endpoint, subgroup, durability, or tolerability)?';
        if (kind === 'publication') return 'Which assumption is most likely wrong when translating this into the clinic (assay, heterogeneity, exposure-response, resistance), and how would we test it quickly?';
        if (kind === 'deal') return 'What specific proof point would shift leverage materially in the next negotiation window—and what’s the shortest path to that proof?';
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
              ? `Synthesis: Treat the trial items as a roadmap for what the field considers “decision-grade” evidence—endpoint choices and patient selection will determine whether a readout changes practice. ${cite(items[0])}`.trim()
              : kindKey === 'regulatory'
                ? `Synthesis: Regulatory items set the constraint set: label language, definitions, and monitoring expectations that shape both development strategy and adoption. ${cite(items[0])}`.trim()
                : kindKey === 'deal'
                  ? `Synthesis: Deal items should be interpreted as underwriting signals—what is being funded/partnered, and what execution risks remain. ${cite(items[0])}`.trim()
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
              `The decision-relevant question is not “what happened,” but which single uncertainty would most change a board-level call on timing, sequencing, or capital allocation. [gap:${makeGapSlug(`${titleTarget}-highest-leverage-uncertainty`)}]`,
              `If the next data point does not resolve that uncertainty, treat subsequent updates as noise and avoid narrative drift. ${cite(topDevelopments[0])}`.trim(),
              `I would change my view if the strongest “wedge” implied by these sources is invalidated by either label constraints or a competitor readout that closes the gap. ${cite(topDevelopments[0])}`.trim(),
            ].slice(0, Math.max(0, 6 - seedSentenceCount)).join(' ');

      const sonnyRead = `${seedRead} ${readPad} ${cite(topDevelopments[0])}`.trim();

      return [
        `## Intelligence Digest — ${titleTarget}`,
        '',
        `**Generated:** ${now} | **Items analyzed:** ${sourcesRows.length} | **Persona:** ${persona} (demo)`,
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
    <section className="relative max-w-6xl mx-auto">
      {/* Outer rounded container (matches dashboard section styling) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] via-black/30 to-black/40 shadow-2xl shadow-black/50">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(191,90,242,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.12),transparent_40%)]" />
        <div className="relative">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-cyan-500/10 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-textPrimary">Intelligence Feed</h1>
                <p className="text-xs text-textTertiary truncate">
                  {data?.fetchedAt
                    ? `Last updated ${(() => {
                        const dt = parseISO(data.fetchedAt);
                        return Number.isNaN(dt.getTime()) ? '—' : format(dt, 'MMM d • h:mm a');
                      })()}${data.cached ? ' (cached)' : ''}`
                    : 'Live signal monitoring • click a headline to open source'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => triggerRefresh(true)}
                disabled={isFetching}
                className="p-2.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`p-2.5 rounded-xl transition-colors ${
                  showFilters ? 'bg-primary/15 text-primary border border-primary/30' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'
                }`}
                title="Filters"
                aria-label="Filters"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={startSonnyDigest}
                disabled={!data || isDigestLoading}
                className="p-2.5 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Generate Sonny synthesis"
                aria-label="Generate Sonny synthesis"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-black rounded-xl font-semibold text-sm transition-all shadow-lg shadow-white/10"
                  title="Export"
                  aria-label="Export"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 glass-elevated rounded-xl shadow-2xl overflow-hidden border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        exportFeedCsv();
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-textPrimary hover:bg-white/5"
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
                      className="w-full px-3 py-2.5 text-left text-sm text-textPrimary hover:bg-white/5 disabled:opacity-50"
                    >
                      Export Sonny digest (.md)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Target selector + search */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {trackedTargetsForHeader.map((t) => {
                const active = (requestParams.target || data?.queryPack?.target || currentTarget?.name || '').toLowerCase() === t.toLowerCase();
                const unread = unreadByTarget.get(t) ?? 0;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTargetOverride(normalizeTargetInput(t));
                      setHasCustomTopic(false);
                      setTopicQuery(defaultTopic);
                      setFeedSearchInput('');
                      triggerRefresh(true);
                    }}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      active ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-white/5 text-textSecondary hover:text-textPrimary border border-transparent hover:border-white/10'
                    }`}
                    title={t}
                  >
                    {t}
                    {unread > 0 ? (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${active ? 'bg-primary/25' : 'bg-white/10'}`}>{unread}</span>
                    ) : null}
                    {unread > 0 ? (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                    ) : null}
                  </button>
                );
              })}

              <div className="relative">
                {isAddingTarget ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={addTargetInput}
                      onChange={(e) => setAddTargetInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsAddingTarget(false);
                          setAddTargetInput('');
                        }
                        if (e.key === 'Enter') {
                          const next = formatTargetDisplayName(addTargetInput);
                          if (next) {
                            setTrackedTargets((prev) => {
                              const has = prev.some((p) => p.toLowerCase() === next.toLowerCase());
                              return has ? prev : [next, ...prev].slice(0, 8);
                            });
                          }
                          setIsAddingTarget(false);
                          setAddTargetInput('');
                        }
                      }}
                      placeholder="Add target…"
                      className="w-40 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTarget(false);
                        setAddTargetInput('');
                      }}
                      className="p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-white/5"
                      aria-label="Cancel add target"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTarget(true)}
                    className="p-2 text-textTertiary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors border border-dashed border-white/15 hover:border-primary/30"
                    aria-label="Add target"
                    title="Add target"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center gap-2 justify-end">
              <div className="relative w-full max-w-md">
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
                  placeholder="Search targets or topics (e.g., TROP2, HER3, Nectin-4)…"
                  className="w-full pl-10 pr-20 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                />
                {feedSearchInput ? (
                  <button
                    type="button"
                    onClick={() => setFeedSearchInput('')}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-white/5"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => submitFeedSearch()}
                  disabled={!feedSearchInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-textPrimary text-xs font-semibold disabled:opacity-50"
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showFilters ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-textTertiary font-medium">Filter:</span>
              {typeFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTypeFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    typeFilter === f.id ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 text-[10px] text-textTertiary">{f.count}</span>
                </button>
              ))}
              <span className="w-px h-4 bg-white/10" />
              {relevanceOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRelevanceFilter(r.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    relevanceFilter === r.id ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <span className="w-px h-4 bg-white/10" />
              <button
                type="button"
                onClick={() => setCuratedOnly(!isCuratedOnly)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  isCuratedOnly ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10'
                }`}
                title="Curated-only sources"
              >
                Curated only
              </button>
              <button
                type="button"
                onClick={applyDemoPreset}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-colors"
                title="Demo preset (curated + target-specific)"
              >
                Demo preset
              </button>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg border bg-white/5 border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Advanced
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showAdvanced ? (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={feedFilterInput}
                  onChange={(e) => setFeedFilterInput(e.target.value)}
                  placeholder="Search within loaded items…"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('All');
                      setRelevanceFilter('All');
                      setFeedFilterInput('');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="px-3 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-sm text-primary font-semibold hover:bg-primary/20 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}

            {hiddenCount > 0 || hiddenItemCount > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-textTertiary">
                <span className="truncate">
                  Hidden: {hiddenCount} (source) • {hiddenItemCount} (items)
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {hiddenCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearHiddenSources}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10"
                    >
                      Clear hidden sources
                    </button>
                  ) : null}
                  {hiddenItemCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearHiddenItems}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-textSecondary hover:text-textPrimary hover:bg-white/10"
                    >
                      Clear hidden items
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {data?.errors?.length ? (
              <div className="mt-3 text-xs text-warning">
                Some sources failed to load ({data.errors.length}). Results shown are partial.
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* lightweight toasts */}
      {toast ? (
        <div className="fixed top-20 right-6 z-50 animate-slide-up">
          <div
            className={`glass-elevated rounded-xl px-4 py-3 text-sm font-medium border ${
              toast.tone === 'success'
                ? 'border-emerald-500/30 text-emerald-200'
                : toast.tone === 'error'
                  ? 'border-red-500/30 text-red-200'
                  : 'border-white/10 text-textPrimary'
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <main className="px-6 py-8 space-y-6">
        {/* Sonny synthesis */}
        <section>
          <div className="bg-gradient-to-br from-primary/10 via-black/30 to-black/30 border border-primary/20 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsSynthesisExpanded((v) => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Sonny Synthesis
                    <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                      {isDemoMode ? 'DEMO' : 'AI'}
                    </span>
                  </h2>
                  <p className="text-xs text-textTertiary mt-0.5 truncate">
                    {digestJobStatus
                      ? `Status: ${digestJobStatus.status}${typeof digestJobStatus.progress === 'number' ? ` • ${(digestJobStatus.progress * 100).toFixed(0)}%` : ''}${digestJobStatus.message ? ` • ${digestJobStatus.message}` : ''}`
                      : digestMeta
                        ? `Generated ${format(parseISO(digestMeta.generatedAt), 'MMM d • h:mm a')} • ${digestMeta.persona}`
                        : 'Cross-source analysis (collapsed by default)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <ConfidenceMeter value={digestSynthesis.confidence} />
                {isSynthesisExpanded ? <ChevronUp className="w-5 h-5 text-textSecondary" /> : <ChevronDown className="w-5 h-5 text-textSecondary" />}
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${isSynthesisExpanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-5 pb-5 space-y-4">
                {digestError ? <p className="text-sm text-danger">{digestError}</p> : null}

                {digestSynthesis.summary ? (
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-sm text-textSecondary leading-relaxed">{digestSynthesis.summary}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-sm text-textSecondary leading-relaxed">
                      Generate a synthesis to get a structured, decision-grade summary (with source links).
                    </p>
                  </div>
                )}

                {digestSynthesis.keyThemes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {digestSynthesis.keyThemes.map((t, idx) => (
                      <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              t.direction === 'positive' ? 'bg-emerald-500' : t.direction === 'watch' ? 'bg-amber-500' : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-[10px] font-bold text-textTertiary uppercase tracking-wider">
                            {t.direction === 'positive' ? 'Tailwind' : t.direction === 'watch' ? 'Monitor' : 'Neutral'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{t.theme}</h3>
                        <p className="text-xs text-textTertiary leading-relaxed line-clamp-3">{t.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startSonnyDigest}
                      disabled={!data || isDigestLoading}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-textPrimary text-sm font-semibold disabled:opacity-50"
                    >
                      {digestMarkdown ? 'Regenerate' : 'Generate'}
                    </button>
                    <button
                      type="button"
                      disabled={!digestMarkdown}
                      onClick={() => setIsFullDigestExpanded((v) => !v)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-textSecondary text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {isFullDigestExpanded ? 'Hide full digest' : 'View full digest'}
                      {isFullDigestExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!digestMarkdown}
                    onClick={exportDigest}
                    className="px-4 py-2 rounded-xl bg-white text-black hover:bg-slate-100 text-sm font-semibold disabled:opacity-50"
                  >
                    Export digest
                  </button>
                </div>

                {isFullDigestExpanded && digestMarkdownLinked ? (
                  <div className="pt-2">
                    <CitedMarkdown
                      content={digestMarkdownLinked}
                      className="w-full"
                      tone={{ gradient: 'from-primary/15 via-purple-500/10 to-cyan-500/10', border: 'border-white/10' }}
                      isDemo={isDemoMode}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-textPrimary">Latest updates</h2>
              <span className="text-xs px-2 py-1 bg-white/5 text-textTertiary rounded-lg border border-white/10">
                {filteredItems.length} items
              </span>
              {pinnedItems.length > 0 ? (
                <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                  {pinnedItems.length} pinned
                </span>
              ) : null}
            </div>
            <div className="text-xs text-textTertiary">
              Showing{' '}
              <span className="font-mono">
                {requestParams.target || requestParams.q || data?.queryPack?.target || currentTarget?.name || '—'}
              </span>
            </div>
          </div>

          {isError ? (
            <div className="glass rounded-2xl p-5">
              <p className="text-textPrimary font-semibold mb-1">Couldn’t load feed</p>
              <p className="text-sm text-textSecondary">{error instanceof Error ? error.message : 'Unknown error'}</p>
              <div className="mt-4">
                <button
                  onClick={() => triggerRefresh(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-textPrimary text-sm font-semibold"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const Icon = getTypeIcon(item.type);
                const confidence = computeItemConfidencePct(item);
                const pinned = pinnedIdSet.has(item.id);
                const priority = computePriority(item);
                const analysis = articleAnalysisById[item.id];
                const analysisState = articleAnalysisStatus[item.id]?.status ?? 'idle';
                const analysisError = articleAnalysisStatus[item.id]?.error;
                const expanded = expandedItemId === item.id;
                const effectiveConfidence = analysis?.confidencePct ?? confidence;

                return (
                  <article
                    key={item.id}
                    className={`group border rounded-2xl overflow-hidden transition-all ${
                      pinned
                        ? 'border-amber-500/30 ring-1 ring-amber-500/10 bg-white/5'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {pinned ? (
                            <div className="flex items-center gap-1 text-amber-300">
                              <Pin className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider">Pinned</span>
                            </div>
                          ) : null}
                          <PriorityIndicator priority={priority} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-textTertiary">{formatRelativeTime(item.date)}</span>
                          <button
                            type="button"
                            onClick={() => togglePinned(item.id)}
                            className={`p-2 rounded-xl hover:bg-white/5 transition-colors ${
                              pinned ? 'text-amber-300' : 'text-textTertiary hover:text-textPrimary'
                            }`}
                            title={pinned ? 'Unpin' : 'Pin'}
                            aria-label={pinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhyOpenId((prev) => (prev === item.id ? '' : item.id))}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-textTertiary hover:text-textPrimary"
                            title="Why included?"
                            aria-label="Why included"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => hideItemUrlForContext(item.link)}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-textTertiary hover:text-textPrimary"
                            title="Hide this item"
                            aria-label="Hide this item"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => hideSourceForContext(item.link)}
                            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-textTertiary hover:text-textPrimary"
                            title="Hide this source (not relevant)"
                            aria-label="Hide this source"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-textSecondary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SourcePill source={item.source} url={item.link} />
                            <span className="text-xs text-textTertiary">•</span>
                            <ConfidenceMeter value={effectiveConfidence} />
                          </div>

                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="block mt-2 group/link">
                            <h3 className="text-base font-semibold text-white leading-snug hover:text-primary transition-colors">
                              {highlightText(item.title, item.matchedTerms || [])}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs text-textTertiary mt-1 group-hover/link:text-primary transition-colors">
                              Open source <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </a>

                          <p className="text-sm text-textSecondary leading-relaxed mt-2 line-clamp-2">{item.summary}</p>

                          {item.tags?.length ? (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {item.tags.slice(0, 6).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-textTertiary font-medium hover:bg-white/10 hover:text-white transition-colors cursor-default"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {whyOpenId === item.id ? (
                        <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-textSecondary">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-textPrimary">Why included</p>
                            <button
                              type="button"
                              onClick={() => setWhyOpenId('')}
                              className="text-textTertiary hover:text-textPrimary"
                              aria-label="Close why included"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div>
                              <span className="text-textTertiary">Matched:</span>{' '}
                              <span className="font-mono">{uniqueTerms(item.matchedTerms || []).slice(0, 8).join(', ') || '—'}</span>
                            </div>
                            <div>
                              <span className="text-textTertiary">Field:</span>{' '}
                              <span>
                                {item.matchedFields?.includes('title')
                                  ? 'title'
                                  : item.matchedFields?.includes('summary')
                                    ? 'summary'
                                    : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-textTertiary">Score:</span>{' '}
                              <span className="font-mono">{typeof item.score === 'number' ? item.score.toFixed(2) : '—'}</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Expandable Sonny Analysis */}
                    <div
                      className={`border-t border-white/10 overflow-hidden transition-all duration-300 ${
                        expanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-5 bg-black/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-white">Sonny Analysis</span>
                            {analysisState === 'loading' ? (
                              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-textTertiary animate-pulse">
                                generating…
                              </span>
                            ) : null}
                          </div>
                          <ConfidenceMeter value={effectiveConfidence} />
                        </div>

                        {analysisError ? (
                          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                            <p className="text-sm text-red-200">Couldn’t generate analysis.</p>
                            <p className="text-xs text-red-200/70 mt-1 line-clamp-2">{analysisError}</p>
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => void ensureArticleAnalysis(item)}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-textPrimary text-sm font-semibold"
                              >
                                Retry
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Newspaper className="w-3 h-3 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block mb-1">The News</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {analysis?.sections?.theNews?.text ||
                                  (analysisState === 'loading' ? 'Generating a grounded summary from the source…' : 'Generate analysis to view this section.')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-slate-700/40 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Target className="w-3 h-3 text-slate-300" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide block mb-1">The Context</span>
                              <p className="text-sm text-textTertiary leading-relaxed">
                                {analysis?.sections?.theContext?.text ||
                                  (analysisState === 'loading' ? 'Weighting this signal by source tier + landscape…' : 'Generate analysis to view this section.')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <Lightbulb className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wide block mb-1">The Implication</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {analysis?.sections?.theImplication?.text ||
                                  (analysisState === 'loading' ? 'Deriving second/third-order implications (persona-aware)…' : 'Generate analysis to view this section.')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <HelpCircle className="w-3 h-3 text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block mb-1">The Question</span>
                              <p className="text-sm text-textSecondary leading-relaxed">
                                {analysis?.sections?.theQuestion?.text ||
                                  (analysisState === 'loading' ? 'Identifying the single highest-leverage follow-up question…' : 'Generate analysis to view this section.')}
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
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                    t.direction === 'positive'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                      : t.direction === 'watch'
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                                        : 'bg-white/5 border-white/10 text-textSecondary'
                                  }`}
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
                                  <span className="font-semibold text-white">{a.action}</span>
                                  <span className="text-textTertiary"> — {a.why}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-primary hover:text-primary/90 font-medium transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Read full source
                          </a>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addToWorkspace(item)}
                              className="px-3 py-1.5 text-xs text-textSecondary hover:text-textPrimary hover:bg-white/10 rounded-lg transition-colors"
                            >
                              Add to workspace
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = expanded ? '' : item.id;
                        setExpandedItemId(next);
                        if (next) void ensureArticleAnalysis(item);
                      }}
                      className="w-full px-5 py-3 flex items-center justify-center gap-2 text-xs font-medium text-textSecondary hover:text-white bg-black/20 hover:bg-black/30 transition-all border-t border-white/10"
                    >
                      {expanded ? (
                        <>
                          <span>Collapse analysis</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {analysis ? 'Show Sonny Analysis' : analysisState === 'loading' ? 'Generating…' : 'Generate Sonny Analysis'}
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-textTertiary mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-textSecondary mb-2">{isLoading ? 'Loading…' : 'No results'}</p>
              <p className="text-sm text-textTertiary">{isLoading ? 'Fetching the latest items…' : 'Try adjusting filters or search.'}</p>
            </div>
          )}
        </section>
      </main>

      {/* click-outside overlays */}
      {(showExportMenu || showFilters) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowExportMenu(false);
            setShowFilters(false);
          }}
        />
      )}
        </div>
      </div>
    </section>
  );
}
