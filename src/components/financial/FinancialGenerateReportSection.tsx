/**
 * Financial Generate Report Section Component
 * Quick access to different financial report types
 */

import { FileText, BookOpen, Scale, Briefcase } from 'lucide-react';
import CollapsibleSection from '../shared/CollapsibleSection';

interface ReportTemplate {
  id: string;
  label: string;
  icon: typeof FileText;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'ic_memo', label: 'IC Memo', icon: FileText },
  { id: 'board_deck', label: 'Board Deck', icon: BookOpen },
  { id: 'fairness_letter', label: 'Fairness Letter', icon: Scale },
  { id: 'deal_summary', label: 'Deal Summary', icon: Briefcase },
];

interface FinancialGenerateReportSectionProps {
  defaultOpen?: boolean;
  onGenerate?: (reportType: string) => void;
}

export default function FinancialGenerateReportSection({
  defaultOpen = false,
  onGenerate,
}: FinancialGenerateReportSectionProps) {
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
              className="p-3 bg-green-500/20 backdrop-blur border border-green-500/30 rounded-lg hover:border-green-500/50 hover:bg-green-500/30 transition-colors text-center group"
            >
              <Icon size={16} className="text-green-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-textPrimary font-medium">{template.label}</p>
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
