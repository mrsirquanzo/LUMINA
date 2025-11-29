"use client";

import { useLuminaStore } from '@/lib/lumina/store';
import { Company } from '@/lib/lumina/types';
import { cn } from '@/lib/utils';
import { ArrowRight, TrendingUp, Building2, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface CompanyCardProps {
  company: Company;
}

function getThemeClasses(view: 'scientist' | 'scout' | 'vc') {
  switch (view) {
    case 'scientist':
      return {
        primary: 'bg-scientist-primary-500',
        primaryHover: 'hover:bg-scientist-primary-600',
        border: 'border-scientist-primary-500/30',
        glow: 'hover:shadow-scientist-primary-500/20',
        button: 'bg-scientist-primary-500 hover:bg-scientist-primary-600',
      };
    case 'scout':
      return {
        primary: 'bg-scout-primary-500',
        primaryHover: 'hover:bg-scout-primary-600',
        border: 'border-scout-primary-500/30',
        glow: 'hover:shadow-scout-primary-500/20',
        button: 'bg-scout-primary-500 hover:bg-scout-primary-600',
      };
    case 'vc':
      return {
        primary: 'bg-vc-primary-500',
        primaryHover: 'hover:bg-vc-primary-600',
        border: 'border-vc-primary-500/30',
        glow: 'hover:shadow-vc-primary-500/20',
        button: 'bg-vc-primary-500 hover:bg-vc-primary-600',
      };
  }
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const { activeView } = useLuminaStore();
  const theme = getThemeClasses(activeView);

  const formatCurrency = (value: number, unit: 'B' | 'M' = 'B') => {
    if (unit === 'B') {
      return `$${value.toFixed(1)}B`;
    }
    return `$${value}M`;
  };

  const getValidationColor = (score?: number) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-slate-900/50 backdrop-blur-sm',
        'p-6 transition-all duration-300',
        'hover:scale-[1.02] hover:border-opacity-60',
        'hover:shadow-2xl',
        'flex flex-col h-full',
        theme.border,
        theme.glow
      )}
    >
      {/* Content wrapper - takes up available space */}
      <div className="flex-1 flex flex-col">
        {/* Header Section - Adaptive based on view */}
        <div className="mb-4">
        {activeView === 'scientist' ? (
          <div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{company.name}</h3>
            <div className="flex items-center gap-3">
              {company.target && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-300">Target:</span>
                  <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm font-medium">
                    {company.target}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-300">Mechanism:</span>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm font-medium">
                  {company.mechanism}
                </span>
              </div>
            </div>
          </div>
        ) : activeView === 'vc' ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-100">{company.name}</h3>
              {company.ticker && (
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">
                  {company.ticker}
                </span>
              )}
            </div>
            {company.isPrivate ? (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-semibold text-slate-200">
                  {company.totalRaised ? formatCurrency(company.totalRaised, 'M') : 'N/A'}
                </span>
                <span className="text-sm text-slate-400">raised</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-semibold text-slate-200">
                  {company.marketCap ? formatCurrency(company.marketCap) : 'N/A'}
                </span>
                <span className="text-sm text-slate-400">market cap</span>
              </div>
            )}
          </div>
        ) : (
          // Scout view header
          <div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{company.name}</h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm font-medium">
                {company.mechanism}
              </span>
              {company.stage && (
                <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-sm font-medium">
                  {company.stage}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body Section - Adaptive based on view */}
      <div className="mb-4 space-y-3">
        {activeView === 'scientist' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Mechanism Type</span>
              <span className="text-sm font-medium text-slate-200">{company.mechanism}</span>
            </div>
            {company.validationScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Validation Score</span>
                <span className={cn('text-sm font-bold', getValidationColor(company.validationScore))}>
                  {company.validationScore}/100
                </span>
              </div>
            )}
          </>
        ) : activeView === 'scout' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Development Stage</span>
              <span className="text-sm font-medium text-slate-200">{company.stage}</span>
            </div>
            {company.partnership && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Partnership:</span>
                <span className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-sm font-medium border border-cyan-500/30">
                  {company.partnership}
                </span>
              </div>
            )}
          </>
        ) : (
          // VC view body
          <>
            {company.isPrivate ? (
              <>
                {company.leadInvestor && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Lead Investor</span>
                    <span className="text-sm font-medium text-slate-200">{company.leadInvestor}</span>
                  </div>
                )}
                {company.totalRaised && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Raised</span>
                    <span className="text-sm font-medium text-slate-200">
                      {formatCurrency(company.totalRaised, 'M')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {company.marketCap && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Market Cap</span>
                    <span className="text-sm font-medium text-slate-200">
                      {formatCurrency(company.marketCap)}
                    </span>
                  </div>
                )}
                {company.ticker && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Ticker</span>
                    <span className="text-sm font-mono font-medium text-slate-200">{company.ticker}</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
        </div>
      </div>

      {/* Footer - Deep Dive Button */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <Link
          href={`/lumina/company/${company.id}`}
          className={cn(
            'flex items-center justify-between w-full px-4 py-2 rounded-lg',
            'text-white font-medium text-sm transition-colors',
            theme.button
          )}
        >
          <span>Deep Dive</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

