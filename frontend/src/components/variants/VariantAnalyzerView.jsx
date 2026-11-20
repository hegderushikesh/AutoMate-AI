import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Car, Zap, Check, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { RadarMetricsChart } from '../comparison/RadarMetricsChart';
import { SpecTable } from '../comparison/SpecTable';
import { useToast } from '../../context/ToastContext';

export function VariantAnalyzerView() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVariantIds, setSelectedVariantIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await api.getVehicles();
      setVehicles(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedVehicleId(first.id);
        const vIds = (first.variants || []).map((v) => v.id);
        setSelectedVariantIds(vIds);
        fetchVariantComparison(vIds);
      }
    } catch (err) {
      toast.error('Failed to load vehicles');
    }
  };

  const handleVehicleChange = (vId) => {
    setSelectedVehicleId(vId);
    const vehicle = vehicles.find((v) => v.id === vId);
    if (vehicle) {
      const vIds = (vehicle.variants || []).map((v) => v.id);
      setSelectedVariantIds(vIds);
      fetchVariantComparison(vIds);
    }
  };

  const fetchVariantComparison = async (variantIds) => {
    if (!variantIds || variantIds.length === 0) return;
    try {
      setLoading(true);
      const res = await api.compareVariants(variantIds);
      setComparisonResult(res.data);
    } catch (err) {
      toast.error('Failed to analyze variants');
    } finally {
      setLoading(false);
    }
  };

  const toggleVariant = (id) => {
    let updated;
    if (selectedVariantIds.includes(id)) {
      if (selectedVariantIds.length <= 1) {
        toast.warning('Keep at least 1 trim selected');
        return;
      }
      updated = selectedVariantIds.filter((item) => item !== id);
    } else {
      updated = [...selectedVariantIds, id];
    }
    setSelectedVariantIds(updated);
    fetchVariantComparison(updated);
  };

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const availableVariants = activeVehicle?.variants || [];

  const formatPriceINR = (val) => {
    if (!val || val === 0) return '';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50">
      {/* Vehicle and Trim Selector Strip */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Select Vehicle to Analyze Trims:
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 font-medium text-sm rounded-md px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-xs"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.year}) - {v.category}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">
              Trims in Configuration
            </span>
            <span className="text-sm font-mono font-semibold text-blue-600">
              {selectedVariantIds.length} of {availableVariants.length} Active
            </span>
          </div>
        </div>

        {/* Trim Chips */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-2">
            Toggle Trim Packages:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {availableVariants.map((varItem) => {
              const isSelected = selectedVariantIds.includes(varItem.id);
              return (
                <button
                  key={varItem.id}
                  onClick={() => toggleVariant(varItem.id)}
                  className={`p-3 rounded-lg text-left border transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs font-semibold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300 bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="font-semibold text-xs block text-slate-900">{varItem.trim_name}</span>
                    <span className="text-[11px] font-mono font-medium text-emerald-700">
                      {formatPriceINR(varItem.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Analyzing trim package differentials...</p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-6">
          {/* Winner Takeaways */}
          {comparisonResult.winner_highlights && (
            <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200 flex flex-wrap gap-2">
              {comparisonResult.winner_highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-xs font-medium text-slate-700 bg-white px-3 py-1.5 rounded-md border border-blue-100 shadow-2xs"
                >
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Charts */}
          <RadarMetricsChart
            data={comparisonResult.radar_data}
            entities={comparisonResult.entities}
          />

          {/* Detailed Spec Comparison Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
              Trim-by-Trim Technical Delta Table
            </h4>
            <SpecTable
              entities={comparisonResult.entities}
              specs={comparisonResult.specs}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
