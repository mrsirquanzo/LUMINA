'use client';

import { useState, useEffect, useCallback } from 'react';
import MultiAgentCollaboration from './MultiAgentCollaboration';
import { ExecutionMode } from '@/lib/multiAgentTypes';
import { FiZap, FiClock, FiPlay, FiMessageSquare, FiClock as FiHistory, FiUsers } from 'react-icons/fi';
import AnalysisHistory from './AnalysisHistory';
import CustomAgentTeamBuilder from './CustomAgentTeamBuilder';
import { CustomAgentTeam } from '@/lib/customAgentTeams';
import LoginModal from '@/components/shared/LoginModal';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';

const DEMO_SCENARIOS = [
  {
    id: 'ma-due-diligence',
    title: 'M&A Due Diligence',
    description: 'Comprehensive analysis of a bispecific antibody acquisition target',
    query: 'Should we acquire BioSpectra for $2.2B? Analyze their Phase 2 bispecific T-cell engager data, patent portfolio, and financials.',
    documents: [
      { fileName: 'BioSpectra_Phase2_Results.pdf', size: '2.8 MB' },
      { fileName: 'BioSpectra_Patent_Portfolio.pdf', size: '2.1 MB' },
      { fileName: 'BioSpectra_10K_2024.pdf', size: '4.3 MB' },
    ],
    icon: '🤝',
  },
  {
    id: 'competitive-analysis',
    title: 'Competitive Landscape Analysis',
    description: 'Compare antibody-drug conjugates across clinical efficacy, IP, and market positioning',
    query: 'Compare the competitive positioning of Enhertu, Trodelvy, and Padcev. Which antibody-drug conjugate has the strongest patent protection and commercial potential in 2024-2025?',
    documents: [
      { fileName: 'Enhertu_Clinical_Portfolio.pdf', size: '3.2 MB' },
      { fileName: 'Trodelvy_IP_Analysis.pdf', size: '2.4 MB' },
      { fileName: 'ADC_Market_Report_2024.pdf', size: '3.8 MB' },
    ],
    icon: '📊',
  },
  {
    id: 'licensing-deal',
    title: 'Technology Licensing Deal',
    description: 'Evaluate a CRISPR base editing platform for potential licensing',
    query: 'Should we license BaseGenomics\' adenine base editing platform for $125M upfront + double-digit royalties? Analyze the technology, IP strength, competitive landscape, and financial terms.',
    documents: [
      { fileName: 'BaseGenomics_Technology_Package.pdf', size: '2.1 MB' },
      { fileName: 'CRISPR_BaseEditing_Patent_Landscape.pdf', size: '3.4 MB' },
      { fileName: 'Licensing_Term_Sheet.pdf', size: '0.6 MB' },
    ],
    icon: '🔬',
  },
  {
    id: 'investment-decision',
    title: 'Series B Investment Decision',
    description: 'Due diligence for a Series B investment in an oral GLP-1 biotech',
    query: 'Should we invest $40M in ObesityRx\'s $150M Series B? Evaluate their oral GLP-1 Phase 2a data, patent portfolio, competitive landscape, and burn rate.',
    documents: [
      { fileName: 'ObesityRx_Phase2a_Data.pdf', size: '2.2 MB' },
      { fileName: 'ObesityRx_IP_Portfolio.pdf', size: '1.7 MB' },
      { fileName: 'ObesityRx_Financial_Model.xlsx', size: '0.4 MB' },
    ],
    icon: '💼',
  },
];

interface ProcessedDocument {
  name: string;
  fileName: string;
  fileType: string;
  extractedText?: string;
  text?: string;
  isImage: boolean;
  base64?: string;
  mimeType?: string;
}

export default function MultiAgentDemo() {
  const [mode, setMode] = useState<ExecutionMode>('thorough');
  const [isDemo, setIsDemo] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('ma-due-diligence');
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'custom'>('chat');
  const [selectedCustomTeam, setSelectedCustomTeam] = useState<CustomAgentTeam | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const estimateCost = useCallback(async () => {
    if (!query.trim()) return;

    setIsEstimating(true);
    try {
      const response = await fetch('/api/agents/orchestrator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          documents: processedDocuments,
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
  }, [query, mode, processedDocuments]);

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
    // Scroll to top when transitioning to analysis view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setShowAnalysis(false);
    setQuery('');
    setCostEstimate(null);
  };

  const handleSampleQueryClick = (sampleQuery: string, scenarioId?: string) => {
    setQuery(sampleQuery);
    if (scenarioId) {
      setSelectedScenarioId(scenarioId);
    }
  };

  const checkAuthentication = async () => {
    setIsCheckingAuth(true);
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/auth/check', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      return data.authenticated;
    } catch (error) {
      console.error('Failed to check authentication:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleToggleLiveMode = async (newMode: 'demo' | 'live') => {
    if (newMode === 'live') {
      // Check authentication before enabling live mode
      const authenticated = await checkAuthentication();
      if (!authenticated) {
        // Show login modal
        setShowLoginModal(true);
        return;
      }

      setIsDemo(false);
    } else {
      setIsDemo(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsDemo(false);
  };

  const handleFilesProcessed = (files: UploadedFile[]) => {
    const newDocs: ProcessedDocument[] = files
      .filter(f => f.status === 'processed')
      .map(f => ({
        name: f.name,
        fileName: f.name,
        fileType: f.type,
        extractedText: f.extractedText,
        text: f.extractedText,
        isImage: false,
      }));

    setProcessedDocuments(prev => [...prev, ...newDocs]);
    setShowUploadPanel(false); // Close upload panel after files are added
  };

  const removeDocument = (index: number) => {
    setProcessedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

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
      selectedScenarioId,
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
            documents={processedDocuments}
            mode={mode}
            isDemo={isDemo}
            demoScenarioId={isDemo ? selectedScenarioId : undefined}
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
            >
              <FiHistory className="w-4 h-4" />
              View History
            </button>
          </div>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            🤖 Sonny - Multi-Agent AI System
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Sonny Multi-Agent Collaboration
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Sonny orchestrates specialized AI agents to analyze complex biotech scenarios.
            Clinical, Patent, Financial, Market, and Regulatory analysts collaborate under Sonny's coordination to provide comprehensive insights.
          </p>

          {/* Available AI Agents - Moved from bottom */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">5 Specialized AI Agents</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-1">🔬</div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Clinical</h4>
                <p className="text-xs text-gray-600">Trial data & efficacy</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-1">⚖️</div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Patent</h4>
                <p className="text-xs text-gray-600">IP & FTO analysis</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-1">💰</div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Financial</h4>
                <p className="text-xs text-gray-600">Valuations & deals</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-1">📊</div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Market</h4>
                <p className="text-xs text-gray-600">Size & forecasts</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-2xl mb-1">📋</div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">Regulatory</h4>
                <p className="text-xs text-gray-600">FDA/EMA pathways</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 max-w-2xl mx-auto">
              <strong>How it works:</strong> Agents analyze in parallel (Fast Mode) or sequentially with collaboration (Thorough Mode).
              Powered by Claude Sonnet 4, Gemini 2.0 Flash, and Perplexity Sonar Pro.
            </p>
          </div>
        </div>

        {/* Combined Configuration Section */}
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            {/* Analysis Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleLiveMode('demo')}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm ${
                    isDemo
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => handleToggleLiveMode('live')}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm ${
                    !isDemo
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isCheckingAuth ? '...' : 'Live'}
                </button>
              </div>
            </div>

            {/* Execution Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Execution</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('fast')}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm flex items-center justify-center gap-1 ${
                    mode === 'fast'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiZap className="w-4 h-4" />
                  Fast
                </button>
                <button
                  onClick={() => setMode('thorough')}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm flex items-center justify-center gap-1 ${
                    mode === 'thorough'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiClock className="w-4 h-4" />
                  Thorough
                </button>
              </div>
            </div>

            {/* Team Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewMode('chat');
                    setSelectedCustomTeam(null);
                  }}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm flex items-center justify-center gap-1 ${
                    viewMode === 'chat'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiMessageSquare className="w-4 h-4" />
                  Simple
                </button>
                <button
                  onClick={() => setViewMode('custom')}
                  className={`flex-1 px-3 py-2 rounded-md transition-all text-sm flex items-center justify-center gap-1 ${
                    viewMode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  Custom
                </button>
              </div>
            </div>
          </div>

          {/* Info based on selections */}
          <div className="pt-4 border-t border-gray-200">
            {isDemo ? (
              <p className="text-sm text-gray-600">
                <strong>Demo mode:</strong> Pre-recorded analysis with realistic AI responses. No API costs.
              </p>
            ) : isAuthenticated ? (
              <p className="text-sm text-gray-600">
                <strong>Live mode:</strong> Real AI agents with actual API calls.
                {mode === 'fast' ? ' Estimated: $0.10-$0.30' : ' Estimated: $0.30-$0.80'} per analysis.
              </p>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>⚠️ Authentication Required</strong>
                </p>
                <p className="text-sm text-yellow-700 mb-3">
                  You need to log in to use Live Analysis mode.
                </p>
                <a
                  href="/api/auth/login"
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Log In to Continue
                </a>
              </div>
            )}
            {mode === 'fast' && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Fast:</strong> All agents analyze simultaneously. Best for initial assessments.
              </p>
            )}
            {mode === 'thorough' && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Thorough:</strong> Agents work sequentially, building on each other's insights under Sonny's coordination.
              </p>
            )}
          </div>
        </div>

        {/* Main Query Input Section */}
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'chat' ? 'Ask Your Question' : 'Custom Team Analysis'}
          </h3>

          {viewMode === 'chat' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Enter your question and let Sonny's specialized AI agents collaborate to provide comprehensive insights.
              </p>

              {/* Sample Queries - Show when no query */}
              {!query.trim() && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Try these example queries:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEMO_SCENARIOS.map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => handleSampleQueryClick(scenario.query, scenario.id)}
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
              )}

              {/* Modern Input Area with Integrated Upload */}
              <div className="border border-gray-200 rounded-lg">
                {/* Upload Panel */}
                {showUploadPanel && !isDemo && (
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Upload Documents</h4>
                      <button
                        onClick={() => setShowUploadPanel(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <FileUpload onFilesProcessed={handleFilesProcessed} />
                  </div>
                )}

                {/* File Chips */}
                {processedDocuments.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 bg-gray-50">
                    {processedDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <span className="truncate max-w-[150px]">{doc.fileName}</span>
                        <button
                          onClick={() => removeDocument(index)}
                          className="hover:text-blue-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Row */}
                <div className="p-4">
                  <div className="flex items-end gap-2">
                    {/* Upload Button - Only in Live Mode */}
                    {!isDemo && (
                      <button
                        onClick={() => setShowUploadPanel(!showUploadPanel)}
                        className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                        title="Upload files"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {processedDocuments.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {processedDocuments.length}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Textarea */}
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., Should we acquire BioSpectra for $2.2B? Analyze their Phase 2 bispecific T-cell engager data, patent portfolio, and financials."
                      rows={3}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
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
                    placeholder="e.g., Should we acquire BioSpectra for $2.2B? Analyze their Phase 2 bispecific T-cell engager data, patent portfolio, and financials."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-y min-h-[60px]"
                  />
                </div>
              )}
            </div>
          )}

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
                disabled={isEstimating || !query.trim() || (!isDemo && !isAuthenticated)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPlay className="w-5 h-5" />
                {isEstimating ? 'Estimating...' : (!isDemo && !isAuthenticated) ? 'Login Required' : 'Start Analysis'}
              </button>
            </div>
          )}
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
}
