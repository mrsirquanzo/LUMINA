import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import type { ProcessedDocument, ExecutionMode, SSEEvent } from '../lib/multiAgentTypes';

export interface SonnyChatMessage {
  id: string;
  role: 'user' | 'sonny';
  content: string;
  timestamp: Date;
}

interface SonnyChatProps {
  initialQuery?: string;
  documents?: ProcessedDocument[];
  mode?: ExecutionMode;
  onMessage?: (message: SonnyChatMessage) => void;
  className?: string;
  placeholder?: string;
}

export default function SonnyChat({
  initialQuery,
  documents = [],
  mode = 'fast',
  onMessage,
  className = '',
  placeholder = 'Ask Sonny anything...',
}: SonnyChatProps) {
  const [messages, setMessages] = useState<SonnyChatMessage[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

  // Auto-send initial query if provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && messages.length === 0) {
      handleSend(initialQuery);
    }
  }, [initialQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (queryText?: string) => {
    const query = queryText || input.trim();
    if (!query || isLoading) return;

    // Add user message
    const userMessage: SonnyChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');
    onMessage?.(userMessage);

    try {
      // Create SSE connection to orchestrator
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          documents,
          mode,
          isDemo: false, // Set to true for demo mode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let sonnyMessageId: string | null = null;
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const eventData = line.substring(6);
            try {
              const event: SSEEvent = JSON.parse(eventData);
              handleSSEEvent(event, (content: string) => {
                fullContent = content;
                setCurrentResponse(content);

                // Update or create sonny message
                if (!sonnyMessageId) {
                  const newMessage: SonnyChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'sonny',
                    content: content,
                    timestamp: new Date(),
                  };
                  sonnyMessageId = newMessage.id;
                  setMessages((prev) => [...prev, newMessage]);
                  onMessage?.(newMessage);
                } else {
                  // Update existing message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === sonnyMessageId
                        ? { ...msg, content: content }
                        : msg
                    )
                  );
                }
              });
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }

      // Finalize message when complete - update with final content
      if (sonnyMessageId && fullContent) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === sonnyMessageId ? { ...msg, content: fullContent } : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Sonny chat error:', error);
      const errorMessage: SonnyChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'sonny',
        content: `Error: ${error.message || 'Failed to get response from Sonny'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      onMessage?.(errorMessage);
    } finally {
      setIsLoading(false);
      setCurrentResponse('');
    }
  };

  const handleSSEEvent = (event: SSEEvent, onContentUpdate: (content: string) => void) => {
    switch (event.type) {
      case 'agent_response':
        if (event.data.agent && event.data.response) {
          const agentName = event.data.agent;
          const response = event.data.response;
          onContentUpdate(`**${agentName}**: ${response}\n\n`);
        }
        break;

      case 'synthesis_progress':
        if (event.data.text) {
          onContentUpdate(event.data.text);
        }
        break;

      case 'complete':
        if (event.data.synthesis) {
          onContentUpdate(event.data.synthesis);
        }
        break;

      case 'error':
        onContentUpdate(`\n\n⚠️ Error: ${event.data.message || 'An error occurred'}`);
        break;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center text-textSecondary text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary opacity-50" />
            <p>{placeholder}</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-surfaceElevated border border-white/10 text-textPrimary'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          </div>
        ))}

        {/* Streaming response */}
        {isLoading && currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-surfaceElevated border border-white/10 text-textPrimary">
              <div className="text-sm whitespace-pre-wrap break-words">{currentResponse}</div>
              <Loader2 className="w-4 h-4 animate-spin mt-2 text-primary" />
            </div>
          </div>
        )}

        {isLoading && !currentResponse && (
          <div className="flex justify-start">
            <div className="rounded-lg p-3 bg-surfaceElevated border border-white/10">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-textPrimary placeholder:text-textTertiary focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
