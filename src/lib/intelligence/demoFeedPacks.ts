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
  {
    target: 'ADC landscape',
    synonyms: ['ADC', 'antibody-drug conjugate', 'antibody drug conjugate', 'ADCs'],
    digestBlueprint: {
      executiveTakeaways: {
        GENERAL: [
          'Signal: The class is consolidating around deruxtecan and other topoisomerase-I payloads across TROP2, HER2, and HER3, while c-Met and Nectin-4 validate room for other target-payload pairs; implication: target novelty alone is not a differentiation thesis; watchpoint: tie payload and linker choices to a specific clinical advantage.',
          'Signal: ILD, ocular events, mucositis, and hematologic toxicity recur across the landscape; implication: tolerability and dose continuity are becoming strategic variables, not downstream safety details; watchpoint: compare the full treatment burden alongside efficacy.',
          'Signal: TROPION-Lung02 and EV-302 put ADC plus checkpoint blockade at the development frontier; implication: combination strategy can expand relevance but also raises the safety and regimen-complexity bar; watchpoint: separate contribution of components from additive burden.',
          'Signal: Licensing and acquisition activity remains active, including China-originated assets and next-generation platforms; implication: partner appetite is real but increasingly selective; watchpoint: identify the proof point that converts platform promise into program-level leverage.',
        ],
        SCIENTIST: [
          'Signal: Deruxtecan and other topoisomerase-I payloads appear repeatedly across TROP2, HER2, and HER3 programs; implication: linker, payload exposure, and therapeutic index need to explain differentiation; watchpoint: connect mechanism to a distinct toxicity and dose-continuity profile.',
          'Signal: The records surface ILD, ocular events, mucositis, stomatitis, and hematologic toxicity; implication: efficacy cannot be interpreted apart from exposure and treatment burden; watchpoint: look for whether adverse events interrupt sustained dosing.',
          'Signal: ADC-checkpoint combinations are showing activity in NSCLC and urothelial cancer; implication: the frontier is moving from monotherapy validation to regimen design; watchpoint: test whether the combination adds durable value without obscuring the ADC contribution.',
        ],
        SCOUT: [
          'Signal: Approved and late-stage programs now span TROP2, HER2, c-Met, Nectin-4, and emerging targets; implication: white space is narrower and must be defined by target, payload, indication, and tolerability together; watchpoint: reject broad best-in-class claims without a measurable wedge.',
          'Signal: China-originated assets and next-generation payload, linker, and bispecific platforms remain in demand; implication: deal flow is active, but diligence must move from platform narrative to asset-specific evidence; watchpoint: anchor timing to the next clinical or regulatory proof point.',
          'Signal: Combination development is expanding the competitive map; implication: a credible partnering story needs a sequencing and regimen position, not only monotherapy data; watchpoint: map which combinations improve adoption versus add operational burden.',
        ],
        VC: [
          'Signal: Multiple approvals and pivotal datasets validate ADCs as a broad oncology class; implication: category risk is lower while differentiation and execution risk are higher; watchpoint: underwrite the shortest path to proving a distinct clinical or operational edge.',
          'Signal: Safety liabilities differ by construct but repeatedly affect treatment burden; implication: tolerability can determine usable exposure, combination feasibility, and commercial adoption; watchpoint: demand evidence that the regimen can maintain dose continuity in practice.',
          'Signal: Deal activity remains hot across assets and platforms; implication: strategic demand supports financing and exit optionality, but crowded targets compress value for followers; watchpoint: link capital deployment to a catalyst that can change partner leverage.',
        ],
      },
      sonnyRead: {
        GENERAL:
          'The ADC landscape is no longer one category moving in one direction. These records show a class consolidating around deruxtecan and other topoisomerase-I payloads in TROP2, HER2, and HER3, while c-Met and Nectin-4 demonstrate that other target-payload pairs can still create meaningful positions. The practical differentiation axis is shifting toward tolerability: ILD, ocular events, mucositis, stomatitis, and hematologic toxicity all shape whether exposure can be sustained and whether combinations remain usable. TROPION-Lung02 and EV-302 make checkpoint combinations the frontier, but they also raise the burden of proving which component creates value and what toxicity the regimen adds. Deal activity remains active, especially around China-originated assets and next-generation platforms, so demand is not the constraint. The decision question is which construct can show a defensible clinical or operational edge before the competitive window narrows. I would change my view if emerging programs fail to separate on tolerability or if combination activity does not translate into a manageable, clearly attributable regimen benefit.',
        SCIENTIST:
          'Read this landscape through therapeutic index, not payload labels alone. Deruxtecan and other topoisomerase-I payloads recur across major targets, which makes linker behavior, exposure, bystander effect, and toxicity phenotype central to differentiation. The records identify ILD, ocular surface events, mucositis, stomatitis, neutropenia, and leukopenia as recurring constraints that can interfere with sustained dosing. Combination data in NSCLC and urothelial cancer show why regimen biology now matters as much as monotherapy activity, but attribution and additive toxicity remain critical. The highest-value experiment is the one that connects construct design to a measurable shift in usable exposure or treatment burden. I would change my view if the proposed mechanistic edge does not produce a distinct safety pattern or if dose interruptions erase the expected efficacy advantage.',
        SCOUT:
          'The scouting map is broad but not empty. Validated positions now span TROP2, HER2, c-Met, and Nectin-4, with HER3 and other targets moving through the pipeline, so a new asset needs more than a target-selection story. The credible wedge combines a defined indication, a payload-linker rationale, and tolerability that supports dose continuity or combination use. TROPION-Lung02 and EV-302 also shift diligence toward sequencing and regimen strategy: partners will ask where the asset fits with checkpoint blockade and what operational burden comes with it. Active dealmaking, including demand for China-originated assets and next-generation platforms, creates leverage only when asset-level evidence is near. I would change my view if the next readout leaves the differentiation claim dependent on platform narrative rather than a measurable clinical edge.',
        VC:
          'This is a validated class with rising execution risk. Approvals and pivotal datasets across c-Met, TROP2, HER2, and Nectin-4 reduce the need to underwrite the category itself, but they raise the bar for why a specific program wins. The most important variable is increasingly usable exposure: ILD, ocular events, mucositis, and hematologic toxicity can determine dose continuity, combination feasibility, and adoption. ADC-checkpoint regimens expand the opportunity while adding attribution and tolerability risk, so the next catalyst should resolve both value and burden. Deal activity supports strategic demand, particularly for differentiated assets and next-generation platforms, but follower economics will compress in crowded targets. I would change my view if a program can show a clear tolerability or regimen advantage early enough to alter partnering leverage and development cost.',
      },
      watchlist: [
        'Which constructs show a measurable tolerability advantage that supports sustained dosing rather than only a different adverse-event mix?',
        'Do ADC-checkpoint combinations show a clear contribution from the ADC with a manageable increase in treatment burden?',
        'Where do emerging HER3, c-Met, Nectin-4, and other targets create real white space versus another crowded indication?',
        'Which China-originated assets or next-generation payload, linker, and bispecific platforms reach asset-level clinical proof that changes deal leverage?',
      ],
    },
    snapshots: [
      {
        id: 'adc-landscape-2026-07',
        fetchedAt: isoDaysAgo(1),
        items: [
          makeItem({
            id: 'adc-reg-001',
            kind: 'regulatory',
            title: 'FDA grants accelerated approval to telisotuzumab vedotin-tllv (Emrelis) for NSCLC with high c-Met protein overexpression',
            source: 'FDA',
            url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-telisotuzumab-vedotin-tllv-nsclc-high-c-met-protein-overexpression',
            publishedAt: '2025-05-14',
            summary: 'First c-Met-directed ADC (MMAE payload) approved, for previously treated nonsquamous NSCLC with high c-Met overexpression, with a companion diagnostic.',
            relevance: 'high',
            tags: ['ADC', 'telisotuzumab vedotin', 'c-Met', 'NSCLC', 'MMAE'],
            score: 0.94,
            matched: ['ADC', 'c-Met'],
          }),
          makeItem({
            id: 'adc-pub-001',
            kind: 'publication',
            title: 'Telisotuzumab vedotin monotherapy in previously treated c-Met-overexpressing advanced nonsquamous EGFR-wildtype NSCLC (Phase II LUMINOSITY)',
            source: 'J Clin Oncol (PubMed)',
            url: 'https://doi.org/10.1200/JCO.24.00720',
            publishedAt: '2024-06-06',
            summary: 'Pivotal phase II behind the Teliso-V approval: ORR 28.6% overall, 34.6% in c-Met-high, median OS 14.5 months (NCT03539536).',
            relevance: 'high',
            tags: ['ADC', 'telisotuzumab vedotin', 'c-Met', 'LUMINOSITY', 'NSCLC'],
            score: 0.92,
            matched: ['ADC', 'c-Met', 'Teliso-V'],
          }),
          makeItem({
            id: 'adc-reg-002',
            kind: 'regulatory',
            title: 'FDA approves datopotamab deruxtecan-dlnk (Datroway) for HR-positive, HER2-negative metastatic breast cancer',
            source: 'FDA',
            url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-datopotamab-deruxtecan-dlnk-unresectable-or-metastatic-hr-positive-her2-negative-breast',
            publishedAt: '2025-01-17',
            summary: 'TROP2-directed ADC approved on TROPION-Breast01 (PFS 6.9 vs 4.9 months, HR 0.63; no OS benefit).',
            relevance: 'high',
            tags: ['ADC', 'datopotamab deruxtecan', 'TROP2', 'Datroway', 'breast cancer'],
            score: 0.95,
            matched: ['ADC', 'TROP2', 'Dato-DXd'],
          }),
          makeItem({
            id: 'adc-reg-003',
            kind: 'regulatory',
            title: 'FDA approves datopotamab deruxtecan-dlnk (Datroway) for metastatic triple-negative breast cancer',
            source: 'FDA',
            url: 'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-datopotamab-deruxtecan-dlnk-unresectable-or-metastatic-triple-negative-breast-cancer',
            publishedAt: '2026-05-22',
            summary: 'Dato-DXd approved for PD-1/PD-L1-ineligible metastatic TNBC, reported as the first targeted therapy with an OS advantage over chemotherapy in this setting.',
            relevance: 'high',
            tags: ['ADC', 'datopotamab deruxtecan', 'TROP2', 'Datroway', 'TNBC'],
            score: 0.95,
            matched: ['ADC', 'TROP2', 'Dato-DXd'],
          }),
          makeItem({
            id: 'adc-clinical-001',
            kind: 'clinical',
            title: 'Datopotamab deruxtecan plus pembrolizumab with or without platinum chemotherapy for advanced NSCLC (Phase Ib TROPION-Lung02)',
            source: 'J Thorac Oncol (PubMed)',
            url: 'https://doi.org/10.1016/j.jtho.2026.103688',
            publishedAt: '2026-03-21',
            summary: 'Dato-DXd plus pembrolizumab gave confirmed ORR ~55% in treatment-naive NSCLC across PD-L1 levels; grade >=3 TRAEs 37% (doublet) to 60% (triplet) (NCT04526691).',
            relevance: 'high',
            tags: ['ADC', 'datopotamab deruxtecan', 'pembrolizumab', 'TROP2', 'NSCLC'],
            score: 0.93,
            matched: ['ADC', 'TROP2', 'Dato-DXd'],
          }),
          makeItem({
            id: 'adc-pub-002',
            kind: 'publication',
            title: 'Mapping the antibody-drug-conjugate landscape in non-small cell lung cancer: where are we and where are we going?',
            source: 'Cancer (PubMed)',
            url: 'https://doi.org/10.1002/cncr.70422',
            publishedAt: '2026-06-01',
            summary: 'Review of late-phase NSCLC ADCs across HER2 (T-DXd), TROP2 (Dato-DXd, sacituzumab govitecan), HER3 (patritumab deruxtecan), c-MET (Teliso-V), integrin beta-6 (sigvotatug vedotin), plus novel payloads and linkers.',
            relevance: 'high',
            tags: ['ADC', 'NSCLC', 'HER2', 'TROP2', 'HER3', 'c-Met'],
            score: 0.94,
            matched: ['ADC', 'HER2', 'TROP2', 'HER3', 'c-MET'],
          }),
          makeItem({
            id: 'adc-pub-003',
            kind: 'publication',
            title: 'Sacituzumab tirumotecan (sac-TMT / MK-2870 / SKB264): a novel antibody-drug conjugate in breast cancer',
            source: 'Oncology Reviews (PubMed)',
            url: 'https://doi.org/10.3389/or.2026.1781533',
            publishedAt: '2026-02-05',
            summary: 'Review of the TROP2 ADC sac-TMT, a belotecan-derived topoisomerase-I payload with a bystander effect; main toxicities neutropenia, leukopenia, stomatitis.',
            relevance: 'medium',
            tags: ['ADC', 'sacituzumab tirumotecan', 'TROP2', 'topoisomerase-I', 'breast cancer'],
            score: 0.82,
            matched: ['ADC', 'TROP2', 'sac-TMT'],
          }),
          makeItem({
            id: 'adc-reg-004',
            kind: 'regulatory',
            title: 'FDA grants Breakthrough Therapy Designation to sacituzumab tirumotecan (sac-TMT) for previously treated EGFR-mutated nonsquamous NSCLC',
            source: 'Merck (news release)',
            url: 'https://www.merck.com/news/fda-grants-breakthrough-therapy-designation-to-sacituzumab-tirumotecan-sac-tmt-for-the-treatment-of-certain-patients-with-previously-treated-advanced-or-metastatic-nonsquamous-non-small-cell-lung-ca/',
            publishedAt: '2024-12-01',
            summary: 'TROP2 ADC (Merck/Kelun-Biotech) received US Breakthrough Therapy designation for EGFR-mutated NSCLC; approved in China (NMPA) March 2025 for the same setting.',
            relevance: 'high',
            tags: ['ADC', 'sacituzumab tirumotecan', 'TROP2', 'EGFR-mutated NSCLC'],
            score: 0.88,
            matched: ['ADC', 'TROP2', 'sac-TMT'],
          }),
          makeItem({
            id: 'adc-clinical-002',
            kind: 'clinical',
            title: 'Enfortumab vedotin and pembrolizumab in untreated advanced urothelial cancer (EV-302)',
            source: 'NEJM',
            url: 'https://doi.org/10.1056/NEJMoa2312117',
            publishedAt: '2024-03-01',
            summary: 'Nectin-4 ADC enfortumab vedotin plus pembrolizumab roughly doubled median PFS and OS vs platinum chemotherapy in first-line metastatic urothelial carcinoma (886 patients).',
            relevance: 'high',
            tags: ['ADC', 'enfortumab vedotin', 'Nectin-4', 'pembrolizumab', 'urothelial cancer'],
            score: 0.93,
            matched: ['ADC', 'Nectin-4'],
          }),
          makeItem({
            id: 'adc-pub-004',
            kind: 'publication',
            title: 'Efficacy and safety of trastuzumab deruxtecan in HER2-positive advanced gastric or gastroesophageal cancer: meta-analysis of single-arm trials',
            source: 'Clin Transl Oncol (PubMed)',
            url: 'https://doi.org/10.1007/s12094-026-04406-5',
            publishedAt: '2026-06-04',
            summary: 'Pooled analysis of 8 trials (1,182 patients): T-DXd pooled ORR 42.7%, grade >=3 AEs 46.7%, interstitial lung disease 2.1%.',
            relevance: 'high',
            tags: ['ADC', 'trastuzumab deruxtecan', 'HER2', 'ILD', 'gastric cancer'],
            score: 0.91,
            matched: ['ADC', 'HER2', 'T-DXd'],
          }),
          makeItem({
            id: 'adc-pub-005',
            kind: 'publication',
            title: 'Datopotamab deruxtecan (Dato-DXd) as a treatment option for EGFR-mutated non-small cell lung cancer',
            source: 'Future Oncol (PubMed)',
            url: 'https://doi.org/10.1080/14796694.2026.2685854',
            publishedAt: '2026-06-25',
            summary: 'Review of Dato-DXd in EGFR-mutant NSCLC (pooled ORR ~45%, DoR 6.5 months); adverse events of special interest: mucositis, interstitial lung disease, ocular surface events.',
            relevance: 'medium',
            tags: ['ADC', 'datopotamab deruxtecan', 'TROP2', 'EGFR-mutated NSCLC', 'ILD'],
            score: 0.84,
            matched: ['ADC', 'TROP2', 'Dato-DXd'],
          }),
          makeItem({
            id: 'adc-deal-001',
            kind: 'deal',
            title: 'Deal bonanza for ADC assets continues',
            source: 'Nature (news feature)',
            url: 'https://www.nature.com/articles/d43747-025-00063-9',
            publishedAt: '2025-01-01',
            summary: 'The surge in ADC licensing and acquisitions continues, with China-originated assets and next-generation platforms (payloads, linkers, bispecific ADCs) driving big-pharma demand.',
            relevance: 'medium',
            tags: ['ADC', 'dealmaking', 'licensing', 'China', 'payloads', 'linkers'],
            score: 0.78,
            matched: ['ADC'],
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
