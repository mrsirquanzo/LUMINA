/**
 * Claims Extractor
 * Parses patent claims, builds dependency trees, and extracts claim elements
 */

import type { Claim, ClaimElement, ClaimStructure, ClaimType } from '../types';

export interface ClaimsExtractionResult {
  claims: Claim[];
  dependency_tree: Map<number, number[]>;
  claim_type_distribution: Record<ClaimType, number[]>;
  total_claims: number;
  independent_claims: number;
}

/**
 * Extract and parse all claims from claims text
 */
export function extractClaims(claimsText: string): ClaimsExtractionResult {
  // Split claims by claim numbers
  const claimMatches = claimsText.match(/\d+\.\s+([\s\S]*?)(?=\d+\.\s+|$)/g);
  
  if (!claimMatches || claimMatches.length === 0) {
    // Try alternative format: "Claim 1", "Claim 2", etc.
    const altMatches = claimsText.match(/Claim\s+\d+[:\-]?\s*([\s\S]*?)(?=Claim\s+\d+|$)/gi);
    if (altMatches) {
      return parseClaims(altMatches);
    }
    return {
      claims: [],
      dependency_tree: new Map(),
      claim_type_distribution: {} as Record<ClaimType, number[]>,
      total_claims: 0,
      independent_claims: 0,
    };
  }

  return parseClaims(claimMatches);
}

/**
 * Parse individual claim texts
 */
function parseClaims(claimTexts: string[]): ClaimsExtractionResult {
  const claims: Claim[] = [];
  const dependency_tree = new Map<number, number[]>();

  for (const claimText of claimTexts) {
    const claim = parseSingleClaim(claimText);
    if (claim) {
      claims.push(claim);
      
      // Build dependency tree
      if (claim.depends_on && claim.depends_on.length > 0) {
        for (const parentClaim of claim.depends_on) {
          if (!dependency_tree.has(parentClaim)) {
            dependency_tree.set(parentClaim, []);
          }
          dependency_tree.get(parentClaim)!.push(claim.claim_number);
        }
      }
    }
  }

  // Build claim type distribution
  const claim_type_distribution: Record<ClaimType, number[]> = {
    composition_of_matter: [],
    method_of_treatment: [],
    pharmaceutical_composition: [],
    manufacturing_process: [],
    diagnostic: [],
    kit: [],
    other: [],
  };

  for (const claim of claims) {
    claim_type_distribution[claim.claim_type].push(claim.claim_number);
  }

  const independent_claims = claims.filter(c => c.is_independent).length;

  return {
    claims,
    dependency_tree,
    claim_type_distribution,
    total_claims: claims.length,
    independent_claims,
  };
}

/**
 * Parse a single claim
 */
function parseSingleClaim(claimText: string): Claim | null {
  // Extract claim number
  const numberMatch = claimText.match(/^(\d+)[\.\s]/);
  if (!numberMatch) return null;

  const claimNumber = parseInt(numberMatch[1], 10);
  const claimTextClean = claimText.replace(/^\d+[\.\s]+/, '').trim();

  // Determine if independent (doesn't reference other claims)
  const dependsOnMatch = claimTextClean.match(/according to claim (\d+)|claim (\d+)|claims? (\d+)/i);
  const depends_on: number[] = [];
  
  if (dependsOnMatch) {
    // Extract all referenced claim numbers
    const claimRefRegex = /(?:claim|claims)\s+(\d+)(?:\s*[,\s]?\s*(?:and|or)\s+(\d+))*/gi;
    let refMatch;
    while ((refMatch = claimRefRegex.exec(claimTextClean)) !== null) {
      depends_on.push(parseInt(refMatch[1], 10));
      if (refMatch[2]) {
        depends_on.push(parseInt(refMatch[2], 10));
      }
    }
  }

  const is_independent = depends_on.length === 0;

  // Classify claim type
  const claim_type = classifyClaimType(claimTextClean);

  // Extract claim elements
  const elements = extractClaimElements(claimTextClean, claim_type);

  // Extract key limitations
  const key_limitations = extractKeyLimitations(claimTextClean, claim_type);

  // Calculate confidence based on clarity
  const confidence = calculateClaimConfidence(claimTextClean, elements);

  return {
    claim_number: claimNumber,
    is_independent,
    depends_on: depends_on.length > 0 ? depends_on : undefined,
    claim_text: claimTextClean,
    claim_type,
    elements,
    key_limitations,
    confidence,
  };
}

/**
 * Classify claim type based on text
 */
function classifyClaimType(claimText: string): ClaimType {
  const textLower = claimText.toLowerCase();

  if (textLower.match(/a compound|a molecule|an antibody|a protein|a peptide|composition of matter/i)) {
    return 'composition_of_matter';
  }
  if (textLower.match(/method of treating|for use in treating|for treating|use in the treatment/i)) {
    return 'method_of_treatment';
  }
  if (textLower.match(/pharmaceutical composition|formulation|comprising.*pharmaceutically acceptable/i)) {
    return 'pharmaceutical_composition';
  }
  if (textLower.match(/method of making|process for producing|method of manufacturing/i)) {
    return 'manufacturing_process';
  }
  if (textLower.match(/method of identifying|method of detecting|diagnostic|biomarker/i)) {
    return 'diagnostic';
  }
  if (textLower.match(/kit comprising|kit for/i)) {
    return 'kit';
  }

  return 'other';
}

/**
 * Extract discrete elements from claim text
 */
function extractClaimElements(claimText: string, claimType: ClaimType): ClaimElement[] {
  const elements: ClaimElement[] = [];
  let elementNumber = 1;

  // Split by common separators (comma, semicolon, "and", "or")
  const parts = claimText.split(/[,;]|\s+and\s+|\s+or\s+/i).map(p => p.trim());

  for (const part of parts) {
    if (part.length < 10) continue; // Skip very short fragments

    let elementType: ClaimElement['type'] = 'other';
    let isLimiting = true;

    // Classify element type
    if (part.match(/treating|treatment|therapy/i)) {
      elementType = 'method_step';
      isLimiting = true;
    } else if (part.match(/subject|patient|individual/i)) {
      elementType = 'subject';
      isLimiting = false; // Standard language
    } else if (part.match(/administering|administration/i)) {
      elementType = 'administration';
      isLimiting = false;
    } else if (part.match(/therapeutically effective|effective amount|dose/i)) {
      elementType = 'dosage';
      isLimiting = false; // Functional language
    } else if (part.match(/compound|molecule|antibody|protein|peptide|formula/i)) {
      elementType = 'compound';
      isLimiting = true;
    } else if (part.match(/formulation|composition|pharmaceutical/i)) {
      elementType = 'formulation';
      isLimiting = true;
    } else if (part.match(/target|receptor|antigen/i)) {
      elementType = 'target';
      isLimiting = true;
    } else if (part.match(/cancer|disease|disorder|indication/i)) {
      elementType = 'indication';
      isLimiting = true;
    }

    // Calculate confidence (higher for clear, specific language)
    let confidence = 0.7;
    if (part.length > 20 && part.length < 200) confidence = 0.85;
    if (part.match(/comprising|consisting|selected from/i)) confidence = 0.9;

    elements.push({
      element_number: elementNumber++,
      type: elementType,
      content: part,
      is_limiting: isLimiting,
      confidence,
    });
  }

  return elements;
}

/**
 * Extract key limitations from claim
 */
function extractKeyLimitations(claimText: string, claimType: ClaimType): string[] {
  const limitations: string[] = [];

  // Extract structural limitations
  const structureMatch = claimText.match(/(?:formula|Formula)\s+([IVX]+|[A-Z])/i);
  if (structureMatch) {
    limitations.push(`Structural: Formula ${structureMatch[1]}`);
  }

  // Extract sequence limitations
  const sequenceMatch = claimText.match(/SEQ ID NO[:\s]+(\d+)/i);
  if (sequenceMatch) {
    limitations.push(`Sequence: SEQ ID NO: ${sequenceMatch[1]}`);
  }

  // Extract indication limitations
  const indicationMatch = claimText.match(/(?:treating|for|in)\s+([a-z\s]+(?:cancer|disease|disorder|syndrome))/i);
  if (indicationMatch) {
    limitations.push(`Indication: ${indicationMatch[1].trim()}`);
  }

  // Extract target limitations
  const targetMatch = claimText.match(/(?:targeting|binds to|binds)\s+([A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)/i);
  if (targetMatch) {
    limitations.push(`Target: ${targetMatch[1].trim()}`);
  }

  return limitations;
}

/**
 * Calculate confidence score for claim extraction
 */
function calculateClaimConfidence(claimText: string, elements: ClaimElement[]): number {
  let confidence = 0.7;

  // Boost confidence for clear structure
  if (claimText.length > 50 && claimText.length < 2000) confidence += 0.1;
  
  // Boost for having multiple elements
  if (elements.length >= 3) confidence += 0.1;

  // Reduce for ambiguous language
  if (claimText.match(/may|might|optionally|preferably/i)) confidence -= 0.05;

  return Math.min(0.95, Math.max(0.5, confidence));
}
