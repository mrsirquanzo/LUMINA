/**
 * Clinical Generate Report Section Component
 * Shows report generation options
 */

import { FileText, BarChart3, Swords, ClipboardList, ArrowRight } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface ClinicalGenerateReportSectionProps {
  defaultOpen?: boolean;
  onGenerate?: (reportType: 'target' | 'clinical' | 'competitive' | 'deal') => void;
  target?: string;
  documents?: Array<{ name: string }>;
}

const REPORT_TYPES = [
  { id: 'target' as const, label: 'Target', icon: FileText, description: 'Target Report' },
  { id: 'clinical' as const, label: 'Clinical', icon: BarChart3, description: 'Clinical Summary' },
  { id: 'competitive' as const, label: 'Compet.', icon: Swords, description: 'Competitive Landscape' },
  { id: 'deal' as const, label: 'Deal', icon: ClipboardList, description: 'Deal Memo' },
];

export default function ClinicalGenerateReportSection({
  defaultOpen = false,
  onGenerate,
  target,
  documents = [],
}: ClinicalGenerateReportSectionProps) {
  return (
    <CollapsibleSection
      title="Generate Report"
      icon={ArrowRight}
      defaultOpen={defaultOpen}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-textSecondary">Comprehensive analysis reports</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={async () => {
                onGenerate?.(report.id);
                // Trigger report generation via API
                try {
                  const response = await fetch('/api/agents/clinical-analyst', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      messages: [{
                        role: 'user',
                        content: `Generate a comprehensive ${report.description.toLowerCase()} for ${target || 'the target'}. Include all relevant analysis sections.`,
                      }],
                      target: target,
                      analysisType: `report_${report.id}`,
                      documents: documents,
                    }),
                    credentials: 'include',
                  });

                  if (response.ok) {
                    const data = await response.json();
                    // Could open a modal or download the report
                    console.log('Report generated:', data);
                  }
                } catch (err) {
                  console.error('Report generation error:', err);
                }
              }}
              className="flex flex-col items-center gap-1 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <Icon size={20} className="text-purple-400" />
              <span className="text-xs text-purple-400 font-medium text-center">{report.label}</span>
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
