/**
 * Recent Tiles Storage
 * Manages saving and retrieving recent tile snapshots
 */

import type { UserTile } from './types';

export interface RecentTileSnapshot {
  id: string;
  workspaceId: string;
  workspaceName: string;
  target: string;
  tiles: UserTile[];
  savedAt: string;
}

const RECENT_STORAGE_KEY = 'lumina-recent-tiles';

/**
 * Save tiles to recent storage
 */
export function saveTilesToRecent(workspaceId: string, workspaceName: string, target: string, tiles: UserTile[]): void {
  try {
    const recent = loadRecentTiles();
    
    // Remove existing entry for this workspace if it exists
    const filtered = recent.filter(r => r.workspaceId !== workspaceId);
    
    // Add new entry at the beginning
    const snapshot: RecentTileSnapshot = {
      id: `recent-${Date.now()}`,
      workspaceId,
      workspaceName,
      target,
      tiles: tiles.map(t => ({ ...t })), // Deep copy
      savedAt: new Date().toISOString(),
    };
    
    const updated = [snapshot, ...filtered].slice(0, 10); // Keep last 10
    
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save tiles to recent:', error);
  }
}

/**
 * Load recent tiles from storage
 */
export function loadRecentTiles(): RecentTileSnapshot[] {
  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load recent tiles:', error);
  }
  return [];
}

/**
 * Get recent snapshot by workspace ID
 */
export function getRecentSnapshot(workspaceId: string): RecentTileSnapshot | null {
  const recent = loadRecentTiles();
  return recent.find(r => r.workspaceId === workspaceId) || null;
}

/**
 * Restore tiles from recent snapshot
 */
export function restoreTilesFromRecent(snapshot: RecentTileSnapshot): UserTile[] {
  return snapshot.tiles.map(t => ({ ...t }));
}

/**
 * Remove recent snapshot
 */
export function removeRecentSnapshot(workspaceId: string): void {
  try {
    const recent = loadRecentTiles();
    const filtered = recent.filter(r => r.workspaceId !== workspaceId);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove recent snapshot:', error);
  }
}

