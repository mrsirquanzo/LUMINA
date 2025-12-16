import { useEffect, useMemo, useRef, useState } from 'react';
import Tile from '../Tile';
import { FlaskConical } from 'lucide-react';
import { UniProtClient } from '../../lib/clients/biology/uniprotClient';

interface DruggabilityTileProps {
  data: any;
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function DruggabilityTile({ data, loading, onAgentClick, extendedIntelligence }: DruggabilityTileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'compounds' | 'modalities'>(
    'overview'
  );
  const [pdbIds, setPdbIds] = useState<string[]>([]);
  const [isLoadingPdb, setIsLoadingPdb] = useState(false);
  const [pdbError, setPdbError] = useState<string>('');
  const pdbLoadRef = useRef<{ uniprotId?: string; isLoading: boolean }>({ isLoading: false });

  const uniprotId = data?.structuralData?.uniprotId as string | undefined;
  const uniprotClient = useMemo(() => new UniProtClient(), []);

  useEffect(() => {
    if (activeTab !== 'structure') return;
    if (!uniprotId) return;
    // Avoid double-start / self-cancellation loops by tracking load state in a ref,
    // rather than depending on `isLoadingPdb` which would re-run this effect.
    if (pdbLoadRef.current.isLoading) return;
    if (pdbIds.length > 0 && pdbLoadRef.current.uniprotId === uniprotId) return;

    let isCancelled = false;

    const loadPdb = async () => {
      pdbLoadRef.current = { uniprotId, isLoading: true };
      setIsLoadingPdb(true);
      setPdbError('');
      try {
        const ids = await uniprotClient.getPdbReferences(uniprotId);
        const normalized = Array.from(
          new Set(
            (ids || [])
              .filter(Boolean)
              .map((id) => String(id).trim().toUpperCase())
              .filter((id) => /^[0-9][A-Z0-9]{3}$/.test(id))
          )
        );

        if (isCancelled) return;
        setPdbIds(normalized.slice(0, 12));
      } catch (err) {
        console.error('[DruggabilityTile] Failed to load PDB references:', err);
        if (isCancelled) return;
        setPdbError('Could not load PDB structures right now.');
      } finally {
        if (!isCancelled) setIsLoadingPdb(false);
        pdbLoadRef.current = { uniprotId, isLoading: false };
      }
    };

    void loadPdb();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, uniprotClient, uniprotId]);

  const pdbCountLabel =
    typeof data?.structuralData?.pdbCount === 'number' ? String(data.structuralData.pdbCount) : '—';

  return (
    <Tile
      title="Druggability"
      icon={<FlaskConical className="w-5 h-5" />}
      tileType="general"
      loading={loading}
      className="h-[380px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex gap-2 mb-4 border-b border-white/5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
        {(['overview', 'structure', 'compounds', 'modalities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-base font-semibold transition-colors capitalize whitespace-nowrap flex-shrink-0 ${
              activeTab === tab
                ? 'text-textPrimary border-b-2 border-primary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden pr-2 pb-2">
        {activeTab === 'overview' && (
          <div className="space-y-5 pb-4 px-1">
            <p className="text-base leading-relaxed text-textPrimary">{data.tractabilityAssessment}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">PDB Count</p>
                <p className="text-2xl font-bold text-textPrimary leading-tight">{data.structuralData.pdbCount}</p>
              </div>
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">AlphaFold</p>
                <p className="text-2xl font-bold text-textPrimary leading-tight">
                  {data.structuralData.alphafoldConfidence}%
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'structure' && (
          <div className="space-y-5 pb-4 px-1 min-w-0">
            <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-textSecondary uppercase tracking-wide">PDB Structures</p>
                  <p className="text-base text-textPrimary mt-1">
                    Showing structures from UniProt cross-references (PDB). Total known: <span className="font-semibold tabular-nums">{pdbCountLabel}</span>
                  </p>
                </div>
                {uniprotId && (
                  <a
                    href={`https://www.uniprot.org/uniprotkb/${encodeURIComponent(uniprotId)}/entry`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline flex-shrink-0"
                  >
                    View UniProt
                  </a>
                )}
              </div>
            </div>

            {pdbError && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 text-base text-textPrimary">
                {pdbError}{' '}
                {uniprotId ? (
                  <a
                    className="text-primary hover:underline"
                    href={`https://www.rcsb.org/search?query=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22attribute%22%3A%22rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession%22%2C%22operator%22%3A%22exact_match%22%2C%22value%22%3A%22${encodeURIComponent(
                      uniprotId
                    )}%22%7D%7D%2C%22return_type%22%3A%22entry%22%7D`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search RCSB
                  </a>
                ) : null}
              </div>
            )}

            {isLoadingPdb && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surfaceElevated rounded-lg border border-white/5 p-4 min-h-[120px] animate-pulse"
                  >
                    <div className="h-16 bg-white/5 rounded mb-3" />
                    <div className="h-4 bg-white/5 rounded w-16" />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingPdb && !pdbError && (
              <>
                {pdbIds.length === 0 ? (
                  <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 text-base text-textSecondary">
                    No PDB structures were found for this UniProt entry.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
                    {pdbIds.map((pdbId) => (
                      <a
                        key={pdbId}
                        href={`https://www.rcsb.org/structure/${encodeURIComponent(pdbId)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group bg-surfaceElevated rounded-lg border border-white/5 p-4 hover:border-primary/30 transition-colors min-w-0 overflow-hidden"
                        title={`Open ${pdbId} on RCSB`}
                      >
                        <div className="w-full h-20 rounded-md bg-black/30 overflow-hidden flex items-center justify-center mb-3">
                          <img
                            src={`https://cdn.rcsb.org/images/structures/${pdbId.toLowerCase()}_assembly-1.jpeg`}
                            alt={`PDB ${pdbId} preview`}
                            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                            onError={(e) => {
                              // If image isn't available, fall back to a neutral placeholder.
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="text-xs text-textTertiary tabular-nums">{pdbId}</div>
                        </div>
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <p className="text-base font-semibold text-textPrimary tabular-nums truncate">{pdbId}</p>
                          <span className="text-xs text-textTertiary group-hover:text-primary transition-colors flex-shrink-0">
                            RCSB →
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'compounds' && (
          <div className="space-y-3 pb-4 px-1">
            {data.existingCompounds.map((compound: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <p className="text-base font-semibold text-textPrimary mb-2">{compound.name}</p>
                <p className="text-base text-textPrimary font-medium mb-1">{compound.phase}</p>
                {compound.mechanism && (
                  <p className="text-base text-textPrimary">{compound.mechanism}</p>
                )}
                {compound.activity && (
                  <p className="text-base text-textPrimary font-medium mt-1">Activity: {compound.activity}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'modalities' && (
          <div className="space-y-3 pb-4 px-1">
            {data.modalityRecommendations.map((mod: any, idx: number) => (
              <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-semibold text-textPrimary">{mod.modality}</p>
                  <span className={`text-sm px-3 py-1 rounded font-medium ${
                    mod.feasibility === 'High' ? 'bg-success/20 text-success' :
                    mod.feasibility === 'Medium' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                    {mod.feasibility}
                  </span>
                </div>
                <p className="text-base leading-relaxed text-textPrimary">{mod.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}
