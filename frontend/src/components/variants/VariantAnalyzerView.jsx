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

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Vehicle and Trim Selector Strip */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Select Vehicle to Analyze Trims:
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="bg-navy-950 border border-navy-700/80 text-white font-bold text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-accent-cyan"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.year}) - {v.category}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Trims in Configuration
            </span>
            <span className="text-sm font-mono font-bold text-accent-cyan">
              {selectedVariantIds.length} of {availableVariants.length} Active
            </span>
          </div>
        </div>

        {/* Trim Chips */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
            Toggle Trim Packages:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {availableVariants.map((varItem) => {
              const isSelected = selectedVariantIds.includes(varItem.id);
              return (
                <button
                  key={varItem.id}
                  onClick={() => toggleVariant(varItem.id)}
                  className={`p-3 rounded-xl text-left border transition-all duration-200 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-accent-cyan/15 border-accent-cyan/60 text-white shadow-sm'
                      : 'bg-navy-950/80 hover:bg-navy-850 border-navy-800 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-accent-cyan border-accent-cyan text-navy-950'
                        : 'border-navy-700 bg-navy-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{varItem.trim_name}</span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      ${varItem.price?.toLocaleString()}
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
          <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Analyzing trim package differentials...</p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-8">
          {/* Winner Takeaways */}
          {comparisonResult.winner_highlights && (
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800 flex flex-wrap gap-2">
              {comparisonResult.winner_highlights.map((h, i) => (
                <span
                  key={i}
                  className="text-xs font-medium text-slate-200 bg-navy-950 px-3 py-1.5 rounded-lg border border-navy-800"
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
            <h4 className="text-sm font-bold text-white tracking-wide">
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
