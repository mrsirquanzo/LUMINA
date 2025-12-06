"use client";

import { useMemo, useState } from 'react';
import { companies } from '@/lib/lumina/mock-data';
import { useLuminaStore } from '@/lib/lumina/store';
import HomePageCard from '@/components/lumina/HomePageCard';
import { Company } from '@/lib/lumina/types';
import { Search, Grid, List as ListIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

function filterCompanies(
  companies: Company[],
  searchQuery: string,
  selectedModalities: string[],
  selectedTargets: string[],
  selectedStages: string[],
  activeSmartView: string | null
): Company[] {
  let filtered = [...companies];

  // Apply smart view filter
  if (activeSmartView) {
    switch (activeSmartView) {
      case 'watchlist':
        filtered = filtered.filter((c) => c.isWatchlisted);
        break;
      case 'high-conviction':
        filtered = filtered.filter((c) => c.scores?.validation && c.scores.validation >= 80);
        break;
      case 'needs-review':
        filtered = filtered.filter((c) => c.status === 'review');
        break;
      case 'trending-up':
        filtered = filtered.filter((c) => c.trend?.direction === 'up');
        break;
      case 'all':
      default:
        // Show all
        break;
    }
  }

  // Apply search filter (searches name, target, mechanism, asset)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(query);
      const targetMatch = c.target?.toLowerCase().includes(query);
      const mechanismMatch = c.mechanism.toLowerCase().includes(query);
      const assetMatch = c.assetName?.toLowerCase().includes(query);
      return nameMatch || targetMatch || mechanismMatch || assetMatch;
    });
  }

  // Apply modality filter (AND logic)
  if (selectedModalities.length > 0) {
    filtered = filtered.filter((c) => selectedModalities.includes(c.mechanism));
  }

  // Apply target filter (AND logic)
  if (selectedTargets.length > 0) {
    filtered = filtered.filter((c) => c.target && selectedTargets.includes(c.target));
  }

  // Apply stage filter (AND logic)
  if (selectedStages.length > 0) {
    filtered = filtered.filter((c) => selectedStages.includes(c.stage));
  }

  return filtered;
}

function sortCompanies(companies: Company[], sortBy: 'name' | 'score' | 'updated' | 'modality'): Company[] {
  const sorted = [...companies];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'score':
      return sorted.sort((a, b) => {
        const scoreA = a.scores?.validation ?? a.validationScore ?? 0;
        const scoreB = b.scores?.validation ?? b.validationScore ?? 0;
        return scoreB - scoreA; // High to low
      });
    case 'updated':
      return sorted.sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    case 'modality':
      return sorted.sort((a, b) => a.mechanism.localeCompare(b.mechanism));
    default:
      return sorted;
  }
}

export default function LuminaDashboard() {
  const {
    searchQuery,
    setSearchQuery,
    selectedModalities,
    selectedTargets,
    selectedStages,
    activeSmartView,
    sortBy,
    setSortBy,
  } = useLuminaStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    const filtered = filterCompanies(
      companies,
      searchQuery,
      selectedModalities,
      selectedTargets,
      selectedStages,
      activeSmartView
    );
    return sortCompanies(filtered, sortBy);
  }, [searchQuery, selectedModalities, selectedTargets, selectedStages, activeSmartView, sortBy]);

  const sortOptions: { value: 'name' | 'score' | 'updated' | 'modality'; label: string }[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'score', label: 'Score (High → Low)' },
    { value: 'updated', label: 'Last Updated' },
    { value: 'modality', label: 'Modality' },
  ];

  // Mock last sync time
  const lastSync = '5 min ago';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Main Content Area */}
      <div className="ml-72 pt-16">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-100 mb-2">Asset Intelligence</h1>
                <p className="text-slate-400 text-lg">Explore biotech assets with AI-powered insights.</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-scientist-primary-500 hover:bg-scientist-primary-600 text-white font-medium text-sm transition-colors">
                + Add Asset
              </button>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center gap-4 mb-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets, targets, mechanisms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-scientist-primary-500 focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid'
                      ? 'bg-scientist-primary-500 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-scientist-primary-500 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-4 pr-10 py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-scientist-primary-500 focus:border-transparent cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Results Summary */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>
                Showing <span className="font-semibold text-slate-200">{filteredCompanies.length}</span> of{' '}
                <span className="font-semibold text-slate-200">{companies.length}</span> assets
              </span>
              <span className="text-slate-600">•</span>
              <span>Last sync: {lastSync}</span>
            </div>
          </div>

          {/* Company Cards Grid/List */}
          {filteredCompanies.length > 0 ? (
            <div
              className={cn(
                'gap-6',
                viewMode === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2'
                  : 'flex flex-col'
              )}
            >
              {filteredCompanies.map((company) => (
                <HomePageCard key={company.id} company={company} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-400 text-lg mb-2">No assets found</p>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
