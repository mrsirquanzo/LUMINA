/**
 * PubMed/NCBI E-utilities Client
 * Base URL: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/
 * API key recommended for higher rate limits (10/sec vs 3/sec).
 * 
 * Key endpoints:
 * - esearch: Search for publications
 * - efetch: Retrieve abstracts
 */
import { Cache } from '../../utils/biology/cache';
import { withRetry, RateLimiter } from '../../utils/biology/rateLimiter';
import type { Publication } from '../../models/biology/targetBiology';

export interface PubMedSearchResult {
  pmids: string[];
  count: number;
  queryTranslation: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  doi?: string;
  publicationTypes: string[];
  meshTerms: string[];
}

export class PubMedClient {
  private readonly baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private cache = new Cache<unknown>(24);
  private rateLimiter: RateLimiter;
  private apiKey?: string;

  constructor(apiKey?: string) {
    // Check for API key in multiple environment variable names for compatibility
    this.apiKey = apiKey ?? process.env.NCBI_API_KEY ?? process.env.PUBMED_API_KEY;
    // 10 req/sec with API key, 3 req/sec without
    this.rateLimiter = new RateLimiter(this.apiKey ? 10 : 3);
  }

  /**
   * Build URL with optional API key.
   */
  private buildUrl(endpoint: string, params: Record<string, string>): URL {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey);
    }
    return url;
  }

  /**
   * Search PubMed, return list of PMIDs.
   */
  async search(
    query: string,
    options: { maxResults?: number; sort?: 'relevance' | 'date' } = {}
  ): Promise<PubMedSearchResult> {
    const { maxResults = 50, sort = 'relevance' } = options;

    const cacheKey = `pubmed:search:${query}:${maxResults}:${sort}`;
    const cached = this.cache.get(cacheKey) as PubMedSearchResult | undefined;
    if (cached) return cached;

    await this.rateLimiter.acquire();

    const url = this.buildUrl('esearch.fcgi', {
      db: 'pubmed',
      term: query,
      retmax: String(maxResults),
      sort: sort === 'date' ? 'pub_date' : 'relevance',
      retmode: 'json',
    });

    const response = await withRetry(async () => {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`PubMed API error: ${res.status}`);
      return res.json();
    });

    const result: PubMedSearchResult = {
      pmids: response.esearchresult?.idlist ?? [],
      count: parseInt(response.esearchresult?.count ?? '0', 10),
      queryTranslation: response.esearchresult?.querytranslation ?? '',
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Fetch article details including abstracts.
   */
  async fetchArticles(pmids: string[]): Promise<PubMedArticle[]> {
    if (pmids.length === 0) return [];

    const cacheKey = `pubmed:fetch:${pmids.sort().join(',')}`;
    const cached = this.cache.get(cacheKey) as PubMedArticle[] | undefined;
    if (cached) return cached;

    await this.rateLimiter.acquire();

    const url = this.buildUrl('efetch.fcgi', {
      db: 'pubmed',
      id: pmids.join(','),
      rettype: 'abstract',
      retmode: 'xml',
    });

    const response = await withRetry(async () => {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`PubMed API error: ${res.status}`);
      return res.text();
    });

    const articles = this.parseXmlResponse(response);
    this.cache.set(cacheKey, articles);
    return articles;
  }

  /**
   * Parse PubMed XML response into structured articles.
   * Note: For production, consider using a proper XML parser like fast-xml-parser.
   */
  private parseXmlResponse(xml: string): PubMedArticle[] {
    const articles: PubMedArticle[] = [];
    
    // Simple regex-based parsing (replace with proper XML parser in production)
    const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) ?? [];

    for (const articleXml of articleMatches) {
      try {
        const pmid = this.extractXmlValue(articleXml, 'PMID') ?? '';
        const title = this.extractXmlValue(articleXml, 'ArticleTitle') ?? '';
        const abstractText = this.extractXmlValue(articleXml, 'AbstractText') ?? '';
        const journal = this.extractXmlValue(articleXml, 'Title') ?? '';
        const yearStr = this.extractXmlValue(articleXml, 'Year') ?? '';

        // Extract authors
        const authorMatches = articleXml.match(/<Author[\s\S]*?<\/Author>/g) ?? [];
        const authors = authorMatches
          .map(a => {
            const lastName = this.extractXmlValue(a, 'LastName') ?? '';
            const initials = this.extractXmlValue(a, 'Initials') ?? '';
            return `${lastName} ${initials}`.trim();
          })
          .filter(Boolean)
          .slice(0, 5)
          .join(', ');

        // Extract DOI
        const doiMatch = articleXml.match(/doi:\s*([^\s<]+)/i);
        const doi = doiMatch?.[1];

        // Extract publication types
        const pubTypeMatches = articleXml.match(/<PublicationType[^>]*>([^<]+)<\/PublicationType>/g) ?? [];
        const publicationTypes = pubTypeMatches
          .map(p => p.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);

        // Extract MeSH terms
        const meshMatches = articleXml.match(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g) ?? [];
        const meshTerms = meshMatches
          .map(m => m.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);

        articles.push({
          pmid,
          title: this.decodeHtmlEntities(title),
          authors,
          journal: this.decodeHtmlEntities(journal),
          year: parseInt(yearStr, 10) || new Date().getFullYear(),
          abstract: this.decodeHtmlEntities(abstractText),
          doi,
          publicationTypes,
          meshTerms,
        });
      } catch (error) {
        console.warn('[PubMedClient] Failed to parse article:', error);
      }
    }

    return articles;
  }

  /**
   * Extract value from XML tag.
   */
  private extractXmlValue(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim();
  }

  /**
   * Decode HTML entities.
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Search for publications about a target.
   */
  async searchTargetPublications(
    geneSymbol: string,
    options: {
      indication?: string;
      publicationTypes?: string[];
      yearsBack?: number;
      maxResults?: number;
    } = {}
  ): Promise<Publication[]> {
    const { indication, publicationTypes, yearsBack = 10, maxResults = 50 } = options;

    // Build search query
    let query = `${geneSymbol}[Title/Abstract]`;

    if (indication) {
      query += ` AND ${indication}[Title/Abstract]`;
    }

    if (publicationTypes?.length) {
      const ptQuery = publicationTypes.map(pt => `"${pt}"[Publication Type]`).join(' OR ');
      query += ` AND (${ptQuery})`;
    }

    // Add date filter
    const currentYear = new Date().getFullYear();
    query += ` AND ${currentYear - yearsBack}:${currentYear}[dp]`;

    const searchResult = await this.search(query, { maxResults });

    if (searchResult.pmids.length === 0) {
      return [];
    }

    const articles = await this.fetchArticles(searchResult.pmids);

    return articles.map(a => ({
      pmid: a.pmid,
      title: a.title,
      authors: a.authors,
      journal: a.journal,
      year: a.year,
      abstract: a.abstract,
      relevanceScore: 0, // Can be computed based on query match
      keyFindings: '', // To be extracted by LLM
    }));
  }

  /**
   * Search for mechanistic publications about a target.
   */
  async searchMechanisticPublications(
    geneSymbol: string,
    indication?: string,
    maxResults: number = 30
  ): Promise<Publication[]> {
    const mechanismTerms = [
      'mechanism',
      'pathway',
      'signaling',
      'function',
      'regulation',
      'role',
    ];

    let query = `${geneSymbol}[Title/Abstract] AND (${mechanismTerms.map(t => `${t}[Title/Abstract]`).join(' OR ')})`;

    if (indication) {
      query += ` AND ${indication}[Title/Abstract]`;
    }

    const searchResult = await this.search(query, { maxResults });
    const articles = await this.fetchArticles(searchResult.pmids);

    return articles.map(a => ({
      pmid: a.pmid,
      title: a.title,
      authors: a.authors,
      journal: a.journal,
      year: a.year,
      abstract: a.abstract,
      relevanceScore: 0,
      keyFindings: '',
    }));
  }

  /**
   * Search for preclinical publications about a target.
   */
  async searchPreclinicalPublications(
    geneSymbol: string,
    indication?: string,
    maxResults: number = 30
  ): Promise<Publication[]> {
    const preclinicalTerms = [
      'mouse',
      'mice',
      'murine',
      'in vivo',
      'xenograft',
      'animal model',
      'preclinical',
    ];

    const preclinicalQuery = preclinicalTerms.map(t => `"${t}"[Title/Abstract]`).join(' OR ');
    let query = `${geneSymbol}[Title/Abstract] AND (${preclinicalQuery})`;

    if (indication) {
      query += ` AND ${indication}[Title/Abstract]`;
    }

    const searchResult = await this.search(query, { maxResults });
    const articles = await this.fetchArticles(searchResult.pmids);

    return articles.map(a => ({
      pmid: a.pmid,
      title: a.title,
      authors: a.authors,
      journal: a.journal,
      year: a.year,
      abstract: a.abstract,
      relevanceScore: 0,
      keyFindings: '',
    }));
  }
}
