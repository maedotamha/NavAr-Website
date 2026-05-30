'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HourlyData } from '../lib/types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 6px' }}>{label}</p>
      <p style={{ color: '#f59e0b', fontSize: 12, margin: 0, fontWeight: 600 }}>
        Congestion: <span style={{ color: '#f0f4ff' }}>{payload[0]?.value}%</span>
      </p>
      <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0' }}>
        Sessions: <span style={{ color: '#f0f4ff' }}>{payload[1]?.value}</span>
      </p>
    </div>
  );
};

export default function PeakBarChart({ data }: { data: HourlyData[] }) {
  const peak = Math.max(...data.map(d => d.congestion));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="congestion" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.congestion === peak
                ? '#ef4444'
                : d.congestion > 60
                  ? '#f59e0b'
                  : d.congestion > 30
                    ? '#3b82f6'
                    : '#1e3a5f'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
        <Bar dataKey="sessions" fill="rgba(99,102,241,0.25)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
