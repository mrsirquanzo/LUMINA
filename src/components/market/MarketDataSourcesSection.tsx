/**
 * Market Data Sources Section Component
 * Shows active market research data sources with status indicators
 * Matches Patent Agent DataSourcesSection design exactly
 */

import { Database, Search, BookOpen, Building2 } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface DataSource {
  id: string;
  name: string;
  icon: typeof Database;
  status: 'connected' | 'disconnected';
}

const DATA_SOURCES: DataSource[] = [
  { id: 'pubmed', name: 'PubMed', icon: Database, status: 'connected' },
  { id: 'fda', name: 'FDA', icon: Database, status: 'connected' },
  { id: 'sec', name: 'SEC/EDGAR', icon: Search, status: 'connected' },
  { id: 'evaluate', name: 'Evaluate', icon: Database, status: 'disconnected' },
];

interface MarketDataSourcesSectionProps {
  defaultOpen?: boolean;
  onConfigure?: () => void;
}

export default function MarketDataSourcesSection({
  defaultOpen = false,
  onConfigure,
}: MarketDataSourcesSectionProps) {
  return (
    <CollapsibleSection
      title="Data Sources"
      icon={Database}
      defaultOpen={defaultOpen}
      count={DATA_SOURCES.filter((ds) => ds.status === 'connected').length}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Active market research databases</span>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            Configure
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {DATA_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <div
              key={source.id}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-border rounded-lg"
            >
              <Icon size={14} className="text-textSecondary" />
              <span className="text-sm text-textPrimary">{source.name}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  source.status === 'connected' ? 'bg-success' : 'bg-textTertiary'
                }`}
              />
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
