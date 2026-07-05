import Tile from '../Tile';
import { TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MarketOpportunityTileProps {
  data: {
    tam: { value: number; unit: string; year: number; cagr: number };
    segments: Array<{
      name: string;
      size: number;
      share: number;
      color: string;
      patients?: string;
    }>;
    competitiveDynamics: string;
    pricingConsiderations: string;
    marketRisks: string[];
    upsideScenarios: string[];
    agents?: readonly ('sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research')[];
    primaryAgent?: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research';
  };
  loading?: boolean;
  extendedIntelligence?: React.ReactNode;
  onAgentClick?: (agent: 'sonny' | 'target_biology' | 'clinical' | 'patent' | 'financial' | 'regulatory' | 'market_research', tileTitle: string, tileData?: any) => void;
}

export default function MarketOpportunityTile({ data, loading, onAgentClick, extendedIntelligence }: MarketOpportunityTileProps) {
  const pieData = data.segments.map((seg) => ({
    name: seg.name,
    value: seg.size,
    share: seg.share,
    color: seg.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surfaceElevated border border-border p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-textPrimary mb-1">{data.name}</p>
          <p className="text-primary">${data.value}{'B'}</p>
          <p className="text-textSecondary mt-1">{data.share}% of market</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Tile
      title="Market Opportunity"
      icon={<TrendingUp className="w-5 h-5" />}
      tileType="market"
      loading={loading}
      className="h-[320px]"
      agents={data.agents}
      primaryAgent={data.primaryAgent}
      onAgentClick={onAgentClick}
      extendedIntelligence={extendedIntelligence}
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        {/* TAM Card */}
        <div className="bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30 rounded-lg p-6 backdrop-blur-sm">
          <div>
            <p className="text-base font-bold text-textSecondary mb-2 uppercase tracking-wider">
              2030 Total Addressable Market
            </p>
            <p className="text-4xl font-bold text-textPrimary mb-2">
              ${data.tam.value}{data.tam.unit}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm px-3 py-1.5 bg-success/20 text-success rounded font-semibold backdrop-blur-sm">
                +{data.tam.cagr}% CAGR
              </span>
              <span className="text-sm text-textSecondary font-medium">Global Forecast</span>
            </div>
          </div>
        </div>

        {/* Pie Chart - Apple-like design with glassmorphism */}
        <div className="h-56 mb-2 bg-surfaceElevated/30 backdrop-blur-sm rounded-xl border border-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth={2}
                label={(entry: any) => {
                  const data = entry as { name: string; share: number };
                  return `${data.name}: ${data.share}%`;
                }}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Segments List */}
        <div className="space-y-3">
          {data.segments.map((segment, idx) => (
            <div key={idx} className="flex items-center justify-between bg-surfaceElevated rounded-lg p-4 border border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-base font-semibold text-textPrimary">{segment.name}</span>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-textPrimary">${segment.size}{data.tam.unit}</p>
                <p className="text-sm text-textSecondary font-semibold">{segment.share}% share</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-border">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">Competitive Dynamics</p>
          <p className="text-base leading-relaxed text-textPrimary">{data.competitiveDynamics}</p>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <p className="text-sm font-bold text-warning mb-3 flex items-center gap-2">Market Risks</p>
          <ul className="space-y-2 text-sm leading-relaxed text-textSecondary">
            {data.marketRisks.slice(0, 2).map((risk, idx) => (
              <li key={idx} className="flex items-baseline gap-2">
                <span className="text-warning font-bold flex-shrink-0">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-success/10 border border-success/30 rounded-lg p-4">
          <p className="text-sm font-bold text-success mb-3 flex items-center gap-2">Upside Scenarios</p>
          <ul className="space-y-2 text-sm leading-relaxed text-textSecondary">
            {data.upsideScenarios.slice(0, 2).map((scenario, idx) => (
              <li key={idx} className="flex items-baseline gap-2">
                <span className="text-success font-bold flex-shrink-0">•</span>
                <span>{scenario}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Tile>
  );
}
