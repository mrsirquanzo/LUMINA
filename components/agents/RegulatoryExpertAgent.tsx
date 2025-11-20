'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import LoginModal from '@/components/shared/LoginModal';
import ExportButton from '@/components/shared/ExportButton';
import { ModelBadge } from '@/components/shared/ModelBadge';
import { AgentSpecsCard, type AgentSpecs } from '@/components/shared/AgentSpecsCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cost?: number;
}

interface ProcessedDocument {
  name: string;
  fileType: string;
  extractedText?: string;
  isImage: boolean;
  base64?: string;
  mimeType?: string;
}

type AgentMode = 'demo' | 'live';

const SAMPLE_QUERIES = [
  "What is the optimal regulatory pathway for a novel CAR-T therapy targeting solid tumors? Should we pursue Breakthrough Therapy designation?",
  "Design a regulatory strategy for a Phase 2 Alzheimer's drug. What endpoints should we prioritize for accelerated approval?",
  "Analyze the CMC requirements for a gene therapy product. What are the key manufacturing challenges from a regulatory perspective?",
  "What's the fastest pathway to FDA approval for an orphan drug treating a rare metabolic disorder?",
];

const DEMO_RESPONSES = [
  {
    query: SAMPLE_QUERIES[0],
    response: `## Regulatory Pathway Analysis for CAR-T Therapy (Solid Tumors)

### Recommended Primary Pathway
**Biologics License Application (BLA)** under 21 CFR 601, with pursuit of **Breakthrough Therapy Designation (BTD)**.

### Pathway Justification

**1. Breakthrough Therapy Designation (BTD)**
- **Eligibility**: Novel CAR-T for solid tumors represents significant advancement over existing therapies
- **Requirements**: Preliminary clinical evidence showing substantial improvement over available therapy
- **Benefits**:
  - Intensive FDA guidance and collaboration
  - Organizational commitment from senior FDA management
  - Rolling review of BLA sections
  - Potential for Accelerated Approval if appropriate endpoint identified

**2. Alternative Designations to Consider**
- **Fast Track**: Lower bar than BTD, easier to obtain early in development
- **Regenerative Medicine Advanced Therapy (RMAT)**: Specifically for cell therapies, similar benefits to BTD
- **Orphan Drug Designation**: If applicable for rare tumor types

### Recommended Clinical Development Strategy

**Phase 1/2 Trial Design**
- Dose-escalation with expansion cohort
- Primary endpoint: Overall Response Rate (ORR)
- Secondary endpoints: Duration of Response (DOR), Progression-Free Survival (PFS)
- Safety endpoints: Cytokine Release Syndrome (CRS) grading, neurotoxicity

**Pivotal Trial Requirements**
- **For Accelerated Approval**: Single-arm trial with ORR endpoint (if no adequate existing therapy)
- **For Regular Approval**: Randomized controlled trial with survival endpoint (OS or PFS)
- Minimum 100-150 patients for accelerated approval
- Consider adaptive trial design for dose optimization

### Key Regulatory Milestones & Timeline

**Year 1: Pre-IND Phase**
- Month 1-3: Pre-IND meeting request and briefing document
- Month 4: Pre-IND meeting with FDA
- Month 5-6: IND preparation incorporating FDA feedback
- Month 6: IND submission

**Year 1-2: Phase 1/2**
- Month 7-8: IND goes into effect (30-day review)
- Month 8: First patient dosed
- Month 12-18: Dose escalation and safety data
- Month 18-24: Expansion cohort enrollment
- **BTD Application**: After preliminary efficacy data (Month 20)

**Year 3: Pivotal Trial Initiation**
- Month 24-30: End of Phase 2 meeting
- Month 30-36: Pivotal trial design finalized
- Month 36: Pivotal trial initiation

**Year 4-5: Accelerated Approval Path**
- Month 48: Interim analysis with ORR data
- Month 54: Pre-BLA meeting
- Month 60: BLA submission (Rolling Review if BTD granted)
- Month 66: FDA action (6-month review with Priority Review)

### CMC Considerations

**Critical Quality Attributes**
- T-cell viability and purity
- CAR expression levels
- Vector copy number
- Residual lentivirus/retrovirus
- Sterility and mycoplasma testing

**Manufacturing Challenges**
- Autologous vs allogeneic approach impacts CMC complexity
- Process validation with limited lots
- Comparability protocols if manufacturing changes
- Supply chain for starting material (patient leukapheresis)

**Regulatory Submissions**
- IND: Process description, cell characterization, stability data
- BLA: Full manufacturing process, in-process controls, specifications
- Expect ~3-4 information requests from FDA during BLA review

### Risk Mitigation Strategies

**High-Priority Risks**
1. **CRS Management**: Implement REMS if needed, clear mitigation protocols
2. **Manufacturing Consistency**: Early manufacturing lock, robust process controls
3. **Endpoint Selection**: Discuss ORR as surrogate with FDA early

**Post-Approval Commitments**
- Confirmatory trial with OS endpoint (if accelerated approval)
- Long-term safety follow-up (15 years per FDA guidance)
- REMS program for distribution and administration

### Estimated Timeline to Approval
- **Accelerated Approval**: 5.5-6 years from IND
- **Regular Approval**: 7-8 years from IND

### Recommendation
**Pursue BTD** based on preliminary Phase 1 data showing >30% ORR in refractory solid tumor population. Target accelerated approval with ORR endpoint, commit to confirmatory trial. Budget for intensive FDA interactions and manufacturing development.`,
  },
];

const REGULATORY_EXPERT_SPECS: AgentSpecs = {
  agentName: 'Regulatory Expert',
  model: {
    provider: 'Anthropic',
    modelName: 'claude-sonnet-4-20250514',
    optimizedFor: 'Superior reasoning for complex regulatory pathways, CMC requirements, and strategic planning',
    maxTokens: 4096,
    temperature: 1.0,
  },
  apiConnections: [
    {
      name: 'FDA & EMA Databases',
      status: 'connected',
      description: 'Real-time access to FDA guidance documents, approval letters, and regulatory precedents',
    },
    {
      name: 'Vision API (Document Analysis)',
      status: 'connected',
      description: 'Extract regulatory requirements and guidance from FDA/EMA documents',
    },
  ],
  dataSources: [
    {
      name: 'FDA Guidance & Approvals',
      type: 'real-time',
      description: 'FDA guidance documents, drug approvals, breakthrough designations, and regulatory precedents',
    },
    {
      name: 'EMA Regulatory Database',
      type: 'real-time',
      description: 'European regulatory requirements, CHMP opinions, and centralized approvals',
    },
    {
      name: 'Uploaded Regulatory Documents',
      type: 'on-demand',
      description: 'IND submissions, regulatory correspondence, and clinical development plans',
    },
  ],
  mcpServer: {
    available: true,
    enabled: process.env.MCP_ENABLED === 'true',
    tools: [
      {
        name: 'search_fda_guidance',
        description: 'Search FDA guidance documents and regulatory requirements',
      },
      {
        name: 'get_drug_approval',
        description: 'Retrieve FDA drug approval details and regulatory history',
      },
      {
        name: 'analyze_regulatory_pathway',
        description: 'Analyze optimal regulatory pathways and strategic options',
      },
    ],
  },
};

export default function RegulatoryExpertAgent() {
  const [mode, setMode] = useState<AgentMode>('demo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

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
        name: f.name,
        fileType: f.type,
        extractedText: f.extractedText,
        isImage: false,
      }));

    setProcessedDocuments(prev => [...prev, ...newDocs]);
    setShowUploadPanel(false);
  };

  const removeDocument = (index: number) => {
    setProcessedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const sendDemoMessage = () => {
    if (isLoading) return;

    const demo = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length];
    setDemoIndex(prev => prev + 1);

    const userMessage: Message = {
      role: 'user',
      content: demo.query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: demo.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const sendLiveMessage = async (messageText?: string) => {
    const textToSend = messageText || input;

    if (!textToSend.trim() || isLoading) return;

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
      const response = await fetch('/api/agents/regulatory-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: textToSend,
          documents: processedDocuments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from agent');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        cost: data.cost,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'live') {
        sendLiveMessage();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
          📋 Regulatory Expert
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Regulatory Strategy Agent
          </h1>
          <ModelBadge provider="Anthropic" modelName="Sonnet 4" />
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Get expert regulatory guidance on FDA/EMA pathways, accelerated approval programs,
          CMC requirements, and strategic regulatory planning for biotech products.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => { setMode('demo'); setMessages([]); }}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mode === 'demo'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          📺 Demo Mode (Free)
        </button>
        <button
          onClick={switchToLiveMode}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mode === 'live'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          🚀 Live AI Agent
        </button>
      </div>

      {/* Mode Info Banner */}
      {mode === 'demo' && (
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-orange-800">
            <strong>Demo Mode:</strong> Pre-recorded conversations. File uploads simulated.
          </p>
        </div>
      )}

      {mode === 'live' && isAuthenticated && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-green-800">
            <strong>Live Mode:</strong> Real-time AI with full document analysis (PDF, Excel, images, URLs).
          </p>
        </div>
      )}

      {mode === 'live' && !isAuthenticated && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
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

      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-white border-l-4 border-orange-500 ml-auto max-w-3xl'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm mb-1 ${message.role === 'user' ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {message.role === 'user' ? 'You' : 'Regulatory Expert'}
                    {message.cost && (
                      <span className="ml-2 text-xs">
                        (${message.cost.toFixed(4)})
                      </span>
                    )}
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
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
            <span className="text-gray-600">Analyzing regulatory requirements...</span>
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
        <div className="mb-6 p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Try Demo Mode</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to see a pre-recorded regulatory analysis. No API costs.
          </p>
          <button
            onClick={sendDemoMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
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
          {processedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 bg-gray-50">
              {processedDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  <span className="truncate max-w-[150px]">{doc.name}</span>
                  <button
                    onClick={() => removeDocument(index)}
                    className="hover:text-orange-900"
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
                {processedDocuments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center">
                    {processedDocuments.length}
                  </span>
                )}
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about regulatory pathways, approval strategies, CMC requirements..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />

              {/* Send Button */}
              <button
                onClick={() => sendLiveMessage()}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <ExportButton messages={messages} agentName="Regulatory Expert" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="mt-8">
        <AgentSpecsCard specs={REGULATORY_EXPERT_SPECS} />
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
            <div className="absolute inset-0 bg-orange-50 border-2 border-orange-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Pre-recorded regulatory pathway analyses demonstrating capabilities without API costs'
                    : 'Real-time regulatory intelligence powered by Claude Sonnet 4 via Anthropic API'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Specialization Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <h4 className="font-semibold text-gray-900 mb-1">Specialization</h4>
              <p className="text-sm text-gray-600">Regulatory Strategy</p>
            </div>
            <div className="absolute inset-0 bg-orange-50 border-2 border-orange-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Regulatory Intelligence</p>
                <p className="text-xs text-gray-700">
                  FDA/EMA pathways, IND/BLA strategy, CMC requirements, accelerated approval, breakthrough therapy designation, and clinical endpoint selection
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-semibold text-gray-900 mb-1">Capabilities</h4>
              <p className="text-sm text-gray-600">Strategic Planning</p>
            </div>
            <div className="absolute inset-0 bg-orange-50 border-2 border-orange-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Pathway Optimization</p>
                <p className="text-xs text-gray-700">
                  Complex regulatory reasoning, policy interpretation, risk mitigation, accelerated approval strategies, and full guidance document analysis
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
            <div className="absolute inset-0 bg-orange-50 border-2 border-orange-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Zero Cost' : 'Pay-per-Query'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Demo mode is completely free with pre-recorded regulatory analyses'
                    : 'Live mode charges $0.01-0.10 per query based on complexity and response length'
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
