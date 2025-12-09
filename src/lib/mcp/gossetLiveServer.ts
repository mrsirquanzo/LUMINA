// Live Gosset.ai MCP Server Connection
// Connects to https://mcp.gosset.ai/sse for real pharmaceutical intelligence data

import type { IMCPServer, MCPProvider, MCPTool, MCPResource, MCPToolResult } from './types';

export class GossetLiveMCPServer implements IMCPServer {
  provider: MCPProvider = 'gosset_db';
  name = 'Gosset.ai Pharmaceutical Intelligence (Live)';
  version = '1.0.0';

  private apiKey: string;
  private isEnabled: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.isEnabled = !!apiKey && apiKey.length > 0;
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.isEnabled) {
      return [];
    }

    // Gosset MCP server exposes these tools (based on their SDK)
    return [
      {
        name: 'gosset_search_trials',
        description: 'Search pharmaceutical database for drug trials with verified outcomes',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query for trial search',
            },
            indication: {
              type: 'string',
              description: 'Disease or condition',
            },
            modality: {
              type: 'string',
              description: 'Drug modality (e.g., CAR-T, ADC, mAb)',
            },
            phase: {
              type: 'string',
              description: 'Clinical phase',
            },
          },
        },
      },
      {
        name: 'gosset_estimate_success',
        description: 'Predict trial success probability using AI model',
        inputSchema: {
          type: 'object',
          properties: {
            trial_description: {
              type: 'string',
              description: 'Natural language description of the trial',
            },
          },
          required: ['trial_description'],
        },
      },
      {
        name: 'gosset_get_ptrs',
        description: 'Get Phase Transition Rates (PTRs) for indication/modality',
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
            },
          },
          required: ['indication'],
        },
      },
    ];
  }

  async listResources(): Promise<MCPResource[]> {
    if (!this.isEnabled) {
      return [];
    }

    return [
      {
        uri: 'gosset://database/pharmaceutical-intelligence',
        name: 'Gosset.ai Pharmaceutical Database (Live)',
        description: 'Verified trial outcomes from 100,000+ drug assets',
        mimeType: 'application/json',
        metadata: {
          coverage: '100,000+ drug assets with human-verified outcomes',
          updateFrequency: 'weekly',
          features: 'PTRs, trial benchmarks, success predictions',
        },
      },
    ];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
    if (!this.isEnabled) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Gosset.ai live connection not enabled',
              message: 'Set GOSSET_OAUTH_TOKEN environment variable to enable live Gosset.ai data',
              fallback: 'Using simulated data from Clinical MCP Server',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    try {
      // Connect to Gosset MCP server via SSE
      const response = await fetch('https://mcp.gosset.ai/sse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gosset MCP server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              source: 'Gosset.ai Pharmaceutical Intelligence (Live API)',
              ...data,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Failed to connect to Gosset.ai MCP server',
              message: error.message,
              fallback: 'Using simulated data from Clinical MCP Server',
            }, null, 2),
          },
        ],
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
          text: JSON.stringify({
            message: 'Gosset.ai resource reading available via MCP server',
            enabled: this.isEnabled,
          }),
        },
      ],
    };
  }

  isLiveEnabled(): boolean {
    return this.isEnabled;
  }
}
