import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Car,
  ChevronDown,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge, Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { DocumentUploadModal } from '../admin/DocumentUploadModal';
import { ChunkViewerModal } from '../admin/ChunkViewerModal';

export function DocumentManagementView() {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setDocuments(dRes.data || []);
      setVehicles(vRes.data || []);
    } catch (err) {
      toast.error('Failed to load document management repository');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return 'General Automotive Manual';
    const match = vehicles.find((v) => String(v.id) === String(vehicleId));
    return match ? `${match.year} ${match.make} ${match.model}` : 'Associated Vehicle';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'indexed':
      case 'completed':
        return (
          <Badge variant="emerald" className="gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="blue" className="gap-1 font-medium">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" /> Processing
          </Badge>
        );
      case 'uploaded':
        return (
          <Badge variant="default" className="gap-1 font-medium">
            <Clock className="w-3 h-3 text-slate-500" /> Uploaded
          </Badge>
        );
      default:
        return (
          <Badge variant="rose" className="gap-1 font-medium">
            <AlertCircle className="w-3 h-3 text-red-600" /> Failed
          </Badge>
        );
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteDocument(docToDelete.id);
      toast.success(`Deleted brochure "${docToDelete.filename}"`);
      setDocToDelete(null);
      await loadData();
    } catch (err) {
      toast.error(`Failed to delete document: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        doc.filename?.toLowerCase().includes(query) ||
        getVehicleName(doc.vehicle_id).toLowerCase().includes(query);

      // Vehicle matching
      const matchesVehicle =
        selectedVehicleFilter === 'ALL' ||
        String(doc.vehicle_id) === String(selectedVehicleFilter);

      // Status matching
      let matchesStatus = true;
      if (selectedStatusFilter === 'completed') {
        matchesStatus = doc.status === 'indexed' || doc.status === 'completed';
      } else if (selectedStatusFilter !== 'ALL') {
        matchesStatus = doc.status?.toLowerCase() === selectedStatusFilter.toLowerCase();
      }

      return matchesSearch && matchesVehicle && matchesStatus;
    });
  }, [documents, searchQuery, selectedVehicleFilter, selectedStatusFilter, vehicles]);

  const hasActiveFilters =
    searchQuery || selectedVehicleFilter !== 'ALL' || selectedStatusFilter !== 'ALL';

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Document & Brochure Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage OEM vehicle brochures, monitor PyMuPDF extraction, and inspect pgvector semantic index.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF Brochure</span>
          </button>
        </div>
      </div>

      {/* Search & Filtering Bar */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by filename or vehicle..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vehicle Filter */}
          <div className="w-full sm:w-60">
            <select
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Associated Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="uploaded">Uploaded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Status Count & Clear Action */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredDocuments.length}</strong> of{' '}
            <strong className="text-slate-800">{documents.length}</strong> total documents
          </span>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedVehicleFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Structured Document Management Data Table */}
      <div className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col justify-center items-center gap-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <span className="text-xs text-slate-500">Loading document repository...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
            <h3 className="text-sm font-semibold text-slate-800">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No documents match the current filter criteria. Try resetting your search filters.'
                : 'Upload an automotive OEM PDF brochure to begin indexing vehicle specifications.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedVehicleFilter('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 inline-block"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First Brochure</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Associated Vehicle</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Processing Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Document Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate max-w-xs" title={doc.filename}>
                          {doc.filename}
                        </span>
                      </div>
                    </td>

                    {/* Associated Vehicle */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {getVehicleName(doc.vehicle_id)}
                        </span>
                      </div>
                    </td>

                    {/* Upload Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </td>

                    {/* File Size */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>

                    {/* Pages */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {doc.total_pages ? `${doc.total_pages} Pages` : '—'}
                    </td>

                    {/* Processing Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDocForChunks(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                          title="Inspect Chunks"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="inline-flex items-center p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="Delete PDF Brochure"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <strong className="text-slate-900">{docToDelete?.filename}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            This action will permanently delete the brochure and purge all its extracted vector chunks and embeddings from the pgvector database.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setDocToDelete(null)}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteDocument}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

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
