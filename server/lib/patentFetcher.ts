/**
 * Patent Fetcher
 * Fetches patents from USPTO and EPO databases
 */

interface PatentFetchResult {
  number: string;
  title?: string;
  assignee?: string;
  filingDate?: string;
  publicationDate?: string;
  abstract?: string;
  claims?: string[];
  status: 'found' | 'not_found' | 'error';
  error?: string;
  source: 'uspto' | 'epo' | 'google_patents';
  url?: string;
}

/**
 * Fetch patent from USPTO
 */
export async function fetchUSPTOPatent(patentNumber: string): Promise<PatentFetchResult> {
  try {
    // Clean patent number (remove spaces, normalize format)
    const cleanNumber = patentNumber.replace(/\s+/g, '').toUpperCase();
    
    // USPTO Patent Public Search API (free, no API key required)
    // Alternative: Google Patents scraping or USPTO Bulk Data
    const usptoUrl = `https://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO1&Sect2=HITOFF&d=PALL&p=1&u=%2Fnetahtml%2FPTO%2Fsrchnum.htm&r=1&f=G&l=50&s1=${cleanNumber}.PN.`;
    
    // For now, return placeholder - actual implementation would:
    // 1. Scrape USPTO website or use their API
    // 2. Parse HTML/XML response
    // 3. Extract patent data
    
    return {
      number: cleanNumber,
      status: 'not_found',
      source: 'uspto',
      error: 'USPTO API integration pending. Please upload PDF files.',
      url: `https://patents.google.com/patent/${cleanNumber}`,
    };
  } catch (error: any) {
    return {
      number: patentNumber,
      status: 'error',
      source: 'uspto',
      error: error.message || 'Failed to fetch from USPTO',
    };
  }
}

/**
 * Fetch patent from EPO
 */
export async function fetchEPOPatent(patentNumber: string): Promise<PatentFetchResult> {
  try {
    // Clean patent number
    const cleanNumber = patentNumber.replace(/\s+/g, '').toUpperCase();
    
    // EPO Espacenet API (free, no API key required for basic access)
    // Alternative: OPS (Open Patent Services) API
    const epoUrl = `https://worldwide.espacenet.com/patent/search/family/result?q=PN%3D${cleanNumber}`;
    
    // For now, return placeholder - actual implementation would:
    // 1. Use EPO OPS API or scrape Espacenet
    // 2. Parse XML/JSON response
    // 3. Extract patent data
    
    return {
      number: cleanNumber,
      status: 'not_found',
      source: 'epo',
      error: 'EPO API integration pending. Please upload PDF files.',
      url: `https://worldwide.espacenet.com/patent/search/family/result?q=PN%3D${cleanNumber}`,
    };
  } catch (error: any) {
    return {
      number: patentNumber,
      status: 'error',
      source: 'epo',
      error: error.message || 'Failed to fetch from EPO',
    };
  }
}

/**
 * Fetch patent from Google Patents (fallback)
 */
export async function fetchGooglePatents(patentNumber: string): Promise<PatentFetchResult> {
  try {
    const cleanNumber = patentNumber.replace(/\s+/g, '').toUpperCase();
    
    // Google Patents doesn't have a public API, but we can construct URLs
    // For actual fetching, would need to scrape or use a service
    
    return {
      number: cleanNumber,
      status: 'not_found',
      source: 'google_patents',
      error: 'Google Patents integration pending. Please upload PDF files.',
      url: `https://patents.google.com/patent/${cleanNumber}`,
    };
  } catch (error: any) {
    return {
      number: patentNumber,
      status: 'error',
      source: 'google_patents',
      error: error.message || 'Failed to fetch from Google Patents',
    };
  }
}

/**
 * Fetch patent by number (tries multiple sources)
 */
export async function fetchPatent(patentNumber: string): Promise<PatentFetchResult> {
  // Determine source from patent number format
  const cleanNumber = patentNumber.replace(/\s+/g, '').toUpperCase();
  
  if (cleanNumber.startsWith('US')) {
    return fetchUSPTOPatent(cleanNumber);
  } else if (cleanNumber.startsWith('EP') || cleanNumber.startsWith('WO')) {
    return fetchEPOPatent(cleanNumber);
  } else {
    // Try Google Patents as fallback
    return fetchGooglePatents(cleanNumber);
  }
}

/**
 * Fetch multiple patents
 */
export async function fetchPatents(patentNumbers: string[]): Promise<PatentFetchResult[]> {
  const results = await Promise.all(
    patentNumbers.map((num) => fetchPatent(num))
  );
  return results;
}
