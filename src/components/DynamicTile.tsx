/**
 * Dynamic Tile Component
 * Renders user-created tiles using templates
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Pin, PinOff } from 'lucide-react';
import Tile from './Tile';
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import { getTileTemplate, getTemplateByAgent } from '../lib/tiles/templates/index';
import type { UserTile } from '../lib/tiles/types';
import { AGENT_INFO } from '../lib/customAgentTeams';
import type { AgentType } from '../lib/multiAgentTypes';
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
  // Try to get template by type first, then by agent (for custom types like executive summary)
  const template = getTileTemplate(tile.type) || getTemplateByAgent(tile.agent);
  const [showFullPanel, setShowFullPanel] = useState(false);
  const isExpanded = !tile.isCollapsed;

  // Get agent info for icon/color
  const agentInfo = tile.agent && AGENT_INFO[tile.agent as AgentType]
    ? {
        icon: AGENT_INFO[tile.agent as AgentType].icon,
        name: AGENT_INFO[tile.agent as AgentType].name,
        color: AGENT_INFO[tile.agent as AgentType].color,
      }
    : { icon: '📄', name: 'Unknown Agent', color: 'gray' };

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
  
  // Handle agent badge click - opens agent panel with tile context
  const handleAgentClick = (agent: AgentType | 'sonny', tileTitle: string, tileData?: unknown) => {
    const activeWorkspace = useWorkspaceStore.getState().activeWorkspaceId;
    const allWorkspaces = useWorkspaceStore.getState().workspaces;
    const workspace = allWorkspaces.find((ws) => String(ws.id) === String(activeWorkspace));
    const target = workspace?.target || tile.subtitle?.replace(/Analysis for |Analysis: /i, '') || 'target';
    
    window.dispatchEvent(new CustomEvent('open-agent-panel', {
      detail: {
        agent,
        tileId: tile.id,
        context: {
          target,
          data: tileData ?? tile.data,
          tileTitle,
        },
      },
    }));
  };
  
  // Handle tile click to open agent panel (for backward compatibility)
  const handleTileClick = () => {
    if (!tile.agent) return;
    
    // Extract target from subtitle or title
    const target = tile.subtitle?.replace(/Analysis for |Analysis: /i, '') || 
                   tile.title?.replace(/Analysis:? /i, '') || 
                   'target';
    
    // Generate suggested questions based on agent type
    const suggestedQuestions = getSuggestedQuestions(tile.agent as AgentType, target);
    
    // Emit custom event to open agent panel
    window.dispatchEvent(new CustomEvent('open-agent-panel', {
      detail: {
        agent: tile.agent,
        tileId: tile.id,
        context: {
          target,
          data: tile.data,
          suggestedQuestions,
          tileTitle: tile.title,
        },
      },
    }));
  };
  
  // Generate context-aware suggested questions
  const getSuggestedQuestions = (agent: AgentType, target: string): string[] => {
    const baseQuestions: Record<AgentType, string[]> = {
      target_biology: [
        `What's the biological mechanism of ${target}?`,
        `Assess the genetic validation for ${target}`,
        `What's the druggability profile of ${target}?`,
        `Evaluate safety concerns for ${target}`,
      ],
      clinical: [
        `What are the key clinical trial results for ${target}?`,
        `Compare ${target} efficacy to competitors`,
        `What are the safety signals for ${target}?`,
        `What's the clinical positioning of ${target}?`,
      ],
      patent: [
        `What patents exist related to ${target}?`,
        `Assess the IP landscape for ${target}`,
        `What's the freedom to operate for ${target}?`,
        `Compare patent portfolios for ${target}`,
      ],
      financial: [
        `What's the valuation for ${target}?`,
        `Compare ${target} to similar deals`,
        `What's the market opportunity for ${target}?`,
        `Assess the financial projections for ${target}`,
      ],
      regulatory: [
        `What's the regulatory pathway for ${target}?`,
        `What are the FDA requirements for ${target}?`,
        `Compare ${target} approval timeline to competitors`,
        `What are the regulatory risks for ${target}?`,
      ],
      market_research: [
        `What's the market size for ${target}?`,
        `Who are the key competitors for ${target}?`,
        `What's the pricing strategy for ${target}?`,
        `Assess the commercial opportunity for ${target}`,
      ],
    };
    
    return baseQuestions[agent] || [];
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
  interface FtoRiskData {
    level: 'low' | 'moderate' | 'high';
    score: number;
    concerns: Array<{
      type: string;
      severity: 'low' | 'moderate' | 'high';
      message: string;
      patents?: string[];
    }>;
    recommendations: string[];
  }
  const ftoRiskData = tile.type === 'patent' ? (tile.data.metadata.ftoRiskData as FtoRiskData | undefined) : undefined;

  // Animation variants for fade-in with staggered delay based on agent type.
  // (Avoid time-based calculations to keep render pure/idempotent.)
  const getAnimationDelay = () => {
    const agentOrder: Record<string, number> = {
      target_biology: 0,
      clinical: 200,
      patent: 400,
      financial: 600,
      market_research: 800,
      regulatory: 1000,
      synthesis: 1200,
    };

    return (agentOrder[tile.agent] || 0) / 1000; // Convert to seconds
  };

  // Animation variants for fade-in
  const tileVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: getAnimationDelay(),
        ease: [0.4, 0, 0.2, 1] as const, // easeOut cubic bezier
      },
    },
  };

  return (
    <>
          <motion.div
            className={`${getGridSpan()} h-full max-h-full flex flex-col min-h-0`}
            variants={tileVariants}
            initial="hidden"
            animate="visible"
          >
            <Tile
              title={tile.title}
              subtitle={tile.subtitle}
              icon={<span className="text-2xl">{agentInfo.icon}</span>}
              tileType="general"
              agents={tile.agent ? [tile.agent as AgentType | 'sonny'] : undefined}
              primaryAgent={tile.agent as AgentType | 'sonny' | undefined}
              onAgentClick={handleAgentClick}
              headerRight={headerActions}
              dataFreshness={new Date(tile.updatedAt).toLocaleDateString()}
              aiGenerated={true}
              className={`border-2 cursor-pointer hover:shadow-lg transition-shadow ${
                tile.isPinned
                  ? 'border-purple-300 bg-purple-50/30'
                  : 'border-gray-200'
              }`}
              onClick={handleTileClick}
            >
          <div>
            {renderContent()}
          </div>
        </Tile>
      </motion.div>

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
