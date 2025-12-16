/**
 * Tile Template Registry
 * Central registry for all tile templates
 */

import type { TileTemplate } from '../types';
import { PatentSummaryView, PatentDetailedView, patentTileTemplate } from './patentTileTemplate';
import {
  targetBiologyTileTemplate,
  clinicalTileTemplate,
  financialTileTemplate,
  regulatoryTileTemplate,
  marketResearchTileTemplate,
} from './agentTileTemplates';
import { executiveSummaryTileTemplate } from './executiveSummaryTileTemplate';

// Template registry
export const TILE_TEMPLATES: Record<string, TileTemplate> = {
  'patent': {
    ...patentTileTemplate,
    renderSummary: (data) => <PatentSummaryView data={data} />,
    renderDetailed: (data, onOpenFullPanel?: () => void) => <PatentDetailedView data={data} onOpenFullPanel={onOpenFullPanel} />,
  },
  'executive_summary': executiveSummaryTileTemplate,
  'target_biology': targetBiologyTileTemplate,
  'clinical': clinicalTileTemplate,
  'financial': financialTileTemplate,
  'regulatory': regulatoryTileTemplate,
  'market_research': marketResearchTileTemplate,
};

/**
 * Get template by type
 */
export function getTileTemplate(type: string): TileTemplate | null {
  // Handle custom type for executive summary
  if (type === 'custom') {
    // Check if tile is a synthesis/executive summary by agent
    return null; // Will be handled by getTemplateByAgent
  }
  return TILE_TEMPLATES[type] || null;
}

/**
 * Get template by agent
 */
export function getTemplateByAgent(agent: string): TileTemplate | null {
  // Handle synthesis agent for executive summary
  if (agent === 'synthesis') {
    return TILE_TEMPLATES['executive_summary'] || null;
  }
  const template = Object.values(TILE_TEMPLATES).find(t => t.agent === agent);
  return template || null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): TileTemplate[] {
  return Object.values(TILE_TEMPLATES);
}
