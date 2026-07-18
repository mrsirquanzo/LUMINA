/**
 * CapabilityCards - image-forward "What Sonny can do" section.
 * Primary research capabilities plus focused workbook demos.
 */

export interface ResearchTemplate {
  prompt: string;
  target?: string;
  contextChip?: string;
}

interface Capability {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  image: string;
  alt: string;
  template?: ResearchTemplate;
}

const DEEP_RESEARCH_TEMPLATE: ResearchTemplate = {
  prompt: 'Run a full due-diligence report on [target]. I want a conclusion-first GO / WATCH / NO-GO verdict, grounded in literature and public data, with every claim cited to source.',
  target: undefined,
  contextChip: 'DepMap · GTEx · PubMed',
};

const CAPABILITIES: Capability[] = [
  {
    id: 'flow-cytometry',
    title: 'Flow cytometry analysis',
    description: 'Gate, phenotype, and summarize FCS data in a hardened sandbox. Every step grounded and reproducible.',
    status: 'available',
    image: '/flow-cytometry.png',
    alt: 'Flow cytometry gating: FSC/SSC and CD3 vs CD19',
  },
  {
    id: 'western-blot',
    title: 'Western blot analysis',
    description: 'Quantify band intensity by background-corrected densitometry, normalize to a loading control, and report fold-change.',
    status: 'available',
    image: '/workbook/western/annotated.png',
    alt: 'Western blot with detected HER2, HSP90, and GAPDH band regions',
  },
  {
    id: 'patent',
    title: 'Patent sequence extraction',
    description: 'Parse a patent PDF, pull antibody sequences and CDRs, and BLAST-verify against the claims.',
    status: 'coming-soon',
    image: '/patent-ip.png',
    alt: 'Antibody sequence BLAST + ANARCI alignment against a patent claim',
  },
];

const COMBINATION_SCREENING: Capability = {
  id: 'combination-screening',
  title: 'Combination drug screening',
  description: 'Score a combination screen for synergy and propose the strongest pairs to test at the bench, grounded in the dose-response data.',
  status: 'available',
  image: '/workbook/combo/fig_ranking.png',
  alt: 'Drug combinations ranked by mean excess over Bliss synergy',
};

interface CapabilityCardsProps {
  onSelectTemplate?: (template: ResearchTemplate) => void;
  onSelectWorkbook?: (capabilityId: string) => void;
}

export function CapabilityCards({ onSelectTemplate, onSelectWorkbook }: CapabilityCardsProps) {
  const pick = (template?: ResearchTemplate) => {
    if (template && onSelectTemplate) onSelectTemplate(template);
  };
  return (
    <div>
      <h2 className="t-h3 mb-3.5 text-textPrimary">
        What Sonny can do
      </h2>

      {/* Headline workbook capability */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectWorkbook?.(COMBINATION_SCREENING.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelectWorkbook?.(COMBINATION_SCREENING.id);
          }
        }}
        className="capability-card surface-card-interactive mb-3.5 cursor-pointer flex-col items-stretch sm:flex-row sm:items-center"
      >
        <span className="flex min-w-0 flex-1 flex-col self-stretch py-0.5">
          <span className="t-eyebrow mb-2 inline-flex items-center gap-1.5 text-primary">
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: '#1D4ED8' }} />
            AVAILABLE
          </span>
          <span className="t-h3 block text-textPrimary">
            {COMBINATION_SCREENING.title}
          </span>
          <span className="t-body-sm mt-1 block max-w-[46ch] text-textSecondary">
            {COMBINATION_SCREENING.description}
          </span>
          <span className="t-meta mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold text-primary">
            Open workbook <span aria-hidden="true">→</span>
          </span>
        </span>
        <img
          src={COMBINATION_SCREENING.image}
          alt={COMBINATION_SCREENING.alt}
          className="capability-media h-[118px] w-full flex-none object-cover sm:w-[280px]"
          style={{ objectPosition: 'center' }}
          loading="eager"
        />
      </div>

      {/* Primary capability */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => pick(DEEP_RESEARCH_TEMPLATE)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick(DEEP_RESEARCH_TEMPLATE); }}
        className="capability-card surface-card-interactive mb-3.5 cursor-pointer flex-col items-stretch sm:flex-row sm:items-center"
      >
        <span className="flex min-w-0 flex-1 flex-col self-stretch py-0.5">
          <span className="t-eyebrow mb-2 inline-flex items-center gap-1.5 text-primary">
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: '#1D4ED8' }} />
            AVAILABLE
          </span>
          <span className="t-h3 block text-textPrimary">
            Deep target research
          </span>
          <span className="t-body-sm mt-1 block max-w-[46ch] text-textSecondary">
            Six specialists read the literature and public data, run grounded computational analysis across DepMap,
            GTEx, and tumor expression, then return a conclusion-first GO / WATCH / NO-GO report with every claim cited.
          </span>
          <span className="t-meta mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold text-primary">
            Start a report <span aria-hidden="true">→</span>
          </span>
        </span>
        <img
          src="/deep-research.png"
          alt="Grounded due-diligence report with a verdict and cited claims"
          className="capability-media h-[118px] w-full flex-none object-cover sm:w-[280px]"
          style={{ objectPosition: 'left top' }}
          loading="lazy"
        />
      </div>

      {/* Image-forward capability grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {CAPABILITIES.map((cap) => {
          const isAvailable = cap.status === 'available';
          return (
            <div
              key={cap.id}
              role={isAvailable ? 'button' : undefined}
              tabIndex={isAvailable ? 0 : undefined}
              onClick={() => { if (isAvailable) onSelectWorkbook?.(cap.id); }}
              onKeyDown={(event) => {
                if (isAvailable && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  onSelectWorkbook?.(cap.id);
                }
              }}
              className={`capability-card flex-col ${isAvailable ? 'surface-card-interactive cursor-pointer' : 'bg-slate-50/70'}`}
            >
              <div className="capability-media h-[132px] w-full">
                <img
                  src={cap.image}
                  alt={cap.alt}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'left top' }}
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col px-0.5 pb-0.5">
                <span className="t-h3 block text-textPrimary">
                  {cap.title}
                </span>
                <span className="t-body-sm mt-1 block text-textSecondary">
                  {cap.description}
                </span>
                <span className={`t-meta mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold ${isAvailable ? 'text-primary' : 'text-textTertiary'}`}>
                  {isAvailable ? (
                    <><span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />Open workbook <span aria-hidden="true">→</span></>
                  ) : 'Coming soon'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
