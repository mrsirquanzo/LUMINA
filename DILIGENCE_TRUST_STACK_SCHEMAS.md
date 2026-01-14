# Diligence Trust Stack — Data Contracts (v0.1)

Audience: BD/licensing + internal biotech strategy/scientist  
Goal: Make hallucination-resistant outputs by forcing **claim-first**, **evidence-backed**, **auditable** artifacts.

This doc defines the **canonical JSON contracts** that all agents (and Sonny) should emit/consume. UI and exports should be generated from these structures.

---

## Design principles (non-negotiable)

- **Claim-first**: narratives are *derived* from a claim ledger; never the other way around.
- **Evidence tags**: every claim has an explicit evidence class: `[P]`, `[R]`, `[I]`, `[U]`, `[H]`.
- **Evidence ceiling**: confidence cannot exceed the best evidence class supporting the claim.
- **Retrieval transparency**: any `[R]` must include a retrieval log entry (query + source + time + results + limitations).
- **Fail safely**: if not supported, claim is `[U]` and moves to Verification Plan.

---

## 1) Claim Ledger (canonical)

### TypeScript interface (contract)

```ts
export type EvidenceTag = 'P' | 'R' | 'I' | 'U' | 'H';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';

export type ClaimCategory =
  | 'biology'
  | 'clinical'
  | 'ip'
  | 'regulatory'
  | 'market'
  | 'financial'
  | 'operational'
  | 'other';

export type ClaimStatus = 'supported' | 'mixed' | 'unsupported' | 'unknown';

export interface EvidenceRef {
  /** Stable id used for cross-referencing in exports/UI */
  evidenceId: string;
  /** Evidence class for this reference */
  tag: EvidenceTag;
  /** Human label (e.g., "CSR excerpt", "CT.gov record", "PubMed abstract") */
  label: string;
  /** Source pointer. For [P], this can be an internal doc handle; for [R], a URL/source key. */
  uri?: string;
  /** Optional excerpt used to support the claim (preferred) */
  excerpt?: string;
  /** Where inside the source the excerpt came from */
  locator?: {
    page?: number;
    section?: string;
    table?: string;
    figure?: string;
    paragraph?: string;
    timestamp?: string;
  };
  /** Source metadata for provenance */
  sourceMeta?: {
    sourceType:
      | 'pdf'
      | 'clinicaltrials'
      | 'pubmed'
      | 'uniprot'
      | 'opentargets'
      | 'gnomad'
      | 'sec'
      | 'fda'
      | 'uspto'
      | 'epo'
      | 'news'
      | 'internal'
      | 'other';
    title?: string;
    authorsOrOrg?: string;
    publishedAt?: string; // ISO date if known
    accessedAt?: string; // ISO date if retrieved
    reliabilityTier?: 1 | 2 | 3 | 4; // optional heuristic tiering
  };
  /** Link to retrieval log entry if this is [R] */
  retrievalLogId?: string;
}

export interface Claim {
  claimId: string;
  category: ClaimCategory;
  /** Which agent asserted the claim (or 'sonny' if synthesized) */
  assertedBy: 'clinical' | 'patent' | 'financial' | 'market_research' | 'regulatory' | 'target_biology' | 'sonny';
  /** Atomic claim text (no bundling of multiple assertions) */
  text: string;

  /** Primary evidence class for the claim (overall tag) */
  tag: EvidenceTag;
  /** Confidence = evidence quality for this claim; not an action signal */
  confidence: Confidence;
  /** Max confidence allowed given evidence ceiling */
  confidenceCeiling?: Confidence;

  /** Structured references that support (or fail to support) the claim */
  evidence: EvidenceRef[];

  /** One critical concern (≤1) for quick scanning */
  criticalConcern?: string;
  /** What new evidence would upgrade/downgrade this claim */
  decisionTrigger?: {
    upgradeIf?: string[];
    downgradeIf?: string[];
  };

  /** Explicit assumptions used (only allowed if tagged [H] or [I]) */
  assumptions?: Array<{
    assumptionId: string;
    text: string;
    tag: 'H' | 'I';
  }>;

  /** Conflicts with other claims (by claimId) */
  conflicts?: Array<{
    withClaimId: string;
    type: 'direct' | 'scope' | 'temporal' | 'definition';
    note?: string;
  }>;

  /** Machine-readable status derived from tag + evidence */
  status: ClaimStatus;

  /** Metadata for auditability */
  meta?: {
    createdAt: string; // ISO
    updatedAt?: string; // ISO
    runId?: string;
    model?: string;
    provider?: string;
    promptVersion?: string;
  };
}

export interface ClaimLedger {
  schemaVersion: '0.1';
  target: {
    name: string;
    indication?: string;
    modality?: string;
  };
  /** The user query / diligence scope */
  scope: {
    query: string;
    persona: 'bd' | 'scientist' | 'strategy';
  };
  claims: Claim[];
}
```

### Minimal JSON example

```json
{
  "schemaVersion": "0.1",
  "target": { "name": "HER3", "indication": "Breast cancer" },
  "scope": { "query": "Assess HER3 for ADC licensing diligence", "persona": "bd" },
  "claims": [
    {
      "claimId": "CLIN-001",
      "category": "clinical",
      "assertedBy": "clinical",
      "text": "There is an ongoing Phase 2 trial evaluating a HER3-targeting ADC in metastatic breast cancer.",
      "tag": "R",
      "confidence": "MEDIUM",
      "confidenceCeiling": "MEDIUM",
      "evidence": [
        {
          "evidenceId": "EV-CTGOV-001",
          "tag": "R",
          "label": "ClinicalTrials.gov record",
          "uri": "https://clinicaltrials.gov/study/NCTxxxxxxx",
          "excerpt": "Phase 2 study of ... HER3 ADC ... metastatic breast cancer ...",
          "sourceMeta": {
            "sourceType": "clinicaltrials",
            "title": "Study of ...",
            "accessedAt": "2025-12-21T00:00:00.000Z",
            "reliabilityTier": 1
          },
          "retrievalLogId": "RL-CLIN-0001"
        }
      ],
      "criticalConcern": "Trial design details (arms/comparator, endpoints) not fully extracted.",
      "decisionTrigger": {
        "upgradeIf": ["Confirm endpoints and N analyzed from protocol/CSR excerpt."],
        "downgradeIf": ["Trial terminated for safety/efficacy futility."]
      },
      "status": "supported",
      "meta": { "createdAt": "2025-12-21T00:00:00.000Z" }
    }
  ]
}
```

---

## 2) Retrieval Log (required for any [R])

### TypeScript interface (contract)

```ts
export interface RetrievalQuery {
  retrievalLogId: string;
  agentType: 'clinical' | 'patent' | 'financial' | 'market_research' | 'regulatory' | 'target_biology' | 'sonny';
  executedAt: string; // ISO

  tool: {
    name:
      | 'mcp'
      | 'perplexity'
      | 'pubmed'
      | 'clinicaltrials'
      | 'uniprot'
      | 'opentargets'
      | 'gnomad'
      | 'google_patents'
      | 'uspto'
      | 'epo'
      | 'web'
      | 'other';
    source: string; // e.g. "ClinicalTrials.gov", "PubMed", "USPTO"
    dateRange?: { from?: string; to?: string }; // ISO dates
  };

  query: {
    text: string;
    filters?: Record<string, string | number | boolean>;
  };

  results: Array<{
    rank: number;
    title: string;
    uri?: string;
    snippet?: string;
    publishedAt?: string;
    /** 0-1 internal relevance score (optional) */
    score?: number;
    /** What was extracted from this result (optional) */
    extractedFacts?: string[];
  }>;

  limitations?: string[];
  exclusions?: string[]; // e.g. "Paywalled full text not accessible"

  meta?: {
    runId?: string;
    model?: string;
    provider?: string;
  };
}
```

### Minimal JSON example

```json
{
  "retrievalLogId": "RL-CLIN-0001",
  "agentType": "clinical",
  "executedAt": "2025-12-21T00:00:00.000Z",
  "tool": {
    "name": "clinicaltrials",
    "source": "ClinicalTrials.gov",
    "dateRange": { "from": "2018-01-01", "to": "2025-12-21" }
  },
  "query": { "text": "HER3 ADC metastatic breast cancer Phase 2" },
  "results": [
    {
      "rank": 1,
      "title": "Study of HER3-targeting ADC in metastatic breast cancer",
      "uri": "https://clinicaltrials.gov/study/NCTxxxxxxx",
      "snippet": "Phase 2 study ...",
      "score": 0.86
    }
  ],
  "limitations": ["Did not cross-check EUCTR registries in this run."]
}
```

---

## 3) Verification Plan (the BD “data room request list”)

### TypeScript interface (contract)

```ts
export type VerificationPriority = 'MUST_RESOLVE' | 'SHOULD_RESOLVE' | 'NICE_TO_HAVE';

export interface VerificationItem {
  verificationId: string;
  priority: VerificationPriority;

  /** What is unknown / disputed */
  uncertainty: string;
  /** Why it is thesis-critical (BD unlock) */
  whyCritical: string;

  /** Specific request or action */
  action: {
    type: 'request_document' | 'run_search' | 'run_analysis' | 'ask_company' | 'lab_experiment' | 'other';
    description: string;
    expectedArtifacts?: string[]; // e.g. "CSR PDF", "SAP", "AE tables"
    acceptanceCriteria?: string[]; // e.g. "Includes ITT population and follow-up"
  };

  /** What decision or workflow this unlocks */
  unlocks: string;

  /** Traceability back to claim ledger */
  relatedClaims?: Array<{
    claimId: string;
    relationship: 'supports' | 'refutes' | 'clarifies' | 'required_for';
  }>;

  /** Optional assignment */
  owner?: string;
  dueDate?: string; // ISO
}

export interface VerificationPlan {
  schemaVersion: '0.1';
  target: { name: string; indication?: string };
  items: VerificationItem[];
}
```

### Minimal JSON example

```json
{
  "schemaVersion": "0.1",
  "target": { "name": "HER3", "indication": "Breast cancer" },
  "items": [
    {
      "verificationId": "VP-0001",
      "priority": "MUST_RESOLVE",
      "uncertainty": "Dose-limiting toxicity and discontinuation rates at the intended dose are not assessable from provided materials.",
      "whyCritical": "Determines therapeutic window and whether a licensing thesis is viable without major redesign.",
      "action": {
        "type": "request_document",
        "description": "Request AE tables + dose modifications + discontinuations by grade for the lead cohort; include protocol + SAP.",
        "expectedArtifacts": ["Protocol", "SAP", "AE tables (by grade)", "Dose modification table"],
        "acceptanceCriteria": ["Includes denominator N analyzed", "Defines grading criteria", "Includes follow-up duration"]
      },
      "unlocks": "Clinical risk gating + comparator benchmarking + investable diligence memo.",
      "relatedClaims": [
        { "claimId": "CLIN-001", "relationship": "required_for" }
      ]
    }
  ]
}
```

---

## 4) Sonny Synthesis Output (derived view)

Sonny should *not* invent new facts; Sonny’s role is to reconcile the ledgers/logs and produce a derived view.

### Suggested Sonny output contract (v0.1)

```ts
export interface SonnySynthesis {
  schemaVersion: '0.1';
  target: { name: string; indication?: string };
  executiveBrief: {
    decisionDrivers: string[];
    keyRisks: string[];
    topUncertainties: string[];
    decisionTriggers: string[];
    nextSteps: string[];
  };
  reconciliation: Array<{
    topic: string;
    supportingClaims: string[]; // claimIds
    conflictingClaims?: string[]; // claimIds
    resolution: 'supported' | 'mixed' | 'unknown';
    note?: string;
  }>;
  verificationPlan: VerificationPlan;
  meta?: { runId?: string; createdAt: string };
}
```

---

## 5) Integration note (how to use these contracts)

- Agents should output:
  - `ClaimLedger` + `VerificationPlan` + any `RetrievalQuery[]` created during the run.
- UI should render:
  - claim table + evidence viewer + retrieval log panel + verification plan.
- Exports should include:
  - executive brief + claim ledger + evidence appendix + verification plan.

---

## Versioning

- This document: **v0.1**
- Any breaking field changes must bump `schemaVersion`.

