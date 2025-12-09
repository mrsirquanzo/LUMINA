/**
 * Data Sources Section Component
 * Shows active patent databases with status indicators
 */

import { useState } from 'react';
import { Landmark, Globe, Search, Database, Settings } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface DataSource {
  id: string;
  name: string;
  icon: typeof Landmark;
  status: 'connected' | 'disconnected';
}

const DATA_SOURCES: DataSource[] = [
  { id: 'uspto', name: 'USPTO', icon: Landmark, status: 'connected' },
  { id: 'epo', name: 'EPO', icon: Globe, status: 'connected' },
  { id: 'google', name: 'Google Patents', icon: Search, status: 'connected' },
  { id: 'wipo', name: 'WIPO', icon: Database, status: 'connected' },
];

interface DataSourcesSectionProps {
  defaultOpen?: boolean;
  onConfigure?: () => void;
}

export default function DataSourcesSection({
  defaultOpen = false,
  onConfigure,
}: DataSourcesSectionProps) {
  return (
    <CollapsibleSection
      title="Data Sources"
      icon={Database}
      defaultOpen={defaultOpen}
      count={DATA_SOURCES.filter((ds) => ds.status === 'connected').length}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Active patent databases</span>
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
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
