import { Router, Request, Response } from 'express';
import * as cheerio from 'cheerio';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI Agent/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch URL: ${response.statusText}`,
      });
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

    // Truncate if too long
    const MAX_LENGTH = 100000;
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

    res.json({
      success: true,
      url,
      title,
      description,
      content: formattedContent,
    });

  } catch (error: any) {
    console.error('URL fetch error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch URL',
    });
  }
});

export default router;
