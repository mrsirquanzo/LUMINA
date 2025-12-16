import type { AgentMode } from '../agentMode';

type FeedItemType = 'publication' | 'deal' | 'regulatory' | 'news' | 'clinical';
type FeedRelevance = 'high' | 'medium' | 'low';

export interface DemoFeedItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  summary: string;
  kind: FeedItemType;
  relevance: FeedRelevance;
  tags: string[];
  score: number;
  matchedTerms: string[];
  matchedFields: Array<'title' | 'summary'>;
}

export interface DemoFeedPack {
  target: string;
  synonyms: string[];
  snapshots: Array<{
    id: string;
    fetchedAt: string; // ISO
    items: DemoFeedItem[];
  }>;
}

export interface DemoFeedResponse {
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
  items: DemoFeedItem[];
  fetchedAt: string;
  cached: boolean;
  partial: boolean;
  errors: Array<{ sourceId: string; source: string; message: string }>;
}

function isoDaysAgo(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function buildQueryPack(target: string, synonyms: string[]) {
  const terms = [target, ...synonyms].filter(Boolean);
  const termQuery = terms.map((t) => `"${t}"`).join(' OR ');
  return {
    target,
    asset: undefined,
    company: undefined,
    indication: undefined,
    synonyms,
    pubmedQuery: `${termQuery} AND (cancer OR oncology)`,
    newsQuery: `${target} biotech OR pharma`,
    trialsQuery: `${target} AND (trial OR phase)`,
    terms,
  };
}

function makeItem(partial: Omit<DemoFeedItem, 'matchedTerms' | 'matchedFields'> & { matched?: string[] }): DemoFeedItem {
  const matched = partial.matched ?? [];
  return {
    ...partial,
    matchedTerms: matched,
    matchedFields: matched.length ? ['title'] : [],
  };
}

export const DEMO_FEED_PACKS: DemoFeedPack[] = [
  {
    target: 'TROP2',
    synonyms: ['TACSTD2', 'TROP-2'],
    snapshots: [
      {
        id: 'trop2-day-1',
        fetchedAt: isoDaysAgo(1),
        items: [
          makeItem({
            id: 'trop2-pub-001',
            kind: 'publication',
            title: 'TROP2-directed ADCs: efficacy signals and toxicity management in solid tumors',
            source: 'PubMed (curated)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36972134/',
            publishedAt: isoDaysAgo(18),
            summary:
              'Review of TROP2 ADC landscape, including Trodelvy and DXd-class programs; highlights ILD/pneumonitis monitoring as a key operational risk for topo-1 payload ADCs.',
            relevance: 'high',
            tags: ['ADC', 'TROP2', 'safety', 'ILD'],
            score: 0.92,
            matched: ['TROP2'],
          }),
          makeItem({
            id: 'trop2-news-001',
            kind: 'news',
            title: 'Company X reports updated TROP2 ADC data at a major oncology congress',
            source: 'STAT (curated)',
            url: 'https://www.statnews.com/',
            publishedAt: isoDaysAgo(7),
            summary:
              'Updated response rate and safety commentary for a late-stage TROP2 ADC program; market focus shifts to differentiation by payload/linker and ILD mitigation.',
            relevance: 'medium',
            tags: ['conference', 'readout', 'competition'],
            score: 0.74,
            matched: ['TROP2'],
          }),
          makeItem({
            id: 'trop2-ctr-001',
            kind: 'clinical',
            title: 'TROP2 ADC in metastatic TNBC – Phase 3 study overview',
            source: 'ClinicalTrials.gov (curated)',
            url: 'https://clinicaltrials.gov/study/NCT00000000',
            publishedAt: isoDaysAgo(90),
            summary:
              'Phase 3 design summary emphasizing patient selection, safety monitoring, and endpoints aligned with prior class precedent.',
            relevance: 'high',
            tags: ['Phase 3', 'TNBC', 'endpoint'],
            score: 0.81,
            matched: ['TROP2', 'TNBC'],
          }),
          makeItem({
            id: 'trop2-deal-001',
            kind: 'deal',
            title: 'Licensing deal announced for a TROP2 ADC program (terms undisclosed)',
            source: 'Press release (curated)',
            url: 'https://www.businesswire.com/',
            publishedAt: isoDaysAgo(12),
            summary:
              'Deal highlights continuing BD interest in validated ADC targets; investor takeaway is that value concentrates around safety/differentiation and late-stage execution.',
            relevance: 'medium',
            tags: ['deal', 'licensing', 'BD'],
            score: 0.69,
            matched: ['TROP2'],
          }),
        ],
      },
      {
        id: 'trop2-day-2',
        fetchedAt: isoDaysAgo(0),
        items: [
          makeItem({
            id: 'trop2-news-002',
            kind: 'news',
            title: 'Analyst note: TROP2 class remains attractive but bar is rising',
            source: 'Analyst note (curated)',
            url: 'https://www.fiercebiotech.com/',
            publishedAt: isoDaysAgo(2),
            summary:
              'Focus on where next winners emerge: better payload, better selectivity, and clear wedge indication strategy (e.g., biomarker-defined subsets).',
            relevance: 'medium',
            tags: ['competition', 'strategy'],
            score: 0.72,
            matched: ['TROP2'],
          }),
          makeItem({
            id: 'trop2-reg-001',
            kind: 'regulatory',
            title: 'Regulatory update: safety labeling considerations for topo-1 payload ADCs',
            source: 'FDA (curated)',
            url: 'https://www.fda.gov/',
            publishedAt: isoDaysAgo(30),
            summary:
              'Curated summary of class safety language patterns (ILD, neutropenia) and implications for trial monitoring and label differentiation.',
            relevance: 'high',
            tags: ['FDA', 'label', 'safety'],
            score: 0.86,
            matched: ['ADC'],
          }),
          makeItem({
            id: 'trop2-pub-002',
            kind: 'publication',
            title: 'TROP2 expression atlas across normal tissues and tumors',
            source: 'PubMed (curated)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/00000000/',
            publishedAt: isoDaysAgo(365),
            summary:
              'Expression mapping used to frame on-target/off-tumor risk; supports the need for differentiation by dosing and payload tolerability.',
            relevance: 'high',
            tags: ['expression', 'risk'],
            score: 0.83,
            matched: ['TROP2'],
          }),
        ],
      },
    ],
  },
  {
    target: 'HER2',
    synonyms: ['ERBB2', 'HER-2'],
    snapshots: [
      {
        id: 'her2-day-1',
        fetchedAt: isoDaysAgo(1),
        items: [
          makeItem({
            id: 'her2-pub-001',
            kind: 'publication',
            title: 'HER2-low: redefining patient segments and trial endpoints',
            source: 'PubMed (curated)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/00000001/',
            publishedAt: isoDaysAgo(60),
            summary:
              'Curated summary of HER2-low framework and the implication for ADC sequencing, endpoints, and biomarker operationalization.',
            relevance: 'high',
            tags: ['HER2', 'biomarker', 'ADC'],
            score: 0.9,
            matched: ['HER2'],
          }),
          makeItem({
            id: 'her2-news-001',
            kind: 'news',
            title: 'Competitive dynamics: next-gen HER2 ADCs target safety and CNS activity',
            source: 'Endpoints (curated)',
            url: 'https://endpts.com/',
            publishedAt: isoDaysAgo(10),
            summary:
              'Market commentary: differentiation needs to be explicit versus incumbents; watch ILD mitigation and brain metastases positioning.',
            relevance: 'medium',
            tags: ['competition', 'CNS', 'ILD'],
            score: 0.76,
            matched: ['HER2'],
          }),
          makeItem({
            id: 'her2-deal-001',
            kind: 'deal',
            title: 'Partnership announced for HER2 bispecific program',
            source: 'Press release (curated)',
            url: 'https://www.prnewswire.com/',
            publishedAt: isoDaysAgo(21),
            summary:
              'Deal illustrates continued appetite for HER2 biology when paired with a clear differentiation thesis (epitope/immune engagement/combination).',
            relevance: 'medium',
            tags: ['deal', 'bispecific'],
            score: 0.7,
            matched: ['HER2'],
          }),
          makeItem({
            id: 'her2-ctr-001',
            kind: 'clinical',
            title: 'HER2-mutant NSCLC trial overview – Phase 2 design',
            source: 'ClinicalTrials.gov (curated)',
            url: 'https://clinicaltrials.gov/study/NCT00000001',
            publishedAt: isoDaysAgo(120),
            summary:
              'Curated trial design emphasizing mutation subgroup selection and CNS endpoints for differentiation.',
            relevance: 'high',
            tags: ['HER2', 'NSCLC', 'Phase 2'],
            score: 0.82,
            matched: ['HER2', 'NSCLC'],
          }),
        ],
      },
      {
        id: 'her2-day-2',
        fetchedAt: isoDaysAgo(0),
        items: [
          makeItem({
            id: 'her2-reg-001',
            kind: 'regulatory',
            title: 'Regulatory watch: ILD risk management expectations for HER2 DXd-class ADCs',
            source: 'FDA (curated)',
            url: 'https://www.fda.gov/',
            publishedAt: isoDaysAgo(45),
            summary:
              'Curated digest of common risk-mitigation elements and what “good” monitoring looks like in trial protocols.',
            relevance: 'high',
            tags: ['FDA', 'ILD', 'risk management'],
            score: 0.85,
            matched: ['HER2'],
          }),
          makeItem({
            id: 'her2-news-002',
            kind: 'news',
            title: 'Investor note: HER2 is proven—value is in sequencing and differentiation',
            source: 'Analyst note (curated)',
            url: 'https://www.biopharmadive.com/',
            publishedAt: isoDaysAgo(3),
            summary:
              'Takeaway: HER2 is de-risked as a target; successful programs win by expanding into HER2-low/HER2-mutant segments and improving safety/tolerability.',
            relevance: 'medium',
            tags: ['strategy', 'market'],
            score: 0.73,
            matched: ['HER2'],
          }),
        ],
      },
    ],
  },
];

export function resolveDemoFeedPack(targetOrQuery: string | undefined): DemoFeedPack | null {
  const raw = (targetOrQuery || '').trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/\s+/g, '');

  for (const pack of DEMO_FEED_PACKS) {
    const candidates = [pack.target, ...pack.synonyms].map((s) => s.toLowerCase().replace(/\s+/g, ''));
    if (candidates.includes(key)) return pack;
  }
  return null;
}

export function buildDemoFeedResponse(params: {
  target?: string;
  q?: string;
  limit: number;
  refreshToken: number;
  mode: AgentMode;
}): DemoFeedResponse | null {
  if (params.mode !== 'demo') return null;

  const pack = resolveDemoFeedPack(params.target || params.q);
  if (!pack) return null;

  const snapshot = pack.snapshots[Math.abs(params.refreshToken) % pack.snapshots.length];
  const items = (snapshot.items || []).slice(0, params.limit);

  const queryPack = buildQueryPack(pack.target, pack.synonyms);

  return {
    query: params.target || params.q || pack.target,
    queryPack,
    sources: Array.from(new Set(items.map((it) => it.source))).slice(0, 6),
    items,
    fetchedAt: snapshot.fetchedAt,
    cached: true,
    partial: false,
    errors: [],
  };
}

