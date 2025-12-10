/**
 * Patent Parsing API Endpoint
 * Handles patent document upload, parsing, and real-time progress streaming
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parsePatentDocument, type ExtractionOptions, type VerificationCallback } from '../../src/lib/patentParsing/documentParser';
import { assessQuality } from '../../src/lib/patentParsing/qualityAssurance';
import { isAuthenticated } from '../../server/lib/auth';
import { fetchPatents } from '../lib/patentFetcher';
import { calculateFTORisk } from '../lib/ftoRiskCalculator';
import { createLLMClient } from '../../src/lib/llm/clientFactory';
import { AGENT_MODEL_CONFIG } from '../../src/lib/llm/agentConfig';
import { AGENT_PROMPTS } from '../../src/lib/agentPrompts';
import { cache } from '../lib/cache';
import crypto from 'crypto';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, XML, HTML, DOCX, TXT files
    const allowedMimes = [
      'application/pdf',
      'application/xml',
      'text/xml',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, XML, HTML, DOCX, and TXT files are allowed.'));
    }
  },
});

interface ProgressEvent {
  type: 'progress' | 'step' | 'live_update' | 'complete' | 'error' | 'verification_needed';
  data: {
    progress?: number;
    step?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'error';
    message?: string;
    details?: any;
    result?: any;
    // Verification event data
    id?: string;
    field?: string;
    label?: string;
    extractedValue?: string;
    confidence?: number;
    alternatives?: string[];
    context?: string;
    section?: string;
    pageNumber?: number;
  };
}

/**
 * Send SSE event
 */
function sendSSEEvent(res: Response, event: ProgressEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Build analysis context from extraction results for LLM
 */
function buildAnalysisContext(
  extraction: any,
  quality: any
): string {
  let context = `# Patent Document Analysis Request\n\n`;
  
  // Document Info
  context += `## Document Information\n`;
  context += `- Patent Number: ${extraction.document_info.patent_number || 'Not found'}\n`;
  context += `- Title: ${extraction.document_info.title || 'Not found'}\n`;
  context += `- Assignee: ${extraction.document_info.assignee || 'Not found'}\n`;
  context += `- Publication Date: ${extraction.document_info.publication_date || 'Not found'}\n`;
  context += `- Priority Date: ${extraction.document_info.priority_date || 'Not found'}\n\n`;
  
  // Claims Analysis
  context += `## Claims Analysis\n`;
  context += `- Total Claims: ${extraction.claims_analysis.total_claims}\n`;
  context += `- Independent Claims: ${extraction.claims_analysis.independent_claims}\n`;
  if (extraction.claims_analysis.claims.length > 0) {
    context += `\n### Key Independent Claims:\n`;
    extraction.claims_analysis.claims
      .filter((c: any) => c.is_independent)
      .slice(0, 3)
      .forEach((claim: any) => {
        context += `\n**Claim ${claim.claim_number}** (${claim.claim_type}):\n`;
        context += `${claim.claim_text.substring(0, 300)}${claim.claim_text.length > 300 ? '...' : ''}\n`;
        if (claim.key_limitations.length > 0) {
          context += `Key Limitations: ${claim.key_limitations.join(', ')}\n`;
        }
      });
  }
  context += `\n`;
  
  // Molecular Data
  context += `## Molecular Data\n`;
  context += `- Modality: ${extraction.molecular_data.modality}\n`;
  if (extraction.molecular_data.target) {
    context += `- Target: ${extraction.molecular_data.target}\n`;
  }
  context += `- Antibodies: ${extraction.molecular_data.sequences.antibodies.length}\n`;
  context += `- Small Molecules: ${extraction.molecular_data.sequences.small_molecules.length}\n`;
  context += `- Nucleic Acids: ${extraction.molecular_data.sequences.nucleic_acids.length}\n`;
  context += `- Markush Structures: ${extraction.molecular_data.markush_structures?.length || 0}\n`;
  
  if (extraction.molecular_data.sequences.antibodies.length > 0) {
    context += `\n### Antibody Details:\n`;
    extraction.molecular_data.sequences.antibodies.slice(0, 3).forEach((ab: any, idx: number) => {
      context += `\n**Antibody ${idx + 1} (${ab.name})**:\n`;
      if (ab.heavy_chain?.hcdr3) {
        context += `- HCDR3: ${ab.heavy_chain.hcdr3.sequence}\n`;
      }
      if (ab.light_chain?.lcdr3) {
        context += `- LCDR3: ${ab.light_chain.lcdr3.sequence}\n`;
      }
      if (ab.format) {
        context += `- Format: ${ab.format}\n`;
      }
    });
  }
  context += `\n`;
  
  // Biological Data Summary
  const totalBioData = 
    extraction.biological_data.in_vitro.length +
    extraction.biological_data.in_vivo.length +
    extraction.biological_data.clinical.length;
  if (totalBioData > 0) {
    context += `## Biological Data\n`;
    context += `- In Vitro: ${extraction.biological_data.in_vitro.length} data points\n`;
    context += `- In Vivo: ${extraction.biological_data.in_vivo.length} data points\n`;
    context += `- Clinical: ${extraction.biological_data.clinical.length} data points\n`;
    context += `\n`;
  }
  
  // FTO Relevant Data
  if (extraction.fto_relevant_data) {
    context += `## FTO Assessment\n`;
    context += `- Genus Scope: ${extraction.fto_relevant_data.genus_scope}\n`;
    if (extraction.fto_relevant_data.key_limitations_for_fto.length > 0) {
      context += `- Key Limitations: ${extraction.fto_relevant_data.key_limitations_for_fto.join(', ')}\n`;
    }
    context += `\n`;
  }
  
  // Quality Assessment
  context += `## Quality Assessment\n`;
  context += `- Overall Confidence: ${(quality.overall_confidence * 100).toFixed(1)}%\n`;
  context += `- Confidence Level: ${quality.confidence_level}\n`;
  context += `- Validation Status: ${quality.validation_status}\n`;
  if (quality.flags.length > 0) {
    context += `- Validation Flags: ${quality.flags.length}\n`;
    quality.flags.slice(0, 5).forEach((flag: any) => {
      context += `  - [${flag.level}] ${flag.message}\n`;
    });
  }
  context += `\n`;
  
  // Validation Flags
  if (extraction.validation_flags.length > 0) {
    context += `## Validation Flags\n`;
    extraction.validation_flags.slice(0, 5).forEach((flag: any) => {
      context += `- [${flag.level}] ${flag.message}\n`;
    });
    context += `\n`;
  }
  
  return context;
}

/**
 * POST /api/patent-parsing/parse
 * Parse a patent document with real-time progress streaming
 */
router.post(
  '/parse',
  isAuthenticated,
  upload.single('file'),
  async (req: Request, res: Response) => {
    // Check if client wants SSE streaming
    const useSSE = req.headers.accept?.includes('text/event-stream') || req.body.useSSE === 'true';
    
    try {
      if (!req.file) {
        if (useSSE) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          sendSSEEvent(res, {
            type: 'error',
            data: { message: 'No file provided' },
          });
          res.end();
        } else {
          return res.status(400).json({ error: 'No file provided' });
        }
        return;
      }

      const fileBuffer = Buffer.from(req.file.buffer);
      const fileName = req.file.originalname;

      // Parse extraction options from request body
      const options: ExtractionOptions = {
        extract_structures: req.body.extract_structures !== 'false',
        extract_sequences: req.body.extract_sequences !== 'false',
        extract_biological_data: req.body.extract_biological_data !== 'false',
        resolve_cross_references: req.body.resolve_cross_references !== 'false',
        validate_data: req.body.validate_data !== 'false',
        include_prosecution_history: req.body.include_prosecution_history === 'true',
        include_family_members: req.body.include_family_members === 'true',
      };

      const mode = req.body.mode || 'comprehensive'; // quick, comprehensive, deep

      // Generate cache key from file content hash
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const cacheKey = cache.generateKey(fileName, fileHash, options);
      
      // Check cache first
      const cachedResult = cache.get<any>(cacheKey);
      if (cachedResult && useSSE) {
        // Return cached result via SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        
        sendSSEEvent(res, {
          type: 'progress',
          data: { progress: 100, message: 'Loading from cache...' },
        });
        
        sendSSEEvent(res, {
          type: 'complete',
          data: {
            progress: 100,
            result: cachedResult,
            cached: true,
            timestamp: new Date().toISOString(),
          },
        });
        
        res.end();
        return;
      } else if (cachedResult && !useSSE) {
        return res.json({
          success: true,
          ...cachedResult,
          cached: true,
        });
      }

      if (useSSE) {
        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial progress
        sendSSEEvent(res, {
          type: 'progress',
          data: { progress: 0, message: 'Starting analysis...' },
        });

        // Progress steps (no artificial delays)
        sendSSEEvent(res, {
          type: 'step',
          data: {
            step: 'validate',
            status: 'in_progress',
            message: 'Validating document...',
            progress: 5,
          },
        });

        // Parse document (this would be done incrementally in real implementation)
        try {
          // Set up verification callback for low-confidence extractions
          const verificationCallback = (item: any) => {
            sendSSEEvent(res, {
              type: 'verification_needed',
              data: {
                id: item.id,
                field: item.field,
                label: item.label,
                extractedValue: item.extractedValue,
                confidence: item.confidence,
                alternatives: item.alternatives || [],
                context: item.context,
                section: item.section,
                pageNumber: item.pageNumber,
              },
            });
          };
          
          const extractionResult = await parsePatentDocument(fileBuffer, fileName, options, verificationCallback);
          const qualityAssessment = assessQuality(extractionResult);

          // Send completion event
          sendSSEEvent(res, {
            type: 'complete',
            data: {
              progress: 100,
              result: {
                extraction: extractionResult,
                quality: qualityAssessment,
                timestamp: new Date().toISOString(),
              },
            },
          });

          res.end();
        } catch (error: any) {
          sendSSEEvent(res, {
            type: 'error',
            data: {
              message: error.message || 'Failed to parse patent document',
            },
          });
          res.end();
        }
      } else {
        // Non-SSE mode (original behavior)
        const extractionResult = await parsePatentDocument(fileBuffer, fileName, options);
        const qualityAssessment = assessQuality(extractionResult);
        
        // Generate LLM analysis
        let llmAnalysis = null;
        try {
          const analysisContext = buildAnalysisContext(extractionResult, qualityAssessment);
          const client = createLLMClient(AGENT_MODEL_CONFIG.patent);
          const systemPrompt = AGENT_PROMPTS.patent;
          
          const analysisPrompt = `Analyze the following patent document extraction results and provide a comprehensive expert analysis.

${analysisContext}

Please provide:
1. Executive Summary of the patent
2. Key Claims Analysis and scope assessment
3. Molecular Data Assessment (antibodies, sequences, structures)
4. FTO (Freedom to Operate) Risk Assessment
5. Competitive Landscape Implications
6. IP Strength and Valuation Considerations
7. Key Recommendations

Format your response in clear sections with markdown formatting.`;
          
          const llmResponse = await client.sendMessage(
            systemPrompt,
            analysisPrompt,
            { maxTokens: 4096 }
          );
          
          llmAnalysis = {
            content: llmResponse.content,
            usage: llmResponse.usage,
            timestamp: new Date().toISOString(),
          };
        } catch (error: any) {
          console.error('LLM analysis error:', error);
        }

        const result = {
          extraction: extractionResult,
          quality: qualityAssessment,
          llmAnalysis: llmAnalysis,
          timestamp: new Date().toISOString(),
        };

        // Cache the result
        cache.set(cacheKey, result, 24 * 60 * 60 * 1000);

        res.json({
          success: true,
          ...result,
        });
      }
    } catch (error: any) {
      console.error('Patent parsing error:', error);
      
      if (useSSE) {
        sendSSEEvent(res, {
          type: 'error',
          data: {
            message: error.message || 'Failed to parse patent document',
          },
        });
        res.end();
      } else {
        res.status(500).json({
          error: 'Failed to parse patent document',
          message: error.message,
        });
      }
    }
  }
);

/**
 * POST /api/patent-parsing/fetch
 * Fetch patent by number from USPTO/EPO
 */
router.post(
  '/fetch',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { patentNumbers, mode, therapeuticArea } = req.body;

      if (!patentNumbers || !Array.isArray(patentNumbers) || patentNumbers.length === 0) {
        return res.status(400).json({
          error: 'Patent numbers array is required',
        });
      }

      // Fetch patents from databases
      const fetchResults = await fetchPatents(patentNumbers);

      // For patents that were found, we would parse them here
      // For now, return the fetch results
      res.json({
        success: true,
        patents: fetchResults,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Patent fetching error:', error);
      res.status(500).json({
        error: 'Failed to fetch patents',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/patent-parsing/chat
 * Conversational chat with patent agent
 */
router.post(
  '/chat',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { message, context, patentData } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          error: 'Message is required',
        });
      }

      // Validate API key
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({
          error: 'API configuration error. PERPLEXITY_API_KEY is not set.',
        });
      }

      // Build context message
      let userMessage = message;
      
      if (patentData) {
        userMessage += `\n\nPatent Context:\n`;
        userMessage += `- Patent Number: ${patentData.document_info?.patent_number || 'Unknown'}\n`;
        userMessage += `- Title: ${patentData.document_info?.title || 'Unknown'}\n`;
        
        if (patentData.claims_analysis) {
          userMessage += `- Total Claims: ${patentData.claims_analysis.total_claims}\n`;
          userMessage += `- Independent Claims: ${patentData.claims_analysis.independent_claims}\n`;
        }
        
        if (patentData.molecular_data?.sequences?.antibodies?.length > 0) {
          userMessage += `- Antibodies Extracted: ${patentData.molecular_data.sequences.antibodies.length}\n`;
        }
      }

      if (context) {
        userMessage += `\n\nAdditional Context:\n${context}`;
      }

      // Create LLM client for patent expert
      const client = createLLMClient(AGENT_MODEL_CONFIG.patent);

      // Get patent agent prompt
      const systemPrompt = AGENT_PROMPTS.patent;

      // Call LLM
      const response = await client.sendMessage(
        systemPrompt,
        userMessage,
        { maxTokens: 4096 }
      );

      // Generate suggestions based on message content
      const suggestions: string[] = [];
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('sequence') || lowerMessage.includes('cdr') || lowerMessage.includes('antibody')) {
        suggestions.push('View full sequence alignment');
        suggestions.push('Compare to known therapeutic antibodies');
      }
      
      if (lowerMessage.includes('fto') || lowerMessage.includes('risk') || lowerMessage.includes('infringement')) {
        suggestions.push('View detailed FTO analysis');
        suggestions.push('See competitor patent comparisons');
      }
      
      if (lowerMessage.includes('claim') || lowerMessage.includes('patent')) {
        suggestions.push('View claim dependency tree');
        suggestions.push('Analyze claim scope');
      }

      res.json({
        success: true,
        response: response.content,
        suggestions: suggestions.length > 0 ? suggestions : [
          'View extracted sequences',
          'Explain FTO risk',
          'Compare to competitor patents',
        ],
        usage: response.usage,
      });
    } catch (error: any) {
      console.error('Patent chat error:', error);
      res.status(500).json({
        error: 'Failed to process chat message',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/patent-parsing/fto-risk
 * Calculate FTO risk for a patent
 */
router.post(
  '/fto-risk',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { patentData, competitorPatents } = req.body;

      if (!patentData) {
        return res.status(400).json({
          error: 'Patent data is required',
        });
      }

      // Calculate FTO risk
      const ftoResult = calculateFTORisk(patentData, competitorPatents);

      res.json({
        success: true,
        ...ftoResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('FTO risk calculation error:', error);
      res.status(500).json({
        error: 'Failed to calculate FTO risk',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/patent-parsing/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'patent-parsing',
    timestamp: new Date().toISOString(),
  });
});

export default router;
