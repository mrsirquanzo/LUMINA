import type {
  ValidationScore,
  DruggabilityScore,
  TherapeuticWindow,
  Recommendation,
  ExpressionTissue,
} from '../types';

export interface ScoringWeights {
  genetic: number;
  expression: number;
  druggability: number;
  safety: number;
}

export interface OverallScoreResult {
  score: number;
  breakdown: {
    genetic: number;
    expression: number;
    druggability: number;
    safety: number;
  };
  recommendation: Recommendation;
  criticalRisks: string[];
}

/**
 * Calculate overall score from weighted component scores
 */
export function calculateOverallScore(
  genetic: number,
  expression: number,
  druggability: number,
  safety: number,
  weights: ScoringWeights = {
    genetic: 0.3,
    expression: 0.25,
    druggability: 0.25,
    safety: 0.2,
  }
): OverallScoreResult {
  // Normalize weights
  const totalWeight = weights.genetic + weights.expression + weights.druggability + weights.safety;
  const normalizedWeights = {
    genetic: weights.genetic / totalWeight,
    expression: weights.expression / totalWeight,
    druggability: weights.druggability / totalWeight,
    safety: weights.safety / totalWeight,
  };

  // Calculate weighted score (0-100)
  const overallScore =
    genetic * normalizedWeights.genetic +
    expression * normalizedWeights.expression +
    druggability * normalizedWeights.druggability +
    safety * normalizedWeights.safety;

  // Identify critical risks
  const criticalRisks: string[] = [];
  if (safety < 40) criticalRisks.push('High safety risk');
  if (druggability < 30) criticalRisks.push('Druggability challenges');
  if (genetic < 20) criticalRisks.push('Weak genetic validation');
  if (expression < 30) criticalRisks.push('Limited expression data');

  const recommendation = getRecommendation(overallScore, criticalRisks);

  return {
    score: Math.round(overallScore),
    breakdown: {
      genetic: Math.round(genetic),
      expression: Math.round(expression),
      druggability: Math.round(druggability),
      safety: Math.round(safety),
    },
    recommendation,
    criticalRisks,
  };
}

/**
 * Calculate validation score based on genetic evidence
 */
export function calculateValidationScore(
  gwasCount: number,
  mendelianEvidence: boolean,
  constraintScore: number
): { score: number; level: ValidationScore } {
  let score = 0;

  // GWAS associations (max 40 points)
  if (gwasCount >= 5) score += 40;
  else if (gwasCount >= 3) score += 30;
  else if (gwasCount >= 1) score += 20;
  else score += 0;

  // Mendelian evidence (max 30 points)
  if (mendelianEvidence) score += 30;

  // Constraint score (max 30 points)
  // Higher pLI/LOEUF = higher constraint = higher score
  if (constraintScore >= 0.9) score += 30;
  else if (constraintScore >= 0.7) score += 20;
  else if (constraintScore >= 0.5) score += 10;
  else score += 0;

  let level: ValidationScore;
  if (score >= 80) level = 'Strong';
  else if (score >= 60) level = 'Moderate';
  else if (score >= 40) level = 'Limited';
  else level = 'Insufficient';

  return { score, level };
}

/**
 * Calculate therapeutic window based on expression profiles
 */
export function calculateTherapeuticWindow(
  tumorExpression: number,
  normalExpression: number,
  safetyOrgans: ExpressionTissue[]
): { score: number; window: TherapeuticWindow; ratio: number } {
  const ratio = tumorExpression > 0 && normalExpression > 0 
    ? tumorExpression / normalExpression 
    : tumorExpression > 0 
      ? 100 // High ratio if no normal expression
      : 0;

  let score = 0;
  let window: TherapeuticWindow;

  // Calculate score based on ratio and safety organ expression
  if (ratio >= 10 && safetyOrgans.every((org) => org.tpm < 1)) {
    score = 90;
    window = 'Favorable';
  } else if (ratio >= 5 && safetyOrgans.every((org) => org.tpm < 5)) {
    score = 70;
    window = 'Moderate';
  } else if (ratio >= 2 && safetyOrgans.some((org) => org.tpm < 10)) {
    score = 50;
    window = 'Narrow';
  } else {
    score = 30;
    window = 'Unfavorable';
  }

  // Penalize high safety organ expression
  const maxSafetyOrganExpression = Math.max(...safetyOrgans.map((org) => org.tpm), 0);
  if (maxSafetyOrganExpression > 20) score -= 20;
  else if (maxSafetyOrganExpression > 10) score -= 10;

  score = Math.max(0, Math.min(100, score));

  return { score, window, ratio };
}

/**
 * Calculate druggability score
 */
export function calculateDruggabilityScore(
  targetClass: string,
  structures: number,
  compounds: number,
  tractability: 'High' | 'Medium' | 'Low'
): { score: number; level: DruggabilityScore } {
  let score = 0;

  // Target class bonus (max 30 points)
  const classScores: Record<string, number> = {
    kinase: 30,
    GPCR: 25,
    ionChannel: 25,
    enzyme: 20,
    receptor: 15,
    transcriptionFactor: 10,
    other: 5,
  };
  score += classScores[targetClass.toLowerCase()] || 5;

  // Structures available (max 25 points)
  if (structures >= 10) score += 25;
  else if (structures >= 5) score += 20;
  else if (structures >= 1) score += 15;
  else score += 5;

  // Known compounds (max 25 points)
  if (compounds >= 100) score += 25;
  else if (compounds >= 50) score += 20;
  else if (compounds >= 20) score += 15;
  else if (compounds >= 5) score += 10;
  else score += 5;

  // Tractability assessment (max 20 points)
  if (tractability === 'High') score += 20;
  else if (tractability === 'Medium') score += 15;
  else score += 10;

  let level: DruggabilityScore;
  if (score >= 80) level = 'High';
  else if (score >= 60) level = 'Medium';
  else if (score >= 40) level = 'Low';
  else level = 'Challenging';

  return { score, level };
}

/**
 * Get recommendation based on overall score and risks
 */
export function getRecommendation(
  overallScore: number,
  criticalRisks: string[]
): Recommendation {
  if (criticalRisks.length >= 2) return 'No-Go';
  if (criticalRisks.length === 1 && overallScore < 60) return 'No-Go';

  if (overallScore >= 75 && criticalRisks.length === 0) return 'Advance';
  if (overallScore >= 60) return 'Conditional';
  if (overallScore >= 40) return 'Deprioritize';
  return 'No-Go';
}
