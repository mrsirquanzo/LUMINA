/**
 * Market Generate Report Section Component
 * Shows report generation options with tile layout
 * Matches Patent Agent GenerateReportSection design exactly
 */

import { FileText, BarChart3, DollarSign, Briefcase } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface MarketGenerateReportSectionProps {
  defaultOpen?: boolean;
  onGenerate?: (reportType: 'market-brief' | 'landscape' | 'valuation' | 'deal-memo') => void;
  asset?: string;
  documents?: Array<{ name: string }>;
}

const REPORT_TYPES = [
  { id: 'market-brief' as const, label: 'Market Brief', icon: FileText, description: 'Market Brief' },
  { id: 'landscape' as const, label: 'Landscape', icon: BarChart3, description: 'Competitive Landscape' },
  { id: 'valuation' as const, label: 'Valuation', icon: DollarSign, description: 'Valuation Analysis' },
  { id: 'deal-memo' as const, label: 'Deal Memo', icon: Briefcase, description: 'Deal Memo' },
];

export default function MarketGenerateReportSection({
  defaultOpen = false,
  onGenerate,
  asset,
  documents = [],
}: MarketGenerateReportSectionProps) {
  return (
    <CollapsibleSection
      title="Generate Report"
      icon={FileText}
      defaultOpen={defaultOpen}
    >
      <div className="grid grid-cols-2 gap-2">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={async () => {
                onGenerate?.(report.id);
                // Trigger report generation via API
                try {
                  const response = await fetch('/api/agents/market-research', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messages: [{
                        role: 'user',
                        content: `Generate a comprehensive ${report.description.toLowerCase()} for ${asset || 'the asset'}. Include all relevant market analysis sections.`,
                      }],
                      asset: asset,
                      analysisType: `report_${report.id}`,
                      documents: documents,
                    }),
                    credentials: 'include',
                  });

                  if (response.ok) {
                    const data = await response.json();
                    console.log('Report generated:', data);
                  }
                } catch (err) {
                  console.error('Report generation error:', err);
                }
              }}
              className="p-3 bg-teal-500/20 backdrop-blur border border-teal-500/30 rounded-lg hover:border-teal-500/50 hover:bg-teal-500/30 transition-colors text-center group"
            >
              <Icon size={16} className="text-teal-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-textPrimary font-medium">{report.label}</p>
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
