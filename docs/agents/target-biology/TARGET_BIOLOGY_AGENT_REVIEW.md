# Target Biology Agent Implementation Review

## ✅ What the Prompt Covers Well

1. **TypeScript/Node.js Implementation** ✅
   - Full TypeScript with proper types
   - Uses native `fetch` for async HTTP calls
   - Matches existing codebase style

2. **Direct API Clients** ✅
   - All 5 required clients (Open Targets, gnomAD, ChEMBL, UniProt, PubMed)
   - Proper error handling and retry logic
   - GraphQL and REST implementations

3. **Caching & Rate Limiting** ✅
   - `Cache` class with TTL
   - `RateLimiter` with token bucket algorithm
   - Exponential backoff for retries

4. **Data Models** ✅
   - Comprehensive Zod schemas
   - Type inference from schemas
   - All required models present

5. **Agent Core Logic** ✅
   - `TargetBiologyAgent` class with all assessment methods
   - Parallel execution where possible
   - LLM synthesis integration points

## ❌ Critical Missing Pieces

### 1. **Integration with Existing Agent System**

**Missing:**
- Adding `'target_biology'` to `AgentType` union type
- Adding agent config to `agentConfig.ts`
- Adding agent prompt to `agentPrompts.ts`
- Updating orchestration engine to handle new agent
- Creating API route for standalone calls

**Required Changes:**

```typescript
// src/lib/multiAgentTypes.ts
export type AgentType = 
  | 'clinical' 
  | 'patent' 
  | 'financial' 
  | 'regulatory' 
  | 'market_research'
  | 'target_biology'; // ADD THIS

// src/lib/llm/agentConfig.ts
export const AGENT_MODEL_CONFIG: Record<AgentType, LLMClientConfig> = {
  // ... existing agents
  target_biology: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.3,
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
};

export function getAgentName(agent: AgentType): string {
  const names: Record<AgentType, string> = {
    // ... existing
    target_biology: 'Target Biology Specialist',
  };
  return names[agent];
}
```

### 2. **LLM Client Integration**

**Issue:** Prompt uses placeholder `LLMClient` interface

**Fix Required:**

```typescript
// In targetBiologyAgent.ts, replace:
export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

// With:
import { createLLMClient, LLMClientConfig } from '../llm/clientFactory';
import { ILLMClient } from '../llm/types';

// Then in constructor:
constructor(llmConfig?: LLMClientConfig) {
  // ...
  this.llm = llmConfig 
    ? createLLMClient(llmConfig)
    : undefined;
}

// Update all LLM calls to use:
private async generateWithLLM(prompt: string): Promise<string> {
  if (!this.llm) {
    return 'LLM not configured';
  }
  const response = await this.llm.sendMessage(
    'You are a target biology expert. Provide concise, accurate analysis.',
    prompt,
    { maxTokens: 2048 }
  );
  return response.content;
}
```

### 3. **Agent Prompt**

**Missing:** System prompt for target_biology agent

**Required Addition to `agentPrompts.ts`:**

```typescript
target_biology: `You are an expert target biology specialist specializing in therapeutic target validation and druggability assessment.

Your expertise includes:
- Human genetic validation (GWAS, gene burden, constraint metrics)
- Druggability assessment (protein class, tractability, existing compounds)
- Mechanistic rationale synthesis from literature
- Safety signal identification
- Target biology due diligence

**CITATION REQUIREMENTS (MANDATORY):**

Follow the Citation Protocol for ALL factual claims:
1. Use numbered citations [1], [2], [3] immediately after EVERY claim
2. Primary Sources:
   - Open Targets Platform for genetic associations
   - gnomAD for constraint metrics
   - ChEMBL for existing compounds
   - UniProt for protein information
   - PubMed for literature
3. Citation Format:
   [1] Open Targets. Target: [GENE]. Association Score: [X]. 
       [View →](https://www.opentargets.org/target/[ENSEMBL_ID])
   [2] gnomAD. Gene: [GENE]. pLI: [X], LOEUF: [Y].
       [View →](https://gnomad.broadinstitute.org/gene/[GENE_ID])
   [3] Author(s). "Title." Journal. Year. PMID: [PMID]
       [View PubMed →](https://pubmed.ncbi.nlm.nih.gov/[PMID]/)

**What to Cite:**
- Genetic association scores and evidence types [#]
- Constraint metrics (pLI, LOEUF, mis_z) [#]
- Existing compounds and their phases [#]
- Key publications and mechanistic insights [#]
- Safety signals from genetic data [#]

**Output Format:**
- Provide structured assessment with clear sections
- Include quantitative metrics where available
- Highlight key risks and opportunities
- Recommend next steps for validation

If you need information from other experts, ask:
- [ASK_CLINICAL: "What are the clinical trial results for this target?"]
- [ASK_PATENT: "Are there blocking patents for this target?"]
- [ASK_FINANCIAL: "What is the market opportunity for this target?"]`,
```

### 4. **File Structure Alignment**

**Issue:** Prompt uses `src/agents/`, `src/clients/` but existing structure uses `src/lib/`

**Recommended Structure (align with existing):**

```
src/
├── lib/
│   ├── agents/              # NEW: Agent implementations
│   │   └── targetBiologyAgent.ts
│   ├── clients/             # NEW: API clients
│   │   ├── openTargetsClient.ts
│   │   ├── gnomadClient.ts
│   │   ├── chemblClient.ts
│   │   ├── uniprotClient.ts
│   │   └── pubmedClient.ts
│   ├── models/              # NEW: Data models
│   │   └── targetBiology.ts
│   ├── utils/                # NEW: Utilities
│   │   ├── rateLimiter.ts
│   │   └── cache.ts
│   ├── llm/                  # EXISTING
│   ├── orchestrationEngine.ts # EXISTING (needs update)
│   └── agentPrompts.ts       # EXISTING (needs update)
```

### 5. **API Route for Standalone Calls**

**Missing:** Express route for calling agent directly from tiles

**Required Addition:**

```typescript
// server/api/agents/target-biology.ts
import { Router, Request, Response } from 'express';
import { TargetBiologyAgent } from '../../../src/lib/agents/targetBiologyAgent';
import { createLLMClient } from '../../../src/lib/llm/clientFactory';
import { AGENT_MODEL_CONFIG } from '../../../src/lib/llm/agentConfig';
import { isAuthenticated } from '../../lib/auth';

const router = Router();

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { targetSymbol, indication, depth, query } = req.body;

    if (!targetSymbol) {
      return res.status(400).json({ error: 'targetSymbol is required' });
    }

    const llmConfig = AGENT_MODEL_CONFIG.target_biology;
    const agent = new TargetBiologyAgent(llmConfig);

    // If query provided, use it; otherwise do full assessment
    let result;
    if (query) {
      // For tile chat queries, assess target and answer query
      const report = await agent.assessTarget(targetSymbol, { indication, depth: depth || 'standard' });
      // Use LLM to answer query based on report
      result = await agent.answerQuery(query, report);
    } else {
      // Full assessment
      result = await agent.assessTarget(targetSymbol, { indication, depth: depth || 'standard' });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Target biology agent error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess target' });
  }
});

export default router;
```

### 6. **Orchestration Engine Integration**

**Required Updates to `orchestrationEngine.ts`:**

```typescript
// Update createInitialPlan to include target_biology
function createInitialPlan(mode: ExecutionMode, customAgents?: AgentType[]): ExecutionPlan {
  const validAgents: AgentType[] = [
    'clinical', 
    'patent', 
    'financial', 
    'market_research', 
    'regulatory',
    'target_biology' // ADD THIS
  ];
  // ... rest of function
}

// Update callAgent to handle target_biology specially
async function callAgent(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string,
  mcpEnabled?: boolean
): Promise<{ response: string; usage?: { inputTokens: number; outputTokens: number } }> {
  
  // Special handling for target_biology (uses API clients, not just LLM)
  if (agent === 'target_biology') {
    const targetSymbol = extractTargetSymbol(query); // Extract from query
    const llmConfig = AGENT_MODEL_CONFIG.target_biology;
    const biologyAgent = new TargetBiologyAgent(llmConfig);
    
    const report = await biologyAgent.assessTarget(targetSymbol, {
      indication: extractIndication(query),
      depth: 'standard'
    });
    
    // Format report based on context
    const formatted = additionalContext?.includes('scientist')
      ? biologyAgent.formatScientistOutput(report)
      : biologyAgent.formatBDOutput(report);
    
    return {
      response: formatted,
      usage: { inputTokens: 0, outputTokens: 0 } // Could track actual usage
    };
  }
  
  // ... existing agent handling
}
```

### 7. **Dependencies**

**Missing Dependencies:**
- `zod` - Not in package.json
- `vitest` - Not in package.json (for tests)

**Required Additions:**

```json
{
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### 8. **Tile Integration**

**Missing:** How to call agent from tiles

**Required Addition to `Tile.tsx`:**

```typescript
// In Tile.tsx chat handler
const handleChatSubmit = async (message: string) => {
  setIsThinking(true);
  
  try {
    // Extract target symbol from tile context or use current target
    const targetSymbol = extractTargetFromTile(tileType, data);
    
    const response = await fetch('/api/agents/target-biology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetSymbol,
        query: message,
        indication: currentTarget?.indication,
        depth: 'standard'
      })
    });
    
    const result = await response.json();
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'sonny',
      content: result.response || result.executiveSummary,
      timestamp: new Date()
    }]);
  } catch (error) {
    // Error handling
  } finally {
    setIsThinking(false);
  }
};
```

### 9. **PubMed XML Parsing**

**Issue:** Prompt uses regex-based XML parsing (fragile)

**Better Solution:**

```typescript
// Install: npm install fast-xml-parser
import { XMLParser } from 'fast-xml-parser';

private parseXmlResponse(xml: string): PubMedArticle[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_'
  });
  const json = parser.parse(xml);
  // Proper XML parsing logic
}
```

### 10. **Error Handling in Orchestration**

**Issue:** If target_biology agent fails, it shouldn't break entire orchestration

**Required:** Graceful degradation in orchestration engine

## Summary: What Needs to Be Added

1. ✅ **Core Implementation** - Prompt covers this well
2. ❌ **Agent System Integration** - Add to AgentType, config, prompts
3. ❌ **LLM Client Integration** - Use existing createLLMClient
4. ❌ **API Route** - Create Express route for standalone calls
5. ❌ **Orchestration Integration** - Update orchestration engine
6. ❌ **Tile Integration** - Show how to call from tiles
7. ❌ **Dependencies** - Add zod and vitest
8. ⚠️ **XML Parsing** - Use proper XML parser instead of regex

## Recommendation

**The prompt is 70% complete.** It has excellent core implementation but is missing critical integration pieces. 

**Action Plan:**
1. Use the prompt as-is for core agent implementation
2. Add the missing integration pieces listed above
3. Align file structure with existing `src/lib/` convention
4. Add dependencies (zod, vitest)
5. Create API route and orchestration integration
6. Add tile integration examples

**Estimated Additional Work:** ~2-3 hours to add all integration pieces.
