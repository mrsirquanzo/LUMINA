import { describe, it, expect } from 'vitest';
import { buildEngineDeps } from './engineDeps.js';

describe('buildEngineDeps', () => {
  it('assembles the full engine dependency bundle for the ollama backend', async () => {
    const d = await buildEngineDeps('ollama', 'thorough');
    expect(Array.isArray(d.roster)).toBe(true);
    expect(d.roster.length).toBe(6);
    expect(d.literatureTools).toHaveLength(3);
    expect(d.structuredTools).toHaveLength(2);
    expect(typeof d.specialistModel.generateStructured).toBe('function');
    expect(typeof d.verifierModel.generateStructured).toBe('function');
    expect(typeof d.leadModel.generateStructured).toBe('function');
    expect(d.budget.maxRounds).toBe(4);
  });
  it('maps fast mode to a smaller research budget', async () => {
    const d = await buildEngineDeps('ollama', 'fast');
    expect(d.budget.maxRounds).toBe(2);
  });
});
