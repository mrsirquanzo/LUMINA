/**
 * Regulatory Data Sources Section Component
 * Shows active regulatory data sources with status indicators
 * Matches Patent Agent DataSourcesSection design exactly
 */

import { Database, Search, BookOpen, Shield } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface DataSource {
  id: string;
  name: string;
  icon: typeof Database;
  status: 'connected' | 'disconnected';
}

const DATA_SOURCES: DataSource[] = [
  { id: 'fda', name: 'FDA.gov', icon: Shield, status: 'connected' },
  { id: 'ema', name: 'EMA', icon: Database, status: 'connected' },
  { id: 'clinicaltrials', name: 'ClinicalTrials.gov', icon: Search, status: 'connected' },
  { id: 'drugsatfda', name: 'Drugs@FDA', icon: Database, status: 'connected' },
];

interface RegulatoryDataSourcesSectionProps {
  defaultOpen?: boolean;
  onConfigure?: () => void;
}

export default function RegulatoryDataSourcesSection({
  defaultOpen = false,
  onConfigure,
}: RegulatoryDataSourcesSectionProps) {
  return (
    <CollapsibleSection
      title="Data Sources"
      icon={Database}
      defaultOpen={defaultOpen}
      count={DATA_SOURCES.filter((ds) => ds.status === 'connected').length}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Active regulatory databases</span>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
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
              className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg"
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
