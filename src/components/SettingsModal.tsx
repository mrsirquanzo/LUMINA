import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Keyboard, Upload } from 'lucide-react';
import { extractTileData } from '../lib/tiles/extractors';
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import type { AgentType } from '../lib/multiAgentTypes';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const getOrCreateWorkspace = useWorkspaceStore((s) => s.getOrCreateWorkspace);
  const addTile = useTileStore((s) => s.addTile);
  const updateTile = useTileStore((s) => s.updateTile);
  const tiles = useTileStore((s) => s.tiles);

  const activeWorkspaceForTiles = useMemo(() => {
    // TileStore uses `activeWorkspace` while WorkspaceStore uses `activeWorkspaceId`
    // In practice we keep these in sync, but prefer workspace store as source of truth.
    return activeWorkspaceId ? String(activeWorkspaceId) : null;
  }, [activeWorkspaceId]);

  function detectAgentFromFilenameOrContent(filename: string, content: string): AgentType | 'synthesis' | null {
    const name = filename.toLowerCase();
    const head = content.slice(0, 400).toLowerCase();

    if (name.includes('sonny') || head.includes("sonny's executive synthesis") || head.includes('sonny multi-agent')) return 'synthesis';
    if (name.includes('target-biology') || head.includes('target biology') || head.includes('tacstd2')) return 'target_biology';
    if (name.includes('clinical') || head.includes('clinical data analyst')) return 'clinical';
    if (name.includes('patent') || head.includes('ip strategist') || head.includes('fto')) return 'patent';
    if (name.includes('financial') || head.includes('financial analyst') || head.includes('rnpv')) return 'financial';
    if (name.includes('regulatory') || head.includes('regulatory')) return 'regulatory';
    if (name.includes('market') || head.includes('market research')) return 'market_research';

    return null;
  }

  function getTileTitle(agent: AgentType | 'synthesis', target = 'TROP2'): string {
    const prefix: Record<string, string> = {
      target_biology: 'Target Biology Analysis',
      clinical: 'Clinical Analysis',
      patent: 'Patent Analysis',
      financial: 'Financial Analysis',
      regulatory: 'Regulatory Analysis',
      market_research: 'Market Research Analysis',
      synthesis: 'Executive Summary',
    };
    return agent === 'synthesis' ? 'Executive Summary' : `${prefix[agent]}: ${target}`;
  }

  async function handleImportAgentExports(files: FileList | null) {
    if (!files || files.length === 0) return;
    setImportStatus('importing');
    setImportError('');

    try {
      // Ensure we have a workspace to attach imported tiles to.
      const workspaceId = activeWorkspaceForTiles || String(getOrCreateWorkspace('TROP2', 'TROP2').id);
      const analysisId = `import-${Date.now()}`;

      const fileArr = Array.from(files);
      for (const file of fileArr) {
        const content = await file.text();
        const agent = detectAgentFromFilenameOrContent(file.name, content);
        if (!agent) continue;

        const { data, source } = extractTileData(content, agent as any, analysisId);

        // If a tile for this agent already exists in the active workspace, update it.
        const existing = tiles.find((t) => t.agent === (agent as any) && t.workspaceIds.includes(workspaceId));
        if (existing) {
          updateTile(existing.id, {
            title: getTileTitle(agent as any),
            subtitle: `Imported from ${file.name}`,
            data,
            source: { ...source, analysisId: existing.source.analysisId }, // preserve analysis grouping if desired
            updatedAt: new Date().toISOString(),
          });
          continue;
        }

        addTile({
          title: getTileTitle(agent as any),
          subtitle: `Imported from ${file.name}`,
          type: agent === 'synthesis' ? ('custom' as any) : (agent as any),
          agent: agent as any,
          source,
          data,
          workspaceIds: [workspaceId],
          size: agent === 'synthesis' ? ('full-width' as any) : 'large',
        });
      }

      setImportStatus('success');
      window.setTimeout(() => setImportStatus('idle'), 2500);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setImportStatus('error');
      setImportError(e instanceof Error ? e.message : 'Import failed');
    }
  }

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

                <div>
                  <h3 className="text-sm font-medium text-textSecondary mb-2">Import agent responses</h3>
                  <p className="text-xs text-textSecondary mb-3">
                    Upload exported agent Markdown (e.g. <code className="text-textSecondary">*_live.md</code>) to populate/update tiles.
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".md,.txt"
                      onChange={(e) => handleImportAgentExports(e.target.files)}
                      className="block w-full text-xs text-textSecondary file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border file:border-border file:bg-subtle file:text-textSecondary hover:file:bg-border"
                      disabled={importStatus === 'importing'}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importStatus === 'importing'}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-subtle hover:bg-border border border-border text-textSecondary text-sm disabled:opacity-50"
                      title="Choose files"
                    >
                      <Upload className="w-4 h-4" />
                      {importStatus === 'importing' ? 'Importing…' : 'Browse'}
                    </button>
                  </div>

                  {importStatus === 'success' && (
                    <p className="mt-2 text-xs text-green-400">Imported successfully — tiles updated.</p>
                  )}
                  {importStatus === 'error' && (
                    <p className="mt-2 text-xs text-red-400">Import failed: {importError}</p>
                  )}
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

