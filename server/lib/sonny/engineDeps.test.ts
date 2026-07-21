import { describe, it, expect } from 'vitest';
import { buildEngineDeps } from './engineDeps.js';

describe('buildEngineDeps', () => {
  it('assembles the full engine dependency bundle for the ollama backend', async () => {
    const d = await buildEngineDeps('ollama', 'thorough');
    expect(Array.isArray(d.roster)).toBe(true);
    expect(d.roster.length).toBe(6);
    expect(d.literatureTools).toHaveLength(3);
    // openTargets · uniProt · clinicalTrials · patentSearch
    expect(d.structuredTools).toHaveLength(4);
    expect(typeof d.specialistModel.generateStructured).toBe('function');
    expect(typeof d.verifierModel.generateStructured).toBe('function');
    expect(typeof d.leadModel.generateStructured).toBe('function');
    expect(d.budget.maxRounds).toBe(4);
  });
  it('maps fast mode to a smaller research budget', async () => {
    const d = await buildEngineDeps('ollama', 'fast');
    expect(d.budget.maxRounds).toBe(2);
  });
  it('appends an uploaded-documents tool when documents are provided', async () => {
    const withDocs = await buildEngineDeps('ollama', 'fast', [{ name: 'memo.pdf', text: 'CDCP1 is membranous.' }]);
    expect(withDocs.structuredTools).toHaveLength(5);
    expect(withDocs.structuredTools.some((t) => t.name === 'uploaded_documents')).toBe(true);
    const withoutDocs = await buildEngineDeps('ollama', 'fast', []);
    expect(withoutDocs.structuredTools).toHaveLength(4);
    expect(withoutDocs.structuredTools.some((t) => t.name === 'uploaded_documents')).toBe(false);
  });
});
