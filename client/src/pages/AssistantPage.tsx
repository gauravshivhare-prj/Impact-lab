import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, AlertCircle, ExternalLink, Trash2, Sparkles, Info } from 'lucide-react';

interface AssistantPageProps {
  language: 'en' | 'hi';
}

interface ChatSource {
  type: string;
  ghat?: string;
  priority?: string;
  score?: number;
  period?: string;
  parameter?: string;
  value?: string;
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
    'Which ghat has the highest priority in the available dataset?',
    'Explain the latest observations for Khatlapura Ghat',
    'What does dissolved oxygen tell us about water quality?',
    'Which parameters exceed their configured benchmarks?',
    'What are the limitations of the historical dataset?',
  ],
  hi: [
    'उपलब्ध डेटासेट में किस घाट की सबसे अधिक प्राथमिकता है?',
    'खटलापुरा घाट के नवीनतम अवलोकन समझाएं',
    'घुलित ऑक्सीजन जल गुणवत्ता के बारे में क्या बताता है?',
    'कौन से पैरामीटर अपने कॉन्फ़िगर किए गए बेंचमार्क से अधिक हैं?',
    'ऐतिहासिक डेटासेट की सीमाएं क्या हैं?',
  ],
};

async function sendChatMessage(message: string, language: string): Promise<{
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

export const AssistantPage: React.FC<AssistantPageProps> = ({ language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          ? 'प्रतिक्रिया प्राप्त करने में विफल। कृपया पुनः प्रयास करें।'
          : 'Failed to get response. Please try again.'
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl">
              <Bot className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {language === 'hi' ? 'Ghatरक्षक AI सहायक' : 'Ghatrakshak AI Assistant'}
              </h1>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'ऐतिहासिक जल गुणवत्ता डेटा (2023-2025) पर आधारित'
                  : 'Evidence-grounded responses from historical data (2023-2025)'}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title={language === 'hi' ? 'वार्तालाप साफ़ करें' : 'Clear conversation'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Data Notice Banner */}
      <div className="px-6 py-2 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2 text-xs text-amber-800">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {language === 'hi'
              ? 'सभी उत्तर ऐतिहासिक MPPCB रिपोर्ट (2023-2025) पर आधारित हैं। वर्तमान जल गुणवत्ता का प्रतिनिधित्व नहीं करते।'
              : 'All responses are based on historical MPPCB reports (2023-2025). Does not represent current water quality.'}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-600 mb-2">
              {language === 'hi' ? 'जल गुणवत्ता सहायक' : 'Water Quality Assistant'}
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {language === 'hi'
                ? 'भोपाल के विसर्जन घाटों के MPPCB निगरानी डेटा (2023-2025) के बारे में प्रश्न पूछें।'
                : "Ask questions about MPPCB monitoring data (2023-2025) from Bhopal's visarjan ghats."}
            </p>

            {/* Suggested Questions */}
            <div className="max-w-lg mx-auto">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                {language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Questions'}
              </p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS[language].map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-800 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              {msg.role === 'assistant' && msg.isLLMGenerated && (
                <div className="flex items-center gap-1 text-[10px] text-teal-600 mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>AI-generated response</span>
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Notice */}
              {msg.notice && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <p className="text-xs text-amber-600">{msg.notice}</p>
                </div>
              )}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {language === 'hi' ? 'स्रोत डेटा:' : 'Source Data:'}
                  </p>
                  <div className="space-y-1">
                    {msg.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1"
                      >
                        {src.ghat && <span className="font-medium">{src.ghat}</span>}
                        {src.priority && <span> - {src.priority} priority</span>}
                        {src.score && <span> (score: {src.score.toFixed(1)})</span>}
                        {src.period && <span> [{src.period}]</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p
                className={`text-[10px] mt-2 ${
                  msg.role === 'user' ? 'text-teal-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              language === 'hi'
                ? 'जल गुणवत्ता के बारे में प्रश्न पूछें...'
                : 'Ask about water quality...'
            }
            className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
