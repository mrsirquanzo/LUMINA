'use client';

import { useState, useEffect, useCallback } from 'react';
import MultiAgentCollaboration from './MultiAgentCollaboration';
import { ExecutionMode } from '@/lib/multiAgentTypes';
import { FiZap, FiClock, FiDollarSign, FiPlay, FiMessageSquare, FiClock as FiHistory, FiUsers } from 'react-icons/fi';
import AnalysisHistory from './AnalysisHistory';
import CustomAgentTeamBuilder from './CustomAgentTeamBuilder';
import { CustomAgentTeam } from '@/lib/customAgentTeams';

const DEMO_SCENARIOS = [
  {
    id: 'ma-due-diligence',
    title: 'M&A Due Diligence',
    description: 'Comprehensive analysis of a gene therapy acquisition target',
    query: 'Should we acquire GeneTech for $800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials.',
    documents: [
      { fileName: 'GeneTech_Phase2_Results.pdf', size: '2.3 MB' },
      { fileName: 'GeneTech_Patent_Portfolio.pdf', size: '1.8 MB' },
      { fileName: 'GeneTech_10K_2024.pdf', size: '4.1 MB' },
    ],
    icon: '🤝',
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Landscape Analysis',
    description: 'Compare multiple CAR-T therapies across clinical, IP, and commercial dimensions',
    query: 'Compare the competitive positioning of Kymriah, Yescarta, and Breyanzi. Which has the strongest patent protection and commercial potential?',
    documents: [
      { fileName: 'Kymriah_Clinical_Summary.pdf', size: '1.5 MB' },
      { fileName: 'Yescarta_Patent_Analysis.pdf', size: '2.1 MB' },
      { fileName: 'CAR-T_Market_Report_2024.pdf', size: '3.2 MB' },
    ],
    icon: '📊',
  },
  {
    id: 'licensing-deal',
    title: 'Technology Licensing Deal',
    description: 'Evaluate a platform technology for potential licensing',
    query: 'Should we license BioX\'s mRNA delivery platform for $50M upfront + royalties? Analyze the technology, IP strength, and financial terms.',
    documents: [
      { fileName: 'BioX_Technology_Overview.pdf', size: '1.2 MB' },
      { fileName: 'mRNA_Patent_Landscape.pdf', size: '2.8 MB' },
      { fileName: 'Licensing_Term_Sheet.pdf', size: '0.5 MB' },
    ],
    icon: '🔬',
  },
  {
    id: 'investment-decision',
    title: 'Series B Investment Decision',
    description: 'Due diligence for a Series B investment in an early-stage biotech',
    query: 'Should we invest $25M in NeuroCure\'s Series B? Evaluate their Alzheimer\'s Phase 1 data, patent portfolio, and burn rate.',
    documents: [
      { fileName: 'NeuroCure_Phase1_Data.pdf', size: '1.9 MB' },
      { fileName: 'NeuroCure_IP_Portfolio.pdf', size: '1.4 MB' },
      { fileName: 'NeuroCure_Financial_Model.xlsx', size: '0.3 MB' },
    ],
    icon: '💼',
  },
];

export default function MultiAgentDemo() {
  const [mode, setMode] = useState<ExecutionMode>('thorough');
  const [isDemo, setIsDemo] = useState(true);
  const [query, setQuery] = useState('');
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'custom'>('chat');
  const [selectedCustomTeam, setSelectedCustomTeam] = useState<CustomAgentTeam | null>(null);

  const estimateCost = useCallback(async () => {
    if (!query.trim()) return;

    setIsEstimating(true);
    try {
      const response = await fetch('/api/agents/orchestrator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          documents: [],
          mode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCostEstimate(data.estimate);
      }
    } catch (error) {
      console.error('Failed to estimate cost:', error);
    } finally {
      setIsEstimating(false);
    }
  }, [query, mode]);

  // Get cost estimate when mode or query changes
  useEffect(() => {
    if (query.trim() && !isDemo) {
      const debounce = setTimeout(() => {
        estimateCost();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [query, isDemo, estimateCost]);

  const handleStartAnalysis = () => {
    setShowAnalysis(true);
  };

  const handleReset = () => {
    setShowAnalysis(false);
    setQuery('');
    setCostEstimate(null);
  };

  const handleSampleQueryClick = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  // Show history view
  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setShowHistory(false)}
            className="mb-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to demo
          </button>
          <AnalysisHistory />
        </div>
      </div>
    );
  }

  if (showAnalysis && query.trim()) {
    console.log('[MultiAgentDemo] Starting analysis:', {
      isDemo,
      mode,
      query: query.substring(0, 50) + '...',
      customAgents: selectedCustomTeam?.agents.length || 'default',
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleReset}
            className="mb-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to input
          </button>
          <MultiAgentCollaboration
            query={query}
            documents={[]}
            mode={mode}
            isDemo={isDemo}
            customAgents={selectedCustomTeam?.agents}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Spacer */}
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🤖 Multi-Agent AI System
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <FiHistory className="w-4 h-4" />
              View History
            </button>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Agent Collaboration Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience how specialized AI agents work together to analyze complex biotech scenarios.
            Clinical, Patent, and Financial analysts collaborate to provide comprehensive insights.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Mode</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('fast')}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'fast'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiZap className={`w-6 h-6 ${mode === 'fast' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Fast Mode</h4>
                  <p className="text-sm text-gray-600">Parallel execution</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-left">
                All agents analyze simultaneously for quick results. Best for initial assessments.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <FiDollarSign className="w-4 h-4" />
                <span>$0.10 - $0.30 per analysis</span>
              </div>
            </button>

            <button
              onClick={() => setMode('thorough')}
              className={`p-4 rounded-lg border-2 transition-all ${
                mode === 'thorough'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiClock className={`w-6 h-6 ${mode === 'thorough' ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Thorough Mode</h4>
                  <p className="text-sm text-gray-600">Sequential with collaboration</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Agents work sequentially, asking each other questions for deeper insights.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <FiDollarSign className="w-4 h-4" />
                <span>$0.30 - $0.80 per analysis</span>
              </div>
            </button>
          </div>
        </div>

        {/* Demo vs Live Toggle */}
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Type</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDemo(true)}
              className={`px-4 py-2 rounded-md transition-all ${
                isDemo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Demo Mode (Free)
            </button>
            <button
              onClick={() => setIsDemo(false)}
              className={`px-4 py-2 rounded-md transition-all ${
                !isDemo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Live Analysis (Uses API Credits)
            </button>
          </div>
          {isDemo ? (
            <p className="text-sm text-gray-600 mt-3">
              Demo mode plays a pre-recorded analysis with realistic AI responses. No API costs.
            </p>
          ) : (
            <p className="text-sm text-gray-600 mt-3">
              Live mode runs real AI agents with actual API calls. Authentication required.
            </p>
          )}
        </div>

        {/* Main Query Input Section */}
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'chat' ? 'Ask Your Question' : 'Custom Team Analysis'}
          </h3>

          {viewMode === 'chat' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter your question and let our specialized AI agents collaborate to provide comprehensive insights.
              </p>

              {/* Query Textarea */}
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Should we acquire GeneTech for $800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 mb-4"
              />

              {/* Sample Queries */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Try these example queries:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DEMO_SCENARIOS.map((scenario) => (
                    <button
                      key={scenario.id}
                      onClick={() => handleSampleQueryClick(scenario.query)}
                      className="p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{scenario.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 text-xs mb-1">{scenario.title}</div>
                          <div className="text-gray-600 text-xs line-clamp-2">{scenario.query}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {viewMode === 'custom' && (
            <div className="mb-4">
              <CustomAgentTeamBuilder
                onTeamSelect={(team) => {
                  setSelectedCustomTeam(team);
                  setMode(team.mode);
                  setIsDemo(false);
                }}
                selectedTeam={selectedCustomTeam}
              />

              {selectedCustomTeam && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">
                    Enter your question for the {selectedCustomTeam.name} team
                    ({selectedCustomTeam.agents.length} agents)
                  </p>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Should we acquire GeneTech for $800M? Analyze their Phase 2 CAR-T data, patent portfolio, and financials."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                setViewMode('chat');
                setSelectedCustomTeam(null);
              }}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 text-sm ${
                viewMode === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiMessageSquare className="w-4 h-4" />
              Simple Chat
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 text-sm ${
                viewMode === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              Custom Teams
            </button>
          </div>

          {/* Cost Estimate and Start Button */}
          {query.trim() && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Ready to Start</h4>
                {!isDemo && costEstimate && (
                  <div className="text-sm text-gray-600">
                    <p>Estimated cost: ${costEstimate.minCost.toFixed(2)} - ${costEstimate.maxCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {costEstimate.estimatedIterations} iterations • {costEstimate.agents.length} agents
                    </p>
                  </div>
                )}
                {isDemo && (
                  <p className="text-sm text-gray-600">
                    Demo playback - No API costs
                  </p>
                )}
              </div>
              <button
                onClick={handleStartAnalysis}
                disabled={isEstimating || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlay className="w-5 h-5" />
                {isEstimating ? 'Estimating...' : 'Start Analysis'}
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Available AI Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl mb-2">🔬</div>
              <h4 className="font-medium text-gray-900 mb-1">Clinical Analyst</h4>
              <p className="text-sm text-gray-600">
                Analyzes trial data, efficacy endpoints, safety profiles, and competitive positioning
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">⚖️</div>
              <h4 className="font-medium text-gray-900 mb-1">Patent Expert</h4>
              <p className="text-sm text-gray-600">
                Evaluates IP strength, FTO analysis, competitive landscape, and patent valuation
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-medium text-gray-900 mb-1">Financial Analyst</h4>
              <p className="text-sm text-gray-600">
                Assesses financials, valuations, deal structures, and provides DCF models
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-medium text-gray-900 mb-1">Regulatory Expert</h4>
              <p className="text-sm text-gray-600">
                Analyzes regulatory pathways, FDA/EMA requirements, approval timelines, and compliance
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900 mb-1">Market Research Analyst</h4>
              <p className="text-sm text-gray-600">
                Evaluates market size, pricing dynamics, competitive landscape, and revenue forecasts
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white rounded-md">
            <p className="text-sm text-gray-700">
              <strong>How it works:</strong> In Fast Mode, all agents analyze your query in parallel for quick results.
              In Thorough Mode, agents work sequentially, building on each other's insights. For example, the Clinical
              Analyst might ask the Patent Expert about IP protection for a specific mechanism, who then asks the
              Financial Analyst about valuation implications.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Custom Teams:</strong> For advanced users, you can create custom agent teams with specific
              combinations of agents tailored to your analysis needs. Simply switch to "Custom Teams" mode to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
