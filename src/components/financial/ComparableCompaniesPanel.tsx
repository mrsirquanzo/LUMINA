/**
 * Comparable Companies Detail Panel
 * Trading multiples analysis with filtering
 */

import { useState } from 'react';
import {
  Building2,
  ChevronLeft,
  Calculator,
  Filter,
  Search,
} from 'lucide-react';

interface ComparableCompaniesPanelProps {
  onBack: () => void;
  onApply?: (comps: any[]) => void;
}

const COMPARABLES = [
  {
    ticker: 'MRNA',
    name: 'Moderna',
    stage: 'Commercial',
    modality: 'mRNA',
    marketCap: '$24.8B',
    ev: '$16.2B',
    cash: '$8.6B',
    evSales: '2.1x',
    evPeak: '0.8x',
  },
  {
    ticker: 'BNTX',
    name: 'BioNTech',
    stage: 'Commercial',
    modality: 'mRNA',
    marketCap: '$22.1B',
    ev: '$14.5B',
    cash: '$7.6B',
    evSales: '1.9x',
    evPeak: '0.7x',
  },
  {
    ticker: 'ALNY',
    name: 'Alnylam',
    stage: 'Commercial',
    modality: 'RNAi',
    marketCap: '$25.2B',
    ev: '$23.8B',
    cash: '$1.4B',
    evSales: '11.2x',
    evPeak: '2.1x',
  },
  {
    ticker: 'BLUE',
    name: 'Bluebird Bio',
    stage: 'Commercial',
    modality: 'Gene Therapy',
    marketCap: '$180M',
    ev: '$320M',
    cash: '$95M',
    evSales: '3.2x',
    evPeak: '0.2x',
  },
];

export default function ComparableCompaniesPanel({
  onBack,
  onApply,
}: ComparableCompaniesPanelProps) {
  const [filters, setFilters] = useState({
    stage: 'all',
    modality: 'all',
    indication: 'all',
  });
  const [selectedComps, setSelectedComps] = useState<string[]>([]);

  const toggleComp = (ticker: string) => {
    setSelectedComps((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker]
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Financial Analyst
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Building2 size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-textPrimary">Comparable Companies</h3>
            <p className="text-xs text-textSecondary">Trading multiples analysis</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border bg-surfaceElevated">
        <div className="flex gap-2">
          <select
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
            className="flex-1 p-2 bg-surface border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="all">All Stages</option>
            <option value="preclinical">Preclinical</option>
            <option value="phase1">Phase 1</option>
            <option value="phase2">Phase 2</option>
            <option value="phase3">Phase 3</option>
            <option value="commercial">Commercial</option>
          </select>
          <select
            value={filters.modality}
            onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
            className="flex-1 p-2 bg-surface border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500/50"
          >
            <option value="all">All Modalities</option>
            <option value="small_molecule">Small Molecule</option>
            <option value="antibody">Antibody</option>
            <option value="cell_therapy">Cell Therapy</option>
            <option value="gene_therapy">Gene Therapy</option>
            <option value="mrna">mRNA</option>
          </select>
        </div>
      </div>

      {/* Comparables List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {COMPARABLES.map((comp, i) => (
          <div
            key={i}
            onClick={() => toggleComp(comp.ticker)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedComps.includes(comp.ticker)
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-border hover:border-border bg-surfaceElevated'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-textPrimary">{comp.ticker}</span>
                  <span className="px-2 py-0.5 bg-white/10 text-textSecondary text-xs rounded-full">
                    {comp.modality}
                  </span>
                </div>
                <span className="text-xs text-textSecondary">{comp.name}</span>
              </div>
              <span className="text-sm font-semibold text-textPrimary">{comp.marketCap}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-textSecondary">EV</p>
                <p className="text-sm font-medium text-textPrimary">{comp.ev}</p>
              </div>
              <div>
                <p className="text-xs text-textSecondary">EV/Sales</p>
                <p className="text-sm font-medium text-green-400">{comp.evSales}</p>
              </div>
              <div>
                <p className="text-xs text-textSecondary">EV/Peak</p>
                <p className="text-sm font-medium text-green-400">{comp.evPeak}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-t border-border bg-surfaceElevated">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-xs text-textSecondary">Median EV/Sales</p>
            <p className="text-lg font-bold text-green-400">2.5x</p>
          </div>
          <div>
            <p className="text-xs text-textSecondary">Median EV/Peak</p>
            <p className="text-lg font-bold text-green-400">0.8x</p>
          </div>
          <div>
            <p className="text-xs text-textSecondary">Comp Count</p>
            <p className="text-lg font-bold text-textPrimary">{COMPARABLES.length}</p>
          </div>
        </div>
        <button
          onClick={() => onApply?.(COMPARABLES.filter((c) => selectedComps.includes(c.ticker)))}
          className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
        >
          <Calculator size={16} />
          Apply to Valuation
        </button>
      </div>
    </div>
  );
}
