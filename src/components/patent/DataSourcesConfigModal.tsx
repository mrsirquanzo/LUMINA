/**
 * Data Sources Configuration Modal
 * Allows users to configure patent database connections
 */

import { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DataSource {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  apiKey?: string;
  endpoint?: string;
}

interface DataSourcesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  onUpdate: (sources: DataSource[]) => void;
}

export default function DataSourcesConfigModal({
  isOpen,
  onClose,
  dataSources,
  onUpdate,
}: DataSourcesConfigModalProps) {
  const [sources, setSources] = useState<DataSource[]>(dataSources);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((source) =>
        source.id === id
          ? {
              ...source,
              status: source.status === 'connected' ? 'disconnected' : 'connecting',
            }
          : source
      )
    );

    // Simulate connection
    setTimeout(() => {
      setSources((prev) =>
        prev.map((source) =>
          source.id === id && source.status === 'connecting'
            ? { ...source, status: 'connected' }
            : source
        )
      );
    }, 1000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 500));
    onUpdate(sources);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl mx-4 bg-surface border border-border rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Database size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-textPrimary">Configure Data Sources</h2>
                <p className="text-sm text-textSecondary">Manage patent database connections</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surfaceElevated rounded-lg transition-colors"
            >
              <X size={20} className="text-textSecondary" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-4 bg-surfaceElevated border border-border rounded-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-textPrimary">{source.name}</h3>
                    {source.status === 'connected' && (
                      <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Connected
                      </span>
                    )}
                    {source.status === 'connecting' && (
                      <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs font-medium rounded-full flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        Connecting...
                      </span>
                    )}
                    {source.status === 'disconnected' && (
                      <span className="px-2 py-0.5 bg-textTertiary/20 text-textTertiary text-xs font-medium rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        Disconnected
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleSource(source.id)}
                    disabled={source.status === 'connecting'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      source.status === 'connected'
                        ? 'bg-danger/20 text-danger hover:bg-danger/30'
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {source.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                {source.status === 'connected' && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    <div className="text-xs text-textSecondary">
                      <strong>Endpoint:</strong> {source.endpoint || 'Default API endpoint'}
                    </div>
                    {source.apiKey && (
                      <div className="text-xs text-textSecondary">
                        <strong>API Key:</strong> ••••••••••••••••
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-warning mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-warning mb-1">API Configuration</h4>
                  <p className="text-xs text-textSecondary">
                    Some data sources may require API keys or authentication. Configure these in your
                    environment variables or contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surfaceElevated border border-border rounded-lg text-textPrimary hover:border-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
