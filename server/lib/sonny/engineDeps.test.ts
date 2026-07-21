import { describe, it, expect } from 'vitest';
import { buildEngineDeps } from './engineDeps.js';

describe('buildEngineDeps', () => {
  it('assembles the full engine dependency bundle for the ollama backend', async () => {
    const d = await buildEngineDeps('ollama', 'thorough');
    expect(Array.isArray(d.roster)).toBe(true);
    expect(d.roster.length).toBe(6);
    // europePMC search/fulltext/citations + HPA + GTEx (callable mid-research)
    expect(d.literatureTools).toHaveLength(5);
    expect(d.literatureTools.map((t) => t.name)).toEqual(
      expect.arrayContaining(['human_protein_atlas', 'gtex_expression']),
    );
    // openTargets · uniProt · clinicalTrials · patentSearch · HPA · GTEx
    expect(d.structuredTools).toHaveLength(6);
    expect(d.structuredTools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
      'human_protein_atlas',
      'gtex_expression',
    ]));
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
    expect(withDocs.structuredTools).toHaveLength(7);
    expect(withDocs.structuredTools.some((t) => t.name === 'uploaded_documents')).toBe(true);
    const withoutDocs = await buildEngineDeps('ollama', 'fast', []);
    expect(withoutDocs.structuredTools).toHaveLength(6);
    expect(withoutDocs.structuredTools.some((t) => t.name === 'uploaded_documents')).toBe(false);
  });
});
