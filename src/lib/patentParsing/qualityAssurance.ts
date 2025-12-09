/**
 * Quality Assurance System
 * Multi-pass verification and confidence scoring
 */

import type { PatentExtractionResult, ValidationFlag, ConfidenceLevel } from './types';

export interface QualityAssessment {
  overall_confidence: number;
  confidence_level: ConfidenceLevel;
  validation_status: 'validated' | 'review_required' | 'errors_detected';
  flags: ValidationFlag[];
  recommendations: string[];
}

/**
 * Perform quality assurance assessment
 */
export function assessQuality(result: PatentExtractionResult): QualityAssessment {
  const flags: ValidationFlag[] = [...result.validation_flags];
  const recommendations: string[] = [];

  // Pass 1: Check document completeness
  const completenessCheck = checkCompleteness(result);
  flags.push(...completenessCheck.flags);
  recommendations.push(...completenessCheck.recommendations);

  // Pass 2: Check data consistency
  const consistencyCheck = checkConsistency(result);
  flags.push(...consistencyCheck.flags);
  recommendations.push(...consistencyCheck.recommendations);

  // Pass 3: Check biological plausibility
  const plausibilityCheck = checkBiologicalPlausibility(result);
  flags.push(...plausibilityCheck.flags);
  recommendations.push(...plausibilityCheck.recommendations);

  // Determine validation status
  const errorCount = flags.filter(f => f.level === 'error').length;
  const warningCount = flags.filter(f => f.level === 'warning').length;
  const requiresReview = flags.some(f => f.requires_manual_review);

  let validationStatus: QualityAssessment['validation_status'];
  if (errorCount > 0) {
    validationStatus = 'errors_detected';
  } else if (requiresReview || warningCount > 5) {
    validationStatus = 'review_required';
  } else {
    validationStatus = 'validated';
  }

  // Calculate confidence level
  const confidenceLevel = determineConfidenceLevel(result.overall_confidence);

  return {
    overall_confidence: result.overall_confidence,
    confidence_level: confidenceLevel,
    validation_status: validationStatus,
    flags,
    recommendations,
  };
}

/**
 * Check document completeness
 */
function checkCompleteness(result: PatentExtractionResult): {
  flags: ValidationFlag[];
  recommendations: string[];
} {
  const flags: ValidationFlag[] = [];
  const recommendations: string[] = [];

  // Check if claims were extracted
  if (result.claims_analysis.total_claims === 0) {
    flags.push({
      level: 'error',
      message: 'No claims extracted from document',
      section: 'claims_analysis',
      requires_manual_review: true,
    });
    recommendations.push('Verify document contains claims section');
  }

  // Check if molecular data was extracted
  const hasStructures = result.molecular_data.sequences.small_molecules.length > 0 ||
                        (result.molecular_data.markush_structures?.length ?? 0) > 0;
  const hasSequences = result.molecular_data.sequences.antibodies.length > 0 ||
                      result.molecular_data.sequences.nucleic_acids.length > 0;

  if (!hasStructures && !hasSequences) {
    flags.push({
      level: 'warning',
      message: 'No molecular structures or sequences extracted',
      section: 'molecular_data',
      requires_manual_review: false,
    });
    recommendations.push('Document may not contain structure/sequence data, or extraction may have failed');
  }

  // Check if biological data was extracted
  const hasBiologicalData = result.biological_data.in_vitro.length > 0 ||
                           result.biological_data.in_vivo.length > 0 ||
                           result.biological_data.clinical.length > 0;

  if (!hasBiologicalData) {
    flags.push({
      level: 'info',
      message: 'No biological data extracted',
      section: 'biological_data',
      requires_manual_review: false,
    });
  }

  return { flags, recommendations };
}

/**
 * Check data consistency
 */
function checkConsistency(result: PatentExtractionResult): {
  flags: ValidationFlag[];
  recommendations: string[];
} {
  const flags: ValidationFlag[] = [];
  const recommendations: string[] = [];

  // Check claim number consistency
  const claimNumbers = result.claims_analysis.claims.map(c => c.claim_number).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: result.claims_analysis.total_claims }, (_, i) => i + 1);
  const missingNumbers = expectedNumbers.filter(n => !claimNumbers.includes(n));

  if (missingNumbers.length > 0) {
    flags.push({
      level: 'warning',
      message: `Missing claim numbers: ${missingNumbers.join(', ')}`,
      section: 'claims_analysis',
      requires_manual_review: false,
    });
  }

  // Check SEQ ID NO consistency
  const seqIds = result.molecular_data.sequences.nucleic_acids.map(s => s.seq_id_no);
  const duplicateSeqIds = seqIds.filter((id, index) => seqIds.indexOf(id) !== index);
  if (duplicateSeqIds.length > 0) {
    flags.push({
      level: 'error',
      message: `Duplicate SEQ ID NOs: ${duplicateSeqIds.join(', ')}`,
      section: 'molecular_data',
      requires_manual_review: true,
    });
  }

  // Check compound ID consistency
  const compoundIds = result.molecular_data.sequences.small_molecules.map(c => c.compound_id);
  const duplicateCompoundIds = compoundIds.filter((id, index) => compoundIds.indexOf(id) !== index);
  if (duplicateCompoundIds.length > 0) {
    flags.push({
      level: 'warning',
      message: `Duplicate compound IDs: ${duplicateCompoundIds.join(', ')}`,
      section: 'molecular_data',
      requires_manual_review: false,
    });
  }

  return { flags, recommendations };
}

/**
 * Check biological plausibility
 */
function checkBiologicalPlausibility(result: PatentExtractionResult): {
  flags: ValidationFlag[];
  recommendations: string[];
} {
  const flags: ValidationFlag[] = [];
  const recommendations: string[] = [];

  // Check molecular weight ranges
  for (const compound of result.molecular_data.sequences.small_molecules) {
    if (compound.molecular_weight) {
      if (compound.molecular_weight < 50) {
        flags.push({
          level: 'warning',
          message: `Compound ${compound.compound_id} has unusually low molecular weight: ${compound.molecular_weight}`,
          section: 'molecular_data',
          requires_manual_review: false,
        });
      }
      if (compound.molecular_weight > 5000) {
        flags.push({
          level: 'warning',
          message: `Compound ${compound.compound_id} has unusually high molecular weight: ${compound.molecular_weight}`,
          section: 'molecular_data',
          requires_manual_review: false,
        });
      }
    }
  }

  // Check IC50/EC50 value ranges
  for (const dataPoint of result.biological_data.in_vitro) {
    if (dataPoint.value !== undefined && dataPoint.units) {
      let valueInNM = dataPoint.value;
      if (dataPoint.units === 'μM') valueInNM = dataPoint.value * 1000;
      if (dataPoint.units === 'mM') valueInNM = dataPoint.value * 1000000;

      if (valueInNM < 0.001) {
        flags.push({
          level: 'info',
          message: `Extremely potent activity: ${dataPoint.value} ${dataPoint.units} - verify accuracy`,
          section: 'biological_data',
          requires_manual_review: false,
        });
      }
      if (valueInNM > 1000000) {
        flags.push({
          level: 'warning',
          message: `Very weak activity: ${dataPoint.value} ${dataPoint.units} - verify accuracy`,
          section: 'biological_data',
          requires_manual_review: false,
        });
      }
    }
  }

  return { flags, recommendations };
}

/**
 * Determine confidence level from score
 */
function determineConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  if (score >= 0.5) return 'low';
  return 'requires_review';
}
