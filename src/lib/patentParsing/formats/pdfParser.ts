/**
 * PDF Parser for Patent Documents
 * Handles text extraction, structure recognition, and figure extraction from PDFs
 */

import type { DocumentInfo, FigureMetadata } from '../types';

// Try to import pdf-parse if available, otherwise fall back to basic parsing
let pdfParse: any = null;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  // pdf-parse not available, will use basic parsing
  console.warn('pdf-parse not available, using basic PDF parsing');
}

export interface PDFParseResult {
  text: string;
  structured_sections: {
    abstract?: string;
    background?: string;
    summary?: string;
    detailed_description?: string;
    examples?: string[];
    claims?: string;
    sequence_listing?: string;
  };
  figures: FigureMetadata[];
  metadata: Partial<DocumentInfo>;
  extraction_quality: 'high' | 'medium' | 'low';
}

/**
 * Parse PDF document using multiple extraction strategies
 */
export async function parsePDF(
  fileBuffer: Buffer,
  fileName: string
): Promise<PDFParseResult> {
  // Strategy 1: Try pdf-parse library (better text extraction)
  if (pdfParse) {
    try {
      const pdfData = await pdfParse(fileBuffer);
      const structuredResult = await parseStructuredPDFFromText(pdfData.text, fileName);
      return structuredResult;
    } catch (error) {
      console.warn('pdf-parse failed, falling back to basic parsing:', error);
    }
  }

  // Strategy 2: Try structured PDF parsing (if text is embedded)
  const structuredResult = await parseStructuredPDF(fileBuffer);
  
  // Strategy 3: If structured parsing fails, try OCR-based extraction
  if (structuredResult.extraction_quality === 'low') {
    // Note: OCR would require additional libraries (Tesseract, etc.)
    // For now, we'll use the structured approach
    console.warn('PDF may require OCR - structured extraction quality is low');
  }

  return structuredResult;
}

/**
 * Parse PDF from extracted text (from pdf-parse)
 */
async function parseStructuredPDFFromText(
  text: string,
  fileName: string
): Promise<PDFParseResult> {
  // Parse document structure
  const sections = parseDocumentSections(text);
  
  // Extract figures metadata
  const figures = extractFigureMetadata(text);
  
  // Extract patent metadata
  const metadata = extractPatentMetadata(text);
  
  // Assess extraction quality
  const quality = assessExtractionQuality(text, sections);

  return {
    text,
    structured_sections: sections,
    figures,
    metadata,
    extraction_quality: quality,
  };
}

/**
 * Parse PDF with embedded text (most modern patents)
 */
async function parseStructuredPDF(buffer: Buffer): Promise<PDFParseResult> {
  const pdfString = buffer.toString('latin1');
  
  // Extract text blocks between BT (Begin Text) and ET (End Text) markers
  const textBlocks: string[] = [];
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(pdfString)) !== null) {
    const textBlock = match[1];
    const strings = textBlock.match(/\(([^)]+)\)/g);
    
    if (strings) {
      const cleanedStrings = strings
        .map(s => s.slice(1, -1))
        .filter(s => {
          const printableChars = s.split('').filter(c => {
            const code = c.charCodeAt(0);
            return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
          }).length;
          return printableChars / s.length > 0.7;
        })
        .map(s =>
          s.replace(/\\n/g, '\n')
           .replace(/\\r/g, '\r')
           .replace(/\\t/g, '\t')
           .replace(/\\/g, '')
        );
      
      textBlocks.push(...cleanedStrings);
    }
  }

  const fullText = textBlocks.join(' ').trim();
  
  // Parse document structure
  const sections = parseDocumentSections(fullText);
  
  // Extract figures metadata
  const figures = extractFigureMetadata(fullText);
  
  // Extract patent metadata
  const metadata = extractPatentMetadata(fullText);
  
  // Assess extraction quality
  const quality = assessExtractionQuality(fullText, sections);

  return {
    text: fullText,
    structured_sections: sections,
    figures,
    metadata,
    extraction_quality: quality,
  };
}

/**
 * Parse document into structured sections
 */
function parseDocumentSections(text: string): PDFParseResult['structured_sections'] {
  const sections: PDFParseResult['structured_sections'] = {};
  
  // Abstract
  const abstractMatch = text.match(/(?:ABSTRACT|Abstract)\s*[:\-]?\s*([\s\S]{100,2000})/i);
  if (abstractMatch) {
    sections.abstract = abstractMatch[1].trim();
  }

  // Background/Field
  const backgroundMatch = text.match(/(?:BACKGROUND|FIELD OF THE INVENTION|Field of the Invention)\s*[:\-]?\s*([\s\S]{200,5000})/i);
  if (backgroundMatch) {
    sections.background = backgroundMatch[1].trim();
  }

  // Summary
  const summaryMatch = text.match(/(?:SUMMARY|SUMMARY OF THE INVENTION|Summary of the Invention)\s*[:\-]?\s*([\s\S]{200,5000})/i);
  if (summaryMatch) {
    sections.summary = summaryMatch[1].trim();
  }

  // Detailed Description
  const detailedMatch = text.match(/(?:DETAILED DESCRIPTION|Detailed Description of the Invention)\s*[:\-]?\s*([\s\S]{500,50000})/i);
  if (detailedMatch) {
    sections.detailed_description = detailedMatch[1].trim();
  }

  // Examples
  const exampleRegex = /(?:Example\s+\d+|EXAMPLE\s+\d+)[:\-]?\s*([\s\S]{100,10000})/gi;
  const examples: string[] = [];
  let exampleMatch;
  while ((exampleMatch = exampleRegex.exec(text)) !== null) {
    examples.push(exampleMatch[1].trim());
  }
  if (examples.length > 0) {
    sections.examples = examples;
  }

  // Claims
  const claimsMatch = text.match(/(?:CLAIMS|What is claimed is:)\s*([\s\S]{500,50000})/i);
  if (claimsMatch) {
    sections.claims = claimsMatch[1].trim();
  }

  // Sequence Listing
  const sequenceMatch = text.match(/(?:SEQUENCE LISTING|Sequence Listing)\s*([\s\S]{500,100000})/i);
  if (sequenceMatch) {
    sections.sequence_listing = sequenceMatch[1].trim();
  }

  return sections;
}

/**
 * Extract figure metadata from text
 */
function extractFigureMetadata(text: string): FigureMetadata[] {
  const figures: FigureMetadata[] = [];
  
  // Match figure references: "Figure 1", "FIG. 1", "Fig. 1"
  const figureRegex = /(?:Figure|FIG\.?|Fig\.?)\s+(\d+[A-Z]?)[:\-]?\s*([^\n]{0,500})/gi;
  let match;
  
  while ((match = figureRegex.exec(text)) !== null) {
    const figureNumber = match[1];
    const caption = match[2].trim() || undefined;
    
    // Determine figure type from caption
    let figureType: FigureMetadata['figure_type'] = 'other';
    const captionLower = caption?.toLowerCase() || '';
    if (captionLower.includes('structure') || captionLower.includes('chemical')) {
      figureType = 'structure';
    } else if (captionLower.includes('scheme')) {
      figureType = 'scheme';
    } else if (captionLower.includes('graph') || captionLower.includes('plot')) {
      figureType = 'graph';
    } else if (captionLower.includes('table')) {
      figureType = 'table';
    } else if (captionLower.includes('sequence')) {
      figureType = 'sequence';
    }

    figures.push({
      figure_number: figureNumber,
      caption,
      figure_type: figureType,
      confidence: caption ? 0.8 : 0.5,
    });
  }

  return figures;
}

/**
 * Extract patent metadata from text
 */
function extractPatentMetadata(text: string, fileName?: string): Partial<DocumentInfo> {
  const metadata: Partial<DocumentInfo> = {};

  // Patent number (US format: US12345678B2, US 12,345,678 B2)
  const patentMatch = text.match(/US\s*(\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3})\s*([A-Z]\d?)/i) ||
                      text.match(/Patent\s+No\.?\s*:?\s*US\s*(\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3}[,\s]?\d{1,3})\s*([A-Z]\d?)/i);
  if (patentMatch) {
    metadata.patent_number = `US${patentMatch[1].replace(/[,\s]/g, '')}${patentMatch[2]}`;
  }

  // Application number
  const appMatch = text.match(/Application\s+No\.?\s*:?\s*(US\d{2}\/\d{3}[,\s]?\d{3})/i);
  if (appMatch) {
    metadata.application_number = appMatch[1].replace(/[,\s]/g, '');
  }

  // Publication date
  const pubDateMatch = text.match(/(?:Published|Publication Date|Date of Patent):\s*([A-Z][a-z]+\s+\d{1,2}[,\s]+\d{4})/i);
  if (pubDateMatch) {
    metadata.publication_date = pubDateMatch[1];
  }

  // Priority date
  const priorityMatch = text.match(/(?:Priority|Priority Date):\s*([A-Z][a-z]+\s+\d{1,2}[,\s]+\d{4})/i);
  if (priorityMatch) {
    metadata.priority_date = priorityMatch[1];
  }

  // Assignee
  const assigneeMatch = text.match(/(?:Assignee|Assigned to):\s*([^\n]{5,100})/i);
  if (assigneeMatch) {
    metadata.assignee = assigneeMatch[1].trim();
  }

  // Title
  const titleMatch = text.match(/(?:Title|TITLE):\s*([^\n]{10,200})/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Inventors
  const inventorRegex = /(?:Inventor|Inventors?):\s*([^\n]{5,200})/gi;
  const inventors: string[] = [];
  let inventorMatch;
  while ((inventorMatch = inventorRegex.exec(text)) !== null) {
    const inventorList = inventorMatch[1].split(/[,;]/).map(i => i.trim());
    inventors.push(...inventorList);
  }
  if (inventors.length > 0) {
    metadata.inventors = inventors;
  }

  return metadata;
}

/**
 * Assess extraction quality
 */
function assessExtractionQuality(
  text: string,
  sections: PDFParseResult['structured_sections']
): 'high' | 'medium' | 'low' {
  // Check text length
  if (text.length < 1000) return 'low';
  
  // Check if key sections were found
  const sectionsFound = Object.keys(sections).length;
  if (sectionsFound >= 5) return 'high';
  if (sectionsFound >= 3) return 'medium';
  
  return 'low';
}
