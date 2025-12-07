"use client";

import { Company } from '@/lib/lumina/types';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, XCircle, TrendingUp, Activity, Target } from 'lucide-react';

interface ValidationDashboardProps {
  company: Company;
}

interface ValidationMetric {
  category: string;
  score: number;
  maxScore: number;
  status: 'strong' | 'moderate' | 'weak';
  details: string[];
}

export default function ValidationDashboard({ company }: ValidationDashboardProps) {
  const validationScore = company.validationScore || 0;
  
  // Mock validation metrics - in real app, this would come from props or API
  const metrics: ValidationMetric[] = company.validationMetrics || [
    {
      category: 'Genetic Evidence',
      score: 85,
      maxScore: 100,
      status: 'strong',
      details: ['Knockout studies show reduced tumor growth', 'GWAS association with disease risk'],
    },
    {
      category: 'Clinical Precedent',
      score: 78,
      maxScore: 100,
      status: 'strong',
      details: ['Similar targets show clinical efficacy', 'Phase 2 data from competitor programs'],
    },
    {
      category: 'Biological Rationale',
      score: 82,
      maxScore: 100,
      status: 'strong',
      details: ['Target expression correlates with patient outcomes', 'Mechanism of action well-characterized'],
    },
    {
      category: 'Safety Profile',
      score: 65,
      maxScore: 100,
      status: 'moderate',
      details: ['Manageable toxicity profile', 'Some organ-specific risks identified'],
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getStatusIcon = (status: 'strong' | 'moderate' | 'weak') => {
    switch (status) {
      case 'strong':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'moderate':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'weak':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Validation Score */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-scientist-primary-400" />
            Overall Validation Score
          </h3>
          <div className={cn(
            'px-4 py-2 rounded-lg border font-bold text-2xl',
            getScoreBgColor(validationScore),
            getScoreColor(validationScore)
          )}>
            {validationScore}/100
          </div>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
          <div
            className={cn(
              'h-3 rounded-full transition-all duration-500',
              validationScore >= 80 ? 'bg-green-500' : validationScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${validationScore}%` }}
          />
        </div>
        <p className="text-sm text-slate-400">
          Based on genetic evidence, clinical precedent, biological rationale, and safety profile
        </p>
      </div>

      {/* Validation Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-scientist-primary-400" />
          Validation Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 hover:border-scientist-primary-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <h4 className="text-sm font-semibold text-slate-200">{metric.category}</h4>
                </div>
                <div className={cn(
                  'px-3 py-1 rounded-md text-sm font-bold',
                  getScoreBgColor(metric.score),
                  getScoreColor(metric.score)
                )}>
                  {metric.score}/{metric.maxScore}
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    metric.score >= 80 ? 'bg-green-500' : metric.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                />
              </div>
              <ul className="space-y-1">
                {metric.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-scientist-primary-400 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Summary */}
      {company.geneticEvidence || company.clinicalPrecedent || company.biologicalRationale ? (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-scientist-primary-400" />
            Evidence Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.geneticEvidence && company.geneticEvidence.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Genetic Evidence
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {company.geneticEvidence.filter(e => e.status === 'strong').length}
                </div>
                <div className="text-xs text-slate-400">
                  Strong evidence items
                </div>
              </div>
            )}
            {company.clinicalPrecedent && company.clinicalPrecedent.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Clinical Precedent
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {company.clinicalPrecedent.filter(e => e.status === 'strong').length}
                </div>
                <div className="text-xs text-slate-400">
                  Strong evidence items
                </div>
              </div>
            )}
            {company.biologicalRationale && company.biologicalRationale.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Biological Rationale
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {company.biologicalRationale.filter(e => e.status === 'strong').length}
                </div>
                <div className="text-xs text-slate-400">
                  Strong evidence items
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

