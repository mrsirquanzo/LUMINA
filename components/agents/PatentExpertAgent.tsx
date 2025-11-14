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

      {/* Main Chat Interface */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Messages Area */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to analyze data
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                {mode === 'demo'
                  ? 'Click a sample query below to see a demo conversation'
                  : 'Ask me about patent landscapes, IP strategy, freedom-to-operate, or competitive patent portfolios'
                }
              </p>

              {/* Sample Queries */}
              <div className="space-y-2 w-full max-w-xl">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {mode === 'demo' ? 'Try these demo examples:' : 'Try these examples:'}
                </p>
                {SAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => mode === 'demo' ? sendDemoMessage() : sendLiveMessage(query)}
                    className="block w-full text-left px-4 py-3 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className={`text-sm leading-relaxed max-w-none ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}
                         style={{
                           // Clean, minimal markdown styling
                           '--heading-weight': '600',
                           '--heading-color': message.role === 'user' ? '#ffffff' : '#374151',
                         } as any}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Minimal heading styling - just slightly larger, no bold
                          h1: (props) => <p className="text-base font-semibold mt-3 mb-2" {...props} />,
                          h2: (props) => <p className="text-base font-semibold mt-3 mb-2" {...props} />,
                          h3: (props) => <p className="text-sm font-medium mt-2 mb-1" {...props} />,
                          // Subtle bold - just slightly heavier
                          strong: (props) => <span className="font-medium" {...props} />,
                          // Clean lists
                          ul: (props) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                          ol: (props) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                          li: (props) => <li className="ml-0" {...props} />,
                          // Simple paragraphs
                          p: (props) => <p className="my-2" {...props} />,
                          // Subtle code
                          code: ({inline, ...props}: any) =>
                            inline ? (
                              <code className="px-1 py-0.5 bg-gray-200 text-gray-800 rounded text-xs font-mono" {...props} />
                            ) : (
                              <code className="block p-2 bg-gray-200 text-gray-800 rounded text-xs font-mono my-2 overflow-x-auto" {...props} />
                            ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">
                        {mode === 'demo' ? 'Loading demo response' : 'Analyzing'}
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-700">⚠️ {error}</p>
          </div>
        )}

        {/* File Upload - Only for Live Mode */}
        {mode === 'live' && (
          <div className="border-t border-gray-200 px-4 pt-4 bg-gray-50">
            <FileUpload onFilesProcessed={handleFilesProcessed} />
          </div>
        )}

        {/* Input Area - Only for Live Mode */}
        {mode === 'live' && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about patents, IP strategy, or competitive analysis..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={() => sendLiveMessage()}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>

            {messages.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <ExportButton messages={messages} agentName="Patent Expert" />
                <button
                  onClick={clearConversation}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear conversation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Demo Mode Controls */}
        {mode === 'demo' && messages.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
            <button
              onClick={() => sendDemoMessage()}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium mr-3"
            >
              Next Demo
            </button>
            <button
              onClick={clearConversation}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear conversation
            </button>
          </div>
        )}
      </div>

      {/* Behind the Scenes */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔧 Behind the Scenes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-1">AI Model</p>
            <p>{mode === 'demo' ? 'Demo (Mock Responses)' : 'Perplexity Sonar Large (Llama 3.1 128K Online)'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Key Strengths</p>
            <p>Real-time web search, current patent data, live USPTO/EPO access</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Specialization</p>
            <p>Patent landscape analysis, FTO opinions, IP strategy, prior art search</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Online Capabilities</p>
            <p>Live patent database search • Recent filings • Litigation updates</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Data Freshness</p>
            <p>Real-time - Accesses latest patent filings and legal developments</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Cost</p>
            <p>{mode === 'demo' ? 'Free (No API calls)' : '$0.01-0.10 per query'}</p>
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
