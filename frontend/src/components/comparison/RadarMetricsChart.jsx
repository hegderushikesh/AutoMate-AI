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

  const colors = ['#38BDF8', '#10B981', '#F59E0B', '#F43F5E'];

  // Bar chart dataset for Horsepower and Torque
  const barData = entities.map((e) => ({
    name: e.name || e.model,
    Horsepower: e.max_hp || e.horsepower_hp || 0,
    Torque: e.max_torque || e.torque_nm || 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Radar Chart */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Automotive Engineering Spider Matrix
          </h4>
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Scale: 0 - 100
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
              <PolarGrid stroke="#1E293B" />
              <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
              {entities.map((e, idx) => (
                <Radar
                  key={e.id}
                  name={e.name}
                  dataKey={e.name}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.25}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart (HP & Torque) */}
      <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Peak Power & Torque Output
          </h4>
          <span className="text-[10px] uppercase font-bold text-accent-cyan">
            hp & Nm
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B132B',
                  borderColor: '#2A3656',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Horsepower" fill="#38BDF8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Torque" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
