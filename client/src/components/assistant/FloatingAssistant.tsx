import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Loader2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

interface FloatingAssistantProps {
  language: 'en' | 'hi';
}

interface ChatSource {
  type: string;
  ghat?: string;
  priority?: string;
  score?: number;
  period?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  isLLMGenerated?: boolean;
  notice?: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = {
  en: [
    'Which ghat has the highest priority?',
    'What does dissolved oxygen indicate?',
    'Which parameters exceed benchmarks?',
  ],
  hi: [
    'किस घाट की सबसे अधिक प्राथमिकता है?',
    'घुलित ऑक्सीजन क्या दर्शाता है?',
    'कौन से पैरामीटर बेंचमार्क से अधिक हैं?',
  ],
};

async function sendChatMessage(
  message: string,
  language: string
): Promise<{
  response: string;
  sources: ChatSource[];
  isLLMGenerated: boolean;
  notice?: string;
}> {
  const res = await fetch('/api/v1/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query: message, language }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Failed to get response');
  }

  const data = await res.json();
  return {
    response: data.data.response,
    sources: data.data.sources || [],
    isLLMGenerated: data.data.isLLMGenerated,
    notice: data.meta?.notice,
  };
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSendMessage = async (message?: string) => {
    const query = message || inputValue.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(query, language);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        isLLMGenerated: response.isLLMGenerated,
        notice: response.notice,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        language === 'hi'
          ? 'प्रतिक्रिया प्राप्त करने में विफल।'
          : 'Failed to get response.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[70vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ backgroundColor: '#FFFEFA' }}
          role="dialog"
          aria-label={language === 'hi' ? 'घाटरक्षक AI सहायक' : 'Ghatrakshak AI Assistant'}
        >
          {/* Header - Deep Navy Blue */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl"
            style={{
              background: 'linear-gradient(135deg, #17365D 0%, #1e4a7a 100%)',
              borderColor: '#17365D'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(217, 164, 65, 0.25)' }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  घाटरक्षक AI
                </h3>
                <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                  Historical water quality data
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label={language === 'hi' ? 'बंद करें' : 'Close'}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Area - Warm Off-White */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[400px]"
            style={{ backgroundColor: '#FFFEFA' }}
          >
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Bot className="w-10 h-10 mx-auto mb-3" style={{ color: '#17365D', opacity: 0.4 }} />
                <p className="text-xs mb-4" style={{ color: '#64748b' }}>
                  {language === 'hi'
                    ? 'MPPCB डेटा (2023-2025) के बारे में पूछें'
                    : 'Ask about MPPCB data (2023-2025)'}
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_QUESTIONS[language].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="block w-full text-left px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #e2e8f0',
                        color: '#17365D'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#D9A441';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-3 py-2"
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: '#e0e8f0', color: '#17365D' }
                      : { backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0', color: '#334155' }
                  }
                >
                  {msg.role === 'assistant' && msg.isLLMGenerated && (
                    <div className="flex items-center gap-1 text-[9px] mb-1" style={{ color: '#D9A441' }}>
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI</span>
                    </div>
                  )}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                      <p className="text-[9px] font-medium mb-1 flex items-center gap-1" style={{ color: '#94a3b8' }}>
                        <ExternalLink className="w-2.5 h-2.5" />
                        Sources
                      </p>
                      {msg.sources.slice(0, 2).map((src, idx) => (
                        <div
                          key={idx}
                          className="text-[9px] rounded px-1.5 py-0.5 mb-0.5"
                          style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
                        >
                          {src.ghat} {src.period && `[${src.period}]`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3 py-2"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #e2e8f0' }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#17365D' }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-rose-700">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="p-3 rounded-b-2xl"
            style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'hi' ? 'प्रश्न पूछें...' : 'Ask a question...'}
                className="flex-1 px-3 py-2 rounded-xl text-xs placeholder:text-slate-400 transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #17365D',
                  color: '#334155',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#D9A441';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(217, 164, 65, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#17365D';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#17365D',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#1e4a7a';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#17365D';
                }}
                aria-label={language === 'hi' ? 'भेजें' : 'Send'}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] mt-1.5 text-center" style={{ color: '#94a3b8' }}>
              {language === 'hi'
                ? 'MPPCB 2023-2025 डेटा पर आधारित'
                : 'Based on MPPCB 2023-2025 data'}
            </p>
          </div>
        </div>
      )}

      {/* Floating Button - Deep Navy Blue */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: '#17365D',
          color: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(23, 54, 93, 0.35)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1e4a7a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#17365D';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(23, 54, 93, 0.35), 0 0 0 2px #D9A441';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(23, 54, 93, 0.35)';
        }}
        aria-label={
          isOpen
            ? language === 'hi'
              ? 'AI सहायक बंद करें'
              : 'Close AI Assistant'
            : language === 'hi'
            ? 'घाटरक्षक AI से पूछें'
            : 'Ask Ghatrakshak AI'
        }
        title={
          isOpen
            ? language === 'hi'
              ? 'बंद करें'
              : 'Close'
            : language === 'hi'
            ? 'घाटरक्षक AI से पूछें'
            : 'Ask Ghatrakshak AI'
        }
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
};

export default FloatingAssistant;
