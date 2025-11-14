// Clinical MCP Server
// Provides real-time access to clinical trials data, PubMed, and research databases

import { IMCPServer, MCPProvider, MCPTool, MCPResource, MCPToolResult } from './types';

export class ClinicalMCPServer implements IMCPServer {
  provider: MCPProvider = 'clinical_db';
  name = 'Clinical Data Server';
  version = '1.0.0';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'search_clinical_trials',
        description: 'Search ClinicalTrials.gov for trials by indication, drug, company, or NCT ID',
        inputSchema: {
          type: 'object',
          properties: {
            condition: {
              type: 'string',
              description: 'Disease or condition',
            },
            intervention: {
              type: 'string',
              description: 'Drug, device, or intervention name',
            },
            sponsor: {
              type: 'string',
              description: 'Trial sponsor/company name',
            },
            phase: {
              type: 'string',
              description: 'Clinical trial phase',
              enum: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'all'],
            },
            status: {
              type: 'string',
              description: 'Trial status',
              enum: ['Recruiting', 'Active, not recruiting', 'Completed', 'Terminated', 'all'],
              default: 'all',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_trial_details',
        description: 'Get detailed information about a specific clinical trial',
        inputSchema: {
          type: 'object',
          properties: {
            nct_id: {
              type: 'string',
              description: 'ClinicalTrials.gov NCT ID (e.g., NCT04567890)',
            },
          },
          required: ['nct_id'],
        },
      },
      {
        name: 'search_pubmed',
        description: 'Search PubMed for research publications',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (keywords, authors, MeSH terms)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
            },
            years: {
              type: 'number',
              description: 'Limit to publications from last N years',
              default: 5,
            },
            publication_types: {
              type: 'array',
              description: 'Filter by publication type',
              items: {
                type: 'string',
                enum: ['Clinical Trial', 'Meta-Analysis', 'Review', 'Randomized Controlled Trial', 'all'],
              },
              default: ['all'],
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'analyze_efficacy_data',
        description: 'Analyze efficacy and safety data from clinical trials',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Disease or condition',
            },
            endpoint_type: {
              type: 'string',
              description: 'Type of endpoint to analyze',
              enum: ['efficacy', 'safety', 'survival', 'quality_of_life', 'all'],
              default: 'all',
            },
            comparator: {
              type: 'string',
              description: 'Standard of care or comparator therapy',
            },
          },
          required: ['indication'],
        },
      },
      {
        name: 'benchmark_trial_design',
        description: 'Benchmark trial design against similar studies',
        inputSchema: {
          type: 'object',
          properties: {
            indication: {
              type: 'string',
              description: 'Disease or condition',
            },
            phase: {
              type: 'string',
              description: 'Clinical phase',
              enum: ['Phase 1', 'Phase 2', 'Phase 3'],
            },
            design_elements: {
              type: 'array',
              description: 'Trial design elements to benchmark',
              items: {
                type: 'string',
                enum: ['sample_size', 'endpoints', 'duration', 'inclusion_criteria', 'all'],
              },
              default: ['all'],
            },
          },
          required: ['indication', 'phase'],
        },
      },
    ];
  }

  async listResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'clinical://databases/clinicaltrials-gov',
        name: 'ClinicalTrials.gov',
        description: 'US National Library of Medicine clinical trials database',
        mimeType: 'application/json',
        metadata: {
          coverage: 'Global clinical trials (400,000+ studies)',
          updateFrequency: 'daily',
        },
      },
      {
        uri: 'clinical://databases/pubmed',
        name: 'PubMed',
        description: 'Biomedical literature database',
        mimeType: 'application/json',
        metadata: {
          coverage: '35+ million citations from MEDLINE and other sources',
          updateFrequency: 'daily',
        },
      },
      {
        uri: 'clinical://databases/clinicalkey',
        name: 'ClinicalKey',
        description: 'Clinical knowledge database',
        mimeType: 'application/json',
        metadata: {
          coverage: 'Clinical guidelines, drug information, medical journals',
          updateFrequency: 'continuous',
        },
      },
    ];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    switch (name) {
      case 'search_clinical_trials':
        return await this.searchClinicalTrials(args);
      case 'get_trial_details':
        return await this.getTrialDetails(args);
      case 'search_pubmed':
        return await this.searchPubMed(args);
      case 'analyze_efficacy_data':
        return await this.analyzeEfficacyData(args);
      case 'benchmark_trial_design':
        return await this.benchmarkTrialDesign(args);
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
  private async searchClinicalTrials(args: Record<string, unknown>): Promise<MCPToolResult> {
    const condition = args.condition as string | undefined;
    const intervention = args.intervention as string | undefined;
    const sponsor = args.sponsor as string | undefined;
    const phase = args.phase as string | undefined;
    const status = args.status as string | undefined;
    const limit = (args.limit as number) || 20;

    try {
      // Build query parameters for ClinicalTrials.gov API v2
      const params = new URLSearchParams();

      if (condition) params.append('query.cond', condition);
      if (intervention) params.append('query.intr', intervention);
      if (sponsor) params.append('query.lead', sponsor);
      if (phase && phase !== 'all') params.append('query.phase', phase);
      if (status && status !== 'all') params.append('filter.overallStatus', status);
      params.append('pageSize', limit.toString());
      params.append('format', 'json');

      const url = `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ClinicalTrials.gov API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract trial information from API response
      const trials = (data.studies || []).map((study: any) => {
        const protocol = study.protocolSection || {};
        const identification = protocol.identificationModule || {};
        const statusModule = protocol.statusModule || {};
        const design = protocol.designModule || {};
        const sponsor = protocol.sponsorCollaboratorsModule || {};
        const description = protocol.descriptionModule || {};

        return {
          nctId: identification.nctId,
          title: identification.briefTitle,
          officialTitle: identification.officialTitle,
          status: statusModule.overallStatus,
          phase: design.phases || [],
          enrollment: design.enrollmentInfo?.count,
          sponsor: sponsor.leadSponsor?.name,
          collaborators: sponsor.collaborators?.map((c: any) => c.name) || [],
          startDate: statusModule.startDateStruct?.date,
          completionDate: statusModule.completionDateStruct?.date,
          briefSummary: description.briefSummary,
          conditions: protocol.conditionsModule?.conditions || [],
          interventions: protocol.armsInterventionsModule?.interventions?.map((i: any) => ({
            type: i.type,
            name: i.name,
          })) || [],
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'ClinicalTrials.gov API v2',
              query: { condition, intervention, sponsor, phase, status },
              totalResults: trials.length,
              trials,
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
            text: `Error fetching clinical trials: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getTrialDetails(args: Record<string, unknown>): Promise<MCPToolResult> {
    const nctId = args.nct_id as string;

    try {
      // Fetch specific trial by NCT ID
      const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Trial ${nctId} not found`);
        }
        throw new Error(`ClinicalTrials.gov API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const protocol = data.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const statusModule = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const sponsor = protocol.sponsorCollaboratorsModule || {};
      const description = protocol.descriptionModule || {};
      const eligibility = protocol.eligibilityModule || {};
      const outcomes = protocol.outcomesModule || {};
      const contacts = protocol.contactsLocationsModule || {};

      const trialDetails = {
        nctId: identification.nctId,
        title: identification.briefTitle,
        officialTitle: identification.officialTitle,
        acronym: identification.acronym,
        status: statusModule.overallStatus,
        phase: design.phases || [],
        studyType: design.studyType,
        enrollment: {
          count: design.enrollmentInfo?.count,
          type: design.enrollmentInfo?.type,
        },
        sponsor: {
          lead: sponsor.leadSponsor?.name,
          leadClass: sponsor.leadSponsor?.class,
          collaborators: sponsor.collaborators?.map((c: any) => ({
            name: c.name,
            class: c.class,
          })) || [],
        },
        dates: {
          start: statusModule.startDateStruct?.date,
          primaryCompletion: statusModule.primaryCompletionDateStruct?.date,
          completion: statusModule.completionDateStruct?.date,
          lastUpdate: statusModule.lastUpdatePostDateStruct?.date,
        },
        description: {
          brief: description.briefSummary,
          detailed: description.detailedDescription,
        },
        conditions: protocol.conditionsModule?.conditions || [],
        interventions: protocol.armsInterventionsModule?.interventions?.map((i: any) => ({
          type: i.type,
          name: i.name,
          description: i.description,
        })) || [],
        outcomes: {
          primary: outcomes.primaryOutcomes?.map((o: any) => ({
            measure: o.measure,
            timeFrame: o.timeFrame,
            description: o.description,
          })) || [],
          secondary: outcomes.secondaryOutcomes?.map((o: any) => ({
            measure: o.measure,
            timeFrame: o.timeFrame,
            description: o.description,
          })) || [],
        },
        eligibility: {
          criteria: eligibility.eligibilityCriteria,
          sex: eligibility.sex,
          minimumAge: eligibility.minimumAge,
          maximumAge: eligibility.maximumAge,
          healthyVolunteers: eligibility.healthyVolunteers,
        },
        design: {
          allocation: design.designInfo?.allocation,
          interventionModel: design.designInfo?.interventionModel,
          primaryPurpose: design.designInfo?.primaryPurpose,
          masking: design.designInfo?.masking,
        },
        locations: contacts.locations?.map((l: any) => ({
          facility: l.facility,
          city: l.city,
          state: l.state,
          country: l.country,
          status: l.status,
        })) || [],
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'ClinicalTrials.gov API v2',
              trial: trialDetails,
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
            text: `Error fetching trial details: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async searchPubMed(args: Record<string, unknown>): Promise<MCPToolResult> {
    const query = args.query as string;
    const limit = (args.limit as number) || 10;
    const years = (args.years as number) || 5;
    const publicationTypes = (args.publication_types as string[]) || ['all'];

    try {
      // Build PubMed search query
      let searchQuery = query;

      // Add year filter
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      searchQuery += ` AND ${startYear}:${currentYear}[dp]`;

      // Add publication type filters if specified
      if (publicationTypes.length > 0 && !publicationTypes.includes('all')) {
        const ptFilter = publicationTypes.map(pt => `"${pt}"[pt]`).join(' OR ');
        searchQuery += ` AND (${ptFilter})`;
      }

      // Step 1: Search PubMed to get PMIDs
      const searchParams = new URLSearchParams({
        db: 'pubmed',
        term: searchQuery,
        retmax: limit.toString(),
        retmode: 'json',
        sort: 'relevance',
      });

      // Add API key if available for higher rate limits
      if (this.apiKey) {
        searchParams.append('api_key', this.apiKey);
      }

      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams.toString()}`;

      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        throw new Error(`PubMed esearch API returned ${searchResponse.status}: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const pmids = searchData.esearchresult?.idlist || [];
      const totalCount = parseInt(searchData.esearchresult?.count || '0');

      if (pmids.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                source: 'PubMed E-utilities API',
                query: searchQuery,
                totalResults: 0,
                articles: [],
                message: 'No articles found matching the search criteria',
              }, null, 2),
            },
          ],
        };
      }

      // Step 2: Fetch article details using esummary
      const summaryParams = new URLSearchParams({
        db: 'pubmed',
        id: pmids.join(','),
        retmode: 'json',
      });

      if (this.apiKey) {
        summaryParams.append('api_key', this.apiKey);
      }

      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams.toString()}`;

      const summaryResponse = await fetch(summaryUrl);

      if (!summaryResponse.ok) {
        throw new Error(`PubMed esummary API returned ${summaryResponse.status}: ${summaryResponse.statusText}`);
      }

      const summaryData = await summaryResponse.json();
      const result = summaryData.result || {};

      // Parse article details
      const articles = pmids.map((pmid: string) => {
        const article = result[pmid];
        if (!article) return null;

        return {
          pmid,
          title: article.title,
          authors: article.authors?.slice(0, 5).map((a: any) => a.name) || [],
          authorCount: article.authors?.length || 0,
          journal: article.fulljournalname || article.source,
          journalAbbrev: article.source,
          pubDate: article.pubdate,
          publicationTypes: article.pubtype || [],
          volume: article.volume,
          issue: article.issue,
          pages: article.pages,
          doi: article.elocationid,
          abstract: article.sortfirstauthor, // Note: esummary doesn't include full abstracts
          citationCount: article.pmcrefcount,
          pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        };
      }).filter(Boolean);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'PubMed E-utilities API',
              query: searchQuery,
              searchParameters: {
                originalQuery: query,
                yearRange: `${startYear}-${currentYear}`,
                publicationTypes: publicationTypes.includes('all') ? 'all' : publicationTypes,
                limit,
              },
              totalResults: totalCount,
              returnedResults: articles.length,
              articles,
              note: 'For full abstracts, use the PubMed URL or efetch API',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching PubMed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async analyzeEfficacyData(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const endpointType = (args.endpoint_type as string) || 'all';
    const comparator = args.comparator as string | undefined;

    const mockAnalysis = {
      indication,
      endpointType,
      comparator,
      efficacyBenchmarks: [],
      safetyProfile: {},
      competitiveComparisons: [],
      message: 'Configure clinical data analysis pipeline',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockAnalysis, null, 2),
        },
      ],
    };
  }

  private async benchmarkTrialDesign(args: Record<string, unknown>): Promise<MCPToolResult> {
    const indication = args.indication as string;
    const phase = args.phase as string;
    const designElements = (args.design_elements as string[]) || ['all'];

    const mockBenchmark = {
      indication,
      phase,
      designElements,
      benchmarks: {
        typicalSampleSize: 'TBD',
        commonEndpoints: [],
        averageDuration: 'TBD',
        standardInclusionCriteria: [],
      },
      message: 'Configure trial design benchmarking analysis',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockBenchmark, null, 2),
        },
      ],
    };
  }
}
