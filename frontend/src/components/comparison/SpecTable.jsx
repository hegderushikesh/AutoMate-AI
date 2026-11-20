import React from 'react';
import { Check, X } from 'lucide-react';

export function SpecTable({ entities, specs }) {
  if (!entities || entities.length === 0 || !specs || specs.length === 0) return null;

  return (
    <div className="rounded-lg bg-white border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-5 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/4">
                Specification Metric
              </th>
              {entities.map((e) => (
                <th key={e.id} className="py-3 px-5 text-sm font-semibold text-slate-900 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{e.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {specs.map((metric, idx) => (
              <tr
                key={metric.name || idx}
                className="hover:bg-slate-50/70 transition-colors"
              >
                <td className="py-3 px-5 font-medium text-slate-700 bg-slate-50/40">
                  {metric.label}
                </td>
                {entities.map((e) => {
                  const val = metric.values[e.id];
                  return (
                    <td
                      key={e.id}
                      className="py-3 px-5 font-mono text-xs font-medium text-slate-800"
                    >
                      {val === true ? (
                        <Check className="w-4 h-4 text-emerald-600" />
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
