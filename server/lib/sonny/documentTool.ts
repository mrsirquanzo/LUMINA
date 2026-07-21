import type { Evidence } from '@mrsirquanzo/sonny-shared';
import type { Tool } from '@mrsirquanzo/sonny-mcp-gateway';

export interface UploadedDocument {
  name: string;
  text: string; // Markdown, already converted by markitdown
}

const MAX_CHUNK_CHARS = 1400;
const MAX_CHUNKS_PER_DOC = 24;
const MAX_TOTAL_CHUNKS = 60;

function slug(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48) || 'document';
}

// Split on blank lines first (paragraph boundaries), then pack paragraphs up to
// the chunk budget so a citable passage is coherent rather than mid-sentence.
function chunk(text: string): string[] {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = '';
  for (const p of paras) {
    if (p.length > MAX_CHUNK_CHARS) {
      if (buf) { chunks.push(buf); buf = ''; }
      for (let i = 0; i < p.length; i += MAX_CHUNK_CHARS) chunks.push(p.slice(i, i + MAX_CHUNK_CHARS));
      continue;
    }
    if ((buf + '\n\n' + p).length > MAX_CHUNK_CHARS) { chunks.push(buf); buf = p; }
    else buf = buf ? buf + '\n\n' + p : p;
  }
  if (buf) chunks.push(buf);
  return chunks;
}

// Build citable Evidence from uploaded documents. Registered up-front by the
// engine's structured-evidence seed, so passages land in the evidence store and
// any claim citing DOC:<slug>#<n> survives the grounding gate.
export function documentEvidence(documents: UploadedDocument[]): Evidence[] {
  const retrievedAt = new Date().toISOString();
  const evidence: Evidence[] = [];
  for (const doc of documents) {
    const s = slug(doc.name);
    const parts = chunk(doc.text).slice(0, MAX_CHUNKS_PER_DOC);
    parts.forEach((passage, i) => {
      if (evidence.length >= MAX_TOTAL_CHUNKS) return;
      evidence.push({
        id: `DOC:${s}#${i + 1}`,
        kind: 'dataset',
        source: `Uploaded document · ${doc.name}`,
        title: parts.length > 1 ? `${doc.name} (passage ${i + 1}/${parts.length})` : doc.name,
        snippet: passage,
        url: '',
        raw: { document: doc.name, passage: i + 1 },
        retrievedAt,
      } as Evidence);
    });
  }
  return evidence;
}

// A structured tool exposing the user's uploaded documents. The engine seeds
// structured tools once at run start (so the passages are always in the store),
// and specialists can also call it on demand while investigating.
export function makeDocumentTool(documents: UploadedDocument[]): Tool | null {
  if (!documents.length) return null;
  const evidence = documentEvidence(documents);
  const names = documents.map((d) => d.name).join(', ');
  return {
    name: 'uploaded_documents',
    description:
      `Search the user's uploaded documents (${names}) - internal reports, papers, filings, or data the user attached to this run. ` +
      `Returns passages as citable evidence (id DOC:...). Use it to ground claims in the user's own material alongside public sources.`,
    async call() {
      return evidence;
    },
  };
}
