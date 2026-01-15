# Clinical Data Analyst Agent - Review Document

## Current Configuration

### Agent Identity
- **Name:** Clinical Data Analyst
- **Agent Type:** `clinical`
- **Icon:** 🔬
- **Color:** blue

### Model Configuration
```typescript
{
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 1.0,
  apiKey: process.env.ANTHROPIC_API_KEY
}
```

**Rationale:** Claude Sonnet 4 selected for superior reasoning capabilities needed for complex clinical trial analysis, efficacy interpretation, and safety assessments.

---

## Current System Prompt

The agent's system prompt is defined in `src/lib/agentPrompts.ts`:

### Expertise Areas
- Clinical trial design and endpoints
- Efficacy and safety analysis
- Competitive clinical benchmarking
- Regulatory pathways (FDA, EMA)
- Phase progression probabilities
- Pharmaceutical intelligence analytics (trial success probabilities, Phase Transition Rates)

### Citation Requirements
The agent follows strict citation protocols:
1. **Numbered citations** [1], [2], [3] for every factual claim
2. **Primary Sources:**
   - ClinicalTrials.gov for trial information (NCT numbers, endpoints, design)
   - PubMed/peer-reviewed publications for efficacy and safety data
   - FDA documents for regulatory decisions and approval letters

3. **Citation Format:**
   - Publications: Author(s). "Title." Journal. Year. DOI/PMID with links
   - Clinical Trials: ClinicalTrials.gov. NCT[number]. "[Title]." Last Updated: [Date]
   - FDA Documents: FDA. [Document Type]. [Drug Name]. [Date]

4. **Verification Checklist:**
   - ✓ Source exists and is accessible
   - ✓ Trial ID (NCT#) matches trial description
   - ✓ Data cutoff date is stated
   - ✓ Endpoint results match source exactly
   - ✓ Statistical significance (p-values, CI) cited correctly
   - ✓ Safety data (Grade 3+ AEs, specific events) verified

### What Gets Cited
- Trial results: ORR, PFS, OS, DOR with confidence intervals
- Safety data: Grade 3+ AEs, specific adverse events, discontinuation rates
- Trial design: Endpoints, patient population, sample size, comparator
- Regulatory: FDA approvals, breakthrough designations, guidance
- Competitive benchmarks: Competitor trial results and comparisons

### Inter-Agent Communication
The agent can ask other agents:
- `[ASK_PATENT: "Are there blocking patents for the mechanism used in this trial?"]`
- `[ASK_FINANCIAL: "What is the estimated Phase 3 trial cost for a similar program?"]`
- `[ASK_MARKET: "What is the current competitive landscape?"]`
- `[ASK_REGULATORY: "What is the FDA approval pathway for this indication?"]`

---

## MCP Integration

### Connected MCP Servers
1. **ClinicalTrials.gov** (`clinical_db`)
   - Access to clinical trial database
   - Trial information, endpoints, design

2. **Gosset.ai** (`gosset_db`)
   - Pharmaceutical intelligence platform
   - Phase Transition Rates (PTRs)
   - Trial success predictions
   - 100K+ drug assets database

### MCP Context
The agent receives MCP context automatically when MCP is enabled, providing:
- Real-time trial data from ClinicalTrials.gov
- Phase transition probabilities from Gosset.ai
- Trial design benchmarks

---

## Current Capabilities

### Analysis Types
1. **Clinical Trial Analysis**
   - Extract efficacy endpoints (ORR, PFS, OS, DOR)
   - Statistical significance (p-values, confidence intervals)
   - Safety signals and adverse events

2. **Competitive Benchmarking**
   - Compare trial results across competitors
   - Phase transition rate analysis
   - Success probability predictions

3. **Regulatory Intelligence**
   - FDA approval pathways
   - Breakthrough designations
   - Regulatory precedents

4. **Trial Design Assessment**
   - Endpoint selection
   - Patient population analysis
   - Sample size recommendations

---

## Files to Review

1. **Agent Prompt:** `src/lib/agentPrompts.ts` (lines 20-96)
2. **Agent Config:** `src/lib/llm/agentConfig.ts` (lines 12-19)
3. **MCP Integration:** `src/lib/mcp/mcpClient.ts` (line 17)
4. **Agent Metadata:** `src/lib/customAgentTeams.ts` (lines 160-165)

---

## Potential Areas for Enhancement

### 1. Prompt Improvements
- Add more specific guidance on biomarker analysis
- Include guidance on adaptive trial designs
- Add instructions for real-world evidence (RWE) analysis
- Enhance guidance on subgroup analysis interpretation

### 2. Citation Enhancements
- Add support for EMA (European Medicines Agency) citations
- Include guidance for citing conference abstracts (ASCO, ESMO)
- Add support for citing preprints (bioRxiv, medRxiv)

### 3. MCP Integration
- Verify Gosset.ai integration is working correctly
- Add additional clinical data sources if needed
- Enhance MCP context formatting

### 4. Output Formatting
- Structured output for trial comparisons
- Tables for efficacy endpoints
- Visual formatting for safety profiles

---

## Questions for Review

1. **Prompt Content:**
   - Are there specific clinical analysis areas to emphasize?
   - Should we add guidance for specific therapeutic areas?
   - Any citation format changes needed?

2. **Model Configuration:**
   - Is temperature 1.0 appropriate (allows creativity but may reduce consistency)?
   - Should maxTokens be increased for complex analyses?

3. **MCP Integration:**
   - Are both ClinicalTrials.gov and Gosset.ai connections working as expected?
   - Should we add additional data sources?

4. **Inter-Agent Communication:**
   - Are the current question types sufficient?
   - Should we add more specific question formats?

---

## Next Steps

After review, we can:
1. Update the system prompt with your changes
2. Adjust model configuration if needed
3. Enhance MCP integration
4. Add new capabilities or analysis types
5. Improve citation formats or requirements
