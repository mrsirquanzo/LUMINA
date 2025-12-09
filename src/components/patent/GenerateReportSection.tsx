/**
 * Generate Report Section Component
 * Quick access to different report types
 */

import { FileText, BarChart3, Dna, Briefcase, ArrowRight } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface ReportTemplate {
  id: string;
  label: string;
  icon: typeof FileText;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'fto', label: 'FTO Report', icon: FileText },
  { id: 'landscape', label: 'Landscape', icon: BarChart3 },
  { id: 'sequences', label: 'Sequences', icon: Dna },
  { id: 'deal_memo', label: 'Deal Memo', icon: Briefcase },
];

interface GenerateReportSectionProps {
  defaultOpen?: boolean;
  onGenerate?: (reportType: string) => void;
}

export default function GenerateReportSection({
  defaultOpen = false,
  onGenerate,
}: GenerateReportSectionProps) {
  return (
    <CollapsibleSection
      title="Generate Report"
      icon={FileText}
      defaultOpen={defaultOpen}
    >
      <div className="grid grid-cols-2 gap-2">
        {REPORT_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onGenerate?.(template.id)}
              className="p-3 bg-primary/20 backdrop-blur border border-primary/30 rounded-lg hover:border-primary/50 hover:bg-primary/30 transition-colors text-center group"
            >
              <Icon size={16} className="text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-textPrimary font-medium">{template.label}</p>
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
