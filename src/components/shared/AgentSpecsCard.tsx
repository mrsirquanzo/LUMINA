'use client';

import React, { useState } from 'react';
import { FiCpu, FiDatabase, FiServer, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export interface AgentSpecs {
  agentName: string;
  model: {
    provider: 'Anthropic' | 'Google' | 'Perplexity';
    modelName: string;
    optimizedFor: string;
    maxTokens: number;
    temperature: number;
  };
  apiConnections: Array<{
    name: string;
    status: 'connected' | 'optional' | 'coming-soon';
    description: string;
  }>;
  dataSources: Array<{
    name: string;
    type: 'real-time' | 'cached' | 'on-demand';
    description: string;
  }>;
  mcpServer?: {
    available: boolean;
    enabled: boolean;
    tools: Array<{
      name: string;
      description: string;
    }>;
  };
}

interface AgentSpecsCardProps {
  specs: AgentSpecs;
  className?: string;
}

export function AgentSpecsCard({ specs, className = '' }: AgentSpecsCardProps) {
  const [showMcpDetails, setShowMcpDetails] = useState(false);

  const providerColors = {
    Anthropic: 'bg-orange-50 border-orange-200 text-orange-800',
    Google: 'bg-blue-50 border-blue-200 text-blue-800',
    Perplexity: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  const providerIcons = {
    Anthropic: '🤖',
    Google: '🔵',
    Perplexity: '🔍',
  };

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiCpu className="w-5 h-5 text-blue-600" />
          Technical Specifications
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          AI model, API connections, and data sources powering this agent
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Model Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{providerIcons[specs.model.provider]}</span>
            <h4 className="font-semibold text-gray-900">AI Model</h4>
          </div>

          <div className={`border-2 rounded-lg p-4 ${providerColors[specs.model.provider]}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Provider:</span>
                <span className="font-mono text-sm">{specs.model.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Model:</span>
                <span className="font-mono text-sm">{specs.model.modelName}</span>
              </div>
              <div className="border-t border-current opacity-30 my-2"></div>
              <div>
                <span className="font-semibold block mb-1">Optimized for:</span>
                <p className="text-sm">{specs.model.optimizedFor}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span className="opacity-75">Max Tokens:</span>
                  <span className="font-mono ml-1">{specs.model.maxTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="opacity-75">Temperature:</span>
                  <span className="font-mono ml-1">{specs.model.temperature}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Connections */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FiServer className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">API Connections</h4>
          </div>

          <div className="space-y-2">
            {specs.apiConnections.map((api, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {api.status === 'connected' && (
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {api.status === 'optional' && (
                    <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  {api.status === 'coming-soon' && (
                    <FiAlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{api.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        api.status === 'connected'
                          ? 'bg-green-100 text-green-700'
                          : api.status === 'optional'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {api.status === 'connected' && '✓ Connected'}
                      {api.status === 'optional' && 'Optional'}
                      {api.status === 'coming-soon' && 'Coming Soon'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{api.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FiDatabase className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Data Sources</h4>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {specs.dataSources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
              >
                <div className="flex-1">
                  <span className="font-semibold text-sm text-gray-900">{source.name}</span>
                  <p className="text-xs text-gray-600">{source.description}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap ${
                    source.type === 'real-time'
                      ? 'bg-green-100 text-green-700'
                      : source.type === 'cached'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {source.type === 'real-time' && '⚡ Real-time'}
                  {source.type === 'cached' && '💾 Cached'}
                  {source.type === 'on-demand' && '📥 On-demand'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MCP Server Section */}
        {specs.mcpServer && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔌</span>
              <h4 className="font-semibold text-gray-900">MCP Server (Enhanced Features)</h4>
            </div>

            <div
              className={`border-2 rounded-lg p-4 ${
                specs.mcpServer.available
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">
                  Status: {specs.mcpServer.available ? 'Available' : 'Not Available'}
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    specs.mcpServer.enabled
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {specs.mcpServer.enabled ? '✓ Enabled' : 'Disabled (Set MCP_ENABLED=true)'}
                </span>
              </div>

              {specs.mcpServer.available && (
                <>
                  <button
                    onClick={() => setShowMcpDetails(!showMcpDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                  >
                    {showMcpDetails ? '▼ Hide' : '▶'} Available MCP Tools ({specs.mcpServer.tools.length})
                  </button>

                  {showMcpDetails && (
                    <div className="mt-3 space-y-2">
                      {specs.mcpServer.tools.map((tool, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 border border-green-300 rounded text-sm"
                        >
                          <div className="font-mono font-semibold text-green-800">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{tool.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <span className="flex-shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="font-semibold mb-1">About These Specifications</p>
              <p className="text-xs">
                This agent uses a multi-model architecture where each agent is powered by the AI
                model best suited for its task. Real-time data sources provide up-to-date
                information, while MCP servers enable advanced data retrieval when enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentSpecsCard;
