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
      title={`Brochure Chunks: ${doc?.filename || 'Document'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search extracted chunk content..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-950 border border-navy-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-accent-cyan"
            />
          </div>
          <span className="text-xs font-mono text-accent-cyan shrink-0">
            {filteredChunks.length} of {chunks.length} Chunks
          </span>
        </div>

        {/* Chunks List */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
          </div>
        ) : filteredChunks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No chunks found</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredChunks.map((chunk, idx) => (
              <div
                key={chunk.id || idx}
                className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 hover:border-navy-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="cyan">Page {chunk.page_number}</Badge>
                    <span className="text-[10px] font-mono text-slate-400">
                      Chunk #{chunk.chunk_index}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {chunk.content?.length} characters
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
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
