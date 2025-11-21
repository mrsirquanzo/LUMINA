/**
 * API Route: Export Chat to Professional PDF
 *
 * Transforms agent conversations into professional business intelligence reports
 * Removes chat UI elements and applies institutional-grade styling
 */

import { NextRequest, NextResponse } from 'next/server';
import { marked } from 'marked';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 60; // 1 minute for PDF generation

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  cost?: number;
}

/**
 * Clean markdown content - remove cost displays and fix symbols
 */
function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/Cost estimate:?\s*\$[\d.]+/gi, '')
    .replace(/Analysis (cost|completed).*?\$[\d.]+/gi, '')
    .replace(/Total cost:?\s*\$[\d.]+/gi, '')
    .replace(/\$\d+\.\d{4}/g, '')
    .replace(/• '/g, '✓')
    .replace(/▌/g, '★')
    .replace(/Cost:?\s*\$[\d.]+/gi, '')
    .replace(/Estimated cost:?\s*\$[\d.]+/gi, '')
    .trim();
}

/**
 * Enhance comparison tables with winner cell highlighting
 */
function enhanceComparisonTable(html: string): string {
  let enhanced = html;

  // Pattern matches for typical winner values in comparison tables
  const winnerPatterns = [
    />\s*(79\.7%|80%|81%|[7-8]\d\.\d+%)\s*</g,
    />\s*(28\.8\s*mo|29\s*mo|30\s*mo|2[89]\.\d+\s*mo)\s*</g,
    />\s*(\$3\.\d+B|\$[34]\.\d+B)\s*</g,
    />\s*(★|⭐)\s*</g,
  ];

  winnerPatterns.forEach(pattern => {
    enhanced = enhanced.replace(pattern, (match, value) => {
      return `><span class="winner-cell">${value} <span class="winner-badge">★</span></span><`;
    });
  });

  return enhanced;
}

/**
 * Enhance recommendations with colored boxes
 */
function enhanceRecommendations(html: string): string {
  let enhanced = html;

  // Wrap STRONG BUY, BUY, HOLD, SELL in colored boxes
  const ratingPatterns = [
    { pattern: /(STRONG BUY)/g, class: 'strong-buy' },
    { pattern: /(BUY)(?!\s*recommendation)/gi, class: 'buy' },
    { pattern: /(HOLD)/g, class: 'hold' },
    { pattern: /(SELL)/g, class: 'sell' },
  ];

  ratingPatterns.forEach(({ pattern, class: cssClass }) => {
    enhanced = enhanced.replace(pattern, (match) => {
      return `<div class="recommendation-box ${cssClass}">
        <div class="recommendation-header">${match}</div>
      </div>`;
    });
  });

  return enhanced;
}

/**
 * Get professional report CSS styles
 */
function getProfessionalReportStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1f2937;
      background: white;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      page-break-after: always;
      position: relative;
    }

    .cover-page h1 {
      font-size: 48pt;
      font-weight: 700;
      margin-bottom: 32px;
      letter-spacing: -0.02em;
    }

    .cover-page h2 {
      font-size: 28pt;
      font-weight: 400;
      margin-bottom: 24px;
      opacity: 0.95;
    }

    .cover-page .meta {
      font-size: 14pt;
      opacity: 0.9;
      text-align: center;
      line-height: 2;
    }

    .cover-page .footer {
      position: absolute;
      bottom: 60px;
      left: 60px;
      right: 60px;
      text-align: center;
      font-size: 10pt;
      opacity: 0.8;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    .content {
      padding: 0.75in;
      max-width: 8.5in;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      color: #1e40af;
      margin-top: 32px;
      margin-bottom: 16px;
      line-height: 1.4;
      page-break-after: avoid;
    }

    h1 { font-size: 24pt; margin-top: 40px; }
    h2 { font-size: 18pt; margin-top: 36px; }
    h3 { font-size: 14pt; margin-top: 28px; }

    p {
      margin-bottom: 14px;
      line-height: 1.7;
      text-align: justify;
    }

    ul, ol {
      margin: 18px 0;
      padding-left: 28px;
    }

    li {
      margin-bottom: 10px;
      line-height: 1.7;
    }

    strong {
      font-weight: 600;
      color: #1f2937;
    }

    em {
      font-style: italic;
      color: #4b5563;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    thead {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #2563eb;
    }

    td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
    }

    tbody tr:nth-child(even) {
      background-color: #f9fafb;
    }

    tbody tr:hover {
      background-color: #f3f4f6;
    }

    /* Winner cell styling */
    .winner-cell {
      background-color: #dbeafe !important;
      font-weight: 700;
      color: #1e40af;
      padding: 6px 12px;
      border-radius: 4px;
      display: inline-block;
    }

    .winner-badge {
      color: #f59e0b;
      margin-left: 4px;
      font-size: 12pt;
    }

    /* Recommendation boxes */
    .recommendation-box {
      margin: 24px 0;
      padding: 20px;
      border-radius: 8px;
      page-break-inside: avoid;
    }

    .recommendation-box .recommendation-header {
      font-size: 16pt;
      font-weight: 700;
      padding: 12px 20px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 12px;
    }

    .recommendation-box.strong-buy .recommendation-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
    }

    .recommendation-box.buy .recommendation-header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .recommendation-box.hold .recommendation-header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .recommendation-box.sell .recommendation-header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
    }

    hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 36px 0;
      page-break-after: avoid;
    }

    @media print {
      .cover-page {
        page-break-after: always;
      }

      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }

      table, figure, img {
        page-break-inside: avoid;
      }

      ul, ol {
        page-break-inside: avoid;
      }

      .recommendation-box {
        page-break-inside: avoid;
      }
    }
  `;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, agentName } = body as {
      messages: ChatMessage[];
      agentName: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Transform chat messages into professional report content
    // Combine all assistant responses into flowing content, skip user messages
    let reportContent = '';

    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        reportContent += msg.content + '\n\n';
      }
    });

    // Clean and parse markdown to HTML
    const cleanedMarkdown = cleanMarkdown(reportContent);
    let htmlContent = await marked.parse(cleanedMarkdown);

    // Apply enhancements
    htmlContent = enhanceComparisonTable(htmlContent);
    htmlContent = enhanceRecommendations(htmlContent);

    // Build complete HTML document
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlDocument = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${agentName} - Business Intelligence Report</title>
  <style>
    ${getProfessionalReportStyles()}
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>BUSINESS INTELLIGENCE REPORT</h1>
    <h2>${agentName}</h2>
    <div class="meta">
      <div>Generated: ${timestamp}</div>
    </div>
    <div class="footer">
      <strong>CONFIDENTIAL:</strong> This document contains proprietary information and is intended solely
      for the use of the designated recipient(s). Unauthorized distribution or disclosure is prohibited.
    </div>
  </div>

  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>
    `;

    // Generate PDF using puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(htmlDocument, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.75in',
          bottom: '0.5in',
          left: '0.75in'
        }
      });

      await browser.close();

      const filename = `${agentName.toLowerCase().replace(/\s+/g, '-')}-report-${Date.now()}.pdf`;

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
    console.error('[Export Chat] PDF generation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
