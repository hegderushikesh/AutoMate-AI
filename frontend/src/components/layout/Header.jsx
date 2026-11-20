import React from 'react';
import { Menu, Plus, Sparkles, BookOpen } from 'lucide-react';

export function Header({ currentTab, onOpenMobile, onNewChat, onOpenUpload }) {
  const titles = {
    chat: {
      title: 'Automotive AI Assistant',
      subtitle: 'Ask questions grounded in OEM PDF brochures and structured vehicle specifications.',
    },
    catalog: {
      title: 'Vehicle Catalog & Specifications',
      subtitle: 'Explore full engineering profiles, powertrain options, and trim configurations.',
    },
    comparison: {
      title: 'Comparison Studio',
      subtitle: 'Multi-vehicle technical evaluation, performance deltas, and radar metrics.',
    },
    variants: {
      title: 'Variant & Trim Analyzer',
      subtitle: 'Compare specific trim packages and evaluate upgrades.',
    },
    admin: {
      title: 'Admin Document Management',
      subtitle: 'Upload PDF brochures, inspect PyMuPDF text chunks, and monitor pgvector indexing.',
    },
  };

  const current = titles[currentTab] || titles.chat;

  return (
    <header className="sticky top-0 z-30 h-20 bg-navy-950/80 backdrop-blur-md border-b border-navy-800/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl bg-navy-900 border border-navy-700 text-slate-300 hover:text-white lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xl">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {currentTab === 'chat' && (
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-700/80 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-accent-cyan" />
            <span>New Chat</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.15)]"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Brochure</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
}
