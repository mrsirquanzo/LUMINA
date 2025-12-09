'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoginModal from '@/components/shared/LoginModal';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import ExportButton from '@/components/shared/ExportButton';
import { ModelBadge } from '@/components/shared/ModelBadge';
import { AgentSpecsCard, type AgentSpecs } from '@/components/shared/AgentSpecsCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AgentMode = 'demo' | 'live';

interface ProcessedDocument {
  fileName: string;
  fileType: string;
  text?: string;
  isImage: boolean;
  base64?: string;
  mimeType?: string;
}

const SAMPLE_QUERIES = [
  "Evaluate the target biology and validation evidence for Nectin-4 in bladder cancer. What is the genetic validation, expression profile, and druggability?",
  "Assess the mechanism of action and target biology for CD19 as a CAR-T target. What makes it a good target?",
  "What is the target biology validation for PCSK9? Analyze genetic evidence, expression, and MOA clarity.",
  "Evaluate the druggability and expression profile of KRAS G12C. What are the key biological risks?",
];

const TARGET_BIOLOGY_SPECS: AgentSpecs = {
  agentName: 'Target Biology Expert',
  model: {
    provider: 'Anthropic',
    modelName: 'claude-sonnet-4-20250514',
    optimizedFor: 'Advanced reasoning for target identification, validation, mechanism of action, and druggability assessment',
    maxTokens: 4096,
    temperature: 1.0,
  },
  apiConnections: [
    {
      name: 'PubMed & Scientific Literature',
      status: 'connected',
      description: 'Access to peer-reviewed publications for genetic validation, expression data, and mechanism of action',
    },
    {
      name: 'GWAS Catalog & Genetic Databases',
      status: 'connected',
      description: 'Real-time access to GWAS data, UK Biobank, gnomAD for human genetic validation',
    },
    {
      name: 'GTEx Portal & Expression Databases',
      status: 'connected',
      description: 'Tissue and cell-type specific expression data across healthy and disease tissues',
    },
  ],
  dataSources: [
    {
      name: 'Genetic Validation Databases',
      type: 'real-time',
      description: 'GWAS Catalog, UK Biobank, FinnGen, deCODE for human genetic evidence',
    },
    {
      name: 'Expression Databases',
      type: 'real-time',
      description: 'GTEx Portal, GEO, TCGA for tissue and cell-type expression patterns',
    },
    {
      name: 'Uploaded Documents',
      type: 'on-demand',
      description: 'PDF/Excel target biology reports, genetic studies, expression data with text and image extraction',
    },
  ],
  mcpServer: {
    available: true,
    enabled: process.env.MCP_ENABLED === 'true',
    tools: [
      {
        name: 'search_pubmed',
        description: 'Search PubMed for target biology, genetic validation, and mechanism of action studies',
      },
      {
        name: 'get_gene_expression',
        description: 'Retrieve gene expression data from GTEx Portal and GEO databases',
      },
      {
        name: 'search_genetic_studies',
        description: 'Search GWAS Catalog and genetic databases for target validation evidence',
      },
    ],
  },
};

export default function TargetBiologyAgent() {
  const [mode, setMode] = useState<AgentMode>('demo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // Document management
  const [currentDocuments, setCurrentDocuments] = useState<ProcessedDocument[]>([]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      return data.authenticated;
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      return false;
    }
  };

  const switchToLiveMode = async () => {
    const authenticated = await checkAuthStatus();
    if (authenticated) {
      setMode('live');
      setMessages([]);
    } else {
      // Show login modal
      setShowLoginModal(true);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setMode('live');
    setMessages([]);
  };

  const handleFilesProcessed = (files: UploadedFile[]) => {
    const newDocs: ProcessedDocument[] = files
      .filter(f => f.status === 'processed')
      .map(f => ({
        fileName: f.name,
        fileType: f.type,
        text: f.extractedText,
        isImage: false,
      }));

    setCurrentDocuments(prev => [...prev, ...newDocs]);
    setShowUploadPanel(false); // Close upload panel after files are added
  };

  const removeDocument = (index: number) => {
    setCurrentDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const sendDemoMessage = () => {
    if (isLoading) return;

    // Simple demo response
    const demoResponse = `## Target Biology Analysis: Nectin-4 in Bladder Cancer

### Executive Summary
Nectin-4 (PVRL4) is a cell adhesion molecule that shows strong validation as a therapeutic target in bladder cancer. The target demonstrates:
- **Strong genetic validation** through expression correlation with disease progression
- **Favorable expression profile** with overexpression in tumor tissue vs normal
- **Clear druggability** as an extracellular target suitable for antibody-based therapies

### 1. Human Genetic Validation
- **Evidence Quality**: Moderate to Strong
- **Expression Correlation**: Nectin-4 overexpression correlates with advanced bladder cancer stages [1]
- **Direction of Effect**: Overexpression associated with poor prognosis, supporting inhibition strategy
- **Key Citations**: [1] Challita-Eid et al., Cancer Res. 2007

### 2. Disease Biology Assessment
- **Pathway Position**: Nectin-4 mediates cell-cell adhesion and signaling in epithelial tissues
- **Mechanistic Rationale**: Overexpression promotes tumor cell survival and invasion
- **Causal Chain**: Nectin-4 → Enhanced cell adhesion → Reduced anoikis → Tumor progression

### 3. Expression Profile
- **Tissue Distribution**: Overexpressed in bladder, lung, and pancreatic cancers
- **Cell-Type Specificity**: Primarily epithelial cells, limited normal tissue expression
- **Therapeutic Window**: Favorable - high tumor expression, low normal tissue expression

### 4. Druggability Assessment
- **Target Class**: Cell adhesion molecule (extracellular)
- **Modality Recommendation**: Antibody-drug conjugates (ADCs) - proven with enfortumab vedotin (Padcev)
- **Selectivity**: High - limited expression in normal tissues

### 5. Mechanism of Action Clarity
- **MOA Confidence**: Clear
- **Binding Mechanism**: Monoclonal antibody binds extracellular domain
- **Downstream Effects**: ADC internalization → payload release → cell death

### 6. Translational Confidence Score
- **Preclinical Model Relevance**: High - xenograft models showed efficacy
- **Biomarker Availability**: Robust - Nectin-4 expression can be measured via IHC
- **Human PoM Feasibility**: Yes - Phase 1 trials demonstrated target engagement

### 7. Key Biological Risks & Derisking Plan
- **Risk 1**: Expression heterogeneity → Derisking: IHC-based patient selection
- **Risk 2**: Resistance mechanisms → Derisking: Monitor expression changes post-treatment
- **Risk 3**: Normal tissue toxicity → Derisking: Careful monitoring of skin and mucosal toxicity

## References

[1] Challita-Eid PM, et al. "Enfortumab vedotin antibody-drug conjugate targeting Nectin-4 is a highly potent therapeutic agent in multiple preclinical cancer models." Cancer Res. 2016;76(10):3003-3013. [View PubMed →](https://pubmed.ncbi.nlm.nih.gov/27013195/)`;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: SAMPLE_QUERIES[0],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate typing delay
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: demoResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const sendLiveMessage = async (messageText?: string) => {
    const textToSend = messageText || input;

    if (!textToSend.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array for API
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call API with documents
      const response = await fetch('/api/agents/target-biology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          documents: currentDocuments.length > 0 ? currentDocuments : undefined,
          targetSymbol: extractTargetSymbol(textToSend),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from agent');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTargetSymbol = (text: string): string | undefined => {
    // Simple extraction - look for common target patterns
    const targetPatterns = [
      /(?:target|gene|protein)\s+([A-Z0-9]+)/i,
      /([A-Z0-9]+)\s+(?:target|gene|protein)/i,
      /(?:for|of)\s+([A-Z0-9]+)/i,
    ];
    
    for (const pattern of targetPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return undefined;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'live') {
        sendLiveMessage();
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setMode('demo');
      setMessages([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Target Biology Expert Agent
          </h1>
          <ModelBadge provider="Anthropic" modelName="Sonnet 4" />
        </div>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-4">
          AI-powered expert for target identification, validation, mechanism of action, and druggability assessment.
          Upload documents, analyze targets, or chat directly.
        </p>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => { setMode('demo'); setMessages([]); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'demo'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📺 Demo Mode (Free)
            </button>
            <button
              onClick={switchToLiveMode}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'live'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚀 Live AI Agent
            </button>
          </div>

          {isAuthenticated && mode === 'live' && (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mode Info Banner */}
        {mode === 'demo' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> Pre-recorded target biology analyses. File uploads simulated.
            </p>
          </div>
        )}

        {mode === 'live' && isAuthenticated && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-green-800">
              <strong>Live Mode:</strong> Real-time AI with full document analysis (PDF, Excel, images, URLs).
            </p>
          </div>
        )}

        {mode === 'live' && !isAuthenticated && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>⚠️ Authentication Required</strong>
            </p>
            <p className="text-sm text-yellow-700 mb-3">
              You need to log in to use Live Mode. Please authenticate to access real AI capabilities with full document analysis.
            </p>
            <a
              href="/api/auth/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Log In to Continue
            </a>
          </div>
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-white border-l-4 border-blue-500 ml-auto max-w-3xl'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '🧬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm mb-1 ${message.role === 'user' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {message.role === 'user' ? 'You' : 'Target Biology Expert'}
                  </div>
                  <div className="agent-output text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Analyzing target biology...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Sample Queries - Live Mode Only when No Messages */}
      {mode === 'live' && messages.length === 0 && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Sample Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SAMPLE_QUERIES.map((query, index) => (
              <button
                key={index}
                onClick={() => sendLiveMessage(query)}
                className="p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Demo Mode Instructions */}
      {mode === 'demo' && messages.length === 0 && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Try Demo Mode</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to see a pre-recorded target biology analysis. No API costs.
          </p>
          <button
            onClick={sendDemoMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Run Demo Analysis
          </button>
        </div>
      )}

      {/* Input Area (Live Mode) with Integrated Upload */}
      {mode === 'live' && (
        <div className="sticky bottom-0 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Upload Panel */}
          {showUploadPanel && (
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Upload Files</h4>
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
          {currentDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 bg-gray-50">
              {currentDocuments.map((doc, index) => (
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
              {/* Upload Button */}
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                title="Upload files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {currentDocuments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {currentDocuments.length}
                  </span>
                )}
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about target biology, validation, mechanism of action, or druggability..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Send Button */}
              <button
                onClick={() => sendLiveMessage()}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>

            {/* Export Button */}
            {messages.length > 0 && (
              <div className="mt-3">
                <ExportButton messages={messages} agentName="Target Biology Expert" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="mt-8">
        <AgentSpecsCard specs={TARGET_BIOLOGY_SPECS} />
      </div>

      {/* Behind the Scenes */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Behind the Scenes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h4 className="font-semibold text-gray-900 mb-1">Mode</h4>
              <p className="text-sm text-gray-600">
                {mode === 'demo' ? 'Demo' : 'Live AI'}
              </p>
            </div>
            <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Pre-recorded target biology analyses demonstrating capabilities without API costs'
                    : 'Real-time target biology analysis powered by Claude Sonnet 4 with genetic and expression database access'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Specialization Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">🧬</div>
              <h4 className="font-semibold text-gray-900 mb-1">Specialization</h4>
              <p className="text-sm text-gray-600">Target Biology</p>
            </div>
            <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Target Validation</p>
                <p className="text-xs text-gray-700">
                  Genetic validation, disease biology, expression analysis, druggability assessment, mechanism of action clarity, and translational confidence
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900 mb-1">Data Sources</h4>
              <p className="text-sm text-gray-600">GWAS, GTEx, GEO</p>
            </div>
            <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Genetic & Expression Data</p>
                <p className="text-xs text-gray-700">
                  GWAS Catalog, UK Biobank, gnomAD for genetic validation; GTEx Portal, GEO, TCGA for expression patterns; PubMed for mechanism studies
                </p>
              </div>
            </div>
          </div>

          {/* Cost Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-gray-900 mb-1">Cost</h4>
              <p className="text-sm text-gray-600">
                {mode === 'demo' ? 'Free' : '$0.01-0.10'}
              </p>
            </div>
            <div className="absolute inset-0 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Zero Cost' : 'Pay-per-Query'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Demo mode is completely free with pre-recorded target biology analyses'
                    : 'Live mode charges $0.01-0.10 per query based on complexity and document size'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
