import React from 'react';
import { Modal, Badge } from '../ui/Modal';
import { Gauge, Zap, IndianRupee, Shield, Check, Ruler, MessageSquare } from 'lucide-react';

export function VehicleModal({ vehicle, isOpen, onClose, onChat }) {
  if (!vehicle) return null;

  const variants = vehicle.variants || [];

  const formatPriceINR = (val) => {
    if (!val || val === 0) return 'N/A';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Specifications`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Hero image and overview */}
        <div className="relative h-52 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={
              vehicle.hero_image_url ||
              'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80'
            }
            alt={vehicle.model}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex gap-1.5 mb-1.5">
                <Badge variant="blue">{vehicle.category}</Badge>
                <Badge variant="default">{vehicle.body_type}</Badge>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {vehicle.make} {vehicle.model}
              </h2>
            </div>
            <button
              onClick={() => {
                onClose();
                onChat(vehicle.id);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask AI About This Model</span>
            </button>
          </div>
        </div>

        {/* Overview text */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Vehicle Overview
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-md border border-slate-200">
            {vehicle.overview}
          </p>
        </div>

        {/* Trims & Variants Detailed Table */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Engineering Trims & Powertrain Configurations ({variants.length})
            </h4>
            <span className="text-xs font-mono font-medium text-slate-700">
              Price Range: {vehicle.price_range}
            </span>
          </div>

          <div className="space-y-3">
            {variants.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.trim_name}</span>
                    <Badge variant="default">{v.drivetrain}</Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-slate-900 block">
                      {formatPriceINR(v.price)}
                    </span>
                    {v.price && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        (₹{v.price.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Powertrain</span>
                    <span className="font-medium text-slate-800">{v.engine_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Horsepower</span>
                    <span className="font-mono font-bold text-slate-900">{v.horsepower_hp} hp</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Torque</span>
                    <span className="font-mono font-bold text-slate-900">{v.torque_nm} Nm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">Fuel Economy</span>
                    <span className="font-medium text-slate-800">{v.fuel_economy}</span>
                  </div>
                </div>

                {/* Features chips */}
                {v.key_features && v.key_features.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                      Key Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {v.key_features.map((feat, fi) => (
                        <span
                          key={fi}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
