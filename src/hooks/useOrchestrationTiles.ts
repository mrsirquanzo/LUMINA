/**
 * useOrchestrationTiles Hook
 * 
 * Listens to orchestration events and automatically creates/updates tiles
 * as agents complete their analysis
 */

import { useEffect, useRef } from 'react';
import { useTileStore } from '../lib/tiles/store';
import { useWorkspaceStore } from '../lib/workspaces/store';
import { extractTileData } from '../lib/tiles/extractors';
import type { AgentType, SSEEvent } from '../lib/multiAgentTypes';

interface UseOrchestrationTilesOptions {
  enabled?: boolean;
  query?: string;
  onTileCreated?: (tileId: string, agent: AgentType) => void;
}

/**
 * Maps agent names from SSE events to AgentType
 */
function mapAgentNameToType(agentName: string): AgentType | null {
  const nameLower = agentName.toLowerCase();
  if (nameLower.includes('target biology') || nameLower.includes('target biology specialist')) {
    return 'target_biology';
  }
  if (nameLower.includes('clinical') || nameLower.includes('clinical data analyst')) {
    return 'clinical';
  }
  if (nameLower.includes('patent') || nameLower.includes('patent expert')) {
    return 'patent';
  }
  if (nameLower.includes('financial') || nameLower.includes('financial analyst')) {
    return 'financial';
  }
  if (nameLower.includes('regulatory') || nameLower.includes('regulatory expert')) {
    return 'regulatory';
  }
  if (nameLower.includes('market') || nameLower.includes('market research analyst')) {
    return 'market_research';
  }
  return null;
}

/**
 * Gets tile type from agent type
 */
function getTileTypeFromAgent(agent: AgentType): string {
  return agent;
}

/**
 * Gets tile title from agent type and query
 */
function getTileTitle(agent: AgentType): string {
  // Investor/demo-friendly: titles should be the agent name only (no query fragments).
  const agentTitles: Record<AgentType, string> = {
    target_biology: 'Target Biology Specialist',
    clinical: 'Clinical Data Analyst',
    patent: 'Patent Expert',
    financial: 'Financial Analyst',
    regulatory: 'Regulatory Expert',
    market_research: 'Market Research Analyst',
  };

  return agentTitles[agent] || 'Analysis';
}

/**
 * Hook to automatically create tiles from orchestration events
 */
export function useOrchestrationTiles(
  events: SSEEvent[] | null,
  options: UseOrchestrationTilesOptions = {}
) {
  const { enabled = true, query, onTileCreated } = options;
  const addTile = useTileStore((state) => state.addTile);
  const updateTile = useTileStore((state) => state.updateTile);
  // Don't subscribe to setActiveWorkspace - use getState() to prevent infinite loops
  const processedAgentsRef = useRef<Set<string>>(new Set());
  const analysisIdRef = useRef<string>(`analysis-${Date.now()}`);
  const workspaceIdRef = useRef<string | null>(null);

  // Track last processed event index
  const lastProcessedIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem('lumina-suppress-orchestration-tiles') === 'true') return;

    // Defer processing to avoid updating during render
    // Use setTimeout to ensure this runs after the current render cycle
    const timeoutId = setTimeout(() => {
      // Process only new events (those not yet processed)
      const startIndex = lastProcessedIndexRef.current + 1;
      const newEvents = events.slice(startIndex);
      
      newEvents.forEach((event, relativeIndex) => {
      // Handle synthesis/executive summary
      if (event.type === 'complete' && event.data?.synthesis) {
        const synthesis = event.data.synthesis;
        const synthesisKey = `${analysisIdRef.current}-synthesis`;
        
        // Check if we've already processed synthesis
        if (processedAgentsRef.current.has(synthesisKey)) {
          lastProcessedIndexRef.current = startIndex + relativeIndex;
          return;
        }
        
        processedAgentsRef.current.add(synthesisKey);
        
        // Extract synthesis tile data
        const { data, source } = extractTileData(synthesis, 'synthesis' as any, analysisIdRef.current);
        
        // Create executive summary tile
        const tile = addTile({
          title: 'Executive Summary',
          subtitle: `Strategic synthesis for ${query || 'target'}`,
          type: 'custom' as any, // Use 'custom' type for executive summary
          agent: 'synthesis' as any,
          source,
          data,
          workspaceIds: workspaceIdRef.current ? [workspaceIdRef.current] : [],
          size: 'full-width',
        });
        
        if (onTileCreated) {
          onTileCreated(tile.id, 'synthesis' as any);
        }
        
        console.log(`[useOrchestrationTiles] Created synthesis tile:`, tile.id);
        lastProcessedIndexRef.current = startIndex + relativeIndex;
        return;
      }
      
      // Handle agent responses
      if (event.type === 'agent_response') {
        const agentName = event.data?.agent;
        const response = event.data?.response;
        
        if (!agentName || !response) {
          lastProcessedIndexRef.current = startIndex + relativeIndex;
          return;
        }

        const agentType = mapAgentNameToType(agentName);
        if (!agentType) {
          console.warn(`[useOrchestrationTiles] Unknown agent: ${agentName}`);
          lastProcessedIndexRef.current = startIndex + relativeIndex;
          return;
        }

        // Create unique key for this agent in this analysis
        const agentKey = `${analysisIdRef.current}-${agentType}`;
        
        // Check if we've already processed this agent for this analysis
        if (processedAgentsRef.current.has(agentKey)) {
          // Update existing tile instead of creating duplicate
          const existingTiles = useTileStore.getState().tiles;
          const existingTile = existingTiles.find(
            (t) => t.source.analysisId === analysisIdRef.current && t.agent === agentType
          );
          
          if (existingTile) {
            const { data, source } = extractTileData(response, agentType, analysisIdRef.current);
            updateTile(existingTile.id, {
              data,
              source,
              updatedAt: new Date().toISOString(),
            });
            console.log(`[useOrchestrationTiles] Updated existing tile for ${agentType}:`, existingTile.id);
          } else {
            // Tile was deleted but we already processed - skip
            console.log(`[useOrchestrationTiles] Skipping duplicate for ${agentType} - tile was removed`);
          }
          lastProcessedIndexRef.current = startIndex + relativeIndex;
          return;
        }

        // Mark as processed
        processedAgentsRef.current.add(agentKey);

        // Extract tile data
        const { data, source } = extractTileData(response, agentType, analysisIdRef.current);

        // Create tile with workspace association
        const tile = addTile({
          title: getTileTitle(agentType),
          subtitle: `Analysis for ${query || 'target'}`,
          type: getTileTypeFromAgent(agentType) as any,
          agent: agentType,
          source,
          data,
          workspaceIds: workspaceIdRef.current ? [workspaceIdRef.current] : [],
          size: 'large',
        });

        // Notify callback
        if (onTileCreated) {
          onTileCreated(tile.id, agentType);
        }

        console.log(`[useOrchestrationTiles] Created tile for ${agentType}:`, tile.id);
        lastProcessedIndexRef.current = startIndex + relativeIndex;
      }
    });
    }, 0); // Defer to next tick to avoid render-time updates
    
    return () => clearTimeout(timeoutId);
  }, [enabled, events, query, addTile, updateTile, onTileCreated]);

  // Reset processed agents and create workspace when query changes
  useEffect(() => {
    if (query && query.trim()) {
      if (typeof window !== 'undefined' && sessionStorage.getItem('lumina-suppress-orchestration-tiles') === 'true') return;
      // Defer workspace creation to avoid render-time updates
      const timeoutId = setTimeout(() => {
        // New analysis started - reset tracking
        processedAgentsRef.current.clear();
        lastProcessedIndexRef.current = -1;
        analysisIdRef.current = `analysis-${Date.now()}`;
        
        // Extract target name from query (first token).
        const target = query.split(/\s+/)[0] || 'Unknown';
        
        // Use getState() to prevent infinite loops
        const workspace = useWorkspaceStore.getState().getOrCreateWorkspace(target, query);
        workspaceIdRef.current = String(workspace.id);
        
        // Set as active workspace using getState() to prevent re-renders
        const currentActive = useTileStore.getState().activeWorkspace;
        if (currentActive !== workspaceIdRef.current) {
          useTileStore.getState().setActiveWorkspace(workspaceIdRef.current);
        }
        
        console.log(`[useOrchestrationTiles] Created/activated workspace: ${workspace.name} (${workspaceIdRef.current})`);
      }, 0); // Defer to next tick
      
      return () => clearTimeout(timeoutId);
    }
  }, [query]); // Only depend on query, not on functions
}

