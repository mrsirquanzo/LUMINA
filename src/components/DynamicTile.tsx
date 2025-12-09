/**
 * Dynamic Tile Component
 * Renders user-created tiles using templates
 */

import { useState } from 'react';
import { Trash2, Edit2, MoreVertical, Pin, PinOff } from 'lucide-react';
import Tile from './Tile';
import { useTileStore } from '../lib/tiles/store';
import { getTileTemplate } from '../lib/tiles/templates/index';
import type { UserTile } from '../lib/tiles/types';
import PatentFullAnalysisPanel from './patent/PatentFullAnalysisPanel';
import type { PatentExtractionResult } from '../lib/patentParsing/types';
import type { QualityAssessment } from '../lib/patentParsing/qualityAssurance';

interface DynamicTileProps {
  tile: UserTile;
  onRemove?: (tileId: string) => void;
}

export default function DynamicTile({ tile, onRemove }: DynamicTileProps) {
  const updateTile = useTileStore((state) => state.updateTile);
  const removeTile = useTileStore((state) => state.removeTile);
  const template = getTileTemplate(tile.type);
  const [isExpanded, setIsExpanded] = useState(!tile.isCollapsed);
  const [showFullPanel, setShowFullPanel] = useState(false);

  // Get agent info for icon/color
  const agentInfo = {
    patent: { icon: '⚖️', color: 'purple' },
    clinical: { icon: '🔬', color: 'blue' },
    financial: { icon: '💰', color: 'green' },
    regulatory: { icon: '📋', color: 'orange' },
    market_research: { icon: '📊', color: 'teal' },
    target_biology: { icon: '🧬', color: 'emerald' },
  }[tile.agent] || { icon: '📄', color: 'gray' };

  // Render content based on template
  const renderContent = () => {
    if (!template) {
      // Fallback: generic tile
      return (
        <div className="p-4">
          <p className="text-sm text-gray-600">{tile.subtitle || 'No template available'}</p>
          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(tile.data.summary, null, 2)}
          </pre>
        </div>
      );
    }

    // Use template to render
    try {
      if (isExpanded) {
        // For patent tiles, pass onOpenFullPanel callback
        if (tile.type === 'patent') {
          return template.renderDetailed(tile.data, () => setShowFullPanel(true));
        }
        return template.renderDetailed(tile.data);
      } else {
        return template.renderSummary(tile.data);
      }
    } catch (error) {
      console.error('Error rendering tile template:', error);
      return (
        <div className="p-4">
          <p className="text-sm text-red-600">Error rendering tile content</p>
        </div>
      );
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    updateTile(tile.id, { isCollapsed: !isExpanded });
  };

  const handleTogglePin = () => {
    updateTile(tile.id, { isPinned: !tile.isPinned });
  };

  const handleRemove = () => {
    if (window.confirm(`Remove tile "${tile.title}"?`)) {
      removeTile(tile.id);
      if (onRemove) {
        onRemove(tile.id);
      }
    }
  };

  // Calculate grid span based on size
  const getGridSpan = () => {
    switch (tile.position.size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 xl:col-span-2';
      case 'full-width':
        return 'col-span-1 md:col-span-2 xl:col-span-4';
      default:
        return 'col-span-1 md:col-span-2';
    }
  };

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        onClick={handleTogglePin}
        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        title={tile.isPinned ? 'Unpin' : 'Pin to top'}
      >
        {tile.isPinned ? (
          <Pin className="w-4 h-4 text-gray-500" />
        ) : (
          <PinOff className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <button
        onClick={handleRemove}
        className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-600"
        title="Remove tile"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // Get patent data for full panel
  const patentData = tile.type === 'patent' ? (tile.data.detailed as PatentExtractionResult) : null;
  const qualityData = tile.type === 'patent' ? (tile.data.metadata.qualityAssessment as QualityAssessment | undefined) : undefined;
  const ftoRiskData = tile.type === 'patent' ? (tile.data.metadata.ftoRiskData as any) : undefined;

  return (
    <>
      <div className={getGridSpan()}>
        <Tile
          title={tile.title}
          subtitle={tile.subtitle}
          icon={<span className="text-2xl">{agentInfo.icon}</span>}
          tileType={tile.type as any}
          headerRight={headerActions}
          dataFreshness={new Date(tile.updatedAt).toLocaleDateString()}
          aiGenerated={true}
          className={`border-2 ${
            tile.isPinned
              ? 'border-purple-300 bg-purple-50/30'
              : 'border-gray-200'
          }`}
        >
          <div>
            {renderContent()}
          </div>
        </Tile>
      </div>

      {/* Full Analysis Panel for Patent Tiles */}
      {tile.type === 'patent' && patentData && showFullPanel && (
        <PatentFullAnalysisPanel
          patentData={patentData}
          qualityData={qualityData}
          ftoRiskData={ftoRiskData}
          onClose={() => setShowFullPanel(false)}
        />
      )}
    </>
  );
}
