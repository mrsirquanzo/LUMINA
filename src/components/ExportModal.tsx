import { useEffect } from 'react';
import { X, FileDown, Presentation, File } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport?: (format: 'pdf' | 'pptx' | 'docx') => void;
}

export default function ExportModal({ open, onClose, onExport }: ExportModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

  const handleExport = (format: 'pdf' | 'pptx' | 'docx') => {
    if (onExport) {
      onExport(format);
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-surfaceElevated border border-white/10 rounded-2xl shadow-2xl animate-modal-enter">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-textPrimary">Export Report</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface text-textSecondary hover:text-textPrimary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-lg hover:bg-surfaceHighlight transition-colors text-left"
            >
              <div className="p-3 bg-danger/20 rounded-lg">
                <FileDown className="w-6 h-6 text-danger" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-textPrimary">Export as PDF</p>
                <p className="text-xs text-textTertiary">Portable document format</p>
              </div>
            </button>

            <button
              onClick={() => handleExport('pptx')}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-lg hover:bg-surfaceHighlight transition-colors text-left"
            >
              <div className="p-3 bg-warning/20 rounded-lg">
                <Presentation className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-textPrimary">Export as PowerPoint</p>
                <p className="text-xs text-textTertiary">Presentation deck</p>
              </div>
            </button>

            <button
              onClick={() => handleExport('docx')}
              className="w-full flex items-center gap-4 p-4 bg-surface rounded-lg hover:bg-surfaceHighlight transition-colors text-left"
            >
              <div className="p-3 bg-info/20 rounded-lg">
                <File className="w-6 h-6 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-textPrimary">Export as Word</p>
                <p className="text-xs text-textTertiary">Document format</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
