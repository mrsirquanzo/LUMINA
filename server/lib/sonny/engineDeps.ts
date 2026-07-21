import type { ThreadBrief, ResearchBudget, StructuredModel } from '@mrsirquanzo/sonny-core';
import type { Tool } from '@mrsirquanzo/sonny-mcp-gateway';
import { makeDocumentTool, type UploadedDocument } from './documentTool.js';

export type Backend = 'ollama' | 'anthropic';

export interface EngineDeps {
  roster: ThreadBrief[];
  literatureTools: Tool[];
  structuredTools: Tool[];
  specialistModel: StructuredModel;
  verifierModel: StructuredModel;
  leadModel: StructuredModel;
  budget: ResearchBudget;
}

export async function buildEngineDeps(
  backend: Backend,
  mode: 'fast' | 'thorough',
  documents: UploadedDocument[] = [],
): Promise<EngineDeps> {
  process.env.SONNY_BACKEND = backend; // makeModel() reads this at call time
  const core = await import('@mrsirquanzo/sonny-core');
  const mcp  = await import('@mrsirquanzo/sonny-mcp-gateway');
  const documentTool = makeDocumentTool(documents);
  const structuredTools: Tool[] = [
    mcp.openTargetsTargetTool, mcp.uniProtTargetTool, mcp.clinicalTrialsTool, mcp.patentSearchTool,
    ...(documentTool ? [documentTool] : []),
  ];
  return {
    roster: core.RESEARCH_ROSTER,
    literatureTools: [mcp.europePmcSearchTool, mcp.pmcFullTextTool, mcp.europePmcCitationsTool],
    structuredTools,
    specialistModel: core.makeModel(),
    verifierModel: core.makeModel(),
    leadModel: core.makeModel(),
    budget: { maxRounds: mode === 'fast' ? 2 : 4 },
  };
}
