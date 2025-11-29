"use client";

import { useState, useEffect } from 'react';
import { useLuminaStore } from '@/lib/lumina/store';
import { ViewMode } from '@/lib/lumina/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
  Bell,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

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
  switch (view) {
    case 'scientist':
      return [
        {
          icon: Dna,
          label: 'Modality',
          options: [
            { label: 'ADC', count: 12, checked: true },
            { label: 'Radioligand', count: 8 },
          ],
        },
        {
          icon: Target,
          label: 'Target Class',
          options: [
            { label: 'Nectin-4', count: 5 },
            { label: 'HER2', count: 8 },
          ],
        },
        {
          icon: FlaskConical,
          label: 'Dev Stage',
          options: [
            { label: 'Pre-clinical', count: 15 },
            { label: 'Phase 1', count: 22 },
            { label: 'Phase 2', count: 18, checked: true },
            { label: 'Phase 3', count: 9 },
            { label: 'Marketed', count: 6 },
          ],
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
  const { activeView } = useLuminaStore();
  const filters = getFiltersForView(activeView);
  const theme = getThemeClasses(activeView);
  
  // Track checkbox states
  const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    filters.forEach((filter) => {
      filter.options.forEach((option) => {
        const key = `${filter.label}-${option.label}`;
        initial[key] = option.checked ?? false;
      });
    });
    return initial;
  });

  const handleCheckboxChange = (filterLabel: string, optionLabel: string) => {
    const key = `${filterLabel}-${optionLabel}`;
    setCheckedStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Reset checkbox states when view changes
  useEffect(() => {
    const currentFilters = getFiltersForView(activeView);
    const initial: Record<string, boolean> = {};
    currentFilters.forEach((filter) => {
      filter.options.forEach((option) => {
        const key = `${filter.label}-${option.label}`;
        initial[key] = option.checked ?? false;
      });
    });
    setCheckedStates(initial);
  }, [activeView]);

  const smartViews = [
    { label: 'All Assets', href: '#', icon: List },
    { label: 'My Watchlist', href: '#', icon: Star, badge: 12 },
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
            {smartViews.map((view) => (
              <Link
                key={view.label}
                href={view.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg',
                  'transition-colors hover:bg-slate-800/50',
                  theme.text
                )}
              >
                <div className="flex items-center gap-2">
                  <view.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{view.label}</span>
                </div>
                {view.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                      theme.primary
                    )}
                  >
                    {view.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className={cn('text-xs font-semibold uppercase tracking-wider', theme.textMuted)}>
              Filters
            </h3>
            <button
              className={cn(
                'text-xs font-medium hover:underline',
                theme.textMuted,
                'hover:text-slate-300'
              )}
            >
              Clear All
            </button>
          </div>

          <Accordion type="multiple" defaultValue={filters.map((_, i) => `filter-${i}`)}>
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
                      const key = `${filter.label}-${option.label}`;
                      const isChecked = checkedStates[key] ?? option.checked ?? false;
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
                            onChange={() => handleCheckboxChange(filter.label, option.label)}
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

