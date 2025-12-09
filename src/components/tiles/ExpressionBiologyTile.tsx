import { useState, useMemo } from 'react';
import Tile from '../Tile';
import { Activity, CheckCircle2, AlertTriangle, Target, Download, Search, X } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from 'recharts';
import type { ExpressionTissue, TumorExpression, TherapeuticWindow } from '../../types';

interface ExpressionBiologyTileProps {
  data: {
    therapeuticWindowScore: TherapeuticWindow;
    bestIndication: { name: string; foldChange: number; rank: number };
    adcSuitability: {
      score: string;
      antigenDensity: string;
      internalizationRate: string;
      recyclingVsDegradation: string;
    };
    gtexNormalTissues: ExpressionTissue[];
    tcgaTumorExpression: TumorExpression[];
    foldChangeData: Array<{
      indication: string;
      tumorTPM: number;
      normalTPM: number;
      foldChange: number;
    }>;
    genomicAlterations: {
      amplificationFrequency: Record<string, number>;
      mutationFrequency: Record<string, number>;
      hotspotMutations: string[];
      fusionEvents: string[];
      copyNumberGain: Record<string, number>;
    };
  };
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label, dataType }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surfaceElevated border border-white/10 p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
        <p className="font-bold text-textPrimary mb-1">{label}</p>
        {dataType === 'tpm' && (
          <p className="text-primary font-medium">{payload[0].value.toLocaleString()} TPM</p>
        )}
        {dataType === 'foldChange' && (
          <>
            <p className="text-primary font-medium">{payload[0].value.toFixed(2)}x fold-change</p>
            {payload[0].payload.tumorTPM && (
              <p className="text-textSecondary text-xs mt-1">
                Tumor: {payload[0].payload.tumorTPM} TPM | Normal: {payload[0].payload.normalTPM} TPM
              </p>
            )}
          </>
        )}
        {payload[0].payload.sampleCount && (
          <p className="text-textSecondary text-sm mt-1 font-medium">
            Samples: {payload[0].payload.sampleCount}
          </p>
        )}
        {payload[0].payload.category && (
          <p className="text-textSecondary text-sm mt-1 font-medium">
            Category: {payload[0].payload.category}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom cursor for vertical bar charts (horizontal bars) - highlights only the bar's width
const BarOnlyCursor = (props: any) => {
  const { width, height, payload, activeCoordinate } = props;
  
  if (!payload || !payload.length || !activeCoordinate) return null;
  
  // Get the bar's value
  const barValue = payload[0]?.value ?? 0;
  if (!barValue || barValue <= 0) return null;
  
  // For vertical bar charts, calculate bar's y position and height
  const barCenterY = activeCoordinate.y;
  const visibleBars = 15;
  const barSpacing = height / visibleBars;
  const barHeight = Math.max(barSpacing * 0.7, 25);
  
  // Calculate where the bar ends based on its value
  // We need to use the coordinate system - the x position tells us where the cursor is (bar end)
  const barEndX = activeCoordinate.x;
  
  // Bars start after the y-axis margin (120px based on YAxis width)
  const barStartX = 0;
  
  // Only render if valid
  if (!barEndX || barEndX <= barStartX) return null;
  
  return (
    <g>
      {/* Highlight rectangle that only spans the bar's width */}
      <rect
        x={barStartX}
        y={barCenterY - barHeight / 2}
        width={Math.min(barEndX - barStartX, width || 400)}
        height={barHeight}
        fill="#FFD60A"
        fillOpacity={0.1}
        stroke="#FFD60A"
        strokeWidth={2}
        strokeDasharray="4 4"
        rx={2}
      />
      {/* Vertical line at the end of the bar */}
      <line
        x1={Math.min(barEndX, width || 400)}
        x2={Math.min(barEndX, width || 400)}
        y1={barCenterY - barHeight / 2}
        y2={barCenterY + barHeight / 2}
        stroke="#FFD60A"
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={0.8}
      />
    </g>
  );
};

// Custom cursor for horizontal bar charts (vertical bars) - highlights only the bar's height
const VerticalBarOnlyCursor = (props: any) => {
  const { width, height, payload, activeCoordinate } = props;
  
  if (!payload || !payload.length || !activeCoordinate) return null;
  
  // For horizontal bar charts, calculate bar's x position and width
  const barCenterX = activeCoordinate.x;
  const visibleBars = 10;
  const barSpacing = width / visibleBars;
  const barWidth = Math.max(barSpacing * 0.7, 20);
  
  // Calculate where the bar ends (top) based on its value
  const barEndY = activeCoordinate.y;
  
  // Bars start at the bottom of the chart
  const barStartY = height || 300;
  
  return (
    <g>
      {/* Highlight rectangle that only spans the bar's height */}
      <rect
        x={barCenterX - barWidth / 2}
        y={barEndY}
        width={barWidth}
        height={Math.max(barStartY - barEndY, 0)}
        fill="#FFD60A"
        fillOpacity={0.1}
        stroke="#FFD60A"
        strokeWidth={2}
        strokeDasharray="4 4"
        rx={2}
      />
      {/* Horizontal line at the top of the bar */}
      <line
        x1={barCenterX - barWidth / 2}
        x2={barCenterX + barWidth / 2}
        y1={barEndY}
        y2={barEndY}
        stroke="#FFD60A"
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={0.8}
      />
    </g>
  );
};


export default function ExpressionBiologyTile({ data, loading }: ExpressionBiologyTileProps) {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'normal' | 'tumor' | 'comparison' | 'genomic'
  >('summary');
  const [tissueSearch, setTissueSearch] = useState('');
  const [tissueCategory, setTissueCategory] = useState<'all' | 'safety' | 'system'>('all');
  const [showDotPlot, setShowDotPlot] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // Filter GTEx tissues
  const filteredNormalTissues = useMemo(() => {
    let filtered = [...data.gtexNormalTissues];

    // Search filter
    if (tissueSearch) {
      filtered = filtered.filter((tissue) =>
        tissue.name.toLowerCase().includes(tissueSearch.toLowerCase())
      );
    }

    // Category filter
    if (tissueCategory === 'safety') {
      filtered = filtered.filter((tissue) => tissue.isSafetyOrgan);
    }

    // Sort by TPM descending
    return filtered.sort((a, b) => b.tpm - a.tpm);
  }, [data.gtexNormalTissues, tissueSearch, tissueCategory]);

  // Get safety organs
  const safetyOrgans = useMemo(() => {
    return data.gtexNormalTissues.filter((t) => t.isSafetyOrgan && t.tpm > 50);
  }, [data.gtexNormalTissues]);

  // Prepare chart data
  const normalChartData = useMemo(() => {
    return filteredNormalTissues.map((tissue) => ({
      name: tissue.name.length > 20 ? tissue.name.substring(0, 20) + '...' : tissue.name,
      fullName: tissue.name,
      tpm: tissue.tpm,
      category: tissue.category,
      isSafetyOrgan: tissue.isSafetyOrgan,
    }));
  }, [filteredNormalTissues]);

  const tumorChartData = useMemo(() => {
    return [...data.tcgaTumorExpression]
      .sort((a, b) => b.medianTPM - a.medianTPM)
      .map((tumor) => ({
        name: tumor.tumorType.length > 25 ? tumor.tumorType.substring(0, 25) + '...' : tumor.tumorType,
        fullName: tumor.tumorType,
        medianTPM: tumor.medianTPM,
        percentileRank: tumor.percentileRank,
        sampleCount: tumor.sampleCount,
      }));
  }, [data.tcgaTumorExpression]);

  const foldChangeChartData = useMemo(() => {
    return [...data.foldChangeData].sort((a, b) => b.foldChange - a.foldChange).map((item) => ({
      indication: item.indication,
      foldChange: item.foldChange,
      tumorTPM: item.tumorTPM,
      normalTPM: item.normalTPM,
    }));
  }, [data.foldChangeData]);

  const getBarColor = (tissue: any) => {
    if (tissue.isSafetyOrgan && tissue.tpm > 100) return '#FF453A';
    if (tissue.isSafetyOrgan) return '#FF9F0A';
    return '#636366';
  };

  const getTumorBarColor = (percentile: number) => {
    if (percentile >= 90) return '#30D158';
    if (percentile >= 75) return '#0A84FF';
    if (percentile >= 50) return '#FF9F0A';
    return '#636366';
  };

  const getFoldChangeColor = (foldChange: number) => {
    if (foldChange >= 5) return '#30D158';
    if (foldChange >= 2) return '#0A84FF';
    if (foldChange >= 1) return '#FF9F0A';
    return '#FF453A';
  };

  const getWindowScoreValue = (window: TherapeuticWindow) => {
    switch (window) {
      case 'Favorable':
        return 85;
      case 'Moderate':
        return 65;
      case 'Narrow':
        return 45;
      case 'Unfavorable':
        return 25;
    }
  };

  const handleExportCSV = (type: 'normal' | 'tumor' | 'comparison') => {
    let csv = '';
    let headers = [];
    let rows: any[] = [];

    if (type === 'normal') {
      headers = ['Tissue', 'TPM', 'Category', 'Safety Organ'];
      rows = filteredNormalTissues.map((t) => [
        t.name,
        t.tpm,
        t.category,
        t.isSafetyOrgan ? 'Yes' : 'No',
      ]);
    } else if (type === 'tumor') {
      headers = ['Tumor Type', 'TCGA Code', 'Median TPM', 'Percentile Rank', 'Sample Count'];
      rows = data.tcgaTumorExpression.map((t) => [
        t.tumorType,
        t.tcgaCode,
        t.medianTPM,
        t.percentileRank,
        t.sampleCount,
      ]);
    } else {
      headers = ['Indication', 'Tumor TPM', 'Normal TPM', 'Fold-Change'];
      rows = data.foldChangeData.map((f) => [f.indication, f.tumorTPM, f.normalTPM, f.foldChange]);
    }

    csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expression-data-${type}.csv`;
    link.click();
  };

  return (
    <Tile
      title="Expression Biology"
      icon={<Activity className="w-5 h-5" />}
      tileType="expression"
      loading={loading}
      className="h-[450px]"
    >
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-white/5 overflow-x-auto custom-scrollbar">
        {(['summary', 'normal', 'tumor', 'comparison', 'genomic'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-base font-semibold transition-colors capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'text-textPrimary border-b-2 border-primary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {tab === 'normal' ? 'Normal (GTEx)' : tab === 'tumor' ? 'Tumor (TCGA)' : tab}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden px-1 pb-2">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
            {/* Card 1: Therapeutic Window */}
            <div className="bg-surface/50 rounded-lg p-5 min-h-[180px] flex flex-col">
              <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wider">
                Therapeutic Window
              </p>
              <div className="relative h-4 bg-gradient-to-r from-danger via-warning to-success rounded-full mb-2">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-surface shadow-lg transition-all duration-500"
                  style={{
                    left: `${getWindowScoreValue(data.therapeuticWindowScore)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-textPrimary">
                  {data.therapeuticWindowScore}
                </span>
                <span className="text-sm text-textSecondary font-medium">Confidence: High</span>
              </div>
            </div>

            {/* Card 2: Best Indication */}
            <div className="bg-surface/50 rounded-lg p-5 min-h-[180px] flex flex-col">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-textSecondary mb-2 uppercase tracking-wider">
                    Best Indication
                  </p>
                  <p className="text-base font-semibold text-textPrimary mb-2">
                    {data.bestIndication.name}
                  </p>
                  <p className="text-lg font-bold text-success mb-2">
                    {data.bestIndication.foldChange}x
                  </p>
                  <p className="text-base text-textPrimary font-medium">over normal tissue</p>
                </div>
              </div>
            </div>

            {/* Card 3: ADC Suitability */}
            <div className="bg-surface/50 rounded-lg p-5 min-h-[180px] flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wider">
                    ADC Suitability
                  </p>
                  <span className="inline-block px-3 py-1.5 text-base font-semibold bg-success/20 text-success rounded mb-4">
                    {data.adcSuitability.score}
                  </span>
                  <div className="space-y-2.5 text-base text-textPrimary leading-relaxed">
                    <p className="font-medium">Antigen: <span className="font-normal">{data.adcSuitability.antigenDensity}</span></p>
                    <p className="font-medium">Internalization: <span className="font-normal">{data.adcSuitability.internalizationRate}</span></p>
                    <p className="font-medium">Trafficking: <span className="font-normal">{data.adcSuitability.recyclingVsDegradation}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Safety Alerts */}
            <div className="bg-surface/50 rounded-lg p-5 min-h-[180px] flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-textSecondary mb-3 uppercase tracking-wider">
                    Safety Alerts
                  </p>
                  <div className="space-y-2.5 mb-4">
                    {safetyOrgans.slice(0, 3).map((organ, idx) => (
                      <div key={idx} className="flex items-center justify-between text-base">
                        <span className="text-textPrimary font-medium">{organ.name}</span>
                        <span className="text-warning font-semibold">{organ.tpm} TPM</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('normal')}
                    className="text-base text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NORMAL TISSUE (GTEx) */}
        {activeTab === 'normal' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textTertiary" />
                <input
                  type="text"
                  value={tissueSearch}
                  onChange={(e) => setTissueSearch(e.target.value)}
                  placeholder="Search tissues..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-lg text-base text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {tissueSearch && (
                  <button
                    onClick={() => setTissueSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-1">
                {(['all', 'safety', 'system'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTissueCategory(cat)}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors capitalize ${
                      tissueCategory === cat
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface text-textSecondary hover:text-textPrimary'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'safety' ? 'Safety Organs' : 'By System'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={normalChartData.slice(0, 15)} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 20 }}>
                  <XAxis type="number" domain={[0, 'dataMax']} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 13, fill: '#86868B' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip dataType="tpm" />}
                    cursor={<BarOnlyCursor />}
                  />
                  <ReferenceLine x={100} stroke="#FF9F0A" strokeDasharray="3 3" />
                  <Bar dataKey="tpm" radius={[0, 4, 4, 0]}>
                    {normalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-4 mb-4">
              <p className="text-sm font-medium text-textSecondary">Safety threshold: 100 TPM</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTable(!showTable)}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {showTable ? 'Hide' : 'Show'} Table
                </button>
                <button
                  onClick={() => handleExportCSV('normal')}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-textPrimary"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Data Table */}
            {showTable && (
              <div className="bg-surfaceElevated rounded-lg overflow-hidden border border-white/5 mb-4">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-base">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Tissue</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">TPM</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Category</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Safety</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNormalTissues.map((tissue, idx) => (
                        <tr key={idx} className="border-t border-white/5">
                          <td className="px-4 py-3 text-textPrimary font-medium align-middle text-base">{tissue.name}</td>
                          <td className="px-4 py-3 text-textPrimary font-semibold align-middle text-base">{tissue.tpm}</td>
                          <td className="px-4 py-3 text-textPrimary capitalize align-middle text-base font-medium">{tissue.category}</td>
                          <td className="px-4 py-3 align-middle">
                            {tissue.isSafetyOrgan ? (
                              <span className="text-danger text-base font-semibold">⚠ Safety Organ</span>
                            ) : (
                              <span className="text-textSecondary text-base">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TUMOR EXPRESSION (TCGA) */}
        {activeTab === 'tumor' && (
          <div className="space-y-5 pb-4">
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tumorChartData.slice(0, 15)} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 20 }}>
                  <XAxis type="number" domain={[0, 'dataMax']} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 13, fill: '#86868B' }}
                  />
                  <Tooltip 
                    content={<CustomTooltip dataType="tpm" />}
                    cursor={<BarOnlyCursor />}
                  />
                  <Bar dataKey="medianTPM" radius={[0, 4, 4, 0]}>
                    {tumorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getTumorBarColor(entry.percentileRank)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between mt-4 mb-4">
              <p className="text-sm font-medium text-textSecondary">
                {tumorChartData.filter((t) => t.percentileRank >= 75).length} high expressors ({'>'}75th
                percentile)
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTable(!showTable)}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {showTable ? 'Hide' : 'Show'} Table
                </button>
                <button
                  onClick={() => handleExportCSV('tumor')}
                  className="flex items-center gap-1.5 text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Compare to Normal →
                </button>
              </div>
            </div>

            {showTable && (
              <div className="bg-surfaceElevated rounded-lg overflow-hidden border border-white/5 mb-4">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-base">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Tumor Type</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Code</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Median TPM</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Percentile</th>
                        <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tcgaTumorExpression.map((tumor, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-white/5 ${
                            tumor.percentileRank >= 75 ? 'bg-success/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-textSecondary font-medium">{tumor.tumorType}</td>
                          <td className="px-4 py-3 text-textTertiary font-mono">{tumor.tcgaCode}</td>
                          <td className="px-4 py-3 text-textPrimary font-semibold">
                            {tumor.medianTPM.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-semibold ${
                                tumor.percentileRank >= 75
                                  ? 'text-success'
                                  : tumor.percentileRank >= 50
                                    ? 'text-info'
                                    : 'text-textTertiary'
                              }`}
                            >
                              {tumor.percentileRank}th
                            </span>
                          </td>
                          <td className="px-4 py-3 text-textSecondary font-medium">{tumor.sampleCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TUMOR VS NORMAL */}
        {activeTab === 'comparison' && (
          <div className="space-y-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-textPrimary">Fold-Change Analysis</h4>
              <button
                onClick={() => setShowDotPlot(!showDotPlot)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showDotPlot ? 'Show Waterfall' : 'Show Dot Plot'}
              </button>
            </div>

            {!showDotPlot ? (
              // Waterfall Chart
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={foldChangeChartData} margin={{ top: 20, right: 40, left: 50, bottom: 80 }}>
                    <XAxis
                      dataKey="indication"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12, fill: '#86868B' }}
                      interval={0}
                    />
                    <YAxis
                      label={{ value: 'Fold-Change', angle: -90, position: 'insideLeft', fill: '#86868B', fontSize: 12 }}
                      tick={{ fontSize: 12, fill: '#86868B' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip dataType="foldChange" />}
                      cursor={<VerticalBarOnlyCursor />}
                    />
                    <ReferenceLine y={1} stroke="#636366" strokeDasharray="3 3" />
                    <Bar dataKey="foldChange" radius={[4, 4, 0, 0]}>
                      {foldChangeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getFoldChangeColor(entry.foldChange)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              // Dot Plot
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 40, left: 50, bottom: 80 }}>
                    <XAxis
                      type="number"
                      dataKey="normalTPM"
                      name="Normal TPM"
                      label={{ value: 'Normal TPM', position: 'insideBottom', offset: -5, fill: '#86868B', fontSize: 12 }}
                      tick={{ fontSize: 12, fill: '#86868B' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="tumorTPM"
                      name="Tumor TPM"
                      label={{ value: 'Tumor TPM', angle: -90, position: 'insideLeft', fill: '#86868B' }}
                      tick={{ fontSize: 11, fill: '#86868B' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip dataType="foldChange" />}
                      cursor={false}
                    />
                    <ReferenceLine yAxisId={0} stroke="#636366" strokeDasharray="3 3" />
                    <Scatter dataKey="tumorTPM" fill="#0A84FF">
                      {foldChangeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getFoldChangeColor(entry.foldChange)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-surfaceElevated rounded-lg overflow-hidden border border-white/5 mb-4">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-base">
                  <thead className="bg-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Indication</th>
                      <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Tumor (TPM)</th>
                      <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Normal (TPM)</th>
                      <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Fold-Change</th>
                      <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.foldChangeData.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`border-t border-white/5 ${
                          item.foldChange >= 5 ? 'bg-success/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-textSecondary font-medium">{item.indication}</td>
                        <td className="px-4 py-3 text-textPrimary font-semibold">
                          {item.tumorTPM.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-textSecondary font-medium">{item.normalTPM.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-base font-bold ${
                              item.foldChange >= 5
                                ? 'text-success'
                                : item.foldChange >= 2
                                  ? 'text-info'
                                  : 'text-textPrimary'
                            }`}
                          >
                            {item.foldChange.toFixed(1)}x
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.foldChange >= 5 ? (
                            <span className="text-sm font-semibold text-success">Favorable</span>
                          ) : item.foldChange >= 2 ? (
                            <span className="text-xs text-info">Moderate</span>
                          ) : (
                            <span className="text-xs text-textTertiary">Narrow</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => handleExportCSV('comparison')}
              className="flex items-center gap-1 text-xs text-textSecondary hover:text-textPrimary"
            >
              <Download className="w-3 h-3" />
              Export Comparison Data
            </button>
          </div>
        )}

        {/* TAB 5: GENOMIC ALTERATIONS */}
        {activeTab === 'genomic' && (
          <div className="space-y-6 pb-4">
            {/* Mutation Frequency */}
            <div>
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Mutation Frequency</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(data.genomicAlterations.mutationFrequency).map(([key, value]) => ({
                      tumorType: key,
                      frequency: value,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis
                      dataKey="tumorType"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10, fill: '#86868B' }}
                    />
                    <YAxis
                      label={{ value: 'Mutation %', angle: -90, position: 'insideLeft', fill: '#86868B' }}
                      tick={{ fontSize: 11, fill: '#86868B' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip dataType="tpm" />}
                      cursor={<VerticalBarOnlyCursor />}
                    />
                    <Bar dataKey="frequency" fill="#0A84FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Copy Number Alterations */}
            <div>
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Copy Number Alterations</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(data.genomicAlterations.copyNumberGain).map(([key, value]) => ({
                      tumorType: key,
                      amplification: value,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis
                      dataKey="tumorType"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10, fill: '#86868B' }}
                    />
                    <YAxis
                      label={{
                        value: 'Amplification %',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#86868B',
                      }}
                      tick={{ fontSize: 11, fill: '#86868B' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip dataType="tpm" />}
                      cursor={<VerticalBarOnlyCursor />}
                    />
                    <Bar dataKey="amplification" fill="#FF9F0A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hotspot Mutations */}
            <div className="mb-6">
              <h4 className="text-base font-bold text-textPrimary mb-4">Hotspot Mutations</h4>
              {data.genomicAlterations.hotspotMutations.length > 0 ? (
                <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
                  <ul className="space-y-3">
                    {data.genomicAlterations.hotspotMutations.map((mutation, idx) => (
                      <li key={idx} className="text-base leading-relaxed text-textSecondary flex items-baseline gap-2">
                        <span className="text-primary font-bold flex-shrink-0">•</span>
                        <span>{mutation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
                  <p className="text-base text-textTertiary italic">None significant</p>
                </div>
              )}
            </div>

            {/* Fusion Events */}
            <div className="mb-6 pb-4">
              <h4 className="text-base font-bold text-textPrimary mb-4">Fusion Events</h4>
              {data.genomicAlterations.fusionEvents.length > 0 ? (
                <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
                  <ul className="space-y-3">
                    {data.genomicAlterations.fusionEvents.map((fusion, idx) => (
                      <li key={idx} className="text-base leading-relaxed text-textSecondary flex items-baseline gap-2">
                        <span className="text-primary font-bold flex-shrink-0">•</span>
                        <span>{fusion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
                  <p className="text-base text-textTertiary italic">None reported</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Tile>
  );
}
