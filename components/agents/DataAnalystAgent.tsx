'use client';

import { useState } from 'react';
import LoginModal from '@/components/shared/LoginModal';
import FileUpload, { UploadedFile } from '@/components/shared/FileUpload';
import URLInput from '@/components/shared/URLInput';
import DocumentHistory, { DocumentRecord } from '@/components/shared/DocumentHistory';
import { DATA_ANALYST_DEMOS, type MockConversation } from '@/lib/mockAgentResponses';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[]; // Document names attached to this message
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
  "Analyze the efficacy endpoints from this Phase 2 trial data. What are the key biomarker trends?",
  "Compare the top 3 CAR-T therapies by response rates, durability, and safety profile.",
  "What are the approval trends for oncology drugs in 2023-2024? Which indications are hottest?",
];

export default function DataAnalystAgent() {
  const [mode, setMode] = useState<AgentMode>('demo');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

  // Document management
  const [currentDocuments, setCurrentDocuments] = useState<ProcessedDocument[]>([]);
  const [documentHistory, setDocumentHistory] = useState<DocumentRecord[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
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
    // Check auth when switching to live mode
    checkAuthStatus();
  };

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

    // Add to history
    const newHistoryItems: DocumentRecord[] = files.map(f => ({
      id: `doc-${Date.now()}-${Math.random()}`,
      name: f.name,
      type: 'file' as const,
      timestamp: new Date(),
      fileType: f.type,
    }));
    setDocumentHistory(prev => [...prev, ...newHistoryItems]);
  };

  const handleURLProcessed = (url: string, content: string) => {
    const newDoc: ProcessedDocument = {
      fileName: url,
      fileType: 'text/html',
      text: content,
      isImage: false,
    };

    setCurrentDocuments(prev => [...prev, newDoc]);

    // Add to history
    const newHistoryItem: DocumentRecord = {
      id: `url-${Date.now()}`,
      name: url,
      type: 'url',
      timestamp: new Date(),
      url,
    };
    setDocumentHistory(prev => [...prev, newHistoryItem]);
  };

  const removeDocument = (index: number) => {
    setCurrentDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const clearDocuments = () => {
    setCurrentDocuments([]);
  };

  const sendDemoMessage = () => {
    if (isLoading) return;

    const demo: MockConversation = DATA_ANALYST_DEMOS[demoIndex % DATA_ANALYST_DEMOS.length];
    setDemoIndex(prev => prev + 1);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: demo.query,
      timestamp: new Date(),
      attachments: currentDocuments.map(d => d.fileName),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    clearDocuments(); // Clear after sending

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
      attachments: currentDocuments.map(d => d.fileName),
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
      const response = await fetch('/api/agents/data-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          documents: currentDocuments.length > 0 ? currentDocuments : undefined,
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
      clearDocuments(); // Clear after successful send

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
    clearDocuments();
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
          Clinical Data Analyst Agent
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
          AI-powered analyst for biotech clinical trials, competitive intelligence, and market analysis.
          Upload documents, analyze websites, or chat directly.
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
              <strong>Demo Mode:</strong> Pre-recorded conversations. File uploads simulated.
            </p>
          </div>
        )}

        {mode === 'live' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-green-800">
              <strong>Live Mode:</strong> Real-time AI with full document analysis (PDF, Excel, images, URLs).
            </p>
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      {mode === 'live' && (
        <div className="mb-6">
          <button
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-900">
                Upload Documents or Analyze URLs
                {currentDocuments.length > 0 && (
                  <span className="ml-2 text-sm text-blue-600">
                    ({currentDocuments.length} attached)
                  </span>
                )}
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showDocuments ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDocuments && (
            <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg space-y-6">
              {/* File Upload */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload Files</h3>
                <FileUpload onFilesProcessed={handleFilesProcessed} />
              </div>

              {/* URL Input */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Analyze Website</h3>
                <URLInput onURLProcessed={handleURLProcessed} />
              </div>

              {/* Current Attachments */}
              {currentDocuments.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Current Attachments ({currentDocuments.length})
                    </h3>
                    <button
                      onClick={clearDocuments}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {currentDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium text-blue-900 truncate">
                            {doc.fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => removeDocument(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document History */}
              {documentHistory.length > 0 && (
                <DocumentHistory
                  documents={documentHistory}
                  onSelectDocument={() => {}}
                  onClearHistory={() => setDocumentHistory([])}
                />
              )}
            </div>
          )}
        </div>
      )}

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
                  : 'Upload documents, add URLs, or ask questions about clinical trials and market trends'
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
                    className="block w-full text-left px-4 py-3 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-blue-500">
                        <div className="text-xs opacity-75 mb-1">Attachments:</div>
                        {message.attachments.map((att, i) => (
                          <div key={i} className="text-xs opacity-90 truncate">
                            📎 {att}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
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

        {/* Input Area - Only for Live Mode */}
        {mode === 'live' && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about clinical data, trials, or market analysis..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={() => sendLiveMessage()}
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear conversation
              </button>
            )}
          </div>
        )}

        {/* Demo Mode Controls */}
        {mode === 'demo' && messages.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
            <button
              onClick={() => sendDemoMessage()}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium mr-3"
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
            <p className="font-medium text-gray-900 mb-1">Mode</p>
            <p>{mode === 'demo' ? 'Demo (Mock Responses)' : 'Live (Claude Sonnet 4)'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Capabilities</p>
            <p>PDF, Excel, CSV, Images, URLs, Clinical data analysis</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Vision Support</p>
            <p>Yes - Charts, graphs, study figures</p>
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
