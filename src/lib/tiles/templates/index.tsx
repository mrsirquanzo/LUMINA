/**
 * Tile Template Registry
 * Central registry for all tile templates
 */

import type { TileTemplate } from '../types';
import { PatentSummaryView, PatentDetailedView, patentTileTemplate } from './patentTileTemplate';

// Template registry
export const TILE_TEMPLATES: Record<string, TileTemplate> = {
  'patent': {
    ...patentTileTemplate,
    renderSummary: (data) => <PatentSummaryView data={data} />,
    renderDetailed: (data, onOpenFullPanel?: () => void) => <PatentDetailedView data={data} onOpenFullPanel={onOpenFullPanel} />,
  },
  // Add more templates as needed:
  // 'clinical': { ... },
  // 'financial': { ... },
};

/**
 * Get template by type
 */
export function getTileTemplate(type: string): TileTemplate | null {
  return TILE_TEMPLATES[type] || null;
}

/**
 * Get template by agent
 */
export function getTemplateByAgent(agent: string): TileTemplate | null {
  const template = Object.values(TILE_TEMPLATES).find(t => t.agent === agent);
  return template || null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): TileTemplate[] {
  return Object.values(TILE_TEMPLATES);
}
