import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Briefcase,
  LayoutGrid,
  FolderOpen,
  History,
  Bell,
  Settings,
  HelpCircle,
  User,
  LogOut,
  Target,
  Microscope,
} from 'lucide-react';
import type { Persona, ViewState } from '../types';
import { useWorkspaceStore } from '../lib/workspaces/store';
import { useTileStore } from '../lib/tiles/store';
import { formatTargetDisplayName, toTargetKey } from '../lib/targetNaming';
import { useQuery } from '@tanstack/react-query';

export interface Workspace {
  id: string | number;
  name: string;
  target: string;
  persona: Persona;
  createdDate: string;
  lastModified: string;
  status: 'active' | 'completed' | 'archived';
  collaborators?: string[];
  /**
   * User-saved diligence flags for follow-up.
   * Stored per-workspace so different users/sessions can track what matters to them.
   */
  flags?: Array<{
    id: string;
    contextKey: string; // e.g. "baseline-expression-biology" or tile id
    title: string;
    severity: 'high' | 'medium' | 'low';
    note?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface SidebarProps {
  activePersona: Persona;
  onPersonaChange: (p: Persona) => void;
  currentView: ViewState;
  onViewChange: (v: ViewState) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  currentTarget?: string; // Optional override, will use active workspace if not provided
  recentWorkspaces?: Workspace[]; // Deprecated - will use workspace store instead
  onOpenSettings?: () => void;
}

const STORAGE_KEY = 'lumina-sidebar-collapsed';
const WIDTH_STORAGE_KEY = 'lumina-sidebar-width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 288;
const COLLAPSED_WIDTH = 80;

// Custom Panel Icon - Window with left sidebar
const PanelIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Outer window */}
    <rect x="1" y="1" width="18" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    {/* Left sidebar strip */}
    <rect x="2.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor" />
  </svg>
);

const Sidebar = memo(function Sidebar({
  activePersona,
  onPersonaChange,
  currentView,
  onViewChange,
  collapsed,
  setCollapsed,
  currentTarget: currentTargetProp,
  recentWorkspaces: recentWorkspacesProp,
  onOpenSettings,
}: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Get workspaces from store
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const getWorkspaceById = useWorkspaceStore((state) => state.getWorkspaceById);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  
  // Get current target from active workspace or use prop
  // Return empty string if no target is selected (initial load)
  const currentTarget = useMemo(() => {
    if (currentTargetProp) return currentTargetProp;
    if (activeWorkspaceId) {
      const activeWorkspace = getWorkspaceById(activeWorkspaceId);
      return activeWorkspace?.target ? formatTargetDisplayName(activeWorkspace.target) : '';
    }
    return ''; // Empty on initial load when no workspace is active
  }, [currentTargetProp, activeWorkspaceId, getWorkspaceById]);

  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['intelligence-unread', currentTarget],
    queryFn: async () => {
      const url = new URL('/api/intelligence/unread', window.location.origin);
      if (currentTarget) url.searchParams.set('target', currentTarget);
      const res = await fetch(url.toString(), { method: 'GET' });
      if (!res.ok) return { unreadCount: 0 };
      return (await res.json()) as { unreadCount: number };
    },
    enabled: Boolean(currentTarget),
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
  const unreadCount = unreadData?.unreadCount ?? 0;
  
  // Get recent workspaces from store (sorted by lastModified, deduplicated, limit to 5)
  const recentWorkspaces = useMemo(() => {
    if (recentWorkspacesProp && recentWorkspacesProp.length > 0) {
      return recentWorkspacesProp;
    }
    
    // Deduplicate workspaces by target (keep most recent)
    // For KRAS G12C, use a more specific key that includes the query
    const workspaceMap = new Map<string, Workspace>();
    workspaces.forEach(ws => {
      // Create unique key: for KRAS G12C, use target + name; for others, just target
      let key: string;
      if (toTargetKey(ws.target) === 'kras' || ws.name.toLowerCase().includes('kras')) {
        // For KRAS, use target + normalized name to distinguish G12C from other variants
        const normalizedName = ws.name.toLowerCase().replace(/\s*analysis\s*$/i, '').trim();
        key = `${toTargetKey(ws.target)}-${normalizedName}`;
      } else {
        // For other targets like TROP2, just use target
        key = toTargetKey(ws.target);
      }
      
      const existing = workspaceMap.get(key);
      if (!existing || new Date(ws.lastModified) > new Date(existing.lastModified)) {
        workspaceMap.set(key, ws);
      }
    });
    
    // Clean up workspace names (remove "Analysis" suffix and handle duplicate patterns)
    const cleanedWorkspaces = Array.from(workspaceMap.values()).map(ws => {
      let cleanName = ws.name
        .replace(/\s*-\s*[^-]*Analysis\s*$/i, '') // Remove " - Analysis" suffix
        .replace(/\s*Analysis\s*$/i, '') // Remove "Analysis" suffix
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
    
    // Filter to only show TROP2 and KRAS G12C workspaces
    const filteredWorkspaces = cleanedWorkspaces.filter(ws => {
      const targetKey = toTargetKey(ws.target);
      const nameLower = ws.name.toLowerCase();
      
      // Include TROP2
      if (targetKey === 'trop2') return true;
      
      // Include KRAS G12C (check both target and name)
      if (targetKey.includes('kras') && nameLower.includes('g12c')) return true;
      if (nameLower.includes('kras') && nameLower.includes('g12c')) return true;
      
      return false;
    });
    
    return filteredWorkspaces
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 5);
  }, [workspaces, recentWorkspacesProp]);

  // Load collapsed state and width from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem(STORAGE_KEY);
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true');
    }
    
    const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (savedWidth !== null) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setSidebarWidth(width);
      }
    }
  }, [setCollapsed]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed.toString());
  }, [collapsed]);

  // Save width to localStorage
  useEffect(() => {
    if (!collapsed && sidebarWidth !== DEFAULT_WIDTH) {
      localStorage.setItem(WIDTH_STORAGE_KEY, sidebarWidth.toString());
    }
  }, [sidebarWidth, collapsed]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      
      const rect = sidebarRef.current.getBoundingClientRect();
      // Calculate width from the left edge of the sidebar to the mouse position
      const newWidth = e.clientX - rect.left;
      
      // Clamp width between min and max
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (collapsed || !sidebarRef.current) return;

      // Only handle arrow keys when sidebar is focused or user is navigating
      if (!sidebarRef.current.contains(document.activeElement)) {
        // Check for Cmd/Ctrl + / for keyboard shortcuts hint
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          // Could show keyboard shortcuts modal here
        }
        return;
      }

      const navItems: ViewState[] = ['dashboard', 'workspaces', 'feed'];
      const allNavItems: ViewState[] = [...navItems, 'history', 'research'];
      const currentIndex = allNavItems.indexOf(currentView);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < allNavItems.length - 1) {
            onViewChange(allNavItems[currentIndex + 1]);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            onViewChange(allNavItems[currentIndex - 1]);
          }
          break;
        case 'Home':
          e.preventDefault();
          onViewChange('dashboard');
          break;
        case 'End':
          e.preventDefault();
          onViewChange('research');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [collapsed, currentView, onViewChange]);

  const personaConfig = {
    scientist: {
      label: 'Scientist',
      icon: FlaskConical,
      color: '#BF5AF2',
      description: 'Deep scientific analysis and target validation',
    },
    bd: {
      label: 'Scout',
      icon: Briefcase,
      color: '#FF9F0A',
      description: 'Business development and deal analysis',
    },
  };

  interface NavItem {
    id: ViewState;
    icon: typeof LayoutGrid;
    label: string;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard' as ViewState, icon: LayoutGrid, label: 'Dashboard' },
    { id: 'workspaces' as ViewState, icon: FolderOpen, label: 'Workspaces' },
    { id: 'history' as ViewState, icon: History, label: 'Recent' },
    { id: 'research' as ViewState, icon: Microscope, label: 'Research' },
  ];

  const bottomNavItems: NavItem[] = [
    { id: 'feed' as ViewState, icon: Bell, label: 'Intelligence Feed', badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  const getWorkspaceStatusColor = (status: Workspace['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary';
      case 'completed':
        return 'bg-success';
      case 'archived':
        return 'bg-textTertiary';
    }
  };

  const currentWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: currentWidth }}
      transition={{ duration: isResizing ? 0 : 0.3 }}
      style={{ width: currentWidth }}
      className="relative bg-surface border-r border-white/5 flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Resize Handle - Notion Style */}
      {!collapsed && (
        <div
          ref={resizeHandleRef}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 group"
          aria-label="Resize sidebar"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-primary/60 transition-colors" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-transparent group-hover:bg-primary/30 rounded-full transition-colors" />
        </div>
      )}
      {/* Brand Header - Notion Style */}
      <div className={`${collapsed ? 'p-3' : 'p-4'} border-b border-white/5`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative flex-shrink-0">
            <div className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center`}>
              <div className={`${collapsed ? 'w-5 h-5' : 'w-7 h-7'} rounded bg-white/20 backdrop-blur-sm`}></div>
            </div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                LUMINA
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Persona Switcher - Vertical Notion Style */}
      <div className="px-3 py-2 border-b border-white/5">
        {!collapsed && (
          <p className="text-xs text-textTertiary mb-2 px-2 font-medium tracking-wider uppercase">PERSONA</p>
        )}
        <div className={collapsed ? 'flex flex-col gap-2' : 'flex flex-col gap-1.5'}>
          {(Object.keys(personaConfig) as Persona[]).map((persona) => {
            const config = personaConfig[persona];
            const Icon = config.icon;
            const isActive = activePersona === persona;

            return (
              <button
                key={persona}
                onClick={() => onPersonaChange(persona)}
                className={`group relative w-full flex items-center gap-3 px-2.5 py-2 rounded transition-all duration-150 ${
                  isActive
                    ? 'bg-surfaceElevated/60 text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface/30'
                } ${collapsed ? 'justify-center' : ''}`}
                style={
                  isActive
                    ? {
                        boxShadow: `inset 0 0 0 1px ${config.color}30`,
                      }
                    : {}
                }
                title={collapsed ? config.description : undefined}
              >
                <Icon
                  className="w-5 h-5 transition-colors flex-shrink-0"
                  style={{ color: isActive ? config.color : undefined }}
                />
                {!collapsed && (
                  <span
                    className="text-base transition-colors font-medium"
                    style={{ color: isActive ? config.color : undefined }}
                  >
                    {config.label}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="bg-surfaceElevated border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                      <p className="text-sm font-medium text-textPrimary">{config.label}</p>
                      <p className="text-xs text-textSecondary mt-1">{config.description}</p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

          {/* Current Context - Notion Style */}
          {!collapsed && currentTarget && (
            <div className="px-3 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2.5 px-2">
                <Target className="w-4 h-4 text-textTertiary" />
                <span className="text-xs text-textTertiary font-medium tracking-wider uppercase">CURRENT TARGET</span>
              </div>
              <h3 className="text-lg font-semibold text-textPrimary mb-2.5 px-2 leading-tight">{currentTarget}</h3>
            </div>
          )}

      {/* Navigation Items - Notion Style */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-1">
        <div className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`group relative w-full flex items-center gap-3 px-2.5 py-2 rounded transition-all duration-150 ${
                  isActive
                    ? 'bg-surfaceElevated/50 text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface/30'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-base leading-relaxed">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="bg-surfaceElevated border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-sm text-textPrimary">{item.label}</p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-2 px-2">
          <div className="h-px bg-white/5" />
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-1 px-2 pb-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewChange(item.id);
                }}
                className={`group relative w-full flex items-center gap-3 px-2.5 py-2 rounded transition-all duration-150 ${
                  isActive
                    ? 'bg-surfaceElevated/50 text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface/30'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <div className="relative flex-shrink-0">
                  <Icon className="w-5 h-5" />
                  {item.badge && !collapsed && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full flex items-center justify-center text-xs text-white font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-base flex-1 text-left leading-relaxed">{item.label}</span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <div className="bg-surfaceElevated border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-sm text-textPrimary">{item.label}</p>
                      {item.badge && (
                        <span className="text-xs text-textSecondary mt-1">{item.badge} new items</span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Saved Workspaces - Notion Style */}
        {!collapsed && recentWorkspaces.length > 0 && (
          <div className="mt-4 px-2">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-xs text-textTertiary font-medium tracking-wider uppercase">WORKSPACES</span>
            </div>
            <div className="space-y-1">
              {recentWorkspaces.map((workspace) => {
                const isActive = String(workspace.id) === String(activeWorkspaceId);
                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      sessionStorage.setItem('lumina-has-selected-target', 'true');
                      setActiveWorkspace(String(workspace.id));
                    }}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded transition-colors group ${
                      isActive
                        ? 'text-textPrimary bg-surface/50 border border-primary/20'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surface/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${getWorkspaceStatusColor(workspace.status)}`} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-base leading-relaxed truncate">{workspace.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer - Notion Style */}
      <div className="px-3 py-2 border-t border-white/5 space-y-1">
        {/* Panel Toggle Button - Above Settings */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-base leading-relaxed">Close Sidebar</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelIcon className="w-5 h-5" />
          </button>
        )}

        {!collapsed && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-base leading-relaxed">Settings</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}

        <div className="relative" ref={userMenuRef}>
          {!collapsed ? (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-base leading-relaxed">User</span>
            </button>
          ) : (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-center p-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
              title="User menu"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </button>
          )}

          {showUserMenu && (
            <div className={`absolute bottom-full mb-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-slide-up ${
              collapsed 
                ? 'left-full ml-2 w-48' 
                : 'left-0 w-full'
            }`}>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-textPrimary hover:bg-surface transition-colors">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">Profile</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-textPrimary hover:bg-surface transition-colors">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">Preferences</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-danger hover:bg-surface transition-colors">
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {!collapsed && (
          <button className="w-full flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-base leading-relaxed">Help & Docs</span>
          </button>
        )}
        {collapsed && (
          <button
            className="w-full flex items-center justify-center p-2 text-textSecondary hover:text-textPrimary hover:bg-surface/30 rounded transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}

      </div>
    </motion.aside>
  );
});

export default Sidebar;
