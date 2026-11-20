import React, { useState, useEffect } from 'react';
import {
  Car,
  FileText,
  Layers,
  Cpu,
  ArrowUpRight,
  Upload,
  Plus,
  MessageSquare,
  GitCompare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { DocumentUploadModal } from '../admin/DocumentUploadModal';
import { ChunkViewerModal } from '../admin/ChunkViewerModal';
import { VehicleModal } from '../catalog/VehicleModal';

export function DashboardView({ onNavigate, onChatWithVehicle }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForChunks, setSelectedDocForChunks] = useState(null);
  const [selectedVehicleForSpecs, setSelectedVehicleForSpecs] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [vRes, dRes, hRes] = await Promise.all([
        api.getVehicles(),
        api.getDocuments(),
        api.getHealth(),
      ]);
      setVehicles(vRes.data || []);
      setDocuments(dRes.data || []);
      setHealth(hRes.data || {});
    } catch (err) {
      toast.error('Failed to load dashboard operational metrics');
    } finally {
      setLoading(false);
    }
  };

  const totalPagesIndexed = documents.reduce((acc, d) => acc + (d.total_pages || 0), 0);
  const processedDocsCount = documents.filter(
    (d) => d.status === 'indexed' || d.status === 'completed'
  ).length;

  const aiOnline =
    health?.groq?.status === 'connected' ||
    health?.llm?.status === 'connected' ||
    health?.ollama?.status === 'connected';
  const aiModel = health?.groq?.model || health?.llm?.model || 'llama-3.3-70b-versatile';

  // Associate vehicle names for documents
  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return 'General Automotive Manual';
    const match = vehicles.find((v) => String(v.id) === String(vehicleId));
    return match ? `${match.year} ${match.make} ${match.model}` : 'Associated Vehicle';
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

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50">
      {/* Dashboard Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Automotive Operations Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational overview of vehicle inventory, brochure ingestion status, and AI indexing telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Brochure</span>
          </button>
        </div>
      </div>

      {/* Compact KPI Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Vehicles</span>
            <Car className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {vehicles.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Catalog Models</span>
            <span className="font-mono text-slate-700">
              {vehicles.reduce((acc, v) => acc + (v.variants?.length || 0), 0)} Trims
            </span>
          </div>
        </div>

        {/* Uploaded Brochures */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Uploaded Brochures</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {documents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>OEM PDF Manuals</span>
            <span className="font-mono text-slate-700">PyMuPDF Ingestion</span>
          </div>
        </div>

        {/* Processed & Indexed Documents */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Processed Documents</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {processedDocsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Indexed Chunks</span>
            <span className="font-mono text-emerald-700 font-medium">
              {totalPagesIndexed} Pages Verified
            </span>
          </div>
        </div>

        {/* AI & Vector Index Status */}
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Vector Pipeline</span>
            <Cpu className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${aiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-base font-bold text-slate-900 font-mono">
              {aiOnline ? 'Groq LPU (Cloud)' : 'Setup Key'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 truncate">
            Groq <span className="font-mono text-slate-700">{aiModel}</span> • 384d
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
          <span>Quick Actions:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload PDF Brochure</span>
          </button>

          <button
            onClick={() => onNavigate('chat')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
            <span>Ask AI Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('comparison')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-600" />
            <span>Compare Vehicles</span>
          </button>

          <button
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-slate-600" />
            <span>Vehicle Explorer</span>
          </button>
        </div>
      </div>

      {/* Structured Enterprise Tables: Recent Activity & Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Recent Document Activity */}
        <div className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Document Activity
              </h3>
              <p className="text-xs text-slate-500">
                Latest PDF brochures processed into vector store
              </p>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No documents uploaded yet. Click "Upload Brochure" to start.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Document</th>
                    <th className="py-2.5 px-4">Associated Vehicle</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[180px]" title={doc.filename}>
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">
                        {getVehicleName(doc.vehicle_id)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDocForChunks(doc)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Inspect Chunks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Table 2: Recently Added Vehicles */}
        <div className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Vehicle Catalog Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Registered models with structured engineering specifications
              </p>
            </div>
            <button
              onClick={() => onNavigate('catalog')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <span>View Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {vehicles.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No vehicles registered in catalog.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Vehicle Model</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Price Range (INR)</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {vehicles.slice(0, 5).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Car className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>
                            {v.make} {v.model} ({v.year})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {v.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {v.price_range || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedVehicleForSpecs(v)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded"
                        >
                          Specs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        vehicles={vehicles}
        onUploadSuccess={loadDashboardData}
      />

      {/* Chunk Viewer Modal */}
      <ChunkViewerModal
        doc={selectedDocForChunks}
        isOpen={!!selectedDocForChunks}
        onClose={() => setSelectedDocForChunks(null)}
      />

      {/* Vehicle Specs Modal */}
      <VehicleModal
        vehicle={selectedVehicleForSpecs}
        isOpen={!!selectedVehicleForSpecs}
        onClose={() => setSelectedVehicleForSpecs(null)}
        onChat={(vId) => {
          setSelectedVehicleForSpecs(null);
          onChatWithVehicle(vId);
        }}
      />
    </div>
  );
}
