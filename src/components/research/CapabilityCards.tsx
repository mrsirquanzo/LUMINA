/**
 * CapabilityCards - image-forward "What Sonny can do" section.
 * A hero feature card (grounded data analysis, real TROP2 figure) plus a grid of
 * image-led capability cards. Honest status per card; available cards lift on hover.
 */

interface Capability {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  image: string;
  alt: string;
  example?: string; // prompt loaded into the composer when the card is clicked
}

const CAPABILITIES: Capability[] = [
  {
    id: 'deep-research',
    title: 'Deep target research',
    description: 'Six specialists over one grounded evidence store — a conclusion-first GO / WATCH / NO-GO dossier.',
    status: 'available',
    image: '/deep-research.png',
    alt: 'Grounded due-diligence dossier with a GO verdict and cited claims',
    example: 'TROP2',
  },
  {
    id: 'competitive',
    title: 'Competitive landscape',
    description: 'Map the field with clarity — the players, strategies, and positioning that redefine advantage.',
    status: 'available',
    image: '/competitive-landscape.png',
    alt: 'TROP2 ADC competitive positioning quadrant',
    example: 'CDCP1',
  },
  {
    id: 'flow-cytometry',
    title: 'Flow cytometry analysis',
    description: 'Gate, phenotype, and summarize FCS data in a hardened sandbox — every step grounded and reproducible.',
    status: 'coming-soon',
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

function lift(el: HTMLDivElement, on: boolean) {
  el.style.boxShadow = on
    ? '0 10px 30px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.05)'
    : '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)';
  el.style.transform = on ? 'translateY(-2px)' : 'none';
  el.style.borderColor = on ? '#C3D4F2' : '';
}

export function CapabilityCards({ onSelectExample }: { onSelectExample?: (prompt: string) => void }) {
  const pick = (example?: string) => {
    if (example && onSelectExample) onSelectExample(example);
  };
  return (
    <div>
      <h2
        className="font-display text-textPrimary mb-3.5"
        style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        What Sonny can do
      </h2>

      {/* Hero feature card: real grounded data analysis output */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => pick('TACSTD2')}
        onKeyDown={(e) => { if (e.key === 'Enter') pick('TACSTD2'); }}
        className="bg-surface border border-border rounded-[14px] p-[18px] mb-3.5 flex gap-5 items-center transition-all duration-200 cursor-pointer"
        style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
        onMouseEnter={(e) => lift(e.currentTarget as HTMLDivElement, true)}
        onMouseLeave={(e) => lift(e.currentTarget as HTMLDivElement, false)}
      >
        <span className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 mb-2" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: '#1D4ED8' }}>
            <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: '#1D4ED8' }} />
            NEW
          </span>
          <span className="block text-textPrimary font-semibold" style={{ fontSize: 15.5 }}>
            Grounded data analysis
          </span>
          <span className="block text-textSecondary mt-1 leading-relaxed" style={{ fontSize: 12.5, maxWidth: '46ch' }}>
            Sonny runs reviewed analyses in a hardened sandbox - DepMap dependency, GTEx normal-tissue expression,
            tumor expression - and grounds every computed number to the dataset and the code that produced it.
          </span>
          <span className="inline-flex items-center gap-1.5 mt-2.5" style={{ fontSize: 11, fontWeight: 600, color: '#15803D' }}>
            <span className="w-[7px] h-[7px] rounded-full inline-block flex-none" style={{ background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,.16)' }} />
            Available
          </span>
        </span>
        <img
          src="/trop2-analysis.png"
          alt="TROP2 / TACSTD2 grounded analysis: DepMap dependency, tumor expression, GTEx normal tissue"
          className="flex-none rounded-[10px] border border-border object-cover"
          style={{ width: 280, height: 118, objectPosition: 'left top' }}
          loading="lazy"
        />
      </div>

      {/* Image-forward capability grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {CAPABILITIES.map((cap) => {
          const available = cap.status === 'available';
          return (
            <div
              key={cap.id}
              role={available ? 'button' : undefined}
              tabIndex={available ? 0 : undefined}
              onClick={available ? () => pick(cap.example) : undefined}
              onKeyDown={available ? (e) => { if (e.key === 'Enter') pick(cap.example); } : undefined}
              className={`bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col transition-all duration-200 ${available ? 'cursor-pointer' : ''}`}
              style={{ boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)' }}
              onMouseEnter={available ? (e) => lift(e.currentTarget as HTMLDivElement, true) : undefined}
              onMouseLeave={available ? (e) => lift(e.currentTarget as HTMLDivElement, false) : undefined}
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
                {available ? (
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="inline-flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, color: '#15803D' }}>
                      <span className="w-[7px] h-[7px] rounded-full inline-block flex-none" style={{ background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,.16)' }} />
                      Available
                    </span>
                    <span className="text-primary font-semibold" style={{ fontSize: 11 }}>
                      Try {cap.example} &rarr;
                    </span>
                  </div>
                ) : (
                  <span className="inline-block mt-2.5 text-textTertiary" style={{ fontSize: 11, fontWeight: 600 }}>
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
