'use client';

import { useState } from 'react';
import { FiDownload, FiChevronDown } from 'react-icons/fi';
import type { ChatMessage } from '@/lib/pdfExport';
import { exportToPDF, exportToCSV, exportToText } from '@/lib/pdfExport';

interface ExportButtonProps {
  messages: ChatMessage[];
  agentName: string;
  className?: string;
}

export default function ExportButton({ messages, agentName, className = '' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'text') => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      switch (format) {
        case 'pdf':
          await exportToPDF(messages, agentName);
          break;
        case 'csv':
          exportToCSV(messages, agentName);
          break;
        case 'text':
          exportToText(messages, agentName);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || messages.length === 0}
        className={`
          px-3 py-2 bg-white border border-gray-300 rounded-md
          hover:bg-gray-50 transition-colors
          flex items-center gap-2 text-sm font-medium shadow-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'bg-gray-50' : ''}
        `}
      >
        <FiDownload className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        {messages.length > 0 && (
          <span className="text-gray-500">({messages.length})</span>
        )}
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown content */}
          <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100"
            >
              <div className="mt-0.5">📄</div>
              <div>
                <div className="font-medium text-gray-900">Export as PDF</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Professional report format
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100"
            >
              <div className="mt-0.5">📊</div>
              <div>
                <div className="font-medium text-gray-900">Export as CSV</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Spreadsheet compatible
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('text')}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-start gap-3"
            >
              <div className="mt-0.5">📝</div>
              <div>
                <div className="font-medium text-gray-900">Export as Text</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Markdown format
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
