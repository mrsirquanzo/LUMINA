/**
 * Regulatory Generate Report Section Component
 * Shows report generation options with tile layout
 * Matches Patent Agent GenerateReportSection design exactly
 */

import { FileText, Calendar, AlertTriangle, Scale } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface RegulatoryGenerateReportSectionProps {
  defaultOpen?: boolean;
  onGenerate?: (reportType: 'regulatory-brief' | 'pathway-analysis' | 'risk-assessment' | 'label-strategy') => void;
  asset?: string;
  documents?: Array<{ name: string }>;
}

const REPORT_TYPES = [
  { id: 'regulatory-brief' as const, label: 'Regulatory Brief', icon: FileText, description: 'Regulatory Brief' },
  { id: 'pathway-analysis' as const, label: 'Pathway Analysis', icon: Calendar, description: 'Pathway Analysis' },
  { id: 'risk-assessment' as const, label: 'Risk Assessment', icon: AlertTriangle, description: 'Risk Assessment' },
  { id: 'label-strategy' as const, label: 'Label Strategy', icon: Scale, description: 'Label Strategy' },
];

export default function RegulatoryGenerateReportSection({
  defaultOpen = false,
  onGenerate,
  asset,
  documents = [],
}: RegulatoryGenerateReportSectionProps) {
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
                  const response = await fetch('/api/agents/regulatory', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messages: [{
                        role: 'user',
                        content: `Generate a comprehensive ${report.description.toLowerCase()} for ${asset || 'the asset'}. Include all relevant regulatory analysis sections.`,
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
              className="p-3 bg-orange-500/20 backdrop-blur border border-orange-500/30 rounded-lg hover:border-orange-500/50 hover:bg-orange-500/30 transition-colors text-center group"
            >
              <Icon size={16} className="text-orange-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-textPrimary font-medium">{report.label}</p>
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
