/**
 * Export utilities for chat conversations
 * PDF export uses server-side API for professional formatting
 */

// Message interface for chat exports
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
}

/**
 * Export chat to professional PDF via server-side API
 */
export async function exportToPDF(messages: ChatMessage[], agentName: string): Promise<void> {
  try {
    // Convert timestamps to ISO strings for JSON serialization
    const serializableMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      cost: msg.cost
    }));

    console.log('[PDF Export] Sending request to server...');

    // Call server-side API for PDF generation
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    console.log('[PDF Export] PDF generated successfully');

    // Get the PDF blob and trigger download
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
    link.download = `${sanitizedName}_report_${timestamp}.pdf`;
    link.href = url;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[PDF Export] Download complete');
  } catch (error) {
    console.error('[PDF Export] Failed:', error);
    throw error;
  }
}

/**
 * Export chat to CSV
 */
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

/**
 * Export chat to text/markdown
 */
export function exportToText(messages: ChatMessage[], agentName: string): void {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let content = `# ${agentName} - Chat Export\n\n`;
  content += `**Exported:** ${date}\n\n`;
  content += `---\n\n`;

  messages.forEach((msg, index) => {
    const timestamp = msg.timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    content += `### ${msg.role.toUpperCase()} (${timestamp})\n\n`;
    content += `${msg.content}\n\n`;

    if (msg.cost) {
      content += `*Cost: $${msg.cost.toFixed(4)}*\n\n`;
    }

    if (index < messages.length - 1) {
      content += `---\n\n`;
    }
  });

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
