import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { GhatPriority } from '../types';

interface AssistantPageProps {
  language: 'en' | 'hi';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { ghat: string; parameter: string; year: number; value: string }[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = {
  en: [
    'Which ghat has the worst BOD levels?',
    'Show me dissolved oxygen trends at Khatlapura Ghat',
    'What is the pH range at Prempura Ghat?',
    'Compare water quality across all ghats in 2024',
    'Which parameters exceed CPCB limits most often?',
  ],
  hi: [
    'किस घाट पर BOD का स्तर सबसे खराब है?',
    'खटलापुरा घाट पर घुलित ऑक्सीजन की प्रवृत्ति दिखाएं',
    'प्रेमपुरा घाट पर pH की रेंज क्या है?',
    '2024 में सभी घाटों की जल गुणवत्ता की तुलना करें',
    'कौन से पैरामीटर CPCB सीमा से सबसे अधिक बार अधिक हैं?',
  ],
};

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

  const generateResponse = async (query: string): Promise<{ content: string; sources: ChatMessage['sources'] }> => {
    const queryLower = query.toLowerCase();
    const allMeasurements = dataService.getAllMeasurements();
    const rankings = dataService.getSiteRankings();

    const sources: ChatMessage['sources'] = [];

    if (queryLower.includes('worst') && queryLower.includes('bod')) {
      const bodMeasurements = allMeasurements.filter(
        (m) => m.parameter.toLowerCase() === 'bod' && m.numericValue !== null
      );
      const byGhat = new Map<string, number[]>();
      bodMeasurements.forEach((m) => {
        if (!byGhat.has(m.site)) byGhat.set(m.site, []);
        byGhat.get(m.site)!.push(m.numericValue!);
      });

      let worstGhat = '';
      let worstAvg = 0;
      byGhat.forEach((values, ghat) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        if (avg > worstAvg) {
          worstAvg = avg;
          worstGhat = ghat;
        }
      });

      if (worstGhat) {
        const readings = byGhat.get(worstGhat)!;
        readings.slice(0, 3).forEach((val, i) => {
          sources.push({ ghat: worstGhat, parameter: 'BOD', year: 2023 + i, value: `${val.toFixed(2)} mg/l` });
        });

        return {
          content: language === 'hi'
            ? `${worstGhat} में सबसे खराब BOD स्तर है, औसत ${worstAvg.toFixed(2)} mg/l। CPCB Class B मानक अधिकतम 3.0 mg/l की अनुमति देता है। इस घाट पर ${readings.length} रीडिंग दर्ज की गई हैं।`
            : `${worstGhat} has the worst BOD levels with an average of ${worstAvg.toFixed(2)} mg/l. The CPCB Class B standard allows a maximum of 3.0 mg/l. This ghat has ${readings.length} recorded readings.`,
          sources,
        };
      }
    }

    if (queryLower.includes('dissolved oxygen') || queryLower.includes('do ') || queryLower.includes('घुलित ऑक्सीजन')) {
      const ghatMatch = allMeasurements.find((m) =>
        queryLower.includes(m.site.toLowerCase().split(' ')[0])
      );
      const targetGhat = ghatMatch?.site || 'Khatlapura Ghat';

      const doMeasurements = allMeasurements.filter(
        (m) => m.parameter.toLowerCase() === 'dissolved oxygen' &&
               m.site === targetGhat &&
               m.numericValue !== null
      );

      if (doMeasurements.length > 0) {
        const values = doMeasurements.map((m) => m.numericValue!);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const belowThreshold = values.filter((v) => v < 5.0).length;

        doMeasurements.slice(0, 4).forEach((m) => {
          sources.push({
            ghat: m.site,
            parameter: 'Dissolved Oxygen',
            year: m.year || 2024,
            value: `${m.numericValue!.toFixed(2)} mg/l`
          });
        });

        return {
          content: language === 'hi'
            ? `${targetGhat} पर घुलित ऑक्सीजन का विश्लेषण:\n\n- औसत: ${avg.toFixed(2)} mg/l\n- न्यूनतम: ${min.toFixed(2)} mg/l\n- अधिकतम: ${max.toFixed(2)} mg/l\n- 5.0 mg/l से नीचे रीडिंग: ${belowThreshold}/${values.length}\n\nCPCB Class B मानक के अनुसार DO न्यूनतम 5.0 mg/l होना चाहिए।`
            : `Dissolved Oxygen analysis at ${targetGhat}:\n\n- Average: ${avg.toFixed(2)} mg/l\n- Minimum: ${min.toFixed(2)} mg/l\n- Maximum: ${max.toFixed(2)} mg/l\n- Readings below 5.0 mg/l: ${belowThreshold}/${values.length}\n\nCPCB Class B standard requires DO to be at least 5.0 mg/l.`,
          sources,
        };
      }
    }

    if (queryLower.includes('ph') && (queryLower.includes('range') || queryLower.includes('रेंज'))) {
      const ghatMatch = allMeasurements.find((m) =>
        queryLower.includes(m.site.toLowerCase().split(' ')[0])
      );
      const targetGhat = ghatMatch?.site || 'Prempura Ghat';

      const phMeasurements = allMeasurements.filter(
        (m) => m.parameter.toLowerCase() === 'ph' &&
               m.site === targetGhat &&
               m.numericValue !== null
      );

      if (phMeasurements.length > 0) {
        const values = phMeasurements.map((m) => m.numericValue!);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const outOfRange = values.filter((v) => v < 6.5 || v > 8.5).length;

        phMeasurements.slice(0, 3).forEach((m) => {
          sources.push({
            ghat: m.site,
            parameter: 'pH',
            year: m.year || 2024,
            value: m.numericValue!.toFixed(2)
          });
        });

        return {
          content: language === 'hi'
            ? `${targetGhat} पर pH रेंज:\n\n- न्यूनतम: ${min.toFixed(2)}\n- अधिकतम: ${max.toFixed(2)}\n- सीमा से बाहर रीडिंग: ${outOfRange}/${values.length}\n\nCPCB Class B मानक के अनुसार pH 6.5-8.5 के बीच होना चाहिए।`
            : `pH range at ${targetGhat}:\n\n- Minimum: ${min.toFixed(2)}\n- Maximum: ${max.toFixed(2)}\n- Out of range readings: ${outOfRange}/${values.length}\n\nCPCB Class B standard requires pH between 6.5 and 8.5.`,
          sources,
        };
      }
    }

    if (queryLower.includes('compare') || queryLower.includes('तुलना')) {
      const yearMatch = queryLower.match(/20\d{2}/);
      const targetYear = yearMatch ? parseInt(yearMatch[0]) : 2024;

      if (rankings.length > 0) {
        const comparison = rankings.slice(0, 5).map((r: GhatPriority) => ({
          name: r.site,
          priority: r.priority,
          score: r.scoringBreakdown.totalScore,
        }));

        comparison.forEach((c) => {
          sources.push({
            ghat: c.name,
            parameter: 'Priority Score',
            year: targetYear,
            value: `${c.score.toFixed(1)} (${c.priority})`
          });
        });

        const summaryEn = comparison.map((c, i) => `${i + 1}. ${c.name}: ${c.priority} priority (score: ${c.score.toFixed(1)})`).join('\n');
        const summaryHi = comparison.map((c, i) => `${i + 1}. ${c.name}: ${c.priority} प्राथमिकता (स्कोर: ${c.score.toFixed(1)})`).join('\n');

        return {
          content: language === 'hi'
            ? `${targetYear} में घाटों की जल गुणवत्ता तुलना (प्राथमिकता रैंकिंग):\n\n${summaryHi}\n\nये रैंकिंग BOD, DO, और pH के CPCB Class B मानकों से विचलन पर आधारित है।`
            : `Water quality comparison across ghats in ${targetYear} (priority ranking):\n\n${summaryEn}\n\nThese rankings are based on deviation from CPCB Class B standards for BOD, DO, and pH.`,
          sources,
        };
      }
    }

    if (queryLower.includes('exceed') || queryLower.includes('limit') || queryLower.includes('cpcb') || queryLower.includes('सीमा')) {
      const benchmarkedParams = ['Dissolved oxygen', 'BOD', 'pH'];
      const exceedances: { param: string; count: number; total: number }[] = [];

      benchmarkedParams.forEach((param) => {
        const paramMeasurements = allMeasurements.filter(
          (m) => m.parameter.toLowerCase() === param.toLowerCase() && m.numericValue !== null
        );

        let exceedCount = 0;
        paramMeasurements.forEach((m) => {
          const val = m.numericValue!;
          if (param.toLowerCase() === 'dissolved oxygen' && val < 5.0) exceedCount++;
          if (param.toLowerCase() === 'bod' && val > 3.0) exceedCount++;
          if (param.toLowerCase() === 'ph' && (val < 6.5 || val > 8.5)) exceedCount++;
        });

        exceedances.push({ param, count: exceedCount, total: paramMeasurements.length });
        sources.push({
          ghat: 'All Ghats',
          parameter: param,
          year: 2024,
          value: `${exceedCount}/${paramMeasurements.length} exceedances`
        });
      });

      exceedances.sort((a, b) => (b.count / b.total) - (a.count / a.total));

      const summaryEn = exceedances.map((e) =>
        `- ${e.param}: ${e.count}/${e.total} readings (${((e.count / e.total) * 100).toFixed(1)}% exceedance rate)`
      ).join('\n');
      const summaryHi = exceedances.map((e) =>
        `- ${e.param}: ${e.count}/${e.total} रीडिंग (${((e.count / e.total) * 100).toFixed(1)}% उल्लंघन दर)`
      ).join('\n');

      return {
        content: language === 'hi'
          ? `CPCB Class B सीमा उल्लंघन विश्लेषण:\n\n${summaryHi}\n\nमानक:\n- DO: न्यूनतम 5.0 mg/l\n- BOD: अधिकतम 3.0 mg/l\n- pH: 6.5-8.5 रेंज`
          : `CPCB Class B limit exceedance analysis:\n\n${summaryEn}\n\nStandards:\n- DO: minimum 5.0 mg/l\n- BOD: maximum 3.0 mg/l\n- pH: 6.5-8.5 range`,
        sources,
      };
    }

    const totalReadings = allMeasurements.length;
    const ghatCount = new Set(allMeasurements.map((m) => m.site)).size;

    return {
      content: language === 'hi'
        ? `मुझे आपके प्रश्न का सटीक उत्तर नहीं मिला। मेरे पास ${ghatCount} घाटों से ${totalReadings} जल गुणवत्ता रीडिंग का डेटा है (2023-2025)।\n\nआप पूछ सकते हैं:\n- किसी घाट पर BOD/DO/pH स्तर\n- घाटों की तुलना\n- CPCB सीमा उल्लंघन\n- पैरामीटर रुझान`
        : `I couldn't find a specific answer to your question. I have access to ${totalReadings} water quality readings from ${ghatCount} ghats (2023-2025).\n\nYou can ask about:\n- BOD/DO/pH levels at specific ghats\n- Comparison across ghats\n- CPCB limit exceedances\n- Parameter trends`,
      sources: [],
    };
  };

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
      const response = await generateResponse(query);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(language === 'hi' ? 'प्रतिक्रिया उत्पन्न करने में त्रुटि हुई।' : 'Failed to generate response.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
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
                ? 'ऐतिहासिक जल गुणवत्ता डेटा (2023-2025) के बारे में प्रश्न पूछें'
                : 'Ask questions about historical water quality data (2023-2025)'}
            </p>
          </div>
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
                ? 'मैं भोपाल के विसर्जन घाटों के MPPCB निगरानी डेटा (2023-2025) के बारे में प्रश्नों का उत्तर दे सकता हूं।'
                : 'I can answer questions about MPPCB monitoring data (2023-2025) from Bhopal\'s visarjan ghats.'}
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
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {language === 'hi' ? 'स्रोत डेटा:' : 'Source Data:'}
                  </p>
                  <div className="space-y-1">
                    {msg.sources.map((src, idx) => (
                      <div key={idx} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                        {src.ghat} - {src.parameter} ({src.year}): {src.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
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
            placeholder={language === 'hi' ? 'जल गुणवत्ता के बारे में प्रश्न पूछें...' : 'Ask about water quality...'}
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
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          {language === 'hi'
            ? 'सभी उत्तर ऐतिहासिक MPPCB रिपोर्ट (2023-2025) पर आधारित हैं। वर्तमान जल गुणवत्ता का प्रतिनिधित्व नहीं करते।'
            : 'All responses are based on historical MPPCB reports (2023-2025). Does not represent current water quality.'}
        </p>
      </div>
    </div>
  );
};
