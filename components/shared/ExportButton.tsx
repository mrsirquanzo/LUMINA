'use client';

import { useState } from 'react';
import { exportChat, ChatMessage, ExportOptions } from '@/lib/chatExport';
import { FiDownload, FiChevronDown } from 'react-icons/fi';

interface ExportButtonProps {
  messages: ChatMessage[];
  agentName: string;
  disabled?: boolean;
}

export default function ExportButton({ messages, agentName, disabled }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv' | 'text') => {
    if (messages.length === 0) {
      alert('No messages to export');
      return;
    }

    setIsExporting(true);
    setShowMenu(false);

    try {
      const options: ExportOptions = {
        format,
        agentName,
        includeMeta: true,
        includeTimestamps: true,
      };

      exportChat(messages, options);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isEmpty || isExporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          disabled || isEmpty || isExporting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <FiDownload className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isExporting ? 'Exporting...' : 'Export Chat'}
        </span>
        <FiChevronDown className="w-4 h-4" />
      </button>

      {showMenu && !disabled && !isEmpty && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export as PDF
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as CSV
              </button>

              <button
                onClick={() => handleExport('text')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Export as Text
              </button>
            </div>

            <div className="border-t border-gray-200 px-4 py-2">
              <p className="text-xs text-gray-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''} will be exported
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
