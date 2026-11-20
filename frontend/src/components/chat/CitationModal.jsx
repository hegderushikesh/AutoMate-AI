import React from 'react';
import { Modal } from '../ui/Modal';
import { BookOpen, FileText, CheckCircle2 } from 'lucide-react';

export function CitationModal({ citation, isOpen, onClose }) {
  if (!citation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verified Source Citation">
      <div className="space-y-4">
        {/* Document metadata header */}
        <div className="p-4 rounded-xl bg-navy-950/70 border border-navy-800 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">
              {citation.document_name}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-mono text-accent-cyan font-semibold">
                Page {citation.page_number}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> PyMuPDF Verified Passages
              </span>
            </div>
          </div>
        </div>

        {/* Excerpt Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Brochure Text Excerpt
          </label>
          <div className="p-4 rounded-xl bg-navy-950/90 border border-navy-800/80 text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {citation.excerpt}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/30 text-xs text-sky-300">
          💡 AutoMate AI answers are restricted to verified brochure excerpts to eliminate
          hallucinations and ensure 100% engineering accuracy.
        </div>
      </div>
    </Modal>
  );
}
