/**
 * Professional PDF Generator for Investment Memos
 *
 * Creates institutional-grade PDFs suitable for IC presentations
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExtractedSection } from './types';

export interface PDFGeneratorOptions {
  companyName?: string;
  analysisId?: string;
  generatedBy?: string;
  generatedAt: string;
  totalWords: number;
  totalPages: number;
}

/**
 * Generate professional investment memo PDF
 */
export function generateInvestmentMemoPDF(
  sections: Record<string, ExtractedSection>,
  metadata: PDFGeneratorOptions
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  let currentY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);

  // Helper function to add page numbers and footer
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // COVER PAGE
  doc.setFillColor(15, 118, 110); // Teal color
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTMENT MEMO', pageWidth / 2, 80, { align: 'center' });

  if (metadata.companyName) {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'normal');
    doc.text(metadata.companyName, pageWidth / 2, 100, { align: 'center' });
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const date = new Date(metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Generated: ${date}`, pageWidth / 2, 120, { align: 'center' });

  if (metadata.generatedBy) {
    doc.text(`Prepared by: ${metadata.generatedBy}`, pageWidth / 2, 130, { align: 'center' });
  }

  // Disclaimer box at bottom
  doc.setFillColor(255, 255, 255, 0.1);
  doc.rect(margin, pageHeight - 60, contentWidth, 40, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const disclaimer = 'CONFIDENTIAL: This document contains proprietary information and is intended solely for the use of the designated recipient(s). Unauthorized distribution or disclosure is prohibited.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 10);
  doc.text(disclaimerLines, pageWidth / 2, pageHeight - 50, { align: 'center' });

  // TABLE OF CONTENTS
  doc.addPage();
  currentY = margin;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLE OF CONTENTS', margin, currentY);
  currentY += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const tocEntries = Object.values(sections).map((section, index) => ({
    number: index + 1,
    title: section.title,
    page: 3 + index // Approximate - will be corrected in production version
  }));

  tocEntries.forEach((entry) => {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = margin;
    }

    doc.text(`${entry.number}.`, margin, currentY);
    doc.text(entry.title, margin + 10, currentY);
    doc.text(entry.page.toString(), pageWidth - margin, currentY, { align: 'right' });
    currentY += 7;
  });

  addFooter(2, metadata.totalPages + 2); // +2 for cover and TOC

  // SECTION PAGES
  let sectionNumber = 1;

  Object.values(sections).forEach((section) => {
    // New page for each major section
    doc.addPage();
    currentY = margin;

    // Section header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, contentWidth, 12, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`${sectionNumber}. ${section.title.toUpperCase()}`, margin + 5, currentY + 8);

    currentY += 18;

    // Section content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Parse and render markdown content
    const lines = parseMarkdownToPDFLines(doc, section.content, contentWidth);

    lines.forEach((line) => {
      if (currentY > pageHeight - 30) {
        addFooter(doc.getNumberOfPages(), metadata.totalPages + 2);
        doc.addPage();
        currentY = margin;
      }

      // Apply formatting based on line type
      if (line.type === 'header') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        currentY += 5; // Extra space before headers
      } else if (line.type === 'subheader') {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        currentY += 3;
      } else if (line.type === 'bullet') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('•', margin + 2, currentY);
        const bulletLines = doc.splitTextToSize(line.text, contentWidth - 10);
        bulletLines.forEach((bLine: string, idx: number) => {
          doc.text(bLine, margin + 8, currentY);
          if (idx < bulletLines.length - 1) {
            currentY += 5;
          }
        });
        currentY += 5;
        return; // Skip the normal text rendering
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      }

      const textLines = doc.splitTextToSize(line.text, contentWidth);
      textLines.forEach((tLine: string) => {
        if (currentY > pageHeight - 30) {
          addFooter(doc.getNumberOfPages(), metadata.totalPages + 2);
          doc.addPage();
          currentY = margin;
        }
        doc.text(tLine, margin, currentY);
        currentY += 5;
      });

      currentY += 2; // Small gap between paragraphs
    });

    addFooter(doc.getNumberOfPages(), metadata.totalPages + 2);
    sectionNumber++;
  });

  // APPENDIX PAGE (Metadata)
  doc.addPage();
  currentY = margin;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 118, 110);
  doc.text('APPENDIX: DOCUMENT METADATA', margin, currentY);
  currentY += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const metadataTable = [
    ['Analysis ID', metadata.analysisId || 'N/A'],
    ['Company Name', metadata.companyName || 'N/A'],
    ['Generated Date', date],
    ['Generated By', metadata.generatedBy || 'AI Agent System'],
    ['Total Word Count', metadata.totalWords.toLocaleString()],
    ['Number of Sections', Object.keys(sections).length.toString()],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Field', 'Value']],
    body: metadataTable,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] },
    margin: { left: margin, right: margin }
  });

  addFooter(doc.getNumberOfPages(), metadata.totalPages + 2);

  return doc.output('blob');
}

/**
 * Parse markdown content into PDF-renderable lines with formatting
 */
function parseMarkdownToPDFLines(
  doc: jsPDF,
  markdown: string,
  maxWidth: number
): Array<{ type: string; text: string }> {
  const lines: Array<{ type: string; text: string }> = [];
  const rawLines = markdown.split('\n');

  rawLines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Skip empty lines
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      lines.push({ type: 'subheader', text: trimmed.replace('### ', '') });
    } else if (trimmed.startsWith('## ')) {
      lines.push({ type: 'header', text: trimmed.replace('## ', '') });
    } else if (trimmed.startsWith('# ')) {
      lines.push({ type: 'header', text: trimmed.replace('# ', '') });
    }
    // Bullets
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      lines.push({ type: 'bullet', text: trimmed.substring(2) });
    }
    // Bold text (keep markers for now, jsPDF doesn't support inline formatting easily)
    else if (trimmed.startsWith('**')) {
      lines.push({ type: 'bold', text: trimmed.replace(/\*\*/g, '') });
    }
    // Regular text
    else {
      lines.push({ type: 'text', text: trimmed });
    }
  });

  return lines;
}

/**
 * Generate markdown export (alternative to PDF)
 */
export function generateInvestmentMemoMarkdown(
  sections: Record<string, ExtractedSection>,
  metadata: PDFGeneratorOptions
): string {
  const date = new Date(metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let markdown = `# INVESTMENT MEMO\n\n`;

  if (metadata.companyName) {
    markdown += `## ${metadata.companyName}\n\n`;
  }

  markdown += `**Generated:** ${date}\n`;
  if (metadata.generatedBy) {
    markdown += `**Prepared by:** ${metadata.generatedBy}\n`;
  }
  markdown += `**Word Count:** ${metadata.totalWords.toLocaleString()}\n\n`;

  markdown += `---\n\n`;
  markdown += `*CONFIDENTIAL: This document contains proprietary information and is intended solely for the use of the designated recipient(s).*\n\n`;
  markdown += `---\n\n`;

  // Table of Contents
  markdown += `## TABLE OF CONTENTS\n\n`;
  Object.values(sections).forEach((section, index) => {
    markdown += `${index + 1}. ${section.title}\n`;
  });
  markdown += `\n---\n\n`;

  // Sections
  Object.values(sections).forEach((section, index) => {
    markdown += `## ${index + 1}. ${section.title.toUpperCase()}\n\n`;
    markdown += section.content;
    markdown += `\n\n---\n\n`;
  });

  // Metadata
  markdown += `## APPENDIX: DOCUMENT METADATA\n\n`;
  markdown += `| Field | Value |\n`;
  markdown += `|-------|-------|\n`;
  markdown += `| Analysis ID | ${metadata.analysisId || 'N/A'} |\n`;
  markdown += `| Company Name | ${metadata.companyName || 'N/A'} |\n`;
  markdown += `| Generated Date | ${date} |\n`;
  markdown += `| Generated By | ${metadata.generatedBy || 'AI Agent System'} |\n`;
  markdown += `| Total Word Count | ${metadata.totalWords.toLocaleString()} |\n`;
  markdown += `| Number of Sections | ${Object.keys(sections).length} |\n`;

  return markdown;
}
