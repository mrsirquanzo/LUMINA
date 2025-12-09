/**
 * Structure Validator
 * Validates SMILES, InChI, and chemical structures
 */

import type { SmallMolecule, MarkushStructure } from '../types';

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validate SMILES string
 */
export function validateSMILES(smiles: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic SMILES syntax checks
  if (!smiles || smiles.length === 0) {
    errors.push('SMILES string is empty');
    return { valid: false, confidence: 0, errors, warnings };
  }

  // Check for balanced parentheses (for branches)
  const openParens = (smiles.match(/\(/g) || []).length;
  const closeParens = (smiles.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unbalanced parentheses in SMILES');
  }

  // Check for balanced brackets (for atoms with charges/isotopes)
  const openBrackets = (smiles.match(/\[/g) || []).length;
  const closeBrackets = (smiles.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unbalanced brackets in SMILES');
  }

  // Check for valid characters (basic check)
  const validChars = /^[A-Za-z0-9@+\-\[\]()=#$%:.*]+$/;
  if (!validChars.test(smiles)) {
    warnings.push('SMILES contains unusual characters');
  }

  // Check length (reasonable bounds)
  if (smiles.length < 3) {
    warnings.push('SMILES is very short');
  }
  if (smiles.length > 1000) {
    warnings.push('SMILES is very long');
  }

  const valid = errors.length === 0;
  const confidence = valid ? (warnings.length === 0 ? 0.9 : 0.7) : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate small molecule structure
 */
export function validateSmallMolecule(molecule: SmallMolecule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate SMILES if present
  if (molecule.smiles) {
    const smilesValidation = validateSMILES(molecule.smiles);
    errors.push(...smilesValidation.errors);
    warnings.push(...smilesValidation.warnings);
  } else {
    warnings.push('No SMILES structure provided');
  }

  // Validate molecular weight if present
  if (molecule.molecular_weight !== undefined) {
    if (molecule.molecular_weight <= 0) {
      errors.push('Invalid molecular weight (must be positive)');
    }
    if (molecule.molecular_weight > 10000) {
      warnings.push('Molecular weight is very high (may be incorrect)');
    }
  }

  // Check compound ID
  if (!molecule.compound_id || molecule.compound_id.length === 0) {
    warnings.push('No compound ID provided');
  }

  const valid = errors.length === 0;
  const confidence = valid
    ? molecule.smiles
      ? 0.85
      : 0.6
    : 0;

  return { valid, confidence, errors, warnings };
}

/**
 * Validate Markush structure
 */
export function validateMarkushStructure(structure: MarkushStructure): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check formula ID
  if (!structure.formula_id || structure.formula_id.length === 0) {
    errors.push('No formula ID provided');
  }

  // Check variables
  const variableCount = Object.keys(structure.variables).length;
  if (variableCount === 0) {
    warnings.push('No variables defined in Markush structure');
  }

  // Validate each variable
  for (const [varName, variable] of Object.entries(structure.variables)) {
    if (!variable.options || variable.options.length === 0) {
      warnings.push(`Variable ${varName} has no options`);
    }
    if (variable.options && variable.options.length > 100) {
      warnings.push(`Variable ${varName} has many options (${variable.options.length})`);
    }
  }

  // Check genus scope consistency
  if (structure.genus_scope === 'broad' && variableCount < 3) {
    warnings.push('Genus scope marked as broad but few variables defined');
  }
  if (structure.genus_scope === 'narrow' && variableCount > 5) {
    warnings.push('Genus scope marked as narrow but many variables defined');
  }

  const valid = errors.length === 0;
  const confidence = valid
    ? variableCount > 0
      ? 0.8
      : 0.5
    : 0;

  return { valid, confidence, errors, warnings };
}
