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
    'Uploading PDF brochure to server',
    'PyMuPDF extracting text & page structure',
    'Generating semantic chunks with overlap',
    'Ollama generating 384d all-minilm vector embeddings',
    'Persisting chunks to pgvector database',
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
      }, 1000);
    } catch (err) {
      clearInterval(stepInterval);
      toast.error(err.message || 'Failed to upload and index document');
      setUploading(false);
      setCurrentStep(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload & Index OEM Brochure" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle Assignment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Associated Vehicle Profile (Optional)
          </label>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            disabled={uploading}
            className="w-full bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 rounded-md px-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white"
          >
            <option value="">General Automotive Catalog Brochure</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        {/* Drag & Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select PDF Document
          </label>
          <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-6 text-center transition-colors bg-slate-50/60">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                {file ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              {file ? (
                <div>
                  <p className="text-xs font-bold text-slate-900">{file.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Click to browse or drag and drop an OEM brochure
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF documents up to 50MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Ingestion Progress Stepper */}
        {uploading && (
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Ingestion Pipeline Active</span>
            </div>
            <div className="space-y-1.5">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {currentStep > idx ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : currentStep === idx + 1 ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span
                    className={
                      currentStep > idx
                        ? 'text-slate-600 font-medium'
                        : currentStep === idx + 1
                        ? 'text-blue-700 font-semibold'
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
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {uploading ? 'Processing Brochure...' : 'Start Ingestion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
