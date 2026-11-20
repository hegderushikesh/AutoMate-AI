import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, Check, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Vehicle Selection Strip */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-accent-cyan" />
            Select 2 to 4 Vehicles to Compare:
          </label>
          <span className="text-xs font-mono text-accent-cyan">
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
                className={`p-3 rounded-xl text-left border transition-all duration-200 flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-accent-cyan/15 border-accent-cyan/60 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'bg-navy-950/80 hover:bg-navy-850 border-navy-800 text-slate-400'
                }`}
              >
                <div className="truncate">
                  <span className="font-bold text-xs truncate block">{v.make} {v.model}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{v.category}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-accent-cyan border-accent-cyan text-navy-950'
                      : 'border-navy-700 bg-navy-900'
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
          <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Computing comparison matrices...</p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-8">
          {/* Winner Highlights Banner */}
          {comparisonResult.winner_highlights &&
            comparisonResult.winner_highlights.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900 to-sky-950/40 border border-accent-cyan/30 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-cyan">
                  <Sparkles className="w-4 h-4 text-accent-cyan" />
                  Key Takeaways & Engineering Highlights
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {comparisonResult.winner_highlights.map((h, i) => (
                    <div
                      key={i}
                      className="text-xs font-medium text-slate-200 bg-navy-950/60 p-2.5 rounded-xl border border-navy-800"
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
            <h4 className="text-sm font-bold text-white tracking-wide">
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
