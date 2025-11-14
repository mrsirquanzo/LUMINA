// Financial MCP Server
// Provides real-time access to financial data, SEC filings, and stock information

import { IMCPServer, MCPProvider, MCPTool, MCPResource, MCPToolResult } from './types';

export class FinancialMCPServer implements IMCPServer {
  provider: MCPProvider = 'financial_db';
  name = 'Financial Data Server';
  version = '1.0.0';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async listTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'get_sec_filings',
        description: 'Get SEC filings (10-K, 10-Q, 8-K, S-1) for a company',
        inputSchema: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            filing_type: {
              type: 'string',
              description: 'Type of SEC filing',
              enum: ['10-K', '10-Q', '8-K', 'S-1', 'all'],
              default: 'all',
            },
            limit: {
              type: 'number',
              description: 'Number of filings to return',
              default: 5,
            },
          },
          required: ['ticker'],
        },
      },
      {
        name: 'analyze_financials',
        description: 'Analyze company financials (revenue, burn rate, runway, cash position)',
        inputSchema: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            metrics: {
              type: 'array',
              description: 'Specific metrics to analyze',
              items: {
                type: 'string',
                enum: ['revenue', 'burn_rate', 'runway', 'cash', 'rd_expense', 'all'],
              },
              default: ['all'],
            },
          },
          required: ['ticker'],
        },
      },
      {
        name: 'get_stock_data',
        description: 'Get stock price and performance data',
        inputSchema: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            timeframe: {
              type: 'string',
              description: 'Timeframe for historical data',
              enum: ['1d', '1w', '1m', '3m', '1y', '5y'],
              default: '1y',
            },
          },
          required: ['ticker'],
        },
      },
      {
        name: 'calculate_valuation',
        description: 'Calculate company valuation using DCF, comparable companies, or precedent transactions',
        inputSchema: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              description: 'Stock ticker symbol',
            },
            method: {
              type: 'string',
              description: 'Valuation method',
              enum: ['dcf', 'comparable_companies', 'precedent_transactions', 'all'],
              default: 'all',
            },
            assumptions: {
              type: 'object',
              description: 'Custom assumptions for valuation (discount rate, growth rate, etc.)',
            },
          },
          required: ['ticker'],
        },
      },
      {
        name: 'get_biotech_comps',
        description: 'Get comparable biotech companies and their valuations',
        inputSchema: {
          type: 'object',
          properties: {
            therapeutic_area: {
              type: 'string',
              description: 'Therapeutic area for comparables',
            },
            clinical_stage: {
              type: 'string',
              description: 'Clinical stage',
              enum: ['preclinical', 'phase1', 'phase2', 'phase3', 'commercial', 'all'],
              default: 'all',
            },
            market_cap_range: {
              type: 'array',
              description: 'Market cap range in millions [min, max]',
              items: { type: 'number' },
            },
          },
        },
      },
    ];
  }

  async listResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'financial://databases/sec-edgar',
        name: 'SEC EDGAR',
        description: 'SEC Electronic Data Gathering, Analysis, and Retrieval system',
        mimeType: 'application/json',
        metadata: {
          coverage: 'All US public company filings',
          updateFrequency: 'real-time',
        },
      },
      {
        uri: 'financial://databases/yahoo-finance',
        name: 'Yahoo Finance',
        description: 'Stock prices and financial data',
        mimeType: 'application/json',
        metadata: {
          coverage: 'Global stock markets',
          updateFrequency: 'real-time',
        },
      },
      {
        uri: 'financial://databases/factset',
        name: 'FactSet',
        description: 'Financial data and analytics platform',
        mimeType: 'application/json',
        metadata: {
          coverage: 'Global financial data, estimates, fundamentals',
          updateFrequency: 'daily',
        },
      },
    ];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    switch (name) {
      case 'get_sec_filings':
        return await this.getSECFilings(args);
      case 'analyze_financials':
        return await this.analyzeFinancials(args);
      case 'get_stock_data':
        return await this.getStockData(args);
      case 'calculate_valuation':
        return await this.calculateValuation(args);
      case 'get_biotech_comps':
        return await this.getBiotechComps(args);
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
  private async getSECFilings(args: Record<string, unknown>): Promise<MCPToolResult> {
    const ticker = args.ticker as string;
    const filingType = (args.filing_type as string) || 'all';
    const limit = (args.limit as number) || 5;

    try {
      // First, we need to get the CIK (Central Index Key) for the ticker
      // SEC uses CIK, not ticker symbols
      const tickerUrl = 'https://www.sec.gov/files/company_tickers.json';

      const tickerResponse = await fetch(tickerUrl, {
        headers: {
          'User-Agent': 'Q-E Portfolio contact@quanho.dev',
          'Accept': 'application/json',
        },
      });

      if (!tickerResponse.ok) {
        throw new Error(`Failed to fetch ticker data: ${tickerResponse.status}`);
      }

      const tickerData = await tickerResponse.json();

      // Find the company by ticker
      const company = Object.values(tickerData).find(
        (c: any) => c.ticker.toUpperCase() === ticker.toUpperCase()
      ) as any;

      if (!company) {
        throw new Error(`Ticker ${ticker} not found in SEC database`);
      }

      const cik = company.cik_str.toString().padStart(10, '0');

      // Fetch company submissions data
      const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;

      const submissionsResponse = await fetch(submissionsUrl, {
        headers: {
          'User-Agent': 'Q-E Portfolio contact@quanho.dev',
          'Accept': 'application/json',
        },
      });

      if (!submissionsResponse.ok) {
        throw new Error(`SEC EDGAR API returned ${submissionsResponse.status}: ${submissionsResponse.statusText}`);
      }

      const data = await submissionsResponse.json();

      // Extract recent filings
      const recentFilings = data.filings?.recent || {};
      const forms = recentFilings.form || [];
      const filingDates = recentFilings.filingDate || [];
      const accessionNumbers = recentFilings.accessionNumber || [];
      const primaryDocuments = recentFilings.primaryDocument || [];
      const descriptions = recentFilings.primaryDocDescription || [];

      // Filter by filing type if specified
      const filings = forms.map((form: string, index: number) => {
        if (filingType !== 'all' && form !== filingType) {
          return null;
        }

        const accession = accessionNumbers[index].replace(/-/g, '');

        return {
          form,
          filingDate: filingDates[index],
          accessionNumber: accessionNumbers[index],
          description: descriptions[index],
          documentUrl: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accession}/${primaryDocuments[index]}`,
          filingUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${form}&dateb=&owner=exclude&count=10`,
        };
      }).filter(Boolean).slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'SEC EDGAR API',
              company: {
                name: data.name,
                ticker: company.ticker,
                cik,
                sic: data.sic,
                sicDescription: data.sicDescription,
                category: data.category,
                fiscalYearEnd: data.fiscalYearEnd,
              },
              query: { ticker, filingType, limit },
              totalFilings: filings.length,
              filings,
              note: 'SEC filings are updated daily. Use documentUrl to access full filing text.',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching SEC filings: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async analyzeFinancials(args: Record<string, unknown>): Promise<MCPToolResult> {
    const ticker = args.ticker as string;
    const metrics = (args.metrics as string[]) || ['all'];

    const mockAnalysis = {
      ticker,
      metrics,
      analysis: {
        revenue: 'TBD',
        burnRate: 'TBD',
        runway: 'TBD',
        cashPosition: 'TBD',
        rdExpense: 'TBD',
      },
      message: 'Configure financial data API integration (e.g., Alpha Vantage, Financial Modeling Prep)',
      instructions: 'Add FINANCIAL_API_KEY to environment variables',
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

  private async getStockData(args: Record<string, unknown>): Promise<MCPToolResult> {
    const ticker = args.ticker as string;
    const timeframe = (args.timeframe as string) || '1y';

    const mockStockData = {
      ticker,
      timeframe,
      currentPrice: 'TBD',
      change: 'TBD',
      volume: 'TBD',
      historicalData: [],
      message: 'Configure stock data API integration (e.g., Alpha Vantage, Yahoo Finance API)',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockStockData, null, 2),
        },
      ],
    };
  }

  private async calculateValuation(args: Record<string, unknown>): Promise<MCPToolResult> {
    const ticker = args.ticker as string;
    const method = (args.method as string) || 'all';
    const assumptions = args.assumptions as Record<string, unknown> | undefined;

    const mockValuation = {
      ticker,
      method,
      assumptions,
      dcf: 'TBD',
      comparableCompanies: 'TBD',
      precedentTransactions: 'TBD',
      fairValue: 'TBD',
      message: 'Configure financial modeling and valuation tools',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockValuation, null, 2),
        },
      ],
    };
  }

  private async getBiotechComps(args: Record<string, unknown>): Promise<MCPToolResult> {
    const therapeuticArea = args.therapeutic_area as string | undefined;
    const clinicalStage = (args.clinical_stage as string) || 'all';
    const marketCapRange = args.market_cap_range as number[] | undefined;

    const mockComps = {
      therapeuticArea,
      clinicalStage,
      marketCapRange,
      comparables: [],
      medianValuation: 'TBD',
      message: 'Configure biotech screening and comparable company analysis',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockComps, null, 2),
        },
      ],
    };
  }
}
