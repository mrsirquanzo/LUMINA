import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI Agent/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse HTML and extract text content
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content tags
    $('script, style, nav, footer, aside, iframe, noscript').remove();

    // Extract title
    const title = $('title').text().trim();

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract main content
    // Try to find main content area
    let mainContent = '';

    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content',
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContent = element.text().trim();
        break;
      }
    }

    // If no main content found, extract from body
    if (!mainContent) {
      mainContent = $('body').text().trim();
    }

    // Clean up whitespace
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Truncate if too long (Claude has context limits)
    const MAX_LENGTH = 100000; // ~100k characters
    if (mainContent.length > MAX_LENGTH) {
      mainContent = mainContent.substring(0, MAX_LENGTH) + '\n\n[Content truncated...]';
    }

    // Format content
    const formattedContent = `
URL: ${url}
Title: ${title}
${description ? `Description: ${description}\n` : ''}
---

${mainContent}
    `.trim();

    return NextResponse.json({
      success: true,
      url,
      title,
      description,
      content: formattedContent,
    });

  } catch (error: any) {
    console.error('URL fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}
