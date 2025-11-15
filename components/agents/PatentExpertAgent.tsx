'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoginModal from '@/components/shared/LoginModal';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import ExportButton from '@/components/shared/ExportButton';
import { PATENT_EXPERT_DEMOS, type MockConversation } from '@/lib/mockAgentResponses';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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

type AgentMode = 'demo' | 'live';

const SAMPLE_QUERIES = [
  "Analyze the patent landscape for CRISPR gene editing technologies. Who owns the key IP?",
  "What's the patent strategy behind Moderna's mRNA vaccine platform? What are their blocking patents?",
  "Compare the ADC patent portfolios of Daiichi Sankyo, AstraZeneca, and Seagen. Who has the strongest position?",
];

export default function PatentExpertAgent() {
  const [mode, setMode] = useState<AgentMode>('demo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

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
        fileName: f.name,
        fileType: f.type,
        extractedText: f.extractedText,
        text: f.extractedText,
        isImage: false,
      }));

    setProcessedDocuments(prev => [...prev, ...newDocs]);
  };

  const sendDemoMessage = () => {
    if (isLoading) return;

    const demo: MockConversation = PATENT_EXPERT_DEMOS[demoIndex % PATENT_EXPERT_DEMOS.length];
    setDemoIndex(prev => prev + 1);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: demo.query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate typing delay
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

      // Call API
      const response = await fetch('/api/agents/patent-expert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          documents: processedDocuments,
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
        content: data.message,
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'live') {
        sendLiveMessage();
      }
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Patent Expert Agent
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
          AI-powered analyst for biotech biotech IP strategy and competitive intelligence
        </p>

        {/* Mode Switcher */}
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => { setMode('demo'); setMessages([]); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'demo'
                  ? 'bg-purple-100 text-purple-700'
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
          <div className="mt-4 p-3 bg-purple-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-purple-800">
              <strong>Demo Mode:</strong> Pre-recorded conversations showing agent capabilities. No API calls, completely free!
            </p>
          </div>
        )}

        {mode === 'live' && isAuthenticated && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-green-800">
              <strong>Live Mode:</strong> Real-time AI responses powered by Claude API. Authenticated session active.
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

      {/* Demo Mode Instructions */}
      {mode === 'demo' && messages.length === 0 && (
        <div className="mb-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Try Demo Mode</h3>
          <p className="text-gray-700 mb-4">
            Click the button below to see a pre-recorded patent analysis. No API costs.
          </p>
          <button
            onClick={sendDemoMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
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
              className={`p-4 rounded-lg shadow-sm ${
                message.role === 'user'
                  ? 'bg-white border-l-4 border-purple-500 ml-auto max-w-3xl'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {message.role === 'user' ? '👤' : '⚖️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm mb-1 ${message.role === 'user' ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                    {message.role === 'user' ? 'You' : 'Patent Expert'}
                  </div>
                  <div className="text-sm leading-relaxed max-w-none text-gray-800">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Minimal heading styling - just slightly larger, no bold
                        h1: (props) => <p className="text-base font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                        h2: (props) => <p className="text-base font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                        h3: (props) => <p className="text-sm font-medium mt-2 mb-1 text-gray-900" {...props} />,
                        // Subtle bold - just slightly heavier
                        strong: (props) => <span className="font-semibold text-gray-900" {...props} />,
                        // Clean lists
                        ul: (props) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                        ol: (props) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                        li: (props) => <li className="ml-0" {...props} />,
                        // Simple paragraphs
                        p: (props) => <p className="my-2" {...props} />,
                        // Subtle code
                        code: ({inline, ...props}: any) =>
                          inline ? (
                            <code className="px-1 py-0.5 bg-purple-50 text-purple-900 rounded text-xs font-mono border border-purple-200" {...props} />
                          ) : (
                            <code className="block p-2 bg-gray-100 text-gray-800 rounded text-xs font-mono my-2 overflow-x-auto border border-gray-300" {...props} />
                          ),
                      }}
                    >
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
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Analyzing patent data...</span>
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
            placeholder="Ask about patents, IP strategy, or competitive analysis..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {processedDocuments.length > 0 && `${processedDocuments.length} file(s) attached`}
            </span>
            <button
              onClick={() => sendLiveMessage()}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          {messages.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <ExportButton messages={messages} agentName="Patent Expert" />
            </div>
          )}
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
            <div className="absolute inset-0 bg-purple-50 border-2 border-purple-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Pre-recorded patent analyses demonstrating capabilities without API costs'
                    : 'Real-time IP analysis powered by Perplexity Sonar Pro with live patent database access'
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
              <p className="text-sm text-gray-600">IP Strategy</p>
            </div>
            <div className="absolute inset-0 bg-purple-50 border-2 border-purple-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Patent Intelligence</p>
                <p className="text-xs text-gray-700">
                  Patent landscape analysis, FTO assessment, IP portfolio strategy, competitive positioning, patent valuation, and licensing strategy
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
            <div className="absolute inset-0 bg-purple-50 border-2 border-purple-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">Live Patent Intelligence</p>
                <p className="text-xs text-gray-700">
                  Real-time USPTO/EPO/Google Patents access, recent filings, litigation updates, prior art search, and comprehensive IP landscape analysis
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
            <div className="absolute inset-0 bg-purple-50 border-2 border-purple-200 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-full flex flex-col justify-center">
                <p className="text-sm text-gray-800 font-medium mb-2">
                  {mode === 'demo' ? 'Zero Cost' : 'Pay-per-Query'}
                </p>
                <p className="text-xs text-gray-700">
                  {mode === 'demo'
                    ? 'Demo mode is completely free with pre-recorded patent analyses'
                    : 'Live mode charges $0.01-0.10 per query with real-time patent database access'
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
