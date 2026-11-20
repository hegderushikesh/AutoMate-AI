import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  Car,
  History,
  RotateCcw,
  Loader2,
  ChevronDown,
  Info
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
        setVehicles(vRes.data);
        setSessions(sRes.data);
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
      text: 'What is the charging voltage architecture and maximum DC fast charging rate of the Taycan?',
      vehicle: '11111111-1111-1111-1111-111111111111',
    },
    {
      text: 'Compare the horsepower, torque, and 0-60 time across all Taycan trims.',
      vehicle: '11111111-1111-1111-1111-111111111111',
    },
    {
      text: 'What are the engine specs, fuel economy, and transmission of the BMW 330i xDrive vs M340i?',
      vehicle: '22222222-2222-2222-2222-222222222222',
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

      if (!sessionId && data.session_id) {
        setSessionId(data.session_id);
        // Refresh sessions list
        api.getChatSessions().then((r) => setSessions(r.data));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          citations: data.citations || [],
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      toast.error(err.message || 'Failed to generate RAG response');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Please verify local Ollama is active.`,
          citations: [],
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
    toast.info('Started a new conversation session');
  };

  const loadPastSession = async (sId) => {
    try {
      setLoading(true);
      const res = await api.getSessionMessages(sId);
      setSessionId(sId);
      setMessages(res.data.messages || []);
      setShowSessionsDrawer(false);
      toast.success('Loaded past conversation');
    } catch (err) {
      toast.error('Could not load session messages');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicle);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-5rem)] overflow-hidden bg-navy-950 relative">
      {/* Top Filter & Context Bar */}
      <div className="px-4 sm:px-8 py-3 bg-navy-950/60 border-b border-navy-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-accent-cyan" /> Focus Vehicle:
          </label>
          <div className="relative">
            <select
              value={selectedVehicle}
              onChange={(e) => {
                setSelectedVehicle(e.target.value);
                if (onSelectVehicle) onSelectVehicle(e.target.value);
              }}
              className="appearance-none bg-navy-900 border border-navy-700/80 hover:border-accent-cyan/50 text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-cyan transition-colors"
            >
              <option value="">All Vehicles & Catalog</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.year}) - {v.category}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {selectedVehicleObj && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-accent-cyan px-2 py-0.5 rounded-md bg-accent-cyan/10 border border-accent-cyan/20">
              {selectedVehicleObj.price_range}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessionsDrawer(!showSessionsDrawer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-navy-900 border border-navy-800 hover:border-navy-700 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">History</span>
            {sessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-navy-800 text-[10px] font-mono text-accent-cyan">
                {sessions.length}
              </span>
            )}
          </button>

          <button
            onClick={startNewSession}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-navy-900 border border-navy-800 hover:border-navy-700 transition-colors"
            title="Clear and start new session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State & Prompt Suggestions */
          <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-8 my-auto py-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-cyan/20 to-navy-800 border border-accent-cyan/30 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.25)]">
                <Bot className="w-8 h-8 text-accent-cyan" />
              </div>
              <Sparkles className="w-5 h-5 text-accent-emerald absolute -bottom-1 -right-1 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Ask AutoMate AI Anything
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Grounded in OEM engineering brochures using pgvector similarity search and Qwen3.
                Citations link directly to source brochure pages.
              </p>
            </div>

            {/* Suggested Question Chips */}
            <div className="w-full space-y-2.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Suggested Automotive Queries:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (p.vehicle) setSelectedVehicle(p.vehicle);
                      handleSendMessage(p.text);
                    }}
                    className="p-3 rounded-xl bg-navy-900/60 hover:bg-navy-900 border border-navy-800 hover:border-accent-cyan/40 text-left text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold text-accent-cyan uppercase">
                      <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                      Prompt
                    </div>
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Stream */
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                onOpenCitation={(citation) => setActiveCitation(citation)}
              />
            ))}

            {/* Thinking / Ingestion Indicator */}
            {loading && (
              <div className="flex gap-4 p-5 rounded-2xl bg-navy-900/90 border border-navy-700/60 shadow-lg animate-pulse max-w-4xl">
                <div className="w-8 h-8 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent-cyan">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Searching pgvector embeddings & generating grounded response...
                  </div>
                  <div className="h-3 bg-navy-800 rounded w-3/4" />
                  <div className="h-3 bg-navy-800 rounded w-1/2" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 sm:p-6 bg-navy-950/90 border-t border-navy-850 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 p-2 rounded-2xl bg-navy-900 border border-navy-700/80 focus-within:border-accent-cyan/60 focus-within:shadow-[0_0_20px_rgba(56,189,248,0.15)] transition-all"
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
                  ? `Ask about ${selectedVehicleObj.make} ${selectedVehicleObj.model} (Enter to send, Shift+Enter for new line)...`
                  : 'Ask about any vehicle specifications, charging, comparison, or trim packages...'
              }
              rows={2}
              className="flex-1 bg-transparent border-0 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none resize-none"
            />

            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-accent-cyan to-sky-500 hover:from-sky-400 hover:to-accent-cyan text-navy-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            AutoMate AI answers are strictly grounded in verified OEM brochures and structured specs.
          </p>
        </div>
      </div>

      {/* History Slide-Over Drawer */}
      {showSessionsDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-navy-900 border-l border-navy-800 shadow-2xl z-30 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-navy-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-accent-cyan" /> Past Conversations
            </h4>
            <button
              onClick={() => setShowSessionsDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No previous conversations</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadPastSession(s.id)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                    sessionId === s.id
                      ? 'bg-accent-cyan/15 border border-accent-cyan/40 text-white'
                      : 'bg-navy-950/60 hover:bg-navy-800 border border-navy-800 text-slate-300'
                  }`}
                >
                  <p className="truncate font-semibold">{s.title || 'Inquiry'}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
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
