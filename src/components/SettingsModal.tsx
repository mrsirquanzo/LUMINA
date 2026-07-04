import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayLanding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onReplayLanding,
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
                <div>
                  <h3 className="text-sm font-medium text-textSecondary mb-4">Animation</h3>
                  <button
                    onClick={onReplayLanding}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-subtle hover:bg-border border border-border rounded-lg transition-colors group"
                  >
                    <Play className="w-5 h-5 text-textSecondary group-hover:text-primary" />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-textPrimary">Replay Landing Animation</div>
                      <div className="text-xs text-textSecondary mt-1">
                        Watch the intro animation again
                      </div>
                    </div>
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-textSecondary mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-3">
                  {[
                    { keys: '⌘/Ctrl + K', action: 'Search / Toggle Sonny panel' },
                    { keys: '⌘/Ctrl + 1', action: 'Switch to Scientist view' },
                    { keys: '⌘/Ctrl + 2', action: 'Switch to Scout view' },
                    { keys: '⌘/Ctrl + E', action: 'Open Export modal' },
                    { keys: '⌘/Ctrl + J', action: 'Toggle Sonny panel' },
                    { keys: '⌘/Ctrl + R', action: 'Replay landing animation' },
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

