import Tile from '../Tile';
import { Handshake } from 'lucide-react';
import type { DealActivity } from '../../types';

interface DealLandscapeTileProps {
  data: {
    dealActivity: DealActivity;
    comparableDeals: Array<{
      asset: string;
      acquirer: string;
      seller: string;
      date: string;
      stage: string;
      upfront: string;
      milestones: string;
      totalValue: string;
      royalties?: string;
      notes?: string;
    }>;
    valuationContext: string;
    potentialPartners: string[];
    dealStructureConsiderations: string[];
  };
  loading?: boolean;
}

export default function DealLandscapeTile({ data, loading }: DealLandscapeTileProps) {
  const getActivityColor = (activity: DealActivity) => {
    switch (activity) {
      case 'Hot':
        return 'bg-danger/20 text-danger border-danger/50';
      case 'Active':
        return 'bg-warning/20 text-warning border-warning/50';
      case 'Moderate':
        return 'bg-info/20 text-info border-info/50';
      case 'Limited':
        return 'bg-textTertiary/20 text-textTertiary border-textTertiary/50';
    }
  };

  return (
    <Tile
      title="Deal Landscape"
      icon={<Handshake className="w-5 h-5" />}
      tileType="deal"
      loading={loading}
      className="h-[320px]"
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-5 px-1 pb-2">
        <div
          className={`inline-block px-4 py-2 rounded-lg border-2 text-sm font-bold ${getActivityColor(
            data.dealActivity
          )}`}
        >
          {data.dealActivity === 'Active' ? 'Current' : data.dealActivity} Activity
        </div>

        {/* Comparable Deals Table */}
        <div className="bg-surfaceElevated rounded-lg overflow-hidden border border-white/5">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-base">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Asset</th>
                  <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Stage</th>
                  <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Total Value</th>
                  <th className="px-4 py-3 text-left text-textSecondary font-bold text-sm">Year</th>
                </tr>
              </thead>
              <tbody>
                {data.comparableDeals.slice(0, 3).map((deal, idx) => (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="px-4 py-3 text-textPrimary font-semibold align-middle text-base">{deal.asset}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center justify-center text-sm px-3 py-1.5 bg-primary/20 text-primary rounded-full font-semibold whitespace-nowrap">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-textPrimary font-bold align-middle text-base">{deal.totalValue}</td>
                    <td className="px-4 py-3 text-textPrimary font-medium align-middle text-base">
                      {new Date(deal.date).getFullYear()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surfaceElevated rounded-lg p-5 border border-white/5">
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Valuation Context
          </p>
          <p className="text-base leading-relaxed text-textPrimary">{data.valuationContext}</p>
        </div>

        <div>
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Potential Partners
          </p>
          <div className="flex flex-wrap gap-3">
            {data.potentialPartners.slice(0, 4).map((partner, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg text-sm font-medium text-textSecondary hover:bg-surface hover:text-textPrimary transition-colors cursor-pointer"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-base font-bold text-textSecondary mb-3 uppercase tracking-wider">
            Deal Structure Considerations
          </p>
          <ul className="space-y-2.5">
            {data.dealStructureConsiderations.slice(0, 3).map((consideration, idx) => (
              <li key={idx} className="text-base leading-relaxed text-textPrimary flex items-baseline gap-3">
                <span className="text-warning text-lg font-bold flex-shrink-0">•</span>
                <span className="flex-1">{consideration}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Tile>
  );
}
