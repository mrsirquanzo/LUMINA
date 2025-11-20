/**
 * Type definitions for deliverable generation system
 */

export type AgentType = 'clinical' | 'patent' | 'financial' | 'market' | 'regulatory' | 'synthesis';

export interface DeliverableSection {
  id: string;
  title: string;
  sourceAgent: AgentType;
  extractionPrompt: string;
  required: boolean;
  wordCount?: {
    min: number;
    max: number;
  };
}

export interface DeliverableTemplate {
  id: string;
  title: string;
  description: string;
  sections: DeliverableSection[];
  outputFormat: ('pdf' | 'docx' | 'markdown')[];
  estimatedPages?: string;
  estimatedWords?: string;
}

export interface ExtractedSection {
  sectionId: string;
  title: string;
  content: string;
  wordCount: number;
  citations?: string[];
}

export interface GeneratedMemo {
  templateId: string;
  sections: Record<string, ExtractedSection>;
  metadata: MemoMetadata;
  generatedAt: string;
}

export interface MemoMetadata {
  analysisId: string;
  companyName?: string;
  generatedBy?: string;
  generatedAt: string;
  totalWords: number;
  totalPages: number;
}

export interface AgentResponses {
  clinical?: string;
  patent?: string;
  financial?: string;
  market?: string;
  regulatory?: string;
  synthesis: string;
}
