import { create } from 'zustand';

const STORAGE_KEY = 'lumina:projects:workspaces:v1';
export const DEFAULT_PROJECT_ICON = '📄';

export interface ProjectExperiment {
  id: string;
  label: string;
  capability: string;
  scenarioId: string;
}

export interface ProjectDataset {
  name: string;
  note?: string;
  href?: string;
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  target: string;
  experiments: ProjectExperiment[];
  datasets: ProjectDataset[];
}

export type ProjectSeed = Omit<Project, 'id'> & { id?: string };

export const DEFAULT_PROJECTS: ProjectSeed[] = [
  { name: 'TROP2', icon: '🔬', target: 'TROP2', experiments: [], datasets: [] },
  { name: 'CDCP1', icon: '🧬', target: 'CDCP1', experiments: [], datasets: [] },
  {
    name: 'BT474 / HER2 signaling',
    icon: '🧫',
    target: 'HER2',
    experiments: [
      { id: 'western', label: 'Western blot densitometry', capability: 'western-blot', scenarioId: 'western-blot' },
    ],
    datasets: [
      { name: 'BT474 trastuzumab blot', note: 'HER2/HSP90/GAPDH, IJMS 2025 CC BY', href: '/workbook/western/source_blot.png' },
    ],
  },
  {
    name: 'B-cell immunophenotyping',
    icon: '🧪',
    target: '',
    experiments: [
      { id: 'flow', label: 'Flow cytometry gating', capability: 'flow-cytometry', scenarioId: 'flow' },
    ],
    datasets: [
      { name: 'A02 WLSM.fcs', note: 'Sony ID7000, 13-colour B-cell panel, 19,364 events' },
    ],
  },
  {
    name: 'Combination screen (MALME-3M)',
    icon: '⚗️',
    target: '',
    experiments: [
      { id: 'combo', label: 'Synergy screen', capability: 'combination-screening', scenarioId: 'combination-screening' },
    ],
    datasets: [
      { name: 'comboFM matrix', note: '6 pairs, 8x8 dose grids, Julkunen 2020' },
    ],
  },
];

function createId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return `${slug}-${suffix}`;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeExperiment(value: unknown): ProjectExperiment | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ProjectExperiment>;
  const id = text(candidate.id);
  const label = text(candidate.label);
  const capability = text(candidate.capability);
  const scenarioId = text(candidate.scenarioId);
  if (!id || !label || !capability || !scenarioId) return null;
  return { id, label, capability, scenarioId };
}

function normalizeDataset(value: unknown): ProjectDataset | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ProjectDataset>;
  const name = text(candidate.name);
  if (!name) return null;
  const note = text(candidate.note);
  const href = text(candidate.href);
  return { name, ...(note ? { note } : {}), ...(href ? { href } : {}) };
}

export function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return [];
  const projects: Project[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<Project>;
    const name = text(candidate.name);
    if (!name) continue;
    const id = text(candidate.id) || createId(name);
    if (seen.has(id)) continue;
    seen.add(id);

    const experiments = Array.isArray(candidate.experiments)
      ? candidate.experiments.map(normalizeExperiment).filter((experiment): experiment is ProjectExperiment => Boolean(experiment))
      : [];
    const datasets = Array.isArray(candidate.datasets)
      ? candidate.datasets.map(normalizeDataset).filter((dataset): dataset is ProjectDataset => Boolean(dataset))
      : [];

    projects.push({
      id,
      name,
      icon: text(candidate.icon) || DEFAULT_PROJECT_ICON,
      target: text(candidate.target),
      experiments: experiments.filter((experiment, index) => experiments.findIndex((item) => item.id === experiment.id) === index),
      datasets,
    });
  }

  return projects;
}

export function loadProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  try {
    return normalizeProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

function persist(projects: Project[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Persistence is best-effort in private browsing and restricted contexts.
  }
}

interface ProjectStore {
  projects: Project[];
  add(name: string): void;
  rename(id: string, name: string): void;
  remove(id: string): void;
  setIcon(id: string, emoji: string): void;
  pinExperiment(projectId: string, experiment: ProjectExperiment): void;
  unpin(projectId: string, experimentId: string): void;
  seedIfEmpty(defaults: ProjectSeed[]): void;
}

function updateAndPersist(set: (state: Partial<ProjectStore>) => void, projects: Project[]): void {
  persist(projects);
  set({ projects });
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: loadProjects(),
  add: (rawName) => {
    const name = text(rawName);
    if (!name) return;
    const project: Project = {
      id: createId(name),
      name,
      icon: DEFAULT_PROJECT_ICON,
      target: name,
      experiments: [],
      datasets: [],
    };
    updateAndPersist(set, [...get().projects, project]);
  },
  rename: (id, rawName) => {
    const name = text(rawName);
    if (!name || !get().projects.some((project) => project.id === id)) return;
    updateAndPersist(set, get().projects.map((project) => project.id === id ? { ...project, name } : project));
  },
  remove: (id) => {
    if (!get().projects.some((project) => project.id === id)) return;
    updateAndPersist(set, get().projects.filter((project) => project.id !== id));
  },
  setIcon: (id, rawEmoji) => {
    const icon = text(rawEmoji);
    if (!icon || !get().projects.some((project) => project.id === id)) return;
    updateAndPersist(set, get().projects.map((project) => project.id === id ? { ...project, icon } : project));
  },
  pinExperiment: (projectId, value) => {
    const experiment = normalizeExperiment(value);
    const project = get().projects.find((item) => item.id === projectId);
    if (!experiment || !project || project.experiments.some((item) => item.id === experiment.id)) return;
    updateAndPersist(set, get().projects.map((item) => item.id === projectId
      ? { ...item, experiments: [...item.experiments, experiment] }
      : item));
  },
  unpin: (projectId, experimentId) => {
    const project = get().projects.find((item) => item.id === projectId);
    if (!project || !project.experiments.some((item) => item.id === experimentId)) return;
    updateAndPersist(set, get().projects.map((item) => item.id === projectId
      ? { ...item, experiments: item.experiments.filter((experiment) => experiment.id !== experimentId) }
      : item));
  },
  seedIfEmpty: (defaults) => {
    // Guard before set because Zustand notifies subscribers even for no-op merges.
    if (get().projects.length > 0) return;
    const projects = normalizeProjects(defaults);
    if (projects.length === 0) return;
    updateAndPersist(set, projects);
  },
}));
