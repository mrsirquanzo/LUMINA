import type { UserTile } from './tiles/types';

export type ExportFormat = 'pdf' | 'pptx' | 'docx' | 'markdown' | 'json';

interface ReportMeta {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  persona?: string;
  workspaceName?: string;
  target?: string;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

export function downloadJsonFile(filename: string, data: unknown): void {
  downloadTextFile(filename, safeJson(data), 'application/json;charset=utf-8');
}

export function buildTilesMarkdownReport(meta: ReportMeta, tiles: UserTile[]): string {
  const generatedAt = meta.generatedAt ?? new Date();
  const lines: string[] = [];

  lines.push(`# ${meta.title}`);
  if (meta.subtitle) lines.push(meta.subtitle);
  lines.push('');
  lines.push(`Generated: ${generatedAt.toLocaleString()}`);
  if (meta.persona) lines.push(`Persona: ${meta.persona}`);
  if (meta.workspaceName) lines.push(`Workspace: ${meta.workspaceName}`);
  if (meta.target) lines.push(`Target: ${meta.target}`);
  lines.push(`Tiles: ${tiles.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  const sorted = [...tiles].sort((a, b) => {
    // pinned first, then createdAt
    const ap = a.isPinned ? 0 : 1;
    const bp = b.isPinned ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const tile of sorted) {
    lines.push(`## ${tile.title}`);
    if (tile.subtitle) lines.push(`*${tile.subtitle}*`);
    lines.push('');
    lines.push(`- Agent: ${tile.agent}`);
    lines.push(`- Type: ${tile.type}`);
    lines.push(`- Created: ${new Date(tile.createdAt).toLocaleString()}`);
    lines.push('');

    const response =
      (typeof (tile.data as any)?.detailed?.fullResponse === 'string' && (tile.data as any).detailed.fullResponse) ||
      (typeof (tile.data as any)?.summary?.fullResponse === 'string' && (tile.data as any).summary.fullResponse) ||
      (typeof (tile.source as any)?.sourceData?.response === 'string' && (tile.source as any).sourceData.response);

    if (typeof response === 'string' && response.trim()) {
      lines.push(response.trim());
    } else {
      lines.push('```json');
      lines.push(safeJson(tile.data));
      lines.push('```');
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPrintableHtml(title: string, markdownContent: string): string {
  // We keep the content as pre-wrapped text to avoid introducing HTML injection without a sanitizer.
  const body = escapeHtml(markdownContent);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 32px; color: #111827; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      .hint { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      pre { white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; line-height: 1.5; }
      @media print {
        body { margin: 0.75in; }
        .hint { display: none; }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="hint">Tip: choose “Save as PDF” in the print dialog.</div>
    <pre>${body}</pre>
  </body>
</html>`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function openPrintPreview(title: string, markdownContent: string): void {
  // Avoid popups (often blocked) by printing via a hidden iframe.
  const html = buildPrintableHtml(title, markdownContent);
  const dateStamp = new Date().toISOString().split('T')[0];
  const base = `${slugify(title) || 'lumina-export'}-${dateStamp}`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.setAttribute('aria-hidden', 'true');

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) {
        // Fallback: download files so the user can open + print manually.
        downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
        downloadTextFile(`${base}.md`, markdownContent, 'text/markdown;charset=utf-8');
        cleanup();
        return;
      }

      win.focus();
      win.print();
    } catch {
      downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
      downloadTextFile(`${base}.md`, markdownContent, 'text/markdown;charset=utf-8');
    } finally {
      // Give the print dialog time; clean up eventually.
      window.setTimeout(cleanup, 60_000);
    }
  };

  document.body.appendChild(iframe);

  // Write HTML into iframe document.
  const doc = iframe.contentDocument;
  if (!doc) {
    downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
    downloadTextFile(`${base}.md`, markdownContent, 'text/markdown;charset=utf-8');
    cleanup();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
}

export function openPrintPreviewHtml(title: string, html: string): void {
  const dateStamp = new Date().toISOString().split('T')[0];
  const base = `${slugify(title) || 'lumina-export'}-${dateStamp}`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.setAttribute('aria-hidden', 'true');

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      // ignore
    }
  };

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) {
        downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
        cleanup();
        return;
      }
      win.focus();
      win.print();
    } catch {
      downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
    } finally {
      window.setTimeout(cleanup, 60_000);
    }
  };

  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    downloadTextFile(`${base}.html`, html, 'text/html;charset=utf-8');
    cleanup();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
}

export function exportMarkdownReport(format: 'pdf' | 'pptx' | 'docx', filenameBase: string, title: string, markdownContent: string): void {
  const safeBase = filenameBase.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'lumina-export';

  if (format === 'pdf') {
    openPrintPreview(title, markdownContent);
    return;
  }

  if (format === 'docx') {
    // We generate an HTML-based Word document. Word will open this as a document.
    const html = buildPrintableHtml(title, markdownContent);
    downloadTextFile(`${safeBase}.doc`, html, 'application/msword;charset=utf-8');
    return;
  }

  // PPTX generation requires a dedicated library. Export a slide-outline Markdown as a practical fallback.
  downloadTextFile(`${safeBase}.md`, markdownContent, 'text/markdown;charset=utf-8');
}

