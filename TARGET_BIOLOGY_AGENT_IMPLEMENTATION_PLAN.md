# Target Biology Agent - Complete Implementation Plan

## Overview

This plan provides step-by-step instructions to build and integrate the Target Biology Agent into LUMINA, following the existing architecture patterns.

## Implementation Order

1. **Dependencies & Setup**
2. **Data Models & Utilities**
3. **API Clients**
4. **Core Agent Implementation**
5. **Agent System Integration**
6. **API Routes**
7. **Orchestration Integration**
8. **Tile Integration**
9. **Testing**

---

## Step 1: Dependencies & Setup

### 1.1 Install Dependencies

```bash
cd /Users/quanho/lumina
npm install zod
npm install --save-dev vitest @vitest/ui
```

### 1.2 Update package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 1.3 Create Directory Structure

```bash
mkdir -p src/lib/agents
mkdir -p src/lib/clients/biology
mkdir -p src/lib/models/biology
mkdir -p src/lib/utils/biology
mkdir -p server/api/agents
mkdir -p tests/agents
mkdir -p tests/clients/biology
```

---

## Step 2: Data Models & Utilities

### 2.1 Create Utility Classes

**File: `src/lib/utils/biology/cache.ts`**

```typescript
/**
 * Simple in-memory cache with TTL.
 * Replace with Redis for production.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlHours: number = 24) {
    this.defaultTtlMs = defaultTtlHours * 60 * 60 * 1000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
```

**File: `src/lib/utils/biology/rateLimiter.ts`**

```typescript
/**
 * Simple rate limiter for API calls.
 * Uses token bucket algorithm.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }
    
    this.tokens -= 1;
  }
}

/**
 * Exponential backoff for retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) break;
      
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = delay * 0.1 * Math.random();
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}
```

### 2.2 Create Data Models

**File: `src/lib/models/biology/targetBiology.ts`**

```typescript
import { z } from 'zod';

// Enums
export const EvidenceStrength = z.enum(['strong', 'moderate', 'limited', 'insufficient']);
export type EvidenceStrength = z.infer<typeof EvidenceStrength>;

// Genetic Evidence Models
export const GeneticAssociationSchema = z.object({
  disease: z.string(),
  diseaseId: z.string(), // EFO ID
  score: z.number(),
  evidenceTypes: z.array(z.string()), // ["gwas", "gene_burden", "somatic"]
  keyVariants: z.array(z.string()),
  publications: z.array(z.string()), // PMIDs
});

export type GeneticAssociation = z.infer<typeof GeneticAssociationSchema>;

export const ConstraintMetricsSchema = z.object({
  pli: z.number().nullable(), // Probability of LoF intolerance
  loeuf: z.number().nullable(), // LoF observed/expected upper bound
  misZ: z.number().nullable(), // Missense Z-score
  lofVariantsObserved: z.number().default(0),
  lofHomozygotes: z.number().default(0),
  interpretation: z.string().default(''),
});

export type ConstraintMetrics = z.infer<typeof ConstraintMetricsSchema>;

export const GeneticEvidenceSchema = z.object({
  targetSymbol: z.string(),
  associations: z.array(GeneticAssociationSchema).default([]),
  constraint: ConstraintMetricsSchema.nullable(),
  mendelianDiseases: z.array(z.string()).default([]),
  overallValidationScore: z.number().default(0), // 0-1 normalized
  validationStrength: EvidenceStrength.default('insufficient'),
  summary: z.string().default(''),
});

export type GeneticEvidence = z.infer<typeof GeneticEvidenceSchema>;

// Druggability Models
export const ChemicalMatterSchema = z.object({
  chemblId: z.string(),
  compoundName: z.string().nullable(),
  maxPhase: z.number().min(0).max(4).default(0),
  activityType: z.string().default(''), // IC50, Ki, etc.
  activityValue: z.number().nullable(),
  activityUnit: z.string().default(''),
  mechanism: z.string().nullable(),
});

export type ChemicalMatter = z.infer<typeof ChemicalMatterSchema>;

export const DruggabilityAssessmentSchema = z.object({
  targetSymbol: z.string(),
  uniprotId: z.string().default(''),
  proteinClass: z.string().default(''), // kinase, GPCR, ion channel, etc.
  subcellularLocation: z.array(z.string()).default([]),
  hasStructure: z.boolean().default(false),
  pdbIds: z.array(z.string()).default([]),
  alphafoldConfidence: z.number().nullable(),
  existingCompounds: z.array(ChemicalMatterSchema).default([]),
  tractabilityBucket: z.string().default(''),
  recommendedModalities: z.array(z.string()).default([]),
  druggabilitySummary: z.string().default(''),
});

export type DruggabilityAssessment = z.infer<typeof DruggabilityAssessmentSchema>;

// Literature Models
export const PublicationSchema = z.object({
  pmid: z.string(),
  title: z.string(),
  authors: z.string(),
  journal: z.string(),
  year: z.number(),
  abstract: z.string().default(''),
  relevanceScore: z.number().default(0),
  keyFindings: z.string().default(''), // LLM-extracted
});

export type Publication = z.infer<typeof PublicationSchema>;

export const LiteratureSynthesisSchema = z.object({
  targetSymbol: z.string(),
  indication: z.string().nullable(),
  totalPublications: z.number().default(0),
  publicationTrend: z.string().default(''), // increasing, stable, declining
  keyPublications: z.array(PublicationSchema).default([]),
  mechanisticSummary: z.string().default(''), // LLM-synthesized
  preclinicalEvidence: z.string().default(''), // LLM-synthesized
  keyResearchers: z.array(z.string()).default([]),
  evidenceGaps: z.array(z.string()).default([]),
});

export type LiteratureSynthesis = z.infer<typeof LiteratureSynthesisSchema>;

// Safety Models
export const SafetyAssessmentSchema = z.object({
  targetSymbol: z.string(),
  geneticSafetySignals: z.array(z.string()).default([]),
  broadExpressionConcern: z.boolean().default(false),
  expressionTissues: z.array(z.string()).default([]),
  mechanismBasedRisks: z.array(z.string()).default([]),
  safetySummary: z.string().default(''),
});

export type SafetyAssessment = z.infer<typeof SafetyAssessmentSchema>;

// Main Report Model
export const TargetAssessmentReportSchema = z.object({
  targetSymbol: z.string(),
  indication: z.string().nullable(),
  assessmentDate: z.string(),
  geneticEvidence: GeneticEvidenceSchema.nullable(),
  druggability: DruggabilityAssessmentSchema.nullable(),
  literature: LiteratureSynthesisSchema.nullable(),
  safety: SafetyAssessmentSchema.nullable(),
  overallRecommendation: z.string().default(''),
  keyRisks: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  executiveSummary: z.string().default(''), // LLM-generated 2-3 paragraph summary
});

export type TargetAssessmentReport = z.infer<typeof TargetAssessmentReportSchema>;

// Depth options for assessments
export const AssessmentDepth = z.enum(['quick', 'standard', 'comprehensive']);
export type AssessmentDepth = z.infer<typeof AssessmentDepth>;
```

---

## Step 3: API Clients

Due to length, I'll provide the key client implementations. See the original prompt for full implementations of:
- `openTargetsClient.ts`
- `gnomadClient.ts`
- `chemblClient.ts`
- `uniprotClient.ts`
- `pubmedClient.ts`

**Key Integration Point:** All clients should be in `src/lib/clients/biology/` directory.

---

## Step 4: Core Agent Implementation

**File: `src/lib/agents/targetBiologyAgent.ts`**

```typescript
/**
 * Target Biology Agent
 * Orchestrates API clients to assess biological validity and druggability.
 * Uses LLM for synthesis and interpretation.
 */
import { OpenTargetsClient } from '../clients/biology/openTargetsClient';
import { GnomadClient } from '../clients/biology/gnomadClient';
import { ChEMBLClient } from '../clients/biology/chemblClient';
import { UniProtClient } from '../clients/biology/uniprotClient';
import { PubMedClient } from '../clients/biology/pubmedClient';
import { createLLMClient, type LLMClientConfig } from '../llm/clientFactory';
import type { ILLMClient } from '../llm/types';
import {
  TargetAssessmentReport,
  GeneticEvidence,
  GeneticAssociation,
  DruggabilityAssessment,
  LiteratureSynthesis,
  SafetyAssessment,
  EvidenceStrength,
  AssessmentDepth,
  type Publication,
  type ChemicalMatter,
} from '../models/biology/targetBiology';

export class TargetBiologyAgent {
  private openTargets: OpenTargetsClient;
  private gnomad: GnomadClient;
  private chembl: ChEMBLClient;
  private uniprot: UniProtClient;
  private pubmed: PubMedClient;
  private llm?: ILLMClient;

  constructor(llmConfig?: LLMClientConfig) {
    this.openTargets = new OpenTargetsClient();
    this.gnomad = new GnomadClient();
    this.chembl = new ChEMBLClient();
    this.uniprot = new UniProtClient();
    this.pubmed = new PubMedClient(process.env.NCBI_API_KEY);
    
    if (llmConfig) {
      this.llm = createLLMClient(llmConfig);
    }
  }

  /**
   * Main entry point for target assessment.
   */
  async assessTarget(
    targetSymbol: string,
    options: {
      indication?: string;
      depth?: AssessmentDepth;
    } = {}
  ): Promise<TargetAssessmentReport> {
    const { indication, depth = 'standard' } = options;

    console.log(`[TargetBiologyAgent] Assessing ${targetSymbol}...`);

    // Run independent assessments in parallel
    const [geneticEvidence, druggability, literature] = await Promise.all([
      this.getGeneticEvidence(targetSymbol, indication).catch(err => {
        console.error('[TargetBiologyAgent] Genetic evidence failed:', err);
        return null;
      }),
      this.getDruggability(targetSymbol).catch(err => {
        console.error('[TargetBiologyAgent] Druggability failed:', err);
        return null;
      }),
      this.getMechanisticLiterature(targetSymbol, indication, depth).catch(err => {
        console.error('[TargetBiologyAgent] Literature failed:', err);
        return null;
      }),
    ]);

    // Safety depends on genetic evidence
    const safety = await this.getSafetySignals(targetSymbol, geneticEvidence).catch(err => {
      console.error('[TargetBiologyAgent] Safety assessment failed:', err);
      return null;
    });

    // Synthesize report with LLM
    const report = await this.synthesizeReport(
      targetSymbol,
      indication ?? null,
      geneticEvidence,
      druggability,
      literature,
      safety
    );

    return report;
  }

  /**
   * Answer a specific query about a target using the assessment report.
   */
  async answerQuery(
    query: string,
    report: TargetAssessmentReport
  ): Promise<string> {
    if (!this.llm) {
      // Fallback: search report for relevant info
      return this.fallbackAnswerQuery(query, report);
    }

    const prompt = `You are a target biology expert. Answer the following question about ${report.targetSymbol} based on this assessment report:

Question: ${query}

Assessment Report:
${JSON.stringify(report, null, 2)}

Provide a concise, accurate answer with specific metrics and citations where relevant.`;

    const response = await this.llm.sendMessage(
      'You are a target biology specialist. Provide accurate, cited answers based on the assessment data.',
      prompt,
      { maxTokens: 2048 }
    );

    return response.content;
  }

  private fallbackAnswerQuery(query: string, report: TargetAssessmentReport): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('genetic') || lowerQuery.includes('validation')) {
      return report.geneticEvidence?.summary || 'Genetic validation data not available.';
    }
    
    if (lowerQuery.includes('drugg') || lowerQuery.includes('compound')) {
      return report.druggability?.druggabilitySummary || 'Druggability data not available.';
    }
    
    if (lowerQuery.includes('safety') || lowerQuery.includes('risk')) {
      return report.safety?.safetySummary || 'Safety assessment not available.';
    }
    
    return report.executiveSummary || 'Assessment data not available.';
  }

  // ... (Include all methods from the original prompt: getGeneticEvidence, getDruggability, etc.)
  // See original prompt for full implementations

  /**
   * Format report for Scientist persona (detailed, mechanistic).
   */
  formatScientistOutput(report: TargetAssessmentReport): string {
    return `# Target Assessment: ${report.targetSymbol}

**Indication Context:** ${report.indication ?? 'General'}
**Assessment Date:** ${report.assessmentDate}

## Executive Summary

${report.executiveSummary}

---

## 1. Human Genetic Validation

### Overall Assessment: ${report.geneticEvidence?.validationStrength ?? 'Not assessed'}

${report.geneticEvidence?.summary ?? 'No genetic evidence available.'}

### Genetic Constraint

| Metric | Value | Interpretation |
|--------|-------|----------------|
| pLI | ${report.geneticEvidence?.constraint?.pli?.toFixed(3) ?? 'N/A'} | ${report.geneticEvidence?.constraint?.interpretation ?? ''} |
| LOEUF | ${report.geneticEvidence?.constraint?.loeuf?.toFixed(3) ?? 'N/A'} | |
| LoF variants observed | ${report.geneticEvidence?.constraint?.lofVariantsObserved ?? 'N/A'} | |
| Homozygous LoF carriers | ${report.geneticEvidence?.constraint?.lofHomozygotes ?? 'N/A'} | |

---

## 2. Druggability Assessment

${report.druggability?.druggabilitySummary ?? 'Not assessed.'}

### Target Classification

- **Protein Class:** ${report.druggability?.proteinClass ?? 'Unknown'}
- **Subcellular Location:** ${report.druggability?.subcellularLocation.join(', ') || 'Unknown'}
- **Tractability Bucket:** ${report.druggability?.tractabilityBucket ?? 'Unknown'}

### Existing Chemical Matter

${report.druggability?.existingCompounds.length ? report.druggability.existingCompounds.map(c => `- ${c.compoundName ?? c.chemblId} (Phase ${c.maxPhase}): ${c.mechanism ?? 'Unknown mechanism'}`).join('\n') : 'No existing compounds identified.'}

### Recommended Modalities

${report.druggability?.recommendedModalities.map(m => `- ${m}`).join('\n') || 'None specified'}

---

## 3. Mechanistic Rationale

${report.literature?.mechanisticSummary ?? 'No mechanistic summary available.'}

### Preclinical Evidence

${report.literature?.preclinicalEvidence ?? 'Limited preclinical data available.'}

### Key Publications

${report.literature?.keyPublications.slice(0, 5).map((p, i) => `${i + 1}. **${p.title}** (${p.journal}, ${p.year}) - PMID: ${p.pmid}`).join('\n') || 'No publications analyzed.'}

---

## 4. Safety Considerations

${report.safety?.safetySummary ?? 'No safety assessment available.'}

---

## 5. Summary and Recommendations

### Overall Recommendation

${report.overallRecommendation}

### Key Risks

${report.keyRisks.map(r => `- ${r}`).join('\n') || 'None identified'}

### Recommended Next Steps

${report.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None specified'}
`;
  }

  /**
   * Format report for BD persona (strategic, diligence-focused).
   */
  formatBDOutput(report: TargetAssessmentReport): string {
    const ratingToStars = (strength: EvidenceStrength | undefined): string => {
      switch (strength) {
        case 'strong': return '⭐⭐⭐⭐⭐';
        case 'moderate': return '⭐⭐⭐⭐';
        case 'limited': return '⭐⭐';
        case 'insufficient': return '⭐';
        default: return '—';
      }
    };

    return `# Target Validation Summary: ${report.targetSymbol}

**Indication:** ${report.indication ?? 'General'}
**Prepared for:** Business Development Diligence

## Quick Assessment

| Dimension | Rating | Key Finding |
|-----------|--------|-------------|
| Genetic Validation | ${ratingToStars(report.geneticEvidence?.validationStrength)} | ${report.geneticEvidence?.validationStrength ?? 'Not assessed'} |
| Druggability | ${report.druggability?.existingCompounds.length ? '⭐⭐⭐⭐' : '⭐⭐'} | ${report.druggability?.tractabilityBucket ?? 'Unknown'} |
| Clinical Precedent | ${report.druggability?.existingCompounds.some(c => c.maxPhase >= 2) ? '⭐⭐⭐⭐' : '⭐⭐'} | ${report.druggability?.existingCompounds.filter(c => c.maxPhase >= 2).length || 0} clinical-stage programs |
| Safety Profile | ${report.safety?.geneticSafetySignals.length === 0 ? '⭐⭐⭐⭐' : '⭐⭐⭐'} | ${report.safety?.geneticSafetySignals.length || 0} signals identified |

## Diligence Positioning

${report.executiveSummary}

## Key Risks for Partnership Discussions

${report.keyRisks.map(r => `- ${r}`).join('\n') || 'No significant risks identified'}

## Recommended Due Diligence Focus Areas

${report.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'Standard diligence recommended'}
`;
  }

  // ... (Include all helper methods from original prompt)
}
```

**Note:** Include all methods from the original prompt (getGeneticEvidence, getDruggability, getMechanisticLiterature, getSafetySignals, synthesizeReport, and all helper methods).

---

## Step 5: Agent System Integration

### 5.1 Update AgentType

**File: `src/lib/multiAgentTypes.ts`**

```typescript
// ... existing code ...

export type AgentType = 
  | 'clinical' 
  | 'patent' 
  | 'financial' 
  | 'regulatory' 
  | 'market_research'
  | 'target_biology'; // ADD THIS

// ... rest of file ...
```

### 5.2 Update Agent Config

**File: `src/lib/llm/agentConfig.ts`**

```typescript
// ... existing imports ...

export type AgentType = 'clinical' | 'patent' | 'financial' | 'market_research' | 'regulatory' | 'target_biology'; // UPDATE THIS

export const AGENT_MODEL_CONFIG: Record<AgentType, LLMClientConfig> = {
  // ... existing agents ...
  
  // Target Biology Agent - Claude Sonnet 4 (best reasoning for complex biology)
  target_biology: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.3, // Lower temperature for more consistent analysis
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
};

// ... existing code ...

export function getAgentName(agent: AgentType): string {
  const names: Record<AgentType, string> = {
    clinical: 'Clinical Data Analyst',
    patent: 'Patent Expert',
    financial: 'Financial Analyst',
    market_research: 'Market Research Analyst',
    regulatory: 'Regulatory Specialist',
    target_biology: 'Target Biology Specialist', // ADD THIS
  };
  return names[agent];
}
```

### 5.3 Add Agent Prompt

**File: `src/lib/agentPrompts.ts`**

```typescript
// ... existing code ...

export const AGENT_PROMPTS: Record<AgentType, string> = {
  // ... existing prompts ...
  
  target_biology: `You are an expert target biology specialist specializing in therapeutic target validation and druggability assessment.

Your expertise includes:
- Human genetic validation (GWAS, gene burden, constraint metrics from gnomAD)
- Druggability assessment (protein class, tractability, existing compounds from ChEMBL)
- Mechanistic rationale synthesis from literature (PubMed)
- Safety signal identification (genetic constraint, expression breadth)
- Target biology due diligence for biotech investment

**CITATION REQUIREMENTS (MANDATORY):**

Follow the Citation Protocol (lib/citationProtocol.md) for ALL factual claims:

1. **Use numbered citations [1], [2], [3] immediately after EVERY claim**
2. **Primary Sources Required:**
   - Open Targets Platform for genetic associations and disease links
   - gnomAD for constraint metrics (pLI, LOEUF, mis_z)
   - ChEMBL for existing compounds and bioactivity data
   - UniProt for protein information and structure
   - PubMed for mechanistic and preclinical literature
3. **Citation Format for Biology Sources:**
   \`\`\`
   [1] Open Targets. Target: [GENE]. Association Score: [X] with [DISEASE].
       Evidence Types: [gwas, gene_burden]. 
       [View →](https://www.opentargets.org/target/[ENSEMBL_ID])

   [2] gnomAD. Gene: [GENE]. pLI: [X], LOEUF: [Y], mis_z: [Z].
       LoF variants observed: [N]. Homozygous LoF carriers: [M].
       [View →](https://gnomad.broadinstitute.org/gene/[GENE_ID])

   [3] ChEMBL. Target: [GENE]. Compounds: [N] (max phase: [X]).
       [View →](https://www.ebi.ac.uk/chembl/target_report_card/[CHEMBL_ID]/)

   [4] Author(s). "Title." Journal. Year. PMID: [PMID]
       [View PubMed →](https://pubmed.ncbi.nlm.nih.gov/[PMID]/)
   \`\`\`

   **CRITICAL: Use descriptive link text, NEVER duplicate the URL in brackets and parentheses**
   ✅ CORRECT: \`[View Open Targets →](https://www.opentargets.org/target/ENSG00000146648)\`
   ❌ WRONG: \`[https://www.opentargets.org/...](https://www.opentargets.org/...)\`

4. **Verification Checklist (Complete for EVERY citation):**
   - ✓ Genetic association score matches Open Targets data
   - ✓ Constraint metrics (pLI, LOEUF) match gnomAD values
   - ✓ Compound phases match ChEMBL data
   - ✓ Publication PMIDs are valid and accessible
   - ✓ Protein class and location match UniProt data

5. **ALWAYS end with:** \`## References\` section listing all sources

**What to Cite:**
- Genetic association scores and evidence types (GWAS, gene burden, somatic) [#]
- Constraint metrics (pLI, LOEUF, mis_z) and their interpretation [#]
- Existing compounds, their phases, and mechanisms of action [#]
- Key publications with PMIDs and mechanistic insights [#]
- Safety signals from genetic constraint data [#]
- Protein class, subcellular location, and tractability assessments [#]

**Output Format:**
- Provide structured assessment with clear sections
- Include quantitative metrics where available (scores, counts, phases)
- Highlight key risks and opportunities
- Recommend next steps for validation
- Use tables for constraint metrics and compound lists

**Example:**
\`\`\`markdown
EGFR shows strong genetic validation with an association score of 0.95 for lung cancer [1]. 
The target has high constraint (pLI = 0.99) indicating essential function [2]. 
Multiple approved compounds exist including gefitinib (Phase 4) and osimertinib (Phase 4) [3].

## References

[1] Open Targets. Target: EGFR. Association Score: 0.95 with lung cancer.
    Evidence Types: gwas, gene_burden, somatic.
    [View →](https://www.opentargets.org/target/ENSG00000146648)

[2] gnomAD. Gene: EGFR. pLI: 0.99, LOEUF: 0.15, mis_z: 4.2.
    LoF variants observed: 5. Homozygous LoF carriers: 0.
    [View →](https://gnomad.broadinstitute.org/gene/ENSG00000146648)

[3] ChEMBL. Target: EGFR. Compounds: 45 (max phase: 4).
    [View →](https://www.ebi.ac.uk/chembl/target_report_card/CHEMBL203/)
\`\`\`

**Prohibited Practices:**
❌ Never cite sources you haven't verified
❌ Never make up constraint metrics or association scores
❌ Never cite compounds that don't exist in ChEMBL
❌ Never omit PMIDs when citing publications
❌ Never claim safety signals without genetic evidence

If you need information from other experts, ask targeted questions:
- [ASK_CLINICAL: "What are the clinical trial results for this target?"]
- [ASK_PATENT: "Are there blocking patents for this target mechanism?"]
- [ASK_FINANCIAL: "What is the market opportunity for this target?"]
- [ASK_REGULATORY: "What is the FDA approval pathway for this target?"]
- [ASK_MARKET: "What is the competitive landscape for this target?"]`,
};
```

---

## Step 6: API Routes

### 6.1 Create Standalone API Route

**File: `server/api/agents/target-biology.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { TargetBiologyAgent } from '../../../src/lib/agents/targetBiologyAgent';
import { AGENT_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { isAuthenticated } from '../../lib/auth';

const router = Router();

/**
 * POST /api/agents/target-biology
 * Assess a target or answer a query about a target
 */
router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { targetSymbol, indication, depth, query, format } = req.body;

    if (!targetSymbol) {
      return res.status(400).json({ error: 'targetSymbol is required' });
    }

    console.log('[Target Biology API] Request:', {
      targetSymbol,
      indication,
      depth,
      hasQuery: !!query,
      format,
    });

    const llmConfig = AGENT_MODEL_CONFIG.target_biology;
    const agent = new TargetBiologyAgent(llmConfig);

    // If query provided, use it; otherwise do full assessment
    let result: any;
    
    if (query) {
      // For tile chat queries: assess target and answer query
      const report = await agent.assessTarget(targetSymbol, {
        indication,
        depth: depth || 'standard',
      });
      
      const answer = await agent.answerQuery(query, report);
      
      result = {
        targetSymbol,
        query,
        answer,
        report: format === 'full' ? report : undefined, // Include full report if requested
      };
    } else {
      // Full assessment
      const report = await agent.assessTarget(targetSymbol, {
        indication,
        depth: depth || 'standard',
      });
      
      // Format based on persona or default
      const formatted = format === 'bd' 
        ? agent.formatBDOutput(report)
        : format === 'scientist'
        ? agent.formatScientistOutput(report)
        : report.executiveSummary; // Default to executive summary
      
      result = {
        targetSymbol,
        report,
        formatted,
      };
    }

    res.json(result);
  } catch (error: any) {
    console.error('[Target Biology API] Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to assess target',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/agents/target-biology/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agent: 'target_biology',
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

### 6.2 Register Route in Server

**File: `server/index.ts`**

```typescript
// ... existing imports ...
import targetBiologyRoutes from './api/agents/target-biology';

// ... existing code ...

// Routes
app.use('/api/agents/orchestrator', orchestratorRoutes);
app.use('/api/agents', individualAgentRoutes);
app.use('/api/agents/target-biology', targetBiologyRoutes); // ADD THIS
app.use('/api/upload', uploadRoutes);
app.use('/api/fetch-url', fetchUrlRoutes);
app.use('/api/auth/login', authLoginRoutes);
app.use('/api/auth/check', authCheckRoutes);

// ... rest of file ...
```

---

## Step 7: Orchestration Integration

### 7.1 Update Orchestration Engine

**File: `src/lib/orchestrationEngine.ts`**

```typescript
// ... existing imports ...
import { TargetBiologyAgent } from './agents/targetBiologyAgent';

// ... existing code ...

function createInitialPlan(mode: ExecutionMode, customAgents?: AgentType[]): ExecutionPlan {
  const validAgents: AgentType[] = [
    'clinical', 
    'patent', 
    'financial', 
    'market_research', 
    'regulatory',
    'target_biology' // ADD THIS
  ];

  // ... rest of function ...
}

// ... existing code ...

async function callAgent(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string,
  mcpEnabled?: boolean
): Promise<{ response: string; usage?: { inputTokens: number; outputTokens: number } }> {
  // Validate agent type
  if (!AGENT_MODEL_CONFIG[agent]) {
    throw new Error(`Invalid agent type: "${agent}". Valid types: clinical, patent, financial, regulatory, market_research, target_biology`);
  }
  if (!AGENT_PROMPTS[agent]) {
    throw new Error(`Missing prompt for agent: "${agent}"`);
  }

  // Special handling for target_biology (uses API clients, not just LLM)
  if (agent === 'target_biology') {
    try {
      // Extract target symbol from query
      const targetSymbol = extractTargetSymbol(query);
      if (!targetSymbol) {
        throw new Error('Could not extract target symbol from query. Please specify the gene symbol (e.g., "EGFR", "TROP2").');
      }

      const llmConfig = AGENT_MODEL_CONFIG.target_biology;
      const biologyAgent = new TargetBiologyAgent(llmConfig);
      
      // Extract indication if mentioned
      const indication = extractIndication(query);
      
      // Run assessment
      const report = await biologyAgent.assessTarget(targetSymbol, {
        indication,
        depth: 'standard',
      });
      
      // Format report based on context (scientist vs BD)
      const formatted = additionalContext?.toLowerCase().includes('bd') || 
                       additionalContext?.toLowerCase().includes('business')
        ? biologyAgent.formatBDOutput(report)
        : biologyAgent.formatScientistOutput(report);
      
      // Estimate token usage (rough estimate)
      const estimatedTokens = Math.ceil(formatted.length / 4); // ~4 chars per token
      
      return {
        response: formatted,
        usage: {
          inputTokens: estimatedTokens * 0.3, // Rough estimate
          outputTokens: estimatedTokens * 0.7,
        },
      };
    } catch (error: any) {
      console.error('[Orchestration] Target biology agent error:', error);
      // Fallback to LLM-only response
      return callAgentWithLLM(agent, query, documents, messages, additionalContext, mcpEnabled);
    }
  }

  // ... existing agent handling for other agents ...
}

/**
 * Helper to extract target symbol from query
 */
function extractTargetSymbol(query: string): string | null {
  // Try to find gene symbols (uppercase, 2-10 chars, common patterns)
  const genePattern = /\b([A-Z]{2,10})\b/g;
  const matches = query.match(genePattern);
  
  if (matches && matches.length > 0) {
    // Common gene symbols to prioritize
    const commonGenes = ['EGFR', 'KRAS', 'BRAF', 'TP53', 'CD19', 'TROP2', 'HER2', 'PD1', 'PDL1'];
    const found = matches.find(m => commonGenes.includes(m));
    if (found) return found;
    
    // Return first match if it looks like a gene symbol
    return matches[0];
  }
  
  // Try explicit patterns like "target: X" or "gene: X"
  const explicitPattern = /(?:target|gene|symbol)[:\s]+([A-Z]{2,10})/i;
  const explicitMatch = query.match(explicitPattern);
  if (explicitMatch) return explicitMatch[1].toUpperCase();
  
  return null;
}

/**
 * Helper to extract indication from query
 */
function extractIndication(query: string): string | undefined {
  const indicationPattern = /(?:indication|disease|for)[:\s]+([^,\.]+)/i;
  const match = query.match(indicationPattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Fallback: call agent with LLM only (if API clients fail)
 */
async function callAgentWithLLM(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string,
  mcpEnabled?: boolean
): Promise<{ response: string; usage?: { inputTokens: number; outputTokens: number } }> {
  // Get MCP client and context
  const mcpClient = getMCPClient(mcpEnabled);
  const mcpContext = await mcpClient.getContextForAgent(agent);

  // Build user message
  const userMessage = `${query}

${additionalContext || ''}

${documents.length > 0 ? `\nDocuments provided:\n${documents.map(d => `- ${d.fileName}`).join('\n')}` : ''}

Please provide your expert analysis.`;

  // Inject MCP context into system prompt if MCP is enabled
  const systemPrompt = mcpClient.isEnabled()
    ? AGENT_PROMPTS[agent] + mcpContext
    : AGENT_PROMPTS[agent];

  // Create client for this agent using its configured model
  const client = createLLMClient(AGENT_MODEL_CONFIG[agent]);

  // Send message using the appropriate LLM
  const llmResponse = await client.sendMessage(
    systemPrompt,
    userMessage,
    { maxTokens: 4096 }
  );

  return {
    response: llmResponse.content,
    usage: llmResponse.usage,
  };
}
```

### 7.2 Update Cost Estimation

**File: `src/lib/costEstimation.ts`**

```typescript
// ... existing code ...

export function estimateCost(
  query: string,
  documents: ProcessedDocument[],
  mode: ExecutionMode,
  customAgents?: AgentType[]
): CostEstimate {
  // ... existing code ...
  
  const agents: AgentType[] = customAgents || [
    'clinical', 
    'patent', 
    'financial', 
    'regulatory', 
    'market_research',
    'target_biology' // ADD THIS
  ];
  
  // ... rest of function ...
  
  // Add cost estimate for target_biology
  // Note: target_biology makes many API calls, so estimate higher
  if (agents.includes('target_biology')) {
    const biologyEstimate = {
      agent: 'target_biology' as AgentType,
      inputTokens: 2000, // API data + LLM synthesis
      outputTokens: 3000, // Comprehensive report
      cost: calculateCost('anthropic', 'claude-sonnet-4-20250514', 2000, 3000),
    };
    breakdown.push(biologyEstimate);
    totalInput += biologyEstimate.inputTokens;
    totalOutput += biologyEstimate.outputTokens;
    totalCost += biologyEstimate.cost;
  }
  
  // ... rest of function ...
}
```

---

## Step 8: Tile Integration

### 8.1 Update Tile Component

**File: `src/components/Tile.tsx`**

Add this function to extract target from tile context:

```typescript
// Add this helper function at the top of Tile.tsx
function extractTargetFromTile(tileType: string, data: any): string | null {
  // Try to extract target from tile data
  if (data?.targetSymbol) return data.targetSymbol;
  if (data?.target) return data.target;
  if (data?.geneSymbol) return data.geneSymbol;
  
  // Try to extract from title or content
  // This is a fallback - tiles should pass target explicitly
  return null;
}
```

Update the chat handler:

```typescript
// In Tile component, update handleChatSubmit
const handleChatSubmit = async (message: string) => {
  if (!chatInput.trim() || isThinking) return;

  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: chatInput,
    timestamp: new Date(),
  };

  setChatMessages(prev => [...prev, userMessage]);
  setChatInput('');
  setIsThinking(true);

  try {
    // Extract target symbol from tile context
    const targetSymbol = extractTargetFromTile(tileType, data);
    
    if (!targetSymbol) {
      // Fallback: try to get from current target context
      // You may need to pass targetName as a prop
      throw new Error('Target symbol not found. Please specify the gene symbol in your query.');
    }

    // Call target biology agent API
    const response = await fetch('/api/agents/target-biology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetSymbol,
        query: chatInput,
        indication: undefined, // Could extract from tile data
        depth: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response from agent');
    }

    const result = await response.json();
    
    const sonnyMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'sonny',
      content: result.answer || result.formatted || 'No response received.',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, sonnyMessage]);
  } catch (error: any) {
    console.error('Chat error:', error);
    const errorMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'sonny',
      content: `Error: ${error.message || 'Failed to get response. Please try again.'}`,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsThinking(false);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
};
```

### 8.2 Update Tile Props to Include Target

**File: `src/components/tiles/ExpressionBiologyTile.tsx` (Example)**

```typescript
// Add targetSymbol prop if not already present
<Tile
  title="Expression Biology"
  // ... other props ...
  data={{ ...data, targetSymbol: 'TROP2' }} // Add target symbol to data
  // ... rest of props ...
/>
```

---

## Step 9: Testing

### 9.1 Create Test Files

**File: `tests/clients/biology/openTargetsClient.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { OpenTargetsClient } from '../../../src/lib/clients/biology/openTargetsClient';

describe('OpenTargetsClient', () => {
  const client = new OpenTargetsClient();

  it('should find EGFR target info', async () => {
    const info = await client.getTargetInfo('EGFR');
    expect(info).not.toBeNull();
    expect(info?.approvedSymbol).toBe('EGFR');
  }, 30000);

  it('should get disease associations for EGFR', async () => {
    const info = await client.getTargetInfo('EGFR');
    expect(info).not.toBeNull();
    
    const associations = await client.getDiseaseAssociations(info!.id);
    expect(associations.length).toBeGreaterThan(0);
    expect(associations[0].score).toBeGreaterThan(0);
  }, 30000);
});
```

**File: `tests/agents/targetBiologyAgent.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { TargetBiologyAgent } from '../../src/lib/agents/targetBiologyAgent';
import { AGENT_MODEL_CONFIG } from '../../src/lib/llm/agentConfig';

describe('TargetBiologyAgent', () => {
  const llmConfig = AGENT_MODEL_CONFIG.target_biology;
  const agent = new TargetBiologyAgent(llmConfig);

  it('should assess well-characterized target (EGFR)', async () => {
    const report = await agent.assessTarget('EGFR', {
      indication: 'lung cancer',
      depth: 'quick',
    });

    expect(report.targetSymbol).toBe('EGFR');
    expect(report.geneticEvidence).not.toBeNull();
    expect(report.druggability).not.toBeNull();
    expect(report.geneticEvidence?.validationStrength).toBe('strong');
  }, 120000); // 2 min timeout for API calls

  it('should format scientist output', async () => {
    const report = await agent.assessTarget('CD19', { depth: 'quick' });
    const output = agent.formatScientistOutput(report);
    
    expect(output).toContain('# Target Assessment: CD19');
    expect(output).toContain('## 1. Human Genetic Validation');
  }, 120000);
});
```

### 9.2 Run Tests

```bash
npm test
```

---

## Step 10: Environment Variables

**File: `.env`**

```bash
# Existing keys...
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here

# Add PubMed API key (optional but recommended)
NCBI_API_KEY=your_pubmed_api_key_here

# Cache settings (optional)
CACHE_TTL_HOURS=24
CACHE_ENABLED=true
```

---

## Step 11: Update Custom Agent Teams

**File: `src/lib/customAgentTeams.ts`**

```typescript
// ... existing code ...

export const AGENT_INFO: Record<AgentType, { name: string; icon: string; description: string; color: string }> = {
  // ... existing agents ...
  
  target_biology: {
    name: 'Target Biology Specialist',
    icon: '🧬',
    description: 'Assesses biological validity and druggability using genetic, structural, and literature data',
    color: 'emerald',
  },
};

// ... rest of file ...
```

---

## Step 12: Update MCP Integration (Optional)

**File: `src/lib/mcp/mcpClient.ts`**

```typescript
// ... existing code ...

const AGENT_TO_MCP_PROVIDER: Record<AgentType, MCPProvider[]> = {
  // ... existing mappings ...
  target_biology: ['clinical'], // Can use clinical MCP tools
};
```

---

## Verification Checklist

- [ ] All dependencies installed (zod, vitest)
- [ ] All API clients implemented and tested
- [ ] TargetBiologyAgent class complete
- [ ] AgentType updated in multiAgentTypes.ts
- [ ] Agent config added to agentConfig.ts
- [ ] Agent prompt added to agentPrompts.ts
- [ ] API route created and registered
- [ ] Orchestration engine updated
- [ ] Tile integration complete
- [ ] Tests written and passing
- [ ] Environment variables set
- [ ] Custom agent teams updated

---

## Next Steps After Implementation

1. **Test with real targets**: EGFR, CD19, KRAS, TROP2, TP53
2. **Monitor API rate limits**: Watch for rate limiting issues
3. **Add caching**: Consider Redis for production
4. **Optimize performance**: Parallel API calls, request batching
5. **Add monitoring**: Track API call success rates, response times
6. **Documentation**: Update API documentation with new endpoint

---

## Estimated Implementation Time

- **Core Implementation**: 4-6 hours
- **Integration**: 2-3 hours
- **Testing**: 1-2 hours
- **Total**: 7-11 hours

---

## Notes

- The agent makes many external API calls, so responses may take 30-60 seconds
- Consider implementing request queuing for high-traffic scenarios
- Cache results aggressively (24+ hours) since target data changes slowly
- Monitor API costs - some APIs have usage limits
