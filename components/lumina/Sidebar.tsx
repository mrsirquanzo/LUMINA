"use client";

import { useMemo } from 'react';
import { useLuminaStore } from '@/lib/lumina/store';
import { ViewMode } from '@/lib/lumina/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  Dna,
  Target,
  FlaskConical,
  Building2,
  FileText,
  Globe,
  DollarSign,
  Clock,
  TrendingUp,
  List,
  Star,
  AlertCircle,
  ArrowUp,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { companies } from '@/lib/lumina/mock-data';

interface FilterOption {
  label: string;
  count: number;
  checked?: boolean;
}

interface FilterSection {
  icon: LucideIcon;
  label: string;
  options: FilterOption[];
}

function getFiltersForView(view: ViewMode): FilterSection[] {
  // Calculate actual counts from companies
  const modalityCounts = companies.reduce((acc, company) => {
    acc[company.mechanism] = (acc[company.mechanism] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const targetCounts = companies.reduce((acc, company) => {
    if (company.target) {
      acc[company.target] = (acc[company.target] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const stageCounts = companies.reduce((acc, company) => {
    acc[company.stage] = (acc[company.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get unique values
  const uniqueModalities = Array.from(new Set(companies.map((c) => c.mechanism))).filter(Boolean) as string[];
  const uniqueTargets = Array.from(new Set(companies.map((c) => c.target).filter(Boolean))) as string[];
  const uniqueStages = Array.from(new Set(companies.map((c) => c.stage))).filter(Boolean) as string[];

  switch (view) {
    case 'scientist':
      return [
        {
          icon: Dna,
          label: 'Modality',
          options: uniqueModalities.map((modality) => ({
            label: modality,
            count: modalityCounts[modality] || 0,
          })),
        },
        {
          icon: Target,
          label: 'Target Class',
          options: uniqueTargets.map((target) => ({
            label: target,
            count: targetCounts[target] || 0,
          })),
        },
        {
          icon: FlaskConical,
          label: 'Dev Stage',
          options: uniqueStages.map((stage) => ({
            label: stage,
            count: stageCounts[stage] || 0,
          })),
        },
      ];
    case 'scout':
      return [
        {
          icon: Building2,
          label: 'Therapeutic Area',
          options: [
            { label: 'Oncology', count: 45 },
            { label: 'Neurology', count: 12 },
            { label: 'Immunology', count: 8 },
            { label: 'Rare Disease', count: 5 },
            { label: 'Cardiovascular', count: 7 },
            { label: 'Metabolic', count: 4 },
          ],
        },
        {
          icon: FileText,
          label: 'Deal Status',
          options: [
            { label: 'Active', count: 32 },
            { label: 'In Negotiation', count: 8 },
            { label: 'Closed', count: 15 },
            { label: 'On Hold', count: 5 },
            { label: 'Expired', count: 3 },
          ],
        },
        {
          icon: Globe,
          label: 'Geography',
          options: [
            { label: 'North America', count: 28 },
            { label: 'Europe', count: 18 },
            { label: 'Asia-Pacific', count: 12 },
            { label: 'Latin America', count: 4 },
            { label: 'Middle East', count: 2 },
          ],
        },
      ];
    case 'vc':
      return [
        {
          icon: TrendingUp,
          label: 'Investment Stage',
          options: [
            { label: 'Seed', count: 12 },
            { label: 'Series A', count: 18 },
            { label: 'Series B', count: 15 },
            { label: 'Series C+', count: 8 },
            { label: 'IPO', count: 3 },
          ],
        },
        {
          icon: Clock,
          label: 'Runway',
          options: [
            { label: '< 12mo', count: 17 },
            { label: '> 12mo', count: 39 },
          ],
        },
        {
          icon: DollarSign,
          label: 'Deal Size',
          options: [
            { label: '< $10M', count: 8 },
            { label: '$10M - $25M', count: 15 },
            { label: '$25M - $50M', count: 18 },
            { label: '$50M - $100M', count: 12 },
            { label: '> $100M', count: 5 },
          ],
        },
      ];
  }
}

function getThemeClasses(view: ViewMode) {
  switch (view) {
    case 'scientist':
      return {
        primary: 'bg-scientist-primary-500 border-scientist-primary-500',
        primaryHover: 'hover:bg-scientist-primary-400',
        border: 'border-slate-800',
        text: 'text-slate-200',
        textMuted: 'text-slate-400',
      };
    case 'scout':
      return {
        primary: 'bg-scout-primary-500 border-scout-primary-500',
        primaryHover: 'hover:bg-scout-primary-400',
        border: 'border-slate-800',
        text: 'text-slate-200',
        textMuted: 'text-slate-400',
      };
    case 'vc':
      return {
        primary: 'bg-vc-primary-500 border-vc-primary-500',
        primaryHover: 'hover:bg-vc-primary-400',
        border: 'border-slate-800',
        text: 'text-slate-200',
        textMuted: 'text-slate-400',
      };
  }
}

export default function Sidebar() {
  const {
    activeView,
    activeSmartView,
    setActiveSmartView,
    selectedModalities,
    toggleModality,
    selectedTargets,
    toggleTarget,
    selectedStages,
    toggleStage,
    clearAllFilters,
  } = useLuminaStore();
  const filters = getFiltersForView(activeView);
  const theme = getThemeClasses(activeView);

  const handleSmartViewClick = (viewId: string) => {
    if (viewId === 'all') {
      setActiveSmartView('all');
      clearAllFilters();
    } else {
      setActiveSmartView(viewId as any);
    }
  };

  const handleFilterChange = (filterLabel: string, optionLabel: string) => {
    if (filterLabel === 'Modality') {
      toggleModality(optionLabel);
    } else if (filterLabel === 'Target Class') {
      toggleTarget(optionLabel);
    } else if (filterLabel === 'Dev Stage') {
      toggleStage(optionLabel);
    }
  };

  const isFilterChecked = (filterLabel: string, optionLabel: string): boolean => {
    if (filterLabel === 'Modality') {
      return selectedModalities.includes(optionLabel);
    } else if (filterLabel === 'Target Class') {
      return selectedTargets.includes(optionLabel);
    } else if (filterLabel === 'Dev Stage') {
      return selectedStages.includes(optionLabel);
    }
    return false;
  };

  // Calculate smart view counts
  const smartViewCounts = useMemo(() => {
    const watchlistCount = companies.filter((c) => c.isWatchlisted).length;
    const highConvictionCount = companies.filter((c) => c.scores?.validation && c.scores.validation >= 80).length;
    const needsReviewCount = companies.filter((c) => c.status === 'review').length;
    const trendingUpCount = companies.filter((c) => c.trend?.direction === 'up').length;
    return {
      all: companies.length,
      watchlist: watchlistCount,
      highConviction: highConvictionCount,
      needsReview: needsReviewCount,
      trendingUp: trendingUpCount,
    };
  }, []);

  const smartViews = [
    { id: 'all', label: 'All Assets', icon: List, count: smartViewCounts.all },
    { id: 'watchlist', label: 'My Watchlist', icon: Star, count: smartViewCounts.watchlist },
    { id: 'high-conviction', label: 'High Conviction', icon: Target, count: smartViewCounts.highConviction },
    { id: 'needs-review', label: 'Needs Review', icon: AlertCircle, count: smartViewCounts.needsReview },
    { id: 'trending-up', label: 'Trending Up', icon: ArrowUp, count: smartViewCounts.trendingUp },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 overflow-y-auto',
        'bg-slate-900 border-r border-slate-800',
        'z-40'
      )}
    >
      <div className="p-4 space-y-6">
        {/* Smart Views Section */}
        <div className="space-y-2">
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider', theme.textMuted)}>
            Smart Views
          </h3>
          <div className="space-y-1">
            {smartViews.map((view) => {
              const isActive = activeSmartView === view.id;
              return (
                <button
                  key={view.id}
                  onClick={() => handleSmartViewClick(view.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                    'transition-colors',
                    isActive
                      ? 'bg-scientist-primary-500/20 text-white border border-scientist-primary-500/30'
                      : 'hover:bg-slate-800/50 text-slate-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <view.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{view.label}</span>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                      isActive ? 'bg-scientist-primary-500' : theme.primary
                    )}
                  >
                    {view.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className={cn('text-xs font-semibold uppercase tracking-wider', theme.textMuted)}>
              Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className={cn(
                'text-xs font-medium hover:underline',
                theme.textMuted,
                'hover:text-slate-300'
              )}
            >
              Clear All
            </button>
          </div>

          <Accordion type="multiple" defaultValue={[]}>
            {filters.map((filter, index) => (
              <AccordionItem
                key={filter.label}
                value={`filter-${index}`}
                className={cn('border-none', theme.border)}
              >
                <AccordionTrigger
                  className={cn(
                    'py-3 px-2 hover:no-underline hover:bg-slate-800/30 rounded-lg',
                    theme.text
                  )}
                >
                  <div className="flex items-center gap-2">
                    <filter.icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{filter.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-1">
                    {filter.options.map((option) => {
                      const isChecked = isFilterChecked(filter.label, option.label);
                      return (
                        <label
                          key={option.label}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md',
                            'cursor-pointer transition-colors hover:bg-slate-800/30',
                            theme.text
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleFilterChange(filter.label, option.label)}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center',
                              'transition-colors',
                              isChecked
                                ? theme.primary
                                : 'border-slate-600 bg-transparent'
                            )}
                          >
                            {isChecked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="flex-1 text-sm">{option.label}</span>
                          <span className={cn('text-xs font-medium', theme.textMuted)}>
                            {option.count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </aside>
  );
}

