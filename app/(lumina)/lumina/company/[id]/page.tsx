"use client";

import { companies } from '@/lib/lumina/mock-data';
import { useState } from 'react';
import { useLuminaStore } from '@/lib/lumina/store';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import TargetBiologyProfile from '@/components/lumina/scientist/TargetBiologyProfile';
import { ConstructVisualizer } from '@/components/lumina/scientist/ConstructVisualizer';
import EvidenceMatrix from '@/components/lumina/scientist/EvidenceMatrix';
import AnatomicalBodyMapEnhanced from '@/components/lumina/scientist/AnatomicalBodyMapEnhanced';
import AdverseEventTable from '@/components/lumina/scientist/AdverseEventTable';
import ValidationDashboard from '@/components/lumina/scientist/ValidationDashboard';
import SequenceViewer from '@/components/lumina/scientist/SequenceViewer';
import BiomarkerPanel from '@/components/lumina/scientist/BiomarkerPanel';
import { Company } from '@/lib/lumina/types';

interface PageProps {
  params: {
    id: string;
  };
}

interface OverviewViewProps {
  company: Company;
}

function OverviewView({ company }: OverviewViewProps) {
  return (
    <div className="space-y-6">
      <TargetBiologyProfile company={company} />
      <ConstructVisualizer modality={company.mechanism} structure={company.structure} />
      <EvidenceMatrix company={company} />
    </div>
  );
}

interface SafetyDeepDiveProps {
  company: Company;
}

function SafetyDeepDive({ company }: SafetyDeepDiveProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnatomicalBodyMapEnhanced risks={company.safetyData?.risks || []} />
      <AdverseEventTable aeTable={company.safetyData?.aeTable || []} />
    </div>
  );
}

type TabType = 'overview' | 'validation' | 'safety' | 'sequence' | 'biomarker';

function getThemeClasses(view: 'scientist' | 'scout' | 'vc') {
  switch (view) {
    case 'scientist':
      return {
        activeTab: 'text-white border-b-2 border-scientist-primary-500',
        inactiveTab: 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent',
        border: 'border-scientist-primary-500/30',
      };
    case 'scout':
      return {
        activeTab: 'text-white border-b-2 border-scout-primary-500',
        inactiveTab: 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent',
        border: 'border-scout-primary-500/30',
      };
    case 'vc':
      return {
        activeTab: 'text-white border-b-2 border-vc-primary-500',
        inactiveTab: 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent',
        border: 'border-vc-primary-500/30',
      };
  }
}

function formatCurrency(value: number, unit: 'B' | 'M' = 'B') {
  if (unit === 'B') {
    return `$${value.toFixed(1)}B`;
  }
  return `$${value}M`;
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { activeView } = useLuminaStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const company = companies.find((c) => c.id === params.id);

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-100 mb-4">404</h1>
          <p className="text-slate-400 mb-6">Company not found</p>
          <Link
            href="/lumina"
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const theme = getThemeClasses(activeView);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'validation', label: 'Validation' },
    { id: 'safety', label: 'Safety' },
    { id: 'sequence', label: 'Sequence' },
    { id: 'biomarker', label: 'Biomarker' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Asset Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-bold text-slate-100">{company.name}</h1>
                {company.ticker && (
                  <span className="px-3 py-1 rounded-md bg-slate-800 text-slate-400 text-sm font-mono">
                    {company.ticker}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {company.assetName && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-200">{company.assetName}</span>
                    <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-sm font-medium">
                      {company.mechanism}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {company.isPrivate ? (
                <>
                  <DollarSign className="w-5 h-5 text-slate-400" />
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Valuation</div>
                    <div className="text-xl font-bold text-slate-100">
                      {company.valuation ? formatCurrency(company.valuation) : 'N/A'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Market Cap</div>
                    <div className="text-xl font-bold text-slate-100">
                      {company.marketCap ? formatCurrency(company.marketCap) : 'N/A'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-8">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-4 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? theme.activeTab
                    : theme.inactiveTab + ' hover:bg-slate-800/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-8 py-8">
        {activeTab === 'overview' && activeView === 'scientist' ? (
          <OverviewView company={company} />
        ) : activeTab === 'validation' && activeView === 'scientist' ? (
          <ValidationDashboard company={company} />
        ) : activeTab === 'safety' && activeView === 'scientist' ? (
          <SafetyDeepDive company={company} />
        ) : activeTab === 'sequence' && activeView === 'scientist' ? (
          <SequenceViewer company={company} />
        ) : activeTab === 'biomarker' && activeView === 'scientist' ? (
          <BiomarkerPanel company={company} />
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-8">
            <p className="text-slate-300 text-lg">
              Viewing <span className="font-semibold text-slate-100">{tabs.find((t) => t.id === activeTab)?.label}</span> for{' '}
              <span className="font-semibold text-slate-100">{company.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

