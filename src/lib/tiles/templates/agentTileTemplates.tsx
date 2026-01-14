/**
 * Agent Tile Templates
 * Templates for rendering agent analysis data in tiles
 */

import { CheckCircle2, AlertTriangle, TrendingUp, DollarSign, FileText, Scale, Clock, BarChart3 } from 'lucide-react';
import type { TileData, TileTemplate } from '../types';
import { AgentWalkthrough } from '../../../components/shared/AgentWalkthrough';

// Target Biology Template
export function TargetBiologySummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Genetic evidence</p>
          <p className={`text-lg font-semibold ${
            summary.geneticScore?.includes('GOLD') || summary.geneticScore?.includes('STRONG') 
              ? 'text-emerald-600' 
              : summary.geneticScore?.includes('MODERATE')
              ? 'text-yellow-600'
              : 'text-gray-900'
          }`}>
            {summary.geneticScore || 'Not assessed'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Druggability</p>
          <p className={`text-lg font-semibold ${
            summary.druggability?.includes('HIGH') 
              ? 'text-emerald-600' 
              : summary.druggability?.includes('MODERATE')
              ? 'text-yellow-600'
              : 'text-gray-900'
          }`}>
            {summary.druggability || 'Not assessed'}
          </p>
        </div>
      </div>
      {summary.target && summary.target !== 'Unknown' && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Target</p>
          <p className="text-sm font-medium text-gray-900">{summary.target}</p>
        </div>
      )}
      {summary.prevalence && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Prevalence</p>
          <p className="text-sm font-medium text-gray-900">{summary.prevalence}</p>
        </div>
      )}
      {summary.safety && summary.safety !== 'Not assessed' && (
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-1 rounded ${
            summary.safety?.includes('TOLERATED') || summary.safety?.includes('LOW') 
              ? 'bg-green-100 text-green-800' 
              : summary.safety?.includes('MODERATE')
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {summary.safety}
          </span>
        </div>
      )}
      {summary.verifiedHighlights && summary.verifiedHighlights.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Verified highlights</p>
          <ul className="space-y-1">
            {summary.verifiedHighlights.slice(0, 2).map((h: string, idx: number) => (
              <li key={idx} className="text-xs text-gray-700 line-clamp-2">• {h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function TargetBiologyDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="target_biology" data={data} title="Target Biology Walkthrough" />
    </div>
  );
}

// Clinical Template
export function ClinicalSummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {summary.orr && (
          <div>
            <p className="text-xs text-gray-500 mb-1">ORR</p>
            <p className="text-lg font-semibold text-blue-600">{summary.orr}</p>
          </div>
        )}
        {summary.pfs && (
          <div>
            <p className="text-xs text-gray-500 mb-1">PFS</p>
            <p className="text-lg font-semibold text-blue-600">{summary.pfs}</p>
          </div>
        )}
        {summary.os && !summary.pfs && (
          <div>
            <p className="text-xs text-gray-500 mb-1">OS</p>
            <p className="text-lg font-semibold text-blue-600">{summary.os}</p>
          </div>
        )}
        {summary.dcr && (
          <div>
            <p className="text-xs text-gray-500 mb-1">DCR</p>
            <p className="text-lg font-semibold text-blue-600">{summary.dcr}</p>
          </div>
        )}
      </div>
      {summary.indication && summary.indication !== 'Not specified' && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Indication</p>
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{summary.indication}</p>
        </div>
      )}
      {summary.approvedDrugs && summary.approvedDrugs.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Approved Drugs</p>
          <div className="flex flex-wrap gap-1">
            {summary.approvedDrugs.slice(0, 2).map((drug: string, idx: number) => (
              <span key={idx} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                {drug}
              </span>
            ))}
          </div>
        </div>
      )}
      {summary.phase && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
            {summary.phase.includes('Phase') ? summary.phase : `Phase ${summary.phase}`}
          </span>
        </div>
      )}
      {summary.conviction && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Conviction</p>
          <p className="text-sm font-medium text-gray-900">{summary.conviction}</p>
        </div>
      )}
      {summary.verifiedHighlights && summary.verifiedHighlights.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Verified highlights</p>
          <ul className="space-y-1">
            {summary.verifiedHighlights.slice(0, 2).map((h: string, idx: number) => (
              <li key={idx} className="text-xs text-gray-700 line-clamp-2">• {h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ClinicalDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="clinical" data={data} title="Clinical Walkthrough" />
    </div>
  );
}

// Financial Template
export function FinancialSummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {summary.valuation && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Valuation</p>
            <p className="text-lg font-semibold text-green-600">
              ${summary.valuation}
            </p>
          </div>
        )}
        {summary.cash && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Cash</p>
            <p className="text-lg font-semibold text-green-600">
              ${summary.cash}
            </p>
          </div>
        )}
        {summary.peakSales && !summary.valuation && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Peak Sales</p>
            <p className="text-lg font-semibold text-green-600">
              ${summary.peakSales}
            </p>
          </div>
        )}
        {summary.roi && (
          <div>
            <p className="text-xs text-gray-500 mb-1">ROI</p>
            <p className="text-lg font-semibold text-green-600">{summary.roi}</p>
          </div>
        )}
      </div>
      {summary.runway && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Runway</p>
          <p className="text-sm font-medium text-gray-900">{summary.runway}</p>
        </div>
      )}
      {summary.burn && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Cash Burn</p>
          <p className="text-sm font-medium text-gray-900">${summary.burn}/quarter</p>
        </div>
      )}
      {summary.trodelvyRevenue && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Trodelvy revenue</p>
          <p className="text-sm font-medium text-gray-900">{summary.trodelvyRevenue}</p>
        </div>
      )}
      {summary.keyDeal && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Key deal</p>
          <p className="text-xs text-gray-700 line-clamp-2">{summary.keyDeal}</p>
        </div>
      )}
    </div>
  );
}

export function FinancialDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="financial" data={data} title="Financial Walkthrough" />
    </div>
  );
}

// Regulatory Template
export function RegulatorySummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      {summary.pathway && summary.pathway !== 'Not specified' && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Pathway</p>
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{summary.pathway}</p>
        </div>
      )}
      {summary.timeline && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Timeline</p>
            <p className="text-lg font-semibold text-orange-600">{summary.timeline}</p>
        </div>
      )}
      {summary.investment && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Estimated investment</p>
          <p className="text-sm font-medium text-gray-900">{summary.investment}</p>
        </div>
      )}
      {summary.approvalDate && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Approval Date</p>
          <p className="text-sm font-medium text-gray-900">{summary.approvalDate}</p>
        </div>
      )}
      {summary.expeditedPrograms && summary.expeditedPrograms.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Expedited Programs</p>
          <div className="flex flex-wrap gap-1">
            {summary.expeditedPrograms.map((program: string, idx: number) => (
              <span key={idx} className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                {program}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegulatoryDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="regulatory" data={data} title="Regulatory Walkthrough" />
    </div>
  );
}

// Market Research Template
export function MarketResearchSummaryView({ data }: { data: TileData }) {
  const summary = data.summary as any;
  
  return (
    <div className="space-y-3">
      {(summary.citationsUsedCount || summary.hasReferencesSection) && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200">
            {summary.citationsUsedCount ? `${summary.citationsUsedCount} citations` : 'Citations'}
          </span>
          {summary.hasReferencesSection ? (
            <span className="text-gray-500">refs included</span>
          ) : (
            <span className="text-gray-500">no refs section</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {summary.tam && (
          <div>
            <p className="text-xs text-gray-500 mb-1">TAM</p>
            <p className="text-lg font-semibold text-teal-600">
              ${summary.tam}
            </p>
          </div>
        )}
        {summary.sam && (
          <div>
            <p className="text-xs text-gray-500 mb-1">SAM</p>
            <p className="text-lg font-semibold text-teal-600">
              ${summary.sam}
            </p>
          </div>
        )}
        {summary.peakSales && !summary.tam && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Peak Sales</p>
            <p className="text-lg font-semibold text-teal-600">
              ${summary.peakSales}
            </p>
          </div>
        )}
        {summary.marketShare && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Market Share</p>
            <p className="text-lg font-semibold text-teal-600">{summary.marketShare}</p>
          </div>
        )}
      </div>
      {summary.growth && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Growth Rate</p>
          <p className="text-sm font-medium text-gray-900">{summary.growth}</p>
        </div>
      )}
      {summary.competitorCount && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-teal-100 text-teal-800">
            {summary.competitorCount} competitors
          </span>
        </div>
      )}
      {summary.tumorTypes && summary.tumorTypes.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Key tumor types</p>
          <p className="text-xs text-gray-700 line-clamp-2">{summary.tumorTypes.join(', ')}</p>
        </div>
      )}
      {summary.verifiedHighlights && summary.verifiedHighlights.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Verified highlights</p>
          <ul className="space-y-1">
            {summary.verifiedHighlights.slice(0, 2).map((h: string, idx: number) => (
              <li key={idx} className="text-xs text-gray-700 line-clamp-2">• {h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MarketResearchDetailedView({ data }: { data: TileData }) {
  return (
    <div className="p-4">
      <AgentWalkthrough agent="market_research" data={data} title="Market Research Walkthrough" />
    </div>
  );
}

// Export template definitions
export const targetBiologyTileTemplate: TileTemplate = {
  type: 'target_biology',
  agent: 'target_biology',
  name: 'Target Biology Analysis',
  description: 'Genetic validation and druggability assessment',
  defaultSize: 'large',
  icon: '🧬',
  color: 'emerald',
  renderSummary: (data) => <TargetBiologySummaryView data={data} />,
  renderDetailed: (data) => <TargetBiologyDetailedView data={data} />,
};

export const clinicalTileTemplate: TileTemplate = {
  type: 'clinical',
  agent: 'clinical',
  name: 'Clinical Analysis',
  description: 'Clinical trial data and efficacy assessment',
  defaultSize: 'large',
  icon: '👩‍⚕️',
  color: 'blue',
  renderSummary: (data) => <ClinicalSummaryView data={data} />,
  renderDetailed: (data) => <ClinicalDetailedView data={data} />,
};

export const financialTileTemplate: TileTemplate = {
  type: 'financial',
  agent: 'financial',
  name: 'Financial Analysis',
  description: 'Valuation and financial position',
  defaultSize: 'medium',
  icon: '💰',
  color: 'green',
  renderSummary: (data) => <FinancialSummaryView data={data} />,
  renderDetailed: (data) => <FinancialDetailedView data={data} />,
};

export const regulatoryTileTemplate: TileTemplate = {
  type: 'regulatory',
  agent: 'regulatory',
  name: 'Regulatory Analysis',
  description: 'FDA pathway and approval timeline',
  defaultSize: 'medium',
  icon: '📋',
  color: 'orange',
  renderSummary: (data) => <RegulatorySummaryView data={data} />,
  renderDetailed: (data) => <RegulatoryDetailedView data={data} />,
};

export const marketResearchTileTemplate: TileTemplate = {
  type: 'market_research',
  agent: 'market_research',
  name: 'Market Research',
  description: 'Market opportunity and competitive landscape',
  defaultSize: 'large',
  icon: '📊',
  color: 'teal',
  renderSummary: (data) => <MarketResearchSummaryView data={data} />,
  renderDetailed: (data) => <MarketResearchDetailedView data={data} />,
};

