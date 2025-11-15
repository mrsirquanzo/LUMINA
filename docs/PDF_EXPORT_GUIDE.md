# PDF Export System Documentation

## Overview

The PDF export system provides professional-quality document generation for AI agent conversations. It supports PDF, CSV, and Markdown formats with enterprise-grade formatting and typography.

## Features ✓

### 1. Character Encoding
- **Full UTF-8 Support**: Properly renders special characters
  - Checkmarks: ✓
  - X marks: ✗
  - Arrows: →
  - Warnings: ⚠
  - Stars: ★
  - Smart quotes: " " ' '
  - Dashes: – —

### 2. Table Formatting
- **Responsive Tables**: Auto-fit column widths
- **Professional Styling**:
  - Alternating row colors (#f8f9fa / white)
  - 1pt borders (#dee2e6)
  - Proper cell padding (6pt)
  - Header rows with bold text
- **Smart Page Breaks**: Tables never cut off mid-content
- **Word Wrapping**: Long content wraps within cells

### 3. Intelligent Page Break Management
- **Section Awareness**: Never breaks in the middle of:
  - Tables (moved to next page as complete units)
  - Headings (kept with at least 2 lines of content)
  - Code blocks (kept together)
- **Orphan Prevention**: No single lines stranded on pages
- **Automatic Spacing**: Extra space before major sections near page breaks

### 4. Professional Typography

#### Font Hierarchy
```
H1: 24pt, bold, 32pt spacing before, 16pt after
H2: 18pt, bold, 24pt spacing before, 12pt after
H3: 14pt, semi-bold, 16pt spacing before, 8pt after
Body: 11pt, regular, 1.6 line-height
Small: 9pt (timestamps, metadata)
```

#### Font Stack
- Primary: Helvetica (built-in PDF font)
- Fallback: Courier (for code blocks)

### 5. Layout & Margins
- **Page Margins**: 0.75" on all sides (54pt)
- **Content Width**: Optimized for readability (~6.5")
- **Section Spacing**: 24pt between major sections
- **Paragraph Spacing**: 8pt between paragraphs

### 6. Visual Design

#### Color Palette
```typescript
Text: #212121 (dark gray)
Light Text: #6c757d (metadata, timestamps)
User Messages: #f0f7ff (light blue background)
Section Backgrounds: #f8f9fa (light gray)
Table Borders: #dee2e6 (medium gray)
Table Alt Rows: #f8f9fa (light gray)
```

#### Message Styling
- **User Messages**:
  - Light blue background (#f0f7ff)
  - 8pt padding
  - Clear role label + timestamp

- **Assistant Messages**:
  - Standard white background
  - Markdown parsing for rich formatting
  - Cost displayed for API calls

### 7. Headers & Footers
- **First Page Header**:
  - Document title (24pt, bold)
  - Subtitle with date (9pt, gray)
  - Subtle bottom border (2pt, #e9ecef)

- **Page Footer**:
  - Simple centered page number (9pt, gray)
  - Minimal and unobtrusive

### 8. PDF Metadata
```typescript
{
  title: "[Agent Name] - Conversation Export",
  subject: "AI Agent Conversation",
  author: "[Agent Name]",
  creator: "Multi-Agent Analysis System",
  creationDate: new Date()
}
```

### 9. File Naming
Format: `[agent-name]_chat_[YYYY-MM-DD].pdf`

Example: `Multi-Agent-Analysis_chat_2025-11-15.pdf`

## Usage

### Basic Usage

```typescript
import { exportToPDF, ChatMessage } from '@/lib/pdfExport';

const messages: ChatMessage[] = [
  {
    role: 'user',
    content: 'Your query here',
    timestamp: new Date()
  },
  {
    role: 'assistant',
    content: 'Response with **markdown** support',
    timestamp: new Date(),
    cost: 0.25
  }
];

exportToPDF(messages, 'My Agent Name');
```

### With ExportButton Component

```typescript
import ExportButton from '@/components/shared/ExportButton';

<ExportButton
  messages={messages}
  agentName="Multi-Agent Analysis"
/>
```

The button provides a dropdown menu with three options:
- 📄 Export as PDF (professional report format)
- 📊 Export as CSV (spreadsheet compatible)
- 📝 Export as Text (markdown format)

## Supported Markdown Features

### Headings
```markdown
# H1 Heading
## H2 Heading
### H3 Heading
```

### Lists
```markdown
- Bullet item 1
- Bullet item 2

1. Numbered item 1
2. Numbered item 2
```

### Tables
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

### Code Blocks
```markdown
\`\`\`typescript
const example = 'code here';
console.log(example);
\`\`\`
```

### Inline Formatting
- **Bold text**: `**bold**`
- *Italic text*: `*italic*`
- Special characters: ✓ ✗ → ⚠ ★

## Testing

### Run the Test Suite

```typescript
import { runPDFExportTest } from '@/lib/pdfExportTest';

// In browser console
runPDFExportTest();
```

This generates a comprehensive test PDF with:
- ✓ All special characters
- ✓ Multiple tables with various column counts
- ✓ Long content requiring multiple pages
- ✓ All heading levels
- ✓ Lists (bullet and numbered)
- ✓ Code blocks
- ✓ Mixed content types

### Testing Checklist

Before deploying, verify:

- [ ] Special characters render correctly (✓ ✗ → ⚠ ★)
- [ ] Tables never overflow or get cut off
- [ ] No awkward page breaks mid-section
- [ ] Headers/footers are minimal and clean
- [ ] Font hierarchy is clear and professional
- [ ] All margins are respected (0.75" minimum)
- [ ] Long conversations (10+ pages) export without errors
- [ ] File size is reasonable (<5MB for 10 pages)
- [ ] Filename format is correct
- [ ] PDF metadata is set properly

## Technical Details

### PDF Library Stack
- **jsPDF** (v3.0.3): Core PDF generation
- **jspdf-autotable** (v5.0.2): Advanced table support

### Character Encoding
Special characters are mapped to Unicode code points:

```typescript
const SYMBOL_MAP = {
  '✓': '\u2713',
  '✗': '\u2717',
  '→': '\u2192',
  '⚠': '\u26A0',
  '★': '\u2605'
};
```

### Page Break Logic
```typescript
checkPageBreak(requiredSpace: number, keepWithNext: boolean) {
  const availableSpace = pageHeight - bottomMargin - currentY;

  if (availableSpace < requiredSpace) {
    addPage();
  }
}
```

### Table Handling
```typescript
// If table doesn't fit, move to new page
if (pageHeight - currentY - bottomMargin < estimatedTableHeight) {
  addPage();
}

// Render table as complete unit
autoTable(doc, {
  head: [headers],
  body: rows,
  // ... styling options
});
```

## File Structure

```
lib/
  pdfExport.ts          # Main PDF export library
  pdfExportTest.ts      # Comprehensive test suite

components/
  shared/
    ExportButton.tsx    # Export dropdown component

docs/
  PDF_EXPORT_GUIDE.md   # This documentation
```

## API Reference

### exportToPDF()
```typescript
function exportToPDF(
  messages: ChatMessage[],
  agentName: string
): void
```

Generates and downloads a PDF file.

**Parameters:**
- `messages`: Array of chat messages
- `agentName`: Name to display in document header

**Returns:** void (triggers download)

### exportToCSV()
```typescript
function exportToCSV(
  messages: ChatMessage[],
  agentName: string
): void
```

Generates and downloads a CSV file.

**CSV Format:**
```
Timestamp,Role,Content,Cost
2025-11-15T10:00:00Z,user,"Message content",
2025-11-15T10:01:00Z,assistant,"Response content",0.25
```

### exportToText()
```typescript
function exportToText(
  messages: ChatMessage[],
  agentName: string
): void
```

Generates and downloads a Markdown file.

**Markdown Format:**
```markdown
# Agent Name
Conversation Export • November 15, 2025

---

## User
*Nov 15, 2025, 10:00 AM*

Message content

---

## Assistant
*Nov 15, 2025, 10:01 AM*

Response content

*Cost: $0.25*

---
```

### ChatMessage Interface
```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
}
```

## Best Practices

### Content Preparation
1. **Use Markdown**: Structure content with headings, lists, and tables
2. **Include Special Characters**: Use ✓ ✗ → ⚠ ★ for visual clarity
3. **Reasonable Length**: Keep messages under 50KB for best performance
4. **Include Timestamps**: Always provide accurate timestamps

### Performance Optimization
1. **Large Exports**: For 100+ messages, consider pagination
2. **Image Handling**: Currently text-only; images not supported
3. **File Size**: Monitor generated PDF size (target <5MB)

### Styling Guidelines
1. **Headings**: Use semantic heading levels (H1 > H2 > H3)
2. **Tables**: Keep columns to 6 or fewer for best fit
3. **Lists**: Prefer bullet lists for better readability
4. **Code**: Use code blocks for technical content

## Troubleshooting

### Issue: Special characters render as boxes (□)
**Solution**: Ensure you're using the SYMBOL_MAP for character encoding

### Issue: Tables cut off at page boundary
**Solution**: The system automatically moves tables to new pages. If still occurring, the table may be too tall for a single page (rare).

### Issue: PDF file too large
**Solution**:
- Reduce message count
- Remove large code blocks
- Simplify table content

### Issue: Inconsistent spacing
**Solution**: Check that you're using standard Markdown syntax (not custom HTML)

### Issue: Export button disabled
**Solution**: Ensure messages array has at least one message

## Future Enhancements

Planned features for future versions:
- [ ] Image embedding support
- [ ] Custom color schemes
- [ ] Company logo in header
- [ ] Configurable page size (A4, Legal, etc.)
- [ ] Watermark support
- [ ] Digital signatures
- [ ] Batch export (multiple conversations)
- [ ] Email delivery option

## Support

For issues or questions:
1. Check this documentation
2. Review the test suite in `pdfExportTest.ts`
3. Verify jsPDF and jspdf-autotable are installed
4. Check browser console for errors

## Version History

### v1.0.0 (2025-11-15)
- ✓ Initial release
- ✓ Full UTF-8 character support
- ✓ Professional table formatting
- ✓ Intelligent page breaks
- ✓ Typography hierarchy
- ✓ PDF, CSV, and Text export
- ✓ ExportButton component
- ✓ Comprehensive documentation
- ✓ Test suite

---

**Quality Standard**: McKinsey/BCG consulting report level ✓
