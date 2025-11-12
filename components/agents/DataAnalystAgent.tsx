'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SAMPLE_QUERIES = [
  "Analyze the efficacy endpoints from this Phase 2 trial data. What are the key biomarker trends?",
  "Compare the top 3 CAR-T therapies by response rates, durability, and safety profile.",
  "What are the approval trends for oncology drugs in 2023-2024? Which indications are hottest?",
];

export default function DataAnalystAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (messageText?: string) => {
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
      const response = await fetch('/api/agents/data-analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
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
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Clinical Data Analyst Agent
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          AI-powered analyst for biotech clinical trials, competitive intelligence, and market analysis
        </p>
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
                Ask me about clinical trials, biomarker data, competitive analysis, or market trends.
              </p>

              {/* Sample Queries */}
              <div className="space-y-2 w-full max-w-xl">
                <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
                {SAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(query)}
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
                      <div className="animate-pulse">Analyzing</div>
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

        {/* Input Area */}
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
              onClick={() => sendMessage()}
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
      </div>

      {/* Behind the Scenes */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔧 Behind the Scenes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900 mb-1">Model</p>
            <p>Claude Sonnet 4 (claude-sonnet-4-20250514)</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Specialization</p>
            <p>Clinical trials, biomarkers, competitive intelligence</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Capabilities</p>
            <p>Data analysis, statistical interpretation, market trends</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-1">Tech Stack</p>
            <p>Next.js, TypeScript, Anthropic API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
