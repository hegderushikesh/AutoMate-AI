import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  Car,
  History,
  RotateCcw,
  Loader2,
  ChevronDown,
  Info,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { MessageBubble } from './MessageBubble';
import { CitationModal } from './CitationModal';
import { useToast } from '../../context/ToastContext';

export function ChatView({ activeVehicleId, onSelectVehicle }) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(activeVehicleId || '');
  const [activeCitation, setActiveCitation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);

  const messagesEndRef = useRef(null);

  // Load vehicles and past sessions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          api.getVehicles(),
          api.getChatSessions(),
        ]);
        setVehicles(vRes.data || []);
        setSessions(sRes.data || []);
      } catch (err) {
        console.error('Failed to load initial chat data:', err);
      }
    };
    fetchData();
  }, []);

  // Update selected vehicle if prop changes
  useEffect(() => {
    if (activeVehicleId) {
      setSelectedVehicle(activeVehicleId);
    }
  }, [activeVehicleId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestedPrompts = [
    {
      text: 'What are the variant prices in Indian Rupees (₹ INR) and specifications for the BMW 3 Series?',
      vehicle: '22222222-2222-2222-2222-222222222222',
    },
    {
      text: 'What is the charging voltage architecture and maximum DC fast charging rate of the Taycan?',
      vehicle: '11111111-1111-1111-1111-111111111111',
    },
    {
      text: 'Compare the horsepower, torque, and price across all Taycan trims in Lakhs/Crores.',
      vehicle: '11111111-1111-1111-1111-111111111111',
    },
    {
      text: 'What is the maximum towing capacity and battery capacity of the Ford F-150 Lightning?',
      vehicle: '44444444-4444-4444-4444-444444444444',
    },
  ];

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    setInputQuery('');

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const payload = {
        message: query,
        session_id: sessionId,
        vehicle_id: selectedVehicle || null,
      };

      const res = await api.sendMessage(payload);
      const data = res.data;

      // Update session ID if newly created
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Add assistant response to UI - strictly non-empty
      const rawAnswer = data.answer || data.content || data.response;
      const answerText = rawAnswer && rawAnswer.trim() ? rawAnswer.trim() : 'Not found in the brochure.';
      const sourcesList = data.sources || data.citations || [];

      const botMsg = {
        role: 'assistant',
        content: answerText,
        answer: answerText,
        citations: sourcesList,
        sources: sourcesList,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      toast.error(`Inference Error: ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error communicating with AI service: ${err.message}.`,
          answer: `⚠️ Error communicating with AI service: ${err.message}.`,
          isError: true,
          failedQuery: query,
          citations: [],
          sources: [],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setSessionId(null);
    setMessages([]);
    toast.info('Started new conversation session');
  };

  const loadPastSession = async (sId) => {
    try {
      setLoading(true);
      setSessionId(sId);
      setShowSessionsDrawer(false);
      const res = await api.getSessionMessages(sId);
      setMessages(res.data || []);
      toast.info('Loaded past conversation history');
    } catch (err) {
      toast.error('Could not load session messages');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 relative">
      {/* Top Filter & Context Bar */}
      <div className="px-4 sm:px-8 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" /> Focus Vehicle:
          </label>
          <div className="relative">
            <select
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                if (onSelectVehicle) onSelectVehicle(e.target.value);
              }}
              className="appearance-none bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-medium rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="">All Vehicles & Catalog</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.category})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedVehicleObj && (
            <span className="hidden md:inline-flex items-center text-[11px] font-mono text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
              {selectedVehicleObj.price_range}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 transition-colors shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">History</span>
            {sessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
                {sessions.length}
              </span>
            )}
          </button>

          <button
            onClick={startNewSession}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 bg-white transition-colors shadow-xs"
            title="Clear and start new session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty State & Prompt Suggestions */
          <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-6 my-auto py-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Bot className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Automotive AI Engineering Assistant
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Ask precise engineering, specification, charging, and pricing questions. Answers are strictly grounded in verified OEM brochures with page citations.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="w-full space-y-2 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block px-0.5">
                Suggested Technical Inquiries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (p.vehicle) setSelectedVehicle(p.vehicle);
                      handleSendMessage(p.text);
                    }}
                    className="p-3 rounded-lg text-left text-xs bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors shadow-xs space-y-1"
                  >
                    <p className="font-medium text-slate-800 leading-snug">{p.text}</p>
                    <span className="text-[10px] text-blue-600 font-semibold block">
                      Click to ask →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                onOpenCitation={(c) => setActiveCitation(c)}
                onRetry={(failedQ) => handleSendMessage(failedQ)}
              />
            ))}

            {loading && (
              <div className="flex gap-3 sm:gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Thinking... analyzing OEM brochure data</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded w-3/4 animate-pulse" />
                  <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 p-2 rounded-lg bg-slate-50 border border-slate-300 focus-within:border-blue-600 focus-within:bg-white transition-colors"
          >
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                selectedVehicleObj
                  ? `Ask technical question about ${selectedVehicleObj.make} ${selectedVehicleObj.model} (Enter to send, Shift+Enter for newline)...`
                  : 'Ask about vehicle specifications, charging architecture, performance, or trim deltas...'
              }
              rows={2}
              className="flex-1 bg-transparent border-0 px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
            />

            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            AutoMate AI answers are strictly grounded in verified OEM brochures and structured specs.
          </p>
        </div>
      </div>

      {/* History Slide-Over Drawer */}
      {showSessionsDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-xl z-30 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" /> Past Conversations
            </h4>
            <button
              onClick={() => setShowSessionsDrawer(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-1.5">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous conversations</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadPastSession(s.id)}
                  className={`w-full p-2.5 rounded-md text-left text-xs transition-colors border ${
                    sessionId === s.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <p className="truncate font-medium">{s.title || 'Automotive Inquiry'}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Citation Details Modal */}
      <CitationModal
        citation={activeCitation}
        isOpen={!!activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
