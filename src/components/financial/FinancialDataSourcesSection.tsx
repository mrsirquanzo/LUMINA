/**
 * Financial Data Sources Section Component
 * Shows active financial data sources with status indicators
 */

import { Database, Landmark, BarChart3, Briefcase } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface DataSource {
  id: string;
  name: string;
  icon: typeof Landmark;
  status: 'connected' | 'disconnected';
}

const DATA_SOURCES: DataSource[] = [
  { id: 'sec_edgar', name: 'SEC Edgar', icon: Landmark, status: 'connected' },
  { id: 'biocentury', name: 'BioCentury', icon: Database, status: 'connected' },
  { id: 'evaluate', name: 'Evaluate', icon: BarChart3, status: 'connected' },
  { id: 'pitchbook', name: 'PitchBook', icon: Briefcase, status: 'disconnected' },
];

interface FinancialDataSourcesSectionProps {
  defaultOpen?: boolean;
  onConfigure?: () => void;
}

export default function FinancialDataSourcesSection({
  defaultOpen = false,
  onConfigure,
}: FinancialDataSourcesSectionProps) {
  return (
    <CollapsibleSection
      title="Data Sources"
      icon={Database}
      defaultOpen={defaultOpen}
      count={DATA_SOURCES.filter((ds) => ds.status === 'connected').length}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Active financial databases</span>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
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
