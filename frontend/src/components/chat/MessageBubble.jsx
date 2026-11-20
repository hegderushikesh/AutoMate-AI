import React from 'react';
import { Bot, User, BookOpen, ExternalLink, RotateCcw } from 'lucide-react';

export function MessageBubble({ message, onOpenCitation, onRetry }) {
  const isAssistant = message.role === 'assistant';
  const textContent =
    message.answer ||
    message.content ||
    message.response ||
    (isAssistant ? 'Not found in the brochure.' : '');
  const sources = message.sources || message.citations || [];

  return (
    <div
      className={`flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg transition-colors ${
        isAssistant
          ? message.isError
            ? 'bg-red-50/60 border border-red-200 shadow-xs'
            : 'bg-white border border-slate-200 shadow-xs'
          : 'bg-slate-900 text-white shadow-xs ml-8 sm:ml-16'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isAssistant ? (
          <div
            className={`flex items-center justify-center w-7 h-7 rounded border ${
              message.isError
                ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}
          >
            <Bot className="w-4 h-4" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-7 h-7 rounded bg-slate-800 text-slate-300">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold ${
              isAssistant
                ? message.isError
                  ? 'text-red-700'
                  : 'text-slate-900'
                : 'text-slate-200'
            }`}
          >
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
        <div
          className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans ${
            isAssistant
              ? message.isError
                ? 'text-red-800'
                : 'text-slate-800'
              : 'text-slate-100'
          }`}
        >
          {textContent}
        </div>

        {/* Retry Button on Failure */}
        {message.isError && onRetry && (
          <div className="pt-1">
            <button
              onClick={() => onRetry(message.failedQuery)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Question</span>
            </button>
          </div>
        )}

        {/* Grounded Citation Badges */}
        {sources && sources.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Grounded Source Citations:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onOpenCitation && onOpenCitation(c)}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors shadow-xs"
                  title="Click to view verified brochure passage"
                >
                  <span className="font-bold text-blue-600">P.{c.page_number}</span>
                  <span className="truncate max-w-[160px] text-slate-600">
                    {c.document_name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
