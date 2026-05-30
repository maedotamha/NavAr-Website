'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrafficDataPoint } from '../lib/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 6px' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontSize: 12, margin: '2px 0', fontWeight: 600 }}>
          {p.name}: <span style={{ color: '#f0f4ff' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function TrafficAreaChart({ data }: { data: TrafficDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="sessions-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="nodes-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
        <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#sessions-grad)" dot={false} />
        <Area type="monotone" dataKey="activeNodes" name="active nodes" stroke="#06b6d4" strokeWidth={1.5} fill="url(#nodes-grad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
