import { downloadJsonFile, downloadTextFile, openPrintPreviewHtml } from './reportExport';

export type ProfessionalExportFormat = 'pdf' | 'docx' | 'json' | 'html';

export interface StructuredDocument {
  kind: 'sonny-executive-brief' | 'sonny-investment-thesis' | 'agent-report';
  title: string;
  subtitle?: string;
  generatedAt: string; // ISO
  target?: string;
  persona?: string;
  confidentiality?: string; // e.g., "Confidential • For internal use only"
  sections: Array<{
    id: string;
    title: string;
    summary?: string;
    blocks: Array<
      | { type: 'paragraph'; text: string }
      | { type: 'bullets'; items: string[] }
      | { type: 'kv'; items: Array<{ label: string; value: string; tone?: 'good' | 'watch' | 'bad' | 'neutral' }> }
      | { type: 'table'; columns: string[]; rows: string[][] }
      | { type: 'riskRegister'; rows: Array<{ risk: string; probability: string; impact: string; mitigant?: string }> }
    >;
  }>;
  appendix?: {
    sources?: Array<{ label: string; url: string }>;
    notes?: string[];
  };
}

function escapeHtml(text: string): string {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function joinNonEmpty(parts: Array<string | null | undefined>, sep = ' • '): string {
  return parts.map((p) => (p || '').trim()).filter(Boolean).join(sep);
}

function toneClass(tone: 'good' | 'watch' | 'bad' | 'neutral' | undefined) {
  if (tone === 'good') return 'chip chip-good';
  if (tone === 'watch') return 'chip chip-watch';
  if (tone === 'bad') return 'chip chip-bad';
  return 'chip';
}

function renderBlock(block: StructuredDocument['sections'][number]['blocks'][number]): string {
  if (block.type === 'paragraph') return `<p class="p">${escapeHtml(block.text)}</p>`;
  if (block.type === 'bullets')
    return `<ul class="ul">${block.items.map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`;
  if (block.type === 'kv')
    return `<div class="kv">${block.items
      .map(
        (it) =>
          `<div class="${toneClass(it.tone)}"><span class="k">${escapeHtml(it.label)}</span><span class="v">${escapeHtml(it.value)}</span></div>`
      )
      .join('')}</div>`;
  if (block.type === 'table')
    return `<div class="table-wrap"><table class="table"><thead><tr>${block.columns
      .map((c) => `<th>${escapeHtml(c)}</th>`)
      .join('')}</tr></thead><tbody>${block.rows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
  if (block.type === 'riskRegister')
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigant</th></tr></thead><tbody>${block.rows
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.risk)}</td><td>${escapeHtml(r.probability)}</td><td>${escapeHtml(r.impact)}</td><td>${escapeHtml(r.mitigant || '')}</td></tr>`
      )
      .join('')}</tbody></table></div>`;
  return '';
}

export function buildProfessionalHtmlDocument(doc: StructuredDocument): string {
  const generated = new Date(doc.generatedAt);
  const metaLine = joinNonEmpty([
    generated.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    doc.persona,
    doc.target,
  ]);

  const sectionsHtml = doc.sections
    .map((s) => {
      const blocks = s.blocks.map(renderBlock).join('\n');
      const summary = s.summary ? `<p class="summary">${escapeHtml(s.summary)}</p>` : '';
      return `<section class="section" id="${escapeHtml(s.id)}"><h2>${escapeHtml(s.title)}</h2>${summary}${blocks}</section>`;
    })
    .join('\n');

  const appendixSources =
    doc.appendix?.sources?.length
      ? `<section class="section"><h2>Sources</h2><ul class="ul">${doc.appendix.sources
          .map((s) => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.label)}</a></li>`)
          .join('')}</ul></section>`
      : '';

  const appendixNotes =
    doc.appendix?.notes?.length
      ? `<section class="section"><h2>Notes</h2>${doc.appendix.notes.map((n) => `<p class="p">${escapeHtml(n)}</p>`).join('')}</section>`
      : '';

  const conf = doc.confidentiality ? `<div class="conf">${escapeHtml(doc.confidentiality)}</div>` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(doc.title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; background: #f7f7fb; color: #111827; }
      .page { max-width: 980px; margin: 0 auto; padding: 44px 42px 72px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 18px; border-bottom: 1px solid #e5e7eb; }
      h1 { font-size: 22px; line-height: 1.2; margin: 0; letter-spacing: -0.02em; }
      .subtitle { font-size: 13px; color: #4b5563; margin-top: 6px; }
      .meta { font-size: 12px; color: #6b7280; margin-top: 10px; }
      .conf { font-size: 11px; color: #6b7280; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 999px; background: white; }
      .section { margin-top: 22px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px 18px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
      h2 { font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #111827; }
      .summary { font-size: 13px; color: #374151; margin: 0 0 10px; }
      .p { font-size: 13px; line-height: 1.55; color: #111827; margin: 0 0 10px; }
      .ul { margin: 0 0 10px; padding-left: 18px; color: #111827; }
      .ul li { margin: 6px 0; font-size: 13px; line-height: 1.45; }
      .kv { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 10px; }
      .chip { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa; }
      .chip-good { border-color: rgba(16,185,129,0.25); background: rgba(16,185,129,0.08); }
      .chip-watch { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.08); }
      .chip-bad { border-color: rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); }
      .k { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
      .v { font-size: 13px; font-weight: 600; color: #111827; }
      .table-wrap { width: 100%; overflow-x: auto; }
      .table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .table th { text-align: left; padding: 10px 10px; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
      .table td { padding: 10px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      @media print {
        body { background: white; }
        .page { padding: 0.75in; }
        .section { box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div>
          <h1>${escapeHtml(doc.title)}</h1>
          ${doc.subtitle ? `<div class="subtitle">${escapeHtml(doc.subtitle)}</div>` : ''}
          ${metaLine ? `<div class="meta">${escapeHtml(metaLine)}</div>` : ''}
        </div>
        ${conf}
      </div>
      ${sectionsHtml}
      ${appendixSources}
      ${appendixNotes}
    </div>
  </body>
</html>`;
}

export function exportStructuredDocument(format: ProfessionalExportFormat, filenameBase: string, doc: StructuredDocument): void {
  const dateStamp = new Date(doc.generatedAt).toISOString().split('T')[0];
  const safeBase =
    `${filenameBase}-${dateStamp}`.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'lumina-export';

  if (format === 'json') {
    downloadJsonFile(`${safeBase}.json`, doc);
    return;
  }

  const html = buildProfessionalHtmlDocument(doc);

  if (format === 'html') {
    downloadTextFile(`${safeBase}.html`, html, 'text/html;charset=utf-8');
    return;
  }

  if (format === 'docx') {
    // HTML-based Word doc fallback (Word opens .doc HTML fine)
    downloadTextFile(`${safeBase}.doc`, html, 'application/msword;charset=utf-8');
    return;
  }

  // pdf
  openPrintPreviewHtml(doc.title, html);
}

