/**
 * Section Extraction Engine
 *
 * Uses Claude Sonnet 4 to extract specific sections from agent responses
 * for professional deliverable generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { DeliverableSection, ExtractedSection, AgentResponses, DeliverableTemplate } from './types';
import { investmentMemoTemplate, INVESTMENT_MEMO_PROMPT } from './templates/investment-memo';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Extract a single section from agent response using LLM
 */
export async function extractSection(
  agentResponse: string,
  section: DeliverableSection,
  companyName?: string
): Promise<ExtractedSection> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for more consistent, professional output
      messages: [{
        role: 'user',
        content: `${INVESTMENT_MEMO_PROMPT}

You are extracting the following section for an investment memo${companyName ? ` about ${companyName}` : ''}.

## SECTION TO EXTRACT: ${section.title}

${section.extractionPrompt}

## SOURCE DATA (from ${section.sourceAgent} agent):

${agentResponse}

## INSTRUCTIONS:

1. Extract and synthesize ONLY the content relevant to this specific section
2. Maintain institutional quality and professional tone
3. Include specific metrics, data points, and citations from the source
4. ${section.wordCount ? `Target length: ${section.wordCount.min}-${section.wordCount.max} words` : 'Be comprehensive but concise'}
5. Use markdown formatting (headers, bullets, tables where appropriate)
6. If the source data doesn't contain enough information for this section, indicate what's missing
7. Do NOT include any preamble like "Here is the section..." - just return the section content directly

Return ONLY the section content in markdown format, ready to be included in the final memo.`
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const wordCount = content.split(/\s+/).length;

    // Extract citations if present (looking for numbered citations like [1], [2])
    const citationMatches = content.match(/\[\d+\]/g);
    const citations = citationMatches ? [...new Set(citationMatches)] : [];

    return {
      sectionId: section.id,
      title: section.title,
      content,
      wordCount,
      citations
    };
  } catch (error) {
    console.error(`Error extracting section ${section.id}:`, error);
    throw new Error(`Failed to extract section: ${section.title}`);
  }
}

/**
 * Generate complete investment memo from agent responses
 */
export async function generateInvestmentMemo(
  agentResponses: AgentResponses,
  options: {
    companyName?: string;
    analysisId?: string;
    generatedBy?: string;
  } = {}
): Promise<{
  sections: Record<string, ExtractedSection>;
  metadata: {
    analysisId?: string;
    companyName?: string;
    generatedBy?: string;
    generatedAt: string;
    totalWords: number;
    totalPages: number;
    templateId: string;
  };
}> {
  const template = investmentMemoTemplate;
  const sections: Record<string, ExtractedSection> = {};
  let totalWords = 0;

  console.log('Starting investment memo generation...');

  // Extract each section sequentially
  for (const section of template.sections) {
    // Skip optional sections if agent response is not available
    if (!section.required && !agentResponses[section.sourceAgent]) {
      console.log(`Skipping optional section: ${section.title} (${section.sourceAgent} agent response not available)`);
      continue;
    }

    const sourceResponse = agentResponses[section.sourceAgent] || '';

    if (!sourceResponse && section.required) {
      console.warn(`Warning: Required section "${section.title}" has no source data from ${section.sourceAgent} agent`);
      // Create placeholder
      sections[section.id] = {
        sectionId: section.id,
        title: section.title,
        content: `*[Section requires ${section.sourceAgent} agent analysis - not available in current analysis]*`,
        wordCount: 0,
        citations: []
      };
      continue;
    }

    console.log(`Extracting section: ${section.title} (from ${section.sourceAgent} agent)...`);

    try {
      const extractedSection = await extractSection(
        sourceResponse,
        section,
        options.companyName
      );

      sections[section.id] = extractedSection;
      totalWords += extractedSection.wordCount;

      console.log(`✓ Extracted ${section.title}: ${extractedSection.wordCount} words`);
    } catch (error) {
      console.error(`Failed to extract section ${section.title}:`, error);
      // Create error placeholder
      sections[section.id] = {
        sectionId: section.id,
        title: section.title,
        content: `*[Error extracting this section - please review source data]*`,
        wordCount: 0,
        citations: []
      };
    }

    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate estimated pages (assuming ~500 words per page for dense professional content)
  const totalPages = Math.ceil(totalWords / 500);

  console.log(`✓ Memo generation complete: ${totalWords} words across ${Object.keys(sections).length} sections`);

  return {
    sections,
    metadata: {
      analysisId: options.analysisId,
      companyName: options.companyName,
      generatedBy: options.generatedBy,
      generatedAt: new Date().toISOString(),
      totalWords,
      totalPages,
      templateId: template.id
    }
  };
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): DeliverableTemplate | null {
  if (templateId === 'investment-memo') {
    return investmentMemoTemplate;
  }
  return null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): DeliverableTemplate[] {
  return [investmentMemoTemplate];
}
