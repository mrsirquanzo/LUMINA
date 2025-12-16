/**
 * Workspace Store - Zustand state management for workspaces
 */

import { create } from 'zustand';
import type { Workspace } from '../../components/Sidebar';
import { formatTargetDisplayName, toTargetKey } from '../targetNaming';

interface WorkspaceStore {
  // State
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  
  // Actions
  addWorkspace: (workspace: Omit<Workspace, 'id'>) => Workspace;
  updateWorkspace: (id: string | number, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string | number) => void;
  setActiveWorkspace: (id: string | null) => void;
  getWorkspaceById: (id: string | number) => Workspace | undefined;
  getOrCreateWorkspace: (target: string, query?: string) => Workspace;
  cleanupWorkspaces: () => void;
  addFlag: (contextKey: string, flag: { title: string; severity: 'high' | 'medium' | 'low'; note?: string }) => void;
  removeFlag: (flagId: string) => void;
  updateFlag: (flagId: string, updates: Partial<{ title: string; severity: 'high' | 'medium' | 'low'; note?: string }>) => void;
}

// Load from localStorage
function loadWorkspacesFromStorage(): Workspace[] {
  try {
    const stored = localStorage.getItem('lumina-workspaces-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const raw = (parsed.workspaces || []) as Workspace[];
      // Normalize targets for consistent display + matching (e.g. trop-2 -> TROP2).
      // This is a non-destructive migration: we keep names as-is unless they exactly match the target.
      return raw.map((ws) => {
        const canonicalTarget = formatTargetDisplayName(ws.target || '');
        const nextName = ws.name?.trim() === ws.target?.trim() ? canonicalTarget : ws.name;
        return { ...ws, target: canonicalTarget, name: nextName };
      });
    }
  } catch (error) {
    console.error('Failed to load workspaces from storage:', error);
  }
  return [];
}

// Save to localStorage
function saveWorkspacesToStorage(workspaces: Workspace[]) {
  try {
    localStorage.setItem('lumina-workspaces-storage', JSON.stringify({ workspaces }));
  } catch (error) {
    console.error('Failed to save workspaces to storage:', error);
  }
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

// Generate workspace ID
function generateWorkspaceId(): string {
  return `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateFlagId(): string {
  return `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => ({
  // Initial state
  workspaces: loadWorkspacesFromStorage(),
  activeWorkspaceId: loadActiveWorkspaceId(),

  // Add workspace
  addWorkspace: (workspaceData) => {
    const canonicalTarget = formatTargetDisplayName(workspaceData.target || '');
    const newWorkspace: Workspace = {
      id: generateWorkspaceId(),
      ...workspaceData,
      target: canonicalTarget,
      name: workspaceData.name?.trim() === workspaceData.target?.trim() ? canonicalTarget : workspaceData.name,
      lastModified: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.workspaces, newWorkspace];
      saveWorkspacesToStorage(updated);
      return { workspaces: updated };
    });

    return newWorkspace;
  },

  // Update workspace
  updateWorkspace: (id, updates) => {
    set((state) => {
      const nextTarget = updates.target ? formatTargetDisplayName(updates.target) : undefined;
      const updated = state.workspaces.map((ws) =>
        ws.id === id
          ? {
              ...ws,
              ...updates,
              ...(nextTarget ? { target: nextTarget } : {}),
              lastModified: new Date().toISOString(),
            }
          : ws
      );
      saveWorkspacesToStorage(updated);
      return { workspaces: updated };
    });
  },

  // Remove workspace
  removeWorkspace: (id) => {
    set((state) => {
      const updated = state.workspaces.filter((ws) => ws.id !== id);
      saveWorkspacesToStorage(updated);
      // If removed workspace was active, clear active workspace
      if (state.activeWorkspaceId === String(id)) {
        saveActiveWorkspaceId(null);
        return { workspaces: updated, activeWorkspaceId: null };
      }
      return { workspaces: updated };
    });
  },

  // Set active workspace
  setActiveWorkspace: (id) => {
    // Only update if different to prevent infinite loops
    const current = get().activeWorkspaceId;
    if (current !== id) {
      set({ activeWorkspaceId: id });
      saveActiveWorkspaceId(id);
    }
  },

  // Get workspace by ID
  getWorkspaceById: (id) => {
    return get().workspaces.find((ws) => ws.id === id);
  },

  // Get or create workspace for a target/query
  getOrCreateWorkspace: (target, query) => {
    const { workspaces } = get();
    
    // Normalize target and query for comparison
    const normalizedTarget = toTargetKey(target);
    const normalizedQuery = query?.toLowerCase().trim() || '';
    
    // Try to find existing workspace for this target/query
    // Match by target first, then by query if provided
    let existing = workspaces.find(
      (ws) => {
        const wsTarget = toTargetKey(ws.target);
        const wsName = ws.name.toLowerCase().trim();
        
        // Exact target match
        if (wsTarget !== normalizedTarget) return false;
        
        // If query provided, check if workspace name contains it
        if (normalizedQuery) {
          // For KRAS G12C, match "kras g12c" or "kras" in name
          if (normalizedQuery.includes('kras') && normalizedQuery.includes('g12c')) {
            return wsName.includes('kras') && wsName.includes('g12c');
          }
          return wsName.includes(normalizedQuery);
        }
        
        // No query, just match target
        return true;
      }
    );

    if (existing) {
      // Update lastModified to mark as recently used
      get().updateWorkspace(existing.id, { lastModified: new Date().toISOString() });
      return existing;
    }

    // Create new workspace with better naming (no "Analysis" suffix)
    let workspaceName: string;
    if (query && query.trim()) {
      // For queries like "KRAS G12C", use the query as the name (clean it up)
      const queryWords = query.trim().split(/\s+/);
      if (queryWords.length <= 3) {
        workspaceName = query.trim();
      } else {
        // Extract just the key words, remove "Analysis" if present
        const cleanQuery = query.trim().replace(/\s*-\s*Analysis\s*$/i, '').replace(/\s*Analysis\s*$/i, '');
        workspaceName = cleanQuery.split(/\s+/).slice(0, 3).join(' ');
      }
    } else {
      // For targets without query, use target name (remove "Analysis" if present)
      workspaceName = target.replace(/\s*Analysis\s*$/i, '');
    }

    return get().addWorkspace({
      name: workspaceName,
      target: formatTargetDisplayName(target),
      persona: 'scientist', // Default, can be updated
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      status: 'active',
    });
  },
  
  // Clean up old/duplicate workspaces - keep only demo-ready targets (TROP2 + HER2)
  cleanupWorkspaces: () => {
    set((state) => {
      const { workspaces } = state;
      
      // De-dupe by (normalized target + normalized name) and keep the most recent for each.
      // IMPORTANT: do NOT drop targets; investors/demo flows may browse many targets/assets.
      const workspaceMap = new Map<string, Workspace>();
      
      workspaces.forEach(ws => {
        const targetKey = toTargetKey(ws.target);
        const nameKey = (ws.name || '').toLowerCase().trim();
        const key = `${targetKey}|${nameKey}`;

        const existing = workspaceMap.get(key);
        if (!existing || new Date(ws.lastModified) > new Date(existing.lastModified)) {
          workspaceMap.set(key, ws);
        }
      });
      
      const cleaned = Array.from(workspaceMap.values());
      saveWorkspacesToStorage(cleaned);
      return { workspaces: cleaned };
    });
  },

  addFlag: (contextKey, flag) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) return;
    set((state) => {
      const now = new Date().toISOString();
      const updated = state.workspaces.map((ws) => {
        if (String(ws.id) !== String(activeId)) return ws;
        const nextFlags = [
          ...(ws.flags || []),
          {
            id: generateFlagId(),
            contextKey,
            title: flag.title,
            severity: flag.severity,
            note: flag.note,
            createdAt: now,
            updatedAt: now,
          },
        ];
        return { ...ws, flags: nextFlags, lastModified: now };
      });
      saveWorkspacesToStorage(updated);
      return { workspaces: updated };
    });
  },

  removeFlag: (flagId) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) return;
    set((state) => {
      const now = new Date().toISOString();
      const updated = state.workspaces.map((ws) => {
        if (String(ws.id) !== String(activeId)) return ws;
        const nextFlags = (ws.flags || []).filter((f) => f.id !== flagId);
        return { ...ws, flags: nextFlags, lastModified: now };
      });
      saveWorkspacesToStorage(updated);
      return { workspaces: updated };
    });
  },

  updateFlag: (flagId, updates) => {
    const activeId = get().activeWorkspaceId;
    if (!activeId) return;
    set((state) => {
      const now = new Date().toISOString();
      const updated = state.workspaces.map((ws) => {
        if (String(ws.id) !== String(activeId)) return ws;
        const nextFlags = (ws.flags || []).map((f) => {
          if (f.id !== flagId) return f;
          return { ...f, ...updates, updatedAt: now };
        });
        return { ...ws, flags: nextFlags, lastModified: now };
      });
      saveWorkspacesToStorage(updated);
      return { workspaces: updated };
    });
  },
}));

