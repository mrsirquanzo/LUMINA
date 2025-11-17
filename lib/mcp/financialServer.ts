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
          'User-Agent': 'Sonny AI Portfolio contact@quanho.dev',
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
          'User-Agent': 'Sonny AI Portfolio contact@quanho.dev',
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

    if (!this.apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Alpha Vantage API key required',
              message: 'Set FINANCIAL_API_KEY environment variable with your Alpha Vantage API key',
              getKey: 'https://www.alphavantage.co/support/#api-key (free tier: 25 requests/day)',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    try {
      // Get company overview
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${this.apiKey}`;

      const overviewResponse = await fetch(overviewUrl);

      if (!overviewResponse.ok) {
        throw new Error(`Alpha Vantage API returned ${overviewResponse.status}: ${overviewResponse.statusText}`);
      }

      const overview = await overviewResponse.json();

      // Check for API errors
      if (overview['Error Message']) {
        throw new Error(`Invalid ticker symbol: ${ticker}`);
      }

      if (overview['Note']) {
        throw new Error('API rate limit reached. Free tier: 5 calls/minute, 25 calls/day.');
      }

      if (!overview.Symbol) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }

      // Get income statement for revenue and R&D data
      const incomeUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${this.apiKey}`;

      const incomeResponse = await fetch(incomeUrl);

      if (!incomeResponse.ok) {
        throw new Error(`Alpha Vantage income statement API returned ${incomeResponse.status}`);
      }

      const incomeData = await incomeResponse.json();

      // Get most recent annual report
      const annualReports = incomeData.annualReports || [];
      const latestReport = annualReports[0] || {};

      // Calculate burn rate (for biotech companies without positive cash flow)
      const revenue = parseFloat(latestReport.totalRevenue || overview.RevenueTTM || '0');
      const operatingExpenses = parseFloat(latestReport.operatingExpenses || '0');
      const rdExpense = parseFloat(latestReport.researchAndDevelopment || '0');
      const cashAndEquivalents = parseFloat(overview.CashAndCashEquivalents || '0');

      // Quarterly burn rate (simplified)
      const quarterlyBurn = operatingExpenses / 4;
      const monthlyBurn = operatingExpenses / 12;

      // Runway in months (if no revenue or negative cash flow)
      const runway = cashAndEquivalents > 0 && monthlyBurn > 0
        ? Math.floor(cashAndEquivalents / monthlyBurn)
        : null;

      const analysis = {
        company: {
          name: overview.Name,
          sector: overview.Sector,
          industry: overview.Industry,
          marketCap: overview.MarketCapitalization,
          description: overview.Description,
        },
        financials: {
          revenue: {
            ttm: revenue,
            formatted: `$${(revenue / 1000000).toFixed(2)}M`,
          },
          profitability: {
            grossProfit: parseFloat(latestReport.grossProfit || '0'),
            operatingIncome: parseFloat(latestReport.operatingIncome || '0'),
            netIncome: parseFloat(latestReport.netIncome || '0'),
            ebitda: parseFloat(overview.EBITDA || '0'),
          },
          expenses: {
            operating: operatingExpenses,
            researchAndDevelopment: rdExpense,
            rdAsPercentOfRevenue: revenue > 0 ? ((rdExpense / revenue) * 100).toFixed(2) + '%' : 'N/A',
          },
          cashPosition: {
            cashAndEquivalents: cashAndEquivalents,
            formatted: `$${(cashAndEquivalents / 1000000).toFixed(2)}M`,
          },
          burnRate: {
            monthly: monthlyBurn,
            quarterly: quarterlyBurn,
            formattedMonthly: `$${(monthlyBurn / 1000000).toFixed(2)}M/month`,
          },
          runway: runway ? {
            months: runway,
            formatted: `${runway} months (~${(runway / 12).toFixed(1)} years)`,
          } : 'N/A (profitable or insufficient data)',
        },
        valuation: {
          peRatio: overview.PERatio,
          priceToBook: overview.PriceToBookRatio,
          priceToSales: overview.PriceToSalesRatioTTM,
          evToRevenue: overview.EVToRevenue,
          evToEBITDA: overview.EVToEBITDA,
        },
        fiscalYearEnd: overview.FiscalYearEnd,
        latestQuarter: overview.LatestQuarter,
        reportDate: latestReport.fiscalDateEnding,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'Alpha Vantage API',
              ticker,
              metrics,
              analysis,
              note: 'Alpha Vantage free tier: 5 calls/min, 25 calls/day. Burn rate calculated as operating expenses divided by time period.',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing financials: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getStockData(args: Record<string, unknown>): Promise<MCPToolResult> {
    const ticker = args.ticker as string;
    const timeframe = (args.timeframe as string) || '1y';

    if (!this.apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Alpha Vantage API key required',
              message: 'Set FINANCIAL_API_KEY environment variable with your Alpha Vantage API key',
              getKey: 'https://www.alphavantage.co/support/#api-key (free tier: 25 requests/day)',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    try {
      // Get current quote
      const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.apiKey}`;

      const quoteResponse = await fetch(quoteUrl);

      if (!quoteResponse.ok) {
        throw new Error(`Alpha Vantage API returned ${quoteResponse.status}: ${quoteResponse.statusText}`);
      }

      const quoteData = await quoteResponse.json();

      // Check for API errors
      if (quoteData['Error Message']) {
        throw new Error(`Invalid ticker symbol: ${ticker}`);
      }

      if (quoteData['Note']) {
        throw new Error('API rate limit reached. Free tier: 5 calls/minute, 25 calls/day.');
      }

      const quote = quoteData['Global Quote'];

      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }

      // Parse timeframe for historical data
      const timeframeMap: Record<string, string> = {
        '1d': 'TIME_SERIES_INTRADAY',
        '1w': 'TIME_SERIES_DAILY',
        '1m': 'TIME_SERIES_DAILY',
        '3m': 'TIME_SERIES_DAILY',
        '1y': 'TIME_SERIES_DAILY',
        '5y': 'TIME_SERIES_WEEKLY',
      };

      const tsFunction = timeframeMap[timeframe] || 'TIME_SERIES_DAILY';

      // Get historical data
      let historicalUrl = `https://www.alphavantage.co/query?function=${tsFunction}&symbol=${ticker}&apikey=${this.apiKey}`;

      if (tsFunction === 'TIME_SERIES_INTRADAY') {
        historicalUrl += '&interval=60min';
      }

      const historicalResponse = await fetch(historicalUrl);

      if (!historicalResponse.ok) {
        throw new Error(`Alpha Vantage historical API returned ${historicalResponse.status}`);
      }

      const historicalData = await historicalResponse.json();

      // Extract time series data
      const tsKey = Object.keys(historicalData).find(k => k.includes('Time Series'));
      const timeSeries = tsKey ? historicalData[tsKey] : {};

      // Parse historical data
      const historicalPrices = Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume']),
        }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'Alpha Vantage API',
              ticker,
              quote: {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: quote['10. change percent'],
                volume: parseInt(quote['06. volume']),
                latestTradingDay: quote['07. latest trading day'],
                previousClose: parseFloat(quote['08. previous close']),
                open: parseFloat(quote['02. open']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
              },
              historicalData: historicalPrices,
              timeframe,
              dataPoints: historicalPrices.length,
              note: 'Alpha Vantage free tier: 5 calls/min, 25 calls/day',
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching stock data: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
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
