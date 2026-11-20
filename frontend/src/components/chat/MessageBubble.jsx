import React from 'react';
import { Bot, User, BookOpen, ExternalLink } from 'lucide-react';

export function MessageBubble({ message, onOpenCitation }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all ${
        isAssistant
          ? 'bg-navy-900/90 border border-navy-700/60 shadow-lg'
          : 'bg-navy-800/40 border border-navy-700/30 ml-8 sm:ml-16'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isAssistant ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Bot className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-navy-700 text-slate-300 border border-navy-600">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            {isAssistant ? 'AutoMate AI' : 'You'}
          </span>
          {message.created_at && (
            <span className="text-[10px] text-slate-400">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Text Body */}
        <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Grounded Citation Badges */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-2 border-t border-navy-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-cyan mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Grounded Source Citations:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onOpenCitation(c)}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-navy-950/80 hover:bg-navy-850 text-slate-300 hover:text-accent-cyan border border-navy-700 hover:border-accent-cyan/40 transition-all shadow-sm"
                  title="Click to view verified brochure passage"
                >
                  <span className="text-accent-cyan font-bold">P.{c.page_number}</span>
                  <span className="truncate max-w-[160px] text-slate-400 group-hover:text-slate-200">
                    {c.document_name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-accent-cyan" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
