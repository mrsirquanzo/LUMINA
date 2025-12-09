/**
 * Cross-Reference Resolver
 * Resolves references like "claim 1", "Example 1", "Figure 2", "SEQ ID NO: 5"
 */

import type { CrossReference, Claim, SmallMolecule, AntibodySequence, NucleicAcidSequence } from '../types';

export interface ResolutionResult {
  resolved: boolean;
  content?: any;
  confidence: number;
  error?: string;
}

/**
 * Resolve cross-reference
 */
export function resolveCrossReference(
  reference: string,
  context: {
    claims?: Claim[];
    examples?: string[];
    compounds?: SmallMolecule[];
    antibodies?: AntibodySequence[];
    sequences?: NucleicAcidSequence[];
  }
): ResolutionResult {
  const refLower = reference.toLowerCase().trim();

  // Resolve claim references
  if (refLower.match(/^claim\s+\d+/)) {
    return resolveClaimReference(reference, context.claims || []);
  }

  // Resolve example references
  if (refLower.match(/^example\s+\d+/)) {
    return resolveExampleReference(reference, context.examples || []);
  }

  // Resolve compound references
  if (refLower.match(/^compound\s+[A-Z0-9]+/)) {
    return resolveCompoundReference(reference, context.compounds || []);
  }

  // Resolve SEQ ID NO references
  if (refLower.match(/seq\s+id\s+no[:\s]+\d+/)) {
    return resolveSequenceReference(reference, context.sequences || []);
  }

  // Resolve antibody references
  if (refLower.match(/^(ab|antibody)\s*[-]?\d+/)) {
    return resolveAntibodyReference(reference, context.antibodies || []);
  }

  return {
    resolved: false,
    confidence: 0,
    error: 'Unknown reference type',
  };
}

/**
 * Resolve claim reference
 */
function resolveClaimReference(
  reference: string,
  claims: Claim[]
): ResolutionResult {
  const claimNumMatch = reference.match(/claim\s+(\d+)/i);
  if (!claimNumMatch) {
    return {
      resolved: false,
      confidence: 0,
      error: 'Invalid claim reference format',
    };
  }

  const claimNumber = parseInt(claimNumMatch[1], 10);
  const claim = claims.find(c => c.claim_number === claimNumber);

  if (!claim) {
    return {
      resolved: false,
      confidence: 0,
      error: `Claim ${claimNumber} not found`,
    };
  }

  return {
    resolved: true,
    content: claim,
    confidence: 0.9,
  };
}

/**
 * Resolve example reference
 */
function resolveExampleReference(
  reference: string,
  examples: string[]
): ResolutionResult {
  const exampleNumMatch = reference.match(/example\s+(\d+[A-Z]?)/i);
  if (!exampleNumMatch) {
    return {
      resolved: false,
      confidence: 0,
      error: 'Invalid example reference format',
    };
  }

  const exampleId = exampleNumMatch[1];
  
  // Try to find matching example
  const exampleIndex = examples.findIndex(ex => 
    ex.match(new RegExp(`(?:Example|EXAMPLE)\\s+${exampleId}`, 'i'))
  );

  if (exampleIndex === -1) {
    return {
      resolved: false,
      confidence: 0,
      error: `Example ${exampleId} not found`,
    };
  }

  return {
    resolved: true,
    content: examples[exampleIndex],
    confidence: 0.85,
  };
}

/**
 * Resolve compound reference
 */
function resolveCompoundReference(
  reference: string,
  compounds: SmallMolecule[]
): ResolutionResult {
  const compoundMatch = reference.match(/compound\s+([A-Z0-9]+)/i);
  if (!compoundMatch) {
    return {
      resolved: false,
      confidence: 0,
      error: 'Invalid compound reference format',
    };
  }

  const compoundId = compoundMatch[1];
  const compound = compounds.find(c => 
    c.compound_id.toLowerCase() === compoundId.toLowerCase()
  );

  if (!compound) {
    return {
      resolved: false,
      confidence: 0,
      error: `Compound ${compoundId} not found`,
    };
  }

  return {
    resolved: true,
    content: compound,
    confidence: 0.9,
  };
}

/**
 * Resolve sequence reference
 */
function resolveSequenceReference(
  reference: string,
  sequences: NucleicAcidSequence[]
): ResolutionResult {
  const seqIdMatch = reference.match(/seq\s+id\s+no[:\s]+(\d+)/i);
  if (!seqIdMatch) {
    return {
      resolved: false,
      confidence: 0,
      error: 'Invalid SEQ ID NO reference format',
    };
  }

  const seqId = parseInt(seqIdMatch[1], 10);
  const sequence = sequences.find(s => s.seq_id_no === seqId);

  if (!sequence) {
    return {
      resolved: false,
      confidence: 0,
      error: `SEQ ID NO: ${seqId} not found`,
    };
  }

  return {
    resolved: true,
    content: sequence,
    confidence: 0.9,
  };
}

/**
 * Resolve antibody reference
 */
function resolveAntibodyReference(
  reference: string,
  antibodies: AntibodySequence[]
): ResolutionResult {
  const abMatch = reference.match(/(?:ab|antibody)\s*[-]?(\d+[A-Z]?)/i);
  if (!abMatch) {
    return {
      resolved: false,
      confidence: 0,
      error: 'Invalid antibody reference format',
    };
  }

  const abId = abMatch[1];
  const antibody = antibodies.find(ab => 
    ab.name.toLowerCase().includes(abId.toLowerCase())
  );

  if (!antibody) {
    return {
      resolved: false,
      confidence: 0,
      error: `Antibody ${abId} not found`,
    };
  }

  return {
    resolved: true,
    content: antibody,
    confidence: 0.9,
  };
}

/**
 * Resolve all cross-references in a text
 */
export function resolveAllCrossReferences(
  text: string,
  context: {
    claims?: Claim[];
    examples?: string[];
    compounds?: SmallMolecule[];
    antibodies?: AntibodySequence[];
    sequences?: NucleicAcidSequence[];
  }
): CrossReference[] {
  const references: CrossReference[] = [];

  // Find claim references
  const claimRegex = /(?:claim|claims)\s+(\d+)/gi;
  let match;
  while ((match = claimRegex.exec(text)) !== null) {
    const resolution = resolveClaimReference(match[0], context.claims || []);
    references.push({
      reference_type: 'claim',
      target: match[0],
      resolved: resolution.resolved,
      resolved_content: resolution.content,
      confidence: resolution.confidence,
    });
  }

  // Find example references
  const exampleRegex = /(?:example|EXAMPLE)\s+(\d+[A-Z]?)/gi;
  while ((match = exampleRegex.exec(text)) !== null) {
    const resolution = resolveExampleReference(match[0], context.examples || []);
    references.push({
      reference_type: 'example',
      target: match[0],
      resolved: resolution.resolved,
      resolved_content: resolution.content,
      confidence: resolution.confidence,
    });
  }

  // Find SEQ ID NO references
  const seqIdRegex = /SEQ\s+ID\s+NO[:\s]+(\d+)/gi;
  while ((match = seqIdRegex.exec(text)) !== null) {
    const resolution = resolveSequenceReference(match[0], context.sequences || []);
    references.push({
      reference_type: 'sequence',
      target: match[0],
      resolved: resolution.resolved,
      resolved_content: resolution.content,
      confidence: resolution.confidence,
    });
  }

  return references;
}
