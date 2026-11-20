import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, Check, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { RadarMetricsChart } from './RadarMetricsChart';
import { SpecTable } from './SpecTable';
import { useToast } from '../../context/ToastContext';

export function ComparisonView({ onChatWithVehicle }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await api.getVehicles();
      setVehicles(res.data);
      if (res.data.length >= 2) {
        // Pre-select first 2 for instant side-by-side view
        const initial = [res.data[0].id, res.data[1].id];
        setSelectedIds(initial);
        fetchComparison(initial);
      }
    } catch (err) {
      toast.error('Failed to load vehicles for comparison');
    }
  };

  const fetchComparison = async (ids) => {
    try {
      setLoading(true);
      const res = await api.compareVehicles(ids);
      setComparisonResult(res.data);
    } catch (err) {
      toast.error('Failed to calculate vehicle comparison');
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicle = (id) => {
    let updated;
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        toast.warning('Select at least 2 vehicles for comparison');
        return;
      }
      updated = selectedIds.filter((item) => item !== id);
    } else {
      if (selectedIds.length >= 4) {
        toast.warning('You can compare up to 4 vehicles at once');
        return;
      }
      updated = [...selectedIds, id];
    }
    setSelectedIds(updated);
    fetchComparison(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50">
      {/* Vehicle Selection Strip */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-blue-600" />
            Select 2 to 4 Vehicles to Compare:
          </label>
          <span className="text-xs font-mono font-medium text-blue-600">
            {selectedIds.length} / 4 Selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {vehicles.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleVehicle(v.id)}
                className={`p-3 rounded-lg text-left border transition-all duration-150 flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="truncate">
                  <span className="font-semibold text-xs truncate block text-slate-900">
                    {v.make} {v.model}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{v.category}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Computing comparison matrices...</p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-6">
          {/* Winner Highlights Banner */}
          {comparisonResult.winner_highlights &&
            comparisonResult.winner_highlights.length > 0 && (
              <div className="p-4 sm:p-5 rounded-lg bg-blue-50/70 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Key Takeaways & Engineering Highlights
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {comparisonResult.winner_highlights.map((h, i) => (
                    <div
                      key={i}
                      className="text-xs font-medium text-slate-700 bg-white p-3 rounded-md border border-blue-100/80 shadow-2xs"
                    >
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Recharts Radar Spider Matrix & Bar Chart */}
          <RadarMetricsChart
            data={comparisonResult.radar_data}
            entities={comparisonResult.entities}
          />

          {/* Side-by-side Spec Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
              Detailed Engineering Specification Table
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
