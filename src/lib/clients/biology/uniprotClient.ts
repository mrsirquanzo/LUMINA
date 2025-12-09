/**
 * UniProt REST API Client
 * Base URL: https://rest.uniprot.org/uniprotkb
 * No authentication required.
 * 
 * Key queries:
 * - Protein function description
 * - Subcellular localization
 * - Protein family/class
 * - Cross-references (PDB, etc.)
 */
import { Cache } from '../../utils/biology/cache';
import { withRetry, RateLimiter } from '../../utils/biology/rateLimiter';

export interface UniProtProtein {
  uniprotId: string;
  entryName: string;
  proteinName: string;
  geneName: string;
  organism: string;
  function: string;
  subcellularLocations: string[];
  proteinFamilies: string[];
  pdbIds: string[];
  keywords: string[];
  sequence: {
    length: number;
    mass: number;
  };
}

export class UniProtClient {
  private readonly baseUrl = 'https://rest.uniprot.org/uniprotkb';
  private cache = new Cache<unknown>(168); // 7 day cache (stable data)
  private rateLimiter = new RateLimiter(10);

  /**
   * Get protein info by gene symbol.
   */
  async getProteinInfo(geneSymbol: string, organism: string = 'human'): Promise<UniProtProtein | null> {
    const cacheKey = `uniprot:${geneSymbol}:${organism}`;
    const cached = this.cache.get(cacheKey) as UniProtProtein | undefined;
    if (cached) return cached;

    await this.rateLimiter.acquire();

    try {
      // Search for the gene
      const searchUrl = new URL(`${this.baseUrl}/search`);
      searchUrl.searchParams.set('query', `gene:${geneSymbol} AND organism_name:${organism}`);
      searchUrl.searchParams.set('format', 'json');
      searchUrl.searchParams.set('size', '1');
      searchUrl.searchParams.set(
        'fields',
        'accession,id,protein_name,gene_names,organism_name,cc_function,cc_subcellular_location,protein_families,xref_pdb,keyword,sequence'
      );

      const response = await withRetry(async () => {
        const res = await fetch(searchUrl.toString());
        if (!res.ok) throw new Error(`UniProt API error: ${res.status}`);
        return res.json();
      });

      const result = response.results?.[0];
      if (!result) return null;

      const protein: UniProtProtein = {
        uniprotId: result.primaryAccession,
        entryName: result.uniProtkbId,
        proteinName: result.proteinDescription?.recommendedName?.fullName?.value ?? '',
        geneName: result.genes?.[0]?.geneName?.value ?? geneSymbol,
        organism: result.organism?.scientificName ?? organism,
        function: this.extractFunction(result.comments),
        subcellularLocations: this.extractSubcellularLocations(result.comments),
        proteinFamilies: result.proteinFamilies?.map((f: { value: string }) => f.value) ?? [],
        pdbIds: result.uniProtKBCrossReferences
          ?.filter((x: { database: string }) => x.database === 'PDB')
          .map((x: { id: string }) => x.id) ?? [],
        keywords: result.keywords?.map((k: { name: string }) => k.name) ?? [],
        sequence: {
          length: result.sequence?.length ?? 0,
          mass: result.sequence?.molWeight ?? 0,
        },
      };

      this.cache.set(cacheKey, protein);
      return protein;
    } catch (error) {
      console.error(`[UniProtClient] Failed to fetch UniProt data for ${geneSymbol}:`, error);
      return null;
    }
  }

  /**
   * Extract function description from comments.
   */
  private extractFunction(comments: Array<{ commentType: string; texts?: Array<{ value: string }> }> | undefined): string {
    const functionComment = comments?.find(c => c.commentType === 'FUNCTION');
    return functionComment?.texts?.map(t => t.value).join(' ') ?? '';
  }

  /**
   * Extract subcellular locations from comments.
   */
  private extractSubcellularLocations(comments: Array<{
    commentType: string;
    subcellularLocations?: Array<{
      location: { value: string };
    }>;
  }> | undefined): string[] {
    const locationComment = comments?.find(c => c.commentType === 'SUBCELLULAR LOCATION');
    return locationComment?.subcellularLocations?.map(l => l.location.value) ?? [];
  }

  /**
   * Get PDB structure IDs for this protein.
   */
  async getPdbReferences(uniprotId: string): Promise<string[]> {
    const protein = await this.getProteinByAccession(uniprotId);
    return protein?.pdbIds ?? [];
  }

  /**
   * Get protein by UniProt accession.
   */
  async getProteinByAccession(accession: string): Promise<UniProtProtein | null> {
    const cacheKey = `uniprot:acc:${accession}`;
    const cached = this.cache.get(cacheKey) as UniProtProtein | undefined;
    if (cached) return cached;

    await this.rateLimiter.acquire();

    try {
      const url = new URL(`${this.baseUrl}/${accession}`);
      url.searchParams.set('format', 'json');

      const response = await withRetry(async () => {
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`UniProt API error: ${res.status}`);
        return res.json();
      });

      const protein: UniProtProtein = {
        uniprotId: response.primaryAccession,
        entryName: response.uniProtkbId,
        proteinName: response.proteinDescription?.recommendedName?.fullName?.value ?? '',
        geneName: response.genes?.[0]?.geneName?.value ?? '',
        organism: response.organism?.scientificName ?? '',
        function: this.extractFunction(response.comments),
        subcellularLocations: this.extractSubcellularLocations(response.comments),
        proteinFamilies: response.proteinFamilies?.map((f: { value: string }) => f.value) ?? [],
        pdbIds: response.uniProtKBCrossReferences
          ?.filter((x: { database: string }) => x.database === 'PDB')
          .map((x: { id: string }) => x.id) ?? [],
        keywords: response.keywords?.map((k: { name: string }) => k.name) ?? [],
        sequence: {
          length: response.sequence?.length ?? 0,
          mass: response.sequence?.molWeight ?? 0,
        },
      };

      this.cache.set(cacheKey, protein);
      return protein;
    } catch (error) {
      console.error(`[UniProtClient] Failed to fetch UniProt data for ${accession}:`, error);
      return null;
    }
  }

  /**
   * Determine protein class from keywords and families.
   */
  classifyProtein(protein: UniProtProtein): string {
    const keywords = protein.keywords.map(k => k.toLowerCase());
    const families = protein.proteinFamilies.map(f => f.toLowerCase());
    const combined = [...keywords, ...families].join(' ');

    if (combined.includes('kinase')) return 'Kinase';
    if (combined.includes('gpcr') || combined.includes('g-protein coupled')) return 'GPCR';
    if (combined.includes('ion channel')) return 'Ion Channel';
    if (combined.includes('nuclear receptor')) return 'Nuclear Receptor';
    if (combined.includes('protease') || combined.includes('peptidase')) return 'Protease';
    if (combined.includes('phosphatase')) return 'Phosphatase';
    if (combined.includes('transporter')) return 'Transporter';
    if (combined.includes('receptor')) return 'Receptor';
    if (combined.includes('enzyme')) return 'Enzyme';
    if (protein.subcellularLocations.some(l => l.toLowerCase().includes('membrane'))) {
      return 'Membrane Protein';
    }
    if (protein.subcellularLocations.some(l => l.toLowerCase().includes('secreted'))) {
      return 'Secreted Protein';
    }

    return 'Other';
  }
}
