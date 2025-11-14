# MCP API Integration Guide

## Quick Reference: API Endpoints & Documentation

### 🟢 **FREE PUBLIC APIs** (No API Key Required)

These APIs are completely free and require no authentication. **Start here!**

#### 1. **ClinicalTrials.gov API v2**
- **Base URL**: `https://clinicaltrials.gov/api/v2/studies`
- **Documentation**: https://clinicaltrials.gov/api/v2/studies
- **Rate Limit**: ~1 request per second (be respectful)
- **No API Key**: ✅ Works immediately

**Example Request**:
```bash
# Search for melanoma trials
curl "https://clinicaltrials.gov/api/v2/studies?query.cond=melanoma&pageSize=10"

# Get specific trial by NCT ID
curl "https://clinicaltrials.gov/api/v2/studies/NCT05933577"

# Search by sponsor
curl "https://clinicaltrials.gov/api/v2/studies?query.lead=Moderna&pageSize=10"
```

**Try it now**: Open in browser: https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&pageSize=5

---

#### 2. **PubMed E-utilities API**
- **Base URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
- **Documentation**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **Rate Limit**: 3 requests/second (10/second with API key)
- **API Key**: Optional (free, increases rate limit)

**Get Free API Key**: https://www.ncbi.nlm.nih.gov/account/settings/

**Example Requests**:
```bash
# Search PubMed
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=cancer+immunotherapy&retmax=10&retmode=json"

# Get article details
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=36781259&retmode=json"
```

**Try it now**: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=melanoma&retmax=5&retmode=json

---

#### 3. **SEC EDGAR API**
- **Base URL**: `https://data.sec.gov/submissions/`
- **Documentation**: https://www.sec.gov/edgar/sec-api-documentation
- **Rate Limit**: 10 requests/second
- **No API Key**: ✅ Just need User-Agent header

**Important**: Must include a proper `User-Agent` header with your email.

**Example Requests**:
```bash
# Get company filings by CIK (Central Index Key)
curl -H "User-Agent: MyCompany contact@mycompany.com" \
  "https://data.sec.gov/submissions/CIK0001318605.json"

# Modern (Ticker: MRNA) - CIK: 0001682852
curl -H "User-Agent: MyCompany contact@mycompany.com" \
  "https://data.sec.gov/submissions/CIK0001682852.json"
```

**Lookup CIK by ticker**: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=MRNA&type=&dateb=&owner=exclude&count=10

**Try it now**: https://data.sec.gov/submissions/CIK0001682852.json

---

#### 4. **FDA openFDA API**
- **Base URL**: `https://api.fda.gov/drug/`
- **Documentation**: https://open.fda.gov/apis/
- **Rate Limit**: 240 requests/minute (1000/minute with key)
- **API Key**: Optional (free, increases rate limit)

**Get Free API Key**: https://open.fda.gov/apis/authentication/

**Example Requests**:
```bash
# Search drug approvals
curl "https://api.fda.gov/drug/drugsfda.json?search=openfda.brand_name:keytruda&limit=10"

# Search adverse events
curl "https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:keytruda&limit=10"

# Search drug labels
curl "https://api.fda.gov/drug/label.json?search=openfda.brand_name:keytruda&limit=1"
```

**Try it now**: https://api.fda.gov/drug/drugsfda.json?search=openfda.brand_name:keytruda&limit=1

---

### 🟡 **FREEMIUM APIs** (Free Tier Available)

These APIs have free tiers but require registration.

#### 5. **Gosset.ai Pharmaceutical Intelligence** (Trial Success Rates & Benchmarks) 🆕

**Gosset.ai** provides programmatic access to comprehensive clinical trial outcome data, Phase Transition Rates (PTRs), and pharmaceutical intelligence across 100,000+ drug assets.

- **Website**: https://gosset.ai
- **GitHub**: https://github.com/gosset-ai
- **Documentation**: https://docs.gosset.ai
- **MCP Server**: `https://mcp.gosset.ai/sse`
- **Pricing**: Contact sales (enterprise pricing)

**What Makes Gosset Unique:**
- **Verified Trial Outcomes**: Human-verified efficacy/safety data from papers, posters, decks, press releases (not just CT.gov registry)
- **Phase Transition Rates (PTRs)**: Historical success rates by indication, modality, and phase
- **Trial Benchmarks**: Sample sizes, endpoints, durations across therapeutic areas
- **Success Predictions**: AI-powered probability estimates for trial outcomes

**Current Implementation in Q·E Portfolio:**
✅ **Simulated Integration** for demonstration purposes
- Mock PTR database with realistic data for 7 major indications
- Trial benchmark data for Phase 2/3 across Alzheimer's, NSCLC, Melanoma
- Two MCP tools: `estimate_trial_success_rate` and `get_trial_benchmarks`

**Example Queries (Simulated Data):**
```typescript
// Phase 2 → Phase 3 success rate for Alzheimer's Disease
{
  indication: "Alzheimer's Disease",
  from_phase: "Phase 2",
  to_phase: "Phase 3"
}
// Returns: 23.4% success rate, 847 trials analyzed, 156 avg patients/arm

// Trial design benchmarks
{
  indication: "Melanoma",
  phase: "Phase 2"
}
// Returns: 128 avg sample size, ORR/DOR/PFS endpoints, 15-month duration
```

**Why Simulated for Portfolio:**
- Demonstrates awareness of cutting-edge pharmaceutical intelligence tools
- Shows MCP integration capabilities without API costs
- Data based on realistic biotech industry benchmarks
- Can be upgraded to live API for production use

**To Enable Live Integration:**
1. Contact Gosset.ai for API access
2. Install Python SDK: `pip install gosset[agents]`
3. Authenticate: `gosset get-token` (OAuth browser flow)
4. Set environment variable: `GOSSET_OAUTH_TOKEN=your_token`
5. Replace simulated methods in `lib/mcp/clinicalServer.ts`

**Disclaimer:** Current implementation uses simulated data for portfolio demonstration. Real Gosset.ai provides verified historical outcomes.

---

#### 6. **Alpha Vantage** (Stock & Financial Data)
- **Base URL**: `https://www.alphavantage.co/query`
- **Documentation**: https://www.alphavantage.co/documentation/
- **Free Tier**: 25 requests/day, 5 requests/minute
- **API Key**: Required (free signup)

**Get Free API Key**: https://www.alphavantage.co/support/#api-key

**Example Requests**:
```bash
API_KEY="your_key_here"

# Get stock quote
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=MRNA&apikey=$API_KEY"

# Get company overview
curl "https://www.alphavantage.co/query?function=OVERVIEW&symbol=MRNA&apikey=$API_KEY"

# Get income statement
curl "https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=MRNA&apikey=$API_KEY"
```

---

#### 6. **NewsAPI** (News & Press Releases)
- **Base URL**: `https://newsapi.org/v2/`
- **Documentation**: https://newsapi.org/docs
- **Free Tier**: 100 requests/day (dev only, can't use in production)
- **Paid**: $449/month for commercial use

**Get Free API Key**: https://newsapi.org/register

**Example Requests**:
```bash
API_KEY="your_key_here"

# Search biotech news
curl "https://newsapi.org/v2/everything?q=biotech+OR+biopharma&apiKey=$API_KEY"

# Search by company
curl "https://newsapi.org/v2/everything?q=Moderna&apiKey=$API_KEY&pageSize=10"
```

**Alternative (Free)**: Use RSS feeds from:
- FierceBiotech: https://www.fiercebiotech.com/rss/xml
- BioPharma Dive: https://www.biopharmadive.com/feeds/news/
- STAT News: https://www.statnews.com/feed/

---

#### 7. **Financial Modeling Prep** (SEC Filings & Financials)
- **Base URL**: `https://financialmodelingprep.com/api/v3/`
- **Documentation**: https://site.financialmodelingprep.com/developer/docs
- **Free Tier**: 250 requests/day
- **Paid**: $14-99/month

**Get Free API Key**: https://site.financialmodelingprep.com/developer/docs

**Example Requests**:
```bash
API_KEY="your_key_here"

# Get company profile
curl "https://financialmodelingprep.com/api/v3/profile/MRNA?apikey=$API_KEY"

# Get income statement
curl "https://financialmodelingprep.com/api/v3/income-statement/MRNA?limit=5&apikey=$API_KEY"

# Get SEC filings
curl "https://financialmodelingprep.com/api/v3/sec_filings/MRNA?type=10-K&limit=5&apikey=$API_KEY"
```

---

### 🔴 **PREMIUM APIs** (Paid Only)

These require paid subscriptions but provide high-quality data.

#### 8. **Google Patents Public Data** (BigQuery)
- **Platform**: Google Cloud BigQuery
- **Documentation**: https://cloud.google.com/bigquery/public-data/google-patents
- **Cost**: Free tier (1 TB queries/month), then $5/TB
- **Requires**: Google Cloud account

**Setup**:
1. Create Google Cloud project
2. Enable BigQuery API
3. Use `patents-public-data` dataset

**Example Query**:
```sql
SELECT
  publication_number,
  title_localized,
  assignee_harmonized,
  filing_date
FROM `patents-public-data.patents.publications`
WHERE
  LOWER(title_localized) LIKE '%car-t%'
  AND country_code = 'US'
LIMIT 10
```

---

#### 9. **EvaluatePharma** (Market Intelligence)
- **Type**: Enterprise only
- **Documentation**: Contact sales
- **Cost**: ~$30,000-50,000/year
- **Features**: Pipeline data, market forecasts, deals

**Alternative (Free)**:
- Scrape FDA approvals: https://www.fda.gov/drugs/new-drugs-fda-cders-new-molecular-entities-and-new-therapeutic-biological-products
- Use PubMed for clinical data

---

## 📋 Implementation Priority

### **Phase 1: Implement Free Public APIs** (Highest Value, Zero Cost)

1. **ClinicalTrials.gov** → Clinical MCP Server
2. **PubMed** → Clinical MCP Server
3. **SEC EDGAR** → Financial MCP Server
4. **FDA openFDA** → Regulatory MCP Server

These 4 APIs cover 80% of the value with 0% cost.

---

### **Phase 2: Add Freemium APIs** (Enhanced Features)

5. **Alpha Vantage** → Financial MCP Server (stock data)
6. **Financial Modeling Prep** → Financial MCP Server (better financials)
7. **PubMed API Key** → Clinical MCP Server (faster rate limits)
8. **FDA API Key** → Regulatory MCP Server (faster rate limits)

---

### **Phase 3: Consider Premium APIs** (Optional, Advanced Features)

9. **NewsAPI** → Market Research MCP Server (if going commercial)
10. **Google Patents** → Patent MCP Server (comprehensive patent search)

---

## 🚀 Quick Start: Implement ClinicalTrials.gov First

Here's exactly how to implement the first API integration:

### Step 1: Test the API Manually

```bash
# Try this in your terminal or browser:
curl "https://clinicaltrials.gov/api/v2/studies?query.cond=melanoma&pageSize=5" | jq
```

Expected response:
```json
{
  "studies": [
    {
      "protocolSection": {
        "identificationModule": {
          "nctId": "NCT05933577",
          "briefTitle": "Study of mRNA-4157 in combination with pembrolizumab..."
        }
      }
    }
  ]
}
```

### Step 2: Update `lib/mcp/clinicalServer.ts`

Replace the mock implementation in `searchClinicalTrials`:

```typescript
private async searchClinicalTrials(args: Record<string, unknown>): Promise<MCPToolResult> {
  const condition = args.condition as string | undefined;
  const intervention = args.intervention as string | undefined;
  const sponsor = args.sponsor as string | undefined;
  const limit = (args.limit as number) || 20;

  // Build query parameters
  const params = new URLSearchParams();
  if (condition) params.append('query.cond', condition);
  if (intervention) params.append('query.intr', intervention);
  if (sponsor) params.append('query.lead', sponsor);
  params.append('pageSize', limit.toString());

  try {
    // Make real API call
    const response = await fetch(
      `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant trial information
    const trials = data.studies?.map((study: any) => ({
      nctId: study.protocolSection?.identificationModule?.nctId,
      title: study.protocolSection?.identificationModule?.briefTitle,
      status: study.protocolSection?.statusModule?.overallStatus,
      sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
      phase: study.protocolSection?.designModule?.phases,
      enrollment: study.protocolSection?.designModule?.enrollmentInfo?.count,
    })) || [];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query: { condition, intervention, sponsor },
            totalResults: trials.length,
            trials,
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
```

### Step 3: Test the Integration

```typescript
// Test in your app or via a test script
import { ClinicalMCPServer } from '@/lib/mcp/clinicalServer';

const server = new ClinicalMCPServer();
const result = await server.callTool('search_clinical_trials', {
  condition: 'melanoma',
  limit: 5
});

console.log(result);
```

---

## 📚 Additional Resources

### Finding More APIs

1. **RapidAPI Hub**: https://rapidapi.com/hub
   - Aggregates thousands of APIs
   - Has biotech, finance, news categories
   - Often has free tiers

2. **Public APIs Directory**: https://github.com/public-apis/public-apis
   - Curated list of free APIs
   - Organized by category
   - Shows which require auth

3. **ProgrammableWeb**: https://www.programmableweb.com/
   - API directory and news
   - Search by industry

### API Testing Tools

1. **Postman**: https://www.postman.com/
   - Test APIs before implementing
   - Generate code snippets

2. **curl**: Built into terminal
   - Quick testing
   - Good for debugging

3. **jq**: JSON processor
   - Parse JSON responses
   - Extract specific fields

```bash
# Install jq
brew install jq  # macOS
sudo apt install jq  # Linux

# Use with curl
curl "https://api.fda.gov/drug/drugsfda.json?limit=1" | jq
```

---

## 🔐 API Key Management Best Practices

### Environment Variables
```bash
# .env.local
CLINICALTRIALS_API_KEY=not_needed_but_good_practice
PUBMED_API_KEY=your_ncbi_key_here
ALPHA_VANTAGE_API_KEY=your_av_key_here
NEWS_API_KEY=your_news_api_key_here
```

### In Code
```typescript
const apiKey = process.env.PUBMED_API_KEY;
if (!apiKey) {
  console.warn('PubMed API key not set - using lower rate limits');
}
```

### Vercel Deployment
```bash
vercel env add PUBMED_API_KEY production
vercel env add ALPHA_VANTAGE_API_KEY production
```

---

## 🎯 Recommended Implementation Order

1. **Week 1**: ClinicalTrials.gov + PubMed
   - Highest value for biotech analysis
   - Both free, no keys needed
   - Implement in Clinical MCP Server

2. **Week 2**: SEC EDGAR + FDA openFDA
   - Free public data
   - Implement in Financial + Regulatory servers
   - Adds regulatory and financial capabilities

3. **Week 3**: Alpha Vantage (free tier)
   - Add stock data to Financial MCP Server
   - Sign up for free key
   - 25 requests/day is enough for demos

4. **Week 4**: Polish & Caching
   - Add response caching
   - Implement rate limiting
   - Error handling & retry logic

---

## ⚡ Quick API Key Signup Links

| Service | Signup Link | Time | Cost |
|---------|-------------|------|------|
| PubMed | https://www.ncbi.nlm.nih.gov/account/register/ | 2 min | Free |
| FDA openFDA | https://open.fda.gov/apis/authentication/ | 2 min | Free |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key | 1 min | Free |
| NewsAPI | https://newsapi.org/register | 2 min | Free (dev) |
| Financial Modeling Prep | https://site.financialmodelingprep.com/register | 2 min | Free tier |

---

## 📞 Need Help?

- **ClinicalTrials.gov Support**: https://clinicaltrials.gov/about-site/contact
- **PubMed Help**: https://support.nlm.nih.gov/
- **SEC EDGAR Help**: https://www.sec.gov/edgar/searchedgar/accessing-edgar-data.htm
- **FDA openFDA Help**: https://open.fda.gov/about/

---

**Start with ClinicalTrials.gov - it requires zero setup and provides immediate value!**

Try this right now in your browser:
https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&pageSize=3
