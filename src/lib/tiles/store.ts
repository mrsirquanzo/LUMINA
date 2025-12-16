/**
 * Tile Store - Zustand state management for dynamic tiles
 */

import { create } from 'zustand';
import type { UserTile, CreateTileRequest, TilePosition } from './types';
import { extractTileData } from './extractors';

interface TileStore {
  // State
  tiles: UserTile[];
  activeWorkspace: string | null;
  
  // Actions
  addTile: (request: CreateTileRequest) => UserTile;
  removeTile: (id: string) => void;
  clearAllTiles: () => void;
  updateTile: (id: string, updates: Partial<UserTile>) => void;
  reorderTiles: (tileIds: string[]) => void;
  addTileToWorkspace: (tileId: string, workspaceId: string) => void;
  removeTileFromWorkspace: (tileId: string, workspaceId: string) => void;
  setActiveWorkspace: (workspaceId: string | null) => void;
  
  // Getters
  getTilesForWorkspace: (workspaceId: string) => UserTile[];
  getVisibleTiles: () => UserTile[];
  getTileById: (id: string) => UserTile | undefined;
}

// Generate unique tile ID
function generateTileId(): string {
  return `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate default position (next available spot in grid)
function calculateDefaultPosition(existingTiles: UserTile[]): TilePosition {
  // Simple grid: 4 columns, find first available spot
  const gridCols = 4;
  const usedPositions = new Set(
    existingTiles.map(t => `${t.position.row}-${t.position.col}`)
  );
  
  // Start from row 0, col 0
  for (let row = 0; row < 100; row++) {
    for (let col = 0; col < gridCols; col++) {
      const key = `${row}-${col}`;
      if (!usedPositions.has(key)) {
        return {
          row,
          col,
          size: 'large', // Default size
        };
      }
    }
  }
  
  // Fallback: append to end
  const maxRow = Math.max(...existingTiles.map(t => t.position.row), -1);
  return {
    row: maxRow + 1,
    col: 0,
    size: 'large',
  };
}

// Load from localStorage
function loadTilesFromStorage(): UserTile[] {
  try {
    const stored = localStorage.getItem('lumina-tiles-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const tiles: UserTile[] = parsed.state?.tiles || [];

      // Recompute derived tile `data` from stored source response to keep tiles
      // up-to-date when extractors/templates evolve (e.g., more comprehensive TROP2 parsing).
      return tiles.map((tile) => {
        try {
          const agent = tile.agent as any;
          const analysisId = tile.source?.analysisId;
          const sourceData = tile.source?.sourceData as any;

          if (!analysisId) return tile;

          if (agent === 'synthesis' && typeof sourceData?.synthesis === 'string') {
            const { data } = extractTileData(sourceData.synthesis, 'synthesis' as any, analysisId);
            return { ...tile, data };
          }

          if (typeof sourceData?.response === 'string') {
            const { data } = extractTileData(sourceData.response, agent, analysisId);
            return { ...tile, data };
          }

          return tile;
        } catch {
          return tile;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load tiles from storage:', error);
  }
  return [];
}

// Load active workspace ID from localStorage
function loadActiveWorkspaceId(): string | null {
  try {
    const stored = localStorage.getItem('lumina-active-workspace-id');
    return stored || null;
  } catch (error) {
    console.error('Failed to load active workspace ID:', error);
  }
  return null;
}

// Save active workspace ID to localStorage
function saveActiveWorkspaceId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem('lumina-active-workspace-id', id);
    } else {
      localStorage.removeItem('lumina-active-workspace-id');
    }
  } catch (error) {
    console.error('Failed to save active workspace ID:', error);
  }
}

// Save to localStorage
function saveTilesToStorage(tiles: UserTile[]) {
  try {
    localStorage.setItem('lumina-tiles-storage', JSON.stringify({ state: { tiles } }));
  } catch (error) {
    console.error('Failed to save tiles to storage:', error);
  }
}

export const useTileStore = create<TileStore>()((set, get) => {
  // Load initial state
  const initialTiles = loadTilesFromStorage();
  const initialActiveWorkspace = loadActiveWorkspaceId();
  
  // Debug logging
  console.log('[TileStore] Initialized:', {
    tilesCount: initialTiles.length,
    activeWorkspace: initialActiveWorkspace,
  });
  
  return {
      // Initial state
      tiles: initialTiles,
      activeWorkspace: initialActiveWorkspace,

      // Add new tile
      addTile: (request: CreateTileRequest) => {
        const newTile: UserTile = {
          id: generateTileId(),
          title: request.title,
          subtitle: request.subtitle,
          type: request.type,
          agent: request.agent,
          source: request.source,
          data: request.data,
          position: request.position ? {
            row: request.position.row ?? 0,
            col: request.position.col ?? 0,
            size: request.position.size ?? 'large',
          } : calculateDefaultPosition(get().tiles),
          workspaceIds: request.workspaceIds || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: false,
          isCollapsed: true, // Default to collapsed
        };

        set((state) => {
          const updated = [...state.tiles, newTile];
          saveTilesToStorage(updated);
          return { tiles: updated };
        });

        return newTile;
      },

      // Remove tile
      removeTile: (id: string) => {
        set((state) => {
          const updated = state.tiles.filter((tile) => tile.id !== id);
          saveTilesToStorage(updated);
          return { tiles: updated };
        });
      },

      // Clear all tiles
      clearAllTiles: () => {
        set(() => {
          saveTilesToStorage([]);
          return { tiles: [] };
        });
      },

      // Update tile
      updateTile: (id: string, updates: Partial<UserTile>) => {
        set((state) => {
          const updated = state.tiles.map((tile) =>
            tile.id === id
              ? { ...tile, ...updates, updatedAt: new Date().toISOString() }
              : tile
          );
          saveTilesToStorage(updated);
          return { tiles: updated };
        });
      },

      // Reorder tiles
      reorderTiles: (tileIds: string[]) => {
        const { tiles } = get();
        const tileMap = new Map(tiles.map(t => [t.id, t]));
        const reordered = tileIds
          .map(id => tileMap.get(id))
          .filter((t): t is UserTile => t !== undefined);
        
        // Update positions based on new order
        const updated = reordered.map((tile, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          return {
            ...tile,
            position: {
              ...tile.position,
              row,
              col,
            },
          };
        });

        saveTilesToStorage(updated);
        set({ tiles: updated });
      },

      // Add tile to workspace
      addTileToWorkspace: (tileId: string, workspaceId: string) => {
        set((state) => {
          const updated = state.tiles.map((tile) =>
            tile.id === tileId
              ? {
                  ...tile,
                  workspaceIds: tile.workspaceIds.includes(workspaceId)
                    ? tile.workspaceIds
                    : [...tile.workspaceIds, workspaceId],
                }
              : tile
          );
          saveTilesToStorage(updated);
          return { tiles: updated };
        });
      },

      // Remove tile from workspace
      removeTileFromWorkspace: (tileId: string, workspaceId: string) => {
        set((state) => {
          const updated = state.tiles.map((tile) =>
            tile.id === tileId
              ? {
                  ...tile,
                  workspaceIds: tile.workspaceIds.filter((id) => id !== workspaceId),
                }
              : tile
          );
          saveTilesToStorage(updated);
          return { tiles: updated };
        });
      },

      // Set active workspace
      setActiveWorkspace: (workspaceId: string | null) => {
        // Only update if different to prevent infinite loops
        const current = get().activeWorkspace;
        if (current !== workspaceId) {
          set({ activeWorkspace: workspaceId });
          saveActiveWorkspaceId(workspaceId);
        }
      },

      // Get tiles for specific workspace
      getTilesForWorkspace: (workspaceId: string) => {
        return get().tiles.filter((tile) => tile.workspaceIds.includes(workspaceId));
      },

      // Get visible tiles (for current workspace or all if no workspace)
      getVisibleTiles: () => {
        const { tiles, activeWorkspace } = get();
        if (!activeWorkspace) {
          return tiles; // Show all tiles if no workspace selected
        }
        return tiles.filter((tile) => tile.workspaceIds.includes(activeWorkspace));
      },

      // Get tile by ID
      getTileById: (id: string) => {
        return get().tiles.find((tile) => tile.id === id);
      },
    };
  }
);
