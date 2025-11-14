# MCP Architecture Documentation

## System Overview

The Model Context Protocol (MCP) integration in Q · E provides a scalable, modular architecture for connecting specialized AI agents to external data sources. This document describes the technical architecture, design decisions, and implementation details.

## Core Principles

### 1. **Separation of Concerns**
- **MCP Servers**: Handle data source integration (patents, clinical, financial, etc.)
- **MCP Client**: Manages server lifecycle and provides unified interface
- **Orchestration Engine**: Injects MCP context into agent workflows
- **Agents**: Consume MCP capabilities without awareness of implementation

### 2. **Extensibility**
- New MCP servers can be added without modifying existing code
- Each server implements standard `IMCPServer` interface
- Agent-to-server mapping is configurable

### 3. **Opt-In Design**
- MCP is disabled by default (`MCP_ENABLED=false`)
- System works identically with or without MCP
- No breaking changes to existing functionality

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Orchestration Engine                        │
│  - Coordinates agent execution                                  │
│  - Injects MCP context into agent prompts                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │     MCP Client       │
              │  - Server management │
              │  - Context injection │
              │  - Tool routing      │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┬────────────┐
         │               │               │              │            │
         ▼               ▼               ▼              ▼            ▼
┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐
│  Clinical  │  │    Patent    │  │ Financial│  │   Market   │  │ Regulatory │
│MCP Server  │  │  MCP Server  │  │   MCP    │  │    MCP     │  │    MCP     │
│            │  │              │  │  Server  │  │   Server   │  │   Server   │
└─────┬──────┘  └──────┬───────┘  └────┬─────┘  └─────┬──────┘  └─────┬──────┘
      │                │               │              │               │
      ▼                ▼               ▼              ▼               ▼
┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐
│ClinicalTrials│ │    USPTO     │  │   SEC    │  │   News     │  │    FDA     │
│   PubMed   │  │Google Patents│  │  Edgar   │  │    APIs    │  │  openFDA   │
│            │  │              │  │  Yahoo   │  │  Market    │  │    EMA     │
└────────────┘  └──────────────┘  └──────────┘  └────────────┘  └────────────┘
```

## Type System

### Core Interfaces

```typescript
// lib/mcp/types.ts

export interface IMCPServer {
  provider: MCPProvider;
  name: string;
  version: string;

  listTools(): Promise<MCPTool[]>;
  listResources(): Promise<MCPResource[]>;
  callTool(name: string, arguments: Record<string, unknown>): Promise<MCPToolResult>;
  readResource(uri: string): Promise<{ contents: Array<{ ... }> }>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    resource?: MCPResource;
  }>;
  isError?: boolean;
}
```

### Type Safety Benefits

1. **Compile-time validation**: TypeScript catches errors before runtime
2. **IntelliSense support**: IDE autocomplete for MCP tools and methods
3. **Refactoring safety**: Changes propagate through type system
4. **Documentation**: Types serve as inline documentation

## MCP Client

### Singleton Pattern

```typescript
// lib/mcp/mcpClient.ts

let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(enabled?: boolean): MCPClient {
  if (!mcpClientInstance) {
    const isEnabled = enabled ?? (process.env.MCP_ENABLED === 'true');
    mcpClientInstance = new MCPClient(isEnabled);
  }
  return mcpClientInstance;
}
```

**Rationale**:
- Single source of truth for MCP state
- Lazy initialization (only created when first requested)
- Consistent configuration across application

### Agent-to-Server Mapping

```typescript
const AGENT_TO_MCP_PROVIDER: Record<AgentType, MCPProvider[]> = {
  clinical: ['clinical_db'],
  patent: ['patent_db'],
  financial: ['financial_db'],
  market_research: ['market_data'],
  regulatory: ['regulatory_db'],
};
```

**Design Decision**: One-to-many mapping allows agents to access multiple data sources in the future.

### Context Injection

```typescript
async getContextForAgent(agent: AgentType): Promise<string> {
  const tools = await this.getToolsForAgent(agent);
  const resources = await this.getResourcesForAgent(agent);

  let context = '\n\n## External Data Sources & Tools (MCP)\n\n';
  // ... Build context string with tools and resources
  return context;
}
```

The context is injected into the agent's system prompt, informing the LLM of available capabilities.

## MCP Servers

### Base Implementation Pattern

Each MCP server follows this structure:

```typescript
export class ExampleMCPServer implements IMCPServer {
  provider: MCPProvider = 'example_provider';
  name = 'Example Server';
  version = '1.0.0';

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async listTools(): Promise<MCPTool[]> {
    return [/* tool definitions */];
  }

  async listResources(): Promise<MCPResource[]> {
    return [/* resource definitions */];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    switch (name) {
      case 'tool_1': return await this.tool1(args);
      case 'tool_2': return await this.tool2(args);
      default: return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  }

  // Private tool implementations
  private async tool1(args: Record<string, unknown>): Promise<MCPToolResult> {
    // Implementation
  }
}
```

### Patent MCP Server

**Capabilities**:
- Patent search (USPTO, Google Patents)
- Patent details retrieval
- Patent landscape analysis
- Freedom-to-operate checks

**Data Sources**:
- USPTO PatentsView API (public)
- Google Patents Public Data (BigQuery)
- Espacenet (EPO)

**Implementation Strategy**:
1. Start with public APIs (no key required)
2. Add commercial APIs for enhanced features
3. Implement caching for frequently accessed patents

### Clinical MCP Server

**Capabilities**:
- Clinical trial search
- Trial details retrieval
- PubMed literature search
- Efficacy data analysis
- Trial design benchmarking

**Data Sources**:
- ClinicalTrials.gov API v2 (public)
- PubMed E-utilities (public)
- ClinicalKey (commercial, optional)

**Implementation Strategy**:
1. Use public APIs (sufficient for most queries)
2. Add rate limiting (ClinicalTrials.gov has strict limits)
3. Cache trial data (updated weekly)

### Financial MCP Server

**Capabilities**:
- SEC filings retrieval
- Financial analysis
- Stock data
- Company valuations
- Biotech comparable companies

**Data Sources**:
- SEC EDGAR (public)
- Alpha Vantage (freemium)
- Financial Modeling Prep (paid)
- Yahoo Finance API

**Implementation Strategy**:
1. Start with SEC EDGAR (no key, but rate limited)
2. Add Alpha Vantage for stock data (free tier: 5 calls/min)
3. Optionally integrate premium APIs for real-time data

### Market Research MCP Server

**Capabilities**:
- Market size data
- Company intelligence
- M&A deal tracking
- Competitive landscape analysis
- Industry news

**Data Sources**:
- NewsAPI (paid)
- EvaluatePharma (enterprise)
- Dealforma (enterprise)
- Public news sources (RSS, scraping)

**Implementation Strategy**:
1. Start with free news sources (RSS feeds)
2. Add NewsAPI for comprehensive news coverage
3. Integrate enterprise sources for clients with access

### Regulatory MCP Server

**Capabilities**:
- FDA approval search
- Regulatory pathway recommendations
- Guidance document search
- Precedent analysis
- Designation eligibility checks
- Approval timeline estimation

**Data Sources**:
- FDA openFDA (public)
- FDA Drugs@FDA (public)
- EMA public databases
- Regulatory intelligence platforms

**Implementation Strategy**:
1. Start with FDA openFDA (comprehensive, no key)
2. Add EMA databases for European approvals
3. Implement precedent analysis engine

## Orchestration Integration

### Context Injection Flow

```typescript
// lib/orchestrationEngine.ts

async function callAgent(
  agent: AgentType,
  query: string,
  documents: ProcessedDocument[],
  messages: AgentMessage[],
  additionalContext?: string
): Promise<{ response: string; usage?: { ... } }> {
  // 1. Get MCP client
  const mcpClient = getMCPClient();

  // 2. Get MCP context for this agent
  const mcpContext = await mcpClient.getContextForAgent(agent);

  // 3. Inject context into system prompt
  const systemPrompt = mcpClient.isEnabled()
    ? AGENT_PROMPTS[agent] + mcpContext
    : AGENT_PROMPTS[agent];

  // 4. Call LLM with enhanced prompt
  const client = createLLMClient(AGENT_MODEL_CONFIG[agent]);
  const llmResponse = await client.sendMessage(systemPrompt, userMessage, options);

  return { response: llmResponse.content, usage: llmResponse.usage };
}
```

### Impact on Agent Behavior

**Without MCP**:
```
System Prompt: "You are a clinical data analyst..."
Agent Response: "Based on my training knowledge..."
```

**With MCP**:
```
System Prompt: "You are a clinical data analyst...

## External Data Sources & Tools (MCP)

### Available Tools:
**search_clinical_trials**: Search ClinicalTrials.gov...
**search_pubmed**: Search PubMed for research...

### Available Databases:
- ClinicalTrials.gov: 400,000+ clinical trials
- PubMed: 35+ million citations"

Agent Response: "I would search ClinicalTrials.gov using the
search_clinical_trials tool with parameters..."
```

## Performance Considerations

### Lazy Initialization

MCP servers are initialized only when MCP is enabled:

```typescript
constructor(enabled: boolean = false) {
  this.enabled = enabled;
  if (this.enabled) {
    this.initializeServers();
  }
}
```

**Benefit**: Zero overhead when MCP is disabled.

### Async Context Generation

```typescript
async getContextForAgent(agent: AgentType): Promise<string> {
  if (!this.enabled) return '';  // Early return

  const tools = await this.getToolsForAgent(agent);
  const resources = await this.getResourcesForAgent(agent);
  // ...
}
```

**Benefit**: Non-blocking, returns empty string immediately if disabled.

### Caching Strategy (Future)

```typescript
private toolCache: Map<AgentType, MCPTool[]> = new Map();

async getToolsForAgent(agent: AgentType): Promise<MCPTool[]> {
  if (this.toolCache.has(agent)) {
    return this.toolCache.get(agent)!;
  }

  const tools = await this.computeTools(agent);
  this.toolCache.set(agent, tools);
  return tools;
}
```

## Error Handling

### Graceful Degradation

```typescript
async callTool(agent: AgentType, toolName: string, args: Record<string, unknown>) {
  if (!this.enabled) {
    return {
      content: [{ type: 'text', text: 'MCP is not enabled' }],
      isError: true,
    };
  }

  try {
    return await server.callTool(toolName, args);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
}
```

### Rate Limiting (To Implement)

```typescript
class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number; // milliseconds

  async throttle() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCall = Date.now();
  }
}
```

## Security Considerations

### API Key Management

1. **Never commit API keys**: All keys in environment variables
2. **Server-side only**: MCP calls happen on backend, never client
3. **Key rotation**: Support for updating keys without code changes

### Data Privacy

1. **No PII storage**: MCP tools don't persist user data
2. **Audit logging**: Track all MCP tool calls
3. **Rate limiting**: Prevent abuse

### Access Control

1. **Authentication required**: MCP only available to authenticated users
2. **Usage quotas**: Limit MCP calls per user/session
3. **Disable in demo mode**: Demo scenarios don't call real APIs

## Testing Strategy

### Unit Tests

```typescript
describe('MCPClient', () => {
  it('should initialize servers when enabled', () => {
    const client = new MCPClient(true);
    expect(client.isEnabled()).toBe(true);
  });

  it('should not initialize servers when disabled', () => {
    const client = new MCPClient(false);
    expect(client.isEnabled()).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Clinical MCP Server', () => {
  it('should search clinical trials', async () => {
    const server = new ClinicalMCPServer();
    const result = await server.callTool('search_clinical_trials', {
      condition: 'melanoma',
      limit: 5
    });

    expect(result.isError).toBe(false);
    expect(result.content).toBeDefined();
  });
});
```

### End-to-End Tests

Test MCP in full orchestration workflow with real agents.

## Deployment

### Environment Variables

Production deployment requires:

```bash
# Required (LLM APIs)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=pplx-...

# Optional (MCP)
MCP_ENABLED=true
PATENT_API_KEY=...
MARKET_DATA_API_KEY=...
FINANCIAL_API_KEY=...
```

### Vercel Configuration

```bash
# Set in Vercel dashboard or CLI
vercel env add MCP_ENABLED production
vercel env add PATENT_API_KEY production
vercel env add MARKET_DATA_API_KEY production
vercel env add FINANCIAL_API_KEY production
```

## Future Enhancements

### Phase 1: Core APIs ✅
- [x] MCP architecture
- [x] MCP client library
- [x] Server implementations (mock)
- [x] Orchestration integration

### Phase 2: Real API Integration
- [ ] ClinicalTrials.gov API
- [ ] PubMed E-utilities
- [ ] SEC EDGAR API
- [ ] FDA openFDA
- [ ] Google Patents BigQuery

### Phase 3: Advanced Features
- [ ] MCP tool result caching
- [ ] Rate limiting and quotas
- [ ] Usage analytics dashboard
- [ ] Multi-source data fusion

### Phase 4: AI-Powered Tools
- [ ] Automatic tool selection by agents
- [ ] Tool chaining (multi-step queries)
- [ ] Intelligent data aggregation
- [ ] Learned tool usage patterns

## References

- **MCP Specification**: https://modelcontextprotocol.io/
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/handbook/
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

**Last Updated**: 2025-01-14
**Version**: 1.0.0
