/**
 * API Route: Export Agent Analysis to Professional PDF Report
 *
 * Server-side endpoint for generating professional business intelligence reports
 * NO chat UI elements - pure business report format
 */

import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 60; // 1 minute for PDF generation

// Message interface
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO string from client
  cost?: number;
}

/**
 * Configure marked for proper markdown rendering
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Professional CSS styles for business intelligence reports
 * NO chat elements - clean professional document
 */
function getProfessionalReportStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: Letter;
      margin: 0.75in 1in;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }

    /* Title Page */
    .title-page {
      text-align: center;
      padding: 2in 1in;
    }

    .report-title {
      font-size: 32pt;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 18pt;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 12pt;
    }

    .report-subtitle {
      font-size: 14pt;
      color: #64748b;
      font-weight: 400;
      margin-bottom: 48pt;
    }

    .report-date {
      font-size: 11pt;
      color: #64748b;
      margin-bottom: 12pt;
    }

    .confidential-notice {
      font-size: 9pt;
      color: #64748b;
      margin-top: 72pt;
      font-style: italic;
    }

    /* Section Headers */
    h1 {
      font-size: 24pt;
      font-weight: 700;
      color: #2563eb;
      margin: 32pt 0 16pt 0;
      padding-bottom: 8pt;
      border-bottom: 2px solid #e5e7eb;
      page-break-after: avoid;
    }

    h2 {
      font-size: 18pt;
      font-weight: 600;
      color: #1f2937;
      margin: 24pt 0 12pt 0;
      page-break-after: avoid;
    }

    h3 {
      font-size: 14pt;
      font-weight: 600;
      color: #374151;
      margin: 18pt 0 10pt 0;
      page-break-after: avoid;
    }

    h4 {
      font-size: 12pt;
      font-weight: 600;
      color: #4b5563;
      margin: 14pt 0 8pt 0;
      page-break-after: avoid;
    }

    /* First h1 after title page */
    .content-section h1:first-of-type {
      margin-top: 0;
    }

    /* Body Text */
    p {
      margin: 0 0 12pt 0;
      text-align: justify;
    }

    /* Strong emphasis */
    strong, b {
      font-weight: 700;
      color: #0f172a;
    }

    em, i {
      font-style: italic;
      color: #374151;
    }

    /* Lists */
    ul, ol {
      margin: 12pt 0 16pt 24pt;
      padding: 0;
    }

    li {
      margin-bottom: 8pt;
      line-height: 1.6;
    }

    ul ul, ol ol, ul ol, ol ul {
      margin: 6pt 0 6pt 18pt;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20pt 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    thead {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    }

    th {
      color: white;
      font-weight: 600;
      padding: 12pt;
      text-align: left;
      border: 1px solid #1e40af;
    }

    td {
      padding: 10pt 12pt;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }

    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }

    tbody tr:nth-child(odd) {
      background-color: #ffffff;
    }

    /* Numeric columns right-align */
    td:last-child:not(:first-child),
    th:last-child:not(:first-child) {
      text-align: right;
    }

    /* Code Blocks */
    code {
      background: #f1f5f9;
      padding: 2pt 6pt;
      border-radius: 3pt;
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 10pt;
      color: #dc2626;
    }

    pre {
      background: #0f172a;
      color: #f1f5f9;
      padding: 12pt;
      border-radius: 6pt;
      overflow-x: auto;
      margin: 16pt 0;
      font-size: 9pt;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid #2563eb;
      padding-left: 16pt;
      margin: 16pt 0;
      font-style: italic;
      color: #4b5563;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      height: 1px;
      background: linear-gradient(to right, transparent, #cbd5e1, transparent);
      margin: 24pt 0;
    }

    /* Links */
    a {
      color: #2563eb;
      text-decoration: none;
    }

    /* Callout Boxes */
    .callout {
      background-color: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 16pt;
      margin: 16pt 0;
      page-break-inside: avoid;
    }

    .callout-title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 8pt;
      font-size: 12pt;
    }

    /* Recommendation Boxes */
    .recommendation {
      margin: 16pt 0;
      padding: 16pt;
      border-left: 4px solid #10b981;
      page-break-inside: avoid;
    }

    .recommendation.buy {
      border-left-color: #10b981;
      background-color: #f0fdf4;
    }

    .recommendation.strong-buy {
      border-left-color: #059669;
      background-color: #ecfdf5;
    }

    .recommendation.hold {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }

    .recommendation.sell {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }

    .recommendation-title {
      font-size: 14pt;
      font-weight: 700;
      margin-bottom: 8pt;
    }

    /* Page Breaks */
    .page-break {
      page-break-after: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* Content Sections */
    .content-section {
      margin-bottom: 24pt;
    }

    .section-divider {
      margin: 32pt 0;
      border-top: 1px solid #e5e7eb;
    }

    /* Analysis Request Box */
    .analysis-request {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6pt;
      padding: 16pt;
      margin: 20pt 0;
      page-break-inside: avoid;
    }

    .analysis-request-label {
      font-size: 10pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-bottom: 8pt;
    }

    .analysis-request-content {
      font-size: 11pt;
      color: #1a1a1a;
      font-style: italic;
    }

    /* Print Optimization */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }

      table, figure, .callout, .recommendation, .analysis-request {
        page-break-inside: avoid;
      }

      a {
        color: #2563eb;
        text-decoration: underline;
      }
    }
  `;
}

/**
 * Generate professional business report HTML
 * NO chat UI elements - structured as business intelligence report
 */
function generateProfessionalReportHTML(messages: ChatMessage[], agentName: string): string {
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Separate user queries and assistant responses
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  // Extract the main analysis request (first user message)
  const analysisRequest = userMessages.length > 0 ? userMessages[0].content : '';

  // Combine all assistant responses into structured sections
  const analysisContent = assistantMessages.map(msg => marked.parse(msg.content)).join('\n\n');

  return `
    <!-- Title Page -->
    <div class="title-page">
      <h1 class="report-title">${agentName}</h1>
      <p class="report-subtitle">Business Intelligence Report</p>
      <p class="report-date">${date}</p>
      <div class="confidential-notice">
        <p>CONFIDENTIAL</p>
        <p>This report contains proprietary analysis and is intended solely for authorized recipients.</p>
        <p>Unauthorized distribution or disclosure is prohibited.</p>
      </div>
    </div>

    <div class="page-break"></div>

    <!-- Main Content -->
    <div class="content-section">

      ${analysisRequest ? `
        <div class="analysis-request">
          <div class="analysis-request-label">Analysis Objective</div>
          <div class="analysis-request-content">${analysisRequest}</div>
        </div>
      ` : ''}

      ${analysisContent}

    </div>
  `;
}

/**
 * POST handler - generate professional business report PDF
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, agentName } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!agentName) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    console.log(`[Export Report] Generating professional report for ${agentName}...`);

    // Generate professional report HTML
    const bodyHTML = generateProfessionalReportHTML(messages, agentName);

    // Create complete HTML document
    const styledHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${agentName} - Business Intelligence Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    ${getProfessionalReportStyles()}
  </style>
</head>
<body>
  ${bodyHTML}
</body>
</html>
    `;

    // Generate PDF with Puppeteer
    let browser;
    try {
      const isServerless = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;

      if (isServerless) {
        browser = await puppeteer.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      } else {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });
      }

      const page = await browser.newPage();

      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      await page.setContent(styledHTML, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0.75in',
          right: '1in',
          bottom: '0.75in',
          left: '1in'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 9pt; color: #64748b; width: 100%; text-align: right; padding: 0 1in 0 0; font-family: Inter, sans-serif;">
            <span style="font-weight: 600;">${agentName}</span> <span style="opacity: 0.6;">| Business Intelligence Report</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 9pt; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 1in; font-family: Inter, sans-serif;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            <span style="opacity: 0.6;">CONFIDENTIAL</span>
          </div>
        `
      });

      await browser.close();

      console.log(`[Export Report] Professional report generated successfully (${pdfBuffer.length} bytes)`);

      // Return PDF as response
      const sanitizedName = agentName.replace(/[^a-zA-Z0-9-]/g, '-');
      const dateStamp = new Date().toISOString().split('T')[0];
      const filename = `${sanitizedName}_Business-Report_${dateStamp}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error) {
    console.error('[Export Report] PDF generation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate professional report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
