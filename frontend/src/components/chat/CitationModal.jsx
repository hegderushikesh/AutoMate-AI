import React from 'react';
import { Modal } from '../ui/Modal';
import { BookOpen, FileText, CheckCircle2 } from 'lucide-react';

export function CitationModal({ citation, isOpen, onClose }) {
  if (!citation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verified Source Citation">
      <div className="space-y-4">
        {/* Document metadata header */}
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-3">
          <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-600">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {citation.document_name}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span className="font-mono text-blue-700 font-semibold">
                Page {citation.page_number}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PyMuPDF Verified Excerpt
              </span>
            </div>
          </div>
        </div>

        {/* Excerpt Body */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Brochure Text Excerpt
          </label>
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {citation.excerpt}
          </div>
        </div>

        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800">
          Answers are strictly restricted to verified brochure excerpts to eliminate hallucinations and maintain OEM technical accuracy.
        </div>
      </div>
    </Modal>
  );
}
