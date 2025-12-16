/**
 * Modern PDF Export System for Agent Conversations
 *
 * Client-side export handlers for exporting agent conversations.
 *
 * Note: We intentionally avoid server-side PDF generation here because the
 * current backend does not expose an `/api/export-chat` route.
 */

import { downloadTextFile, openPrintPreview } from './reportExport';

// Message interface for chat exports
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date | string | number;
  cost?: number;
}

function toDate(value: ChatMessage['timestamp']): Date {
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function buildChatMarkdown(messages: ChatMessage[], agentName: string): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const totalCost = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);

  const content = [
    `# ${agentName}`,
    `Conversation Export • ${date}`,
    `${messages.length} messages`,
    totalCost > 0 ? `Total Cost: $${totalCost.toFixed(4)}` : '',
    '',
    '---',
    '',
    ...messages.flatMap(msg => {
      const ts = toDate(msg.timestamp);
      const timestamp = ts.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const lines = [
        `## ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}`,
        `*${timestamp}*`,
        '',
      ];

      if (msg.cost && msg.cost > 0) lines.push(`*Cost: $${msg.cost.toFixed(4)}*`, '');

      lines.push(msg.content, '', '---', '');
      return lines;
    }),
  ].join('\n');

  return content;
}

/**
 * Export to PDF - opens a print preview (Save as PDF).
 */
export async function exportToPDF(messages: ChatMessage[], agentName: string): Promise<void> {
  try {
    const markdown = buildChatMarkdown(messages, agentName);
    openPrintPreview(`${agentName} - Conversation Export`, markdown);
  } catch (error) {
    console.error('[PDF Export] Failed:', error);
    throw error;
  }
}

/**
 * Export to CSV
 */
export function exportToCSV(messages: ChatMessage[], agentName: string): void {
  const headers = ['Timestamp', 'Role', 'Content', 'Cost'];
  const rows = messages.map(msg => [
    toDate(msg.timestamp).toISOString(),
    msg.role,
    msg.content.replace(/"/g, '""'), // Escape quotes
    msg.cost?.toFixed(4) || ''
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

/**
 * Export to text/markdown
 */
export function exportToText(messages: ChatMessage[], agentName: string): void {
  const markdown = buildChatMarkdown(messages, agentName);
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
  downloadTextFile(`${sanitizedName}_chat_${timestamp}.md`, markdown, 'text/markdown;charset=utf-8;');
}
