// Chat Export Utilities
// Supports PDF, CSV, and Text export formats

import jsPDF from 'jspdf';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cost?: number;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'text';
  agentName: string;
  includeMeta?: boolean;
  includeTimestamps?: boolean;
}

/**
 * Export chat conversation to various formats
 */
export function exportChat(messages: ChatMessage[], options: ExportOptions): void {
  const { format, agentName } = options;

  switch (format) {
    case 'pdf':
      exportToPDF(messages, agentName, options);
      break;
    case 'csv':
      exportToCSV(messages, agentName, options);
      break;
    case 'text':
      exportToText(messages, agentName, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export to PDF format
 */
function exportToPDF(messages: ChatMessage[], agentName: string, options: ExportOptions): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${agentName} - Chat Export`, margin, yPos);
  yPos += 10;

  // Export date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 15;

  // Messages
  messages.forEach((msg, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
    }

    // Message header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const roleColor = msg.role === 'user' ? [59, 130, 246] : [16, 185, 129];
    doc.setTextColor(...roleColor as [number, number, number]);
    const roleText = msg.role === 'user' ? 'You' : agentName;
    doc.text(roleText, margin, yPos);

    if (options.includeTimestamps) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      const timestamp = msg.timestamp.toLocaleString();
      doc.text(timestamp, margin + 30, yPos);
    }

    yPos += 7;

    // Message content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Split text to fit page width
    const lines = doc.splitTextToSize(msg.content, maxWidth);
    doc.text(lines, margin, yPos);
    yPos += (lines.length * 5) + 10;

    // Add cost if available and meta included
    if (options.includeMeta && msg.cost) {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Cost: $${msg.cost.toFixed(4)}`, margin, yPos);
      yPos += 8;
    }

    // Separator
    if (index < messages.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    }
  });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download
  const filename = `${agentName.replace(/\s+/g, '_')}_chat_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Export to CSV format
 */
function exportToCSV(messages: ChatMessage[], agentName: string, options: ExportOptions): void {
  const headers = ['Timestamp', 'Role', 'Message'];
  if (options.includeMeta) {
    headers.push('Cost');
  }

  const rows = messages.map(msg => {
    const row = [
      msg.timestamp.toISOString(),
      msg.role,
      `"${msg.content.replace(/"/g, '""')}"` // Escape quotes
    ];

    if (options.includeMeta) {
      row.push(msg.cost ? msg.cost.toString() : '');
    }

    return row.join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${agentName.replace(/\s+/g, '_')}_chat_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export to Text/Markdown format
 */
function exportToText(messages: ChatMessage[], agentName: string, options: ExportOptions): void {
  let content = `# ${agentName} - Chat Export\n\n`;
  content += `**Exported:** ${new Date().toLocaleString()}\n\n`;
  content += `---\n\n`;

  messages.forEach((msg, index) => {
    const roleText = msg.role === 'user' ? '**You**' : `**${agentName}**`;
    content += `${roleText}`;

    if (options.includeTimestamps) {
      content += ` - ${msg.timestamp.toLocaleString()}`;
    }

    content += `\n\n${msg.content}\n\n`;

    if (options.includeMeta && msg.cost) {
      content += `_Cost: $${msg.cost.toFixed(4)}_\n\n`;
    }

    if (index < messages.length - 1) {
      content += `---\n\n`;
    }
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${agentName.replace(/\s+/g, '_')}_chat_${Date.now()}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
