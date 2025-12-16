/**
 * Tile Data Extractors
 * 
 * Extracts structured data from agent responses to populate tiles
 */

import type { TileData, TileSource } from './types';
import type { AgentType } from '../multiAgentTypes';

interface CitationStats {
  citationNumbers: string[];
  hasReferencesSection: boolean;
}

function normalizeAgentResponse(raw: string): string {
  // Support exported chat markdown format (ExportButton → markdown) which wraps messages.
  // We extract the last assistant block if present.
  const assistantIdx = raw.lastIndexOf('\n## Assistant');
  if (assistantIdx >= 0) {
    const after = raw.slice(assistantIdx);
    // Drop the "## Assistant" header line
    const lines = after.split(/\r?\n/).slice(1);
    // Drop timestamp line like "*Dec 11, 2025, 09:33 PM*"
    if (lines[0]?.trim().startsWith('*') && lines[0]?.trim().endsWith('*')) lines.shift();
    // Drop empty lines
    while (lines.length > 0 && lines[0].trim() === '') lines.shift();
    return lines.join('\n').trim();
  }
  return raw.trim();
}

function extractReferencesSection(text: string): string | null {
  const match = text.match(/## (?:📚 Sources Referenced|References)\n+([\s\S]*?)(?=\n##|$)/);
  return match ? match[1].trim() : null;
}

function getCitationStats(text: string): CitationStats {
  const citationNumbers = Array.from(new Set((text.match(/\[(\d+)\]/g) || []).map((m) => m.replace(/[^\d]/g, ''))))
    .filter(Boolean);
  return {
    citationNumbers,
    hasReferencesSection: extractReferencesSection(text) !== null,
  };
}

/**
 * Strips markdown formatting from text (bold, italic, etc.)
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold **text**
    .replace(/\*([^*]+)\*/g, '$1')     // Italic *text*
    .replace(/__([^_]+)__/g, '$1')     // Bold __text__
    .replace(/_([^_]+)_/g, '$1')       // Italic _text_
    .replace(/`([^`]+)`/g, '$1')       // Code `text`
    .trim();
}

function getCitedBulletLines(text: string, limit = 6): string[] {
  const lines = text.split(/\r?\n/);
  const bullets = lines
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l) && /\[\d+\]/.test(l))
    .map((l) => stripMarkdown(l.replace(/^[-*•]\s+/, '').trim()));
  return bullets.slice(0, limit);
}

function extractCitationNumbers(text: string): string[] {
  return Array.from(new Set((text.match(/\[(\d+)\]/g) || []).map((m) => m.replace(/[^\d]/g, '')))).filter(Boolean);
}

function extractMarkdownTableAfterLabel(
  text: string,
  labelRegex: RegExp
): { headers: string[]; rows: string[][] } | null {
  const labelMatch = text.match(labelRegex);
  if (!labelMatch) return null;
  const after = text.slice(labelMatch.index! + labelMatch[0].length);
  const lines = after.split(/\r?\n/);

  // Find first table line
  const firstTableIdx = lines.findIndex((l) => l.trim().startsWith('|'));
  if (firstTableIdx < 0) return null;

  const tableLines: string[] = [];
  for (let i = firstTableIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) break;
    tableLines.push(line);
  }

  if (tableLines.length < 2) return null;

  const toCells = (line: string) => line.split('|').map((c) => c.trim()).filter(Boolean);
  const headers = toCells(tableLines[0]);
  const rows = tableLines
    .slice(2) // skip header + separator
    .filter((l) => !l.includes('---'))
    .map(toCells)
    .filter((r) => r.length >= 2);

  return { headers, rows };
}

/**
 * Extract key metrics and summary from agent response text
 */
function extractSummary(response: string): any {
  // Extract key metrics, numbers, percentages, etc.
  const metrics: Record<string, any> = {};
  
  // Extract percentages
  const percentMatches = response.match(/(\d+(?:\.\d+)?%)/g);
  if (percentMatches) {
    metrics.percentages = percentMatches.slice(0, 5); // Top 5 percentages
  }
  
  // Extract key phrases (e.g., "ORR: 79.7%", "PFS: 28.8 months")
  const keyPhrases: string[] = [];
  const orrMatch = response.match(/ORR[:\s]+(\d+(?:\.\d+)?%)/i);
  if (orrMatch) keyPhrases.push(`ORR: ${orrMatch[1]}`);
  
  const pfsMatch = response.match(/PFS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  if (pfsMatch) keyPhrases.push(`PFS: ${pfsMatch[1]}`);
  
  const osMatch = response.match(/OS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  if (osMatch) keyPhrases.push(`OS: ${osMatch[1]}`);
  
  return {
    keyMetrics: metrics,
    keyPhrases,
    preview: response.substring(0, 300) + '...',
  };
}

/**
 * Extract structured sections from markdown response
 */
function extractMarkdownSections(response: string): Record<string, string> {
  const sections: Record<string, string> = {};
  
  // Extract sections like "## 2. Human Genetic Validation"
  const sectionRegex = /##\s+(\d+\.?\s+)?([^\n]+)\n+([\s\S]*?)(?=\n##|$)/g;
  let match;
  
  while ((match = sectionRegex.exec(response)) !== null) {
    const title = match[2].trim();
    const content = match[3].trim();
    sections[title] = content;
  }
  
  return sections;
}

/**
 * Extract Target Biology tile data
 */
export function extractTargetBiologyData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract genetic validation score - try multiple patterns (improved for KRAS format)
  const geneticScoreMatch = normalized.match(/Genetic Validation Score[:\s]+\*\*(Gold Standard|Strong|Moderate|Weak|None|GOLD STANDARD|STRONG|MODERATE)\*\*/i) ||
                            normalized.match(/Genetic Validation Score[:\s]+(Gold Standard|Strong|Moderate|Weak|None|GOLD STANDARD|STRONG|MODERATE)/i) ||
                            normalized.match(/Score[:\s]+\*\*(GOLD STANDARD|STRONG|MODERATE|WEAK)\*\*/i) ||
                            normalized.match(/### 2\.3 Genetic Validation Score[:\s]+\*\*(GOLD STANDARD|STRONG|MODERATE|WEAK)\*\*/i);
  const geneticScore = geneticScoreMatch ? geneticScoreMatch[1].toUpperCase() : 
                       (normalized.includes('GOLD STANDARD') ? 'GOLD STANDARD' :
                        normalized.includes('Gold Standard') ? 'GOLD STANDARD' :
                        normalized.includes('STRONG') ? 'STRONG' :
                        normalized.includes('Strong') && normalized.includes('validation') ? 'STRONG' :
                        normalized.includes('MODERATE') ? 'MODERATE' :
                        normalized.includes('Moderate') && normalized.includes('validation') ? 'MODERATE' : 'Not assessed');
  
  // Extract druggability assessment
  const druggabilityMatch = normalized.match(/Druggability[:\s]+(High|Moderate|Low|HIGH|MODERATE)/i) ||
                            normalized.match(/Tractability[:\s]+(High|Moderate|Low|HIGH|MODERATE)/i) ||
                            normalized.match(/Structural Tractability[:\s]+(High|Moderate|Low|HIGH|MODERATE)/i);
  const druggability = druggabilityMatch ? druggabilityMatch[1].toUpperCase() : 
                       (normalized.includes('High') && normalized.includes('tractable') ? 'HIGH' :
                        normalized.includes('Moderate') && normalized.includes('tractable') ? 'MODERATE' : 'Not assessed');
  
  // Extract safety assessment
  const safetyMatch = normalized.match(/Safety[:\s]+(Tolerated|Moderate Risk|High Risk|MODERATE|LOW|HIGH)/i) ||
                      normalized.match(/On-Target Toxicity Risk[:\s]+(MODERATE|LOW|HIGH)/i);
  const safety = safetyMatch ? safetyMatch[1].toUpperCase() : 
                 (normalized.includes('Tolerated') || normalized.includes('manageable') ? 'TOLERATED' :
                  normalized.includes('Moderate') && normalized.includes('risk') ? 'MODERATE RISK' :
                  normalized.includes('High') && normalized.includes('risk') ? 'HIGH RISK' : 'Not assessed');
  
  // Extract target name - try multiple patterns
  const targetMatch = normalized.match(/Target[:\s]+([A-Z0-9\s]+)/i) || 
                     normalized.match(/Gene[:\s]+([A-Z0-9\s]+)/i) ||
                     normalized.match(/\*\*([A-Z0-9\s]+)\*\*.*target/i) ||
                     normalized.match(/##\s+1\.\s+Target Overview[\s\S]*?Gene[:\s]+([A-Z0-9\s]+)/i);
  const targetName = targetMatch ? targetMatch[1].trim().split(/\s+/).slice(0, 3).join(' ') : 
                     (normalized.match(/KRAS\s+G12C/i) ? 'KRAS G12C' : (normalized.match(/\bTROP2\b/i) ? 'TROP2' : 'Unknown'));
  
  // Extract prevalence/expression data
  const prevalenceMatch = normalized.match(/(\d+(?:\.\d+)?%)[^\n]*(?:NSCLC|prevalence|frequency)/i);
  const prevalence = prevalenceMatch ? prevalenceMatch[1] : null;
  
  // Extract recommendation
  const recommendationMatch = normalized.match(/Recommendation[:\s]+(ADVANCE|VALIDATED|Do Not Advance|CONDITIONAL)/i) ||
                              normalized.match(/Bottom Line[^\n]*(ADVANCE|VALIDATED|Proceed)/i);
  const recommendation = recommendationMatch ? recommendationMatch[1] : null;

  // Competitive programs table (common in TROP2 target biology writeups)
  const competitorRows = normalized
    .split(/\r?\n/)
    .filter((l) => /^\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|/.test(l))
    .filter((l) => !l.toLowerCase().includes('asset') && !l.includes('---'));
  const competitors = competitorRows
    .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
    .map(([asset, company, stage, payload, differentiation]) => ({ asset, company, stage, payload, differentiation }))
    .filter((r) => r.asset && r.company)
    .slice(0, 6);
  
  return {
    data: {
      summary: {
        target: targetName,
        geneticScore,
        druggability,
        safety,
        prevalence,
        recommendation,
        sections: Object.keys(sections).slice(0, 5), // Top 5 section titles
        competitors,
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        target: targetName,
        geneticScore,
        druggability,
        safety,
        prevalence,
        recommendation,
        sections,
        competitors,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Clinical tile data
 */
export function extractClinicalData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract ORR - try multiple patterns (improved for KRAS format with ranges)
  const orrMatch = normalized.match(/ORR[:\s]+(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%)/i) ||
                   normalized.match(/(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%)[^\n]*(?:ORR|Overall Response Rate)/i) ||
                   normalized.match(/Overall Response Rate[:\s]+(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%)/i) ||
                   normalized.match(/Single-agent ORR[:\s]+(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?%)/i);
  const orr = orrMatch ? orrMatch[1] : null;
  
  // Extract PFS - try multiple patterns
  const pfsMatch = normalized.match(/PFS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i) ||
                  normalized.match(/median PFS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i) ||
                  normalized.match(/Progression-Free Survival[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  const pfs = pfsMatch ? pfsMatch[1] : null;
  
  // Extract OS - try multiple patterns
  const osMatch = normalized.match(/OS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i) ||
                 normalized.match(/median OS[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i) ||
                 normalized.match(/Overall Survival[:\s]+(\d+(?:\.\d+)?\s*(?:months?|mo))/i);
  const os = osMatch ? osMatch[1] : null;
  
  // Extract indication - try multiple patterns
  const indicationMatch = normalized.match(/(?:Indication|Disease|Primary Indication)[:\s]+([^\n]+)/i) ||
                          normalized.match(/(?:for|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:cancer|disease|syndrome|NSCLC|CRC|TNBC))/i) ||
                          normalized.match(/(Non-Small Cell Lung Cancer|Colorectal Cancer|Triple-Negative Breast Cancer|Urothelial Carcinoma)/i);
  const indication = indicationMatch ? indicationMatch[1].trim().substring(0, 50) : 
                     (normalized.match(/NSCLC/i) ? 'Non-Small Cell Lung Cancer' :
                      normalized.match(/urothelial/i) ? 'Urothelial Carcinoma' :
                      normalized.match(/CRC|colorectal/i) ? 'Colorectal Cancer' :
                      normalized.match(/TNBC|triple-negative/i) ? 'Triple-Negative Breast Cancer' : 'Not specified');
  
  // Extract trial phase - try multiple patterns
  const phaseMatch = normalized.match(/Phase\s+([12](?:\/[23])?|3)/i) ||
                    normalized.match(/(Phase\s+[12](?:\/[23])?|Phase\s+3)/i);
  const phase = phaseMatch ? phaseMatch[1] : 
               (normalized.match(/approved|FDA-approved/i) ? 'Approved' :
                normalized.match(/Phase\s+[12]/i) ? 'Phase 1/2' : null);
  
  // Extract approved drugs
  const approvedDrugs: string[] = [];
  const drugMatches = normalized.match(/(?:approved|FDA-approved)[^\n]*(?:drugs?|inhibitors?)[:\s]+([^\n]+)/i) ||
                      normalized.match(/(Lumakras|Krazati|Enhertu|Trodelvy|Padcev|Sotorasib|Adagrasib)/gi);
  if (drugMatches) {
    const drugs = Array.isArray(drugMatches) ? drugMatches : [drugMatches[1]];
    approvedDrugs.push(...drugs.filter(Boolean).slice(0, 3));
  }
  
  // Extract DCR (Disease Control Rate)
  const dcrMatch = normalized.match(/DCR[:\s]+(\d+(?:\.\d+)?%)/i);
  const dcr = dcrMatch ? dcrMatch[1] : null;

  // Extract conviction (common in TROP2 clinical writeups)
  const convictionMatch = normalized.match(/Overall Conviction:\s*([A-Z-]+)/i);
  const conviction = convictionMatch ? convictionMatch[1].toUpperCase() : null;

  // Try to extract ASCENT table metrics for Trodelvy specifically
  const ascentOrrMatch = normalized.match(/\|\s*\*\*ORR\*\*\s*\|\s*([^|]+)\|\s*([^|]+)\|/i);
  const ascentPfsMatch = normalized.match(/\|\s*\*\*mPFS[^|]*\*\*\s*\|\s*([^|]+)\|\s*([^|]+)\|/i);
  const ascentOsMatch = normalized.match(/\|\s*\*\*mOS\*\*\s*\|\s*([^|]+)\|\s*([^|]+)\|/i);
  const ascent = {
    orr: ascentOrrMatch ? ascentOrrMatch[1].trim() : null,
    mpfs: ascentPfsMatch ? ascentPfsMatch[1].trim() : null,
    mos: ascentOsMatch ? ascentOsMatch[1].trim() : null,
  };

  // --- Expression section (GTEx + TCGA fold-change) ---
  const gtexTable = extractMarkdownTableAfterLabel(
    normalized,
    /\*\*Tissue Expression Profile\s*\(GTEx Analysis\)\s*:\*\*/i
  );
  const gtexNormalTissues = (gtexTable?.rows || [])
    .map((r) => {
      const [tissue, tpmRaw, implications] = r;
      const tpm = Number.parseFloat(String(tpmRaw).replace(/[^\d.]/g, ''));
      if (!tissue || !Number.isFinite(tpm)) return null;
      return {
        tissue: tissue.trim(),
        medianTpm: tpm,
        implications: (implications || '').trim(),
        citations: extractCitationNumbers(implications || ''),
      };
    })
    .filter(Boolean) as Array<{ tissue: string; medianTpm: number; implications: string; citations: string[] }>;

  const tumorVsNormalStart = normalized.match(/\*\*Tumor vs Normal Expression\s*:\*\*/i);
  const tumorUpregulation = (() => {
    if (!tumorVsNormalStart) return [];
    const after = normalized.slice(tumorVsNormalStart.index! + tumorVsNormalStart[0].length);
    const lines = after.split(/\r?\n/).map((l) => l.trim());
    const bullets: Array<{ indication: string; foldChange: number; pValue: string | null; citations: string[] }> = [];
    for (const l of lines) {
      if (l.startsWith('**') || l.startsWith('##') || l.startsWith('---')) break;
      if (!l.startsWith('-')) continue;
      const m =
        l.match(/-\s+\*\*([^*]+)\*\*:\s*([\d.]+)-fold[\s\S]*?\((p<[^)]+)\)/i) ||
        l.match(/-\s+\*\*([^*]+)\*\*:\s*([\d.]+)-fold/i);
      if (!m) continue;
      const indication = m[1].trim();
      const foldChange = Number.parseFloat(m[2]);
      if (!Number.isFinite(foldChange)) continue;
      const pValue = m[3] ? String(m[3]).trim() : null;
      bullets.push({
        indication,
        foldChange,
        pValue,
        citations: extractCitationNumbers(l),
      });
    }
    return bullets;
  })();
  
  return {
    data: {
      summary: {
        indication,
        orr: ascent.orr || orr,
        pfs: ascent.mpfs || pfs,
        os: ascent.mos || os,
        dcr,
        phase,
        approvedDrugs: approvedDrugs.length > 0 ? approvedDrugs : null,
        sections: Object.keys(sections).slice(0, 5),
        conviction,
        ascent,
        expression: {
          gtexNormalTissues,
          tumorUpregulation,
        },
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        indication,
        orr: ascent.orr || orr,
        pfs: ascent.mpfs || pfs,
        os: ascent.mos || os,
        dcr,
        phase,
        approvedDrugs,
        sections,
        conviction,
        ascent,
        expression: {
          gtexNormalTissues,
          tumorUpregulation,
        },
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Patent tile data
 */
export function extractPatentData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract patent numbers - try multiple patterns
  const patentMatches = normalized.match(/(?:US|EP|CN|WO|Patent)\s*\d{7,8}/g) ||
                        normalized.match(/US\d{7,8}|EP\d{7,8}|CN\d{7,8}|WO\d{4}\/\d{6}/g);
  const patents = patentMatches ? [...new Set(patentMatches.map(p => p.replace(/\s+/g, '')))] : [];
  
  // Extract FTO status - try multiple patterns
  const ftoMatch = normalized.match(/FTO[:\s]+(CLEAR|MODERATE RISK|HIGH RISK|BLOCKED|Clear|Moderate|High)/i) ||
                   normalized.match(/Freedom-to-Operate[:\s]+(CLEAR|MODERATE|HIGH|BLOCKED)/i) ||
                   normalized.match(/\*\*FTO STATUS[:\s]+(CLEAR|MODERATE RISK|HIGH RISK)\*\*/i);
  const ftoStatus = ftoMatch ? ftoMatch[1].toUpperCase() : 
                   (normalized.includes('BLOCKING') ? 'BLOCKED' :
                    normalized.includes('CLEAR FTO') || normalized.includes('clear FTO') ? 'CLEAR' :
                    normalized.includes('MODERATE RISK') || normalized.includes('moderate risk') ? 'MODERATE RISK' :
                    normalized.includes('HIGH RISK') || normalized.includes('high risk') ? 'HIGH RISK' : 'Not assessed');
  
  // Extract expiry dates
  const expiryMatches = normalized.match(/Expires[:\s]+(\d{4})/gi) ||
                       normalized.match(/Expiry[:\s]+(\d{4})/gi);
  const expiries = expiryMatches ? [...new Set(expiryMatches.map(m => {
    const match = m.match(/\d{4}/);
    return match ? match[0] : null;
  }).filter(Boolean))] : [];
  
  // Extract IP strength
  const strengthMatch = normalized.match(/IP (?:Strength|Position|Portfolio)[:\s]+(Strong|Moderate|Weak|STRONG|MODERATE|WEAK)/i) ||
                       normalized.match(/Patent Strength[:\s]+(Strong|Moderate|Weak)/i);
  const ipStrength = strengthMatch ? strengthMatch[1].toUpperCase() : 
                    (normalized.includes('Strong') && normalized.includes('patent') ? 'STRONG' :
                     normalized.includes('Moderate') && normalized.includes('patent') ? 'MODERATE' : 'Not assessed');
  
  // Extract patent portfolio value
  const valueMatch = normalized.match(/(?:value|valuation)[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const portfolioValue = valueMatch ? valueMatch[1] : null;
  
  // Extract exclusivity years
  const exclusivityMatch = normalized.match(/(\d+)\s*(?:years?|years remaining)/i);
  const exclusivityYears = exclusivityMatch ? exclusivityMatch[1] : null;

  // Parse key patents table (common in TROP2 IP writeups)
  const keyPatentRows = normalized
    .split(/\r?\n/)
    .filter((l) => /^\|\s*(US|EP|WO|CN)\d/.test(l))
    .filter((l) => !l.includes('---'));
  const keyPatents = keyPatentRows
    .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
    .map(([patent, title, assignee, dates, family, keyClaims, relevance]) => ({
      patent,
      title,
      assignee,
      dates,
      family,
      keyClaims,
      relevance,
    }))
    .slice(0, 8);
  const royaltyMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%\s*(?:royalt|stack)/i) || normalized.match(/(\d+(?:\.\d+)?)%\s*(?:royalt|stack)/i);
  const royalties = royaltyMatch ? royaltyMatch[0].trim() : null;
  
  return {
    data: {
      summary: {
        patentCount: patents.length,
        patents: patents.slice(0, 5), // Top 5
        ftoStatus,
        ipStrength,
        portfolioValue,
        exclusivityYears,
        expiries: expiries.slice(0, 3),
        sections: Object.keys(sections).slice(0, 5),
        keyPatents,
        royalties,
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        patents,
        ftoStatus,
        ipStrength,
        portfolioValue,
        exclusivityYears,
        expiries,
        sections,
        keyPatents,
        royalties,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Financial tile data
 */
export function extractFinancialData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract valuation - try multiple patterns
  const valuationMatch = normalized.match(/(?:Valuation|Value|DCF|Fair Value)[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                          normalized.match(/\$([\d.]+)\s*[BM]?\s*(?:valuation|value|DCF)/i) ||
                          normalized.match(/DCF Value[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const valuation = valuationMatch ? valuationMatch[1] : null;
  const valuationUnit = valuationMatch && normalized.match(/\$?([\d.]+)\s*([BM])/i) ? 
                        normalized.match(/\$?([\d.]+)\s*([BM])/i)?.[2] : null;
  
  // Extract cash/burn - try multiple patterns
  const cashMatch = normalized.match(/Cash[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                   normalized.match(/Cash & equivalents[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const cash = cashMatch ? cashMatch[1] : null;
  const cashUnit = cashMatch && normalized.match(/Cash[:\s]+\$?([\d.]+)\s*([BM])/i) ?
                  normalized.match(/Cash[:\s]+\$?([\d.]+)\s*([BM])/i)?.[2] : null;
  
  const burnMatch = normalized.match(/Burn[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                   normalized.match(/cash burn[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                   normalized.match(/Quarterly cash burn[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const burn = burnMatch ? burnMatch[1] : null;
  
  // Extract runway - try multiple patterns
  const runwayMatch = normalized.match(/Runway[:\s]+(\d+(?:\.\d+)?)\s*(?:quarters?|months?|years?)/i) ||
                     normalized.match(/Estimated runway[:\s]+(\d+(?:\.\d+)?)\s*(?:quarters?|months?)/i);
  const runway = runwayMatch ? runwayMatch[1] : null;
  const runwayUnit = runwayMatch && normalized.match(/Runway[:\s]+(\d+(?:\.\d+)?)\s*(quarters?|months?|years?)/i) ?
                    normalized.match(/Runway[:\s]+(\d+(?:\.\d+)?)\s*(quarters?|months?|years?)/i)?.[2] : null;
  
  // Extract peak sales
  const peakSalesMatch = normalized.match(/Peak sales[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                        normalized.match(/Peak sales estimate[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const peakSales = peakSalesMatch ? peakSalesMatch[1] : null;
  
  // Extract ROI
  const roiMatch = normalized.match(/ROI[:\s]+(\d+(?:\.\d+)?%)/i);
  const roi = roiMatch ? roiMatch[1] : null;

  // TROP2-specific: Trodelvy revenue and key transactions
  const trodelvyRevenueMatch = normalized.match(/Trodelvy generated\s*\$([\d,.]+)\s*(million|billion)\s*in\s*(\d{4})/i) ||
                               normalized.match(/Trodelvy Revenue:\s*\$([\d,.]+)\s*(million|billion)/i);
  const trodelvyRevenue = trodelvyRevenueMatch
    ? `$${trodelvyRevenueMatch[1]} ${trodelvyRevenueMatch[2] || ''}`.trim()
    : null;
  const acquisitionMatch = normalized.match(/acquisition by Gilead\s+for\s+\$([\d,.]+)\s*(billion|B)/i);
  const keyDeal = acquisitionMatch ? `Gilead acquired Immunomedics for $${acquisitionMatch[1]}B` : null;
  
  return {
    data: {
      summary: {
        valuation: valuation ? `${valuation}${valuationUnit || ''}` : null,
        cash: cash ? `${cash}${cashUnit || 'M'}` : null,
        burn: burn ? `${burn}${burnMatch && normalized.match(/Burn[:\s]+\$?([\d.]+)\s*([BM])/i) ? 
                  normalized.match(/Burn[:\s]+\$?([\d.]+)\s*([BM])/i)?.[2] : 'M'}` : null,
        runway: runway ? `${runway} ${runwayUnit || 'quarters'}` : null,
        peakSales: peakSales ? `${peakSales}B` : null,
        roi,
        sections: Object.keys(sections).slice(0, 5),
        trodelvyRevenue,
        keyDeal,
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        valuation,
        cash,
        burn,
        runway,
        peakSales,
        roi,
        sections,
        trodelvyRevenue,
        keyDeal,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Regulatory tile data
 */
export function extractRegulatoryData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract pathway - try multiple patterns
  const pathwayMatch = normalized.match(/(?:Pathway|Route|Regulatory Pathway)[:\s]+([^\n]+)/i) ||
                       normalized.match(/FDA pathway[:\s]+([^\n]+)/i) ||
                       normalized.match(/Approval pathway[:\s]+([^\n]+)/i);
  const pathway = pathwayMatch ? pathwayMatch[1].trim().substring(0, 60) : 
                  (normalized.includes('BLA') ? 'BLA' :
                   normalized.includes('Accelerated Approval') ? 'Accelerated Approval' :
                   normalized.includes('Breakthrough') ? 'Breakthrough Therapy' :
                   normalized.includes('Fast Track') ? 'Fast Track' : 'Not specified');
  
  // Extract timeline - try multiple patterns
  const timelineRangeMatch = normalized.match(/Timeline to Approval:\s*([\d.]+)\s*-\s*([\d.]+)\s*years/i) ||
                             normalized.match(/Realistic Timeline to Approval:\s*([\d.]+)\s*-\s*([\d.]+)\s*years/i);
  const timelineSingleMatch = normalized.match(/(?:Timeline|Duration|Approval timeline)[:\s]+(\d+(?:\.\d+)?)\s*(?:months?|years?)/i) ||
                             normalized.match(/(\d+(?:\.\d+)?)\s*(?:months?|years?)[^\n]*(?:to|until)[^\n]*approval/i);
  const timeline = timelineRangeMatch ? `${timelineRangeMatch[1]}-${timelineRangeMatch[2]}` : (timelineSingleMatch ? timelineSingleMatch[1] : null);
  const timelineUnit = timelineRangeMatch ? 'years' : (timelineSingleMatch && timelineSingleMatch[0].match(/years?/i) ? 'years' : 'months');
  
  // Extract expedited programs - try multiple patterns
  const expeditedMatch = normalized.match(/(?:Breakthrough|Fast Track|Orphan|Accelerated|Priority Review)/gi) ||
                        normalized.match(/(?:BTD|FTD|ODD|PRD)/gi);
  const expeditedPrograms = expeditedMatch ? [...new Set(expeditedMatch.map(m => {
    const match = m.trim();
    if (match.includes('Breakthrough') || match === 'BTD') return 'Breakthrough';
    if (match.includes('Fast Track') || match === 'FTD') return 'Fast Track';
    if (match.includes('Orphan') || match === 'ODD') return 'Orphan';
    if (match.includes('Accelerated')) return 'Accelerated';
    if (match.includes('Priority') || match === 'PRD') return 'Priority Review';
    return match;
  }))] : [];
  
  // Extract approval date/status
  const approvalMatch = normalized.match(/(?:Approved|FDA approval)[:\s]+([A-Z][a-z]+\s+\d{4})/i) ||
                       normalized.match(/(\d{4})[^\n]*(?:approval|approved)/i);
  const approvalDate = approvalMatch ? approvalMatch[1] : null;

  const investmentMatch = normalized.match(/Estimated Total Investment:\s*\\$([\d-]+)\s*M/i) ||
                          normalized.match(/Estimated Total Investment:\s*\\$([\d]+)\s*-\s*\\$([\d]+)M/i) ||
                          normalized.match(/Total Investment:\s*\\$([\d-]+)\s*M/i);
  const investment = investmentMatch ? investmentMatch[0].replace('Estimated Total Investment:', '').trim() : null;
  
  return {
    data: {
      summary: {
        pathway,
        timeline: timeline ? `${timeline} ${timelineUnit}` : null,
        expeditedPrograms: expeditedPrograms.slice(0, 4),
        approvalDate,
        sections: Object.keys(sections).slice(0, 5),
        investment,
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        pathway,
        timeline,
        expeditedPrograms,
        approvalDate,
        sections,
        investment,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Market Research tile data
 */
export function extractMarketResearchData(
  response: string,
  agent: AgentType,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(response);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract TAM/SAM - try multiple patterns
  const tamMatch = normalized.match(/TAM[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                  normalized.match(/Total Addressable Market[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                  normalized.match(/\$([\d.]+)\s*[BM]?\s*TAM/i);
  const tam = tamMatch ? tamMatch[1] : null;
  const tamUnit = tamMatch && response.match(/TAM[:\s]+\$?([\d.]+)\s*([BM])/i) ?
                 response.match(/TAM[:\s]+\$?([\d.]+)\s*([BM])/i)?.[2] : null;
  
  const samMatch = normalized.match(/SAM[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                  normalized.match(/Serviceable Addressable Market[:\s]+\$?([\d.]+)\s*[BM]?/i);
  const sam = samMatch ? samMatch[1] : null;
  const samUnit = samMatch && response.match(/SAM[:\s]+\$?([\d.]+)\s*([BM])/i) ?
                 response.match(/SAM[:\s]+\$?([\d.]+)\s*([BM])/i)?.[2] : null;
  
  // Extract growth rate - try multiple patterns
  const growthMatch = normalized.match(/(?:Growth|CAGR|growth rate)[:\s]+(\d+(?:\.\d+)?%)/i) ||
                     normalized.match(/(\d+(?:\.\d+)?%)[^\n]*(?:CAGR|growth|annually)/i);
  const growth = growthMatch ? growthMatch[1] : null;
  
  // Extract competitive landscape - try multiple patterns
  const competitorMatch = normalized.match(/(?:Competitor|Competition|competitors?)[:\s]+(\d+)/i) ||
                         normalized.match(/(\d+)\s*(?:competitors?|players?)/i);
  const competitorCount = competitorMatch ? parseInt(competitorMatch[1], 10) : null;
  
  // Extract market share
  const marketShareMatch = normalized.match(/(?:Market share|Share)[:\s]+(\d+(?:\.\d+)?%)/i);
  const marketShare = marketShareMatch ? marketShareMatch[1] : null;
  
  // Extract peak sales forecast
  const peakSalesMatch = normalized.match(/Peak sales[:\s]+\$?([\d.]+)\s*[BM]?/i) ||
                        normalized.match(/\$([\d.]+)\s*[BM]?[^\n]*(?:peak|forecast)/i);
  const peakSales = peakSalesMatch ? peakSalesMatch[1] : null;

  // Extract key tumor types list (simple heuristic)
  const tumorTypes = Array.from(
    new Set(
      (normalized.match(/\b(NSCLC|urothelial|gastric|pancreatic|colorectal|ovarian|breast|TNBC|prostate)\b/gi) || [])
        .map((s) => s.toUpperCase())
    )
  ).slice(0, 8);
  
  return {
    data: {
      summary: {
        tam: tam ? `${tam}${tamUnit || 'B'}` : null,
        sam: sam ? `${sam}${samUnit || 'B'}` : null,
        growth,
        competitorCount,
        marketShare,
        peakSales: peakSales ? `${peakSales}B` : null,
        sections: Object.keys(sections).slice(0, 5),
        tumorTypes,
        verifiedHighlights: getCitedBulletLines(normalized, 4),
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
        ...extractSummary(normalized),
      },
      detailed: {
        fullResponse: normalized,
        tam,
        sam,
        growth,
        competitorCount,
        marketShare,
        peakSales,
        sections,
        tumorTypes,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.90,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent,
      sourceType: 'agent_analysis',
      sourceData: { response: normalized },
    },
  };
}

/**
 * Extract Executive Summary/Synthesis tile data
 */
export function extractSynthesisData(
  synthesis: string,
  analysisId: string
): { data: TileData; source: TileSource } {
  const normalized = normalizeAgentResponse(synthesis);
  const sections = extractMarkdownSections(normalized);
  const citationStats = getCitationStats(normalized);
  
  // Extract recommendation
  const recommendationMatch = normalized.match(/(?:Recommendation|RECOMMENDATION)[:\s]+(PROCEED|PROCEED WITH EXTREME CAUTION|PROCEED WITH CONDITIONS|DO NOT PROCEED|ADVANCE|VALIDATED|CONDITIONAL)/i) ||
                              normalized.match(/\*\*Recommendation[:\s]+\*\*(PROCEED|PROCEED WITH CONDITIONS|DO NOT PROCEED)/i);
  const recommendation = recommendationMatch ? recommendationMatch[1] : null;
  
  // Extract key findings summary
  const keyFindings: string[] = [];
  const findingMatches = normalized.match(/\*\*Key Findings[:\s]+\*\*[\s\S]*?([^\n]+(?:\n[^\n]+){0,3})/i) ||
                         normalized.match(/## Executive Summary[\s\S]*?([^\n]+(?:\n[^\n]+){0,5})/i);
  if (findingMatches) {
    const findingsText = findingMatches[1];
    const bulletMatches = findingsText.match(/[-•]\s*([^\n]+)/g);
    if (bulletMatches) {
      keyFindings.push(...bulletMatches.map(m => m.replace(/[-•]\s*/, '').trim()).slice(0, 5));
    } else {
      // Extract first few sentences
      const sentences = findingsText.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 3);
      keyFindings.push(...sentences);
    }
  }
  
  // Extract confidence level
  const confidenceMatch = normalized.match(/(?:Confidence|Confidence Level)[:\s]+(High|Medium|Low|HIGH|MEDIUM|LOW)/i);
  const confidence = confidenceMatch ? confidenceMatch[1].toUpperCase() : null;
  
  return {
    data: {
      summary: {
        recommendation,
        confidence,
        keyFindings: keyFindings.length > 0 ? keyFindings : null,
        sections: Object.keys(sections).slice(0, 5),
        preview: normalized.substring(0, 500) + '...',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
      detailed: {
        fullSynthesis: normalized,
        recommendation,
        confidence,
        keyFindings,
        sections,
        referencesSection: extractReferencesSection(normalized),
      },
      metadata: {
        extractionDate: new Date().toISOString(),
        confidence: 0.95,
        validationStatus: 'validated',
        citationsUsedCount: citationStats.citationNumbers.length,
        hasReferencesSection: citationStats.hasReferencesSection,
      },
    },
    source: {
      analysisId,
      timestamp: new Date().toISOString(),
      agent: 'synthesis' as any,
      sourceType: 'agent_analysis',
      sourceData: { synthesis: normalized },
    },
  };
}

/**
 * Main extractor function - routes to appropriate extractor based on agent type
 */
export function extractTileData(
  response: string,
  agent: AgentType | 'synthesis',
  analysisId: string
): { data: TileData; source: TileSource } {
  if (agent === 'synthesis') {
    return extractSynthesisData(response, analysisId);
  }
  
  const normalized = normalizeAgentResponse(response);
  switch (agent) {
    case 'target_biology':
      return extractTargetBiologyData(normalized, agent, analysisId);
    case 'clinical':
      return extractClinicalData(normalized, agent, analysisId);
    case 'patent':
      return extractPatentData(normalized, agent, analysisId);
    case 'financial':
      return extractFinancialData(normalized, agent, analysisId);
    case 'regulatory':
      return extractRegulatoryData(normalized, agent, analysisId);
    case 'market_research':
      return extractMarketResearchData(normalized, agent, analysisId);
    default:
      // Generic extractor
      return {
        data: {
          summary: extractSummary(normalized),
          detailed: { fullResponse: normalized },
          metadata: {
            extractionDate: new Date().toISOString(),
            confidence: 0.75,
            validationStatus: 'review_required',
          },
        },
        source: {
          analysisId,
          timestamp: new Date().toISOString(),
          agent,
          sourceType: 'agent_analysis',
          sourceData: { response: normalized },
        },
      };
  }
}

