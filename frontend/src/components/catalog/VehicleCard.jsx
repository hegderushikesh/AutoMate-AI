import React from 'react';
import { Gauge, IndianRupee, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';
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
    <div className="group rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden shadow-xs flex flex-col">
      {/* Vehicle Hero Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={
            vehicle.hero_image_url ||
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
          }
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Category & Year Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 text-slate-800 shadow-xs border border-slate-200">
            {vehicle.category}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-white shadow-xs">
            {vehicle.year}
          </span>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-200">
              {vehicle.make}
            </span>
            <h3 className="text-base font-bold tracking-tight text-white leading-tight">
              {vehicle.model}
            </h3>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs text-slate-200 border border-white/20">
            {vehicle.body_type}
          </span>
        </div>
      </div>

      {/* Card Content & Metrics */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {vehicle.overview}
        </p>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Performance</span>
              <span className="text-xs font-mono font-bold text-slate-800">{maxHp} hp</span>
            </div>
          </div>

          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Starting At</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {formatPriceINR(minPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Trims count badge */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
          <span>{variants.length} Trim Variants</span>
          <span className="flex items-center gap-1 text-slate-600 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> NCAP 5-Star
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onSelect(vehicle)}
            className="w-full py-1.5 px-3 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>Full Specs</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => onChat(vehicle.id)}
            className="w-full py-1.5 px-3 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
