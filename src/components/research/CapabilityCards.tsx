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

function lift(el: HTMLDivElement, on: boolean) {
  el.style.boxShadow = on
    ? '0 10px 30px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.05)'
    : '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)';
  el.style.transform = on ? 'translateY(-2px)' : 'none';
  el.style.borderColor = on ? '#C3D4F2' : '';
}

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
      <h2
        className="font-display text-textPrimary mb-3.5"
        style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
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
        className="bg-surface border border-border rounded-[14px] p-[18px] mb-3.5 flex flex-col sm:flex-row gap-5 items-stretch sm:items-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
        onMouseEnter={(event) => lift(event.currentTarget as HTMLDivElement, true)}
        onMouseLeave={(event) => lift(event.currentTarget as HTMLDivElement, false)}
      >
        <span className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 mb-2" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#1D4ED8' }}>
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: '#1D4ED8' }} />
            AVAILABLE
          </span>
          <span className="block text-textPrimary font-semibold" style={{ fontSize: 15.5 }}>
            {COMBINATION_SCREENING.title}
          </span>
          <span className="block text-textSecondary mt-1 leading-relaxed" style={{ fontSize: 12.5, maxWidth: '46ch' }}>
            {COMBINATION_SCREENING.description}
          </span>
          <span className="inline-flex items-center gap-1.5 mt-2.5 text-primary" style={{ fontSize: 11, fontWeight: 600 }}>
            Open workbook <span aria-hidden="true">→</span>
          </span>
        </span>
        <img
          src={COMBINATION_SCREENING.image}
          alt={COMBINATION_SCREENING.alt}
          className="w-full sm:w-[280px] flex-none rounded-[10px] border border-border object-cover"
          style={{ height: 118, objectPosition: 'center' }}
          loading="eager"
        />
      </div>

      {/* Primary capability */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => pick(DEEP_RESEARCH_TEMPLATE)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick(DEEP_RESEARCH_TEMPLATE); }}
        className="bg-surface border border-border rounded-[14px] p-[18px] mb-3.5 flex flex-col sm:flex-row gap-5 items-stretch sm:items-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
        onMouseEnter={(e) => lift(e.currentTarget as HTMLDivElement, true)}
        onMouseLeave={(e) => lift(e.currentTarget as HTMLDivElement, false)}
      >
        <span className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 mb-2" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#1D4ED8' }}>
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: '#1D4ED8' }} />
            AVAILABLE
          </span>
          <span className="block text-textPrimary font-semibold" style={{ fontSize: 15.5 }}>
            Deep target research
          </span>
          <span className="block text-textSecondary mt-1 leading-relaxed" style={{ fontSize: 12.5, maxWidth: '46ch' }}>
            Six specialists read the literature and public data, run grounded computational analysis across DepMap,
            GTEx, and tumor expression, then return a conclusion-first GO / WATCH / NO-GO report with every claim cited.
          </span>
          <span className="inline-flex items-center gap-1.5 mt-2.5 text-primary" style={{ fontSize: 11, fontWeight: 600 }}>
            Start a report <span aria-hidden="true">→</span>
          </span>
        </span>
        <img
          src="/deep-research.png"
          alt="Grounded due-diligence report with a verdict and cited claims"
          className="w-full sm:w-[280px] flex-none rounded-[10px] border border-border object-cover"
          style={{ height: 118, objectPosition: 'left top' }}
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
              className={`bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${isAvailable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#C3D4F2] hover:shadow-[0_10px_30px_rgba(15,23,42,.10),0_2px_8px_rgba(15,23,42,.05)] active:translate-y-0' : ''}`}
              style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
            >
              <div className="w-full bg-subtle border-b border-border overflow-hidden" style={{ height: 132 }}>
                <img
                  src={cap.image}
                  alt={cap.alt}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'left top' }}
                  loading="lazy"
                />
              </div>
              <div className="p-[16px]">
                <span className="block text-textPrimary font-semibold" style={{ fontSize: 14 }}>
                  {cap.title}
                </span>
                <span className="block text-textSecondary mt-1 leading-relaxed" style={{ fontSize: 12.5 }}>
                  {cap.description}
                </span>
                <span className={`inline-flex items-center gap-1.5 mt-2.5 ${isAvailable ? 'text-primary' : 'text-textTertiary'}`} style={{ fontSize: 11, fontWeight: 600 }}>
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
