/**
 * ChEMBL REST API Client
 * Base URL: https://www.ebi.ac.uk/chembl/api/data
 * No authentication required.
 * Format: JSON (add .json to endpoints)
 * 
 * Key queries:
 * - Target search by gene name
 * - Compounds with bioactivity against target
 * - Mechanism of action
 */
import { Cache } from '../../utils/biology/cache';
import { withRetry, RateLimiter } from '../../utils/biology/rateLimiter';
import type { ChemicalMatter } from '../../models/biology/targetBiology';

export interface ChEMBLTarget {
  targetChemblId: string;
  prefName: string;
  targetType: string;
  organism: string;
}

export interface ChEMBLBioactivity {
  moleculeChemblId: string;
  moleculeName: string | null;
  activityType: string;
  activityValue: number | null;
  activityUnit: string | null;
  pchemblValue: number | null;
  assayType: string;
}

export interface ChEMBLMolecule {
  moleculeChemblId: string;
  prefName: string | null;
  maxPhase: number;
  moleculeType: string;
  firstApproval: number | null;
}

export class ChEMBLClient {
  private readonly baseUrl = 'https://www.ebi.ac.uk/chembl/api/data';
  private cache = new Cache<unknown>(24);
  private rateLimiter = new RateLimiter(5); // 5 req/sec

  /**
   * Make a request to ChEMBL API.
   */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}.json`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const cacheKey = `chembl:${url.toString()}`;
    const cached = this.cache.get(cacheKey) as T | undefined;
    if (cached) return cached;

    await this.rateLimiter.acquire();

    const response = await withRetry(async () => {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`ChEMBL API error: ${res.status} ${res.statusText}`);
      }

      return res.json();
    });

    this.cache.set(cacheKey, response);
    return response as T;
  }

  /**
   * Search for ChEMBL target by gene symbol.
   */
  async searchTarget(geneSymbol: string): Promise<ChEMBLTarget | null> {
    try {
      const data = await this.request<{
        targets: Array<{
          target_chembl_id: string;
          pref_name: string;
          target_type: string;
          organism: string;
          target_components: Array<{
            target_component_synonyms: Array<{
              component_synonym: string;
              syn_type: string;
            }>;
          }>;
        }>;
      }>('/target/search', { q: geneSymbol });

      // Find human target matching gene symbol
      const target = data.targets?.find(t => {
        if (t.organism !== 'Homo sapiens') return false;

        // Check if gene symbol matches any synonym
        const synonyms = t.target_components?.flatMap(
          c => c.target_component_synonyms?.map(s => s.component_synonym) ?? []
        ) ?? [];

        return (
          t.pref_name?.toUpperCase().includes(geneSymbol.toUpperCase()) ||
          synonyms.some(s => s.toUpperCase() === geneSymbol.toUpperCase())
        );
      });

      if (!target) return null;

      return {
        targetChemblId: target.target_chembl_id,
        prefName: target.pref_name,
        targetType: target.target_type,
        organism: target.organism,
      };
    } catch (error) {
      console.error(`[ChEMBLClient] Failed to search target for ${geneSymbol}:`, error);
      return null;
    }
  }

  /**
   * Get compounds with activity against this target.
   */
  async getTargetCompounds(
    targetChemblId: string,
    options: { minPhase?: number; limit?: number } = {}
  ): Promise<ChemicalMatter[]> {
    const { minPhase = 0, limit = 50 } = options;

    try {
      // Get molecules linked to target with their max phase
      const data = await this.request<{
        drug_mechanisms: Array<{
          molecule_chembl_id: string;
          mechanism_of_action: string;
          max_phase: number;
        }>;
      }>('/mechanism', {
        target_chembl_id: targetChemblId,
        limit: String(limit),
      });

      const mechanisms = data.drug_mechanisms?.filter(m => m.max_phase >= minPhase) ?? [];

      // Get molecule details
      const compounds: ChemicalMatter[] = [];

      for (const mech of mechanisms.slice(0, 20)) {
        // Limit API calls
        const molData = await this.getMoleculeDetails(mech.molecule_chembl_id);
        if (molData) {
          compounds.push({
            chemblId: mech.molecule_chembl_id,
            compoundName: molData.prefName,
            maxPhase: mech.max_phase,
            activityType: '',
            activityValue: null,
            activityUnit: '',
            mechanism: mech.mechanism_of_action,
          });
        }
      }

      return compounds;
    } catch (error) {
      console.error(`[ChEMBLClient] Failed to get compounds for ${targetChemblId}:`, error);
      return [];
    }
  }

  /**
   * Get bioactivity data for target.
   */
  async getBioactivities(
    targetChemblId: string,
    options: { activityTypes?: string[]; limit?: number } = {}
  ): Promise<ChEMBLBioactivity[]> {
    const { activityTypes = ['IC50', 'Ki', 'Kd', 'EC50'], limit = 100 } = options;

    try {
      const data = await this.request<{
        activities: Array<{
          molecule_chembl_id: string;
          molecule_pref_name: string | null;
          standard_type: string;
          standard_value: number | null;
          standard_units: string | null;
          pchembl_value: number | null;
          assay_type: string;
        }>;
      }>('/activity', {
        target_chembl_id: targetChemblId,
        limit: String(limit),
      });

      return (data.activities ?? [])
        .filter(a => activityTypes.includes(a.standard_type))
        .map(a => ({
          moleculeChemblId: a.molecule_chembl_id,
          moleculeName: a.molecule_pref_name,
          activityType: a.standard_type,
          activityValue: a.standard_value,
          activityUnit: a.standard_units,
          pchemblValue: a.pchembl_value,
          assayType: a.assay_type,
        }));
    } catch (error) {
      console.error(`[ChEMBLClient] Failed to get bioactivities for ${targetChemblId}:`, error);
      return [];
    }
  }

  /**
   * Get molecule details.
   */
  async getMoleculeDetails(moleculeChemblId: string): Promise<ChEMBLMolecule | null> {
    try {
      const data = await this.request<{
        molecule_chembl_id: string;
        pref_name: string | null;
        max_phase: number;
        molecule_type: string;
        first_approval: number | null;
      }>(`/molecule/${moleculeChemblId}`);

      return {
        moleculeChemblId: data.molecule_chembl_id,
        prefName: data.pref_name,
        maxPhase: data.max_phase,
        moleculeType: data.molecule_type,
        firstApproval: data.first_approval,
      };
    } catch (error) {
      console.error(`[ChEMBLClient] Failed to get molecule details for ${moleculeChemblId}:`, error);
      return null;
    }
  }

  /**
   * Get mechanism of action for a compound.
   */
  async getMechanism(moleculeChemblId: string): Promise<string | null> {
    try {
      const data = await this.request<{
        mechanisms: Array<{
          mechanism_of_action: string;
        }>;
      }>('/mechanism', { molecule_chembl_id: moleculeChemblId });

      return data.mechanisms?.[0]?.mechanism_of_action ?? null;
    } catch (error) {
      console.error(`[ChEMBLClient] Failed to get mechanism for ${moleculeChemblId}:`, error);
      return null;
    }
  }
}
