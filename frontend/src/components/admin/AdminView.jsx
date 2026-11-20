import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Layers,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { DocumentUploadModal } from './DocumentUploadModal';
import { ChunkViewerModal } from './ChunkViewerModal';
import { Badge } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

export function AdminView() {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, vRes] = await Promise.all([
        api.getDocuments(),
        api.getVehicles(),
      ]);
      setDocuments(dRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      toast.error('Failed to load document administration data');
    } finally {
      setLoading(false);
    }
  };

  const totalPagesIndexed = documents.reduce((acc, d) => acc + (d.total_pages || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Brochures</span>
            <FileText className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{documents.length}</div>
          <span className="text-[11px] text-slate-400">OEM technical manuals</span>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Indexed Pages</span>
            <Layers className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalPagesIndexed}</div>
          <span className="text-[11px] text-slate-400">PyMuPDF verified pages</span>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Embedding Model</span>
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">all-minilm</div>
          <span className="text-[11px] text-slate-400">384-dim dense vectors</span>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vector Store</span>
            <Database className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="text-xl font-bold font-mono text-white">pgvector</div>
          <span className="text-[11px] text-slate-400">HNSW Cosine index</span>
        </div>
      </div>

      {/* Documents Library Table Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Ingested PDF Brochures & Technical Documentation
            </h3>
            <p className="text-xs text-slate-400">
              Manage uploaded brochures and inspect vector chunks stored in pgvector.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-navy-900 border border-navy-800 hover:bg-navy-800 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-accent-cyan text-navy-950 hover:bg-sky-400 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Upload New Brochure
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="rounded-2xl bg-navy-900/80 border border-navy-800 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No Brochures Uploaded Yet</p>
              <p className="text-xs text-slate-400">
                Upload a sample OEM brochure to populate vector embeddings for RAG Q&A.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-navy-800 bg-navy-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Document Name</th>
                    <th className="py-3.5 px-6">File Size</th>
                    <th className="py-3.5 px-6">Pages</th>
                    <th className="py-3.5 px-6">Ingestion Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 text-xs">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-navy-850/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-accent-cyan shrink-0" />
                          <span className="truncate max-w-xs">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {(doc.file_size_bytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-300">
                        {doc.total_pages || '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        {doc.status === 'indexed' ? (
                          <Badge variant="emerald" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Indexed
                          </Badge>
                        ) : doc.status === 'processing' ? (
                          <Badge variant="cyan" className="gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </Badge>
                        ) : (
                          <Badge variant="rose" className="gap-1">
                            <AlertCircle className="w-3 h-3" /> Failed
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setSelectedDocForChunks(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-950 hover:bg-navy-800 text-slate-300 hover:text-white border border-navy-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent-cyan" />
                          <span>Inspect Chunks</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        vehicles={vehicles}
        onUploadSuccess={loadData}
      />

      {/* Chunk Viewer Modal */}
      <ChunkViewerModal
        doc={selectedDocForChunks}
        isOpen={!!selectedDocForChunks}
        onClose={() => setSelectedDocForChunks(null)}
      />
    </div>
  );
}
