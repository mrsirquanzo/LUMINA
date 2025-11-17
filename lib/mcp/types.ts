// MCP (Model Context Protocol) Types
// Provides external data source integration for agents

export type MCPProvider =
  | 'patent_db'      // USPTO, Google Patents
  | 'market_data'    // Market intelligence, news
  | 'financial_db'   // SEC filings, financial data
  | 'clinical_db'    // ClinicalTrials.gov, PubMed
  | 'regulatory_db'  // FDA, EMA databases
  | 'gosset_db';     // Gosset.ai pharmaceutical intelligence (live MCP)

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
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

export interface MCPServerConfig {
  provider: MCPProvider;
  enabled: boolean;
  tools: MCPTool[];
  resources?: MCPResource[];
  apiKey?: string;
  baseUrl?: string;
}

export interface MCPClientConfig {
  servers: Record<MCPProvider, MCPServerConfig>;
}

export interface MCPContext {
  provider: MCPProvider;
  tools: MCPTool[];
  resources: MCPResource[];
}

export interface MCPToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface IMCPServer {
  provider: MCPProvider;
  name: string;
  version: string;

  /**
   * List available tools
   */
  listTools(): Promise<MCPTool[]>;

  /**
   * List available resources
   */
  listResources(): Promise<MCPResource[]>;

  /**
   * Execute a tool
   */
  callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>;

  /**
   * Read a resource
   */
  readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType?: string; text?: string }> }>;
}
