import React from 'react';
import { Zap, Gauge, IndianRupee, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Modal';

export function VehicleCard({ vehicle, onSelect, onChat }) {
  const variants = vehicle.variants || [];
  const maxHp = Math.max(...variants.map((v) => v.horsepower_hp || 0), 0);
  const minPrice = Math.min(...variants.map((v) => v.price || 0), 0);
  const isElectric = vehicle.category?.toLowerCase() === 'electric';

  const formatPriceINR = (val) => {
    if (!val || val === 0) return 'Inquire';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="group rounded-2xl bg-navy-900/80 hover:bg-navy-900 border border-navy-800 hover:border-accent-cyan/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(56,189,248,0.15)] flex flex-col">
      {/* Vehicle Hero Image */}
      <div className="relative h-48 w-full overflow-hidden bg-navy-950">
        <img
          src={
            vehicle.hero_image_url ||
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
          }
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/30 to-transparent" />

        {/* Category & Year Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={isElectric ? 'cyan' : 'emerald'}>{vehicle.category}</Badge>
          <Badge variant="default">{vehicle.year}</Badge>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              {vehicle.make}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {vehicle.model}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-navy-950/80 text-accent-cyan border border-navy-700">
            {vehicle.body_type}
          </span>
        </div>
      </div>

      {/* Card Content & Metrics */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {vehicle.overview}
        </p>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-navy-800/80">
          <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-800 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-accent-cyan shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Up To</span>
              <span className="text-xs font-mono font-bold text-slate-200">{maxHp} hp</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-navy-950/60 border border-navy-800 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pricing</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {formatPriceINR(minPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Trims count badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>{variants.length} Trims Available</span>
          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" /> 5-Star Safety
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => onSelect(vehicle)}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-750 text-slate-200 hover:text-white border border-navy-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Full Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onChat(vehicle.id)}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
