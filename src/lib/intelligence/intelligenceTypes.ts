/**
 * Intelligence Feed types (Phase 3)
 *
 * These types define the contract between:
 * - Raw feed ingestion (normalized sources + optional extracted text/snippets)
 * - Sonny per-item processing (strict JSON output)
 * - Sonny digest synthesis (Markdown output, source-id citations)
 *
 * Keep this conservative and JSON-serializable.
 */

export type SourceType = 'PUB' | 'CTR' | 'REG' | 'PAT' | 'SEC' | 'PR' | 'CONF' | 'NEWS' | 'ANL' | 'SOC';
export type ReliabilityTier = 1 | 2 | 3 | 4;
export type RecencyScore = 'CURRENT' | 'RECENT' | 'DATED' | 'STALE';
export type VerificationStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED';
export type FactStatus = 'VERIFIABLE' | 'FORWARD_LOOKING' | 'CLAIM';
export type RelevanceLevel = 'CENTRAL' | 'SUPPORTING' | 'PERIPHERAL' | 'TANGENTIAL';
export type TargetRole = 'PRIMARY_SUBJECT' | 'COMPARATOR' | 'BIOMARKER' | 'PATHWAY_MEMBER' | 'MENTIONED';
export type ContentCategory = 'CLINICAL_DATA' | 'REGULATORY' | 'COMPETITIVE' | 'SCIENTIFIC' | 'FINANCIAL' | 'DEAL';
export type Urgency = 'BREAKING' | 'TIMELY' | 'INFORMATIONAL' | 'ARCHIVAL';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
export type BiasLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
export type AuthorCredibility = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type Persona = 'SCIENTIST' | 'SCOUT' | 'VC' | 'GENERAL';

export interface TargetContext {
  target?: string | null;
  asset?: string | null;
  company?: string | null;
  indication?: string | null;
}

export interface RawFeedItemInput {
  // Identity (required)
  sourceId: string;
  type: SourceType;
  name: string;
  url: string;

  // Timing
  publicationDate?: string | null; // ISO date when known
  capturedAt: string; // ISO timestamp when ingested (required; do NOT guess)

  // Content
  title: string;
  snippet?: string | null;
  abstract?: string | null;

  // Context
  targetContext: TargetContext;

  // Optional document identifiers
  nctNumber?: string;
  phase?: string;
  status?: string;
  primaryEndpoint?: string;
  sponsor?: string;
  pmid?: string;
  doi?: string;
  authors?: string[];
  journal?: string;
  patentNumber?: string;
  filingType?: string;

  // Evidence anchors (optional)
  // If not provided, Sonny should use [sourceId] as the sole evidenceId.
  evidenceIds?: string[];

  /**
   * Evidence blocks are the ONLY admissible grounding for facts.
   * Each evidence block has an id that can be cited in evidenceIds arrays.
   *
   * Example IDs:
   * - "pubmed:40234567:title"
   * - "pubmed:40234567:abstract"
   * - "ctr:NCT01234567:status"
   * - "news:abc123:snippet"
   */
  evidence?: Array<{
    id: string;
    field: string;
    text: string;
  }>;

  relatedItems?: string[];
}

export interface KeyDataPoint {
  metric: string;
  value: string;
  context: string;
  evidenceIds: string[];
}

export interface ProcessedFeedItem {
  id: string;
  targetContext: TargetContext;
  capturedAt: string;

  source: {
    sourceId: string;
    type: SourceType;
    name: string;
    url: string;
    publicationDate: string | null;
    reliabilityTier: ReliabilityTier;
    recencyScore: RecencyScore;
    authorCredibility: AuthorCredibility;
    potentialBias: BiasLevel;
    biasDirection: string | null;
  };

  relevance: {
    level: RelevanceLevel;
    targetMentioned: boolean;
    targetRole: TargetRole;
    whyRelevant: string;
    evidenceIds: string[];
  };

  classification: {
    category: ContentCategory;
    urgency: Urgency;
    sentiment: Sentiment;
    impactLevel: ImpactLevel;
  };

  summary: {
    headline: string;
    headlineEvidenceIds: string[];
    body: string;
    bodyEvidenceIds: string[];
    keyData: KeyDataPoint[];
    targetImplications: string;
    targetImplicationsEvidenceIds: string[];
  };

  facts: Array<{
    fact: string;
    verificationStatus: FactStatus;
    evidenceIds: string[];
  }>;

  verification: {
    status: VerificationStatus;
    method: string;
    methodEvidenceIds: string[];
    crossReferences: string[];
  };

  confidence: {
    level: ConfidenceLevel;
    rationale: string;
    rationaleEvidenceIds: string[];
    dataGaps: string[];
  };

  relatedItems: string[];
}

export interface DigestInput {
  generatedAt: string; // ISO date/time from system
  targetContext: TargetContext;
  persona?: Persona;
  items: ProcessedFeedItem[];
}

