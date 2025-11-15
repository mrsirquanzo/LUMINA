import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Message interface for chat exports
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
}

// PDF styling constants matching professional report standards
const PDF_STYLES = {
  // Typography
  fonts: {
    primary: 'helvetica',
    fallback: 'courier'
  },
  sizes: {
    h1: 24,
    h2: 18,
    h3: 14,
    body: 11,
    small: 9,
    footer: 9
  },
  lineHeights: {
    h1: 1.4,
    h2: 1.4,
    h3: 1.4,
    body: 1.6,
    tight: 1.2
  },
  spacing: {
    h1Before: 32,
    h1After: 16,
    h2Before: 24,
    h2After: 12,
    h3Before: 16,
    h3After: 8,
    sectionGap: 24,
    paragraphGap: 8,
    listItemGap: 8,
    bulletIndent: 15 // 0.25 inches at 72 DPI
  },
  // Layout
  margins: {
    top: 54, // 0.75"
    right: 54,
    bottom: 54,
    left: 54
  },
  // Colors
  colors: {
    text: { r: 33, g: 33, b: 33 }, // #212121
    textLight: { r: 108, g: 117, b: 125 }, // #6c757d
    userBg: { r: 240, g: 247, b: 255 }, // #f0f7ff
    assistantBg: { r: 255, g: 255, b: 255 }, // white
    sectionBg: { r: 248, g: 249, b: 250 }, // #f8f9fa
    tableBorder: { r: 222, g: 226, b: 230 }, // #dee2e6
    tableAltRow: { r: 248, g: 249, b: 250 }, // #f8f9fa
    headerBorder: { r: 233, g: 236, b: 239 } // #e9ecef
  }
};

// Symbol mapping for proper UTF-8 rendering
const SYMBOL_MAP: { [key: string]: string } = {
  '✓': '\u2713',
  '✗': '\u2717',
  '→': '\u2192',
  '⚠': '\u26A0',
  '★': '\u2605',
  '•': '\u2022',
  '–': '\u2013',
  '—': '\u2014',
  '\u201C': '\u201C', // "
  '\u201D': '\u201D', // "
  '\u2018': '\u2018', // '
  '\u2019': '\u2019'  // '
};

// Ensure proper UTF-8 encoding for special characters
function encodeUTF8(text: string): string {
  let encoded = text;
  for (const [symbol, unicode] of Object.entries(SYMBOL_MAP)) {
    encoded = encoded.replace(new RegExp(symbol, 'g'), unicode);
  }
  return encoded;
}

// Parse markdown content into structured elements
interface ContentElement {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'table' | 'code';
  content: string | string[] | { headers: string[], rows: string[][] };
  level?: number;
}

function parseMarkdown(text: string): ContentElement[] {
  const lines = text.split('\n');
  const elements: ContentElement[] = [];
  let currentList: string[] = [];
  let currentTable: { headers: string[], rows: string[][] } | null = null;
  let inCodeBlock = false;
  let codeContent: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push({ type: 'list', content: currentList });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable && currentTable.rows.length > 0) {
      elements.push({ type: 'table', content: currentTable });
      currentTable = null;
    }
  };

  const flushCode = () => {
    if (codeContent.length > 0) {
      elements.push({ type: 'code', content: codeContent.join('\n') });
      codeContent = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Handle headers
    if (trimmed.startsWith('# ')) {
      flushList();
      flushTable();
      elements.push({ type: 'h1', content: trimmed.substring(2) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      elements.push({ type: 'h2', content: trimmed.substring(3) });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      elements.push({ type: 'h3', content: trimmed.substring(4) });
      continue;
    }

    // Handle tables
    if (trimmed.includes('|')) {
      flushList();

      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);

      // Skip separator rows (like |---|---|)
      if (trimmed.match(/^\|[\s-:|]+\|$/)) {
        continue;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Handle lists
    if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
      const content = trimmed.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '');
      currentList.push(content);
      continue;
    } else {
      flushList();
    }

    // Handle paragraphs
    if (trimmed.length > 0) {
      elements.push({ type: 'paragraph', content: trimmed });
    }
  }

  // Flush any remaining content
  flushList();
  flushTable();
  flushCode();

  return elements;
}

class PDFGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private pageNumber: number = 1;
  private documentTitle: string = '';

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter'
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - PDF_STYLES.margins.left - PDF_STYLES.margins.right;
    this.currentY = PDF_STYLES.margins.top;
  }

  // Check if we need a page break
  private checkPageBreak(requiredSpace: number): void {
    const availableSpace = this.pageHeight - PDF_STYLES.margins.bottom - this.currentY;

    if (availableSpace < requiredSpace) {
      this.addPage();
    }
  }

  // Add a new page
  private addPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = PDF_STYLES.margins.top;
    this.addPageFooter();
  }

  // Add minimal page footer with page number
  private addPageFooter(): void {
    const footerY = this.pageHeight - PDF_STYLES.margins.bottom / 2;

    this.doc.setFontSize(PDF_STYLES.sizes.footer);
    this.doc.setTextColor(
      PDF_STYLES.colors.textLight.r,
      PDF_STYLES.colors.textLight.g,
      PDF_STYLES.colors.textLight.b
    );

    const pageText = `${this.pageNumber}`;
    const textWidth = this.doc.getTextWidth(pageText);
    const centerX = this.pageWidth / 2 - textWidth / 2;

    this.doc.text(pageText, centerX, footerY);

    // Reset to default color
    this.doc.setTextColor(
      PDF_STYLES.colors.text.r,
      PDF_STYLES.colors.text.g,
      PDF_STYLES.colors.text.b
    );
  }

  // Add document header (only on first page)
  private addDocumentHeader(title: string, subtitle: string): void {
    this.documentTitle = title;

    // Title
    this.doc.setFontSize(PDF_STYLES.sizes.h1);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'bold');
    this.doc.text(title, PDF_STYLES.margins.left, this.currentY);
    this.currentY += PDF_STYLES.sizes.h1 * 1.2;

    // Subtitle with date
    this.doc.setFontSize(PDF_STYLES.sizes.small);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');
    this.doc.setTextColor(
      PDF_STYLES.colors.textLight.r,
      PDF_STYLES.colors.textLight.g,
      PDF_STYLES.colors.textLight.b
    );
    this.doc.text(subtitle, PDF_STYLES.margins.left, this.currentY);

    // Reset color
    this.doc.setTextColor(
      PDF_STYLES.colors.text.r,
      PDF_STYLES.colors.text.g,
      PDF_STYLES.colors.text.b
    );

    // Border under header
    this.currentY += PDF_STYLES.sizes.small * 1.2 + 8;
    this.doc.setDrawColor(
      PDF_STYLES.colors.headerBorder.r,
      PDF_STYLES.colors.headerBorder.g,
      PDF_STYLES.colors.headerBorder.b
    );
    this.doc.setLineWidth(2);
    this.doc.line(
      PDF_STYLES.margins.left,
      this.currentY,
      this.pageWidth - PDF_STYLES.margins.right,
      this.currentY
    );

    this.currentY += PDF_STYLES.spacing.h1After;
  }

  // Add heading
  private addHeading(text: string, level: 1 | 2 | 3): void {
    const sizes = {
      1: PDF_STYLES.sizes.h1,
      2: PDF_STYLES.sizes.h2,
      3: PDF_STYLES.sizes.h3
    };
    const spacingBefore = {
      1: PDF_STYLES.spacing.h1Before,
      2: PDF_STYLES.spacing.h2Before,
      3: PDF_STYLES.spacing.h3Before
    };
    const spacingAfter = {
      1: PDF_STYLES.spacing.h1After,
      2: PDF_STYLES.spacing.h2After,
      3: PDF_STYLES.spacing.h3After
    };

    const size = sizes[level];
    const minSpaceNeeded = size * 1.2 + spacingAfter[level] + PDF_STYLES.sizes.body * 2;

    // Ensure heading stays with at least 2 lines of content
    this.checkPageBreak(minSpaceNeeded);

    this.currentY += spacingBefore[level];

    this.doc.setFontSize(size);
    this.doc.setFont(PDF_STYLES.fonts.primary, level === 3 ? 'bold' : 'bold');

    const encodedText = encodeUTF8(text);
    this.doc.text(encodedText, PDF_STYLES.margins.left, this.currentY);

    this.currentY += size * 1.2 + spacingAfter[level];

    // Reset to body font
    this.doc.setFontSize(PDF_STYLES.sizes.body);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');
  }

  // Add paragraph with proper word wrapping
  private addParagraph(text: string, backgroundColor?: { r: number, g: number, b: number }): void {
    this.doc.setFontSize(PDF_STYLES.sizes.body);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');

    const encodedText = encodeUTF8(text);
    const lines = this.doc.splitTextToSize(encodedText, this.contentWidth - 20);
    const lineHeight = PDF_STYLES.sizes.body * PDF_STYLES.lineHeights.body;
    const totalHeight = lines.length * lineHeight + 16; // 8pt padding top & bottom

    this.checkPageBreak(totalHeight);

    // Draw background if specified
    if (backgroundColor) {
      this.doc.setFillColor(backgroundColor.r, backgroundColor.g, backgroundColor.b);
      this.doc.rect(
        PDF_STYLES.margins.left,
        this.currentY - 8,
        this.contentWidth,
        totalHeight,
        'F'
      );
    }

    const startY = this.currentY + 8;
    this.doc.text(lines, PDF_STYLES.margins.left + 10, startY);
    this.currentY = startY + lines.length * lineHeight + 8;
  }

  // Add bullet list
  private addList(items: string[]): void {
    this.doc.setFontSize(PDF_STYLES.sizes.body);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');

    const lineHeight = PDF_STYLES.sizes.body * PDF_STYLES.lineHeights.body;
    const bulletX = PDF_STYLES.margins.left;
    const textX = bulletX + PDF_STYLES.spacing.bulletIndent;
    const textWidth = this.contentWidth - PDF_STYLES.spacing.bulletIndent;

    for (const item of items) {
      const encodedText = encodeUTF8(item);
      const lines = this.doc.splitTextToSize(encodedText, textWidth);
      const itemHeight = lines.length * lineHeight + PDF_STYLES.spacing.listItemGap;

      this.checkPageBreak(itemHeight);

      // Draw bullet
      this.doc.text('\u2022', bulletX, this.currentY);

      // Draw text
      this.doc.text(lines, textX, this.currentY);

      this.currentY += lines.length * lineHeight + PDF_STYLES.spacing.listItemGap;
    }
  }

  // Add table with proper formatting
  private addTable(headers: string[], rows: string[][]): void {
    const tableData = rows.map(row => row.map(cell => encodeUTF8(cell)));
    const tableHeaders = headers.map(h => encodeUTF8(h));

    // Estimate table height
    const rowHeight = 20;
    const estimatedHeight = (rows.length + 2) * rowHeight;

    // If table doesn't fit, start on new page
    if (this.pageHeight - this.currentY - PDF_STYLES.margins.bottom < estimatedHeight) {
      this.addPage();
    }

    autoTable(this.doc, {
      head: [tableHeaders],
      body: tableData,
      startY: this.currentY,
      margin: { left: PDF_STYLES.margins.left, right: PDF_STYLES.margins.right },
      theme: 'grid',
      styles: {
        fontSize: PDF_STYLES.sizes.body,
        cellPadding: 6,
        font: PDF_STYLES.fonts.primary,
        lineColor: [
          PDF_STYLES.colors.tableBorder.r,
          PDF_STYLES.colors.tableBorder.g,
          PDF_STYLES.colors.tableBorder.b
        ],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [
          PDF_STYLES.colors.sectionBg.r,
          PDF_STYLES.colors.sectionBg.g,
          PDF_STYLES.colors.sectionBg.b
        ],
        textColor: [
          PDF_STYLES.colors.text.r,
          PDF_STYLES.colors.text.g,
          PDF_STYLES.colors.text.b
        ],
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [
          PDF_STYLES.colors.tableAltRow.r,
          PDF_STYLES.colors.tableAltRow.g,
          PDF_STYLES.colors.tableAltRow.b
        ]
      },
      columnStyles: {
        // Auto-fit columns
        0: { cellWidth: 'auto' }
      },
      didDrawPage: (data) => {
        // Update current Y position after table
        this.currentY = data.cursor ? data.cursor.y : this.currentY;
      }
    });

    // Add spacing after table
    this.currentY += PDF_STYLES.spacing.paragraphGap;
  }

  // Add code block
  private addCodeBlock(code: string): void {
    this.doc.setFont(PDF_STYLES.fonts.fallback, 'normal');
    this.doc.setFontSize(PDF_STYLES.sizes.body - 1);

    const encodedCode = encodeUTF8(code);
    const lines = encodedCode.split('\n');
    const lineHeight = (PDF_STYLES.sizes.body - 1) * PDF_STYLES.lineHeights.tight;
    const totalHeight = lines.length * lineHeight + 16;

    this.checkPageBreak(totalHeight);

    // Background
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(
      PDF_STYLES.margins.left,
      this.currentY - 8,
      this.contentWidth,
      totalHeight,
      'F'
    );

    // Code text
    const startY = this.currentY + 8;
    for (let i = 0; i < lines.length; i++) {
      const maxWidth = this.contentWidth - 20;
      const wrappedLines = this.doc.splitTextToSize(lines[i] || ' ', maxWidth);
      this.doc.text(wrappedLines, PDF_STYLES.margins.left + 10, startY + i * lineHeight);
    }

    this.currentY = startY + lines.length * lineHeight + 8;

    // Reset font
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');
    this.doc.setFontSize(PDF_STYLES.sizes.body);
  }

  // Add message (for chat exports)
  private addMessage(message: ChatMessage): void {
    const isUser = message.role === 'user';
    const backgroundColor = isUser ? PDF_STYLES.colors.userBg : PDF_STYLES.colors.assistantBg;

    // Role header
    this.doc.setFontSize(PDF_STYLES.sizes.small);
    this.doc.setFont(PDF_STYLES.fonts.primary, 'bold');

    const roleText = isUser ? 'User' : 'Assistant';
    const timestamp = message.timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    this.checkPageBreak(60); // Minimum space for message header

    this.doc.text(roleText, PDF_STYLES.margins.left, this.currentY);

    // Timestamp
    this.doc.setFont(PDF_STYLES.fonts.primary, 'normal');
    this.doc.setTextColor(
      PDF_STYLES.colors.textLight.r,
      PDF_STYLES.colors.textLight.g,
      PDF_STYLES.colors.textLight.b
    );
    const roleWidth = this.doc.getTextWidth(roleText);
    this.doc.text(` • ${timestamp}`, PDF_STYLES.margins.left + roleWidth, this.currentY);

    // Reset color
    this.doc.setTextColor(
      PDF_STYLES.colors.text.r,
      PDF_STYLES.colors.text.g,
      PDF_STYLES.colors.text.b
    );

    this.currentY += PDF_STYLES.sizes.small * 1.4 + 8;

    // Parse and render message content
    const elements = parseMarkdown(message.content);

    for (const element of elements) {
      switch (element.type) {
        case 'h1':
          this.addHeading(element.content as string, 1);
          break;
        case 'h2':
          this.addHeading(element.content as string, 2);
          break;
        case 'h3':
          this.addHeading(element.content as string, 3);
          break;
        case 'paragraph':
          this.addParagraph(element.content as string, isUser ? backgroundColor : undefined);
          this.currentY += PDF_STYLES.spacing.paragraphGap;
          break;
        case 'list':
          this.addList(element.content as string[]);
          this.currentY += PDF_STYLES.spacing.paragraphGap;
          break;
        case 'table':
          const tableContent = element.content as { headers: string[], rows: string[][] };
          this.addTable(tableContent.headers, tableContent.rows);
          break;
        case 'code':
          this.addCodeBlock(element.content as string);
          this.currentY += PDF_STYLES.spacing.paragraphGap;
          break;
      }
    }

    // Cost information for assistant messages
    if (!isUser && message.cost && message.cost > 0) {
      this.doc.setFontSize(PDF_STYLES.sizes.small);
      this.doc.setTextColor(
        PDF_STYLES.colors.textLight.r,
        PDF_STYLES.colors.textLight.g,
        PDF_STYLES.colors.textLight.b
      );
      this.doc.text(
        `Cost: $${message.cost.toFixed(2)}`,
        PDF_STYLES.margins.left,
        this.currentY
      );
      this.currentY += PDF_STYLES.sizes.small * 1.4;

      // Reset color
      this.doc.setTextColor(
        PDF_STYLES.colors.text.r,
        PDF_STYLES.colors.text.g,
        PDF_STYLES.colors.text.b
      );
    }

    // Spacing between messages
    this.currentY += PDF_STYLES.spacing.sectionGap;
  }

  // Generate chat export PDF
  public generateChatPDF(messages: ChatMessage[], agentName: string): void {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    this.addDocumentHeader(
      agentName,
      `Conversation Export • ${date}`
    );

    // Add page footer for first page
    this.addPageFooter();

    // Add all messages
    for (const message of messages) {
      this.addMessage(message);
    }

    // Set PDF metadata
    this.doc.setProperties({
      title: `${agentName} - Conversation Export`,
      subject: `AI Agent Conversation`,
      author: agentName,
      creator: 'Multi-Agent Analysis System'
    });
  }

  // Save the PDF
  public save(filename: string): void {
    this.doc.save(filename);
  }

  // Get the PDF as blob
  public getBlob(): Blob {
    return this.doc.output('blob');
  }
}

// Main export function
export function exportToPDF(messages: ChatMessage[], agentName: string): void {
  const generator = new PDFGenerator();
  generator.generateChatPDF(messages, agentName);

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
  const filename = `${sanitizedName}_chat_${timestamp}.pdf`;

  generator.save(filename);
}

// Export to CSV
export function exportToCSV(messages: ChatMessage[], agentName: string): void {
  const headers = ['Timestamp', 'Role', 'Content', 'Cost'];
  const rows = messages.map(msg => [
    msg.timestamp.toISOString(),
    msg.role,
    msg.content.replace(/"/g, '""'), // Escape quotes
    msg.cost?.toFixed(2) || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
  link.download = `${sanitizedName}_chat_${timestamp}.csv`;
  link.href = url;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export to text/markdown
export function exportToText(messages: ChatMessage[], agentName: string): void {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const content = [
    `# ${agentName}`,
    `Conversation Export • ${date}`,
    '',
    '---',
    '',
    ...messages.flatMap(msg => {
      const timestamp = msg.timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const lines = [
        `## ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}`,
        `*${timestamp}*`,
        '',
        msg.content,
        ''
      ];

      if (msg.cost && msg.cost > 0) {
        lines.push(`*Cost: $${msg.cost.toFixed(2)}*`, '');
      }

      lines.push('---', '');
      return lines;
    })
  ].join('\n');

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
  link.download = `${sanitizedName}_chat_${timestamp}.md`;
  link.href = url;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
