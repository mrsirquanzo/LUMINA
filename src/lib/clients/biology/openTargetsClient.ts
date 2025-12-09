/**
 * Open Targets Platform GraphQL API Client
 * Base URL: https://api.platform.opentargets.org/api/v4/graphql
 * No authentication required.
 * 
 * Key queries:
 * - Target-disease associations
 * - Genetic associations (GWAS, gene burden)
 * - Known drugs for target
 * - Tractability assessments
 */
import { Cache } from '../../utils/biology/cache';
import { withRetry } from '../../utils/biology/rateLimiter';

export interface TargetInfo {
  id: string;
  approvedSymbol: string;
  approvedName: string;
  biotype?: string;
}

export interface DiseaseAssociation {
  diseaseId: string;
  diseaseName: string;
  score: number;
  evidenceTypes: string[];
}

export interface Tractability {
  smallMolecule?: {
    topCategory?: string;
    buckets?: number[];
  };
  antibody?: {
    topCategory?: string;
    buckets?: number[];
  };
}

export interface KnownDrug {
  drugId: string;
  drugName: string;
  mechanismOfAction: string;
  phase: number;
  status: string;
  diseaseId: string;
  diseaseName: string;
}

export class OpenTargetsClient {
  private readonly baseUrl = 'https://api.platform.opentargets.org/api/v4/graphql';
  private cache = new Cache<unknown>(24); // 24 hour cache

  /**
   * Execute GraphQL query against Open Targets API.
   */
  private async query<T>(graphqlQuery: string, variables: Record<string, unknown> = {}): Promise<T> {
    const cacheKey = `ot:${JSON.stringify({ query: graphqlQuery, variables })}`;
    const cached = this.cache.get(cacheKey) as T | undefined;
    if (cached) return cached;

    const response = await withRetry(async () => {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery, variables }),
      });

      if (!res.ok) {
        throw new Error(`Open Targets API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    });

    if (response.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    this.cache.set(cacheKey, response.data);
    return response.data as T;
  }

  /**
   * Get target ID and basic info from gene symbol.
   */
  async getTargetInfo(geneSymbol: string): Promise<TargetInfo | null> {
    const query = `
      query TargetInfo($symbol: String!) {
        search(queryString: $symbol, entityNames: ["target"], page: { size: 1 }) {
          hits {
            id
            entity
            object {
              ... on Target {
                id
                approvedSymbol
                approvedName
                biotype
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        search: {
          hits: Array<{
            id: string;
            object: {
              id: string;
              approvedSymbol: string;
              approvedName: string;
              biotype?: string;
            };
          }>;
        };
      }>(query, { symbol: geneSymbol });

      const hit = data.search.hits.find(
        h => h.object?.approvedSymbol?.toUpperCase() === geneSymbol.toUpperCase()
      );

      if (!hit?.object) return null;

      return {
        id: hit.object.id,
        approvedSymbol: hit.object.approvedSymbol,
        approvedName: hit.object.approvedName,
        biotype: hit.object.biotype,
      };
    } catch (error) {
      console.error(`[OpenTargetsClient] Failed to get target info for ${geneSymbol}:`, error);
      return null;
    }
  }

  /**
   * Get target-disease associations with scores and evidence types.
   */
  async getDiseaseAssociations(
    targetId: string,
    options: { indication?: string; limit?: number } = {}
  ): Promise<DiseaseAssociation[]> {
    const { indication, limit = 25 } = options;

    const query = `
      query DiseaseAssociations($targetId: String!, $size: Int!) {
        target(ensemblId: $targetId) {
          associatedDiseases(page: { size: $size }) {
            rows {
              disease {
                id
                name
              }
              score
              datatypeScores {
                componentId
                score
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        target: {
          associatedDiseases: {
            rows: Array<{
              disease: { id: string; name: string };
              score: number;
              datatypeScores: Array<{ componentId: string; score: number }>;
            }>;
          };
        };
      }>(query, { targetId, size: limit });

      let associations = data.target?.associatedDiseases?.rows ?? [];

      // Filter by indication if provided
      if (indication) {
        const indicationLower = indication.toLowerCase();
        associations = associations.filter(a =>
          a.disease.name.toLowerCase().includes(indicationLower)
        );
      }

      return associations.map(a => ({
        diseaseId: a.disease.id,
        diseaseName: a.disease.name,
        score: a.score,
        evidenceTypes: a.datatypeScores
          ?.filter(d => d.score > 0)
          .map(d => d.componentId) ?? [],
      }));
    } catch (error) {
      console.error(`[OpenTargetsClient] Failed to get disease associations for ${targetId}:`, error);
      return [];
    }
  }

  /**
   * Get tractability assessments (small molecule, antibody, etc.).
   */
  async getTractability(targetId: string): Promise<Tractability> {
    const query = `
      query Tractability($targetId: String!) {
        target(ensemblId: $targetId) {
          tractability {
            smallmolecule {
              topCategory
              buckets
            }
            antibody {
              topCategory
              buckets
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        target: {
          tractability: {
            smallmolecule?: { topCategory?: string; buckets?: number[] };
            antibody?: { topCategory?: string; buckets?: number[] };
          };
        };
      }>(query, { targetId });

      const tract = data.target?.tractability ?? {};
      return {
        smallMolecule: tract.smallmolecule,
        antibody: tract.antibody,
      };
    } catch (error) {
      console.error(`[OpenTargetsClient] Failed to get tractability for ${targetId}:`, error);
      return {};
    }
  }

  /**
   * Get approved and clinical-stage drugs for this target.
   */
  async getKnownDrugs(targetId: string): Promise<KnownDrug[]> {
    const query = `
      query KnownDrugs($targetId: String!) {
        target(ensemblId: $targetId) {
          knownDrugs(page: { size: 100 }) {
            rows {
              drug {
                id
                name
                mechanismsOfAction {
                  rows {
                    mechanismOfAction
                  }
                }
              }
              phase
              status
              disease {
                id
                name
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        target: {
          knownDrugs: {
            rows: Array<{
              drug: {
                id: string;
                name: string;
                mechanismsOfAction?: { rows: Array<{ mechanismOfAction: string }> };
              };
              phase: number;
              status: string;
              disease: { id: string; name: string };
            }>;
          };
        };
      }>(query, { targetId });

      return (data.target?.knownDrugs?.rows ?? []).map(row => ({
        drugId: row.drug.id,
        drugName: row.drug.name,
        mechanismOfAction: row.drug.mechanismsOfAction?.rows?.[0]?.mechanismOfAction ?? '',
        phase: row.phase,
        status: row.status,
        diseaseId: row.disease.id,
        diseaseName: row.disease.name,
      }));
    } catch (error) {
      console.error(`[OpenTargetsClient] Failed to get known drugs for ${targetId}:`, error);
      return [];
    }
  }
}
