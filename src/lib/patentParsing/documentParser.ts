/**
 * Main Patent Document Parser
 * Orchestrates all extraction, validation, and quality assurance
 */

import type {
  PatentExtractionResult,
  DocumentInfo,
  ValidationFlag,
  FTORelevantData,
} from './types';

export interface ExtractionOptions {
  extract_structures?: boolean;
  extract_sequences?: boolean;
  extract_biological_data?: boolean;
  resolve_cross_references?: boolean;
  validate_data?: boolean;
  include_prosecution_history?: boolean;
  include_family_members?: boolean;
}

export interface VerificationItem {
  id: string;
  field: string;
  label: string;
  extractedValue: string;
  confidence: number;
  alternatives?: string[];
  context?: string;
  section?: string;
  pageNumber?: number;
}

export type VerificationCallback = (item: VerificationItem) => void;
import { parsePDF, type PDFParseResult } from './formats/pdfParser';
import { extractClaims } from './extractors/claimsExtractor';
import { extractStructures } from './extractors/structureExtractor';
import { extractSequences } from './extractors/sequenceExtractor';
import { extractBiologicalData } from './extractors/dataExtractor';
import { resolveAllCrossReferences } from './resolvers/crossReferenceResolver';
import { validateSmallMolecule, validateMarkushStructure } from './validators/structureValidator';
import { validateAntibodySequence, validateNucleicAcid } from './validators/sequenceValidator';

/**
 * Parse patent document from buffer
 */
export async function parsePatentDocument(
  fileBuffer: Buffer,
  fileName: string,
  options: ExtractionOptions = {},
  onVerificationNeeded?: VerificationCallback
): Promise<PatentExtractionResult> {
  const {
    extract_structures = true,
    extract_sequences = true,
    extract_biological_data = true,
    resolve_cross_references = true,
    validate_data = true,
  } = options;

  // Step 1: Parse document format
  const pdfResult = await parsePDF(fileBuffer, fileName);

  // Step 2-5: Extract in parallel where possible
  const [claimsText, sequencesText, examplesText] = [
    pdfResult.structured_sections.claims || '',
    pdfResult.structured_sections.sequence_listing || '',
    pdfResult.structured_sections.examples || [],
  ];

  // Extract claims (sequential - needed for other extractions)
  const claimsAnalysis = extractClaims(claimsText);
  
  // Check for low-confidence claim extractions
  if (onVerificationNeeded) {
    for (const claim of claimsAnalysis.claims) {
      if (claim.confidence < 0.7) {
        onVerificationNeeded({
          id: `claim-${claim.claim_number}`,
          field: 'claim_text',
          label: `Claim ${claim.claim_number} Text`,
          extractedValue: claim.claim_text.substring(0, 200) + (claim.claim_text.length > 200 ? '...' : ''),
          confidence: claim.confidence,
          alternatives: [],
          context: `Extracted from claims section. Full text: ${claim.claim_text.substring(0, 500)}`,
          section: 'claims',
        });
      }
      
      // Check individual claim elements
      for (const element of claim.elements) {
        if (element.confidence < 0.6) {
          onVerificationNeeded({
            id: `claim-${claim.claim_number}-element-${element.element_number}`,
            field: `claim_${claim.claim_number}_element_${element.element_number}`,
            label: `Claim ${claim.claim_number}, Element ${element.element_number} (${element.type})`,
            extractedValue: element.content,
            confidence: element.confidence,
            alternatives: [],
            context: `Part of claim ${claim.claim_number}: ${claim.claim_text.substring(0, 300)}`,
            section: 'claims',
          });
        }
      }
    }
  }

  // Step 3-5: Extract structures, sequences, and biological data in parallel
  const extractionPromises: Promise<any>[] = [];
  
  // Structures extraction
  if (extract_structures) {
    extractionPromises.push(
      Promise.resolve(extractStructures(pdfResult.text, examplesText))
        .then((result) => ({ type: 'structures', data: result }))
    );
  } else {
    extractionPromises.push(Promise.resolve({ type: 'structures', data: { markush_structures: [], specific_compounds: [], extraction_confidence: 0 } }));
  }
  
  // Sequences extraction
  if (extract_sequences) {
    extractionPromises.push(
      Promise.resolve(extractSequences(pdfResult.text, sequencesText))
        .then((result) => ({ type: 'sequences', data: result }))
    );
  } else {
    extractionPromises.push(Promise.resolve({ type: 'sequences', data: { antibodies: [], nucleic_acids: [], extraction_confidence: 0 } }));
  }
  
  // Biological data extraction
  if (extract_biological_data) {
    extractionPromises.push(
      Promise.resolve(extractBiologicalData(pdfResult.text))
        .then((result) => ({ type: 'biological', data: result }))
    );
  } else {
    extractionPromises.push(Promise.resolve({ type: 'biological', data: { in_vitro: [], in_vivo: [], clinical: [], extraction_confidence: 0 } }));
  }
  
  // Execute extractions in parallel
  const extractionResults = await Promise.all(extractionPromises);
  
  let structures = { markush_structures: [], specific_compounds: [], extraction_confidence: 0 };
  let sequences = { antibodies: [], nucleic_acids: [], extraction_confidence: 0 };
  let biologicalData = { in_vitro: [], in_vivo: [], clinical: [], extraction_confidence: 0 };
  
  for (const result of extractionResults) {
    if (result.type === 'structures') {
      structures = result.data;
    } else if (result.type === 'sequences') {
      sequences = result.data;
    } else if (result.type === 'biological') {
      biologicalData = result.data;
    }
  }
  
  // Check for low-confidence extractions (after parallel extraction)
  if (onVerificationNeeded) {
    // Check structures
    if (extract_structures) {
      for (const compound of structures.specific_compounds) {
        if (compound.confidence < 0.7) {
          onVerificationNeeded({
            id: `compound-${compound.compound_id}`,
            field: 'compound_structure',
            label: `Compound ${compound.compound_id}${compound.name ? ` (${compound.name})` : ''}`,
            extractedValue: compound.smiles || compound.inchi || 'Structure extracted',
            confidence: compound.confidence,
            alternatives: [],
            context: `Source: ${compound.structure_source}, MW: ${compound.molecular_weight || 'N/A'}`,
            section: 'structures',
          });
        }
      }
      
      for (const markush of structures.markush_structures) {
        if (markush.confidence < 0.65) {
          const variableNames = Object.keys(markush.variables);
          onVerificationNeeded({
            id: `markush-${markush.formula_id}`,
            field: 'markush_structure',
            label: `Markush Structure ${markush.formula_id}`,
            extractedValue: markush.core_structure || `Formula with ${variableNames.length} variables`,
            confidence: markush.confidence,
            alternatives: [],
            context: `Genus scope: ${markush.genus_scope}, Variables: ${variableNames.join(', ')}`,
            section: 'structures',
          });
        }
      }
    }
    
    // Check sequences
    if (extract_sequences) {
      // Check antibodies
      for (const antibody of sequences.antibodies) {
        if (antibody.confidence < 0.75) {
          const hcdr3 = antibody.heavy_chain?.hcdr3?.sequence || 'N/A';
          onVerificationNeeded({
            id: `antibody-${antibody.name}`,
            field: 'antibody_sequence',
            label: `Antibody ${antibody.name} - HCDR3 Sequence`,
            extractedValue: hcdr3,
            confidence: antibody.confidence,
            alternatives: [],
            context: `Antibody name: ${antibody.name}, Format: ${antibody.format || 'unknown'}`,
            section: 'sequences',
          });
        }
        
        // Check individual CDR sequences
        const cdrs = [
          { name: 'HCDR1', seq: antibody.heavy_chain?.hcdr1 },
          { name: 'HCDR2', seq: antibody.heavy_chain?.hcdr2 },
          { name: 'HCDR3', seq: antibody.heavy_chain?.hcdr3 },
          { name: 'LCDR1', seq: antibody.light_chain?.lcdr1 },
          { name: 'LCDR2', seq: antibody.light_chain?.lcdr2 },
          { name: 'LCDR3', seq: antibody.light_chain?.lcdr3 },
        ];
        
        for (const cdr of cdrs) {
          if (cdr.seq && cdr.seq.confidence < 0.7) {
            onVerificationNeeded({
              id: `antibody-${antibody.name}-${cdr.name.toLowerCase()}`,
              field: `antibody_${antibody.name}_${cdr.name.toLowerCase()}`,
              label: `${antibody.name} - ${cdr.name} Sequence`,
              extractedValue: cdr.seq.sequence,
              confidence: cdr.seq.confidence,
              alternatives: [],
              context: `Antibody: ${antibody.name}, Numbering: ${cdr.seq.numbering_system}`,
              section: 'sequences',
            });
          }
        }
      }
      
      // Check nucleic acids
      for (const nucleicAcid of sequences.nucleic_acids) {
        if (nucleicAcid.confidence < 0.7) {
          onVerificationNeeded({
            id: `nucleic-acid-${nucleicAcid.seq_id_no}`,
            field: `nucleic_acid_seq_${nucleicAcid.seq_id_no}`,
            label: `SEQ ID NO: ${nucleicAcid.seq_id_no} (${nucleicAcid.type.toUpperCase()})`,
            extractedValue: nucleicAcid.sequence.substring(0, 50) + (nucleicAcid.sequence.length > 50 ? '...' : ''),
            confidence: nucleicAcid.confidence,
            alternatives: [],
            context: `Type: ${nucleicAcid.type}, Length: ${nucleicAcid.length}, Description: ${nucleicAcid.description || 'N/A'}`,
            section: 'sequences',
          });
        }
      }
    }
    
    // Check biological data
    if (extract_biological_data) {
      const allDataPoints = [
        ...biologicalData.in_vitro.map(d => ({ ...d, type: 'in_vitro' })),
        ...biologicalData.in_vivo.map(d => ({ ...d, type: 'in_vivo' })),
        ...biologicalData.clinical.map(d => ({ ...d, type: 'clinical' })),
      ];
      
      for (const dataPoint of allDataPoints) {
        if (dataPoint.confidence < 0.65) {
          const valueStr = dataPoint.value !== undefined 
            ? `${dataPoint.value} ${dataPoint.units || ''}`.trim()
            : dataPoint.result || 'Data extracted';
          
          onVerificationNeeded({
            id: `bio-${dataPoint.type}-${dataPoint.compound_id}-${Date.now()}`,
            field: `${dataPoint.type}_data`,
            label: `${dataPoint.type.toUpperCase()} Data - ${dataPoint.compound_id}${dataPoint.assay_type ? ` (${dataPoint.assay_type})` : ''}`,
            extractedValue: valueStr,
            confidence: dataPoint.confidence,
            alternatives: [],
            context: `Target: ${dataPoint.target || 'N/A'}, Cell line: ${dataPoint.cell_line || 'N/A'}, Conditions: ${dataPoint.conditions || 'N/A'}`,
            section: 'biological_data',
          });
        }
      }
    }
  }

  // Step 6: Resolve cross-references (if enabled)
  if (resolve_cross_references) {
    // Cross-references are resolved during extraction, but we can do additional resolution here
    // This would be used to resolve "the compound of claim 1" type references
  }

  // Step 7: Validate data (if enabled)
  const validationFlags: ValidationFlag[] = [];
  if (validate_data) {
    // Validate structures
    for (const compound of structures.specific_compounds) {
      const validation = validateSmallMolecule(compound);
      if (!validation.valid || validation.warnings.length > 0) {
        validationFlags.push({
          level: validation.valid ? 'warning' : 'error',
          message: `Compound ${compound.compound_id}: ${[...validation.errors, ...validation.warnings].join('; ')}`,
          section: 'molecular_data',
          requires_manual_review: !validation.valid,
        });
      }
    }

    for (const markush of structures.markush_structures) {
      const validation = validateMarkushStructure(markush);
      if (!validation.valid || validation.warnings.length > 0) {
        validationFlags.push({
          level: validation.valid ? 'warning' : 'error',
          message: `${markush.formula_id}: ${[...validation.errors, ...validation.warnings].join('; ')}`,
          section: 'molecular_data',
          requires_manual_review: !validation.valid,
        });
      }
    }

    // Validate sequences
    for (const antibody of sequences.antibodies) {
      const validation = validateAntibodySequence(antibody);
      if (!validation.valid || validation.warnings.length > 0) {
        validationFlags.push({
          level: validation.valid ? 'warning' : 'error',
          message: `Antibody ${antibody.name}: ${[...validation.errors, ...validation.warnings].join('; ')}`,
          section: 'molecular_data',
          requires_manual_review: !validation.valid,
        });
      }
    }

    for (const nucleicAcid of sequences.nucleic_acids) {
      const validation = validateNucleicAcid(nucleicAcid);
      if (!validation.valid || validation.warnings.length > 0) {
        validationFlags.push({
          level: validation.valid ? 'warning' : 'error',
          message: `SEQ ID NO: ${nucleicAcid.seq_id_no}: ${[...validation.errors, ...validation.warnings].join('; ')}`,
          section: 'molecular_data',
          requires_manual_review: !validation.valid,
        });
      }
    }
  }

  // Step 8: Build document info
  const documentInfo: DocumentInfo = {
    ...pdfResult.metadata,
    extraction_timestamp: new Date().toISOString(),
    extraction_confidence: calculateOverallConfidence(
      pdfResult,
      claimsAnalysis,
      structures,
      sequences,
      biologicalData
    ),
    document_format: 'pdf',
  };

  // Step 9: Generate FTO-relevant data
  const ftoRelevantData = generateFTORelevantData(claimsAnalysis, structures, sequences);

  // Step 10: Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(
    pdfResult,
    claimsAnalysis,
    structures,
    sequences,
    biologicalData
  );

  return {
    document_info: documentInfo,
    claims_analysis: claimsAnalysis,
    molecular_data: {
      modality: determineModality(structures, sequences),
      target: extractTarget(pdfResult.text),
      sequences: {
        antibodies: sequences.antibodies,
        small_molecules: structures.specific_compounds,
        nucleic_acids: sequences.nucleic_acids,
      },
      markush_structures: structures.markush_structures,
    },
    biological_data: biologicalData,
    fto_relevant_data: ftoRelevantData,
    validation_flags: validationFlags,
    overall_confidence: overallConfidence,
  };
}

/**
 * Calculate overall extraction confidence
 */
function calculateOverallConfidence(
  pdfResult: PDFParseResult,
  claims: any,
  structures: any,
  sequences: any,
  biologicalData: any
): number {
  const weights = {
    document: 0.2,
    claims: 0.3,
    structures: 0.2,
    sequences: 0.2,
    biological: 0.1,
  };

  const documentConf = pdfResult.extraction_quality === 'high' ? 0.9 : pdfResult.extraction_quality === 'medium' ? 0.7 : 0.5;
  const claimsConf = claims.total_claims > 0 ? 0.85 : 0.5;
  const structuresConf = structures.extraction_confidence;
  const sequencesConf = sequences.extraction_confidence;
  const biologicalConf = biologicalData.extraction_confidence;

  return (
    documentConf * weights.document +
    claimsConf * weights.claims +
    structuresConf * weights.structures +
    sequencesConf * weights.sequences +
    biologicalConf * weights.biological
  );
}

/**
 * Determine modality from extracted data
 */
function determineModality(structures: any, sequences: any): PatentExtractionResult['molecular_data']['modality'] {
  if (sequences.antibodies.length > 0) {
    if (sequences.antibodies.some((ab: any) => ab.format?.toLowerCase().includes('bispecific'))) {
      return 'bispecific_antibody';
    }
    return 'monoclonal_antibody';
  }
  if (sequences.nucleic_acids.length > 0) {
    const hasGeneTherapy = sequences.nucleic_acids.some((na: any) => na.type === 'vector');
    if (hasGeneTherapy) return 'gene_therapy';
    return 'rna_therapeutic';
  }
  if (structures.specific_compounds.length > 0 || structures.markush_structures.length > 0) {
    return 'small_molecule';
  }
  return 'other';
}

/**
 * Extract target from text
 */
function extractTarget(text: string): string | undefined {
  const targetMatch = text.match(/(?:target|targeting|binds to|binds)\s+([A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)/i);
  return targetMatch ? targetMatch[1].trim() : undefined;
}

/**
 * Generate FTO-relevant data
 */
function generateFTORelevantData(
  claims: any,
  structures: any,
  sequences: any
): FTORelevantData {
  const keyLimitations: string[] = [];

  // Extract limitations from claims
  for (const claim of claims.claims) {
    keyLimitations.push(...claim.key_limitations);
  }

  // Determine genus scope
  let genusScope: 'broad' | 'moderate' | 'narrow' = 'moderate';
  if (structures.markush_structures.length > 0) {
    const avgScope = structures.markush_structures.reduce((sum: number, m: any) => {
      return sum + (m.genus_scope === 'broad' ? 3 : m.genus_scope === 'moderate' ? 2 : 1);
    }, 0) / structures.markush_structures.length;
    if (avgScope > 2.5) genusScope = 'broad';
    else if (avgScope < 1.5) genusScope = 'narrow';
  }

  // Extract structural requirements
  const structuralRequirements: string[] = [];
  if (sequences.antibodies.length > 0) {
    structuralRequirements.push('Specific CDR sequences required');
  }
  if (structures.markush_structures.length > 0) {
    structuralRequirements.push('Markush structure limitations');
  }

  return {
    genus_scope: genusScope,
    key_limitations_for_fto: Array.from(new Set(keyLimitations)),
    structural_requirements: structuralRequirements,
  };
}
