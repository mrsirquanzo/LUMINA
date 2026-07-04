import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'shortcuts'>('general');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border shadow-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-semibold text-textPrimary">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-subtle rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-textSecondary" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { id: 'general', label: 'General' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'shortcuts', label: 'Shortcuts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-textSecondary hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <p className="text-sm text-textSecondary">General settings coming soon...</p>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-textSecondary mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-3">
                  {[
                    { keys: '⌘/Ctrl + K', action: 'Open search' },
                    { keys: 'Esc', action: 'Close modals' },
                  ].map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 bg-subtle rounded-lg"
                    >
                      <span className="text-sm text-textSecondary">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-surface border border-border rounded text-xs font-mono text-textSecondary">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-textSecondary mb-4">Appearance</h3>
                <p className="text-sm text-textSecondary">
                  Appearance settings coming soon...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;

