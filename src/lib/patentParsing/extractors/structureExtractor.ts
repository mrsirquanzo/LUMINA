/**
 * Structure Extractor
 * Extracts chemical structures (Markush, SMILES, specific compounds) from patent text
 */

import type { MarkushStructure, SmallMolecule, MarkushVariable } from '../types';

export interface StructureExtractionResult {
  markush_structures: MarkushStructure[];
  specific_compounds: SmallMolecule[];
  extraction_confidence: number;
}

/**
 * Extract all chemical structures from patent text
 */
export function extractStructures(
  text: string,
  examples?: string[]
): StructureExtractionResult {
  const markush_structures = extractMarkushStructures(text);
  const specific_compounds = extractSpecificCompounds(text, examples || []);

  // Calculate overall confidence
  const confidence = calculateExtractionConfidence(markush_structures, specific_compounds);

  return {
    markush_structures,
    specific_compounds,
    extraction_confidence: confidence,
  };
}

/**
 * Extract Markush structures from text
 */
function extractMarkushStructures(text: string): MarkushStructure[] {
  const structures: MarkushStructure[] = [];

  // Match Formula I, Formula (I), Formula A, etc.
  const formulaRegex = /(?:Formula|formula)\s*\(?([IVX]+|[A-Z])\)?/gi;
  const formulaMatches: RegExpExecArray[] = [];
  let match;
  while ((match = formulaRegex.exec(text)) !== null) {
    formulaMatches.push(match);
  }

  for (const match of formulaMatches) {
    const formulaId = `Formula ${match[1]}`;
    const formulaSection = extractFormulaSection(text, formulaId);

    if (formulaSection) {
      const structure = parseMarkushStructure(formulaId, formulaSection);
      if (structure) {
        structures.push(structure);
      }
    }
  }

  return structures;
}

/**
 * Extract section containing formula definition
 */
function extractFormulaSection(text: string, formulaId: string): string | null {
  // Find formula definition - typically follows "Formula X" or "of Formula X"
  const pattern = new RegExp(
    `(?:of\\s+)?${formulaId.replace(/[()]/g, '\\$&')}[\\s\\S]{0,2000}(?:wherein|where|R\\d+\\s+is|X\\s+is|Y\\s+is)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? match[0] : null;
}

/**
 * Parse Markush structure from text
 */
function parseMarkushStructure(
  formulaId: string,
  formulaText: string
): MarkushStructure | null {
  const variables: Record<string, MarkushVariable> = {};

  // Extract variable definitions: "R1 is selected from...", "wherein X represents..."
  const variableRegex = /(?:R|X|Y|Z|A|B)(\d+|[A-Z]?)\s+is\s+(?:selected\s+from|represents?|is)\s+([^.;]+)/gi;
  let match;

  while ((match = variableRegex.exec(formulaText)) !== null) {
    const varName = match[1] ? `R${match[1]}` : match[0].match(/[RXZYAB]\d*/)?.[0] || 'R1';
    const optionsText = match[2];

    // Parse options
    const options = optionsText
      .split(/[,;]|\s+or\s+/i)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    // Identify preferred option (if marked)
    let preferred: string | undefined;
    const preferredMatch = optionsText.match(/(?:preferably|preferred|more\s+preferably)\s+([^,;]+)/i);
    if (preferredMatch) {
      preferred = preferredMatch[1].trim();
    }

    variables[varName] = {
      variable_name: varName,
      position: 'unknown', // Would need structure parsing to determine
      options,
      preferred,
      confidence: 0.8,
    };
  }

  // Determine genus scope
  const genus_scope = determineGenusScope(formulaText, variables);

  // Extract core structure if mentioned
  const coreMatch = formulaText.match(/(?:core|scaffold|backbone)[\s\S]{0,500}/i);
  const core_structure = coreMatch ? coreMatch[0].substring(0, 200) : undefined;

  return {
    formula_id: formulaId,
    core_structure,
    variables,
    genus_scope,
    confidence: (variables?.length ?? 0) > 0 ? 0.75 : 0.5,
  };
}

/**
 * Determine genus scope (broad/moderate/narrow)
 */
function determineGenusScope(
  formulaText: string,
  variables: Record<string, MarkushVariable>
): 'broad' | 'moderate' | 'narrow' {
  const varCount = Object.keys(variables).length;
  const totalOptions = Object.values(variables).reduce((sum, v) => sum + v.options.length, 0);

  // Broad: many variables, many options each
  if (varCount >= 5 || totalOptions > 20) return 'broad';

  // Narrow: few variables, limited options
  if (varCount <= 2 && totalOptions <= 5) return 'narrow';

  return 'moderate';
}

/**
 * Extract specific compounds from examples and text
 */
function extractSpecificCompounds(text: string, examples: string[]): SmallMolecule[] {
  const compounds: SmallMolecule[] = [];

  // Extract from examples
  for (const example of examples) {
    const exampleCompounds = extractCompoundsFromExample(example);
    compounds.push(...exampleCompounds);
  }

  // Extract from main text (named compounds)
  const namedCompounds = extractNamedCompounds(text);
  compounds.push(...namedCompounds);

  return compounds;
}

/**
 * Extract compounds from example text
 */
function extractCompoundsFromExample(exampleText: string): SmallMolecule[] {
  const compounds: SmallMolecule[] = [];

  // Match "Example 1:", "Compound 1:", "Preparation of Compound 1"
  const compoundRegex = /(?:Example|Compound|Preparation)\s+(\d+[A-Z]?)[:\-]?\s*([\s\S]{100,2000})/gi;
  let match;

  while ((match = compoundRegex.exec(exampleText)) !== null) {
    const compoundId = match[1];
    const compoundText = match[2];

    // Try to extract SMILES (if present)
    const smilesMatch = compoundText.match(/SMILES[:\s]+([A-Za-z0-9@+\-\[\]()=#]+)/i);
    const smiles = smilesMatch ? smilesMatch[1] : undefined;

    // Extract molecular weight if mentioned
    const mwMatch = compoundText.match(/(?:MW|molecular\s+weight|M\.W\.)[:\s]+(\d+\.?\d*)/i);
    const molecular_weight = mwMatch ? parseFloat(mwMatch[1]) : undefined;

    // Extract activity data
    const activityMatch = compoundText.match(/(?:IC50|EC50|Ki|Kd)[:\s]+([\d.]+)\s*(nM|μM|mM)/i);
    const key_activity = activityMatch ? `${activityMatch[1]} ${activityMatch[2]}` : undefined;

    compounds.push({
      compound_id: compoundId,
      smiles,
      molecular_weight,
      structure_source: 'example',
      key_activity,
      confidence: smiles ? 0.9 : 0.7,
    });
  }

  return compounds;
}

/**
 * Extract named compounds from text
 */
function extractNamedCompounds(text: string): SmallMolecule[] {
  const compounds: SmallMolecule[] = [];

  // Match "compound A", "compound B", "selected from compound 1, compound 2"
  const namedRegex = /(?:compound|Compound)\s+([A-Z0-9]+)[\s\S]{0,500}/gi;
  let match;

  while ((match = namedRegex.exec(text)) !== null) {
    const compoundId = match[1];
    const context = match[0];

    // Try to find SMILES or structure description
    const smilesMatch = context.match(/SMILES[:\s]+([A-Za-z0-9@+\-\[\]()=#]+)/i);
    const smiles = smilesMatch ? smilesMatch[1] : undefined;

    compounds.push({
      compound_id: compoundId,
      smiles,
      structure_source: 'text',
      confidence: smiles ? 0.85 : 0.6,
    });
  }

  return compounds;
}

/**
 * Calculate overall extraction confidence
 */
function calculateExtractionConfidence(
  markush: MarkushStructure[],
  compounds: SmallMolecule[]
): number {
  if (markush.length === 0 && compounds.length === 0) return 0.3;

  const markushConf = markush.length > 0
    ? markush.reduce((sum, m) => sum + m.confidence, 0) / markush.length
    : 0;

  const compoundConf = compounds.length > 0
    ? compounds.reduce((sum, c) => sum + c.confidence, 0) / compounds.length
    : 0;

  if (markush.length > 0 && compounds.length > 0) {
    return (markushConf + compoundConf) / 2;
  }

  return markushConf || compoundConf;
}
