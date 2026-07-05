import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, FileText, Presentation, FileSpreadsheet,
  Share2, Mail, ChevronDown, Check,
} from 'lucide-react';

interface ExportOption {
  id: string;
  label: string;
  icon: React.ElementType;
  format: string;
  description?: string;
}

interface ExportDropdownProps {
  themeColor: 'blue' | 'purple' | 'green' | 'cyan' | 'orange' | 'emerald';
  onExport: (format: string) => void;
  isExporting?: boolean;
  availableFormats?: string[];
}

const allExportOptions: ExportOption[] = [
  { id: 'pdf', label: 'PDF Report', icon: FileText, format: 'pdf', description: 'Comprehensive analysis report' },
  { id: 'pptx', label: 'PowerPoint', icon: Presentation, format: 'pptx', description: 'Presentation-ready slides' },
  { id: 'docx', label: 'Word Document', icon: FileText, format: 'docx', description: 'Editable document' },
  { id: 'xlsx', label: 'Excel Spreadsheet', icon: FileSpreadsheet, format: 'xlsx', description: 'Data tables and charts' },
  { id: 'share', label: 'Share Link', icon: Share2, format: 'share', description: 'Generate shareable link' },
  { id: 'email', label: 'Email Report', icon: Mail, format: 'email', description: 'Send via email' },
];

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  themeColor,
  onExport,
  isExporting = false,
  availableFormats = ['pdf', 'pptx', 'docx', 'xlsx', 'share', 'email'],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const exportOptions = useMemo(
    () => allExportOptions.filter((opt) => availableFormats.includes(opt.id)),
    [availableFormats]
  );

  const handleExport = (format: string) => {
    setSelectedFormat(format);
    onExport(format);
    setTimeout(() => {
      setIsOpen(false);
      setSelectedFormat(null);
    }, 1500);
  };

  const borderColorClasses = {
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    green: 'border-green-500/20 hover:border-green-500/40',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40',
    orange: 'border-orange-500/20 hover:border-orange-500/40',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
  };

  const iconBgClasses = {
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
    cyan: 'bg-cyan-500/10',
    orange: 'bg-orange-500/10',
    emerald: 'bg-emerald-500/10',
  };

  return (
    <div className={`rounded-xl border ${borderColorClasses[themeColor]} overflow-hidden transition-colors`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <Download className={`w-5 h-5 ${iconColorClasses[themeColor]}`} />
          <span className="text-sm font-medium text-gray-300">Export</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-3 grid grid-cols-1 gap-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.format)}
                  disabled={isExporting && selectedFormat === option.format}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group disabled:opacity-50"
                >
                  <div className={`p-2 rounded-lg ${iconBgClasses[themeColor]}`}>
                    <option.icon className={`w-4 h-4 ${iconColorClasses[themeColor]}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    {option.description && (
                      <p className="text-xs text-gray-500">{option.description}</p>
                    )}
                  </div>
                  {selectedFormat === option.format && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

