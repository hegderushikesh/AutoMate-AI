import React from 'react';
import { Check, X } from 'lucide-react';

export function SpecTable({ entities, specs }) {
  if (!entities || entities.length === 0 || !specs || specs.length === 0) return null;

  return (
    <div className="rounded-2xl bg-navy-900/80 border border-navy-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-navy-800 bg-navy-950/60">
              <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 w-1/4">
                Specification Metric
              </th>
              {entities.map((e) => (
                <th key={e.id} className="py-4 px-6 text-sm font-bold text-white min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{e.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/60 text-xs">
            {specs.map((metric, idx) => (
              <tr
                key={metric.name || idx}
                className="hover:bg-navy-850/50 transition-colors"
              >
                <td className="py-3.5 px-6 font-semibold text-slate-300">
                  {metric.label}
                </td>
                {entities.map((e) => {
                  const val = metric.values[e.id];
                  return (
                    <td
                      key={e.id}
                      className="py-3.5 px-6 font-mono font-medium text-slate-200"
                    >
                      {val === true ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : val === false ? (
                        <X className="w-4 h-4 text-slate-400" />
                      ) : (
                        val ?? '—'
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
