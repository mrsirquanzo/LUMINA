/**
 * Recent View
 * Shows recent target analyses (TROP2, HER2, etc.)
 */

import { useMemo } from 'react';
import { Clock, Target, ArrowRight } from 'lucide-react';
import { useWorkspaceStore } from '../../lib/workspaces/store';
import { useTileStore } from '../../lib/tiles/store';
import { loadRecentTiles } from '../../lib/tiles/recentStorage';
import { format, parseISO } from 'date-fns';
import type { Workspace } from '../Sidebar';

export default function Recent() {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const tiles = useTileStore((state) => state.tiles);
  const setActiveWorkspace = useTileStore((state) => state.setActiveWorkspace);
  
  // Get recent tile snapshots
  const recentSnapshots = useMemo(() => {
    return loadRecentTiles();
  }, []);
  
  // Get recent workspaces (TROP2 and HER2 only)
  const recentWorkspaces = useMemo(() => {
    return workspaces
      .filter(ws => {
        const targetLower = ws.target.toLowerCase();
        const nameLower = ws.name.toLowerCase();
        
        // Include TROP2
        if (targetLower === 'trop2') return true;

        // Include HER2
        if (targetLower === 'her2' || targetLower === 'erbb2' || nameLower.includes('her2') || nameLower.includes('erbb2')) {
          return true;
        }
        
        return false;
      })
      .map(ws => {
        // Clean up workspace names
        let cleanName = ws.name
          .replace(/\s*-\s*[^-]*Analysis\s*$/i, '')
          .replace(/\s*Analysis\s*$/i, '')
          .trim();
        
        // Handle duplicate patterns
        const parts = cleanName.split(/\s*-\s*/);
        if (parts.length === 2 && parts[0].trim().toLowerCase() === parts[1].trim().toLowerCase()) {
          cleanName = parts[0].trim();
        }
        
        // Calculate tile count
        const tileCount = tiles.filter(t => t.workspaceIds.includes(String(ws.id))).length;
        
        return {
          ...ws,
          name: cleanName,
          tileCount,
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 10); // Show top 10 most recent
  }, [workspaces, tiles]);
  
  const handleOpenWorkspace = (workspaceId: string) => {
    setActiveWorkspace(workspaceId);
    // Switch to dashboard view - trigger navigation via custom event
    const event = new CustomEvent('navigate-to-dashboard');
    window.dispatchEvent(event);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-textPrimary mb-2">Recent Analyses</h1>
        <p className="text-textSecondary">Quick access to your recent target analyses</p>
      </div>

      {/* Recent Workspaces */}
      {recentWorkspaces.length > 0 ? (
        <div className="space-y-4">
          {recentWorkspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="group bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleOpenWorkspace(String(workspace.id))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-textPrimary mb-1 group-hover:text-primary transition-colors truncate">
                      {workspace.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-textSecondary">{workspace.target}</span>
                      <span className="text-textTertiary">•</span>
                      <span className="text-textTertiary">
                        {workspace.tileCount} tile{workspace.tileCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-textTertiary">•</span>
                      <div className="flex items-center gap-1 text-textTertiary">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(parseISO(workspace.lastModified), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-textTertiary group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-textTertiary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-textSecondary mb-2">No recent analyses</p>
          <p className="text-sm text-textTertiary">Run an analysis to see it here</p>
        </div>
      )}
    </div>
  );
}

