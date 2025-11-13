'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import LoginModal from '@/components/shared/LoginModal';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      if (data.authenticated) {
        setMode('live');
        setMessages([]);
      } else {
        setShowLoginModal(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setShowLoginModal(true);
    }
  };

  const switchToLiveMode = () => {
    checkAuthStatus();
  };

  const handleLoginSuccess = () => {
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
          🎭 Demo Mode
        </button>
        <button
          onClick={switchToLiveMode}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            mode === 'live'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
        >
          ⚡ Live Mode
        </button>
      </div>

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

      {/* Sample Queries */}
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

      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-teal-100 ml-auto max-w-3xl'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500 mb-1">
                    {message.role === 'user' ? 'You' : 'Market Research Analyst'}
                    {message.cost && (
                      <span className="ml-2 text-xs">
                        (${message.cost.toFixed(4)})
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
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

      {/* File Upload - Live Mode Only */}
      {mode === 'live' && (
        <div className="mb-6">
          <FileUpload onFilesProcessed={handleFilesProcessed} />
        </div>
      )}

      {/* Input Area (Live Mode) */}
      {mode === 'live' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about market sizing, competitive positioning, pricing strategy, revenue forecasts..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {processedDocuments.length > 0 && `${processedDocuments.length} file(s) attached`}
            </span>
            <button
              onClick={() => sendLiveMessage()}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
