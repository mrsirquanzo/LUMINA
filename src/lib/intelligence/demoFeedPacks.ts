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
          'Signal: Competitive TROP2 ADC readouts are increasingly judged on tolerability + dose continuity, not just response rate; implication: “me-too efficacy” will not clear the bar; watchpoint: show a credible plan to sustain dosing without outsized monitoring burden. ',
          'Signal: The class is converging around similar payload families; implication: differentiation must be articulated as a *practical* safety/operational edge (or a wedge population); watchpoint: identify where your profile is meaningfully advantaged and why clinicians would switch. ',
          'Signal: Deal activity continues despite crowding; implication: partnering appetite exists but underwriting is execution-heavy; watchpoint: define the next value-inflection (what data would *change* a partner’s view) and the shortest path to it. ',
        ],
        SCIENTIST: [
          'Signal: TROP2 ADCs can look similar on efficacy headlines; implication: mechanistic claims only matter if they move the safety/efficacy frontier in a way that preserves dose intensity; watchpoint: look for toxicity patterns that force dose holds/reductions. ',
          'Signal: Expression is broad across epithelial tumors and some normal tissues; implication: on-target/off-tumor risk and therapeutic index are central; watchpoint: stress-test whether patient selection/PK/PD strategy is robust enough for durable dosing. ',
        ],
        SCOUT: [
          'Signal: Validated biology lowers target risk; implication: partner focus shifts to CMC readiness, differentiation, and a sequencing story; watchpoint: map a wedge indication where incumbents are constrained and switching is rational. ',
          'Signal: Multiple entrants are competing for the same “headline” indications; implication: value creation is in timing and positioning; watchpoint: define the deal window tied to upcoming catalysts and competitive readouts. ',
        ],
        VC: [
          'Signal: TROP2 is de-risked but crowded; implication: expected returns compress unless differentiation is provable quickly; watchpoint: insist on a near-term experiment/readout that validates the wedge. ',
          'Signal: Clinical/regulatory success will be decided by real-world tolerability and operational complexity; implication: execution risk is a first-order driver of MoM; watchpoint: evaluate safety management plan and feasibility of sustained dosing at scale. ',
        ],
      },
      sonnyRead: {
        GENERAL:
          'TROP2 is not a “do we believe the target?” question anymore—it’s a “what is the *reason to win*?” question. The demo items collectively point to a class where efficacy headlines are table-stakes, and where durability is quietly determined by tolerability, monitoring burden, and whether clinicians can keep patients on drug without repeated dose interruptions. That shifts the strategy: your differentiation claim must be framed as an operational advantage (or a wedge population where the safety/benefit trade-off is uniquely favorable), not a generic “best-in-class” slogan. If you cannot articulate how payload/linker choices translate into a measurable shift in dose continuity or AE management, the program risks being priced like a follower even with respectable efficacy. The BD and capital-allocation lens should therefore anchor on the *next proof point* that validates the wedge quickly—ideally something that would change a partner’s or investor’s underwriting within one readout cycle. I would change my view if upcoming data show a clear separation in sustained dosing/tolerability that plausibly expands the treatable population *or* enables a sequencing position incumbents cannot defend.',
        SCIENTIST:
          'Treat “better” as a measurable shift in the safety/efficacy frontier, not a marketing claim. Across the demo sources, the recurring scientific question is whether your design choices plausibly reduce the toxicities that force dose holds, because that’s what ultimately determines exposure and durability. Broad expression patterns also raise therapeutic-index questions: you need a credible translational strategy that links target expression, payload biology, and AE patterns to patient selection and dosing. Mechanistic talking points (bystander effect, linker stability, payload permeability) only matter if you can connect them to a predictable, testable shift in toxicity phenotype and dose intensity. If that mapping is weak, the program becomes a statistical coin flip in a crowded class. I would change my view if you can show early evidence that dose continuity remains high at clinically active exposure without disproportionate supportive-care burden.',
        SCOUT:
          'The BD conversation is about underwriting execution and differentiation: can this program win a label segment with clear superiority, or is it stranded as a follower? The demo signals point to a crowded market where a “headline” efficacy profile won’t drive premium terms unless it is paired with a practical adoption story (tolerability, monitoring, site burden) and a wedge indication strategy. The most credible narrative is: pick a segment where incumbents are constrained, prove a specific advantage that clinicians care about, then expand with a sequencing logic that is defensible. Your deal timing should be tied to a value-inflection that changes underwriting (e.g., a clear tolerability separation, or a biomarker-defined response enrichment) rather than broad, incremental updates. I would change my view if competitive readouts show that the purported wedge is not durable or is easily matched by incumbents.',
        VC:
          'This is a class trade: de-risked biology, crowded landscape, and a market that is increasingly skeptical of “best-in-class” without operational proof. The demo sources reinforce that the value driver is not target novelty; it’s whether you can prove a defensible wedge and a path to sustained dosing in real-world practice. That makes catalyst design critical: the next readout must answer a underwriting question (does the safety/operational profile truly separate? does the wedge population behave differently?) rather than simply add patients to a dataset. Capital efficiency follows from that: if you need a long, expensive path to prove differentiation, expected returns compress quickly in a crowded class. I would change my view if a near-term catalyst produces a clear separation that rationally supports premium pricing/terms or a partner’s willingness to fund late-stage execution.',
      },
      watchlist: [
        'What specific safety/tolerability evidence supports dose continuity (and what is the expected monitoring/supportive-care burden)?',
        'What is the wedge indication + sequencing logic that forces adoption vs incumbents (and what would invalidate it)?',
        'Which competitor readouts in the next 6–12 months most threaten (or validate) the differentiation thesis?',
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
            title: 'TROP2 expression in human tumors: a tissue microarray study on 18,563 tumors',
            source: 'PubMed',
            url: 'https://pubmed.ncbi.nlm.nih.gov/35477165/',
            publishedAt: isoDaysAgo(120),
            summary:
              'Large tissue microarray analysis framing where TROP2 is expressed across tumor types; use to reason about wedge indications and on-target/off-tumor risk.',
            relevance: 'high',
            tags: ['TROP2', 'expression', 'target biology'],
            score: 0.92,
            matched: ['TROP2'],
          }),
          makeItem({
            id: 'trop2-news-001',
            kind: 'news',
            title: 'Gilead’s Trodelvy misses primary endpoint in lung cancer Phase 3',
            source: 'BioPharmaDive',
            url: 'https://www.biopharmadive.com/news/gilead-trodelvy-lung-cancer-study-results-evoke/705165/',
            publishedAt: isoDaysAgo(28),
            summary:
              'Trade press coverage of a major class readout; use to frame competitive bar-setting and where differentiation claims are likely to be stress-tested.',
            relevance: 'medium',
            tags: ['conference', 'readout', 'competition'],
            score: 0.74,
            matched: ['TROP2'],
          }),
          makeItem({
            id: 'trop2-ctr-001',
            kind: 'clinical',
            title: 'ASCENT: Sacituzumab Govitecan in refractory/relapsed triple-negative breast cancer (Phase 3)',
            source: 'ClinicalTrials.gov',
            url: 'https://clinicaltrials.gov/study/NCT02574455',
            publishedAt: isoDaysAgo(365),
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
            title: 'Merck enters R&D funding agreement with Blackstone Life Sciences for sacituzumab tirumotecan (sac-TMT)',
            source: 'Business Wire',
            url: 'https://www.businesswire.com/news/home/20251104511714/en/Merck-Enters-into-Research-and-Development-Funding-Agreement-with-Blackstone-Life-Sciences-for-Sacituzumab-Tirumotecan-sac-TMT',
            publishedAt: isoDaysAgo(40),
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
            title: 'FDA approves Datroway (datopotamab deruxtecan) for breast cancer',
            source: 'BioPharmaDive',
            url: 'https://www.biopharmadive.com/news/fda-approve-datroway-breast-cancer-astrazeneca-daiichi-datopotamab-deruxtecan/737831/',
            publishedAt: isoDaysAgo(10),
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
            title: 'FDA update: Trodelvy (sacituzumab govitecan-hziy) approval/label context (curated)',
            source: 'FDA',
            url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-disco-burst-edition-fda-approval-trodelvy-sacituzumab-govitecan-hziy-hr-positive-breast-cancer',
            publishedAt: isoDaysAgo(30),
            summary:
              'Curated regulatory context for Trodelvy in breast cancer and what label language implies about class monitoring expectations; use as a proxy for TROP2 ADC risk-management framing.',
            relevance: 'high',
            tags: ['FDA', 'label', 'safety'],
            score: 0.86,
            matched: ['ADC'],
          }),
          makeItem({
            id: 'trop2-pub-002',
            kind: 'publication',
            title: 'Sacituzumab Govitecan in metastatic triple-negative breast cancer: ASCENT trial (publication)',
            source: 'PubMed',
            url: 'https://pubmed.ncbi.nlm.nih.gov/35680967/',
            publishedAt: isoDaysAgo(240),
            summary:
              'Primary publication from a pivotal Phase 3 setting for a TROP2 ADC; useful anchor for endpoints, interpretability, and class risk/benefit framing.',
            relevance: 'high',
            tags: ['TROP2', 'ADC', 'ASCENT'],
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
          'Signal: HER2 expansion is increasingly driven by segmentation (low/ultralow and mutant) rather than “HER2+ only”; implication: biomarker ops (assay/cutoff/heterogeneity) becomes a strategic risk; watchpoint: look for evidence that the segment is reproducible across sites and time. ',
          'Signal: Differentiation is migrating from “better response rate” to “where we fit in sequencing + tolerability”; implication: positioning in CNS disease and AE management can decide adoption; watchpoint: stress-test whether safety/monitoring constraints limit real-world dose intensity. ',
          'Signal: Regulatory framing increasingly shapes class expectations; implication: programs that anticipate label language and risk-management needs can move faster; watchpoint: monitor how approvals/labels encode biomarker definitions and safety monitoring. ',
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
          'HER2 is not about proving the target—it’s about proving where you win. The demo items point to a landscape where the category is expanding (low/ultralow and mutant), but the real strategic risk is operational: how reliably can you define the segment, and does that segment behave consistently enough to anchor development and commercialization. That makes biomarker rigor a first-order competitive advantage; programs that treat “HER2-low” as a simple label, rather than an assay + heterogeneity problem, will get surprised in trials and in real-world adoption. On the competitive axis, adoption is increasingly decided by sequencing logic and tolerability—clinicians will choose what they can sustain, monitor, and fit into workflows, especially as CNS positioning becomes a differentiator. The regulatory signal matters because labels and approvals encode the market’s “rules of the road” (definitions, safety monitoring expectations, sequencing assumptions). The board-ready question is therefore: what is the wedge that forces adoption, and what is the shortest proof point that validates both biomarker ops and tolerability in that wedge? I would change my view if new data show that segment definitions are unstable (high conversion/discordance) *or* if competitive readouts erase the claimed tolerability/CNS wedge.',
        SCIENTIST:
          'The scientific risk is rarely “does HER2 matter”; it’s whether biomarker operationalization and tumor heterogeneity undermine the intended segment. Treat HER2-low/ultralow and HER2-mutant as *measurement problems* first, because assay variability and spatial/temporal heterogeneity can silently wash out signal and distort endpoint interpretation. Mechanistic claims (bystander effect, payload properties, CNS penetration) only matter insofar as they map to a testable shift in response heterogeneity, durability, and AE phenotype at sustained exposure. Safety management is not “after the fact” here—it determines dose intensity, which determines whether biology can express itself in endpoints. I would change my view if biomarker concordance across sites/time is weaker than assumed or if toxicity forces exposure below what is needed for durable CNS control.',
        SCOUT:
          'The best BD angle is a sequencing story: where does this sit relative to incumbents, and what’s the wedge that forces adoption? The demo sources reinforce that HER2 deal value accrues to programs with a crisp segment definition, a defensible differentiation lever (CNS, tolerability, or a specific mechanistic niche), and a near-term catalyst that changes underwriting. BD success will hinge on whether you can claim a label segment incumbents can’t easily follow into, and whether the required monitoring burden is acceptable to community practice. I would change my view if new approvals/readouts narrow the available white space or if the supposed wedge becomes commoditized.',
        VC:
          'The investment case is concrete: de-risked biology, crowded market, and returns that depend on proving a wedge quickly. The demo signals suggest that the highest leverage work is not more “target validation”; it’s de-risking biomarker ops and demonstrating a tolerability/positioning advantage that is hard to replicate. That puts a premium on catalyst design—pick the shortest readout that validates the wedge and compresses time-to-inflection. If it takes years and multiple expensive studies to prove differentiation, expected returns will compress in a mature category. I would change my view if the segment definition proves unstable or if competitors close the tolerability/CNS gap before your next catalyst.',
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
            title: 'Trastuzumab Deruxtecan in Previously Treated HER2-Low Advanced Breast Cancer',
            source: 'PubMed',
            url: 'https://pubmed.ncbi.nlm.nih.gov/36130004/',
            publishedAt: isoDaysAgo(900),
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
            title: 'Enhertu shows benefit in HER2-ultralow breast cancer at ASCO 2024, but ILD remains a focus',
            source: 'BioPharmaDive',
            url: 'https://www.biopharmadive.com/news/astrazeneca-daiichi-enhertu-her2-ultralow-breast-cancer-asco-2024/717399/',
            publishedAt: isoDaysAgo(200),
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
            title: 'Jazz Pharmaceuticals and Zymeworks announce license agreement for zanidatamab (HER2 bispecific antibody)',
            source: 'PR Newswire',
            url: 'https://www.prnewswire.com/news-releases/jazz-pharmaceuticals-and-zymeworks-announce-exclusive-license-agreement-to-develop-and-commercialize-zanidatamab-a-her2-targeted-bispecific-antibody-301652894.html',
            publishedAt: isoDaysAgo(1100),
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
            title: 'DESTINY-Lung02: Trastuzumab deruxtecan in HER2-mutant NSCLC (Phase 2)',
            source: 'ClinicalTrials.gov',
            url: 'https://clinicaltrials.gov/study/NCT04644237',
            publishedAt: isoDaysAgo(1500),
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
            title: 'FDA approval: Enhertu (fam-trastuzumab deruxtecan-nxki) in HR+ HER2-low/ultralow breast cancer',
            source: 'FDA (curated)',
            url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-fam-trastuzumab-deruxtecan-nxki-unresectable-or-metastatic-hr-positive-her2-low-or-her2',
            publishedAt: isoDaysAgo(45),
            summary:
              'Curated regulatory framing around HER2-low segmentation and implications for sequencing/label narrative; use as a proxy for how the class is positioned in practice.',
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
            url: 'https://www.biopharmadive.com/news/callio-adc-cancer-biotech-startup-series-a/741370/',
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

