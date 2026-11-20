import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export function RadarMetricsChart({ data, entities }) {
  if (!data || data.length === 0 || !entities || entities.length === 0) return null;

  const colors = ['#2563EB', '#0F172A', '#0D9488', '#D97706'];

  // Bar chart dataset for Horsepower and Torque
  const barData = entities.map((e) => ({
    name: e.name || e.model,
    Horsepower: e.max_hp || e.horsepower_hp || 0,
    Torque: e.max_torque || e.torque_nm || 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar Chart */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
            Automotive Engineering Spider Matrix
          </h4>
          <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Scale: 0 - 100
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              {entities.map((e, idx) => (
                <Radar
                  key={e.id}
                  name={e.name}
                  dataKey={e.name}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.18}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#475569' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart (HP & Torque) */}
      <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
            Peak Power & Torque Output
          </h4>
          <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            hp & Nm
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#CBD5E1" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
              <YAxis stroke="#CBD5E1" tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#475569' }} />
              <Bar dataKey="Horsepower" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Torque" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
