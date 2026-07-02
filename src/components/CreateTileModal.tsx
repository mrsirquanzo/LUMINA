/**
 * Create Tile Modal
 * Modal for creating a new tile from analysis results
 */

import { useState, useCallback } from 'react';
import { X, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { useTileStore } from '../lib/tiles/store';
import type { CreateTileRequest } from '../lib/tiles/types';
import type { TileSize } from '../lib/tiles/types';
import { WORKSPACES } from '../constants';

interface CreateTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (tileId: string) => void;
  initialData: {
    title: string;
    subtitle?: string;
    type: 'patent' | 'clinical' | 'financial' | 'regulatory' | 'market_research' | 'target_biology' | 'custom';
    agent: 'patent' | 'clinical' | 'financial' | 'regulatory' | 'market_research' | 'target_biology';
    sourceData: any;
    analysisData: any;
    qualityData?: any;
    ftoRiskData?: any;
  };
}

export default function CreateTileModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CreateTileModalProps) {
  const addTile = useTileStore((state) => state.addTile);
  const [title, setTitle] = useState(initialData.title);
  const [subtitle, setSubtitle] = useState(initialData.subtitle || '');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>(['current']);
  const [size, setSize] = useState<TileSize>('large');
  const [isCreating, setIsCreating] = useState(false);

  // Get available workspaces
  const availableWorkspaces = [
    { id: 'default', name: 'Default Workspace' },
    ...WORKSPACES.map((ws) => ({ 
      id: ws.id || ws.name.toLowerCase().replace(/\s+/g, '-'), 
      name: ws.name 
    })),
  ];

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      // Prepare tile data
      const tileRequest: CreateTileRequest = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        type: initialData.type,
        agent: initialData.agent,
        source: {
          analysisId: `analysis-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent: initialData.agent,
          sourceType: initialData.type === 'patent' ? 'patent_parsing' : 'agent_analysis',
          sourceData: initialData.sourceData,
        },
        data: {
          summary: {
            // Summary data for collapsed view
            patentNumber: initialData.analysisData?.document_info?.patent_number,
            totalClaims: initialData.analysisData?.claims_analysis?.total_claims,
            quality: initialData.qualityData?.overall_confidence,
          },
          detailed: initialData.analysisData,
          metadata: {
            quality: initialData.qualityData?.overall_confidence,
            confidence: initialData.qualityData?.overall_confidence,
            validationStatus: initialData.qualityData?.validation_status,
            extractionDate: new Date().toISOString(),
            qualityAssessment: initialData.qualityData,
            ftoRiskData: initialData.ftoRiskData,
          },
        },
        workspaceIds: selectedWorkspaces,
        size,
      };

      const newTile = addTile(tileRequest);

      if (onSuccess) {
        onSuccess(newTile.id);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create tile:', error);
    } finally {
      setIsCreating(false);
    }
  }, [title, subtitle, selectedWorkspaces, size, initialData, addTile, onSuccess, onClose]);

  const toggleWorkspace = useCallback((workspaceId: string) => {
    setSelectedWorkspaces((prev) =>
      prev.includes(workspaceId)
        ? prev.filter((id) => id !== workspaceId)
        : [...prev, workspaceId]
    );
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">Create New Tile</h2>
              <p className="text-sm text-textSecondary">Add this analysis to your dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-subtle rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-textSecondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Tile Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter tile title"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Subtitle (optional)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Brief description"
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Workspace Selection */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-3">
              Add to Workspace(s)
            </label>
            <div className="space-y-2">
              {availableWorkspaces.map((workspace) => (
                <label
                  key={workspace.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-subtle cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkspaces.includes(String(workspace.id))}
                    onChange={() => toggleWorkspace(String(workspace.id))}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-textPrimary">{workspace.name}</p>
                  </div>
                  {selectedWorkspaces.includes(String(workspace.id)) && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-3">
              Tile Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'full-width'] as TileSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    size === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-textSecondary hover:border-primary/30'
                  }`}
                >
                  {s === 'full-width' ? 'Full' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-textSecondary" />
              <p className="text-sm font-medium text-textSecondary">Analysis Type</p>
            </div>
            <p className="text-sm text-textSecondary capitalize">{initialData.type} Analysis</p>
            {initialData.analysisData?.document_info?.patent_number && (
              <p className="text-xs text-textSecondary mt-1">
                Patent: {initialData.analysisData.document_info.patent_number}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-textSecondary hover:bg-border rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Tile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
