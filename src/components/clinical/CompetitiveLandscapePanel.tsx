/**
 * Competitive Landscape Detail Panel Component
 * Shows competitive landscape analysis
 */

import { X, BarChart3, Calendar, Download, TrendingUp, Info, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompetitiveLandscapePanelProps {
  landscape?: {
    title?: string;
    indication?: string;
    programCount?: number;
  };
  onClose: () => void;
}

// Competitive table row
const CompetitorRow = ({ drug, company, stage, efficacy, status }: { drug: string; company: string; stage: string; efficacy: string; status: 'leader' | 'watch' | 'lagging' }) => {
  const statusConfig = {
    leader: { color: 'bg-emerald-500/20 text-emerald-400', label: '🟢 Leader' },
    watch: { color: 'bg-amber-500/20 text-amber-400', label: '🟡 Watch' },
    lagging: { color: 'bg-red-500/20 text-red-400', label: '🔴 Lagging' }
  };
  
  const config = statusConfig[status] || statusConfig.watch;
  
  return (
    <tr className="border-b border-white/10 hover:bg-surfaceElevated transition-colors">
      <td className="py-2 px-3 text-sm font-medium text-textPrimary">{drug}</td>
      <td className="py-2 px-3 text-sm text-textSecondary">{company}</td>
      <td className="py-2 px-3 text-sm text-textSecondary">{stage}</td>
      <td className="py-2 px-3 text-sm text-textSecondary">{efficacy}</td>
      <td className="py-2 px-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </td>
    </tr>
  );
};

export default function CompetitiveLandscapePanel({ landscape, onClose }: CompetitiveLandscapePanelProps) {
  const landscapeData = landscape || {
    title: 'GLP-1 RA Competitive Landscape',
    indication: 'Obesity & Metabolic',
    programCount: 12,
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
            <h2 className="text-lg font-semibold text-textPrimary">{landscapeData.title}</h2>
            <p className="text-sm text-textSecondary mt-1">{landscapeData.indication} | {landscapeData.programCount} Programs</p>
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
        {/* Market Leaders Table */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Market Leaders</h3>
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-surfaceElevated">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-textSecondary">Drug</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-textSecondary">Company</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-textSecondary">Stage</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-textSecondary">% WL</th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-textSecondary">Status</th>
                </tr>
              </thead>
              <tbody>
                <CompetitorRow drug="Tirzepatide" company="Lilly" stage="Approved" efficacy="22%" status="leader" />
                <CompetitorRow drug="Semaglutide 2.4" company="Novo" stage="Approved" efficacy="15%" status="leader" />
                <CompetitorRow drug="Retatrutide" company="Lilly" stage="Phase 3" efficacy="24%" status="watch" />
                <CompetitorRow drug="Orforglipron" company="Lilly" stage="Phase 3" efficacy="14%" status="watch" />
                <CompetitorRow drug="Cagrisema" company="Novo" stage="Phase 3" efficacy="20%" status="watch" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Differentiation Matrix */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Differentiation Axes</h3>
          <div className="bg-surfaceElevated rounded-lg p-4 border border-white/10">
            <div className="aspect-square relative max-w-[300px] mx-auto">
              {/* Axes */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-medium text-textSecondary">Efficacy</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-medium text-textSecondary">Efficacy</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-medium text-textSecondary">Safety</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-textSecondary">Convenience</div>
              
              {/* Center lines */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              
              {/* Drug positions (simplified representation) */}
              <div className="absolute top-[20%] left-[70%] w-3 h-3 bg-blue-600 rounded-full" title="Tirzepatide" />
              <div className="absolute top-[25%] left-[35%] w-3 h-3 bg-blue-500 rounded-full" title="Retatrutide" />
              <div className="absolute top-[30%] left-[30%] w-3 h-3 bg-emerald-500 rounded-full" title="Cagrisema" />
              <div className="absolute top-[45%] left-[45%] w-3 h-3 bg-amber-500 rounded-full" title="Semaglutide" />
              <div className="absolute top-[50%] left-[75%] w-3 h-3 bg-pink-500 rounded-full" title="Orforglipron" />
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-xs text-textSecondary">Tirzepatide</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-textSecondary">Retatrutide</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs text-textSecondary">Cagrisema</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-xs text-textSecondary">Semaglutide</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-500 rounded-full" />
                <span className="text-xs text-textSecondary">Orforglipron</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-3">Key Insights</h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
              <TrendingUp size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">Triple agonists setting new efficacy bar (20%+ weight loss)</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">Oral delivery could be key differentiator for adherence</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Activity size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">CV outcomes data reshaping reimbursement landscape</p>
            </div>
          </div>
        </div>

        {/* Cross-Trial Comparison Caveat */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Cross-Trial Comparison Limitations</p>
              <p className="text-xs text-textSecondary mt-1">
                Direct comparisons limited by differences in patient populations,
                trial designs, endpoint definitions, and assessment schedules.
              </p>
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
            <Calendar size={16} />
            Timeline
          </button>
          <button className="px-4 py-2 bg-surface border border-white/10 text-textPrimary rounded-lg font-medium text-sm hover:bg-surfaceElevated transition-colors flex items-center justify-center gap-2">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
    </motion.div>
  );
}
