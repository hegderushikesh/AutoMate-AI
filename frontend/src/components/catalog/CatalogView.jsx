import React, { useState, useEffect } from 'react';
import { Search, Filter, Car, Plus, Sparkles, Loader2 } from 'lucide-react';
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
      setVehicles(res.data);
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
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Search and Filter Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-navy-900/80 border border-navy-800 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by make, model, or features (e.g. Porsche, Taycan, Electric)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-navy-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent-cyan/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-accent-cyan text-navy-950 shadow-md font-bold'
                    : 'bg-navy-950 text-slate-400 hover:text-white border border-navy-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body Type Secondary Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
            Body Style:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {bodyTypes.map((bt) => (
              <button
                key={bt}
                onClick={() => setBodyTypeFilter(bt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  bodyTypeFilter === bt
                    ? 'bg-navy-800 text-accent-cyan border border-accent-cyan/40'
                    : 'text-slate-400 hover:text-slate-200'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-2xl bg-navy-900 border border-navy-800 p-4 space-y-4">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-navy-900/40 border border-navy-800 space-y-3">
          <Car className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Vehicles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No models match your current filters. Try resetting the category or search query.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setBodyTypeFilter('All');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-800 text-slate-200 hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
