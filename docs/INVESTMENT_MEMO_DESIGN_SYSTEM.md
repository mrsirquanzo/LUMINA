# Investment Memo Design System - Modern Minimalist

## Overview

This document defines the design system for generating institutional-grade investment memos. The design philosophy emphasizes clean, modern, professional aesthetics matching the QuanHo.io brand.

---

## Color Palette

### Primary Colors
```css
--accent-blue: #3B82F6    /* Headers, highlights, table headers */
--deep-navy: #1E293B      /* Primary text */
--slate-gray: #64748B     /* Secondary text, metadata */
--light-bg: #F8FAFC       /* Tables, callout boxes */
--border-gray: #E2E8F0    /* Dividers, table borders */
```

### Usage Guidelines
- **Accent Blue (#3B82F6)**: Use for all H2/H3 headers, table headers, important figures, callout borders
- **Deep Navy (#1E293B)**: All body text and H1 headers
- **Slate Gray (#64748B)**: Metadata, timestamps, secondary information
- **Light Background (#F8FAFC)**: Alternating table rows, callout box backgrounds
- **Border Gray (#E2E8F0)**: Table borders, horizontal dividers

---

## Typography

### Font Family
**Primary Font**: Arial, sans-serif (throughout entire document)
- NO serif fonts (removed EB Garamond)
- Ensures consistency and professional appearance
- Print-optimized and universally supported

### Font Sizes
```css
Title Page H1:    48pt  /* "INVESTMENT MEMORANDUM" */
Section H1:       24pt  /* Section headers */
Section H2:       18pt  /* Subsection headers */
Section H3:       14pt  /* Sub-subsection headers */
Body Text:        11pt  /* Paragraphs */
Table Text:       10pt  /* Table content */
Footer/Meta:      9pt   /* Page numbers, confidential notice */
```

### Font Weights
```css
Body Text:        400 (normal)   /* All paragraphs - consistent weight */
Headers:          700 (bold)     /* H1, H2, H3 only */
Table Headers:    600 (semibold) /* Table <th> elements */
Highlights:       600 (semibold) /* Important figures */
```

**CRITICAL**: Never use bold mid-sentence. Keep body text at consistent 400 weight.

---

## Page Layout

### Margins
```
Page Size: Letter (8.5" × 11")
Top:    0.75in
Right:  0.75in
Bottom: 0.75in
Left:   0.75in
```

### Content Width
- Full width within margins (NO centered narrow content)
- Maximizes space utilization
- Professional business document standard

---

## Document Structure

### 1. Title Page

```html
<div class="cover-page">
  <h1>INVESTMENT MEMORANDUM</h1>
  <h2>[Company Name]</h2>
  <div class="divider"></div> <!-- Gradient blue line -->
  <div class="meta">
    <div>Generated: [Date]</div>
    <div>Prepared by: [Name]</div>
    <div>Investment Committee</div>
  </div>
  <div class="footer">
    CONFIDENTIAL AND PROPRIETARY
    ...
  </div>
</div>
```

**Styling**:
- H1: 48pt Arial, font-weight 700, Deep Navy (#1E293B)
- H2: 18pt Arial, font-weight 400, Slate Gray (#64748B)
- Divider: 3px gradient (Accent Blue to transparent)
- Footer: Light Background (#F8FAFC) with Accent Blue top border

### 2. Section Headers

```html
<h1 id="executive-summary">1. Executive Summary</h1>
<hr> <!-- Gradient divider automatically styled -->
```

**Styling**:
- 24pt Arial, font-weight 700
- Deep Navy color (#1E293B)
- Followed by 3px gradient divider
- 1.5em bottom margin

### 3. Subsection Headers

```markdown
## Investment Thesis
```

**Styling**:
- 18pt Arial, font-weight 700
- Accent Blue color (#3B82F6)
- 1em bottom margin

---

## Tables

### HTML Format (Required)

**ALWAYS use HTML tables - NEVER markdown pipes**

```html
<table>
<thead>
<tr>
  <th>Metric</th>
  <th>Asset 1</th>
  <th>Asset 2</th>
  <th>Asset 3</th>
</tr>
</thead>
<tbody>
<tr>
  <td><strong>Revenue 2025E</strong></td>
  <td><span class="highlight">$3.7B</span></td>
  <td>$1.2B</td>
  <td>$900M</td>
</tr>
<tr>
  <td><strong>Peak Sales</strong></td>
  <td><span class="highlight">$10-15B</span></td>
  <td>$5-7B</td>
  <td>$3-5B</td>
</tr>
</tbody>
</table>
```

### Table Styling
```css
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 10pt;
}

thead {
  background-color: #3B82F6;  /* Accent Blue */
  color: white;
}

th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #2563EB;
}

td {
  padding: 10px 12px;
  border-bottom: 1px solid #E2E8F0;
  font-weight: 400;
}

tbody tr:nth-child(even) {
  background-color: #F8FAFC;  /* Light Background */
}

tbody tr:nth-child(odd) {
  background-color: white;
}
```

---

## Lists

### Custom Bullets

Lists automatically styled with blue arrow bullets (▸):

```markdown
- Clinical differentiation with 61% ORR
- Patent protection through 2031
- Market opportunity of $25-30B
```

**Styling**:
```css
li:before {
  content: "▸";
  color: #3B82F6;
  font-weight: bold;
  position: absolute;
  left: 0;
}
```

---

## Callout Boxes

### Structure

```html
<div class="callout-box">
  <h4>Investment Recommendation</h4>
  <p>Recommend approval for equity investment of <span class="highlight">$50-75M</span> based on strong clinical differentiation and extended patent protection through 2031.</p>
</div>
```

### Styling
```css
.callout-box {
  background-color: #F8FAFC;
  border-left: 4px solid #3B82F6;
  padding: 1.5em;
  margin: 2em 0;
  border-radius: 4px;
}

.callout-box h4 {
  color: #3B82F6;
  font-weight: 600;
  font-size: 12pt;
}
```

---

## Highlighting & Emphasis

### Highlight Class

Use for important figures and metrics:

```html
Revenue projection: <span class="highlight">$8-10B</span> by 2027
```

**Styling**:
```css
.highlight {
  color: #3B82F6;
  font-weight: 600;
}
```

### Text Emphasis

**DO NOT** use bold mid-sentence:
```
❌ WRONG: The **clinical data** shows **61% ORR**
✅ CORRECT: The clinical data shows <span class="highlight">61% ORR</span>
```

---

## Page Breaks

### Section Breaks

```markdown
---
```

Automatically styled as:
```css
hr {
  border: none;
  height: 3px;
  background: linear-gradient(to right, #3B82F6, transparent);
  margin: 0.5em 0 1.5em 0;
}
```

### Manual Page Breaks

```html
<div class="page-break"></div>
```

---

## Footer

Automatically generated on each page:

```
[Left] Confidential Investment Memorandum
[Right] Page X of Y
```

**Styling**:
- 9pt Arial, Slate Gray (#64748B)
- Positioned within 0.75in bottom margin

---

## Print Optimization

```css
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  table, .callout-box {
    page-break-inside: avoid;
  }
}
```

---

## PDF Generation Settings

```typescript
await page.pdf({
  format: 'Letter',
  printBackground: true,
  displayHeaderFooter: true,
  margin: {
    top: '0.75in',
    right: '0.75in',
    bottom: '0.75in',
    left: '0.75in'
  },
  preferCSSPageSize: false
});
```

---

## Examples

### Complete Investment Overview Table

```html
<table>
<thead>
<tr><th>Field</th><th>Details</th></tr>
</thead>
<tbody>
<tr><td><strong>Company</strong></td><td>BioTech Co</td></tr>
<tr><td><strong>Sector</strong></td><td>Oncology</td></tr>
<tr><td><strong>Proposed Investment</strong></td><td><span class="highlight">$50-75M</span></td></tr>
<tr><td><strong>Current Valuation</strong></td><td><span class="highlight">$500M</span></td></tr>
<tr><td><strong>Entry Multiple</strong></td><td>5.0x 2025E Revenue</td></tr>
<tr><td><strong>Investment Horizon</strong></td><td>5-7 years</td></tr>
</tbody>
</table>
```

### Complete Risk Matrix

```html
<table>
<thead>
<tr><th>Risk Category</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr>
</thead>
<tbody>
<tr><td><strong>Patent Cliff Risk</strong></td><td>High</td><td>High</td><td>Life cycle management strategy</td></tr>
<tr><td><strong>Clinical Safety Risk</strong></td><td>Medium</td><td>High</td><td>Enhanced monitoring protocols</td></tr>
<tr><td><strong>Market Competition</strong></td><td>Medium</td><td>Medium</td><td>Differentiated positioning</td></tr>
</tbody>
</table>
```

### Complete Callout Box Example

```html
<div class="callout-box">
  <h4>Investment Recommendation</h4>
  <p>Recommend approval for equity investment of <span class="highlight">$50-75M</span> in BioTech Co, representing <span class="highlight">10-15%</span> target ownership.</p>
  <p><strong>Key Strengths:</strong></p>
  <ul>
    <li>Clinical differentiation with <span class="highlight">61% ORR</span></li>
    <li>Extended patent protection through <span class="highlight">2031</span></li>
    <li>Market opportunity of <span class="highlight">$25-30B</span></li>
  </ul>
  <p><strong>Timeline:</strong> Complete diligence within 60 days, target closing Q2 2025</p>
</div>
```

---

## Quality Checklist

Before generating final PDF, verify:

- [ ] All text uses Arial font
- [ ] Title page "INVESTMENT MEMORANDUM" is Arial (not serif)
- [ ] All body text is font-weight 400 (no random bold)
- [ ] Headers are font-weight 700 only
- [ ] Colors match specification (#3B82F6, #1E293B, #64748B)
- [ ] Tables use HTML format (not markdown pipes)
- [ ] Margins are 0.75" all sides
- [ ] Content spans full width within margins
- [ ] Callout boxes have accent blue left border
- [ ] Numbers/highlights use .highlight class
- [ ] Section dividers use gradient line
- [ ] Lists use custom bullet (▸) in accent blue
- [ ] No raw markdown syntax visible
- [ ] Consistent spacing between sections (1.5-2em)
- [ ] Page breaks avoid orphaned headers/tables

---

## Version History

**v2.0.0** (2025-11-21)
- Complete redesign to modern minimalist aesthetic
- Replaced serif fonts with Arial throughout
- Updated color palette to match QuanHo.io brand
- Changed margins from 1.25in to 0.75in
- Implemented HTML tables with accent blue headers
- Added gradient dividers and callout boxes
- Established consistent text weights

**v1.0.0** (Previous)
- Quiet luxury design with EB Garamond
- Navy/gold color scheme
- 1.25in margins

---

**Design Philosophy**: Clean, modern, professional - optimized for institutional investment committee presentations.
