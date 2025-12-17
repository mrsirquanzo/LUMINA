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
  digestBlueprint?: {
    // High-signal, non-factual strategic framing for demos (no invented numbers).
    executiveTakeaways: {
      GENERAL: string[];
      SCIENTIST?: string[];
      SCOUT?: string[];
      VC?: string[];
    };
    sonnyRead: {
      GENERAL: string;
      SCIENTIST?: string;
      SCOUT?: string;
      VC?: string;
    };
    watchlist: string[]; // gaps/catalysts phrased without invented specifics
  };
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
    digestBlueprint: {
      executiveTakeaways: {
        GENERAL: [
          'TROP2 remains a validated ADC target; value concentrates in differentiation (payload/linker, tolerability, and sequencing) rather than “target novelty”.',
          'The operational risk profile (e.g., class safety monitoring, dose intensity management) is a major competitive lever alongside efficacy.',
          'Near-term catalysts should be framed as “proof of differentiation” rather than incremental response rate headlines.',
        ],
        SCIENTIST: [
          'For TROP2 ADCs, clinical signal interpretation must separate efficacy from dose-limiting toxicity and monitoring burden.',
          'A mechanistic wedge (bystander effect, payload properties, linker stability) matters only if it maps to a safety/efficacy trade-off you can execute.',
        ],
        SCOUT: [
          'BD thesis: validated biology lowers target risk; underwriting shifts to CMC/execution and label differentiation.',
          'A winning strategy is indication sequencing + biomarker-enriched wedge indications that let you “earn” later expansion.',
        ],
        VC: [
          'Risk-adjusted thesis hinges on differentiation and late-stage execution, not just being “in the class”.',
          'Market will reward credible safety/operational advantages and a clear sequencing story over generic TAM narratives.',
        ],
      },
      sonnyRead: {
        GENERAL:
          'TROP2 is already de-risked; the only durable edge is a defensible differentiation story that survives real-world tolerability and sequencing constraints. In demos, emphasize what specific design/clinical choices reduce operational burden (monitoring, ILD risk management, hematologic toxicity) while preserving efficacy—then map that to a wedge indication and a credible expansion path.',
        SCIENTIST:
          'Treat “better” as a measurable shift in the safety/efficacy frontier, not a marketing claim. The key is whether payload/linker choices plausibly reduce class-limiting toxicities and allow sustained dosing—if not, the program risks being a me-too even with similar efficacy.',
        SCOUT:
          'The BD conversation is about underwriting execution and differentiation: can this program win a label segment with clear superiority, or is it stranded as a follower? The most compelling pitch is a wedge indication where safety/operational advantages matter and incumbents are constrained.',
        VC:
          'This is a class trade: de-risked target, crowded landscape. The investment-grade story is not “TROP2 is hot”, it’s a tight set of differentiation claims you can validate quickly, plus a sequencing narrative that makes the commercial wedge credible.',
      },
      watchlist: [
        'Evidence that differentiation is real (not just headline response rate): safety/monitoring burden, tolerability, dosing continuity.',
        'Clarity on sequencing/label strategy: wedge indication first, then expansion.',
        'Signals of competitive crowding: how many programs converge on the same payload class and safety profile.',
      ],
    },
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
    digestBlueprint: {
      executiveTakeaways: {
        GENERAL: [
          'HER2 is a proven axis; the “new value” is in segmentation (HER2-low / HER2-mutant), sequencing, and safety/tolerability differentiation.',
          'Competitive advantage increasingly hinges on operational execution (CNS positioning, toxicity management, and patient selection) rather than target validation.',
          'Regulatory expectations for class risks (e.g., monitoring plans) shape trial design and can become an advantage if executed well.',
        ],
        SCIENTIST: [
          'HER2-low and HER2-mutant are operational biomarker problems: assay, cutoff, heterogeneity, and how that drives endpoint interpretation.',
          'Mechanistic claims (bystander effect, payload properties, CNS penetration) must be tied to practical endpoints and safety trade-offs.',
        ],
        SCOUT: [
          'BD thesis: differentiated HER2 programs win on a crisp “where we fit in sequencing” argument plus a safety/label wedge.',
          'Watch for programs positioning into CNS disease or hard-to-treat segments where incumbents are constrained.',
        ],
        VC: [
          'HER2 is de-risked biology; underwriting is about differentiation and time-to-catalyst in crowded segments.',
          'A credible path is: niche wedge → data-driven expansion → defendable combination/sequence strategy.',
        ],
      },
      sonnyRead: {
        GENERAL:
          'HER2 is not about proving the target—it’s about proving where you win. A robust demo digest should connect segmentation (HER2-low/mutant), operational biomarker realities, and how safety management affects real-world adoption. The most persuasive narrative frames a specific wedge (e.g., CNS disease, mutant NSCLC, HER2-low sequencing) with a clear differentiation hypothesis and an execution plan that regulators and clinicians will accept.',
        SCIENTIST:
          'The scientific risk is rarely “does HER2 matter”; it’s whether biomarker operationalization and tumor heterogeneity undermine the intended segment. Tie every claim to how the assay and endpoint choices will behave in practice, and highlight where safety management constrains dosing and interpretation.',
        SCOUT:
          'The best BD angle is a sequencing story: where does this sit relative to incumbents, and what’s the wedge that forces adoption? CNS and tolerability are recurring levers; make them explicit and connect to trial design choices.',
        VC:
          'Make the investment case concrete: crowded but de-risked. You win by proving differentiation quickly in a wedge segment, then expanding with a defensible sequencing strategy—otherwise you’re a follower in a mature class.',
      },
      watchlist: [
        'Signals that segmentation is operationally robust (assay strategy, cutoff clarity, heterogeneity handling).',
        'Differentiation proof points: CNS positioning, tolerability/safety management, sequencing rationale.',
        'Regulatory/label risk management expectations shaping trial design and timelines.',
      ],
    },
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

