/**
 * gnomAD GraphQL API Client
 * Base URL: https://gnomad.broadinstitute.org/api
 * No authentication required.
 * 
 * Key queries:
 * - Gene constraint metrics (pLI, LOEUF, mis_z)
 * - Loss-of-function variant counts
 * - Homozygous LoF carriers
 */
import { Cache } from '../../utils/biology/cache';
import { withRetry } from '../../utils/biology/rateLimiter';
import type { ConstraintMetrics } from '../../models/biology/targetBiology';

export interface GnomadGeneConstraint {
  pli: number | null;
  loeuf: number | null;
  misZ: number | null;
  lofCount: number;
  lofHomozygotes: number;
}

export interface LofVariant {
  variantId: string;
  consequence: string;
  alleleFrequency: number;
  homozygoteCount: number;
}

export class GnomadClient {
  private readonly baseUrl = 'https://gnomad.broadinstitute.org/api';
  private cache = new Cache<unknown>(168); // 7 day cache (stable data)

  /**
   * Execute GraphQL query against gnomAD API.
   */
  private async query<T>(graphqlQuery: string, variables: Record<string, unknown> = {}): Promise<T> {
    const cacheKey = `gnomad:${JSON.stringify({ query: graphqlQuery, variables })}`;
    const cached = this.cache.get(cacheKey) as T | undefined;
    if (cached) return cached;

    const response = await withRetry(async () => {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery, variables }),
      });

      if (!res.ok) {
        throw new Error(`gnomAD API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    }, { maxRetries: 3, baseDelayMs: 2000 });

    if (response.errors) {
      console.warn('[GnomadClient] GraphQL warnings:', response.errors);
    }

    this.cache.set(cacheKey, response.data);
    return response.data as T;
  }

  /**
   * Get constraint metrics for a gene.
   * Returns: pLI, LOEUF, mis_z, observed LoF count, homozygous LoF count
   */
  async getGeneConstraint(geneSymbol: string): Promise<GnomadGeneConstraint | null> {
    const query = `
      query GeneConstraint($symbol: String!) {
        gene(gene_symbol: $symbol, reference_genome: GRCh38) {
          gene_id
          symbol
          gnomad_constraint {
            pLI
            oe_lof_upper
            mis_z
            exp_lof
            obs_lof
          }
          variants(dataset: gnomad_r4) {
            consequence
            genome {
              homozygote_count
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        gene: {
          gene_id: string;
          symbol: string;
          gnomad_constraint: {
            pLI: number | null;
            oe_lof_upper: number | null;
            mis_z: number | null;
            exp_lof: number | null;
            obs_lof: number | null;
          } | null;
          variants: Array<{
            consequence: string;
            genome: { homozygote_count: number } | null;
          }>;
        } | null;
      }>(query, { symbol: geneSymbol.toUpperCase() });

      if (!data.gene) return null;

      const constraint = data.gene.gnomad_constraint;

      // Count LoF variants and homozygotes
      const lofConsequences = [
        'frameshift_variant',
        'stop_gained',
        'splice_donor_variant',
        'splice_acceptor_variant',
      ];

      const lofVariants = data.gene.variants?.filter(v =>
        lofConsequences.some(c => v.consequence?.includes(c))
      ) ?? [];

      const lofHomozygotes = lofVariants.reduce(
        (sum, v) => sum + (v.genome?.homozygote_count ?? 0),
        0
      );

      return {
        pli: constraint?.pLI ?? null,
        loeuf: constraint?.oe_lof_upper ?? null,
        misZ: constraint?.mis_z ?? null,
        lofCount: constraint?.obs_lof ?? lofVariants.length,
        lofHomozygotes,
      };
    } catch (error) {
      console.error(`[GnomadClient] Failed to fetch constraint for ${geneSymbol}:`, error);
      return null;
    }
  }

  /**
   * Get loss-of-function variants and their frequencies.
   */
  async getLofVariants(geneSymbol: string, limit: number = 50): Promise<LofVariant[]> {
    const query = `
      query LofVariants($symbol: String!) {
        gene(gene_symbol: $symbol, reference_genome: GRCh38) {
          variants(dataset: gnomad_r4) {
            variant_id
            consequence
            genome {
              af
              homozygote_count
            }
            exome {
              af
              homozygote_count
            }
          }
        }
      }
    `;

    try {
      const data = await this.query<{
        gene: {
          variants: Array<{
            variant_id: string;
            consequence: string;
            genome: { af: number; homozygote_count: number } | null;
            exome: { af: number; homozygote_count: number } | null;
          }>;
        } | null;
      }>(query, { symbol: geneSymbol.toUpperCase() });

      if (!data.gene?.variants) return [];

      const lofConsequences = [
        'frameshift_variant',
        'stop_gained',
        'splice_donor_variant',
        'splice_acceptor_variant',
        'start_lost',
        'stop_lost',
      ];

      return data.gene.variants
        .filter(v => lofConsequences.some(c => v.consequence?.includes(c)))
        .slice(0, limit)
        .map(v => ({
          variantId: v.variant_id,
          consequence: v.consequence,
          alleleFrequency: v.genome?.af ?? v.exome?.af ?? 0,
          homozygoteCount: (v.genome?.homozygote_count ?? 0) + (v.exome?.homozygote_count ?? 0),
        }));
    } catch (error) {
      console.error(`[GnomadClient] Failed to fetch LoF variants for ${geneSymbol}:`, error);
      return [];
    }
  }

  /**
   * Interpret constraint metrics into human-readable assessment.
   */
  interpretConstraint(constraint: GnomadGeneConstraint): ConstraintMetrics {
    let interpretation = '';

    if (constraint.pli !== null) {
      if (constraint.pli > 0.9) {
        interpretation = 'Highly intolerant to loss-of-function variants (pLI > 0.9). ';
        interpretation += 'Strong selection against LoF suggests essential gene function. ';
      } else if (constraint.pli > 0.5) {
        interpretation = 'Moderately intolerant to loss-of-function variants. ';
      } else {
        interpretation = 'Tolerant to loss-of-function variants. ';
        interpretation += 'LoF variants observed in population suggest potential safety window. ';
      }
    }

    if (constraint.loeuf !== null) {
      if (constraint.loeuf < 0.35) {
        interpretation += 'Very constrained (LOEUF < 0.35). ';
      } else if (constraint.loeuf < 0.6) {
        interpretation += 'Constrained (LOEUF < 0.6). ';
      }
    }

    if (constraint.lofHomozygotes > 0) {
      interpretation += `${constraint.lofHomozygotes} homozygous LoF carriers observed - `;
      interpretation += 'natural human knockouts may inform on-target effects. ';
    }

    return {
      pli: constraint.pli,
      loeuf: constraint.loeuf,
      misZ: constraint.misZ,
      lofVariantsObserved: constraint.lofCount,
      lofHomozygotes: constraint.lofHomozygotes,
      interpretation: interpretation.trim(),
    };
  }
}
