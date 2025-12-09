// Regulatory MCP Server
// Provides real-time access to FDA, EMA, and regulatory databases

import type { IMCPServer, MCPProvider, MCPTool, MCPResource, MCPToolResult } from './types';

export class RegulatoryMCPServer implements IMCPServer {
  provider: MCPProvider = 'regulatory_db';
  name = 'Regulatory Data Server';
  version = '1.0.0';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'search_fda_approvals',
        description: 'Search FDA drug approvals and regulatory decisions',
        inputSchema: {
          type: 'object',
          properties: {
            drug_name: {
              type: 'string',
              description: 'Drug or product name',
            },
            indication: {
              type: 'string',
              description: 'Medical indication or condition',
            },
            approval_type: {
              type: 'string',
              description: 'Type of approval',
              enum: ['BLA', 'NDA', '505(b)(2)', 'Accelerated', 'Breakthrough', 'all'],
              default: 'all',
            },
            years: {
              type: 'number',
              description: 'Look back N years',
              default: 5,
            },
          },
        },
      },
      {
        name: 'get_regulatory_pathway',
        description: 'Get recommended regulatory pathway for a drug/indication',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Medical indication',
            },
            drug_type: {
              type: 'string',
              description: 'Type of therapeutic',
              enum: ['small_molecule', 'biologic', 'cell_therapy', 'gene_therapy', 'device', 'other'],
            },
            unmet_need: {
              type: 'boolean',
              description: 'Is there an unmet medical need?',
              default: false,
            },
            rare_disease: {
              type: 'boolean',
              description: 'Is this for a rare disease (orphan indication)?',
              default: false,
            },
          },
          required: ['indication', 'drug_type'],
        },
      },
      {
        name: 'search_guidance_documents',
        description: 'Search FDA guidance documents and regulatory requirements',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Topic or therapeutic area',
            },
            document_type: {
              type: 'string',
              description: 'Type of guidance',
              enum: ['draft', 'final', 'all'],
              default: 'all',
            },
            agency: {
              type: 'string',
              description: 'Regulatory agency',
              enum: ['FDA', 'EMA', 'PMDA', 'NMPA', 'all'],
              default: 'FDA',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'analyze_precedent_approvals',
        description: 'Analyze precedent approvals for similar drugs/indications',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Medical indication',
            },
            mechanism_of_action: {
              type: 'string',
              description: 'Drug mechanism of action',
            },
            include_timelines: {
              type: 'boolean',
              description: 'Include approval timelines',
              default: true,
            },
          },
          required: ['indication'],
        },
      },
      {
        name: 'check_designation_eligibility',
        description: 'Check eligibility for special regulatory designations',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Medical indication',
            },
            designations: {
              type: 'array',
              description: 'Designations to check',
              items: {
                type: 'string',
                enum: ['Breakthrough', 'Fast Track', 'Orphan', 'RMAT', 'Priority Review', 'all'],
              },
              default: ['all'],
            },
            clinical_data_summary: {
              type: 'string',
              description: 'Brief summary of clinical data available',
            },
          },
          required: ['indication'],
        },
      },
      {
        name: 'estimate_approval_timeline',
        description: 'Estimate regulatory approval timeline',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Medical indication',
            },
            current_stage: {
              type: 'string',
              description: 'Current development stage',
              enum: ['preclinical', 'phase1', 'phase2', 'phase3', 'submitted'],
            },
            pathway: {
              type: 'string',
              description: 'Regulatory pathway',
              enum: ['standard', 'accelerated', 'breakthrough', 'conditional'],
              default: 'standard',
            },
          },
          required: ['indication', 'current_stage'],
        },
      },
    ];
  }

  async listResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'regulatory://databases/fda-drugs',
        name: 'FDA Drugs Database',
        description: 'FDA approved drug products and therapeutic equivalents',
        mimeType: 'application/json',
        metadata: {
          coverage: 'All FDA-approved drugs',
          updateFrequency: 'daily',
        },
      },
      {
        uri: 'regulatory://databases/fda-guidance',
        name: 'FDA Guidance Documents',
        description: 'FDA guidance documents for industry',
        mimeType: 'application/json',
        metadata: {
          coverage: 'All FDA guidance documents',
          updateFrequency: 'as published',
        },
      },
      {
        uri: 'regulatory://databases/ema-epar',
        name: 'EMA EPAR',
        description: 'European Medicines Agency European Public Assessment Reports',
        mimeType: 'application/json',
        metadata: {
          coverage: 'All EMA drug assessments',
          updateFrequency: 'as published',
        },
      },
      {
        uri: 'regulatory://databases/regulatory-precedents',
        name: 'Regulatory Precedents Database',
        description: 'Historical regulatory decisions and precedents',
        mimeType: 'application/json',
        metadata: {
          coverage: 'Global regulatory approvals',
          updateFrequency: 'monthly',
        },
      },
    ];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    switch (name) {
      case 'search_fda_approvals':
        return await this.searchFDAApprovals(args);
      case 'get_regulatory_pathway':
        return await this.getRegulatoryPathway(args);
      case 'search_guidance_documents':
        return await this.searchGuidanceDocuments(args);
      case 'analyze_precedent_approvals':
        return await this.analyzePrecedentApprovals(args);
      case 'check_designation_eligibility':
        return await this.checkDesignationEligibility(args);
      case 'estimate_approval_timeline':
        return await this.estimateApprovalTimeline(args);
      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  }

  async readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType?: string; text?: string }> }> {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ message: 'Resource reading not yet implemented' }),
        },
      ],
    };
  }

  // Tool implementations
  private async searchFDAApprovals(args: Record<string, unknown>): Promise<MCPToolResult> {
    const drugName = args.drug_name as string | undefined;
    const indication = args.indication as string | undefined;
    const approvalType = (args.approval_type as string) || 'all';
    const years = (args.years as number) || 5;

    try {
      // Build search query for FDA Drugs@FDA API
      const searchTerms: string[] = [];

      if (drugName) {
        searchTerms.push(`openfda.brand_name:"${drugName}" OR openfda.generic_name:"${drugName}"`);
      }

      if (indication) {
        searchTerms.push(`products.marketing_status:"Prescription" AND openfda.pharm_class_epc:"${indication}"`);
      }

      // Date filter - submissions from last N years
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      searchTerms.push(`submissions.submission_status_date:[${startYear}0101 TO ${currentYear}1231]`);

      const searchQuery = searchTerms.join(' AND ');
      const limit = 10;

      const url = `https://api.fda.gov/drug/drugsfda.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  source: 'FDA openFDA API',
                  query: { drugName, indication, approvalType, years },
                  totalResults: 0,
                  approvals: [],
                  message: 'No FDA approvals found matching the search criteria',
                }, null, 2),
              },
            ],
          };
        }
        throw new Error(`FDA openFDA API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      // Parse drug approvals
      const approvals = results.map((drug: any) => {
        const application = drug.submissions?.[0] || {};
        const product = drug.products?.[0] || {};
        const openFDA = drug.openfda || {};

        return {
          applicationNumber: drug.application_number,
          sponsorName: drug.sponsor_name,
          brandName: openFDA.brand_name?.[0],
          genericName: openFDA.generic_name?.[0],
          manufacturerName: openFDA.manufacturer_name?.[0],
          productType: openFDA.product_type?.[0],
          route: openFDA.route?.[0],
          substanceName: openFDA.substance_name?.[0],
          pharmacologicClass: openFDA.pharm_class_epc?.[0],
          submissionType: application.submission_type,
          submissionStatus: application.submission_status,
          submissionStatusDate: application.submission_status_date,
          reviewPriority: application.review_priority,
          marketingStatus: product.marketing_status,
          dosageForm: product.dosage_form,
          strength: product.active_ingredients?.map((ai: any) => ({
            name: ai.name,
            strength: ai.strength,
          })),
          fdaUrl: `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${drug.application_number}`,
        };
      });

      // Filter by approval type if specified
      let filteredApprovals = approvals;
      if (approvalType !== 'all') {
        const typeMap: Record<string, string> = {
          'BLA': 'BLA',
          'NDA': 'NDA',
          '505(b)(2)': 'NDA',
          'Accelerated': 'accelerated',
          'Breakthrough': 'breakthrough',
        };

        const filterType = typeMap[approvalType];
        if (filterType) {
          filteredApprovals = approvals.filter((a: any) =>
            a.applicationNumber?.startsWith(filterType) ||
            a.reviewPriority?.toLowerCase().includes(filterType)
          );
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'FDA openFDA API',
              query: { drugName, indication, approvalType, years },
              searchQuery,
              totalResults: filteredApprovals.length,
              approvals: filteredApprovals,
              note: 'Data from FDA Drugs@FDA database. Visit fdaUrl for complete application details.',
              apiUrl: url,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching FDA approvals: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getRegulatoryPathway(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const drugType = args.drug_type as string;
    const unmetNeed = (args.unmet_need as boolean) ?? false;
    const rareDisease = (args.rare_disease as boolean) ?? false;

    const mockPathway = {
      indication,
      drugType,
      unmetNeed,
      rareDisease,
      recommendedPathway: 'TBD',
      eligibleDesignations: [],
      estimatedTimeline: 'TBD',
      keyRequirements: [],
      message: 'Configure regulatory pathway decision engine',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockPathway, null, 2),
        },
      ],
    };
  }

  private async searchGuidanceDocuments(args: Record<string, unknown>): Promise<MCPToolResult> {
    const topic = args.topic as string;
    const documentType = (args.document_type as string) || 'all';
    const agency = (args.agency as string) || 'FDA';

    const mockGuidance = {
      topic,
      documentType,
      agency,
      documents: [],
      message: 'Configure FDA and EMA guidance document search',
      instructions: 'Scrape FDA guidance documents or use regulatory intelligence APIs',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockGuidance, null, 2),
        },
      ],
    };
  }

  private async analyzePrecedentApprovals(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const mechanismOfAction = args.mechanism_of_action as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const includeTimelines = (args.include_timelines as boolean) ?? true;

    const mockPrecedents = {
      indication,
      mechanismOfAction,
      precedents: [],
      averageApprovalTime: 'TBD',
      commonRequirements: [],
      successRate: 'TBD',
      message: 'Configure precedent approval analysis engine',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockPrecedents, null, 2),
        },
      ],
    };
  }

  private async checkDesignationEligibility(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const designations = (args.designations as string[]) || ['all'];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const clinicalDataSummary = args.clinical_data_summary as string | undefined;

    const mockEligibility = {
      indication,
      designations,
      eligibilityAssessment: {},
      recommendations: [],
      supportingEvidence: [],
      message: 'Configure regulatory designation eligibility checker',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockEligibility, null, 2),
        },
      ],
    };
  }

  private async estimateApprovalTimeline(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const currentStage = args.current_stage as string;
    const pathway = (args.pathway as string) || 'standard';

    const mockTimeline = {
      indication,
      currentStage,
      pathway,
      estimatedMonthsToApproval: 'TBD',
      milestones: [],
      assumptions: [],
      message: 'Configure regulatory timeline estimation model',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockTimeline, null, 2),
        },
      ],
    };
  }
}
