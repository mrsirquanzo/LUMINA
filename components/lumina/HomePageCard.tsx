"use client";

import { Company } from '@/lib/lumina/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface HomePageCardProps {
  company: Company;
}

function formatCurrency(value: number): string {
  if (value >= 1) {
    return `$${value.toFixed(1)}B`;
  }
  return `$${(value * 1000).toFixed(0)}M`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }
  return 'Just now';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'new':
      return { label: 'NEW', className: 'bg-red-500/20 text-red-400 border-red-500/30' };
    case 'review':
      return { label: 'REVIEW', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    case 'stale':
      return { label: 'STALE', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    case 'watching':
      return { label: 'WATCHING', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    default:
      return null;
  }
}

function CircularScore({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 18; // radius = 18
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-sm font-bold', color)}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}

function TrendSparkline({ data, direction }: { data: number[]; direction: 'up' | 'down' | 'stable' }) {
  const width = 80;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  const color = direction === 'up' ? '#a78bfa' : direction === 'down' ? '#ef4444' : '#64748b';

  return (
    <div className="flex flex-col gap-1">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs text-slate-400">30d trend</span>
    </div>
  );
}

export default function HomePageCard({ company }: HomePageCardProps) {
  const statusBadge = getStatusBadge(company.status);
  const timeAgo = company.lastUpdated ? formatTimeAgo(company.lastUpdated) : null;

  const valuation = useMemo(() => {
    if (company.marketCap) return formatCurrency(company.marketCap);
    if (company.valuation) return formatCurrency(company.valuation);
    return null;
  }, [company.marketCap, company.valuation]);

  return (
    <div className="group relative rounded-xl border bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 transition-all duration-300 hover:border-scientist-primary-500/30 hover:shadow-xl hover:shadow-scientist-primary-500/10">
      {/* Status Badge */}
      {statusBadge && (
        <div className={cn('absolute top-4 right-4 px-2 py-1 rounded-md text-xs font-semibold border', statusBadge.className)}>
          {statusBadge.label}
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-slate-100">{company.name}</h3>
          {company.ticker && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">
              {company.ticker}
            </span>
          )}
          {company.ticker && (
            <ExternalLink className="w-3 h-3 text-slate-500" />
          )}
        </div>
        {company.assetName && company.target && (
          <div className="text-sm text-slate-300 font-medium">
            {company.assetName} → {company.target}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="px-2 py-1 rounded-md bg-scientist-primary-500/20 text-scientist-primary-400 text-xs font-medium border border-scientist-primary-500/30">
          {company.mechanism}
        </span>
        <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
          {company.stage}
        </span>
        {valuation && (
          <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
            {valuation}
          </span>
        )}
      </div>

      {/* Metrics and Trend */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {company.scores?.validation !== undefined && (
            <CircularScore score={company.scores.validation} label="Validation" />
          )}
          {company.scores?.safety !== undefined && (
            <CircularScore score={company.scores.safety} label="Safety" />
          )}
          {company.scores?.ip !== undefined && (
            <CircularScore score={company.scores.ip} label="IP" />
          )}
        </div>
        {company.trend && (
          <div className="flex items-center gap-2">
            {company.trend.change !== 0 && (
              <span className={cn(
                'text-xs font-semibold',
                company.trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
              )}>
                {company.trend.direction === 'up' ? '↑' : '↓'}
                {Math.abs(company.trend.change)}
              </span>
            )}
            <TrendSparkline data={company.trend.sparkline} direction={company.trend.direction} />
          </div>
        )}
      </div>

      {/* AI Insight */}
      {company.aiInsight && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">{company.aiInsight.summary}</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {company.alerts && company.alerts.length > 0 && (
        <div className="mb-4 space-y-1">
          {company.alerts.map((alert, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <AlertTriangle className={cn(
                'w-4 h-4 flex-shrink-0',
                alert.severity === 'high' ? 'text-red-400' : 'text-yellow-400'
              )} />
              <span className="text-slate-400">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        {timeAgo && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>Updated {timeAgo}</span>
          </div>
        )}
        <Link
          href={`/lumina/company/${company.id}`}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-scientist-primary-500 hover:bg-scientist-primary-600',
            'text-white font-medium text-sm transition-colors'
          )}
        >
          <span>Deep Dive</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

