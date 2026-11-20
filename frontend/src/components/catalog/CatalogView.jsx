import React, { useState, useEffect } from 'react';
import { Search, Filter, Car, Plus, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { VehicleCard } from './VehicleCard';
import { VehicleModal } from './VehicleModal';
import { Skeleton } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

export function CatalogView({ onChatWithVehicle }) {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [bodyTypeFilter, setBodyTypeFilter] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicles();
      setVehicles(res.data || []);
    } catch (err) {
      toast.error('Failed to load vehicle catalog');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Electric', 'Gasoline', 'Hybrid'];
  const bodyTypes = ['All', 'Sedan', 'SUV', 'Truck'];

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.overview?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' ||
      v.category?.toLowerCase() === categoryFilter.toLowerCase();

    const matchesBody =
      bodyTypeFilter === 'All' ||
      v.body_type?.toLowerCase() === bodyTypeFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesBody;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-slate-50">
      {/* Search and Filter Controls Bar */}
      <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by make, model, or keywords (e.g. Porsche, Taycan, Electric)..."
              className="w-full pl-9 pr-4 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body Type Secondary Filter Pills */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
            Body Type:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {bodyTypes.map((bt) => (
              <button
                key={bt}
                onClick={() => setBodyTypeFilter(bt)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  bodyTypeFilter === bt
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-lg bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-white border border-slate-200 shadow-xs space-y-2.5">
          <Car className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-900">No Vehicles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No models match your current filters. Try resetting the category or search query.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setBodyTypeFilter('All');
            }}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 inline-block"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onSelect={(v) => setSelectedVehicle(v)}
              onChat={(vId) => onChatWithVehicle(vId)}
            />
          ))}
        </div>
      )}

      {/* Vehicle Details Modal */}
      <VehicleModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onChat={(vId) => onChatWithVehicle(vId)}
      />
    </div>
  );
}
