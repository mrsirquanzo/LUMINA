import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectDatasetFileSize, getProjectReports } from './ProjectWorkspace.js';
import { DEFAULT_PROJECTS, useProjectStore } from '../../lib/projects/store.js';
import { useBriefingStore } from '../../lib/research/briefingStore.js';
import type { BriefingView } from '../../lib/research/sseTypes.js';

describe('ProjectWorkspace', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });
    useProjectStore.setState({ projects: [] });
    useProjectStore.getState().seedIfEmpty(DEFAULT_PROJECTS);
    useBriefingStore.setState({ briefings: {}, savedAt: {} });
  });

  it('keeps HER2 reports empty while retaining real experiment and dataset metadata', () => {
    const project = useProjectStore.getState().projects.find((item) => item.target === 'HER2');
    expect(project).toBeDefined();
    expect(getProjectReports(project, {}, {})).toEqual([]);
    expect(project?.experiments[0].label).toBe('Western blot densitometry');
    expect(project?.datasets[0].name).toBe('BT474 trastuzumab blot');
    expect(getProjectDatasetFileSize(project!)).toBe(0.3);
  });

  it('renders the real flow and combination workspace contents', () => {
    const projects = useProjectStore.getState().projects;
    const flow = projects.find((item) => item.name === 'B-cell immunophenotyping');
    const combo = projects.find((item) => item.name === 'Combination screen (MALME-3M)');

    expect(flow?.experiments[0].label).toBe('Flow cytometry gating');
    expect(flow?.datasets[0].name).toBe('A02 WLSM.fcs');
    expect(getProjectDatasetFileSize(flow!)).toBe(1.44);
    expect(combo?.experiments[0].label).toBe('Synergy screen');
    expect(combo?.datasets[0].name).toBe('comboFM matrix');
    expect(getProjectDatasetFileSize(combo!)).toBe(0.2);
  });

  it('shows a completed briefing only in the case-insensitive target workspace', () => {
    useBriefingStore.setState({
      briefings: {
        'TROP2-real-run': {
          target: 'trop2',
          executiveRead: 'Grounded TROP2 report.',
          recommendation: { verdict: 'WATCH' },
        } as BriefingView,
      },
      savedAt: { 'TROP2-real-run': 1 },
    });
    const projects = useProjectStore.getState().projects;
    const trop2 = projects.find((item) => item.target === 'TROP2');
    const her2 = projects.find((item) => item.target === 'HER2');

    const state = useBriefingStore.getState();
    expect(getProjectReports(trop2, state.briefings, state.savedAt)[0].snippet).toBe('Grounded TROP2 report.');
    expect(getProjectReports(her2, state.briefings, state.savedAt)).toEqual([]);
  });
});
