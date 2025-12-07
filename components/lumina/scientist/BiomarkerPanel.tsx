"use client";

import { Company } from '@/lib/lumina/types';
import { TrendingUp, Users, BarChart3 } from 'lucide-react';

interface BiomarkerPanelProps {
  company: Company;
}

export default function BiomarkerPanel({ company }: BiomarkerPanelProps) {
  const biomarkerData = company.biomarkerData || {
    expressionLevels: [
      { tissue: 'Bladder', level: 85, status: 'high' },
      { tissue: 'Lung', level: 72, status: 'high' },
      { tissue: 'Pancreas', level: 68, status: 'moderate' },
      { tissue: 'Liver', level: 45, status: 'low' },
    ],
    patientStratification: {
      highExpressors: 45,
      moderateExpressors: 35,
      lowExpressors: 20,
    },
    predictiveMarkers: ['PD-L1', 'TMB', 'MSI-H'],
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-scientist-primary-400" />
          Expression Levels by Tissue
        </h3>
        <div className="space-y-3">
          {biomarkerData.expressionLevels.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-32 text-sm text-slate-300">{item.tissue}</div>
              <div className="flex-1 bg-slate-800 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    item.status === 'high' ? 'bg-green-500' : item.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${item.level}%` }}
                />
              </div>
              <div className="w-16 text-right text-sm font-semibold text-slate-200">{item.level}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-scientist-primary-400" />
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Expressors</div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{biomarkerData.patientStratification.highExpressors}%</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-yellow-400" />
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moderate</div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{biomarkerData.patientStratification.moderateExpressors}%</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-red-400" />
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Expressors</div>
          </div>
          <div className="text-3xl font-bold text-slate-100">{biomarkerData.patientStratification.lowExpressors}%</div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-scientist-primary-400" />
          Predictive Biomarkers
        </h3>
        <div className="flex flex-wrap gap-2">
          {biomarkerData.predictiveMarkers.map((marker, idx) => (
            <div key={idx} className="px-4 py-2 bg-scientist-primary-500/20 border border-scientist-primary-500/30 rounded-lg">
              <span className="text-scientist-primary-300 font-medium">{marker}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
