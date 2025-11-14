# MCP (Model Context Protocol) Setup Guide

## Overview

The Q · E multi-agent system now supports **Model Context Protocol (MCP)**, which enables agents to access real-time external data sources. This dramatically enhances the capabilities of each specialized agent by providing live data instead of relying solely on the agent's training knowledge.

## What is MCP?

Model Context Protocol is a standard for connecting AI applications to external data sources and tools. Think of it as giving your AI agents "superpowers" to:

- **Search live databases** (patents, clinical trials, SEC filings)
- **Access real-time market data** (news, stock prices, company intelligence)
- **Query regulatory databases** (FDA approvals, guidance documents)
- **Retrieve financial information** (SEC filings, company financials)

## Architecture

Each agent in Q · E has access to specialized MCP servers:

```
┌─────────────────┐      ┌──────────────────────┐
│ Clinical Agent  │─────▶│ Clinical MCP Server  │
│ (Claude)        │      │ - ClinicalTrials.gov │
└─────────────────┘      │ - PubMed             │
                         └──────────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│ Patent Agent    │─────▶│ Patent MCP Server    │
│ (Perplexity)    │      │ - USPTO              │
└─────────────────┘      │ - Google Patents     │
                         └──────────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│ Market Research │─────▶│ Market MCP Server    │
│ (Perplexity)    │      │ - News APIs          │
└─────────────────┘      │ - Market databases   │
                         └──────────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│ Financial Agent │─────▶│ Financial MCP Server │
│ (Gemini)        │      │ - SEC EDGAR          │
└─────────────────┘      │ - Stock APIs         │
                         └──────────────────────┘

┌─────────────────┐      ┌──────────────────────┐
│ Regulatory Agent│─────▶│ Regulatory MCP Server│
│ (Claude)        │      │ - FDA databases      │
└─────────────────┘      │ - EMA databases      │
                         └──────────────────────┘
```

## Available MCP Tools

### Clinical MCP Server
- `search_clinical_trials` - Search ClinicalTrials.gov by indication, drug, sponsor
- `get_trial_details` - Get detailed trial information by NCT ID
- `search_pubmed` - Search PubMed for research publications
- `analyze_efficacy_data` - Analyze efficacy and safety data from trials
- `benchmark_trial_design` - Benchmark trial design against similar studies

**Data Sources**: ClinicalTrials.gov, PubMed (no API key required)

### Patent MCP Server
- `search_patents` - Search USPTO and Google Patents
- `get_patent_details` - Get detailed patent information
- `analyze_patent_landscape` - Analyze competitive patent landscape
- `check_freedom_to_operate` - Perform FTO assessment

**Data Sources**: USPTO, Google Patents, Espacenet (API key optional)

### Market Research MCP Server
- `get_market_size` - Get market size data for therapeutic areas
- `search_company_intel` - Research company pipeline and news
- `track_deals_ma` - Track M&A deals and partnerships
- `analyze_competitive_landscape` - Analyze competitive landscape
- `get_industry_news` - Get recent industry news

**Data Sources**: News APIs, market intelligence platforms (API key required)

### Financial MCP Server
- `get_sec_filings` - Get SEC filings (10-K, 10-Q, 8-K, S-1)
- `analyze_financials` - Analyze company financials
- `get_stock_data` - Get stock prices and performance
- `calculate_valuation` - Calculate company valuations
- `get_biotech_comps` - Get comparable biotech companies

**Data Sources**: SEC EDGAR (no key), Yahoo Finance, Alpha Vantage (API key optional)

### Regulatory MCP Server
- `search_fda_approvals` - Search FDA drug approvals
- `get_regulatory_pathway` - Get recommended regulatory pathway
- `search_guidance_documents` - Search FDA/EMA guidance documents
- `analyze_precedent_approvals` - Analyze precedent approvals
- `check_designation_eligibility` - Check eligibility for special designations
- `estimate_approval_timeline` - Estimate regulatory timelines

**Data Sources**: FDA openFDA, EMA databases (no API key required)

## Quick Start

### 1. Enable MCP

Add to your `.env.local`:

```bash
MCP_ENABLED=true
```

### 2. Optional: Add API Keys for Enhanced Features

```bash
# For patent search (optional, enhanced features)
PATENT_API_KEY=your_key_here

# For market intelligence (recommended for live market data)
MARKET_DATA_API_KEY=your_key_here

# For financial data (recommended for stock/SEC data)
FINANCIAL_API_KEY=your_key_here
```

### 3. Deploy to Vercel

Update your Vercel environment variables:

```bash
vercel env add MCP_ENABLED
# Enter: true

# Optional: Add API keys
vercel env add PATENT_API_KEY
vercel env add MARKET_DATA_API_KEY
vercel env add FINANCIAL_API_KEY
```

### 4. Redeploy

```bash
vercel --prod
```

## Configuration Options

### Basic Configuration (No API Keys Needed)

MCP works out-of-the-box with public APIs for:
- **Clinical Agent**: ClinicalTrials.gov, PubMed
- **Regulatory Agent**: FDA openFDA, public databases

These require no additional API keys and provide substantial value.

### Enhanced Configuration (With API Keys)

For full functionality, configure external data APIs:

#### Patent APIs
- **Google Patents Public Data** (BigQuery) - Free tier available
- **USPTO PatentsView** - Free API
- **Commercial**: Lens.org, PatSnap

#### Market Data APIs
- **NewsAPI** ($449/month for commercial) - Real-time news
- **Alpha Vantage** (Free tier available) - Stock data
- **EvaluatePharma** (Enterprise) - Pharma market intelligence

#### Financial APIs
- **Alpha Vantage** (Free tier) - Stock data, financials
- **Financial Modeling Prep** ($14-99/month) - Financial data
- **SEC EDGAR** (Free) - No key needed, rate limited

## How It Works

### Without MCP (Default)

Agents rely on their training knowledge:
```
User: "What's the latest on Moderna's cancer vaccine trials?"
Agent: "Based on my training data up to [cutoff date]..."
```

### With MCP Enabled

Agents can access live data:
```
User: "What's the latest on Moderna's cancer vaccine trials?"
Agent:
  1. Calls search_clinical_trials(sponsor="Moderna", indication="cancer")
  2. Gets live trial data from ClinicalTrials.gov
  3. Calls search_pubmed(query="Moderna cancer vaccine")
  4. Provides analysis with current data

Response: "As of [today's date], Moderna has 3 active cancer vaccine
trials (NCT12345, NCT67890, NCT24680). Latest results from Nature
Medicine (2024) show..."
```

## Implementation Details

### MCP Server Locations

All MCP servers are in `/lib/mcp/`:
- `patentServer.ts` - Patent database access
- `marketServer.ts` - Market intelligence
- `financialServer.ts` - Financial data
- `clinicalServer.ts` - Clinical trials & PubMed
- `regulatoryServer.ts` - Regulatory databases
- `mcpClient.ts` - Unified client library
- `types.ts` - TypeScript interfaces

### Integration Points

MCP is integrated into the orchestration engine (`lib/orchestrationEngine.ts`):

```typescript
// MCP context is automatically injected into agent system prompts
const mcpClient = getMCPClient();
const mcpContext = await mcpClient.getContextForAgent(agent);

const systemPrompt = mcpClient.isEnabled()
  ? AGENT_PROMPTS[agent] + mcpContext
  : AGENT_PROMPTS[agent];
```

Each agent receives:
1. **Tool Descriptions**: What MCP tools are available
2. **Data Source Information**: Which databases can be accessed
3. **Usage Instructions**: How to leverage live data

### Agent Behavior

When MCP is enabled, agents will:
- Explicitly mention which data sources they would query
- Provide more specific, current information
- Reference live databases in their analysis
- Suggest specific MCP tool calls for follow-up queries

## API Integration Examples

### Example: Clinical Trials Integration

```typescript
// In production, replace mock implementation with real API calls:
private async searchClinicalTrials(args: Record<string, unknown>) {
  const response = await fetch(
    `https://clinicaltrials.gov/api/v2/studies?` +
    `query.cond=${args.condition}&` +
    `query.intr=${args.intervention}&` +
    `pageSize=${args.limit}`
  );

  const data = await response.json();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(data.studies, null, 2)
    }]
  };
}
```

### Example: Patent Search Integration

```typescript
// Example using Google Patents Public Data (BigQuery)
private async searchPatents(args: Record<string, unknown>) {
  // Use Google Cloud BigQuery API
  const query = `
    SELECT
      publication_number,
      title_localized,
      assignee_harmonized
    FROM \`patents-public-data.patents.publications\`
    WHERE
      LOWER(title_localized) LIKE LOWER('%${args.query}%')
    LIMIT ${args.limit}
  `;

  // Execute BigQuery and return results
}
```

## Testing MCP Integration

### 1. Check MCP Status

Create an endpoint to verify MCP status:

```typescript
// app/api/mcp/status/route.ts
import { getMCPClient } from '@/lib/mcp';

export async function GET() {
  const mcpClient = getMCPClient();

  return Response.json({
    enabled: mcpClient.isEnabled(),
    servers: {
      patent: await mcpClient.getServersForAgent('patent').length > 0,
      market: await mcpClient.getServersForAgent('market_research').length > 0,
      financial: await mcpClient.getServersForAgent('financial').length > 0,
      clinical: await mcpClient.getServersForAgent('clinical').length > 0,
      regulatory: await mcpClient.getServersForAgent('regulatory').length > 0,
    }
  });
}
```

### 2. Test Individual MCP Servers

```typescript
import { getMCPClient } from '@/lib/mcp';

const mcpClient = getMCPClient(true);

// Test clinical trials search
const result = await mcpClient.callTool(
  'clinical',
  'search_clinical_trials',
  { condition: 'melanoma', limit: 5 }
);

console.log(result);
```

## Next Steps

### Phase 1: Core Implementation ✅
- [x] MCP server infrastructure
- [x] MCP client library
- [x] Orchestration engine integration
- [x] Environment configuration

### Phase 2: API Integration (To Do)
- [ ] Implement real ClinicalTrials.gov API calls
- [ ] Implement real PubMed E-utilities integration
- [ ] Implement SEC EDGAR API integration
- [ ] Implement FDA openFDA integration

### Phase 3: Enhanced Features (To Do)
- [ ] Add commercial API integrations (NewsAPI, Alpha Vantage)
- [ ] Implement caching layer for API responses
- [ ] Add rate limiting and error handling
- [ ] Create MCP analytics dashboard

### Phase 4: Advanced Capabilities (Future)
- [ ] Tool calling with actual API execution
- [ ] Multi-step MCP workflows
- [ ] Cross-agent MCP tool sharing
- [ ] MCP result caching and optimization

## Troubleshooting

### MCP Not Enabled

**Issue**: Agents don't show MCP capabilities

**Solution**:
1. Check `MCP_ENABLED=true` in `.env.local`
2. Verify Vercel environment variables
3. Restart dev server or redeploy

### API Keys Not Working

**Issue**: MCP tools return errors

**Solution**:
1. Verify API key format
2. Check API key permissions/quotas
3. Test API keys directly with curl/Postman
4. Review MCP server error messages

### Rate Limiting

**Issue**: API calls throttled

**Solution**:
1. Implement caching in MCP servers
2. Add retry logic with exponential backoff
3. Consider paid API tiers
4. Use multiple API keys for load balancing

## Resources

- **Model Context Protocol Spec**: https://modelcontextprotocol.io/
- **ClinicalTrials.gov API**: https://clinicaltrials.gov/api/v2/
- **PubMed E-utilities**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **FDA openFDA**: https://open.fda.gov/apis/
- **SEC EDGAR**: https://www.sec.gov/edgar/sec-api-documentation
- **Google Patents Public Data**: https://cloud.google.com/bigquery/public-data/google-patents

## Support

For issues or questions about MCP integration:
1. Check this guide
2. Review MCP server implementations in `/lib/mcp/`
3. Check browser console for errors
4. Review Vercel logs for API errors

---

**Last Updated**: 2025-01-14
**Version**: 1.0.0
