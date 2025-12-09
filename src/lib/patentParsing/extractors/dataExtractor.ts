/**
 * Biological Data Extractor
 * Extracts in vitro, in vivo, and clinical data from patent text and tables
 */

import type { BiologicalDataPoint } from '../types';

export interface BiologicalDataExtractionResult {
  in_vitro: BiologicalDataPoint[];
  in_vivo: BiologicalDataPoint[];
  clinical: BiologicalDataPoint[];
  extraction_confidence: number;
}

/**
 * Extract all biological data from patent text
 */
export function extractBiologicalData(text: string): BiologicalDataExtractionResult {
  const in_vitro = extractInVitroData(text);
  const in_vivo = extractInVivoData(text);
  const clinical = extractClinicalData(text);

  const confidence = calculateDataExtractionConfidence(in_vitro, in_vivo, clinical);

  return {
    in_vitro,
    in_vivo,
    clinical,
    extraction_confidence: confidence,
  };
}

/**
 * Extract in vitro data
 */
function extractInVitroData(text: string): BiologicalDataPoint[] {
  const dataPoints: BiologicalDataPoint[] = [];

  // Match IC50, EC50, Ki, Kd values
  const assayRegex = /(?:IC50|EC50|Ki|Kd|IC90|EC90)[:\s]+([\d.]+)\s*(nM|μM|mM|M)/gi;
  let match;

  while ((match = assayRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const units = match[2];

    // Try to extract compound ID from context
    const context = text.substring(Math.max(0, match.index - 200), match.index + 200);
    const compoundMatch = context.match(/(?:Compound|Example|Ab)[\s-]?(\d+[A-Z]?)/i);
    const compoundId = compoundMatch ? compoundMatch[1] : 'unknown';

    // Try to extract target
    const targetMatch = context.match(/(?:target|against|binding to)\s+([A-Z][a-z0-9]+)/i);
    const target = targetMatch ? targetMatch[1] : undefined;

    // Try to extract assay type
    const assayMatch = context.match(/(?:ELISA|binding|proliferation|cytotoxicity|inhibition)/i);
    const assayType = assayMatch ? assayMatch[0] : 'binding';

    dataPoints.push({
      compound_id: compoundId,
      assay_type: assayType,
      target,
      value,
      units,
      confidence: 0.85,
    });
  }

  return dataPoints;
}

/**
 * Extract in vivo data
 */
function extractInVivoData(text: string): BiologicalDataPoint[] {
  const dataPoints: BiologicalDataPoint[] = [];

  // Match tumor growth inhibition, survival data
  const tgiRegex = /(?:TGI|tumor\s+growth\s+inhibition)[:\s]+([\d.]+)\s*%/gi;
  let match;

  while ((match = tgiRegex.exec(text)) !== null) {
    const result = `${match[1]}% TGI`;

    // Extract context
    const context = text.substring(Math.max(0, match.index - 300), match.index + 300);
    
    const compoundMatch = context.match(/(?:Compound|Example|Ab)[\s-]?(\d+[A-Z]?)/i);
    const compoundId = compoundMatch ? compoundMatch[1] : 'unknown';

    const modelMatch = context.match(/(?:xenograft|mouse|rat|model)/i);
    const model = modelMatch ? modelMatch[0] : 'xenograft';

    const doseMatch = context.match(/([\d.]+)\s*(mg\/kg|mg\/mL)/i);
    const dose = doseMatch ? `${doseMatch[1]} ${doseMatch[2]}` : undefined;

    const speciesMatch = context.match(/(?:mouse|rat|nude\s+mouse|SCID)/i);
    const species = speciesMatch ? speciesMatch[0] : 'mouse';

    dataPoints.push({
      compound_id: compoundId,
      assay_type: 'in_vivo',
      model,
      species,
      dose,
      endpoint: 'TGI',
      result,
      confidence: 0.8,
    });
  }

  // Match survival data
  const survivalRegex = /(?:survival|median\s+survival)[:\s]+([\d.]+)\s*(?:days|weeks|months)/gi;
  let survMatch;

  while ((survMatch = survivalRegex.exec(text)) !== null) {
    const result = `${survMatch[1]} ${survMatch[2]}`;

    const context = text.substring(Math.max(0, survMatch.index - 300), survMatch.index + 300);
    const compoundMatch = context.match(/(?:Compound|Example|Ab)[\s-]?(\d+[A-Z]?)/i);
    const compoundId = compoundMatch ? compoundMatch[1] : 'unknown';

    dataPoints.push({
      compound_id: compoundId,
      endpoint: 'survival',
      result,
      confidence: 0.75,
    });
  }

  return dataPoints;
}

/**
 * Extract clinical data
 */
function extractClinicalData(text: string): BiologicalDataPoint[] {
  const dataPoints: BiologicalDataPoint[] = [];

  // Match phase information
  const phaseRegex = /(?:Phase\s+([I123]|II|III)|phase\s+([I123]|II|III))/gi;
  let match;

  while ((match = phaseRegex.exec(text)) !== null) {
    const phase = match[1] || match[2];

    // Extract context
    const context = text.substring(Math.max(0, match.index - 500), match.index + 500);

    // Try to extract indication
    const indicationMatch = context.match(/(?:treating|for|in)\s+([a-z\s]+(?:cancer|disease|disorder))/i);
    const indication = indicationMatch ? indicationMatch[1].trim() : undefined;

    // Try to extract patient number
    const nMatch = context.match(/(?:n\s*=|patients?)[:\s]+(\d+)/i);
    const n = nMatch ? parseInt(nMatch[1], 10) : undefined;

    // Try to extract response rate
    const responseMatch = context.match(/(?:ORR|overall\s+response|response\s+rate)[:\s]+([\d.]+)\s*%/i);
    const result = responseMatch ? `${responseMatch[1]}% ORR` : undefined;

    dataPoints.push({
      compound_id: 'clinical',
      assay_type: 'clinical',
      phase,
      indication,
      n,
      endpoint: 'efficacy',
      result,
      confidence: 0.7,
    });
  }

  return dataPoints;
}

/**
 * Calculate data extraction confidence
 */
function calculateDataExtractionConfidence(
  inVitro: BiologicalDataPoint[],
  inVivo: BiologicalDataPoint[],
  clinical: BiologicalDataPoint[]
): number {
  const total = inVitro.length + inVivo.length + clinical.length;
  if (total === 0) return 0.3;

  const avgConf =
    [...inVitro, ...inVivo, ...clinical].reduce((sum, dp) => sum + dp.confidence, 0) / total;

  return avgConf;
}
