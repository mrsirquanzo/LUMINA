import { useState, useMemo } from 'react';
import {
  FolderOpen,
  Grid,
  List as ListIcon,
  Plus,
  MoreVertical,
  Clock,
  Copy,
  Archive,
  Trash2,
  Search,
} from 'lucide-react';
import { usePersona } from '../../contexts/PersonaContext';
import { useWorkspaceStore } from '../../lib/workspaces/store';
import { useTileStore } from '../../lib/tiles/store';
import type { Workspace } from '../Sidebar';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'alphabetical' | 'status';

export default function Workspaces() {
  const { activePersona } = usePersona();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get workspaces from store instead of constants
  const allWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const tiles = useTileStore((state) => state.tiles);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  
  // Filter to only show TROP2 and KRAS G12C workspaces
  const workspaces: Workspace[] = useMemo(() => {
    return allWorkspaces
      .filter(ws => {
        const targetLower = ws.target.toLowerCase();
        const nameLower = ws.name.toLowerCase();
        
        // Include TROP2
        if (targetLower === 'trop2') return true;
        
        // Include KRAS G12C (check both target and name)
        if ((targetLower.includes('kras') || nameLower.includes('kras')) && 
            (nameLower.includes('g12c') || targetLower.includes('g12c'))) {
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
        
        // Handle duplicate patterns like "KRAS G12C - KRAS G12C" -> "KRAS G12C"
        const parts = cleanName.split(/\s*-\s*/);
        if (parts.length === 2 && parts[0].trim().toLowerCase() === parts[1].trim().toLowerCase()) {
          cleanName = parts[0].trim();
        }
        
        return {
          ...ws,
          name: cleanName,
        };
      });
  }, [allWorkspaces]);
  
  const primaryColor = activePersona === 'scientist' ? '#BF5AF2' : '#FF9F0A';

  const filteredAndSortedWorkspaces = useMemo(() => {
    let filtered = [...workspaces];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ws) =>
          ws.name.toLowerCase().includes(query) ||
          ws.target.toLowerCase().includes(query) ||
          ws.persona.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return (
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          );
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { active: 0, completed: 1, archived: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [workspaces, searchQuery, sortBy]);

  const getStatusColor = (status: Workspace['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      case 'archived':
        return 'bg-textTertiary';
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Workspaces</h1>
          <p className="text-textSecondary">Manage your saved projects and analyses</p>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all font-semibold shadow-lg"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Search */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textTertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-surfaceElevated rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-surface text-textPrimary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-surface text-textPrimary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
            aria-label="List view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Workspaces */}
      {filteredAndSortedWorkspaces.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="group relative bg-surface border border-white/5 rounded-xl p-5 hover:border-white/10 hover:shadow-lg transition-all"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(workspace.status)}`} />
                  <span className="text-xs text-textTertiary capitalize">{workspace.status}</span>
                </div>

                {/* Folder Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                </div>

                {/* Project Name */}
                <h3 className="text-lg font-semibold text-textPrimary mb-1 group-hover:text-primary transition-colors">
                  {workspace.name}
                </h3>

                {/* Target & Persona */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-textSecondary">{workspace.target}</span>
                  <span className="text-textTertiary">•</span>
                  <span className="text-xs px-2 py-1 bg-surfaceElevated text-textTertiary rounded capitalize">
                    {workspace.persona}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surfaceElevated rounded-lg p-2">
                    <p className="text-xs text-textTertiary mb-1">Tiles</p>
                    <p className="text-sm font-semibold text-textPrimary">
                      {tiles.filter(t => t.workspaceIds.includes(String(workspace.id))).length}
                    </p>
                  </div>
                  <div className="bg-surfaceElevated rounded-lg p-2">
                    <p className="text-xs text-textTertiary mb-1">Last Activity</p>
                    <p className="text-sm font-semibold text-textPrimary">
                      {format(parseISO(workspace.lastModified), 'MMM d')}
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                {workspace.collaborators && workspace.collaborators.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {workspace.collaborators.slice(0, 4).map((collab, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-xs border-2 border-surface"
                        >
                          {getUserInitials(collab)}
                        </div>
                      ))}
                      {workspace.collaborators.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-surfaceElevated border-2 border-surface flex items-center justify-center text-xs text-textTertiary">
                          +{workspace.collaborators.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-textTertiary">
                      {workspace.collaborators.length} {workspace.collaborators.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                )}

                {/* Last Edited */}
                <div className="flex items-center gap-2 text-xs text-textTertiary mb-4">
                  <Clock className="w-3 h-3" />
                  <span>
                    Updated {format(parseISO(workspace.lastModified), 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    className="p-2 bg-surfaceElevated rounded-lg hover:bg-surface text-textTertiary hover:text-textPrimary transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-surfaceElevated rounded-lg hover:bg-surface text-textTertiary hover:text-textPrimary transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-surfaceElevated rounded-lg hover:bg-surface text-danger transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Open Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveWorkspace(String(workspace.id));
                    // Navigate to dashboard
                    window.dispatchEvent(new CustomEvent('navigate-to-dashboard'));
                  }}
                  className="w-full mt-4 px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary text-sm font-medium"
                >
                  Open Workspace
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surfaceElevated border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-textTertiary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedWorkspaces.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className="border-b border-white/5 hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setActiveWorkspace(String(workspace.id));
                      window.dispatchEvent(new CustomEvent('navigate-to-dashboard'));
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-textPrimary">{workspace.name}</p>
                          <p className="text-xs text-textTertiary capitalize">{workspace.persona}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-textSecondary">{workspace.target}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(workspace.status)}`} />
                        <span className="text-xs text-textSecondary capitalize">{workspace.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-textTertiary">
                        {format(parseISO(workspace.lastModified), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {workspace.collaborators && workspace.collaborators.length > 0 ? (
                        <div className="flex -space-x-2">
                          {workspace.collaborators.slice(0, 3).map((collab, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-white text-xs border-2 border-surface"
                            >
                              {getUserInitials(collab)}
                            </div>
                          ))}
                          {workspace.collaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-surfaceElevated border-2 border-surface flex items-center justify-center text-xs text-textTertiary">
                              +{workspace.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-textTertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWorkspace(String(workspace.id));
                            window.dispatchEvent(new CustomEvent('navigate-to-dashboard'));
                          }}
                          className="px-3 py-1.5 text-sm bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary font-medium"
                        >
                          Open
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-surfaceElevated text-textTertiary hover:text-textPrimary transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 text-textTertiary mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-textSecondary mb-2">No workspaces yet</p>
          <p className="text-sm text-textTertiary mb-6">Create your first project to get started</p>
          <button className="px-6 py-3 bg-warning text-black rounded-lg hover:bg-warning/90 transition-colors font-medium">
            <Plus className="w-4 h-4 inline mr-2" />
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
}
