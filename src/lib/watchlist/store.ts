import { create } from 'zustand';
import { formatTargetDisplayName } from '../targetNaming.js';

const KEY = 'lumina:intelligence:trackedTargets:v1';
const CAP = 8;
export const DEFAULT_PROJECT_ICON = '📄';

export interface WatchlistProject {
  id: string;
  target: string;
  icon: string;
}

function projectId(target: string): string {
  const slug = target.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `${slug}-${suffix}`;
}

function normalizeTarget(raw: unknown): string {
  return formatTargetDisplayName(String(raw ?? '')).trim();
}

function normalizeProjects(list: unknown[]): WatchlistProject[] {
  const out: WatchlistProject[] = [];
  const seen = new Set<string>();

  for (const raw of list) {
    const source = typeof raw === 'string' ? { target: raw } : raw;
    if (!source || typeof source !== 'object') continue;

    const candidate = source as Partial<WatchlistProject>;
    const target = normalizeTarget(candidate.target);
    if (!target) continue;

    const key = target.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : projectId(target),
      target,
      icon: typeof candidate.icon === 'string' && candidate.icon.trim() ? candidate.icon : DEFAULT_PROJECT_ICON,
    });
  }

  return out;
}

/** Read persisted projects, including migration from the legacy string array. */
export function loadProjects(): WatchlistProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? normalizeProjects(parsed).slice(-CAP) : [];
  } catch {
    return [];
  }
}

/** Backwards-compatible target selector used by the intelligence feed. */
export function loadTargets(): string[] {
  return loadProjects().map((project) => project.target);
}

function persist(projects: WatchlistProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    // Persistence is best-effort in private browsing and restricted contexts.
  }
}

function stateFor(projects: WatchlistProject[]) {
  return { projects, targets: projects.map((project) => project.target) };
}

interface WatchlistStore {
  projects: WatchlistProject[];
  targets: string[];
  add(target: string, icon?: string): void;
  remove(targetOrId: string): void;
  rename(id: string, target: string): void;
  setIcon(id: string, emoji: string): void;
  seedIfEmpty(defaults: string[]): void;
}

const initialProjects = loadProjects();

export const useWatchlistStore = create<WatchlistStore>()((set, get) => ({
  ...stateFor(initialProjects),
  add: (rawTarget, icon = DEFAULT_PROJECT_ICON) =>
    set(() => {
      const target = normalizeTarget(rawTarget);
      if (!target) return {};

      const key = target.toLowerCase();
      const existing = get().projects.find((project) => project.target.toLowerCase() === key);
      const projects = [
        ...get().projects.filter((project) => project.target.toLowerCase() !== key),
        existing ? { ...existing, target } : { id: projectId(target), target, icon },
      ].slice(-CAP);
      persist(projects);
      return stateFor(projects);
    }),
  remove: (targetOrId) =>
    set(() => {
      const key = normalizeTarget(targetOrId).toLowerCase();
      const projects = get().projects.filter(
        (project) => project.id !== targetOrId && project.target.toLowerCase() !== key,
      );
      persist(projects);
      return stateFor(projects);
    }),
  rename: (id, rawTarget) =>
    set(() => {
      const target = normalizeTarget(rawTarget);
      if (!target) return {};
      const key = target.toLowerCase();
      if (get().projects.some((project) => project.id !== id && project.target.toLowerCase() === key)) return {};

      const projects = get().projects.map((project) => project.id === id ? { ...project, target } : project);
      persist(projects);
      return stateFor(projects);
    }),
  setIcon: (idOrTarget, emoji) =>
    set(() => {
      const icon = emoji.trim();
      if (!icon) return {};
      const key = normalizeTarget(idOrTarget).toLowerCase();
      const projects = get().projects.map((project) =>
        project.id === idOrTarget || project.target.toLowerCase() === key ? { ...project, icon } : project,
      );
      persist(projects);
      return stateFor(projects);
    }),
  seedIfEmpty: (defaults) =>
    set(() => {
      if (get().projects.length > 0) return {};
      const projects = normalizeProjects(defaults).slice(-CAP);
      persist(projects);
      return stateFor(projects);
    }),
}));
