import React from 'react';
import { Modal, Badge } from '../ui/Modal';
import { Gauge, Zap, DollarSign, Shield, Check, Ruler, MessageSquare } from 'lucide-react';

export function VehicleModal({ vehicle, isOpen, onClose, onChat }) {
  if (!vehicle) return null;

  const variants = vehicle.variants || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Hero image and overview */}
        <div className="relative h-60 rounded-xl overflow-hidden bg-navy-950 border border-navy-800">
          <img
            src={
              vehicle.hero_image_url ||
              'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80'
            }
            alt={vehicle.model}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge variant="cyan">{vehicle.category}</Badge>
                <Badge variant="default">{vehicle.body_type}</Badge>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                {vehicle.make} {vehicle.model}
              </h2>
            </div>
            <button
              onClick={() => {
                onClose();
                onChat(vehicle.id);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-accent-cyan text-navy-950 hover:bg-sky-400 transition-colors shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI About This Car
            </button>
          </div>
        </div>

        {/* Overview text */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Vehicle Overview
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-navy-950/60 p-4 rounded-xl border border-navy-800">
            {vehicle.overview}
          </p>
        </div>

        {/* Trims & Variants Detailed Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Engineering Trims & Variants ({variants.length})</span>
            <span className="text-[11px] text-accent-cyan font-mono font-normal">
              Price Range: {vehicle.price_range}
            </span>
          </h4>

          <div className="space-y-4">
            {variants.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-navy-950/80 border border-navy-800 hover:border-navy-700 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{v.trim_name}</span>
                    <Badge variant="default">{v.drivetrain}</Badge>
                  </div>
                  <span className="font-mono text-base font-extrabold text-emerald-400">
                    ${v.price ? v.price.toLocaleString() : 'N/A'}
                  </span>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Engine</span>
                    <span className="font-semibold text-slate-200">{v.engine_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Horsepower</span>
                    <span className="font-mono font-bold text-accent-cyan">{v.horsepower_hp} hp</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Torque</span>
                    <span className="font-mono font-bold text-slate-200">{v.torque_nm} Nm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Fuel Economy</span>
                    <span className="font-semibold text-slate-200">{v.fuel_economy}</span>
                  </div>
                </div>

                {/* Features chips */}
                {v.key_features && v.key_features.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Key Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {v.key_features.map((feat, fi) => (
                        <span
                          key={fi}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-navy-900 border border-navy-800 text-slate-300"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
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
