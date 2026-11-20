import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function DocumentUploadModal({ isOpen, onClose, vehicles, onUploadSuccess }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Uploading PDF to server',
    'PyMuPDF extracting text & page structure',
    'Generating semantic chunks with overlap',
    'Ollama generating 384d all-minilm vector embeddings',
    'Persisting chunks to Supabase pgvector store',
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      toast.warning('Please select a valid PDF file (.pdf)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.warning('Please select a PDF brochure to upload');
      return;
    }

    setUploading(true);
    setCurrentStep(1);

    const formData = new FormData();
    formData.append('file', file);
    if (vehicleId) {
      formData.append('vehicle_id', vehicleId);
    }

    // Step simulator for UI feedback while backend processes
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 2500);

    try {
      const res = await api.uploadDocument(formData);
      clearInterval(stepInterval);
      setCurrentStep(5);
      toast.success(`Brochure "${file.name}" indexed successfully (${res.data.total_pages} pages)!`);
      if (onUploadSuccess) onUploadSuccess();
      setTimeout(() => {
        onClose();
        setFile(null);
        setCurrentStep(0);
        setUploading(false);
      }, 1200);
    } catch (err) {
      clearInterval(stepInterval);
      toast.error(err.message || 'Failed to upload and index document');
      setUploading(false);
      setCurrentStep(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload & Index OEM Brochure">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Assignment */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Link to Vehicle Profile (Optional):
          </label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={uploading}
            className="w-full bg-navy-950 border border-navy-700 text-sm text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent-cyan"
          >
            <option value="">General Catalog Brochure</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.year})
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Zone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select PDF File:
          </label>
          <div className="relative border-2 border-dashed border-navy-700 hover:border-accent-cyan/60 rounded-2xl p-6 text-center transition-colors bg-navy-950/40">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-navy-900 border border-navy-700 flex items-center justify-center text-accent-cyan">
                {file ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-white">{file.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Click to browse or drop an OEM PDF brochure
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF documents only</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Ingestion Progress Stepper */}
        {uploading && (
          <div className="p-4 rounded-xl bg-navy-950 border border-navy-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-accent-cyan uppercase tracking-wider">
              <Loader2 className="w-4 h-4 animate-spin" /> Ingestion Pipeline Active
            </div>
            <div className="space-y-2">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {currentStep > idx ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : currentStep === idx + 1 ? (
                    <Loader2 className="w-4 h-4 text-accent-cyan animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-navy-700 shrink-0" />
                  )}
                  <span
                    className={
                      currentStep > idx
                        ? 'text-slate-300 font-medium'
                        : currentStep === idx + 1
                        ? 'text-accent-cyan font-semibold'
                        : 'text-slate-400'
                    }
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-navy-950 border border-navy-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent-cyan text-navy-950 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {uploading ? 'Processing Brochure...' : 'Start Ingestion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
