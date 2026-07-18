import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROJECTS, loadProjects, useProjectStore } from './store.js';

describe('project workspace store', () => {
  let memory: Record<string, string> = {};

  beforeEach(() => {
    memory = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => { memory[key] = value; },
    });
    vi.stubGlobal('window', {});
    useProjectStore.setState({ projects: [] });
  });

  it('seeds the five grounded workspaces only when empty', () => {
    useProjectStore.getState().seedIfEmpty(DEFAULT_PROJECTS);
    const projects = useProjectStore.getState().projects;
    expect(projects).toHaveLength(5);
    expect(projects.map((project) => project.name)).toEqual(DEFAULT_PROJECTS.map((project) => project.name));
    expect(projects.find((project) => project.target === 'HER2')?.experiments[0].id).toBe('western');

    useProjectStore.getState().seedIfEmpty([]);
    expect(useProjectStore.getState().projects).toHaveLength(5);
  });

  it('persists rename, icons, pins, and unpins', () => {
    useProjectStore.getState().add('New project');
    const project = useProjectStore.getState().projects[0];
    useProjectStore.getState().rename(project.id, 'Renamed project');
    useProjectStore.getState().setIcon(project.id, '🧬');
    useProjectStore.getState().pinExperiment(project.id, {
      id: 'flow',
      label: 'Flow cytometry gating',
      capability: 'flow-cytometry',
      scenarioId: 'flow',
    });
    useProjectStore.getState().pinExperiment(project.id, {
      id: 'flow',
      label: 'Flow cytometry gating',
      capability: 'flow-cytometry',
      scenarioId: 'flow',
    });

    expect(useProjectStore.getState().projects[0]).toMatchObject({ name: 'Renamed project', icon: '🧬' });
    expect(useProjectStore.getState().projects[0].experiments).toHaveLength(1);
    expect(loadProjects()[0].experiments).toHaveLength(1);

    useProjectStore.getState().unpin(project.id, 'flow');
    expect(useProjectStore.getState().projects[0].experiments).toEqual([]);
  });

  it('drops malformed persisted records without fabricating fields', () => {
    memory['lumina:projects:workspaces:v1'] = JSON.stringify([
      { id: 'valid', name: 'Valid', icon: '🔬', target: 'TROP2', experiments: [{ id: 'bad' }], datasets: [{ name: 'real.file' }] },
      { id: 'missing-name', target: 'CDCP1' },
    ]);

    expect(loadProjects()).toEqual([
      { id: 'valid', name: 'Valid', icon: '🔬', target: 'TROP2', experiments: [], datasets: [{ name: 'real.file' }] },
    ]);
  });
});
