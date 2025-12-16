import { useState } from 'react';
import Tile from '../Tile';
import { Dna } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { GWASAssociation, ConstraintMetrics } from '../../types';

interface GeneticValidationTileProps {
  data: {
    validationScore: string;
    validationSummary: string;
    gwasAssociations: GWASAssociation[];
    constraintMetrics: ConstraintMetrics;
    mendelianDiseases: string[];
    directionOfEffect: string;
    biobankEvidence: Array<{ source: string; finding: string }>;
    lofCarrierPhenotypes: string;
    agents?: readonly ('sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research')[];
    primaryAgent?: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research';
  };
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function GeneticValidationTile({ data, loading, onAgentClick, extendedIntelligence }: GeneticValidationTileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'gwas' | 'constraints' | 'mendelian'>(
    'overview'
  );

  const gwasChartData = data.gwasAssociations.map((gwas) => ({
    disease: gwas.disease.length > 15 ? gwas.disease.substring(0, 15) + '...' : gwas.disease,
    fullDisease: gwas.disease,
    score: gwas.score * 100,
    evidenceType: gwas.evidenceType,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#30D158';
    if (score >= 60) return '#FF9F0A';
    return '#FF453A';
  };

  return (
    <Tile
      title="Genetic Validation"
      icon={<Dna className="w-5 h-5" />}
      tileType="genetic"
      loading={loading}
      className="h-[380px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-white/5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
        {(['overview', 'gwas', 'constraints', 'mendelian'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-base font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab
                ? 'text-textPrimary border-b-2 border-primary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab === 'gwas' ? 'GWAS' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden pr-2 pb-2">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-4">
            <p className="text-base leading-relaxed text-textPrimary break-words px-1">{data.validationSummary}</p>

            {/* Metrics: keep values inside cards at narrow widths */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-1">
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">pLI</p>
                <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-textPrimary leading-tight tracking-tight tabular-nums truncate">
                  {data.constraintMetrics.pLI}
                </p>
              </div>
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">LOEUF</p>
                <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-textPrimary leading-tight tracking-tight tabular-nums truncate">
                  {data.constraintMetrics.LOEUF}
                </p>
              </div>
              <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 min-h-[100px] flex flex-col justify-center min-w-0 overflow-hidden">
                <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wide">LoF Observed</p>
                <p className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold text-textPrimary leading-tight tracking-tight tabular-nums truncate">
                  {data.constraintMetrics.lofObserved ?? '—'}
                </p>
              </div>
            </div>

            <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 px-1">
              <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wide">Direction of Effect</p>
              <p className="text-base leading-relaxed text-textPrimary">{data.directionOfEffect}</p>
            </div>
          </div>
        )}

        {/* GWAS Tab */}
        {activeTab === 'gwas' && (
          <div className="space-y-5 pb-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gwasChartData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="disease" type="category" width={120} tick={{ fontSize: 13, fill: '#86868B' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-surfaceElevated border border-white/10 rounded-lg p-3 shadow-xl">
                            <p className="font-medium text-textPrimary">{data.fullDisease}</p>
                            <p className="text-sm text-textSecondary">
                              Score: {data.score.toFixed(1)}%
                            </p>
                            <p className="text-sm text-textTertiary">{data.evidenceType}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {gwasChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 px-1">
              {data.gwasAssociations.map((gwas, idx) => (
                <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-base font-semibold text-textPrimary">{gwas.disease}</p>
                    <span className="text-sm px-3 py-1 bg-primary/20 text-primary rounded font-medium flex-shrink-0 ml-3">
                      {gwas.evidenceType}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary mb-2 font-medium">
                    Score: {(gwas.score * 100).toFixed(1)}%
                  </p>
                  {gwas.keyVariants && gwas.keyVariants.length > 0 && (
                    <p className="text-sm text-textTertiary">
                      Variants: {gwas.keyVariants.join(', ')}
                    </p>
                  )}
                  {gwas.effectSize && (
                    <p className="text-sm text-textTertiary">Effect Size: {gwas.effectSize}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints Tab */}
        {activeTab === 'constraints' && (
          <div className="space-y-6 pb-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-textSecondary mb-2">pLI Score</p>
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35"
                      fill="none"
                      stroke={data.constraintMetrics.pLI > 0.9 ? '#30D158' : '#FF9F0A'}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 35}
                      strokeDashoffset={2 * Math.PI * 35 * (1 - data.constraintMetrics.pLI)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold text-textPrimary">
                      {data.constraintMetrics.pLI.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface/50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-textSecondary mb-2">LOEUF Score</p>
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="35"
                      fill="none"
                      stroke={data.constraintMetrics.LOEUF < 0.35 ? '#30D158' : '#FF9F0A'}
                      strokeWidth="6"
                      strokeDasharray={2 * Math.PI * 35}
                      strokeDashoffset={2 * Math.PI * 35 * data.constraintMetrics.LOEUF}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-semibold text-textPrimary">
                      {data.constraintMetrics.LOEUF.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base text-textSecondary font-medium">LoF Observed:</span>
                <span className="text-base text-textPrimary font-bold">{data.constraintMetrics.lofObserved ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-textSecondary font-medium">LoF Expected:</span>
                <span className="text-base text-textPrimary font-bold">{data.constraintMetrics.lofExpected ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base text-textSecondary font-medium">Homozygous Carriers:</span>
                <span className="text-base text-textPrimary font-bold">
                  {data.constraintMetrics.homozygousCarriers ?? '—'}
                </span>
              </div>
            </div>

            <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
              <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wide">LoF Carrier Phenotypes</p>
              <p className="text-base leading-relaxed text-textPrimary">{data.lofCarrierPhenotypes}</p>
            </div>
          </div>
        )}

        {/* Mendelian Tab */}
        {activeTab === 'mendelian' && (
          <div className="space-y-5 pb-4 px-1">
            <div>
              <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">
                Mendelian Diseases
              </p>
              <div className="flex flex-wrap gap-3">
                {data.mendelianDiseases.map((disease, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-base font-semibold"
                  >
                    {disease}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-base font-bold text-textSecondary mb-4 uppercase tracking-wider">
                Biobank Evidence
              </p>
              <div className="space-y-3">
                {data.biobankEvidence.map((evidence, idx) => (
                  <div key={idx} className="bg-surfaceElevated rounded-lg p-4 border border-white/5">
                    <p className="text-base font-semibold text-textPrimary mb-2">{evidence.source}</p>
                    <p className="text-base leading-relaxed text-textPrimary">{evidence.finding}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Tile>
  );
}
