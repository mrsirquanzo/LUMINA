/**
 * Sequence Validator
 * Validates amino acid and nucleic acid sequences
 */

import type { AntibodySequence, CDRSequence, NucleicAcidSequence } from '../types';

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validate amino acid sequence
 */
export function validateAminoAcidSequence(sequence: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sequence || sequence.length === 0) {
    errors.push('Sequence is empty');
    return { valid: false, confidence: 0, errors, warnings };
  }

  // Check for valid amino acids (standard 20 + selenocysteine U)
  const validAAs = /^[ACDEFGHIKLMNPQRSTVWYU*]+$/i;
  if (!validAAs.test(sequence)) {
    const invalidChars = sequence
      .split('')
      .filter(c => !/[ACDEFGHIKLMNPQRSTVWYU*]/i.test(c))
      .filter((v, i, a) => a.indexOf(v) === i); // Unique
    errors.push(`Invalid amino acid characters: ${invalidChars.join(', ')}`);
  }

  // Check length
  if (sequence.length < 5) {
    warnings.push('Sequence is very short');
  }
  if (sequence.length > 2000) {
    warnings.push('Sequence is very long');
  }

  // Check for stop codons (*)
  if (sequence.includes('*') && !sequence.endsWith('*')) {
    warnings.push('Sequence contains stop codon in middle');
  }

  const valid = errors.length === 0;
  const confidence = valid ? (warnings.length === 0 ? 0.95 : 0.8) : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate nucleic acid sequence
 */
export function validateNucleicAcidSequence(sequence: string, type: NucleicAcidSequence['type']): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sequence || sequence.length === 0) {
    errors.push('Sequence is empty');
    return { valid: false, confidence: 0, errors, warnings };
  }

  // Check for valid nucleotides
  const validDNA = /^[ATGCUNRYWSKMDVHB]+$/i;
  const validRNA = /^[AUGCUNRYWSKMDVHB]+$/i;

  if (type === 'rna' || type === 'mrna' || type === 'sirna' || type === 'grna') {
    if (!validRNA.test(sequence)) {
      errors.push('Invalid RNA sequence characters');
    }
  } else {
    if (!validDNA.test(sequence)) {
      errors.push('Invalid DNA sequence characters');
    }
  }

  // Check length
  if (sequence.length < 10) {
    warnings.push('Sequence is very short');
  }
  if (sequence.length > 100000) {
    warnings.push('Sequence is very long');
  }

  // Check length consistency with type
  if (type === 'sirna' && sequence.length !== 21 && sequence.length !== 22) {
    warnings.push(`siRNA typically 21-22 bp, found ${sequence.length}`);
  }
  if (type === 'grna' && sequence.length < 15) {
    warnings.push('gRNA typically at least 15 bp');
  }

  const valid = errors.length === 0;
  const confidence = valid ? (warnings.length === 0 ? 0.95 : 0.8) : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate CDR sequence
 */
export function validateCDRSequence(cdr: CDRSequence, region: 'HCDR1' | 'HCDR2' | 'HCDR3' | 'LCDR1' | 'LCDR2' | 'LCDR3'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cdr.sequence || cdr.sequence.length === 0) {
    errors.push(`${region} sequence is empty`);
    return { valid: false, confidence: 0, errors, warnings };
  }

  // Validate amino acid sequence
  const aaValidation = validateAminoAcidSequence(cdr.sequence);
  errors.push(...aaValidation.errors);
  warnings.push(...aaValidation.warnings);

  // Check length for specific CDR regions
  const expectedLengths: Record<string, { min: number; max: number }> = {
    HCDR1: { min: 5, max: 12 },
    HCDR2: { min: 16, max: 19 },
    HCDR3: { min: 3, max: 25 },
    LCDR1: { min: 10, max: 17 },
    LCDR2: { min: 7, max: 7 },
    LCDR3: { min: 7, max: 11 },
  };

  const expected = expectedLengths[region];
  if (expected) {
    if (cdr.sequence.length < expected.min) {
      warnings.push(`${region} is shorter than typical (${cdr.sequence.length} vs ${expected.min}-${expected.max})`);
    }
    if (cdr.sequence.length > expected.max) {
      warnings.push(`${region} is longer than typical (${cdr.sequence.length} vs ${expected.min}-${expected.max})`);
    }
  }

  const valid = errors.length === 0;
  const confidence = valid ? (warnings.length === 0 ? 0.9 : 0.75) : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate antibody sequence
 */
export function validateAntibodySequence(antibody: AntibodySequence): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate heavy chain
  if (antibody.heavy_chain) {
    if (antibody.heavy_chain.hcdr1) {
      const hcdr1Val = validateCDRSequence(antibody.heavy_chain.hcdr1, 'HCDR1');
      errors.push(...hcdr1Val.errors);
      warnings.push(...hcdr1Val.warnings);
    }
    if (antibody.heavy_chain.hcdr2) {
      const hcdr2Val = validateCDRSequence(antibody.heavy_chain.hcdr2, 'HCDR2');
      errors.push(...hcdr2Val.errors);
      warnings.push(...hcdr2Val.warnings);
    }
    if (antibody.heavy_chain.hcdr3) {
      const hcdr3Val = validateCDRSequence(antibody.heavy_chain.hcdr3, 'HCDR3');
      errors.push(...hcdr3Val.errors);
      warnings.push(...hcdr3Val.warnings);
    }
    if (antibody.heavy_chain.vh_full) {
      const vhVal = validateAminoAcidSequence(antibody.heavy_chain.vh_full.sequence);
      errors.push(...vhVal.errors);
      warnings.push(...vhVal.warnings);
      if (antibody.heavy_chain.vh_full.sequence.length < 100 || antibody.heavy_chain.vh_full.sequence.length > 150) {
        warnings.push(`VH length unusual: ${antibody.heavy_chain.vh_full.sequence.length} (typical 110-130)`);
      }
    }
  } else {
    warnings.push('No heavy chain data provided');
  }

  // Validate light chain
  if (antibody.light_chain) {
    if (antibody.light_chain.lcdr1) {
      const lcdr1Val = validateCDRSequence(antibody.light_chain.lcdr1, 'LCDR1');
      errors.push(...lcdr1Val.errors);
      warnings.push(...lcdr1Val.warnings);
    }
    if (antibody.light_chain.lcdr2) {
      const lcdr2Val = validateCDRSequence(antibody.light_chain.lcdr2, 'LCDR2');
      errors.push(...lcdr2Val.errors);
      warnings.push(...lcdr2Val.warnings);
    }
    if (antibody.light_chain.lcdr3) {
      const lcdr3Val = validateCDRSequence(antibody.light_chain.lcdr3, 'LCDR3');
      errors.push(...lcdr3Val.errors);
      warnings.push(...lcdr3Val.warnings);
    }
    if (antibody.light_chain.vl_full) {
      const vlVal = validateAminoAcidSequence(antibody.light_chain.vl_full.sequence);
      errors.push(...vlVal.errors);
      warnings.push(...vlVal.warnings);
      if (antibody.light_chain.vl_full.sequence.length < 100 || antibody.light_chain.vl_full.sequence.length > 120) {
        warnings.push(`VL length unusual: ${antibody.light_chain.vl_full.sequence.length} (typical 105-115)`);
      }
    }
  } else {
    warnings.push('No light chain data provided');
  }

  // Check if at least some sequence data exists
  const hasAnySequence =
    (antibody.heavy_chain && (
      antibody.heavy_chain.hcdr1 ||
      antibody.heavy_chain.hcdr2 ||
      antibody.heavy_chain.hcdr3 ||
      antibody.heavy_chain.vh_full
    )) ||
    (antibody.light_chain && (
      antibody.light_chain.lcdr1 ||
      antibody.light_chain.lcdr2 ||
      antibody.light_chain.lcdr3 ||
      antibody.light_chain.vl_full
    ));

  if (!hasAnySequence) {
    errors.push('No sequence data provided for antibody');
  }

  const valid = errors.length === 0;
  const confidence = valid
    ? hasAnySequence
      ? 0.85
      : 0.5
    : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate nucleic acid sequence
 */
export function validateNucleicAcid(nucleicAcid: NucleicAcidSequence): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nucleicAcid.sequence || nucleicAcid.sequence.length === 0) {
    if (!nucleicAcid.seq_id_no) {
      errors.push('No sequence or SEQ ID NO provided');
    } else {
      warnings.push('Sequence not provided, only SEQ ID NO');
    }
  } else {
    const seqVal = validateNucleicAcidSequence(nucleicAcid.sequence, nucleicAcid.type);
    errors.push(...seqVal.errors);
    warnings.push(...seqVal.warnings);

    // Check length consistency
    if (nucleicAcid.length > 0 && nucleicAcid.sequence.length !== nucleicAcid.length) {
      errors.push(`Sequence length mismatch: stated ${nucleicAcid.length}, actual ${nucleicAcid.sequence.length}`);
    }
  }

  // Validate SEQ ID NO
  if (nucleicAcid.seq_id_no <= 0) {
    errors.push('Invalid SEQ ID NO (must be positive)');
  }

  const valid = errors.length === 0;
  const confidence = valid ? (nucleicAcid.sequence ? 0.9 : 0.7) : 0;

  return { valid, confidence, errors, warnings };
}
