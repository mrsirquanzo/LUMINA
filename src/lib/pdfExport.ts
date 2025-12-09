/**
 * Modern PDF Export System for Agent Conversations
 *
 * Client-side export handlers that call server-side API for PDF generation
 */

// Message interface for chat exports
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
}

/**
 * Export to PDF - calls server-side API for proper markdown rendering
 */
export async function exportToPDF(messages: ChatMessage[], agentName: string): Promise<void> {
  console.log('[PDF Export] Generating modern PDF with markdown rendering...');

  try {
    // Convert messages to serializable format
    const serializableMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      cost: msg.cost
    }));

    // Call server-side API to generate PDF
    const response = await fetch('/api/export-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: serializableMessages,
        agentName
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to generate PDF');
    }

    // Get PDF blob from response
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Extract filename from response headers or generate one
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `${agentName.replace(/[^a-zA-Z0-9-]/g, '-')}_chat_${new Date().toISOString().split('T')[0]}.pdf`;

    if (contentDisposition) {
      const matches = /filename="([^"]+)"/.exec(contentDisposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }

    link.download = filename;
    link.href = url;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[PDF Export] PDF generated successfully!');
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
    msg.timestamp.toISOString(),
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
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
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
        ''
      ];

      if (msg.cost && msg.cost > 0) {
        lines.push(`*Cost: $${msg.cost.toFixed(4)}*`, '');
      }

      lines.push(msg.content, '', '---', '');

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
