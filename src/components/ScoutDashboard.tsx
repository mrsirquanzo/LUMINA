import BDExecutiveSummaryTile from './tiles/BDExecutiveSummaryTile';
import ScientificValidationTile from './tiles/ScientificValidationTile';
import CompetitiveLandscapeTile from './tiles/CompetitiveLandscapeTile';
import ClinicalPositioningTile from './tiles/ClinicalPositioningTile';
import IPFreedomToOperateTile from './tiles/IPFreedomToOperateTile';
import MarketOpportunityTile from './tiles/MarketOpportunityTile';
import DealLandscapeTile from './tiles/DealLandscapeTile';
import StrategicRecommendationTile from './tiles/StrategicRecommendationTile';
import DynamicTile from './DynamicTile';
import { useState, useMemo } from 'react';
import { useTileStore } from '../lib/tiles/store';
import {
  BD_EXECUTIVE_SUMMARY,
  COMPETITIVE_LANDSCAPE_DATA,
  IP_FTO_DATA,
  MARKET_OPPORTUNITY_DATA,
  DEAL_LANDSCAPE_DATA,
  STRATEGIC_RECOMMENDATION_DATA,
  CLINICAL_PRECEDENT_DATA,
} from '../constants';

interface ScoutDashboardProps {
  viewMode?: 'grid' | 'list';
}

export default function ScoutDashboard({ viewMode = 'grid' }: ScoutDashboardProps) {
  const [loading] = useState(false);
  const visibleTiles = useTileStore((state) => state.getVisibleTiles());

  // Sort tiles: pinned first, then by creation date
  const sortedTiles = useMemo(() => {
    return [...visibleTiles].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visibleTiles]);

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-6';

  return (
    <div className="p-6">
      <div className={gridClasses}>
        {/* User-Created Tiles (pinned first) */}
        {sortedTiles
          .filter(tile => tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}

        {/* Baseline Tiles */}
        {/* ROW 1: Executive Summary */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4' : 'w-full'}>
          <BDExecutiveSummaryTile data={BD_EXECUTIVE_SUMMARY} loading={loading} />
        </div>

        {/* ROW 2: Scientific Validation + Competitive Landscape */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <ScientificValidationTile
            data={CLINICAL_PRECEDENT_DATA}
            loading={loading}
          />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <CompetitiveLandscapeTile data={COMPETITIVE_LANDSCAPE_DATA} loading={loading} />
        </div>

        {/* ROW 3: Clinical Positioning + IP & FTO */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <ClinicalPositioningTile data={CLINICAL_PRECEDENT_DATA} loading={loading} />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <IPFreedomToOperateTile data={IP_FTO_DATA} loading={loading} />
        </div>

        {/* ROW 4: Market Opportunity + Deal Landscape */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <MarketOpportunityTile data={MARKET_OPPORTUNITY_DATA} loading={loading} />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <DealLandscapeTile data={DEAL_LANDSCAPE_DATA} loading={loading} />
        </div>

        {/* ROW 5: Strategic Recommendation */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4' : 'w-full'}>
          <StrategicRecommendationTile data={STRATEGIC_RECOMMENDATION_DATA} loading={loading} />
        </div>

        {/* User-Created Tiles (non-pinned) */}
        {sortedTiles
          .filter(tile => !tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}
      </div>
    </div>
  );
}
