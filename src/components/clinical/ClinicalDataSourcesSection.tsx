/**
 * Clinical Data Sources Section Component
 * Shows active clinical data sources with status indicators
 */

import { Building2, BookOpen, TrendingUp, Database } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface DataSource {
  id: string;
  name: string;
  icon: typeof Building2;
  status: 'connected' | 'disconnected';
}

const DATA_SOURCES: DataSource[] = [
  { id: 'clinicaltrials', name: 'ClinicalTrials', icon: Building2, status: 'connected' },
  { id: 'pubmed', name: 'PubMed', icon: BookOpen, status: 'connected' },
  { id: 'fda', name: 'FDA', icon: Building2, status: 'connected' },
  { id: 'sec', name: 'SEC', icon: TrendingUp, status: 'connected' },
];

interface ClinicalDataSourcesSectionProps {
  defaultOpen?: boolean;
  onConfigure?: () => void;
}

export default function ClinicalDataSourcesSection({
  defaultOpen = false,
  onConfigure,
}: ClinicalDataSourcesSectionProps) {
  return (
    <CollapsibleSection
      title="Data Sources"
      icon={Database}
      defaultOpen={defaultOpen}
      count={DATA_SOURCES.filter((ds) => ds.status === 'connected').length}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Active clinical databases</span>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Configure
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DATA_SOURCES.map((source) => {
          const Icon = source.icon;
          return (
            <div
              key={source.id}
              className="flex items-center gap-2 px-3 py-2 bg-surfaceElevated border border-white/10 rounded-lg"
            >
              <Icon size={14} className="text-textSecondary" />
              <span className="text-sm text-textPrimary flex-1">{source.name}</span>
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
