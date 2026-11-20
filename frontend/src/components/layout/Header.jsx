import React from 'react';
import { Menu, Plus, Upload, BookOpen } from 'lucide-react';

export function Header({ currentTab, onOpenMobile, onNewChat, onOpenUpload }) {
  const titles = {
    dashboard: {
      title: 'Automotive Operations Dashboard',
      subtitle: 'Real-time overview of vehicle catalog, brochure ingestion, and AI indexing metrics.',
    },
    documents: {
      title: 'Document & Brochure Management',
      subtitle: 'Upload and manage OEM PDF brochures, PyMuPDF extraction, and vector index.',
    },
    chat: {
      title: 'Automotive AI Assistant',
      subtitle: 'Technical answers strictly grounded in OEM PDF brochures with verified citations.',
    },
    catalog: {
      title: 'Vehicle Catalog & Specifications',
      subtitle: 'Structured engineering profiles, powertrain options, and trim configurations.',
    },
    comparison: {
      title: 'Comparison Studio',
      subtitle: 'Side-by-side engineering evaluation, performance deltas, and radar metrics.',
    },
    variants: {
      title: 'Variant & Package Analyzer',
      subtitle: 'Detailed trim package differentials, dimensions, and feature upgrades.',
    },
  };

  const current = titles[currentTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-md bg-white border border-slate-300 text-slate-600 hover:text-slate-900 lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {current.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate max-w-xl">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {currentTab === 'chat' && (
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>New Chat</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Brochure</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>
    </header>
  );
}
