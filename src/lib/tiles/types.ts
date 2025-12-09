/**
 * Dynamic Tile System - Type Definitions
 */

import type { AgentType } from '../multiAgentTypes';

export type TileSize = 'small' | 'medium' | 'large' | 'full-width';
export type TileType = 'patent' | 'clinical' | 'financial' | 'regulatory' | 'market_research' | 'target_biology' | 'custom';

export interface TilePosition {
  row: number;
  col: number;
  size: TileSize;
}

export interface TileSource {
  analysisId: string;
  timestamp: string;
  agent: AgentType;
  sourceType: 'patent_parsing' | 'agent_analysis' | 'manual' | 'import';
  sourceData?: any; // Original analysis data
}

export interface TileData {
  summary: any;      // Data for collapsed view
  detailed: any;      // Data for expanded view
  metadata: {
    quality?: number;
    confidence?: number;
    validationStatus?: 'validated' | 'review_required' | 'errors_detected';
    extractionDate?: string;
    [key: string]: any;
  };
}

export interface UserTile {
  id: string;
  title: string;
  subtitle?: string;
  type: TileType;
  agent: AgentType;
  source: TileSource;
  data: TileData;
  position: TilePosition;
  workspaceIds: string[];  // Which workspaces include this tile
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isPinned?: boolean;      // Pin to top of dashboard
  isCollapsed?: boolean;    // Default collapsed state
}

export interface TileTemplate {
  type: TileType;
  agent: AgentType;
  name: string;
  description: string;
  defaultSize: TileSize;
  icon: string;
  color: string;
  renderSummary: (data: TileData) => React.ReactNode;
  renderDetailed: (data: TileData, onOpenFullPanel?: () => void) => React.ReactNode;
}

export interface CreateTileRequest {
  title: string;
  subtitle?: string;
  type: TileType;
  agent: AgentType;
  source: TileSource;
  data: TileData;
  workspaceIds: string[];
  size?: TileSize;
  position?: Partial<TilePosition>;
}
