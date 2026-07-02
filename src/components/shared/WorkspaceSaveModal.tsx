/**
 * Workspace Save Modal
 * Prompts user to save current analysis as a workspace
 */

import { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface WorkspaceSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workspaceName: string) => void;
  onSkip: () => void;
  workspaceName?: string;
  tileCount?: number;
}

export default function WorkspaceSaveModal({
  isOpen,
  onClose,
  onSave,
  onSkip,
  workspaceName: initialWorkspaceName,
  tileCount = 0,
}: WorkspaceSaveModalProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName || '');

  // Update workspace name when initial value changes
  useEffect(() => {
    if (initialWorkspaceName) {
      setWorkspaceName(initialWorkspaceName);
    }
  }, [initialWorkspaceName]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWorkspaceName(initialWorkspaceName || '');
    }
  }, [isOpen, initialWorkspaceName]);

  const handleSave = () => {
    if (workspaceName.trim()) {
      onSave(workspaceName.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && workspaceName.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-card max-w-md w-full mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-textPrimary">Save as Workspace?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-subtle rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-textSecondary">
            Would you like to save this analysis as a workspace? This will allow you to access it later from the sidebar.
          </p>

          <div className="space-y-2">
            <label htmlFor="workspace-name" className="block text-sm font-medium text-textSecondary">
              Workspace name:
            </label>
            <input
              id="workspace-name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter workspace name..."
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-textPrimary placeholder-textTertiary bg-surface"
              autoFocus
            />
            {tileCount > 0 && (
              <p className="text-xs text-textTertiary mt-1">{tileCount} tile{tileCount !== 1 ? 's' : ''} will be saved</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-border bg-subtle">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-2.5 text-textSecondary bg-surface border border-border rounded-lg hover:bg-subtle transition-colors font-medium"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!workspaceName.trim()}
            className="tactile flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

