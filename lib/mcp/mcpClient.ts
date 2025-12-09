// MCP Client Library
// Provides unified interface to all MCP servers for agent integration

import { AgentType } from '../multiAgentTypes';
import { IMCPServer, MCPProvider, MCPTool, MCPResource, MCPToolResult } from './types';
import { PatentMCPServer } from './patentServer';
import { MarketMCPServer } from './marketServer';
import { FinancialMCPServer } from './financialServer';
import { ClinicalMCPServer } from './clinicalServer';
import { RegulatoryMCPServer } from './regulatoryServer';
import { GossetLiveMCPServer } from './gossetLiveServer';

/**
 * Map agent types to their primary MCP providers
 */
const AGENT_TO_MCP_PROVIDER: Record<AgentType, MCPProvider[]> = {
  clinical: ['clinical_db', 'gosset_db'],  // Clinical agent has both ClinicalTrials.gov AND Gosset.ai
  patent: ['patent_db'],
  financial: ['financial_db'],
  market_research: ['market_data'],
  regulatory: ['regulatory_db'],
  target_biology: [], // Target Biology agent currently uses LLM-only (no MCP providers yet)
};

/**
 * MCP Client manages all MCP servers and provides context to agents
 */
export class MCPClient {
  private servers: Map<MCPProvider, IMCPServer> = new Map();
  private enabled: boolean;

  constructor(enabled: boolean = false) {
    this.enabled = enabled;

    if (this.enabled) {
      this.initializeServers();
    }
  }

  /**
   * Initialize all MCP servers
   */
  private initializeServers(): void {
    // Initialize each MCP server with optional API keys from environment
    this.servers.set('patent_db', new PatentMCPServer(process.env.PATENT_API_KEY));
    this.servers.set('market_data', new MarketMCPServer(process.env.MARKET_DATA_API_KEY));
    this.servers.set('financial_db', new FinancialMCPServer(process.env.FINANCIAL_API_KEY));
    this.servers.set('clinical_db', new ClinicalMCPServer(process.env.PUBMED_API_KEY));
    this.servers.set('regulatory_db', new RegulatoryMCPServer());

    // Initialize Gosset.ai live MCP server (falls back to simulated data if no token)
    const gossetServer = new GossetLiveMCPServer(process.env.GOSSET_OAUTH_TOKEN);
    this.servers.set('gosset_db', gossetServer);

    // Log Gosset connection status
    if (gossetServer.isLiveEnabled()) {
      console.log('✅ Gosset.ai live MCP connection enabled');
    } else {
      console.log('⚠️  Gosset.ai using simulated data (set GOSSET_OAUTH_TOKEN for live connection)');
    }
  }

  /**
   * Check if MCP is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get MCP servers for a specific agent
   */
  getServersForAgent(agent: AgentType): IMCPServer[] {
    if (!this.enabled) {
      return [];
    }

    const providers = AGENT_TO_MCP_PROVIDER[agent] || [];
    return providers
      .map(provider => this.servers.get(provider))
      .filter((server): server is IMCPServer => server !== undefined);
  }

  /**
   * Get available tools for an agent
   */
  async getToolsForAgent(agent: AgentType): Promise<MCPTool[]> {
    const servers = this.getServersForAgent(agent);
    const toolsPromises = servers.map(server => server.listTools());
    const toolsArrays = await Promise.all(toolsPromises);
    return toolsArrays.flat();
  }

  /**
   * Get available resources for an agent
   */
  async getResourcesForAgent(agent: AgentType): Promise<MCPResource[]> {
    const servers = this.getServersForAgent(agent);
    const resourcesPromises = servers.map(server => server.listResources());
    const resourcesArrays = await Promise.all(resourcesPromises);
    return resourcesArrays.flat();
  }

  /**
   * Call a tool by name
   */
  async callTool(
    agent: AgentType,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    if (!this.enabled) {
      return {
        content: [{ type: 'text', text: 'MCP is not enabled' }],
        isError: true,
      };
    }

    const servers = this.getServersForAgent(agent);

    // Find which server has this tool
    for (const server of servers) {
      const tools = await server.listTools();
      const tool = tools.find(t => t.name === toolName);

      if (tool) {
        try {
          return await server.callTool(toolName, args);
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error calling tool ${toolName}: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `Tool ${toolName} not found for agent ${agent}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Read a resource by URI
   */
  async readResource(
    agent: AgentType,
    uri: string
  ): Promise<{ contents: Array<{ uri: string; mimeType?: string; text?: string }> }> {
    if (!this.enabled) {
      return {
        contents: [
          {
            uri,
            text: 'MCP is not enabled',
          },
        ],
      };
    }

    const servers = this.getServersForAgent(agent);

    // Find which server has this resource
    for (const server of servers) {
      const resources = await server.listResources();
      const resource = resources.find(r => r.uri === uri);

      if (resource) {
        try {
          return await server.readResource(uri);
        } catch (error: any) {
          return {
            contents: [
              {
                uri,
                text: `Error reading resource: ${error.message}`,
              },
            ],
          };
        }
      }
    }

    return {
      contents: [
        {
          uri,
          text: `Resource ${uri} not found`,
        },
      ],
    };
  }

  /**
   * Generate context string for agent with available MCP capabilities
   */
  async getContextForAgent(agent: AgentType): Promise<string> {
    if (!this.enabled) {
      return '';
    }

    const tools = await this.getToolsForAgent(agent);
    const resources = await this.getResourcesForAgent(agent);

    if (tools.length === 0 && resources.length === 0) {
      return '';
    }

    let context = '\n\n## External Data Sources & Tools (MCP)\n\n';
    context += 'You have access to real-time external data sources through the Model Context Protocol.\n\n';

    if (tools.length > 0) {
      context += '### Available Tools:\n\n';
      for (const tool of tools) {
        context += `**${tool.name}**: ${tool.description}\n`;
        context += `- Required parameters: ${tool.inputSchema.required?.join(', ') || 'none'}\n\n`;
      }
    }

    if (resources.length > 0) {
      context += '\n### Available Databases:\n\n';
      for (const resource of resources) {
        context += `- **${resource.name}**: ${resource.description}\n`;
        if (resource.metadata) {
          const metadata = resource.metadata;
          if (metadata.coverage) {
            context += `  - Coverage: ${metadata.coverage}\n`;
          }
          if (metadata.updateFrequency) {
            context += `  - Update Frequency: ${metadata.updateFrequency}\n`;
          }
        }
      }
    }

    context += '\n**Important**: When referencing real-time data, simply state the data source you consulted (e.g., "According to PubMed..." or "ClinicalTrials.gov shows..."). Do NOT generate tool invocation syntax or XML tags - they cannot be executed in this environment. Focus on providing the analysis directly.\n';

    return context;
  }
}

/**
 * Global MCP client instance
 */
let mcpClientInstance: MCPClient | null = null;

/**
 * Get or create the global MCP client
 */
export function getMCPClient(enabled?: boolean): MCPClient {
  if (!mcpClientInstance) {
    const isEnabled = enabled ?? (process.env.MCP_ENABLED === 'true');
    mcpClientInstance = new MCPClient(isEnabled);
  }
  return mcpClientInstance;
}

/**
 * Reset the MCP client (useful for testing)
 */
export function resetMCPClient(): void {
  mcpClientInstance = null;
}
