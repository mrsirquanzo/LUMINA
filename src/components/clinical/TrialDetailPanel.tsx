/**
 * Trial Detail Panel Component
 * Shows detailed information about a clinical trial
 */

import { X, BarChart3, Download, Bell, Check, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrialDetailPanelProps {
  trial?: {
    nctNumber?: string;
    phase?: string;
    status?: string;
    indication?: string;
    sponsor?: string;
    drug?: string;
    primaryEndpoint?: string;
    sampleSize?: string;
    expectedCompletion?: string;
  };
  onClose: () => void;
}

// Design Quality Indicator
const DesignQualityItem = ({ label, value, checked }: { label: string; value: string; checked: boolean }) => (
  <div className="flex flex-col items-center p-3 bg-surfaceElevated rounded-lg border border-white/10">
    <span className="text-xs text-textSecondary mb-1">{label}</span>
    <span className="text-sm font-medium text-textPrimary">{value}</span>
    {checked && <Check size={16} className="text-emerald-400 mt-1" />}
  </div>
);

// Timeline marker component
const TimelineMarker = ({ label, date, active = false, completed = false }: { label: string; date: string; active?: boolean; completed?: boolean }) => (
  <div className="flex flex-col items-center">
    <div className={`w-3 h-3 rounded-full ${
      completed ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-textTertiary'
    }`} />
    <span className="text-xs font-medium text-textPrimary mt-1">{label}</span>
    <span className="text-xs text-textSecondary">{date}</span>
  </div>
);

export default function TrialDetailPanel({ trial, onClose }: TrialDetailPanelProps) {
  const trialData = trial || {
    nctNumber: 'NCT04294810',
    phase: 'Phase 3',
    status: 'Recruiting',
    indication: 'NASH',
    sponsor: 'Novo Nordisk',
    drug: 'Semaglutide 2.4mg',
    primaryEndpoint: 'NASH resolution + fibrosis improvement',
    sampleSize: '1,200 patients',
    expectedCompletion: 'Dec 2024',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute inset-0 bg-surface z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">{trialData.nctNumber}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                {trialData.phase}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                {trialData.status}
              </span>
              <span className="text-sm text-textSecondary">{trialData.indication}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surfaceElevated rounded-lg transition-colors"
          >
            <X size={20} className="text-textSecondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Trial Overview */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Trial Overview</h3>
          <div className="bg-surfaceElevated rounded-lg p-4 space-y-2 border border-white/10">
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Sponsor</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.sponsor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Drug</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.drug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Indication</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.indication}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Primary Endpoint</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.primaryEndpoint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Sample Size</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.sampleSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-textSecondary">Expected Completion</span>
              <span className="text-sm font-medium text-textPrimary">{trialData.expectedCompletion}</span>
            </div>
          </div>
        </div>

        {/* Design Quality */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Design Quality</h3>
          <div className="grid grid-cols-4 gap-2">
            <DesignQualityItem label="Randomization" value="Yes" checked={true} />
            <DesignQualityItem label="Blinding" value="Double" checked={true} />
            <DesignQualityItem label="Control" value="Placebo" checked={true} />
            <DesignQualityItem label="Endpoint" value="Accepted" checked={true} />
          </div>
        </div>

        {/* Key Dates Timeline */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Key Dates</h3>
          <div className="relative">
            <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-white/10" />
            <div className="relative flex justify-between">
              <TimelineMarker label="Start" date="Jan 22" completed={true} />
              <TimelineMarker label="Enrollment" date="Mar 23" completed={true} />
              <TimelineMarker label="Primary" date="Dec 24" active={true} />
              <TimelineMarker label="Final" date="Jun 25" />
            </div>
          </div>
        </div>

        {/* Efficacy Endpoints */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Endpoints</h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <p className="text-sm font-medium text-blue-400">Primary</p>
              <p className="text-sm text-textSecondary mt-1">NASH resolution without worsening fibrosis (histologic)</p>
            </div>
            <div className="p-3 bg-surfaceElevated rounded-lg border border-white/10">
              <p className="text-sm font-medium text-textPrimary">Key Secondary</p>
              <p className="text-sm text-textSecondary mt-1">≥1 stage fibrosis improvement, HbA1c, body weight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-white/10 bg-surfaceElevated">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <BarChart3 size={16} />
            Full Analysis
          </button>
          <button className="px-4 py-2 bg-surface border border-white/10 text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <Download size={16} />
            Download
          </button>
          <button className="px-4 py-2 bg-surface border border-white/10 text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <Bell size={16} />
            Set Alert
          </button>
        </div>
      </div>
    </motion.div>
  );
}
