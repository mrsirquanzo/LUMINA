'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import LoginModal from '@/components/shared/LoginModal';
import ExportButton from '@/components/shared/ExportButton';

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
  "Size the market opportunity for a novel Alzheimer's therapy targeting amyloid-beta. What's the TAM, SAM, and realistic peak sales?",
  "Analyze the competitive landscape for CAR-T therapies in large B-cell lymphoma. How should we position our product?",
  "What's a realistic pricing strategy for a gene therapy treating hemophilia B? Consider payer dynamics and value-based pricing.",
  "Forecast 5-year revenues for an obesity drug with similar efficacy to Wegovy but 30% less expensive. Include market share assumptions.",
];

const DEMO_RESPONSES = [
  {
    query: SAMPLE_QUERIES[0],
    response: `## Market Opportunity Analysis: Novel Alzheimer's Therapy (Amyloid-Beta Targeting)

### Executive Summary
The Alzheimer's disease market represents a significant commercial opportunity, with an addressable patient population of ~6.7 million in the US alone. However, realistic market penetration will be limited by diagnostic requirements, patient selection criteria, and payer restrictions. **Peak sales estimate: $3.5-5.5B** (Years 6-8 post-launch).

---

### Market Sizing Analysis

**Total Addressable Market (TAM)**

*US Market:*
- **Prevalence**: 6.7 million Alzheimer's patients
- **Eligible Population** (MCI-mild AD, amyloid-positive): ~2.5 million
- **Annual Treatment Cost** (assumption): $26,500/year
- **US TAM**: 2.5M × $26,500 = **$66.3 billion**

*Global Market (5 major markets: US, EU5, Japan):*
- **Prevalence**: ~15 million Alzheimer's patients
- **Eligible Population**: ~5.5 million
- **Global TAM**: 5.5M × $26,500 = **$145.8 billion**

**Serviceable Addressable Market (SAM)**

Realistic constraints reducing TAM:
1. **Diagnostic Requirements**: PET scan or CSF biomarker confirming amyloid-positive status
   - Diagnostic penetration: ~30-40% of eligible patients
   - Reduces SAM by 60-70%

2. **Physician Adoption**: Specialty neurologists comfortable prescribing
   - Estimated 40% adoption rate in first 3 years
   - Ramps to 65% by year 5

3. **Infusion Infrastructure**: Monthly/biweekly IV infusions required
   - Limits to patients with access to infusion centers
   - ~70% of urban/suburban markets accessible

**Adjusted SAM Calculation:**
- Eligible population: 2.5M (US) × 35% (diagnosed) × 65% (physician adoption) × 70% (access) = **~400,000 patients**
- **US SAM**: 400K × $26,500 = **$10.6 billion**
- **Global SAM**: ~900K patients × $26,500 = **$23.9 billion**

**Serviceable Obtainable Market (SOM)**

Competitive landscape assumes:
- Leqembi (Eisai/Biogen): Market leader, 40-45% share
- Donanemab (Eli Lilly): Strong competitor, 25-30% share
- Your Product: 15-20% share (favorable safety profile, competitive efficacy)

**US SOM**: $10.6B × 18% = **$1.9 billion**
**Global SOM**: $23.9B × 18% = **$4.3 billion**

---

### Revenue Forecast Model

**Key Assumptions:**
- Launch Year: 2026
- Price: $26,500/year (comparable to Leqembi)
- Market share: Progressive ramp
- Patient persistence: 75% year-over-year

| Year | US Patients | Global Patients | US Revenue | Global Revenue | Market Share |
|------|------------|----------------|------------|----------------|--------------|
| 2026 (L) | 5,000 | 12,000 | $133M | $318M | 2% |
| 2027 | 15,000 | 38,000 | $398M | $1.0B | 5% |
| 2028 | 35,000 | 90,000 | $928M | $2.4B | 10% |
| 2029 | 55,000 | 145,000 | $1.5B | $3.8B | 15% |
| 2030 | 70,000 | 180,000 | $1.9B | $4.8B | 18% |
| 2031 | 72,000 | 185,000 | $1.9B | $4.9B | 18% |

**Peak Sales: $4.9B globally** (Years 7-10)

---

### Competitive Positioning

**Current Landscape:**
1. **Leqembi** (lecanemab): First-mover advantage, $26,500/year
   - Strengths: FDA approval, strong clinical data, brand recognition
   - Weaknesses: ARIA-E concerns, infusion burden

2. **Donanemab** (Eli Lilly): Expected 2024 approval
   - Strengths: Potentially limited treatment duration, strong efficacy
   - Weaknesses: Later to market, ARIA concerns

**Differentiation Strategy:**
To capture 15-20% market share, focus on:
1. **Safety Profile**: Lower ARIA-E rates vs. competitors
2. **Dosing Convenience**: Less frequent dosing if possible
3. **Biomarker Strategy**: Broader diagnostic criteria
4. **Patient Support**: Comprehensive hub services for diagnosis and monitoring

---

### Pricing Strategy & Payer Dynamics

**Recommended Price: $26,500/year**

**Rationale:**
- **Value-Based Pricing**: ICER threshold ~$150K/QALY
  - Assume 0.25 QALY gain → justifies up to $37,500
- **Competitive Parity**: Match Leqembi to avoid payer disadvantage
- **Market Access**: Price above $30K risks restrictive prior authorizations

**Payer Coverage Expectations:**

*Medicare (60% of patients):*
- Coverage: Yes, under Part B (physician-administered drug)
- Prior Authorization: Required (confirmed amyloid-positive diagnosis)
- Copay: 20% coinsurance ($5,300/year) - barrier for some patients

*Commercial Payers (35% of patients):*
- Coverage: Tier 4-5 specialty drug
- Prior Authorization: Stringent (imaging, specialist prescription, biomarker)
- Step Therapy: Possible requirement for acetylcholinesterase inhibitors first
- Copay Assistance: Critical for adoption

**Estimated Reimbursement Rate**: 75-80% of patients with insurance coverage

---

### Market Access Barriers & Mitigation

**High-Priority Barriers:**

1. **Diagnostic Bottleneck**
   - **Barrier**: PET scans ($5,000) or CSF testing required
   - **Mitigation**: Partner with diagnostic companies, subsidize testing, develop blood-based biomarkers

2. **ARIA Monitoring Requirements**
   - **Barrier**: MRI monitoring q3-6 months increases cost and burden
   - **Mitigation**: Demonstrate lower ARIA rates in trials, streamline monitoring protocols

3. **Physician Hesitancy**
   - **Barrier**: Modest clinical benefit (~27% slowing on CDR-SB)
   - **Mitigation**: KOL engagement, real-world evidence studies, patient advocacy

**Medium-Priority Barriers:**

4. **Infusion Infrastructure**
   - Home infusion programs
   - Partnership with infusion networks

5. **Patient Persistence**
   - Hub services for scheduling and adherence support
   - Copay assistance programs

---

### Go-To-Market Strategy

**Phase 1 (Months 1-12): Launch & Early Adoption**
- Target: 5,000 patients
- Focus: Top 50 Alzheimer's centers, early adopter neurologists
- Investment: $150M (sales force, hub services, copay support)

**Phase 2 (Years 2-3): Market Expansion**
- Target: 35,000 patients by Year 3
- Focus: Community neurologists, broader diagnostic access
- Investment: $250M/year (DTC advertising, expanded sales force)

**Phase 3 (Years 4-5): Peak Market Penetration**
- Target: 70,000 patients by Year 5
- Focus: Patient persistence programs, real-world evidence
- Investment: $200M/year (maintenance, evidence generation)

---

### Risk Factors

**Commercial Risks (Probability × Impact):**
1. **Disease-Modifying Competitors** (40% × High): Next-gen therapies (tau inhibitors, oral meds)
2. **Payer Restrictions** (60% × High): Medicare coverage limitations
3. **Safety Signals** (20% × Critical): Post-market ARIA-related deaths
4. **Diagnostic Lag** (70% × Medium): Slow adoption of biomarker testing

**Mitigation:**
- Lifecycle management: Develop combination therapies or next-gen formats
- Health economics studies demonstrating cost-effectiveness
- Robust pharmacovigilance and risk management

---

### Recommendation

**Market opportunity is substantial ($4-5B peak sales) but requires:**
1. **Competitive pricing** at $26,500/year
2. **Strong safety differentiation** to overcome payer skepticism
3. **Diagnostic partnerships** to expand testing access
4. **$500-600M commercial investment** over first 5 years

**Expected ROI**: Positive with NPV of $2-3B (assuming $1.5B development costs, 10% discount rate).`,
  },
];

export default function MarketResearchAgent() {
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
      const response = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
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
        content: data.message || data.response,
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
        <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
          📊 Market Research
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Market Research Agent
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Get data-driven market analysis including market sizing, competitive landscape,
          pricing strategy, revenue forecasting, and commercial opportunity assessment.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          onClick={() => { setMode('demo'); setMessages([]); }}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mode === 'demo'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          📺 Demo Mode (Free)
        </button>
        <button
          onClick={switchToLiveMode}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mode === 'live'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          🚀 Live AI Agent
        </button>
      </div>

      {/* Mode Info Banner */}
      {mode === 'demo' && (
        <div className="mb-6 p-3 bg-teal-50 border border-teal-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-teal-800">
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
                  ? 'bg-white border-l-4 border-teal-500 ml-auto max-w-3xl'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm mb-1 ${message.role === 'user' ? 'text-teal-600 font-medium' : 'text-gray-500'}`}>
                    {message.role === 'user' ? 'You' : 'Market Research Analyst'}
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
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
            <span className="text-gray-600">Analyzing market opportunity...</span>
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
        <div className="mb-6 p-6 bg-teal-50 border border-teal-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Try Demo Mode</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to see a pre-recorded market analysis. No API costs.
          </p>
          <button
            onClick={sendDemoMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50"
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
                  className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                >
                  <span className="truncate max-w-[150px]">{doc.name}</span>
                  <button
                    onClick={() => removeDocument(index)}
                    className="hover:text-teal-900"
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-xs rounded-full flex items-center justify-center">
                    {processedDocuments.length}
                  </span>
                )}
              </button>

              {/* Textarea */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about market sizing, competitive positioning, pricing strategy, revenue forecasts..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />

              {/* Send Button */}
              <button
                onClick={() => sendLiveMessage()}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <ExportButton messages={messages} agentName="Market Research" />
              </div>
            )}
          </div>
        </div>
      )}

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
            <div className="absolute inset-0 bg-teal-50 border-2 border-teal-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Pre-recorded market analyses demonstrating capabilities without API costs'
                    : 'Real-time market intelligence powered by Perplexity Sonar Pro with live data'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Specialization Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900 mb-1">Specialization</h4>
              <p className="text-sm text-gray-600">Market Research</p>
            </div>
            <div className="absolute inset-0 bg-teal-50 border-2 border-teal-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Market Intelligence</p>
                <p className="text-xs text-gray-700">
                  Market sizing (TAM/SAM/SOM), competitive positioning, pricing strategy, revenue forecasting, and commercial opportunity assessment
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Card */}
          <div className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="font-semibold text-gray-900 mb-1">Capabilities</h4>
              <p className="text-sm text-gray-600">Real-Time Data</p>
            </div>
            <div className="absolute inset-0 bg-teal-50 border-2 border-teal-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Live Market Intelligence</p>
                <p className="text-xs text-gray-700">
                  Real-time web search, live competitive data, current market trends, pricing benchmarks, recent deals, and latest product launches
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
            <div className="absolute inset-0 bg-teal-50 border-2 border-teal-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Zero Cost' : 'Pay-per-Query'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Demo mode is completely free with pre-recorded market analyses'
                    : 'Live mode charges $0.01-0.10 per query with real-time market data access'
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
