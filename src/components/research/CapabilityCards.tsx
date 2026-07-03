/**
 * CapabilityCards - honest "What Sonny can do" 2-column grid.
 * Active cards lift on hover; coming-soon cards are inert (dashed, muted, cursor-default).
 */

interface Capability {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  icon: React.ReactNode;
}

function BeakerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v6l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V3" />
    </svg>
  );
}

function PatentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M10 12h6M10 16h4M10 8h2" />
    </svg>
  );
}

function PosIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

function IndicationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  );
}

const CAPABILITIES: Capability[] = [
  {
    id: 'deep-research',
    title: 'Deep target research',
    description: 'Six specialists over one grounded evidence store, a conclusion-first dossier with a GO / WATCH / NO-GO verdict.',
    status: 'available',
    icon: <BeakerIcon />,
  },
  {
    id: 'patent',
    title: 'Patent sequence extraction',
    description: 'Parse a patent PDF and pull the antibody sequences, CDRs, chains, SEQ IDs, grounded to the source.',
    status: 'coming-soon',
    icon: <PatentIcon />,
  },
  {
    id: 'pos',
    title: 'Probability-of-success scoring',
    description: 'Score a program against industry base rates.',
    status: 'coming-soon',
    icon: <PosIcon />,
  },
  {
    id: 'indication',
    title: 'Indication and translational strategy',
    description: 'Sequence the clinical path and lead indication.',
    status: 'coming-soon',
    icon: <IndicationIcon />,
  },
];

export function CapabilityCards() {
  return (
    <div>
      <h2
        className="font-display text-textPrimary mb-3.5"
        style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        What Sonny can do
      </h2>
      <div className="grid grid-cols-2 gap-3.5">
        {CAPABILITIES.map((cap) => {
          const isAvailable = cap.status === 'available';
          return isAvailable ? (
            <div
              key={cap.id}
              className="bg-surface border border-border rounded-[14px] p-[18px] flex gap-3 transition-all duration-200"
              style={{
                boxShadow: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 10px 30px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.05)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.borderColor = '#C3D4F2';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.035)';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.borderColor = '';
              }}
            >
              {/* Active icon badge - blue tint */}
              <span
                className="flex-none w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"
                style={{ background: '#EFF6FF', color: '#1D4ED8' }}
              >
                {cap.icon}
              </span>
              <span>
                <span className="block text-textPrimary font-semibold" style={{ fontSize: 14.5 }}>
                  {cap.title}
                </span>
                <span
                  className="block text-textSecondary mt-0.5 leading-relaxed"
                  style={{ fontSize: 12.5 }}
                >
                  {cap.description}
                </span>
                {/* Available badge */}
                <span className="inline-flex items-center gap-1.5 mt-2.5" style={{ fontSize: 11, fontWeight: 600, color: '#15803D' }}>
                  <span
                    className="w-[7px] h-[7px] rounded-full inline-block flex-none"
                    style={{ background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,.16)' }}
                  />
                  Available
                </span>
              </span>
            </div>
          ) : (
            <div
              key={cap.id}
              className="rounded-[14px] p-[18px] flex gap-3"
              style={{
                border: '1px dashed #D4DBE6',
                background: 'rgba(241,245,249,.5)',
                opacity: 0.9,
                cursor: 'default',
              }}
            >
              {/* Muted icon badge */}
              <span
                className="flex-none w-[38px] h-[38px] rounded-[10px] flex items-center justify-center"
                style={{ background: '#F1F5F9', color: '#94A3B8' }}
              >
                {cap.icon}
              </span>
              <span>
                <span className="block font-semibold" style={{ fontSize: 14.5, color: '#475569' }}>
                  {cap.title}
                </span>
                <span
                  className="block mt-0.5 leading-relaxed"
                  style={{ fontSize: 12.5, color: '#94A3B8' }}
                >
                  {cap.description}
                </span>
                <span
                  className="inline-block mt-2.5 font-semibold"
                  style={{ fontSize: 11, color: '#94A3B8' }}
                >
                  Coming soon
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CapabilityCards;
