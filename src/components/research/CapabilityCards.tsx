import {
  Activity,
  FileSearch,
  FlaskConical,
  GitBranch,
  Layers3,
  type LucideIcon,
} from 'lucide-react';

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
  cta: string;
  icon: LucideIcon;
  template?: ResearchTemplate;
}

const DEEP_RESEARCH_TEMPLATE: ResearchTemplate = {
  prompt: 'Run a full due-diligence report on [target]. I want a conclusion-first, balanced assessment - the case for and the case against - grounded in literature and public data, with every claim cited to source.',
  target: undefined,
  contextChip: 'DepMap · GTEx · PubMed',
};

const CAPABILITIES: Capability[] = [
  {
    id: 'combination-screening',
    title: 'Combination drug screening',
    description: 'Score a combination screen for synergy and propose the strongest pairs to test.',
    status: 'available',
    image: '/workbook/combo/fig_synergy_matrices.png',
    alt: 'Drug combination synergy matrices across screened pairs',
    cta: 'Start screening',
    icon: FlaskConical,
  },
  {
    id: 'western-blot',
    title: 'Western blot analysis',
    description: 'Quantify band intensity by background-corrected densitometry, normalized to a loading control.',
    status: 'available',
    image: '/workbook/western/annotated.png',
    alt: 'Annotated western blot with detected band regions',
    cta: 'Analyze blot',
    icon: Layers3,
  },
  {
    id: 'flow-cytometry',
    title: 'Flow cytometry analysis',
    description: 'Gate, phenotype, and summarize FCS data, every step grounded and reproducible.',
    status: 'available',
    image: '/workbook/flow/04_lineage.png',
    alt: 'Flow cytometry lineage scatter plot',
    cta: 'Open workbook',
    icon: Activity,
  },
  {
    id: 'deep-research',
    title: 'Deep target research',
    description: 'Six specialists read literature and public data and return a cited, balanced assessment - the case for and against.',
    status: 'available',
    image: '/deep-research.png',
    alt: 'Grounded due-diligence report with a balanced assessment and cited claims',
    cta: 'Start a report',
    icon: GitBranch,
    template: DEEP_RESEARCH_TEMPLATE,
  },
  {
    id: 'patent',
    title: 'Patent sequence extraction',
    description: 'Parse a patent PDF, pull antibody sequences and CDRs, and BLAST-verify against the claims.',
    status: 'coming-soon',
    image: '/patent-ip.png',
    alt: 'Antibody sequence alignment against a patent claim',
    cta: 'Coming soon',
    icon: FileSearch,
  },
];

interface CapabilityCardsProps {
  onSelectTemplate?: (template: ResearchTemplate) => void;
  onSelectWorkbook?: (capabilityId: string) => void;
}

export function CapabilityCards({ onSelectTemplate, onSelectWorkbook }: CapabilityCardsProps) {
  const launchCapability = (capability: Capability) => {
    if (capability.status !== 'available') return;
    if (capability.template) {
      onSelectTemplate?.(capability.template);
      return;
    }
    onSelectWorkbook?.(capability.id);
  };

  return (
    <section aria-labelledby="agent-capabilities-heading">
      <h2 id="agent-capabilities-heading" className="t-h2 mb-5 text-textPrimary sm:mb-6">
        Agent capabilities
      </h2>

      <div className="capability-grid">
        {CAPABILITIES.map((capability) => {
          const isAvailable = capability.status === 'available';
          const Icon = capability.icon;

          return (
            <article
              key={capability.id}
              onClick={isAvailable ? () => launchCapability(capability) : undefined}
              className={`premium-capability-card ${isAvailable ? 'premium-capability-card-available' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="capability-icon" aria-hidden="true">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <h3 className="t-h3 min-w-0 text-textPrimary">{capability.title}</h3>
              </div>

              <div className="hero-panel">
                <img
                  src={capability.image}
                  alt={capability.alt}
                  className="h-full w-full object-contain"
                  loading={capability.id === 'combination-screening' ? 'eager' : 'lazy'}
                />
              </div>

              <p className="capability-description t-body-sm text-textSecondary">
                {capability.description}
              </p>

              {isAvailable ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    launchCapability(capability);
                  }}
                  className="premium-cta mt-auto w-full"
                  aria-label={`${capability.cta}: ${capability.title}`}
                >
                  {capability.cta}
                  <span aria-hidden="true">&#8599;</span>
                </button>
              ) : (
                <span className="coming-soon-pill mt-auto">Coming soon</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
