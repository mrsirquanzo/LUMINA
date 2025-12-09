/**
 * FTO (Freedom to Operate) Risk Calculator
 * Analyzes patent data to assess FTO risk
 */

import type { PatentExtractionResult } from '../../src/lib/patentParsing/types';

export interface FTORiskResult {
  riskLevel: 'low' | 'moderate' | 'high';
  riskScore: number; // 0-1
  concerns: FTOConcern[];
  recommendations: string[];
  competitorPatents?: string[];
}

export interface FTOConcern {
  type: 'sequence_similarity' | 'claim_overlap' | 'epitope_binding' | 'mechanism_overlap' | 'composition_overlap';
  severity: 'low' | 'moderate' | 'high';
  message: string;
  patents?: string[];
  details?: {
    similarity?: number;
    overlappingClaims?: string[];
    sequenceMatches?: Array<{
      sequence: string;
      matchType: 'exact' | 'high_similarity';
      competitorPatent: string;
    }>;
  };
}

/**
 * Calculate FTO risk for a patent
 */
export function calculateFTORisk(
  patentData: PatentExtractionResult,
  competitorPatents?: Array<{ number: string; claims: string[]; sequences?: any }>
): FTORiskResult {
  const concerns: FTOConcern[] = [];
  let riskScore = 0;

  // Check sequence similarities
  if (patentData.molecular_data.sequences.antibodies.length > 0) {
    const antibodies = patentData.molecular_data.sequences.antibodies;
    
    for (const antibody of antibodies) {
      // Check HCDR3 sequences (most critical for FTO)
      if (antibody.hcdr3) {
        const hcdr3 = antibody.hcdr3.sequence;
        
        // Known problematic sequences (in real implementation, would check against database)
        const knownSequences: Record<string, { patent: string; drug: string }> = {
          'ARDLGRGAFDI': {
            patent: 'US8168757',
            drug: 'pembrolizumab (Keytruda)',
          },
          // Add more known sequences
        };

        if (knownSequences[hcdr3]) {
          const known = knownSequences[hcdr3];
          concerns.push({
            type: 'sequence_similarity',
            severity: 'high',
            message: `HCDR3 sequence "${hcdr3}" is 100% identical to ${known.drug} (${known.patent})`,
            patents: [known.patent],
            details: {
              similarity: 1.0,
              sequenceMatches: [{
                sequence: hcdr3,
                matchType: 'exact',
                competitorPatent: known.patent,
              }],
            },
          });
          riskScore += 0.4; // High weight for exact sequence matches
        }
      }
    }
  }

  // Check claim breadth (narrower claims = lower FTO risk)
  const independentClaims = patentData.claims_analysis.independent_claims;
  const totalClaims = patentData.molecular_data.sequences.antibodies.length +
                     patentData.molecular_data.sequences.nucleic_acids.length;
  
  if (independentClaims < 3) {
    concerns.push({
      type: 'claim_overlap',
      severity: 'moderate',
      message: `Only ${independentClaims} independent claims - narrow protection scope increases FTO risk`,
    });
    riskScore += 0.15;
  }

  // Check validation flags (data quality issues can indicate FTO problems)
  const criticalFlags = patentData.validation_flags.filter(
    (f) => f.level === 'error' && f.requires_manual_review
  );
  
  if (criticalFlags.length > 0) {
    concerns.push({
      type: 'claim_overlap',
      severity: 'moderate',
      message: `${criticalFlags.length} critical validation flag(s) require manual review - may indicate FTO issues`,
    });
    riskScore += 0.1;
  }

  // Normalize risk score to 0-1
  riskScore = Math.min(1, riskScore);

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high';
  if (riskScore < 0.3) {
    riskLevel = 'low';
  } else if (riskScore < 0.7) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'high';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (concerns.some((c) => c.type === 'sequence_similarity' && c.severity === 'high')) {
    recommendations.push('Recommend epitope mapping study to assess binding site overlap');
    recommendations.push('Design-around with alternative HCDR3 possible but may affect binding affinity');
    recommendations.push('Consider licensing discussions with patent holder');
  }
  
  if (independentClaims < 3) {
    recommendations.push('Consider filing continuation applications to broaden claim scope');
  }
  
  if (riskLevel === 'high') {
    recommendations.push('Engage IP counsel for detailed FTO analysis');
    recommendations.push('Consider alternative target or mechanism if FTO risk is prohibitive');
  }

  return {
    riskLevel,
    riskScore,
    concerns,
    recommendations,
    competitorPatents: concerns
      .flatMap((c) => c.patents || [])
      .filter((p, i, arr) => arr.indexOf(p) === i), // Unique patents
  };
}
