import React, { useState, useEffect } from 'react';
import { Modal, Badge } from '../ui/Modal';
import { Layers, FileText, Search, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export function ChunkViewerModal({ doc, isOpen, onClose }) {
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (doc?.id && isOpen) {
      loadChunks(doc.id);
    }
  }, [doc, isOpen]);

  const loadChunks = async (docId) => {
    try {
      setLoading(true);
      const res = await api.getDocumentChunks(docId);
      setChunks(res.data.chunks || []);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChunks = chunks.filter((c) =>
    c.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Brochure Semantic Chunks: ${doc?.filename || 'Document'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search extracted chunk content..."
              className="w-full pl-9 pr-4 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
          <span className="text-xs font-mono text-slate-600 font-medium shrink-0">
            {filteredChunks.length} of {chunks.length} Chunks Indexed
          </span>
        </div>

        {/* Chunks List */}
        {loading ? (
          <div className="py-12 flex flex-col justify-center items-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-xs text-slate-500">Loading chunk representations...</span>
          </div>
        ) : filteredChunks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-10">No chunks found matching search query.</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredChunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="p-3.5 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue">Page {chunk.page_number}</Badge>
                    <span className="text-[11px] font-mono text-slate-600 font-medium">
                      Chunk #{chunk.chunk_index}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {chunk.content?.length} characters
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border border-slate-200/80">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
