/**
 * Sequence Extractor
 * Extracts antibody sequences, nucleic acid sequences, and parses ST.25/ST.26 sequence listings
 */

import type {
  AntibodySequence,
  CDRSequence,
  NucleicAcidSequence,
  NumberingSystem,
} from '../types';

export interface SequenceExtractionResult {
  antibodies: AntibodySequence[];
  nucleic_acids: NucleicAcidSequence[];
  extraction_confidence: number;
}

/**
 * Extract all sequences from patent text and sequence listing
 */
export function extractSequences(
  text: string,
  sequenceListing?: string
): SequenceExtractionResult {
  const antibodies = extractAntibodySequences(text);
  const nucleic_acids = extractNucleicAcidSequences(text, sequenceListing);

  // Calculate overall confidence
  const confidence = calculateSequenceConfidence(antibodies, nucleic_acids);

  return {
    antibodies,
    nucleic_acids,
    extraction_confidence: confidence,
  };
}

/**
 * Extract antibody sequences from text
 */
function extractAntibodySequences(text: string): AntibodySequence[] {
  const antibodies: AntibodySequence[] = [];

  // Find antibody identifiers: "Ab-1", "Antibody 1", "mAb-1", etc.
  const antibodyRegex = /(?:Ab|Antibody|mAb|Antibody)\s*[-]?(\d+[A-Z]?|[A-Z])/gi;
  const antibodyMatches = [...text.matchAll(antibodyRegex)];

  for (const match of antibodyMatches) {
    const antibodyName = match[0];
    const antibodySection = extractAntibodySection(text, antibodyName);

    if (antibodySection) {
      const antibody = parseAntibodySequence(antibodyName, antibodySection);
      if (antibody) {
        antibodies.push(antibody);
      }
    }
  }

  // Also try to extract from SEQ ID NO references
  const seqIdAntibodies = extractAntibodiesFromSeqIds(text);
  antibodies.push(...seqIdAntibodies);

  return antibodies;
}

/**
 * Extract section containing antibody information
 */
function extractAntibodySection(text: string, antibodyName: string): string | null {
  // Find section mentioning this antibody (typically 500-2000 chars)
  const pattern = new RegExp(
    `${antibodyName.replace(/[()]/g, '\\$&')}[\\s\\S]{200,2000}(?:CDR|SEQ ID NO|heavy chain|light chain)`,
    'i'
  );
  const match = text.match(pattern);
  return match ? match[0] : null;
}

/**
 * Parse antibody sequence from text section
 */
function parseAntibodySequence(
  name: string,
  section: string
): AntibodySequence | null {
  const heavyChain = extractHeavyChain(section);
  const lightChain = extractLightChain(section);
  const format = extractAntibodyFormat(section);
  const fcModifications = extractFcModifications(section);

  // Only create if we have at least some sequence data
  if (!heavyChain && !lightChain) {
    return null;
  }

  return {
    name,
    heavy_chain: heavyChain || {
      hcdr1: undefined,
      hcdr2: undefined,
      hcdr3: undefined,
      vh_full: undefined,
    },
    light_chain: lightChain || {
      lcdr1: undefined,
      lcdr2: undefined,
      lcdr3: undefined,
      vl_full: undefined,
    },
    format,
    fc_modifications: fcModifications.length > 0 ? fcModifications : undefined,
    confidence: calculateAntibodyConfidence(heavyChain, lightChain),
  };
}

/**
 * Extract heavy chain sequences
 */
function extractHeavyChain(section: string): AntibodySequence['heavy_chain'] | null {
  const hcdr1 = extractCDR(section, 'HCDR1', 'heavy.*CDR1');
  const hcdr2 = extractCDR(section, 'HCDR2', 'heavy.*CDR2');
  const hcdr3 = extractCDR(section, 'HCDR3', 'heavy.*CDR3');
  const vhFull = extractFullSequence(section, 'VH', 'heavy.*chain.*variable');

  if (!hcdr1 && !hcdr2 && !hcdr3 && !vhFull) {
    return null;
  }

  return {
    hcdr1,
    hcdr2,
    hcdr3,
    vh_full: vhFull,
  };
}

/**
 * Extract light chain sequences
 */
function extractLightChain(section: string): AntibodySequence['light_chain'] | null {
  const lcdr1 = extractCDR(section, 'LCDR1', 'light.*CDR1');
  const lcdr2 = extractCDR(section, 'LCDR2', 'light.*CDR2');
  const lcdr3 = extractCDR(section, 'LCDR3', 'light.*CDR3');
  const vlFull = extractFullSequence(section, 'VL', 'light.*chain.*variable');

  if (!lcdr1 && !lcdr2 && !lcdr3 && !vlFull) {
    return null;
  }

  return {
    lcdr1,
    lcdr2,
    lcdr3,
    vl_full: vlFull,
  };
}

/**
 * Extract CDR sequence
 */
function extractCDR(
  text: string,
  cdrName: string,
  pattern: string
): CDRSequence | undefined {
  // Try explicit CDR match: "HCDR1: GYTFTSYW" or "HCDR1 is GYTFTSYW"
  const explicitMatch = text.match(
    new RegExp(`${cdrName}[\\s:]+([A-Z]{5,30})`, 'i')
  );
  if (explicitMatch) {
    const sequence = explicitMatch[1];
    if (isValidAminoAcidSequence(sequence)) {
      return {
        sequence,
        numbering_system: detectNumberingSystem(text),
        confidence: 0.9,
      };
    }
  }

  // Try pattern-based match
  const patternMatch = text.match(new RegExp(`${pattern}[\\s:]+([A-Z]{5,30})`, 'i'));
  if (patternMatch) {
    const sequence = patternMatch[1];
    if (isValidAminoAcidSequence(sequence)) {
      return {
        sequence,
        numbering_system: detectNumberingSystem(text),
        confidence: 0.8,
      };
    }
  }

  // Try SEQ ID NO reference
  const seqIdMatch = text.match(
    new RegExp(`${cdrName}[\\s:]+SEQ ID NO[\\s:]+(\\d+)`, 'i')
  );
  if (seqIdMatch) {
    return {
      sequence: '', // Will be resolved from sequence listing
      seq_id_no: parseInt(seqIdMatch[1], 10),
      numbering_system: detectNumberingSystem(text),
      confidence: 0.85,
    };
  }

  return undefined;
}

/**
 * Extract full variable region sequence
 */
function extractFullSequence(
  text: string,
  regionName: string,
  pattern: string
): CDRSequence | undefined {
  // Try explicit match: "VH: EVQLVES..."
  const explicitMatch = text.match(
    new RegExp(`${regionName}[\\s:]+([A-Z]{100,150})`, 'i')
  );
  if (explicitMatch) {
    const sequence = explicitMatch[1];
    if (isValidAminoAcidSequence(sequence)) {
      return {
        sequence,
        numbering_system: detectNumberingSystem(text),
        confidence: 0.9,
      };
    }
  }

  // Try SEQ ID NO reference
  const seqIdMatch = text.match(
    new RegExp(`${regionName}[\\s:]+SEQ ID NO[\\s:]+(\\d+)`, 'i')
  );
  if (seqIdMatch) {
    return {
      sequence: '', // Will be resolved from sequence listing
      seq_id_no: parseInt(seqIdMatch[1], 10),
      numbering_system: detectNumberingSystem(text),
      confidence: 0.85,
    };
  }

  return undefined;
}

/**
 * Validate amino acid sequence
 */
function isValidAminoAcidSequence(sequence: string): boolean {
  // Standard 20 amino acids + selenocysteine (U)
  const validAAs = /^[ACDEFGHIKLMNPQRSTVWYU]+$/i;
  if (!validAAs.test(sequence)) return false;

  // Length checks
  if (sequence.length < 5) return false; // Too short for CDR
  if (sequence.length > 500) return false; // Too long for single region

  return true;
}

/**
 * Detect numbering system from text
 */
function detectNumberingSystem(text: string): NumberingSystem {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('kabat')) return 'kabat';
  if (textLower.includes('chothia')) return 'chothia';
  if (textLower.includes('imgt')) return 'imgt';
  if (textLower.includes('aho')) return 'aho';

  return 'unknown';
}

/**
 * Extract antibody format
 */
function extractAntibodyFormat(text: string): string | undefined {
  const formatMatch = text.match(/(?:IgG[1-4]|IgM|IgA|bispecific|scFv|Fab|F(ab')2)/i);
  return formatMatch ? formatMatch[0] : undefined;
}

/**
 * Extract Fc modifications
 */
function extractFcModifications(text: string): string[] {
  const modifications: string[] = [];

  // Common modifications: S228P, L234A, L235A, etc.
  const mutationRegex = /([A-Z]\d+[A-Z])\s+(?:mutation|substitution|modification)/gi;
  let match;
  while ((match = mutationRegex.exec(text)) !== null) {
    modifications.push(match[1]);
  }

  return modifications;
}

/**
 * Extract antibodies from SEQ ID NO references
 */
function extractAntibodiesFromSeqIds(text: string): AntibodySequence[] {
  const antibodies: AntibodySequence[] = [];

  // Find patterns like "heavy chain variable region (SEQ ID NO: 1)"
  const heavyMatch = text.match(/heavy.*chain.*variable.*SEQ ID NO[:\s]+(\d+)/i);
  const lightMatch = text.match(/light.*chain.*variable.*SEQ ID NO[:\s]+(\d+)/i);

  if (heavyMatch || lightMatch) {
    const antibody: any = {
      name: 'Antibody from SEQ ID',
    };
    if (heavyMatch) {
      antibody.heavy_chain = {
        vh_full: {
          sequence: '',
          seq_id_no: parseInt(heavyMatch[1], 10),
          numbering_system: 'unknown',
          confidence: 0.8,
        },
      };
    }
    if (lightMatch) {
      antibody.light_chain = {
        vl_full: {
          sequence: '',
          seq_id_no: parseInt(lightMatch[1], 10),
          numbering_system: 'unknown',
          confidence: 0.8,
        },
      };
    }
    antibodies.push(antibody);
      confidence: 0.75,
    });
  }

  return antibodies;
}

/**
 * Extract nucleic acid sequences
 */
function extractNucleicAcidSequences(
  text: string,
  sequenceListing?: string
): NucleicAcidSequence[] {
  const sequences: NucleicAcidSequence[] = [];

  // Extract from sequence listing if available
  if (sequenceListing) {
    const listingSequences = parseSequenceListing(sequenceListing);
    sequences.push(...listingSequences);
  }

  // Extract from main text (SEQ ID NO references)
  const textSequences = extractSeqIdReferences(text);
  sequences.push(...textSequences);

  return sequences;
}

/**
 * Parse ST.25/ST.26 sequence listing
 */
function parseSequenceListing(listing: string): NucleicAcidSequence[] {
  const sequences: NucleicAcidSequence[] = [];

  // Match SEQ ID NO entries
  const seqIdRegex = /SEQ ID NO[:\s]+(\d+)[\s\S]{0,5000}?<(\d+)>/g;
  let match;

  while ((match = seqIdRegex.exec(listing)) !== null) {
    const seqId = parseInt(match[1], 10);
    const length = parseInt(match[2], 10);

    // Extract sequence type
    const typeMatch = listing.substring(match.index).match(/(DNA|RNA|PRT|mRNA|siRNA|gRNA)/i);
    const type = typeMatch
      ? (typeMatch[0].toLowerCase() as NucleicAcidSequence['type'])
      : 'dna';

    // Extract actual sequence (if present in listing)
    const sequenceMatch = listing
      .substring(match.index, match.index + 5000)
      .match(/<(\d+)>\s*([ATGCUatgcuN]+)/);
    const sequence = sequenceMatch ? sequenceMatch[2].toUpperCase() : '';

    sequences.push({
      seq_id_no: seqId,
      type,
      sequence,
      length,
      confidence: sequence.length > 0 ? 0.9 : 0.7,
    });
  }

  return sequences;
}

/**
 * Extract SEQ ID NO references from text
 */
function extractSeqIdReferences(text: string): NucleicAcidSequence[] {
  const sequences: NucleicAcidSequence[] = [];

  // Match "SEQ ID NO: 1" patterns
  const seqIdRegex = /SEQ ID NO[:\s]+(\d+)/gi;
  const matches: RegExpExecArray[] = [];
  let match;
  while ((match = seqIdRegex.exec(text)) !== null) {
    matches.push(match);
  }

  for (const match of matches) {
    const seqId = parseInt(match[1], 10);

    // Try to determine type from context
    const context = text.substring(Math.max(0, match.index - 200), match.index + 200);
    let type: NucleicAcidSequence['type'] = 'dna';
    
    if (context.match(/DNA|gene|promoter|enhancer/i)) type = 'dna';
    else if (context.match(/RNA|mRNA|transcript/i)) type = 'mrna';
    else if (context.match(/siRNA|shRNA/i)) type = 'sirna';
    else if (context.match(/gRNA|guide/i)) type = 'grna';
    else if (context.match(/vector|AAV|lentivirus/i)) type = 'vector';

    sequences.push({
      seq_id_no: seqId,
      type,
      sequence: '', // Will be resolved from sequence listing
      length: 0,
      confidence: 0.7,
    });
  }

  return sequences;
}

/**
 * Calculate antibody extraction confidence
 */
function calculateAntibodyConfidence(
  heavyChain: AntibodySequence['heavy_chain'] | null,
  lightChain: AntibodySequence['light_chain'] | null
): number {
  let confidence = 0.5;

  if (heavyChain) {
    const hcElements = [
      heavyChain.hcdr1,
      heavyChain.hcdr2,
      heavyChain.hcdr3,
      heavyChain.vh_full,
    ].filter(Boolean).length;
    confidence += hcElements * 0.1;
  }

  if (lightChain) {
    const lcElements = [
      lightChain.lcdr1,
      lightChain.lcdr2,
      lightChain.lcdr3,
      lightChain.vl_full,
    ].filter(Boolean).length;
    confidence += lcElements * 0.1;
  }

  return Math.min(0.95, confidence);
}

/**
 * Calculate overall sequence extraction confidence
 */
function calculateSequenceConfidence(
  antibodies: AntibodySequence[],
  nucleicAcids: NucleicAcidSequence[]
): number {
  if (antibodies.length === 0 && nucleicAcids.length === 0) return 0.3;

  const abConf = antibodies.length > 0
    ? antibodies.reduce((sum, ab) => sum + ab.confidence, 0) / antibodies.length
    : 0;

  const naConf = nucleicAcids.length > 0
    ? nucleicAcids.reduce((sum, na) => sum + na.confidence, 0) / nucleicAcids.length
    : 0;

  if (antibodies.length > 0 && nucleicAcids.length > 0) {
    return (abConf + naConf) / 2;
  }

  return abConf || naConf;
}
